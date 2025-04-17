pub use anchor_lang::prelude::*;

use crate::{
    errors::SoladError,
    events::ConfigInitializedEvent,
    states::{StorageConfig, STORAGE_CONFIG_SEED},
};

// Initializes the storage configuration for the Solad program.
// This function sets up critical parameters such as pricing, fees, shard constraints,
// and epoch settings. It is called once by the program authority to bootstrap the system.
// The function validates inputs to ensure economic and operational integrity, such as
// non-zero payment rates and valid fee splits. Upon success, it emits an event for
// transparency and auditability.
/// Initializes the program.
/// # Arguments
/// * `ctx` - Context containing the storage config account and authority.
/// * `treasury` - Public key of the treasury account for fee collection.
/// * `sol_per_gb` - Cost in lamports per gigabyte of storage.
/// * `treasury_fee_percent` - Percentage of fees allocated to the treasury.
/// * `node_fee_percent` - Percentage of fees allocated to storage nodes.
/// * `shard_min_mb` - Minimum shard size in megabytes.
/// * `epochs_total` - Total number of epochs for reward distribution.
/// * `slash_penalty_percent` - Penalty percentage for non-compliant nodes.
/// * `min_shard_count` - Minimum number of shards per upload.
/// * `max_shard_count` - Maximum number of shards per upload.
/// * `slots_per_epoch` - Number of Solana slots per epoch.
/// * `min_node_stake` - Minimum stake required for node registration.
/// * `replacement_timeout_epochs` - Epochs before a replacement node is slashed.
/// # Errors
/// Returns errors for invalid inputs, such as zero payment rates or invalid fee splits.
pub fn process_initialize(
    ctx: Context<Initialize>,
    treasury: Pubkey,
    sol_per_gb: u64,
    treasury_fee_percent: u64,
    node_fee_percent: u64,
    shard_min_mb: u64,
    epochs_total: u64,
    slash_penalty_percent: u64,
    min_shard_count: u8,
    max_shard_count: u8,
    slots_per_epoch: u64,
    min_node_stake: u64,
    replacement_timeout_epochs: u64,
    min_lamports_per_upload: u64,
    user_slash_penalty_percent: u64,
) -> Result<()> {
    let config = &mut ctx.accounts.config;
    config.treasury = treasury;
    config.sol_per_gb = sol_per_gb;
    config.treasury_fee_percent = treasury_fee_percent;
    config.node_fee_percent = node_fee_percent;
    config.shard_min_mb = shard_min_mb;
    config.epochs_total = epochs_total;
    config.slash_penalty_percent = slash_penalty_percent;
    config.min_shard_count = min_shard_count;
    config.max_shard_count = max_shard_count;
    config.slots_per_epoch = slots_per_epoch;
    config.min_node_stake = min_node_stake;
    config.replacement_timeout_epochs = replacement_timeout_epochs;
    config.min_lamports_per_upload = min_lamports_per_upload;
    config.user_slash_penalty_percent = user_slash_penalty_percent;
    config.is_initialized = true;

    require!(sol_per_gb > 0, SoladError::InvalidPaymentRate);
    require!(
        treasury_fee_percent + node_fee_percent == 100,
        SoladError::InvalidFeeSplit
    );
    require!(
        min_shard_count >= 1 && max_shard_count <= 15,
        SoladError::InvalidShardRange
    );
    require!(
        min_shard_count <= max_shard_count,
        SoladError::InvalidShardRange
    );
    require!(epochs_total > 0, SoladError::InvalidEpochs);
    require!(slash_penalty_percent <= 50, SoladError::InvalidPenalty);
    require!(slots_per_epoch > 0, SoladError::InvalidSlotsPerEpoch);
    require!(min_node_stake >= 100_000_000, SoladError::InvalidStake);
    require!(replacement_timeout_epochs > 0, SoladError::InvalidTimeout);
    require!(min_lamports_per_upload >= 5000, SoladError::InvalidMinFee);
    require!(
        user_slash_penalty_percent <= 50,
        SoladError::InvalidUserPenalty
    );

    emit!(ConfigInitializedEvent {
        treasury,
        sol_per_gb,
        treasury_fee_percent,
        node_fee_percent,
        shard_min_mb,
        epochs_total,
        slash_penalty_percent,
        min_shard_count,
        max_shard_count,
        slots_per_epoch,
        min_node_stake,
        replacement_timeout_epochs,
        min_lamports_per_upload,
        user_slash_penalty_percent,
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction(
        treasury: Pubkey,
        sol_per_gb: u64,
        treasury_fee_percent: u64,
        node_fee_percent: u64,
        shard_min_mb: u64,
        epochs_total: u64,
        slash_penalty_percent: u64,
        min_shard_count: u8,
        max_shard_count: u8,
        slots_per_epoch: u64,
        min_node_stake: u64,
        replacement_timeout_epochs: u64,
        min_lamports_per_upload: u64,
        user_slash_penalty_percent: u64
    )]
pub struct Initialize<'info> {
    #[account(
            init,
            payer = authority,
            space = 8 + 32 + 8 + 8 + 8 + 8 + 8 + 8 + 1 + 1 + 8 + 8 + 8 + 8 + 8 + 1,
            seeds = [STORAGE_CONFIG_SEED],
            bump
        )]
    pub config: Account<'info, StorageConfig>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}
