pub use anchor_lang::prelude::*;

#[event]
pub struct ConfigInitializedEvent {
    pub treasury: Pubkey,
    pub sol_per_gb: u64,
    pub treasury_fee_percent: u64,
    pub node_fee_percent: u64,
    pub shard_min_mb: u64,
    pub epochs_total: u64,
    pub slash_penalty_percent: u64,
    pub min_shard_count: u8,
    pub max_shard_count: u8,
    pub slots_per_epoch: u64,
    pub min_node_stake: u64,
    pub replacement_timeout_epochs: u64,
    pub min_lamports_per_upload: u64,
    pub user_slash_penalty_percent: u64,
}

#[event]
pub struct ConfigUpdatedEvent {
    pub sol_per_gb: u64,
    pub treasury_fee_percent: u64,
    pub node_fee_percent: u64,
    pub shard_min_mb: u64,
    pub epochs_total: u64,
    pub slash_penalty_percent: u64,
    pub min_shard_count: u8,
    pub max_shard_count: u8,
    pub slots_per_epoch: u64,
    pub min_node_stake: u64,
    pub replacement_timeout_epochs: u64,
}

#[event]
pub struct NodeRegisteredEvent {
    pub node: Pubkey,
    pub stake_amount: u64,
}

#[event]
pub struct NodeExitedEvent {
    pub node: Pubkey,
    pub data_hash: String,
    pub shard_id: u8,
}

#[event]
pub struct ReplacementRequestedEvent {
    pub exiting_node: Pubkey,
    pub replacement_node: Pubkey,
    pub data_hash: String,
    pub shard_id: u8,
}

#[event]
pub struct ReplacementVerifiedEvent {
    pub exiting_node: Pubkey,
    pub replacement_node: Pubkey,
    pub data_hash: String,
    pub shard_id: u8,
}

#[event]
pub struct TimeoutSlashedEvent {
    pub exiting_node: Pubkey,
    pub data_hash: String,
    pub shard_id: u8,
    pub slash_amount: u64,
    pub treasury_amount: u64,
    pub caller_amount: u64,
}

#[event]
pub struct NodeDeregisteredEvent {
    pub node: Pubkey,
    pub stake_amount: u64,
}

#[event]
pub struct UploadEvent {
    pub data_hash: String,
    pub size_mb: u64,
    pub shard_count: u8,
    pub payer: Pubkey,
}

#[event]
pub struct PoSEvent {
    pub data_hash: String,
    pub shard_id: u8,
    pub node: Pubkey,
    pub merkle_root: String,
    pub challenger: Pubkey,
}

#[event]
pub struct RewardEvent {
    pub data_hash: String,
    pub shard_id: u8,
    pub node: Pubkey,
    pub amount: u64,
}

#[event]
pub struct OversizedDataReportedEvent {
    pub data_hash: String,
    pub shard_id: u8,
    pub node: Pubkey,
    pub declared_size_mb: u64,
    pub actual_size_mb: u64,
}

#[event]
pub struct UserSlashedEvent {
    pub payer: Pubkey,
    pub data_hash: String,
    pub shard_id: u8,
    pub slash_amount: u64,
    pub refund_amount: u64,
    pub actual_size_mb: u64,
}
