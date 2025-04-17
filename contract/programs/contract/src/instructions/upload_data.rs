pub use anchor_lang::prelude::*;
use anchor_lang::system_program;
use sha2::{Digest, Sha256};

use crate::{
    errors::SoladError,
    events::UploadEvent,
    states::{
        Escrow, Node, Replacement, ShardInfo, StorageConfig, Upload, ESCROW_SEED, UPLOAD_SEED,
    },
    utils::hash_to_shard,
};

// Uploads data to the Solad network with sharding.
// This function assigns data shards to nodes based on stake-weighted random
// selection, ensuring redundancy and availability. It handles payments to the
// treasury and node escrow, adjusts shard counts if needed, and updates node
// upload counts. The function emits an event to log the upload details.
/// Uploads data with sharding.
/// # Arguments
/// * `ctx` - Context containing upload, config, payer, treasury, and escrow accounts.
/// * `data_hash` - Hash of the uploaded data.
/// * `size_mb` - Size of the data in megabytes.
/// * `shard_count` - Desired number of shards.
/// # Errors
/// Returns errors for invalid sizes, insufficient nodes, or invalid hashes.
pub fn process_upload_data(
    ctx: Context<UploadData>,
    data_hash: String,
    size_mb: u64,
    shard_count: u8,
) -> Result<()> {
    let config = &ctx.accounts.config;
    require!(config.is_initialized, SoladError::NotInitialized);
    require!(size_mb >= 1, SoladError::InvalidSize);
    require!(
        shard_count >= config.min_shard_count && shard_count <= config.max_shard_count,
        SoladError::InvalidShardCount
    );
    require!(
        data_hash.len() <= 64 && !data_hash.is_empty(),
        SoladError::InvalidHash
    );

    let upload = &mut ctx.accounts.upload;
    let available_nodes = &ctx.remaining_accounts[..ctx.remaining_accounts.len() / 2];
    let replacement_accounts = &ctx.remaining_accounts[ctx.remaining_accounts.len() / 2..];

    let node_count = available_nodes.len() as u64;
    let max_possible_shards = node_count.min(config.max_shard_count as u64) as u8;
    require!(
        shard_count <= max_possible_shards,
        SoladError::InsufficientNodes
    );

    let total_lamports = size_mb
        .checked_mul(config.sol_per_gb / 1000)
        .ok_or(SoladError::MathOverflow)?;
    let treasury_lamports = total_lamports
        .checked_mul(config.treasury_fee_percent)
        .ok_or(SoladError::MathOverflow)?
        / 100;
    let node_lamports = total_lamports
        .checked_mul(config.node_fee_percent)
        .ok_or(SoladError::MathOverflow)?
        / 100;

    require!(
        ctx.accounts.payer.lamports() >= total_lamports,
        SoladError::InsufficientFunds
    );

    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.payer.to_account_info(),
                to: ctx.accounts.treasury.to_account_info(),
            },
        ),
        treasury_lamports,
    )?;

    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.payer.to_account_info(),
                to: ctx.accounts.escrow.to_account_info(),
            },
        ),
        node_lamports,
    )?;

    let mut adjusted_shard_count = shard_count;
    let mut shard_sizes_mb = vec![0u64; shard_count as usize];
    let base_shard_size = size_mb / (shard_count as u64);
    let remainder_mb = size_mb % (shard_count as u64);

    for i in 0..shard_count as usize {
        shard_sizes_mb[i] = base_shard_size + if i < remainder_mb as usize { 1 } else { 0 };
    }

    if size_mb >= config.shard_min_mb {
        let mut all_valid = true;
        for &size in shard_sizes_mb.iter() {
            if size > 0 && size < config.shard_min_mb {
                all_valid = false;
                break;
            }
        }
        if !all_valid {
            adjusted_shard_count = ((size_mb + config.shard_min_mb - 1) / config.shard_min_mb)
                .max(config.min_shard_count as u64)
                .min(max_possible_shards as u64) as u8;
            shard_sizes_mb = vec![0u64; adjusted_shard_count as usize];
            let new_base_size = size_mb / (adjusted_shard_count as u64);
            let new_remainder = size_mb % (adjusted_shard_count as u64);
            for j in 0..adjusted_shard_count as usize {
                shard_sizes_mb[j] = new_base_size + if j < new_remainder as usize { 1 } else { 0 };
            }
        }
    }

    require!(
        adjusted_shard_count >= config.min_shard_count
            && adjusted_shard_count <= max_possible_shards,
        SoladError::InvalidShardCount
    );

    upload.data_hash = data_hash.clone();
    upload.size_mb = size_mb;
    upload.shard_count = adjusted_shard_count;
    upload.node_lamports = node_lamports;
    upload.payer = ctx.accounts.payer.key();
    upload.upload_time = Clock::get()?.unix_timestamp;
    upload.current_slot = Clock::get()?.slot;

    let mut node_stakes = Vec::with_capacity(available_nodes.len());
    let mut total_stake = 0u64;
    for (i, node_account) in available_nodes.iter().enumerate() {
        let node_data = node_account.data.borrow();
        let node: &Node = &Node::try_deserialize(&mut node_data.as_ref())
            .map_err(|_| SoladError::InvalidNodeAccount)?;
        require!(
            node.stake_amount >= config.min_node_stake,
            SoladError::InsufficientStake
        );

        // Check if node is exiting
        let replacement_account = &replacement_accounts[i];
        let replacement_data = replacement_account.data.borrow();
        let is_exiting = if replacement_data.len() >= 8 {
            let replacement: &Replacement =
                &Replacement::try_deserialize(&mut replacement_data.as_ref())
                    .map_err(|_| SoladError::InvalidReplacementAccount)?;
            replacement.exiting_node == node_account.key() && !replacement.pos_submitted
        } else {
            false
        };

        if !is_exiting {
            node_stakes.push((node_account.key(), node.stake_amount));
            total_stake = total_stake
                .checked_add(node.stake_amount)
                .ok_or(SoladError::MathOverflow)?;
        }
    }

    require!(!node_stakes.is_empty(), SoladError::InsufficientNodes);

    let mut assigned_nodes: Vec<Vec<Pubkey>> = vec![vec![]; adjusted_shard_count as usize];

    for i in 0..adjusted_shard_count as usize {
        let mut nodes_for_shard = vec![];
        let mut remaining_nodes = node_stakes.clone();
        let seed = format!("{}:{}:{}", data_hash, i, upload.current_slot);
        let mut rng_state =
            u64::from_le_bytes(Sha256::digest(seed.as_bytes())[..8].try_into().unwrap());

        let nodes_needed = (node_stakes.len() as usize).min(3);
        for _ in 0..nodes_needed {
            if remaining_nodes.is_empty() {
                break;
            }
            let total_remaining_stake: u64 = remaining_nodes.iter().map(|(_, stake)| stake).sum();
            if total_remaining_stake == 0 {
                break;
            }

            rng_state ^= rng_state << 13;
            rng_state ^= rng_state >> 7;
            rng_state ^= rng_state << 17;
            let target = rng_state % total_remaining_stake;
            let mut cumulative = 0u64;
            let mut selected_index = 0;

            for (j, (_, stake)) in remaining_nodes.iter().enumerate() {
                cumulative = cumulative
                    .checked_add(*stake)
                    .ok_or(SoladError::MathOverflow)?;
                if target < cumulative {
                    selected_index = j;
                    break;
                }
            }

            let (selected_pubkey, _) = remaining_nodes.remove(selected_index);
            nodes_for_shard.push(selected_pubkey);
        }

        require!(nodes_for_shard.len() >= 1, SoladError::InsufficientNodes);
        assigned_nodes[i] = nodes_for_shard;
    }

    for i in 0..adjusted_shard_count {
        let shard_id = hash_to_shard(&data_hash, i);
        let mut node_array = [Pubkey::default(); 3];
        let nodes = &assigned_nodes[i as usize];
        for (j, &key) in nodes.iter().enumerate().take(3) {
            node_array[j] = key;
            let node_account = available_nodes
                .iter()
                .find(|acc| acc.key() == key)
                .ok_or(SoladError::InvalidNodeAccount)?;
            let mut node_data = node_account.data.borrow_mut();
            let mut node: Node = Node::try_deserialize(&mut node_data.as_ref())
                .map_err(|_| SoladError::InvalidNodeAccount)?;
            node.upload_count = node
                .upload_count
                .checked_add(1)
                .ok_or(SoladError::MathOverflow)?;
            let mut serialized = Vec::new();
            node.try_serialize(&mut serialized)?;
            node_data.copy_from_slice(&serialized);
        }
        upload.shards[i as usize] = ShardInfo {
            shard_id,
            node_keys: node_array,
            verified_count: 0,
            size_mb: shard_sizes_mb[i as usize],
            challenger: Pubkey::default(),
            oversized_reports: vec![],
        };
    }

    emit!(UploadEvent {
        data_hash,
        size_mb,
        shard_count: adjusted_shard_count,
        payer: ctx.accounts.payer.key(),
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction(data_hash: String, size_mb: u64, shard_count: u8)]
pub struct UploadData<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + 64 + 8 + 1 + 8 + 32 + 8 + 8 + (40 * shard_count as usize),
        seeds = [UPLOAD_SEED, data_hash.as_bytes(), payer.key().as_ref()],
        bump
    )]
    pub upload: Account<'info, Upload>,
    #[account(mut)]
    pub config: Account<'info, StorageConfig>,
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: safe
    #[account(mut, address = config.treasury)]
    pub treasury: AccountInfo<'info>,
    #[account(
        init,
        payer = payer,
        space = 8 + 1,
        seeds = [ESCROW_SEED, data_hash.as_bytes(), payer.key().as_ref()],
        bump
    )]
    pub escrow: Account<'info, Escrow>,
    pub system_program: Program<'info, System>,
}
