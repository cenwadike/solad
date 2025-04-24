#![allow(unexpected_cfgs)]
use anchor_lang::prelude::*;

mod instructions;
use instructions::*;

mod errors;
mod events;
mod states;
mod utils;

use crate::states::{PoSSubmission, ShardReplacement};

declare_id!("4Fbo2dQdqrVhxLBbZrxVEbDBxp8GmNa9voEN96d4fQJp");

// The Solad program is a decentralized storage protocol built on Solana using the Anchor framework.
// It facilitates data uploads with sharding, node staking, proof-of-storage verification,
// and reward distribution. The program ensures data availability through node replacement
// mechanisms and penalizes non-compliance with slashing. The following contract defines
// the core logic for initializing the system, managing nodes, handling uploads, and
// maintaining data integrity through cryptographic proofs.

#[program]
pub mod contract {

    use crate::states::ShardReplacement;

    use super::*;

    pub fn initialize(
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
    ) -> Result<()> {
        process_initialize(
            ctx,
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
            max_user_uploads,
            user_slash_penalty_percent,
        )
    }

    pub fn register_node(ctx: Context<RegisterNode>, stake_amount: u64) -> Result<()> {
        process_register_node(ctx, stake_amount)
    }

    pub fn deregister_node(ctx: Context<DeregisterNode>) -> Result<()> {
        process_deregister_node(ctx)
    }

    pub fn upload_data<'info>(
        ctx: Context<'_, '_, 'info, 'info, UploadData<'info>>,
        data_hash: String,
        size_bytes: u64,
        shard_count: u8,
        storage_duration_days: u64,
    ) -> Result<()> {
        process_upload_data(ctx, data_hash, size_bytes, shard_count, storage_duration_days)
    }

    pub fn slash_user(ctx: Context<SlashUser>, data_hash: String, shard_id: u8) -> Result<()> {
        process_slash_user(ctx, data_hash, shard_id)
    }

    pub fn submit_pos<'info>(
        ctx: Context<'_, '_, 'info, 'info, SubmitPoS<'info>>,
        submissions: Vec<PoSSubmission>,
    ) -> Result<()> {
        process_submit_pos(ctx, submissions)
    }

    pub fn claim_rewards(
        ctx: Context<ClaimRewards>,
        data_hash: String,
        shard_id: u8,
    ) -> Result<()> {
        process_claim_rewards(ctx, data_hash, shard_id)
    }

    pub fn request_replacement(
        ctx: Context<RequestReplacement>,
        data_hash: String,
        shard_id: u8,
        uploader: Pubkey,
    ) -> Result<()> {
        process_request_replacement(ctx, data_hash, shard_id, uploader)
    }

    pub fn batch_request_replacement<'info>(
        ctx: Context<'_, '_, 'info, 'info, BatchRequestReplacement<'info>>,
        shard_replacements: Vec<ShardReplacement>,
    ) -> Result<()> {
        process_batch_request_replacement(ctx, shard_replacements)
    }

    pub fn close_upload<'info>(
        ctx: Context<'_, '_, 'info, 'info, CloseUpload<'info>>,
        data_hash: String,
        shard_id: u8,
    ) -> Result<()> {
        process_close_upload(ctx, data_hash, shard_id)
    }

    pub fn slash_timeout(
        ctx: Context<SlashTimeout>,
        data_hash: String,
        shard_id: u8,
        exiting_node: Pubkey,
    ) -> Result<()> {
        process_slash_timeout(ctx, data_hash, shard_id, exiting_node)
    }

    pub fn update_config(
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
        process_update_config(
            ctx,
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
        )
    }
}
// CLI instructions for interacting with the Solad program.
// These commands provide a reference for deploying and managing the storage network.

// Initialize the storage configuration
// solad initialize \
//     --treasury <TREASURY_PUBKEY> \
//     --sol-per-gb <LAMPORTS_PER_GB> \
//     --treasury-fee-percent <TREASURY_FEE_PERCENT> \
//     --node-fee-percent <NODE_FEE_PERCENT> \
//     --shard-min-mb <MIN_SHARD_MB> \
//     --epochs-total <TOTAL_EPOCHS> \
//     --slash-penalty-percent <SLASH_PENALTY_PERCENT> \
//     --min-shard-count <MIN_SHARD_COUNT> \
//     --max-shard-count <MAX_SHARD_COUNT> \
//     --slots-per-epoch <SLOTS_PER_EPOCH> \
//     --min-node-stake <MIN_NODE_STAKE> \
//     --replacement-timeout-epochs <REPLACEMENT_TIMEOUT_EPOCHS> \
//     --min-lamports-per-upload <MIN_LAMPORTS_PER_UPLOAD> \
//     --user-slash-penalty-percent <USER_SLASH_PENALTY_PERCENT> \
//     --authority <AUTHORITY_KEYPAIR>

