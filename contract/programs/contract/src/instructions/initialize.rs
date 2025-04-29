use anchor_lang::prelude::*;
use std::mem::size_of;

use crate::{
    errors::SoladError,
    events::ConfigInitializedEvent,
    states::{NodeRegistry, StorageConfig, STORAGE_CONFIG_SEED},
};

// Initializes the storage configuration and node registry for the Solad program.
// This function is called once by the program authority to set up critical parameters
// for storage pricing, fee distribution, shard constraints, epoch settings, and node
// requirements. It validates inputs to ensure economic and operational integrity, such as
// non-zero payment rates, valid fee splits, and reasonable shard ranges. It also
// initializes an empty node registry for tracking storage nodes. Upon success, it emits
// a `ConfigInitializedEvent` for transparency and auditability.
// # Arguments
// * `ctx` - Context containing the storage config account, node registry, authority, and system program.
// * `treasury` - Public key of the treasury account for fee collection.
// * `sol_per_gb` - Cost in lamports per gigabyte of storage (must be > 0).
// * `treasury_fee_percent` - Percentage of fees allocated to the treasury (sum with node_fee_percent must be 100).
// * `node_fee_percent` - Percentage of fees allocated to storage nodes (sum with treasury_fee_percent must be 100).
// * `shard_min_mb` - Minimum shard size in megabytes.
// * `epochs_total` - Total number of epochs for reward distribution (must be > 0).
// * `slash_penalty_percent` - Penalty percentage for non-compliant nodes (must be ≤ 50).
// * `min_shard_count` - Minimum number of shards per upload (must be ≥ 1 and ≤ max_shard_count).
// * `max_shard_count` - Maximum number of shards per upload (must be ≤ 10 and ≥ min_shard_count).
// * `slots_per_epoch` - Number of Solana slots per epoch (must be > 0).
// * `min_node_stake` - Minimum stake in lamports required for node registration (must be ≥ 100,000,000).
// * `replacement_timeout_epochs` - Epochs before a replacement node is slashed (must be > 0).
// * `min_lamports_per_upload` - Minimum fee in lamports per upload (must be ≥ 5,000).
// * `user_slash_penalty_percent` - Penalty percentage for non-compliant users (must be ≤ 50).
// * `max_user_uploads` - Maximum number of uploads from a single public key. (eg. 100,000; assuming at least 10KB storage that's equivalent to ~1GB)
// # Errors
// Returns `SoladError` variants for invalid inputs, such as zero payment rates, invalid fee splits,
// improper shard ranges, or insufficient stakes.
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
    max_user_uploads: u64,
    user_slash_penalty_percent: u64,
    reporting_window: u64,
    oversized_report_threshold: f64,
    max_submssions: u64,
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
    config.reporting_window = reporting_window;
    config.max_user_uploads = max_user_uploads;
    config.oversized_report_threshold = oversized_report_threshold;
    config.max_submssions = max_submssions;
    config.is_initialized = true;

    require!(sol_per_gb > 0, SoladError::InvalidPaymentRate);
    require!(
        treasury_fee_percent + node_fee_percent == 100,
        SoladError::InvalidFeeSplit
    );
    require!(
        min_shard_count >= 1 && max_shard_count <= 10,
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

    let node_registry = &mut ctx.accounts.node_registry;
    node_registry.nodes = vec![];

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
        reporting_window,
        oversized_report_threshold,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + size_of::<StorageConfig>(),
        seeds = [STORAGE_CONFIG_SEED],
        bump
    )]
    pub config: Account<'info, StorageConfig>,
    #[account(
        init,
        payer = authority,
        space = 8 + 4 + (32 * 300), // Allow up to 300 nodes
        seeds = [b"node_registry"],
        bump
    )]
    pub node_registry: Account<'info, NodeRegistry>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}
