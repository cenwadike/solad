pub use anchor_lang::prelude::*;

use crate::{
    errors::SoladError,
    events::ConfigUpdatedEvent,
    states::{StorageConfig, STORAGE_CONFIG_SEED},
};

// Updates the storage configuration parameters.
// This function allows the authority to modify settings like pricing, fees,
// and shard constraints. It validates inputs to maintain system integrity
// and emits an event to log changes.
/// Updates configuration.
/// # Arguments
/// * `ctx` - Context containing the config and authority accounts.
/// * `sol_per_gb` - Optional new cost per gigabyte.
/// * `treasury_fee_percent` - Optional new treasury fee percentage.
/// * `node_fee_percent` - Optional new node fee percentage.
/// * `shard_min_mb` - Optional new minimum shard size.
/// * `epochs_total` - Optional new total epochs.
/// * `slash_penalty_percent` - Optional new slash penalty percentage.
/// * `min_shard_count` - Optional new minimum shard count.
/// * `max_shard_count` - Optional new maximum shard count.
/// * `slots_per_epoch` - Optional new slots per epoch.
/// * `min_node_stake` - Optional new minimum node stake.
/// * `replacement_timeout_epochs` - Optional new replacement timeout.
/// # Errors
/// Returns errors for invalid inputs, such as zero epochs or invalid fee splits.
pub fn process_update_config(
    ctx: Context<UpdateConfig>,
    sol_per_gb: Option<u64>,
    treasury_fee_percent: Option<u64>,
    node_fee_percent: Option<u64>,
    shard_min_mb: Option<u64>,
    epochs_total: Option<u64>,
    slash_penalty_percent: Option<u64>,
    min_shard_count: Option<u8>,
    max_shard_count: Option<u8>,
    slots_per_epoch: Option<u64>,
    min_node_stake: Option<u64>,
    replacement_timeout_epochs: Option<u64>,
) -> Result<()> {
    let config = &mut ctx.accounts.config;
    require!(config.is_initialized, SoladError::NotInitialized);

    if let Some(sol_per_gb) = sol_per_gb {
        require!(sol_per_gb > 0, SoladError::InvalidPaymentRate);
        config.sol_per_gb = sol_per_gb;
    }
    if let (Some(treasury_fee), Some(node_fee)) = (treasury_fee_percent, node_fee_percent) {
        require!(treasury_fee + node_fee == 100, SoladError::InvalidFeeSplit);
        config.treasury_fee_percent = treasury_fee;
        config.node_fee_percent = node_fee;
    }
    if let Some(shard_min_mb) = shard_min_mb {
        config.shard_min_mb = shard_min_mb;
    }
    if let Some(epochs_total) = epochs_total {
        require!(epochs_total > 0, SoladError::InvalidEpochs);
        config.epochs_total = epochs_total;
    }
    if let Some(slash_penalty_percent) = slash_penalty_percent {
        require!(slash_penalty_percent <= 50, SoladError::InvalidPenalty);
        config.slash_penalty_percent = slash_penalty_percent;
    }
    if let (Some(min_shard_count), Some(max_shard_count)) = (min_shard_count, max_shard_count) {
        require!(
            min_shard_count >= 1 && max_shard_count <= 15,
            SoladError::InvalidShardRange
        );
        require!(
            min_shard_count <= max_shard_count,
            SoladError::InvalidShardRange
        );
        config.min_shard_count = min_shard_count;
        config.max_shard_count = max_shard_count;
    }
    if let Some(slots_per_epoch) = slots_per_epoch {
        require!(slots_per_epoch > 0, SoladError::InvalidSlotsPerEpoch);
        config.slots_per_epoch = slots_per_epoch;
    }
    if let Some(min_node_stake) = min_node_stake {
        require!(min_node_stake >= 100_000_000, SoladError::InvalidStake);
        config.min_node_stake = min_node_stake;
    }
    if let Some(replacement_timeout_epochs) = replacement_timeout_epochs {
        require!(replacement_timeout_epochs > 0, SoladError::InvalidTimeout);
        config.replacement_timeout_epochs = replacement_timeout_epochs;
    }

    emit!(ConfigUpdatedEvent {
        sol_per_gb: config.sol_per_gb,
        treasury_fee_percent: config.treasury_fee_percent,
        node_fee_percent: config.node_fee_percent,
        shard_min_mb: config.shard_min_mb,
        epochs_total: config.epochs_total,
        slash_penalty_percent: config.slash_penalty_percent,
        min_shard_count: config.min_shard_count,
        max_shard_count: config.max_shard_count,
        slots_per_epoch: config.slots_per_epoch,
        min_node_stake: config.min_node_stake,
        replacement_timeout_epochs: config.replacement_timeout_epochs,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    #[account(
        mut,
        seeds = [STORAGE_CONFIG_SEED],
        bump
    )]
    pub config: Account<'info, StorageConfig>,
    #[account(mut)]
    pub authority: Signer<'info>,
}
