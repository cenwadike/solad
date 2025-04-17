pub use anchor_lang::prelude::*;
use anchor_lang::system_program;

use crate::{
    errors::SoladError,
    events::TimeoutSlashedEvent,
    states::{
        Escrow, Node, Replacement, StorageConfig, Upload, NODE_SEED, REPLACEMENT_SEED,
        STAKE_ESCROW_SEED, UPLOAD_SEED,
    },
};

// Slashes a node that fails to submit Proof of Storage within the timeout period.
// This function penalizes non-compliant nodes by redistributing a portion of their
// stake to the treasury and caller. It ensures the replacement request is valid
// and the timeout has expired before executing the slash.
/// Slashes timed-out replacements.
/// # Arguments
/// * `ctx` - Context containing upload, exiting node, replacement, and escrow accounts.
/// * `data_hash` - Hash of the data.
/// * `shard_id` - ID of the shard.
/// * `exiting_node` - Public key of the node to slash.
/// # Errors
/// Returns errors for invalid replacements or unexpired timeouts.
pub fn process_slash_timeout(
    ctx: Context<SlashTimeout>,
    data_hash: String,
    shard_id: u8,
    exiting_node: Pubkey,
) -> Result<()> {
    let config = &ctx.accounts.config;
    require!(config.is_initialized, SoladError::NotInitialized);

    let upload = &ctx.accounts.upload;
    require!(upload.data_hash == data_hash, SoladError::InvalidHash);
    require!(shard_id < upload.shard_count, SoladError::InvalidShardId);

    let replacement = &mut ctx.accounts.replacement;
    require!(
        replacement.data_hash == data_hash
            && replacement.shard_id == shard_id
            && replacement.exiting_node == exiting_node,
        SoladError::InvalidReplacement
    );
    require!(!replacement.pos_submitted, SoladError::PoSAlreadySubmitted);

    let current_epoch = Clock::get()?.slot / config.slots_per_epoch;
    require!(
        current_epoch >= replacement.request_epoch + config.replacement_timeout_epochs,
        SoladError::TimeoutNotExpired
    );

    let exiting_node = &mut ctx.accounts.exiting_node;
    let exiting_stake_escrow = &ctx.accounts.exiting_stake_escrow;
    require!(
        exiting_node.key() == exiting_node.owner.key(),
        SoladError::InvalidNodeAccount
    );
    require!(
        exiting_stake_escrow.key()
            == Pubkey::find_program_address(
                &[STAKE_ESCROW_SEED, exiting_node.owner.as_ref()],
                &ctx.program_id
            )
            .0,
        SoladError::InvalidNodeAccount
    );

    let slash_amount = exiting_node
        .stake_amount
        .checked_mul(config.slash_penalty_percent)
        .ok_or(SoladError::MathOverflow)?
        / 100;
    let treasury_amount = slash_amount
        .checked_mul(90)
        .ok_or(SoladError::MathOverflow)?
        / 100;
    let caller_amount = slash_amount
        .checked_sub(treasury_amount)
        .ok_or(SoladError::MathOverflow)?;

    let stake_escrow_seeds = &[
        STAKE_ESCROW_SEED,
        exiting_node.owner.as_ref(),
        &[exiting_stake_escrow.bump],
    ];

    if treasury_amount > 0 {
        system_program::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: exiting_stake_escrow.to_account_info(),
                    to: ctx.accounts.treasury.to_account_info(),
                },
                &[&stake_escrow_seeds[..]],
            ),
            treasury_amount,
        )?;
    }

    if caller_amount > 0 {
        system_program::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: exiting_stake_escrow.to_account_info(),
                    to: ctx.accounts.caller.to_account_info(),
                },
                &[&stake_escrow_seeds[..]],
            ),
            caller_amount,
        )?;
    }

    exiting_node.stake_amount = exiting_node
        .stake_amount
        .checked_sub(slash_amount)
        .ok_or(SoladError::MathOverflow)?;

    replacement.pos_submitted = true;

    emit!(TimeoutSlashedEvent {
        exiting_node: exiting_node.owner.key(),
        data_hash,
        shard_id,
        slash_amount,
        treasury_amount,
        caller_amount,
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction(data_hash: String, shard_id: u8, exiting_node: Pubkey)]
pub struct SlashTimeout<'info> {
    #[account(
        seeds = [UPLOAD_SEED, data_hash.as_bytes(), upload.payer.as_ref()],
        bump
    )]
    pub upload: Account<'info, Upload>,
    #[account(
        mut,
        seeds = [NODE_SEED, exiting_node.owner.as_ref()],
        bump
    )]
    pub exiting_node: Account<'info, Node>,
    #[account(
        mut,
        seeds = [REPLACEMENT_SEED, exiting_node.owner.as_ref(), data_hash.as_bytes(), &[shard_id]],
        bump,
        close = caller
    )]
    pub replacement: Account<'info, Replacement>,
    #[account(
        mut,
        seeds = [STAKE_ESCROW_SEED, exiting_node.owner.as_ref()],
        bump
    )]
    pub exiting_stake_escrow: Account<'info, Escrow>,
    #[account(mut)]
    pub caller: Signer<'info>,
    #[account(mut)]
    pub config: Account<'info, StorageConfig>,
    /// CHECK: safe
    #[account(mut)]
    pub treasury: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}
