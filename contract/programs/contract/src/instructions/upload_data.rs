use crate::states::{UserUploadKeys, ESCROW_SEED, UPLOAD_SEED, USER_UPLOAD_KEYS_SEED};
use crate::{
    errors::SoladError,
    events::UploadEvent,
    states::{Escrow, Node, NodeRegistry, ShardInfo, StorageConfig, Upload},
};
use anchor_lang::prelude::*;
use anchor_lang::system_program;
use sha2::{Digest, Sha256};
use std::mem::size_of;

// Processes data upload to the Solad storage system.
// Initializes an upload, validates inputs, assigns shards to nodes,
// handles payments, and emits an event.
/// Processes data upload.
/// # Arguments
/// * `ctx` - Context with accounts for upload processing.
/// * `data_hash` - Hash of the uploaded data (max 64 chars).
/// * `size_bytes` - Data size in bytes (min 1 KB).
/// * `shard_count` - Number of shards to split data into.
/// * `storage_duration_days` - Duration to store data in days.
/// # Errors
/// Returns errors for invalid inputs, insufficient nodes, or payment issues.
pub fn process_upload_data<'info>(
    ctx: Context<'_, '_, 'info, 'info, UploadData<'info>>,
    data_hash: String,
    size_bytes: u64,
    shard_count: u8,
    storage_duration_days: u64,
) -> Result<()> {
    let config = &ctx.accounts.config;
    require!(config.is_initialized, SoladError::NotInitialized);

    // Validate inputs
    require!(size_bytes >= 1024, SoladError::InvalidSize);
    require!(
        shard_count >= config.min_shard_count && shard_count <= config.max_shard_count,
        SoladError::InvalidShardCount
    );
    require!(
        data_hash.len() <= 64 && !data_hash.is_empty(),
        SoladError::InvalidHash
    );
    require!(
        storage_duration_days >= 1 && storage_duration_days <= 365 * 2000,
        SoladError::InvalidStorageDuration
    );

    let upload = &mut ctx.accounts.upload;
    let node_registry = &ctx.accounts.node_registry;

    // Initialize or update UserUploadKeys
    let user_upload_keys = &mut ctx.accounts.user_upload_keys;
    if user_upload_keys.uploads.is_empty() {
        user_upload_keys.user = ctx.accounts.payer.key();
        user_upload_keys.uploads = vec![upload.key()];
    } else {
        require!(
            user_upload_keys.uploads.len() < config.max_user_uploads as usize,
            SoladError::TooManyUploads
        );
        user_upload_keys.uploads.push(upload.key());
    }

    // Collect and validate nodes
    let mut node_stakes = Vec::new();
    let mut processed_keys = Vec::new();

    for node_info in ctx.remaining_accounts.iter() {
        let node_key = node_info.key();
        require!(
            node_registry.nodes.contains(&node_key),
            SoladError::InvalidNodeAccount
        );
        require!(
            !processed_keys.contains(&node_key),
            SoladError::DuplicateNodeAccount
        );
        require!(node_info.is_writable, SoladError::AccountNotWritable);
        processed_keys.push(node_key);
        let node_account: Account<Node> = Account::try_from(node_info)?;
        if node_account.is_active && node_account.stake_amount >= config.min_node_stake {
            node_stakes.push((node_key, node_account.stake_amount));
        }
    }

    require!(!node_stakes.is_empty(), SoladError::InsufficientNodes);

    let node_count = node_stakes.len() as u64;
    let max_possible_shards = node_count.min(config.max_shard_count as u64) as u8;
    require!(
        shard_count <= max_possible_shards,
        SoladError::InvalidShardCount
    );

    // Calculate lamports
    let base_lamports = size_bytes
        .checked_mul(config.sol_per_gb)
        .ok_or(SoladError::MathOverflow)?
        .checked_div(1024 * 1024 * 1024)
        .ok_or(SoladError::MathOverflow)?
        .checked_mul(shard_count as u64)
        .ok_or(SoladError::MathOverflow)?
        .checked_mul(storage_duration_days)
        .ok_or(SoladError::MathOverflow)?
        .checked_div(7300)
        .ok_or(SoladError::MathOverflow)?;
    let total_lamports = base_lamports;
    let treasury_lamports = total_lamports
        .checked_mul(config.treasury_fee_percent)
        .ok_or(SoladError::MathOverflow)?
        / 100;
    let node_lamports = total_lamports
        .checked_mul(config.node_fee_percent)
        .ok_or(SoladError::MathOverflow)?
        / 100;

    // Transfer lamports
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

    let escrow = &mut ctx.accounts.escrow;
    escrow.lamports = node_lamports;
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

    // Calculate shard sizes
    let size_mb = size_bytes
        .checked_add(1024 * 1024 - 1)
        .ok_or(SoladError::MathOverflow)?
        / (1024 * 1024);
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
                .min(max_possible_shards as u64)
                .min(shard_count as u64) as u8;
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

    // Initialize upload account
    upload.data_hash = data_hash.clone();
    upload.size_bytes = size_bytes;
    upload.shard_count = adjusted_shard_count;
    upload.node_lamports = node_lamports;
    upload.payer = ctx.accounts.payer.key();
    upload.upload_time = Clock::get()?.unix_timestamp;
    upload.storage_duration_days = storage_duration_days;
    upload.expiry_time = upload
        .upload_time
        .checked_add((storage_duration_days as i64) * 86400)
        .ok_or(SoladError::MathOverflow)?;
    upload.current_slot = Clock::get()?.slot;
    upload.shards = Vec::new();

    // Assign nodes to shards
    let mut assigned_nodes: Vec<Vec<Pubkey>> = vec![vec![]; adjusted_shard_count as usize];
    let mut updated_nodes: Vec<Pubkey> = Vec::new();

    for i in 0..adjusted_shard_count as usize {
        let mut nodes_for_shard = vec![];
        let mut remaining_nodes = node_stakes.clone();

        let seed = format!(
            "{}:{}:{}:{}",
            data_hash,
            i,
            upload.current_slot,
            Clock::get()?.unix_timestamp,
        );
        let mut rng_state =
            u64::from_le_bytes(Sha256::digest(seed.as_bytes())[..8].try_into().unwrap());

        let nodes_needed = (remaining_nodes.len() as usize).min(3);
        for _ in 0..nodes_needed {
            if remaining_nodes.is_empty() {
                break;
            }
            let total_remaining_stake: u64 = remaining_nodes.iter().map(|(_, stake)| stake).sum();
            if total_remaining_stake == 0 {
                let (selected_pubkey, _) = remaining_nodes.remove(0);
                nodes_for_shard.push(selected_pubkey);
                if !updated_nodes.contains(&selected_pubkey) {
                    updated_nodes.push(selected_pubkey);
                }
                continue;
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
            if !updated_nodes.contains(&selected_pubkey) {
                updated_nodes.push(selected_pubkey);
            }
        }

        require!(nodes_for_shard.len() >= 1, SoladError::InsufficientNodes);
        assigned_nodes[i] = nodes_for_shard;
    }

    // Update node upload counts
    for node_key in updated_nodes.clone() {
        let node_info = ctx
            .remaining_accounts
            .iter()
            .find(|acc| acc.key() == node_key)
            .ok_or(SoladError::InvalidNodeAccount)?;
        let mut node_account: Account<Node> = Account::try_from(node_info)?;
        node_account.upload_count = node_account
            .upload_count
            .checked_add(1)
            .ok_or(SoladError::MathOverflow)?;

        let mut node_data = node_info.try_borrow_mut_data()?;
        node_account
            .serialize(&mut &mut node_data[..])
            .map_err(|_| SoladError::SerializationError)?;
    }

    // Assign shards
    require!(
        shard_sizes_mb.len() == adjusted_shard_count as usize,
        SoladError::InvalidShardSizes
    );
    require!(
        assigned_nodes.len() == adjusted_shard_count as usize,
        SoladError::InvalidNodeAssignments
    );

    for i in 0..adjusted_shard_count as usize {
        let shard_id = i as u8;
        let mut node_array = [Pubkey::default(); 3];
        let nodes = &assigned_nodes[i];
        for (j, &key) in nodes.iter().enumerate().take(3) {
            node_array[j] = key;
        }
        upload.shards.push(ShardInfo {
            shard_id,
            node_keys: node_array,
            verified_count: 0,
            size_mb: shard_sizes_mb[i],
            challenger: Pubkey::default(),
            oversized_reports: vec![],
            rewarded_nodes: vec![],
        });
    }

    // Emit event
    emit!(UploadEvent {
        upload_pda: upload.key(),
        data_hash,
        size_bytes,
        shard_count: adjusted_shard_count,
        payer: ctx.accounts.payer.key(),
        nodes: updated_nodes,
        storage_duration_days,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction(data_hash: String, size_bytes: u64, shard_count: u8, storage_duration_days: u64)]
pub struct UploadData<'info> {
    #[account(
        init_if_needed,
        payer = payer,
        space=size_of::<UserUploadKeys>() + 8 + (config.max_user_uploads as usize * 32),
        seeds = [USER_UPLOAD_KEYS_SEED, payer.key().as_ref()],
        bump
    )]
    pub user_upload_keys: Box<Account<'info, UserUploadKeys>>,
    #[account(
        init,
        payer = payer,
        space = 8 + 64 + 8 + 1 + 8 + 32 + 8 + 8 + 8 + 8 + (146 * shard_count as usize),
        seeds = [UPLOAD_SEED, data_hash.as_bytes(), payer.key().as_ref()],
        bump
    )]
    pub upload: Account<'info, Upload>,
    #[account(mut)]
    config: Account<'info, StorageConfig>,
    #[account(mut, seeds = [b"node_registry"], bump)]
    pub node_registry: Account<'info, NodeRegistry>,
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: Safe
    #[account(mut, address = config.treasury)]
    pub treasury: AccountInfo<'info>,
    #[account(
        init,
        payer = payer,
        space = 8 + 8 + 1,
        seeds = [ESCROW_SEED, data_hash.as_bytes(), payer.key().as_ref()],
        bump
    )]
    pub escrow: Account<'info, Escrow>,
    /// CHECK: Safe
    #[account(address = crate::ID)]
    pub program: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}
