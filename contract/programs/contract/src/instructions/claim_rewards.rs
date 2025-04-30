use crate::{errors::SoladError, events::RewardEvent, states::*};
pub use anchor_lang::prelude::*;
use anchor_lang::system_program;

// Allows nodes to claim their storage rewards after submitting Proof of Storage (PoS).
// Nodes must submit PoS before claiming any rewards, including an initial 25% reward,
// to prevent abuse. The remaining 75% is distributed as an endowment per epoch after
// continued PoS submissions. Rewards are calculated based on shard size and node count.
// Nodes can claim once per epoch, and uploads are finalized after the total epochs are reached.
/// Claims rewards.
/// # Arguments
/// * `ctx` - Context containing upload, node, escrow, and config accounts.
/// * `data_hash` - Hash of the data.
/// * `shard_id` - ID of the shard.
/// # Errors
/// Returns errors for invalid claims, unauthorized nodes, missing PoS submissions, invalid shards,
// or insufficient rewards.
pub fn process_claim_rewards(
    ctx: Context<ClaimRewards>,
    data_hash: String,
    shard_id: u8,
) -> Result<()> {
    let upload = &ctx.accounts.upload;
    let node = &mut ctx.accounts.node;
    let escrow = &ctx.accounts.escrow;
    let config = &ctx.accounts.config;
    require!(config.is_initialized, SoladError::NotInitialized);

    require!(upload.data_hash == data_hash, SoladError::InvalidHash);
    require!(shard_id < upload.shard_count, SoladError::InvalidShardId);

    let shard = &upload.shards[shard_id as usize];
    require!(
        shard.node_keys.contains(&node.key()),
        SoladError::Unauthorized
    );
    require!(shard.verified_count != u8::MAX, SoladError::InvalidShard);
    require!(shard.verified_count > 0, SoladError::NoPoSSubmitted);

    let current_epoch = Clock::get()?.slot / config.slots_per_epoch;
    require!(
        node.last_claimed_epoch < current_epoch,
        SoladError::AlreadyClaimed
    );

    let size_bytes = upload.size_bytes;
    let size_mb = (size_bytes + (1024 * 1024 - 1)) / (1024 * 1024); // Ceiling to MB
    let shard_lamports = upload
        .node_lamports
        .checked_mul(shard.size_mb)
        .ok_or(SoladError::MathOverflow)?
        .checked_div(size_mb)
        .ok_or(SoladError::MathOverflow)?;
    let node_count = shard
        .node_keys
        .iter()
        .filter(|&&k| k != Pubkey::default())
        .count();
    let node_lamports = shard_lamports
        .checked_div(node_count as u64)
        .ok_or(SoladError::MathOverflow)?;

    let reward = if node.last_claimed_epoch == 0 {
        // Initial 25% reward, requires PoS
        node_lamports
            .checked_mul(25)
            .ok_or(SoladError::MathOverflow)?
            / 100
    } else {
        // Epoch-based endowment (75% over epochs_total)
        let endowment_lamports = node_lamports
            .checked_mul(75)
            .ok_or(SoladError::MathOverflow)?
            / 100;
        let epoch_lamports = endowment_lamports
            .checked_div(config.epochs_total)
            .ok_or(SoladError::MathOverflow)?;
        if node_count == 1 || upload.shard_count == 1 {
            epoch_lamports
        } else {
            epoch_lamports // PoS ensures verified_count > 0
        }
    };

    require!(reward >= 1000, SoladError::InsufficientReward);

    let seeds = &[
        ESCROW_SEED,
        upload.data_hash.as_bytes(),
        upload.payer.as_ref(),
        &[ctx.accounts.escrow.bump],
    ];
    system_program::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: escrow.to_account_info(),
                to: node.to_account_info(),
            },
            &[&seeds[..]],
        ),
        reward,
    )?;

    if current_epoch >= config.epochs_total {
        node.upload_count = node
            .upload_count
            .checked_sub(1)
            .ok_or(SoladError::MathOverflow)?;
    }

    node.last_claimed_epoch = current_epoch;

    emit!(RewardEvent {
        data_hash,
        shard_id,
        node: node.key(),
        amount: reward,
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction(data_hash: String, shard_id: u8)]
pub struct ClaimRewards<'info> {
    #[account(
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
    pub config: Account<'info, StorageConfig>,
    /// CHECK: safe
    #[account(mut, address = config.treasury)]
    pub treasury: AccountInfo<'info>,
    #[account(
        mut,
        seeds = [STAKE_ESCROW_SEED, node.owner.as_ref()],
        bump
    )]
    pub stake_escrow: Account<'info, Escrow>,
    pub system_program: Program<'info, System>,
}
