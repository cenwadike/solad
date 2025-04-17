use crate::{errors::SoladError, events::RewardEvent, states::*};
pub use anchor_lang::prelude::*;
use anchor_lang::system_program;

// Allows nodes to claim their storage rewards.
// This function calculates rewards based on shard size, node count, and
// verification status. It applies penalties for unverified shards and transfers
// rewards from the escrow. Nodes can claim once per epoch, and uploads are
// finalized after the total epochs are reached.
/// Claims rewards.
/// # Arguments
/// * `ctx` - Context containing upload, node, escrow, and config accounts.
/// * `data_hash` - Hash of the data.
/// * `shard_id` - ID of the shard.
/// # Errors
/// Returns errors for invalid claims, unauthorized nodes, or insufficient rewards.
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

    let current_epoch = Clock::get()?.slot / config.slots_per_epoch;
    require!(
        node.last_claimed_epoch < current_epoch,
        SoladError::AlreadyClaimed
    );

    let shard_lamports = upload
        .node_lamports
        .checked_mul(shard.size_mb)
        .ok_or(SoladError::MathOverflow)?
        .checked_div(upload.size_mb)
        .ok_or(SoladError::MathOverflow)?;
    let node_count = shard
        .node_keys
        .iter()
        .filter(|&&k| k != Pubkey::default())
        .count();
    let node_lamports = shard_lamports
        .checked_div(node_count as u64)
        .ok_or(SoladError::MathOverflow)?;
    let epoch_lamports = node_lamports
        .checked_div(config.epochs_total)
        .ok_or(SoladError::MathOverflow)?;

    let reward = if node_count == 1 || upload.shard_count == 1 {
        epoch_lamports
    } else {
        if shard.verified_count > 0 {
            epoch_lamports
        } else {
            epoch_lamports
                .checked_mul(100 - config.slash_penalty_percent)
                .ok_or(SoladError::MathOverflow)?
                / 100
        }
    };

    if node_count > 1 && upload.shard_count > 1 && shard.verified_count == 0 {
        let slash_amount = node
            .stake_amount
            .checked_mul(config.slash_penalty_percent)
            .ok_or(SoladError::MathOverflow)?
            / 100;
        node.stake_amount = node
            .stake_amount
            .checked_sub(slash_amount)
            .ok_or(SoladError::MathOverflow)?;
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
                    to: ctx.accounts.treasury.to_account_info(),
                },
                &[&stake_escrow_seeds[..]],
            ),
            slash_amount,
        )?;
    }

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
