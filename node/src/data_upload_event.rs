/// This module implements event listening and processing for upload events in a decentralized
/// storage network. It integrates with the Solana blockchain to subscribe to transaction logs,
/// parse upload events, and verify payments. The module includes the `UploadEventListener` for
/// capturing events and the `UploadEventConsumer` for validating and managing them.
use base64::Engine;
use dashmap::DashMap;
use log::{debug, error, info, trace, warn};
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
    pub upload_pda: Pubkey,         // Program-derived address for the upload
    pub data_hash: String,          // SHA-256 hash of the uploaded data
    pub size_bytes: u64,            // Size of the data in bytes
    pub shard_count: u8,            // Number of shards for the data
    pub payer: Pubkey,              // Public key of the payer
    pub nodes: Vec<Pubkey>,         // List of node public keys assigned to store the data
    pub storage_duration_days: u64, // Duration for which the data should be stored
    pub timestamp: i64,             // Unix timestamp of the event
}

/// Configuration for the event listener and consumer.
///
/// Holds connection details and identifiers needed to interact with the Solana blockchain
/// and process events.
#[derive(Debug, Clone)]
pub struct EventListenerConfig {
    pub ws_url: String,               // WebSocket URL for Solana RPC
    pub http_url: String,             // HTTP URL for Solana RPC
    pub program_id: Pubkey,           // Solana program ID
    pub node_pubkey: Pubkey,          // Public key of the current node
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
    config: EventListenerConfig, // Configuration for the listener
    event_map: EventMap,         // Shared map for storing events
}

