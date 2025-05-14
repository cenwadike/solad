use serde::{Deserialize, Serialize};
use dashmap::DashMap;
use std::sync::Arc;
use solana_sdk::{commitment_config::CommitmentConfig, pubkey::Pubkey};
use solana_client::{
    nonblocking::rpc_client::RpcClient,
    rpc_config::{RpcTransactionLogsConfig, RpcTransactionLogsFilter},
};


#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct UploadEvent {
    pub upload_pda: Pubkey,
    pub data_hash: String,
    pub size_bytes: u64,
    pub shard_count: u8,
    pub payer: Pubkey,
    pub nodes: Vec<Pubkey>,
    pub storage_duration_days: u64,
    pub timestamp: i64,
}

#[derive(Debug, Clone)]
pub struct EventListenerConfig {
    pub ws_url: String,
    pub http_url: String,
    pub program_id: Pubkey,
    pub node_pubkey: Pubkey,
    pub commitment: CommitmentConfig,
}

pub type EventMap = Arc<DashMap<Pubkey, UploadEvent>>;

pub struct UploadEventListener {
    config: EventListenerConfig, // Configuration for the listener
    event_map: EventMap,         // Shared map for storing events
}

pub struct UploadEventConsumer {
    config: EventListenerConfig, // Configuration for the consumer
    event_map: EventMap,         // Shared map of upload events
    rpc_client: Arc<RpcClient>,  // Solana RPC client for account queries
}