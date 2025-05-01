use base64::Engine;
use dashmap::DashMap;
use serde::{Deserialize, Serialize};
use solana_client::{
    nonblocking::rpc_client::RpcClient,
    rpc_config::{RpcTransactionLogsConfig, RpcTransactionLogsFilter},
};
use solana_sdk::{commitment_config::CommitmentConfig, pubkey::Pubkey};
use std::sync::Arc;
use std::time::Duration;

use crate::error::ApiError;

// Matches UploadEvent struct in contract
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

// Configuration for the event listener
#[derive(Debug, Clone)]
pub struct EventListenerConfig {
    pub ws_url: String,
    pub http_url: String,
    pub program_id: Pubkey,
    pub node_pubkey: Pubkey,
    pub commitment: CommitmentConfig,
}

// Thread-safe map for events
pub type EventMap = Arc<DashMap<Pubkey, UploadEvent>>;

// Main event listener struct
pub struct UploadEventListener {
    config: EventListenerConfig,
    event_map: EventMap,
}

impl UploadEventListener {
    pub async fn new(config: EventListenerConfig, event_map: EventMap) -> Self {
        Self { config, event_map }
    }

    pub async fn start(&self) -> Result<(), ApiError> {
        // Configure logs subscription
        let filter = RpcTransactionLogsFilter::Mentions(vec![self.config.program_id.to_string()]);
        let logs_config = RpcTransactionLogsConfig {
            commitment: Some(self.config.commitment.clone()),
        };

        // Subscribe to logs
        let (_sub, stream) = solana_client::pubsub_client::PubsubClient::logs_subscribe(
            &self.config.ws_url,
            filter,
            logs_config,
        )
        .map_err(|_| ApiError::SubscriptionFailed)?;

        // Process incoming log messages
        loop {
            match stream.try_recv() {
                Ok(response) => {
                    if let Err(e) = self.process_log_response(response).await {
                        eprintln!("Error processing log: {}", e);
                        continue;
                    }
                }
                Err(crossbeam_channel::TryRecvError::Empty) => {
                    // No messages available, continue looping
                    continue;
                }
                Err(crossbeam_channel::TryRecvError::Disconnected) => {
                    // Channel disconnected, break the loop
                    return Err(ApiError::SubscriptionFailed);
                }
            }
        }
    }

    async fn process_log_response(
        &self,
        response: solana_client::rpc_response::Response<
            solana_client::rpc_response::RpcLogsResponse,
        >,
    ) -> Result<(), ApiError> {
        let logs_response = response.value;

        for log in logs_response.logs {
            if log.contains("Program data:") {
                if let Some(event) = self.parse_upload_event(&log).await {
                    // Only store events where this node is included
                    if event.nodes.contains(&self.config.node_pubkey) {
                        self.event_map.insert(event.upload_pda, event);
                    }
                }
            }
        }

        Ok(())
    }

    async fn parse_upload_event(&self, log: &str) -> Option<UploadEvent> {
        let base64_data = log.strip_prefix("Program data: ")?.trim();
        let decoded_data = match base64::prelude::BASE64_STANDARD.decode(base64_data) {
            Ok(data) => data,
            Err(_) => return None,
        };

        if decoded_data.len() < 8 {
            return None;
        }

        let event_data = &decoded_data[8..];
        match bincode::deserialize::<UploadEvent>(event_data) {
            Ok(event) => Some(event),
            Err(_) => None,
        }
    }
}

// Event consumer
pub struct UploadEventConsumer {
    config: EventListenerConfig,
    event_map: EventMap,
    rpc_client: Arc<RpcClient>,
}

impl UploadEventConsumer {
    pub async fn new(config: EventListenerConfig, event_map: EventMap) -> Self {
        let rpc_client = Arc::new(RpcClient::new(config.http_url.clone()));
        Self {
            config,
            event_map,
            rpc_client,
        }
    }

    pub async fn start(&self) -> Result<(), ApiError> {
        loop {
            // Periodically clean up old events (optional, based on timestamp)
            self.event_map.retain(|_, event| {
                let age = std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_secs() as i64
                    - event.timestamp;
                age < 24 * 3600 // Keep events for 24 hours
            });

            // Prevent tight loop
            tokio::time::sleep(Duration::from_millis(200)).await;
        }
    }

    pub async fn verify_event(&self, event: &UploadEvent) -> Result<(), ApiError> {
        // Verify node is registered
        let node_account = self
            .rpc_client
            .get_account(&self.config.node_pubkey)
            .await
            .map_err(|_e| ApiError::NodeNotRegistered)?;
        if node_account.owner != self.config.program_id {
            return Err(ApiError::NodeNotRegistered);
        }

        // Verify payment (check escrow account)
        let escrow_seeds = [b"escrow", event.data_hash.as_bytes(), event.payer.as_ref()];
        let (escrow_pda, _bump) =
            Pubkey::find_program_address(&escrow_seeds, &self.config.program_id);
        let escrow_account = self
            .rpc_client
            .get_account(&escrow_pda)
            .await
            .map_err(|_e| ApiError::PaymentNotVerified)?;

        if escrow_account.lamports == 0 {
            println!("Reporting payer {} for slashing: no payment", event.payer);
            return Err(ApiError::PaymentNotVerified);
        }

        Ok(())
    }
}