impl UploadEventListener {
    /// Creates a new `UploadEventListener` instance.
    ///
    /// Initializes the listener with the provided configuration and shared event map.
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
        trace!(
            "Initializing UploadEventListener with ws_url: {}",
            config.ws_url
        );
        let listener = Self { config, event_map };
        debug!(
            "UploadEventListener initialized for node: {}",
            listener.config.node_pubkey
        );
        listener
    }

    /// Starts the event listener, subscribing to Solana transaction logs.
    ///
    /// Sets up a WebSocket subscription to capture transaction logs for the program ID,
    /// processes incoming logs, and stores relevant upload events in the `EventMap`.
    ///
    /// # Returns
    ///
    /// * `Result<(), ApiError>` - `Ok(())` if the listener runs successfully,
    ///   or `ApiError::SubscriptionFailed` if the subscription fails.
    ///
    /// # Workflow
    ///
    /// 1. **Subscription Setup**: Establishes a WebSocket connection to subscribe to logs
    ///    mentioning the program ID.
    /// 2. **Log Processing**: Parses logs for "Program data:" entries to extract upload events.
    /// 3. **Event Storage**: Stores events in the `EventMap` if the current node is assigned.
    ///
    /// # Errors
    ///
    /// * `ApiError::SubscriptionFailed` - If the WebSocket subscription fails or disconnects.
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
        info!(
            "Starting UploadEventListener for program: {}",
            self.config.program_id
        );
        // Configure logs subscription
        let filter = RpcTransactionLogsFilter::Mentions(vec![self.config.program_id.to_string()]);
        let logs_config = RpcTransactionLogsConfig {
            commitment: Some(self.config.commitment.clone()),
        };
        trace!(
            "Configuring WebSocket subscription with filter for program: {}",
            self.config.program_id
        );

        // Establish WebSocket subscription
        let (_sub, stream) = solana_client::pubsub_client::PubsubClient::logs_subscribe(
            &self.config.ws_url,
            filter,
            logs_config,
        )
        .map_err(|e| {
            error!("Failed to establish WebSocket subscription: {}", e);
            ApiError::SubscriptionFailed
        })?;
        info!(
            "WebSocket subscription established for program: {}",
            self.config.program_id
        );

        // Process incoming log messages
        loop {
            match stream.try_recv() {
                Ok(response) => {
                    trace!("Received log response");
                    // Handle received log response
                    if let Err(e) = self.process_log_response(response).await {
                        warn!("Error processing log response: {}", e);
                        continue;
                    }
                }
                Err(crossbeam_channel::TryRecvError::Empty) => {
                    // No messages, continue polling
                    trace!("No new log messages available");
                    continue;
                }
                Err(crossbeam_channel::TryRecvError::Disconnected) => {
                    error!("WebSocket subscription disconnected");
                    return Err(ApiError::SubscriptionFailed);
                }
            }
        }
    }

    /// Processes a log response from the Solana subscription.
    ///
    /// Parses transaction logs for "Program data:" entries, extracts upload events,
    /// and stores them in the `EventMap` if the current node is assigned.
    ///
    /// # Arguments
    ///
    /// * `response` - The log response from the Solana WebSocket subscription.
    ///
    /// # Returns
    ///
    /// * `Result<(), ApiError>` - `Ok(())` if processed successfully, or an `ApiError`
    ///   if parsing fails.
    async fn process_log_response(
        &self,
        response: solana_client::rpc_response::Response<
            solana_client::rpc_response::RpcLogsResponse,
        >,
    ) -> Result<(), ApiError> {
        let logs_response = response.value;
        debug!(
            "Processing log response with {} logs",
            logs_response.logs.len()
        );

        // Iterate through logs to find upload events
        for log in logs_response.logs {
            if log.contains("Program data:") {
                trace!("Found log with Program data");
                if let Some(event) = self.parse_upload_event(&log).await {
                    debug!("Parsed upload event for upload_pda: {}", event.upload_pda);
                    // Store event if this node is in the node list
                    if event.nodes.contains(&self.config.node_pubkey) {
                        info!(
                            "Storing event for upload_pda: {} (node assigned)",
                            event.upload_pda
                        );
                        self.event_map.insert(event.upload_pda, event);
                    } else {
                        debug!(
                            "Skipping event for upload_pda: {} (node not assigned)",
                            event.upload_pda
                        );
                    }
                } else {
                    warn!("Failed to parse upload event from log: {}", log);
                }
            }
        }

        Ok(())
    }

    /// Parses an upload event from a transaction log.
    ///
    /// Decodes base64-encoded event data from the log and deserializes it into an
    /// `UploadEvent` struct.
    ///
    /// # Arguments
    ///
    /// * `log` - The transaction log string containing "Program data:".
    ///
    /// # Returns
    ///
    /// * `Option<UploadEvent>` - `Some(UploadEvent)` if parsing succeeds, `None` otherwise.
    async fn parse_upload_event(&self, log: &str) -> Option<UploadEvent> {
        trace!("Parsing upload event from log");
        // Extract base64 data from log
        let base64_data = match log.strip_prefix("Program data: ") {
            Some(data) => data.trim(),
            None => {
                warn!("Log does not start with 'Program data:': {}", log);
                return None;
            }
        };

        let decoded_data = match base64::prelude::BASE64_STANDARD.decode(base64_data) {
            Ok(data) => {
                debug!("Successfully decoded base64 data, length: {}", data.len());
                data
            }
            Err(e) => {
                warn!("Failed to decode base64 data: {}", e);
                return None;
            }
        };

        // Validate data length
        if decoded_data.len() < 8 {
            warn!("Decoded data too short: {} bytes", decoded_data.len());
            return None;
        }

        // Deserialize event data
        let event_data = &decoded_data[8..];
        match bincode::deserialize::<UploadEvent>(event_data) {
            Ok(event) => {
                info!(
                    "Successfully parsed upload event for upload_pda: {}",
                    event.upload_pda
                );
                Some(event)
            }
            Err(e) => {
                warn!("Failed to deserialize upload event: {}", e);
                None
            }
        }
    }
}

/// Consumes and validates upload events from the `EventMap`.
///
/// `UploadEventConsumer` periodically cleans up old events and provides a method to
/// verify the validity of events, ensuring node registration and payment in the escrow
/// account.
pub struct UploadEventConsumer {
    config: EventListenerConfig, // Configuration for the consumer
    event_map: EventMap,         // Shared map of upload events
    rpc_client: Arc<RpcClient>,  // Solana RPC client for account queries
}

