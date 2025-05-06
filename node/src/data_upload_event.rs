/// This module implements event listening and processing for upload events in a decentralized
/// storage network. It integrates with the Solana blockchain to subscribe to transaction logs,
/// parse upload events, and verify payments. The module includes the `UploadEventListener` for
/// capturing events and the `UploadEventConsumer` for validating and managing them.

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

/// Represents an upload event emitted by the Solana program.
///
/// This struct mirrors the `UploadEvent` structure in the contract, capturing details about
/// a data upload, including the upload PDA, data hash, size, shard count, payer, assigned
/// nodes, storage duration, and timestamp.
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct UploadEvent {
    pub upload_pda: Pubkey,          // Program-derived address for the upload
    pub data_hash: String,           // SHA-256 hash of the uploaded data
    pub size_bytes: u64,             // Size of the data in bytes
    pub shard_count: u8,             // Number of shards for the data
    pub payer: Pubkey,               // Public key of the payer
    pub nodes: Vec<Pubkey>,          // List of node public keys assigned to store the data
    pub storage_duration_days: u64,  // Duration for which the data should be stored
    pub timestamp: i64,              // Unix timestamp of the event
}

/// Configuration for the event listener and consumer.
///
/// Holds connection details and identifiers needed to interact with the Solana blockchain
/// and process events.
#[derive(Debug, Clone)]
pub struct EventListenerConfig {
    pub ws_url: String,              // WebSocket URL for Solana RPC
    pub http_url: String,            // HTTP URL for Solana RPC
    pub program_id: Pubkey,          // Solana program ID
    pub node_pubkey: Pubkey,         // Public key of the current node
    pub commitment: CommitmentConfig, // Commitment level for blockchain operations
}

/// Thread-safe map for storing upload events, keyed by upload PDA.
pub type EventMap = Arc<DashMap<Pubkey, UploadEvent>>;

/// Listens for upload events emitted by the Solana program.
///
/// `UploadEventListener` subscribes to transaction logs via WebSocket, filters for events
/// from the specified program, and stores relevant events in the `EventMap` if the current
/// node is assigned to store the data.
pub struct UploadEventListener {
    config: EventListenerConfig,  // Configuration for the listener
    event_map: EventMap,         // Shared map for storing events
}

impl UploadEventListener {
    /// Creates a new `UploadEventListener` instance.
    ///
    /// # Arguments
    ///
    /// * `config` - Configuration for connecting to Solana and identifying the node.
    /// * `event_map` - Shared map for storing parsed upload events.
    ///
    /// # Returns
    ///
    /// * `Self` - A new `UploadEventListener` instance.
    ///
    /// # Examples
    ///
    /// ```rust
    /// use std::sync::Arc;
    /// use dashmap::DashMap;
    /// use solana_sdk::{pubkey::Pubkey, commitment_config::CommitmentConfig};
    /// use crate::data_upload_event::{EventListenerConfig, EventMap, UploadEventListener};
    ///
    /// #[tokio::main]
    /// async fn main() {
    ///     let config = EventListenerConfig {
    ///         ws_url: "ws://api.mainnet-beta.solana.com".to_string(),
    ///         http_url: "https://api.mainnet-beta.solana.com".to_string(),
    ///         program_id: Pubkey::new_unique(),
    ///         node_pubkey: Pubkey::new_unique(),
    ///         commitment: CommitmentConfig::confirmed(),
    ///     };
    ///     let event_map: EventMap = Arc::new(DashMap::new());
    ///     let listener = UploadEventListener::new(config, event_map).await;
    /// }
    /// ```
    pub async fn new(config: EventListenerConfig, event_map: EventMap) -> Self {
        Self { config, event_map }
    }