// Register a new storage node
// solad register-node \
//     --stake-amount <STAKE_AMOUNT> \
//     --owner <NODE_OWNER_KEYPAIR>

// Deregister a node
// solad deregister-node \
//     --owner <NODE_OWNER_KEYPAIR>

// Upload data with sharding
// solad upload \
//     --data-hash <DATA_HASH> \
//     --size-bytes <SIZE_BYTES> \
//     --shard-count <SHARD_COUNT> \
//     --storage-duration-days <DURATION> \
//     --payer <PAYER_KEYPAIR>

// Slash a user for invalid data size
// solad slash-user \
//     --data-hash <DATA_HASH> \
//     --shard-id <SHARD_ID> \
//     --node <NODE_KEYPAIR>

// Submit Proof of Storage (PoS)
// solad submit-pos \
//     --submissions <SUBMISSIONS_JSON> \
//     --node <NODE_KEYPAIR>
//
// Note: <SUBMISSIONS_JSON> is a JSON array of objects, each containing:
//       {"data_hash": <DATA_HASH>, "shard_id": <SHARD_ID>, "merkle_root": <MERKLE_ROOT>,
//        "merkle_proof": <MERKLE_PROOF>, "leaf": <LEAF_HASH>,
//        "challenger_signature": <CHALLENGER_SIGNATURE>, "challenger_pubkey": <CHALLENGER_PUBKEY>}

// Claim storage rewards
// solad claim-rewards \
//     --data-hash <DATA_HASH> \
//     --shard-id <SHARD_ID> \
//     --node <NODE_KEYPAIR>

// Request replacement for a single shard
// solad request-replacement \
//     --data-hash <DATA_HASH> \
//     --shard-id <SHARD_ID> \
//     --exiting-node <EXITING_NODE_KEYPAIR> \
//     --replacement-node <REPLACEMENT_NODE_KEYPAIR>

// Batch request replacements for multiple shards
// solad batch-request-replacement \
//     --shard-replacements <SHARD_REPLACEMENTS_JSON> \
//     --exiting-node <EXITING_NODE_KEYPAIR> \
//     --replacement-node <REPLACEMENT_NODE_KEYPAIR>
//
// Note: <SHARD_REPLACEMENTS_JSON> is a JSON array of objects, each containing:
//       {"data_hash": <DATA_HASH>, "shard_id": <SHARD_ID>}

// Close an upload for a specific shard
// solad close-upload \
//     --data-hash <DATA_HASH> \
//     --shard-id <SHARD_ID> \
//     --payer <PAYER_KEYPAIR>

// Slash a node for replacement timeout
// solad slash-timeout \
//     --data-hash <DATA_HASH> \
//     --shard-id <SHARD_ID> \
//     --exiting-node <EXITING_NODE_PUBKEY> \
//     --caller <CALLER_KEYPAIR>

// Update the storage configuration
// solad update-config \
//     --sol-per-gb <LAMPORTS_PER_GB> \
//     --treasury-fee-percent <TREASURY_FEE_PERCENT> \
//     --node-fee-percent <NODE_FEE_PERCENT> \
//     --shard-min-mb <MIN_SHARD_MB> \
//     --epochs-total <TOTAL_EPOCHS> \
//     --slash-penalty-percent <SLASH_PENALTY_PERCENT> \
//     --min-shard-count <MIN_SHARD_COUNT> \
//     --max-shard-count <MAX_SHARD_COUNT> \
//     --slots-per-epoch <SLOTS_PER_EPOCH> \
//     --min-node-stake <MIN_NODE_STAKE> \
//     --replacement-timeout-epochs <REPLACEMENT_TIMEOUT_EPOCHS> \
//     --authority <AUTHORITY_KEYPAIR>