impl UploadEventConsumer {
    /// Creates a new `UploadEventConsumer` instance.
    ///
    /// Initializes the consumer with the provided configuration, event map, and RPC client.
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
        trace!(
            "Initializing UploadEventConsumer with http_url: {}",
            config.http_url
        );
        let rpc_client = Arc::new(RpcClient::new(config.http_url.clone()));
        let consumer = Self {
            config,
            event_map,
            rpc_client,
        };
        debug!(
            "UploadEventConsumer initialized for node: {}",
            consumer.config.node_pubkey
        );
        consumer
    }

    /// Starts the event consumer, periodically cleaning up old events.
    ///
    /// Removes events older than 24 hours from the `EventMap` and sleeps to avoid
    /// excessive CPU usage.
    ///
    /// # Returns
    ///
    /// * `Result<(), ApiError>` - `Ok(())` if the consumer runs successfully.
    ///
    /// # Workflow
    ///
    /// 1. **Event Cleanup**: Removes events with timestamps older than 24 hours.
    /// 2. **Sleep**: Pauses for 200ms to prevent tight looping.
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
        info!(
            "Starting UploadEventConsumer for program: {}",
            self.config.program_id
        );
        loop {
            trace!("Cleaning up old events");
            // Clean up events older than 24 hours
            let before_count = self.event_map.len();
            self.event_map.retain(|_, event| {
                let age = std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_secs() as i64
                    - event.timestamp;
                age < 24 * 3600 // Retain events for 24 hours
            });
            let after_count = self.event_map.len();
            debug!(
                "Cleaned up events: {} removed, {} remaining",
                before_count - after_count,
                after_count
            );

            // Sleep to prevent tight loop
            trace!("Sleeping for 200ms");
            tokio::time::sleep(Duration::from_millis(200)).await;
        }
    }

    /// Verifies the validity of an upload event.
    ///
    /// Ensures the node is registered and the escrow account has a non-zero balance.
    ///
    /// # Arguments
    ///
    /// * `event` - The `UploadEvent` to verify.
    ///
    /// # Returns
    ///
    /// * `Result<(), ApiError>` - `Ok(())` if the event is valid, or `ApiError`
    ///   (`NodeNotRegistered` or `PaymentNotVerified`) if verification fails.
    ///
    /// # Workflow
    ///
    /// 1. **Node Registration**: Checks if the node's account exists and is owned by the program.
    /// 2. **Escrow Verification**: Derives the escrow PDA and verifies a non-zero balance.
    /// 3. **Slashing Report**: Logs a message if the escrow account is empty.
    ///
    /// # Errors
    ///
    /// * `ApiError::NodeNotRegistered` - If the node is not registered.
    /// * `ApiError::PaymentNotVerified` - If the escrow account is empty or does not exist.
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
    ///         commitment: CommitmentConfig::confirmed(),
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
        trace!(
            "Verifying upload event for upload_pda: {}",
            event.upload_pda
        );
        // Check node registration
        trace!(
            "Checking node registration for pubkey: {}",
            self.config.node_pubkey
        );
        let node_account = self
            .rpc_client
            .get_account(&self.config.node_pubkey)
            .await
            .map_err(|e| {
                error!(
                    "Failed to fetch node account {}: {}",
                    self.config.node_pubkey, e
                );
                ApiError::NodeNotRegistered
            })?;
        if node_account.owner != self.config.program_id {
            error!(
                "Node {} is not registered with program {}",
                self.config.node_pubkey, self.config.program_id
            );
            return Err(ApiError::NodeNotRegistered);
        }
        debug!("Node {} is registered", self.config.node_pubkey);

        // Verify escrow account balance
        trace!("Deriving escrow PDA for data_hash: {}", event.data_hash);
        let escrow_seeds = [b"escrow", event.data_hash.as_bytes(), event.payer.as_ref()];
        let (escrow_pda, _bump) =
            Pubkey::find_program_address(&escrow_seeds, &self.config.program_id);
        trace!("Fetching escrow account: {}", escrow_pda);
        let escrow_account = self
            .rpc_client
            .get_account(&escrow_pda)
            .await
            .map_err(|e| {
                error!("Failed to fetch escrow account {}: {}", escrow_pda, e);
                ApiError::PaymentNotVerified
            })?;

        // Check for non-zero balance
        if escrow_account.lamports == 0 {
            warn!(
                "Escrow account {} has zero balance for payer {}",
                escrow_pda, event.payer
            );
            info!("Reporting payer {} for slashing: no payment", event.payer);
            return Err(ApiError::PaymentNotVerified);
        }
        info!(
            "Verified escrow account {} with balance: {} lamports",
            escrow_pda, escrow_account.lamports
        );

        info!(
            "Upload event verified successfully for upload_pda: {}",
            event.upload_pda
        );
        Ok(())
    }
}