    /// Starts the event listener, subscribing to Solana transaction logs.
    ///
    /// Subscribes to logs for the configured program ID, processes incoming logs, and
    /// stores relevant upload events in the `EventMap`. Runs indefinitely until the
    /// subscription is disconnected.
    ///
    /// # Returns
    ///
    /// * `Result<(), ApiError>` - Returns `Ok(())` if the listener runs successfully,
    ///   or `ApiError::SubscriptionFailed` if the subscription fails or disconnects.
    ///
    /// # Workflow
    ///
    /// 1. **Subscription Setup**: Configures a WebSocket subscription for transaction logs
    ///    mentioning the program ID.
    /// 2. **Log Processing**: Continuously receives log messages, parsing those containing
    ///    "Program data:" for upload events.
    /// 3. **Event Storage**: Stores events in the `EventMap` if the current node is listed
    ///    in the event's nodes.
    ///
    /// # Errors
    ///
    /// - `ApiError::SubscriptionFailed`: If the WebSocket subscription fails to initialize
    ///   or disconnects.
    ///
    /// # Examples
    ///
    /// ```rust
    /// use std::sync::Arc;
    /// use dashmap::DashMap;
    /// use solana_sdk::{pubkey::Pubkey, commitment_config::CommitmentConfig};
    /// use crate::data_upload_event::{EventListenerConfig, EventMap, UploadEventListener};
    ///
    /// #[tokio::main]
    /// async fn main() {
    ///     let config = EventListenerConfig {
    ///         ws_url: "ws://api.mainnet-beta.solana.com".to_string(),
    ///         http_url: "https://api.mainnet-beta.solana.com".to_string(),
    ///         program_id: Pubkey::new_unique(),
    ///         node_pubkey: Pubkey::new_unique(),
    ///         commitment: CommitmentConfig::confirmed(),
    ///     };
    ///     let event_map: EventMap = Arc::new(DashMap::new());
    ///     let listener = UploadEventListener::new(config, event_map).await;
    ///     listener.start().await.unwrap();
    /// }
    /// ```
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

    /// Processes a log response from the Solana subscription.
    ///
    /// Extracts logs containing "Program data:", parses them for upload events, and stores
    /// relevant events in the `EventMap` if the current node is included in the event's
    /// node list.
    ///
    /// # Arguments
    ///
    /// * `response` - The log response from the Solana WebSocket subscription.
    ///
    /// # Returns
    ///
    /// * `Result<(), ApiError>` - Returns `Ok(())` if the response is processed
    ///   successfully, or an `ApiError` if parsing or processing fails.
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

    /// Parses an upload event from a transaction log.
    ///
    /// Extracts base64-encoded event data from the log, decodes it, and deserializes it
    /// into an `UploadEvent` struct.
    ///
    /// # Arguments
    ///
    /// * `log` - The transaction log string containing "Program data:".
    ///
    /// # Returns
    ///
    /// * `Option<UploadEvent>` - Returns `Some(UploadEvent)` if parsing is successful,
    ///   or `None` if the log is invalid or deserialization fails.
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

/// Consumes and validates upload events from the `EventMap`.
///
/// `UploadEventConsumer` periodically cleans up old events and provides a method to
/// verify the validity of events, ensuring node registration and payment in the escrow
/// account.
pub struct UploadEventConsumer {
    config: EventListenerConfig,  // Configuration for the consumer
    event_map: EventMap,         // Shared map of upload events
    rpc_client: Arc<RpcClient>,  // Solana RPC client for account queries
}

impl UploadEventConsumer {
    /// Creates a new `UploadEventConsumer` instance.
    ///
    /// # Arguments
    ///
    /// * `config` - Configuration for connecting to Solana and identifying the node.
    /// * `event_map` - Shared map containing upload events.
    ///
    /// # Returns
    ///
    /// * `Self` - A new `UploadEventConsumer` instance.
    ///
    /// # Examples
    ///
    /// ```rust
    /// use std::sync::Arc;
    /// use dashmap::DashMap;
    /// use solana_sdk::{pubkey::Pubkey, commitment_config::CommitmentConfig};
    /// use crate::data_upload_event::{EventListenerConfig, EventMap, UploadEventConsumer};
    ///
    /// #[tokio::main]
    /// async fn main() {
    ///     let config = EventListenerConfig {
    ///         ws_url: "ws://api.mainnet-beta.solana.com".to_string(),
    ///         http_url: "https://api.mainnet-beta.solana.com".to_string(),
    ///         program_id: Pubkey::new_unique(),
    ///         node_pubkey: Pubkey::new_unique(),
    ///         commitment: CommitmentConfig::confirmed(),
    ///     };
    ///     let event_map: EventMap = Arc::new(DashMap::new());
    ///     let consumer = UploadEventConsumer::new(config, event_map).await;
    /// }
    /// ```
    pub async fn new(config: EventListenerConfig, event_map: EventMap) -> Self {
        let rpc_client = Arc::new(RpcClient::new(config.http_url.clone()));
        Self {
            config,
            event_map,
            rpc_client,
        }
    }

