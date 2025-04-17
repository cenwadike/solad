pub use anchor_lang::prelude::*;
use anchor_lang::system_program;

use crate::{
    errors::SoladError,
    events::UserSlashedEvent,
    states::{Escrow, Node, StorageConfig, Upload, ESCROW_SEED, NODE_SEED, UPLOAD_SEED},
};

// Slashes a user by penalizing their escrow funds for a specific shard of an upload.
// This function is called when a shard is deemed invalid due to sufficient oversized data reports
// from nodes (2/3 of assigned nodes). It calculates a penalty based on the configured percentage,
// transfers the penalty to the treasury, refunds the remaining escrow funds to the payer, and updates
// the shard and node states. The function emits an event for transparency and ensures atomic execution.
/// Slashes user escrow for invalid data size.
/// # Arguments
/// * `ctx` - Context containing upload, node, escrow, payer, config, treasury, and system program accounts.
/// * `data_hash` - The hash of the upload data.
/// * `shard_id` - The ID of the shard to slash.
/// # Errors
/// Returns errors for uninitialized config, invalid hash, invalid shard ID, unauthorized node,
// insufficient reports, or mathematical overflows. The transaction reverts if any validation fails.
pub fn process_slash_user(ctx: Context<SlashUser>, data_hash: String, shard_id: u8) -> Result<()> {
    let config = &ctx.accounts.config;
    require!(config.is_initialized, SoladError::NotInitialized);

    // Collect all immutable data from upload upfront
    let upload = &ctx.accounts.upload;
    require!(upload.data_hash == data_hash, SoladError::InvalidHash);
    require!(shard_id < upload.shard_count, SoladError::InvalidShardId);

    // Store data needed for escrow_seeds
    let data_hash_bytes = upload.data_hash.as_bytes();
    let payer_ref = upload.payer.as_ref();
    let node_lamports = upload.node_lamports;
    let size_mb = upload.size_mb;
    let payer = upload.payer;

    // Collect event data (payer) upfront
    let event_payer = payer;

    // Now create mutable borrow
    let upload = &mut ctx.accounts.upload.clone();
    let shard = &mut upload.shards[shard_id as usize];
    require!(
        shard.node_keys.contains(&ctx.accounts.node.key()),
        SoladError::Unauthorized
    );
    require!(shard.verified_count == u8::MAX, SoladError::ShardNotInvalid);

    let node_count = shard
        .node_keys
        .iter()
        .filter(|&&k| k != Pubkey::default())
        .count();
    let required_reports = (node_count as u64 * 2) / 3;
    require!(
        shard.oversized_reports.len() as u64 >= required_reports,
        SoladError::InsufficientReports
    );

    let shard_lamports = node_lamports
        .checked_mul(shard.size_mb)
        .ok_or(SoladError::MathOverflow)?
        .checked_div(size_mb)
        .ok_or(SoladError::MathOverflow)?;
    let slash_amount = shard_lamports
        .checked_mul(config.user_slash_penalty_percent)
        .ok_or(SoladError::MathOverflow)?
        / 100;
    let refund_amount = shard_lamports
        .checked_sub(slash_amount)
        .ok_or(SoladError::MathOverflow)?;

    let escrow_seeds = &[
        ESCROW_SEED,
        data_hash_bytes,
        payer_ref,
        &[ctx.accounts.escrow.bump],
    ];

    // Transfer slash amount to treasury
    if slash_amount > 0 {
        system_program::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.escrow.to_account_info(),
                    to: ctx.accounts.treasury.to_account_info(),
                },
                &[&escrow_seeds[..]],
            ),
            slash_amount,
        )?;
    }

    // Refund remaining amount to payer
    if refund_amount > 0 {
        system_program::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.escrow.to_account_info(),
                    to: ctx.accounts.payer.to_account_info(),
                },
                &[&escrow_seeds[..]],
            ),
            refund_amount,
        )?;
    }

    // Collect event data for shard before modifying it
    let actual_size_mb = shard
        .oversized_reports
        .first()
        .map(|r| r.actual_size_mb)
        .unwrap_or(0);

    // Mark shard as slashed and update nodes
    shard.verified_count = u8::MAX;
    for key in shard.node_keys.iter_mut() {
        if *key != Pubkey::default() {
            let node_account = ctx
                .remaining_accounts
                .iter()
                .find(|acc| acc.key() == *key)
                .ok_or(SoladError::InvalidNodeAccount)?;
            let mut node_data = node_account.data.borrow_mut();
            let mut node: Node = Node::try_deserialize(&mut node_data.as_ref())
                .map_err(|_| SoladError::InvalidNodeAccount)?;
            node.upload_count = node
                .upload_count
                .checked_sub(1)
                .ok_or(SoladError::MathOverflow)?;
            let mut serialized = Vec::new();
            node.try_serialize(&mut serialized)?;
            node_data.copy_from_slice(&serialized);
        }
    }

    // Emit the event after all modifications
    emit!(UserSlashedEvent {
        payer: event_payer,
        data_hash,
        shard_id,
        slash_amount,
        refund_amount,
        actual_size_mb,
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction(data_hash: String, shard_id: u8)]
pub struct SlashUser<'info> {
    #[account(
        mut,
        seeds = [UPLOAD_SEED, data_hash.as_bytes(), upload.payer.as_ref()],
        bump
    )]
    pub upload: Account<'info, Upload>,
    #[account(
        mut,
        seeds = [NODE_SEED, node.key().as_ref()],
        bump
    )]
    pub node: Account<'info, Node>,
    #[account(
        mut,
        seeds = [ESCROW_SEED, data_hash.as_bytes(), upload.payer.as_ref()],
        bump
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(mut)]
    pub payer: AccountInfo<'info>,
    #[account(mut)]
    pub config: Account<'info, StorageConfig>,
    #[account(mut, address = config.treasury)]
    pub treasury: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}