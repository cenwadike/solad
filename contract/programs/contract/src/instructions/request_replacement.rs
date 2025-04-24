use anchor_lang::prelude::*;
use anchor_lang::system_program;
use sha2::{Digest, Sha256};

use crate::{
    errors::SoladError,
    events::{NodeExitedEvent, ReplacementRequestedEvent},
    states::{
        Escrow, Node, NodeRegistry, Replacement, StorageConfig, Upload, NODE_SEED,
        REPLACEMENT_SEED, STAKE_ESCROW_SEED, UPLOAD_SEED,
    },
};

pub fn process_request_replacement(
    ctx: Context<RequestReplacement>,
    data_hash: String,
    shard_id: u8,
    uploader: Pubkey,
) -> Result<()> {
    let node = &mut ctx.accounts.node;
    msg!("Node account key: {}", node.key());
    msg!("Node account owner: {}", node.owner);
    msg!("Node account is_active: {}", node.is_active);
    msg!("Node account upload_count: {}", node.upload_count);

    let config = &ctx.accounts.config;
    require!(config.is_initialized, SoladError::NotInitialized);
    require!(
        ctx.accounts.treasury.key() == ctx.accounts.config.treasury,
        SoladError::InvalidTreasury
    );

    let node = &mut ctx.accounts.node;
    require!(
        node.owner == ctx.accounts.owner.key(),
        SoladError::Unauthorized
    );

    let upload = &ctx.accounts.upload;
    require!(upload.data_hash == data_hash, SoladError::InvalidHash);
    require!(shard_id < upload.shard_count, SoladError::InvalidShardId);
    require!(upload.payer == uploader, SoladError::InvalidUploader);

    let is_last_shard = upload.shard_count == 1
        && upload.shards[shard_id as usize]
            .node_keys
            .iter()
            .filter(|&&k| k != Pubkey::default())
            .count()
            == 1;

    let node_count = upload.shards[shard_id as usize]
        .node_keys
        .iter()
        .filter(|&&k| k != Pubkey::default())
        .count();

    let upload = &mut ctx.accounts.upload;
    let shard = &mut upload.shards[shard_id as usize];
    require!(
        shard.node_keys.contains(&node.key()),
        SoladError::Unauthorized
    );

    node.is_active = false;
    node.upload_count = node
        .upload_count
        .checked_sub(1)
        .ok_or(SoladError::MathOverflow)?;

    if node_count == 1 || is_last_shard {
        for key in shard.node_keys.iter_mut() {
            if *key == node.key() {
                *key = Pubkey::default();
                break;
            }
        }

        let stake_escrow_seeds = &[
            STAKE_ESCROW_SEED,
            node.owner.as_ref(),
            &[ctx.accounts.stake_escrow.bump],
        ];
        system_program::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.stake_escrow.to_account_info(),
                    to: ctx.accounts.owner.to_account_info(),
                },
                &[&stake_escrow_seeds[..]],
            ),
            node.stake_amount,
        )?;

        emit!(NodeExitedEvent {
            node: node.key(),
            data_hash,
            shard_id,
        });

        Ok(())
    } else {
        let replacement = ctx.accounts.replacement.as_mut().ok_or(SoladError::InvalidNodeAccount)?;
        let node_registry = ctx.accounts.node_registry.clone();
        let mut node_stakes = Vec::new();
        let mut total_stake = 0u64;
        for (i, node_key) in node_registry.nodes.iter().enumerate() {
            let node_account = &ctx.remaining_accounts[i];
            require!(
                node_account.key() == *node_key,
                SoladError::InvalidNodeAccount
            );
            let node_data = node_account.data.borrow();
            let candidate: &Node = &Node::try_deserialize(&mut node_data.as_ref())
                .map_err(|_| SoladError::InvalidNodeAccount)?;
            if candidate.is_active
                && node_key != &node.key()
                && !shard.node_keys.contains(node_key)
                && candidate.stake_amount >= config.min_node_stake
            {
                node_stakes.push((node_key, candidate.stake_amount));
                total_stake = total_stake
                    .checked_add(candidate.stake_amount)
                    .ok_or(SoladError::MathOverflow)?;
            }
        }

        require!(!node_stakes.is_empty(), SoladError::NoReplacementAvailable);

        let current_slot = Clock::get()?.slot;
        let seed = format!("{}:{}:{}", data_hash, shard_id, current_slot);
        let mut rng_state =
            u64::from_le_bytes(Sha256::digest(seed.as_bytes())[..8].try_into().unwrap());
        rng_state ^= rng_state << 13;
        rng_state ^= rng_state >> 7;
        rng_state ^= rng_state << 17;
        let target = rng_state % total_stake;
        let mut cumulative = 0u64;
        let mut replacement_key = *node_stakes[0].0;

        for (key, stake) in node_stakes.iter() {
            cumulative = cumulative
                .checked_add(*stake)
                .ok_or(SoladError::MathOverflow)?;
            if target < cumulative {
                replacement_key = **key;
                break;
            }
        }

        replacement.exiting_node = node.key();
        replacement.replacement_node = replacement_key;
        replacement.data_hash = data_hash.clone();
        replacement.shard_id = shard_id;
        replacement.pos_submitted = false;
        replacement.request_epoch = current_slot / config.slots_per_epoch;

        for key in shard.node_keys.iter_mut() {
            if *key == node.key() {
                *key = replacement_key;
                break;
            }
        }

        emit!(ReplacementRequestedEvent {
            data_hash,
            shard_id,
            exiting_node: node.key(),
            replacement_node: replacement_key,
            storage_fee: upload.node_lamports,
        });

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(data_hash: String, shard_id: u8, uploader: Pubkey)]
pub struct RequestReplacement<'info> {
    #[account(
        mut,
        seeds = [NODE_SEED, owner.key().as_ref()],
        bump
    )]
    pub node: Account<'info, Node>,
    #[account(
        mut,
        seeds = [UPLOAD_SEED, data_hash.as_bytes(), uploader.as_ref()],
        bump
    )]
    pub upload: Account<'info, Upload>,
    #[account(
        init_if_needed,
        payer = owner,
        space = 8 + 32 + 32 + 64 + 1 + 8,
        seeds = [REPLACEMENT_SEED, node.key().as_ref(), data_hash.as_bytes(), &[shard_id]],
        bump,
    )]
    pub replacement: Option<Account<'info, Replacement>>,
    #[account(
        mut,
        seeds = [STAKE_ESCROW_SEED, owner.key().as_ref()],
        bump
    )]
    pub stake_escrow: Account<'info, Escrow>,
    #[account(
        mut,
        seeds = [b"node_registry"],
        bump,
    )]
    pub node_registry: Account<'info, NodeRegistry>,
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(mut)]
    pub config: Account<'info, StorageConfig>,
    /// CHECK: Safe
    #[account(mut)]
    pub treasury: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}