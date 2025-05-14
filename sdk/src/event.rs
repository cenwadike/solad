use serde::{Deserialize, Serialize};
use dashmap::DashMap;
use std::sync::Arc;
use solana_sdk::{commitment_config::CommitmentConfig, pubkey::Pubkey};
use solana_client::{
    nonblocking::rpc_client::RpcClient,
    rpc_config::{RpcTransactionLogsConfig, RpcTransactionLogsFilter},
};


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