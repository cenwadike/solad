use anchor_lang::prelude::*;

// PDA Seeds
pub const STORAGE_CONFIG_SEED: &[u8] = b"storage_config";
pub const UPLOAD_SEED: &[u8] = b"upload";
pub const USER_UPLOAD_KEYS_SEED: &[u8] = b"upload_keys";
pub const NODE_SEED: &[u8] = b"node";
pub const ESCROW_SEED: &[u8] = b"escrow";
pub const STAKE_ESCROW_SEED: &[u8] = b"stake_escrow";
pub const REPLACEMENT_SEED: &[u8] = b"replacement";

#[account]
pub struct StorageConfig {
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
    pub max_user_uploads: u64,
    pub is_initialized: bool,
}

#[account]
pub struct Node {
    pub owner: Pubkey,
    pub stake_amount: u64,
    pub upload_count: u64,
    pub last_pos_time: i64,
    pub last_claimed_epoch: u64,
    pub is_active: bool,
}

#[account]
pub struct NodeRegistry {
    pub nodes: Vec<Pubkey>, // List of registered node public keys
}

#[account]
pub struct Upload {
    pub data_hash: String,
    pub size_bytes: u64, 
    pub shard_count: u8,
    pub node_lamports: u64,
    pub payer: Pubkey,
    pub upload_time: i64,
    pub storage_duration_days: u64,
    pub expiry_time: i64,
    pub current_slot: u64,
    pub shards: Vec<ShardInfo>,
}


#[account]
pub struct UserUploadKeys {
    pub user: Pubkey,           // The user (payer) who owns the uploads
    pub uploads: String,        // CSV of all Upload PDA public keys
}

// Defines the data structure for a single PoS submission in a batch.
// This struct encapsulates all necessary data for validating a PoS or reporting oversized data
// for a specific shard, allowing multiple submissions to be processed in a single transaction.
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct PoSSubmission {
    /// Hash of the data being verified.
    pub data_hash: String,
    /// ID of the shard being verified.
    pub shard_id: u8,
    /// Optional Merkle root for PoS verification.
    pub merkle_root: Option<String>,
    /// Optional Merkle proof path for the leaf.
    pub merkle_proof: Option<Vec<[u8; 32]>>,
    /// Optional leaf hash being verified.
    pub leaf: Option<[u8; 32]>,
    /// Optional challenger signature for PoS verification.
    pub challenger_signature: Option<[u8; 64]>,
    /// Optional public key of the challenger.
    pub challenger_pubkey: Option<Pubkey>,
    /// Optional actual size in MB for oversized data reporting.
    pub actual_size_mb: Option<u64>,
}

#[account]
pub struct Escrow {
    pub bump: u8,
    pub lamports: u64,
}

#[account]
pub struct Replacement {
    pub exiting_node: Pubkey,
    pub replacement_node: Pubkey,
    pub data_hash: String,
    pub shard_id: u8,
    pub pos_submitted: bool,
    pub request_epoch: u64,
}

/// Structure defining a shard replacement request with data hash and shard ID.
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct ShardReplacement {
    pub data_hash: String,
    pub shard_id: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ShardInfo {
    pub shard_id: u8,
    pub node_keys: [Pubkey; 3],
    pub verified_count: u8,
    pub size_mb: u64,
    pub challenger: Pubkey,
    pub oversized_reports: Vec<OversizedReport>,
    pub rewarded_nodes: Vec<Pubkey>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct OversizedReport {
    pub node: Pubkey,
    pub actual_size_mb: u64,
}