    /// Starts the event consumer, periodically cleaning up old events.
    ///
    /// Runs a loop that removes events older than 24 hours from the `EventMap` and sleeps
    /// to prevent a tight loop.
    ///
    /// # Returns
    ///
    /// * `Result<(), ApiError>` - Returns `Ok(())` if the consumer runs successfully,
    ///   or an `ApiError` if an error occurs (though none are currently defined).
    ///
    /// # Workflow
    ///
    /// 1. **Event Cleanup**: Removes events from the `EventMap` where the timestamp is
    ///    older than 24 hours.
    /// 2. **Sleep**: Pauses for 200ms to avoid excessive CPU usage.
    ///
    /// # Examples
    ///
    /// ```rust
    /// use std::sync::Arc;
    /// use dashmap::DashMap;
    /// use solana_sdk::{pubkey::Pubkey, commitment_config::CommitmentConfig};
    /// use crate::data_upload_event::{EventListenerConfig, EventMap, UploadEventConsumer};
    ///
    /// #[tokio::main]
    /// async fn main() {
    ///     let config = EventListenerConfig {
    ///         ws_url: "ws://api.mainnet-beta.solana.com".to_string(),
    ///         http_url: "https://api.mainnet-beta.solana.com".to_string(),
    ///         program_id: Pubkey::new_unique(),
    ///         node_pubkey: Pubkey::new_unique(),
    ///         commitment: CommitmentConfig::confirmed(),
    ///     };
    ///     let event_map: EventMap = Arc::new(DashMap::new());
    ///     let consumer = UploadEventConsumer::new(config, event_map).await;
    ///     consumer.start().await.unwrap();
    /// }
    /// ```
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

    /// Verifies the validity of an upload event.
    ///
    /// Checks that the node is registered with the program and that the escrow account
    /// associated with the event has a non-zero balance, indicating a valid payment.
    ///
    /// # Arguments
    ///
    /// * `event` - The `UploadEvent` to verify.
    ///
    /// # Returns
    ///
    /// * `Result<(), ApiError>` - Returns `Ok(())` if the event is valid, or an
    ///   `ApiError` (`NodeNotRegistered` or `PaymentNotVerified`) if verification fails.
    ///
    /// # Workflow
    ///
    /// 1. **Node Registration Check**: Queries the Solana blockchain to verify that the
    ///    node's account exists and is owned by the program ID.
    /// 2. **Escrow Account Check**: Derives the escrow PDA using the event's data hash
    ///    and payer, then checks that the escrow account has a non-zero lamport balance.
    /// 3. **Slashing Report**: Logs a message if the escrow account is empty, indicating
    ///    a potential slashing condition for the payer.
    ///
    /// # Errors
    ///
    /// - `ApiError::NodeNotRegistered`: If the node's account does not exist or is not
    ///   owned by the program.
    /// - `ApiError::PaymentNotVerified`: If the escrow account does not exist or has
    ///   zero lamports.
    ///
    /// # Examples
    ///
    /// ```rust
    /// use std::sync::Arc;
    /// use dashmap::DashMap;
    /// use solana_sdk::{pubkey::Pubkey, commitment_config::CommitmentConfig};
    /// use crate::data_upload_event::{EventListenerConfig, EventMap, UploadEventConsumer, UploadEvent};
    ///
    /// #[tokio::main]
    /// async fn main() {
    ///     let config = EventListenerConfig {
    ///         ws_url: "ws://api.mainnet-beta.solana.com".to_string(),
    ///         http_url: "https://api.mainnet-beta.solana.com".to_string(),
    ///         program_id: Pubkey::new_unique(),
    ///         node_pubkey: Pubkey::new_unique(),
    ///         commitment: CommitmentConfig::confirmed Memphis,
    ///     };
    ///     let event_map: EventMap = Arc::new(DashMap::new());
    ///     let consumer = UploadEventConsumer::new(config, event_map).await;
    ///     let event = UploadEvent {
    ///         upload_pda: Pubkey::new_unique(),
    ///         data_hash: "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e".to_string(),
    ///         size_bytes: 1024,
    ///         shard_count: 2,
    ///         payer: Pubkey::new_unique(),
    ///         nodes: vec![Pubkey::new_unique()],
    ///         storage_duration_days: 30,
    ///         timestamp: 1697059200,
    ///     };
    ///     consumer.verify_event(&event).await.unwrap();
    /// }
    /// ```
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
