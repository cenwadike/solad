/*!
# Solana Generic Event Listener

This module provides a generic, reusable event listener for the Solana blockchain, enabling
real-time monitoring and processing of various event types, such as transaction logs, slot
updates, account changes, and block updates. The `GenericEventListener` struct is the core
component, offering a flexible and thread-safe framework for handling events emitted by
Solana programs or the blockchain itself.

## Purpose

The `GenericEventListener` is designed for Solana-based applications and services that need to subscribe
to blockchain events and process them efficiently. It supports multiple subscription types
through WebSocket connections, stores events with timestamps in a thread-safe `DashMap`, and
provides customizable callbacks and fallbacks for event processing. The listener is generic
over any event type implementing the `SolanaEvent` trait, making it adaptable to custom
event structures.

## Key Features

- **Multiple Subscription Types**: Supports subscriptions to transaction logs, slot updates,
  account changes, block updates, and program-specific events via Solana's WebSocket API.
- **Thread-Safe Storage**: Uses an `Arc<DashMap<String, (T, SystemTime)>>` to store events
  with their creation timestamps, ensuring concurrent access and efficient cleanup.
- **Customizable Processing**: Allows developers to define callbacks for event processing
  and fallbacks for error handling, enabling tailored logic for specific use cases.
- **Periodic Cleanup**: The `start_cleanup` method removes events older than a specified
  `max_age`, preventing memory growth and maintaining performance.
- **Robust Error Handling**: Defines `EventListenerError` for subscription, deserialization,
  processing, validation, and connection errors, with detailed diagnostics.
- **Retry Mechanism**: Automatically retries failed subscriptions with configurable
  intervals and attempt limits.

## Usage

The `GenericEventListener` is part of SoLad; a decentralized storage networks. Useful for
DeFi protocols, or NFT marketplaces that require real-time event monitoring. To use it:

1. Define a custom event type implementing `SolanaEvent`.
2. Configure the listener with Solana RPC endpoints and subscription settings.
3. Set optional callbacks (e.g., using `DataClient::set_data` to send event data to a SoLad node)
   and fallbacks for error handling.
4. Start the listener and cleanup task to process and manage events.

### Example: Basic Usage with Transaction Logs and DataClient

This example shows how to use the listener to process transaction log events and send them
to a server using `DataClient::set_data` as the callback.

```rust
use solana_sdk::{pubkey::Pubkey, commitment_config::CommitmentConfig};
use std::sync::Arc;
use dashmap::DashMap;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::time::Duration;
use crate::DataClient; // Assuming DataClient is in the same crate
use crate::model::SetData; // Assuming SetData is defined in the model module

#[derive(Clone, Debug, Serialize, Deserialize)]
struct MyEvent {
    id: String,
    data: String,
}

impl SolanaEvent for MyEvent {
    fn id(&self) -> String {
        self.id.clone()
    }
}

#[tokio::main]
async fn main() {
    env_logger::init();
    let config = EventListenerConfig {
        ws_url: "ws://localhost:8900".to_string(),
        http_url: "http://localhost:8899".to_string(),
        program_id: Some(Pubkey::new_unique()),
        commitment: CommitmentConfig::confirmed(),
        retry_interval: Duration::from_secs(5,),
        retry_attempts: 5,
    };
    let event_map: EventMap<MyEvent> = Arc::new(DashMap::new());
    let data_client = Arc::new(DataClient::new("http://localhost:8080"));
    let mut listener = GenericEventListener::new(config, event_map, SubscriptionType::Logs)
        .with_callback({
            let data_client = data_client.clone();
            move |event: &MyEvent| {
                let rt = tokio::runtime::Runtime::new().unwrap();
                rt.block_on(async {
                    let set_data = SetData {
                        key: event.id.clone(),
                        value: event.data.clone(),
                        // Add other fields as required by SetData
                    };
                    match data_client.set_data(&set_data).await {
                        Ok(value) => {
                            println!("Event {} sent to server: {:?}", event.id, value);
                            Ok(())
                        }
                        Err(e) => Err(EventListenerError::ProcessingFailed(format!("Failed to set data: {:?}", e))),
                    }
                })
            }
        })
        .with_fallback(|event: &MyEvent, err: &EventListenerError| {
            eprintln!("Failed to process event {}: {:?}", event.id, err);
            Ok(())
        });
    listener.start().await.unwrap();
    let cleanup_handle = listener.start_cleanup(Duration::from_secs(3600)).await;
    tokio::time::sleep(Duration::from_secs(300)).await;
    listener.stop().await;
    cleanup_handle.await.unwrap();
}
```

### Example: Monitoring Data Upload Events with DataClient

This example demonstrates using the listener for a decentralized storage application,
tracking data upload events and sending them to a server using `DataClient::set_data` with
validation.

```rust
use solana_sdk::{pubkey::Pubkey, commitment_config::CommitmentConfig};
use std::sync::Arc;
use dashmap::DashMap;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::time::Duration;
use crate::DataClient; // Assuming DataClient is in the same crate
use crate::model::SetData; // Assuming SetData is defined in the model module

#[derive(Clone, Debug, Serialize, Deserialize)]
struct DataUploadEvent {
    upload_pda: Pubkey,
    data_hash: String,
    size_bytes: u64,
}

impl SolanaEvent for DataUploadEvent {
    fn id(&self) -> String {
        self.upload_pda.to_string()
    }

    fn validate(&self) -> bool {
        !self.data_hash.is_empty() && self.size_bytes > 0
    }
}

#[tokio::main]
async fn main() {
    env_logger::init();
    let config = EventListenerConfig {
        ws_url: "ws://localhost:8900".to_string(),
        http_url: "http://localhost:8899".to_string(),
        program_id: Some(Pubkey::new_unique()),
        commitment: CommitmentConfig::confirmed(),
        retry_interval: Duration::from_secs(5),
        retry_attempts: 5,
    };
    let event_map: EventMap<DataUploadEvent> = Arc::new(DashMap::new());
    let data_client = Arc::new(DataClient::new("http://localhost:8080"));
    let mut listener = GenericEventListener::new(config, event_map, SubscriptionType::Program)
        .with_callback({
            let data_client = data_client.clone();
            move |event: &DataUploadEvent| {
                if event.validate() {
                    let rt = tokio::runtime::Runtime::new().unwrap();
                    rt.block_on(async {
                        let set_data = SetData {
                            key: event.upload_pda.to_string(),
                            value: format!("hash={},size={}", event.data_hash, event.size_bytes),
                            // Add other fields as required by SetData
                        };
                        match data_client.set_data(&set_data).await {
                            Ok(value) => {
                                println!("Upload event {} sent to server: {:?}", event.upload_pda, value);
                                Ok(())
                            }
                            Err(e) => Err(EventListenerError::ProcessingFailed(format!("Failed to set data: {:?}", e))),
                        }
                    })
                } else {
                    Err(EventListenerError::ValidationFailed("Invalid event data".to_string()))
                }
            }
        })
        .with_fallback(|event: &DataUploadEvent, err: &EventListenerError| {
            eprintln!("Failed to process upload {}: {:?}", event.upload_pda, err);
            Ok(())
        });
    listener.start().await.unwrap();
    let cleanup_handle = listener.start_cleanup(Duration::from_secs(3600)).await;
    tokio::time::sleep(Duration::from_secs(300)).await;
    listener.stop().await;
    cleanup_handle.await.unwrap();
}
```

## Integration with Solana

The listener uses the `solana-client` crate for non-blocking RPC and WebSocket interactions,
supporting configurable commitment levels (`confirmed`, `finalized`, etc.) and
program-specific filtering. It handles event deserialization from JSON or base64-encoded
data, making it versatile for various Solana program outputs.

## Integration with DataClient

The `DataClient` is used in the callback to send event data to a server via the `set_data`
method, which expects a `SetData` struct. The examples assume `SetData` has fields like
`key` and `value` (and possibly others), which are populated from the event data. Errors
from `set_data` are converted to `EventListenerError::ProcessingFailed` for consistency.

## Event Cleanup

The `start_cleanup` method runs periodically (every 60 seconds) to remove events older
than `max_age` from the `EventMap`, using the stored `SystemTime` to calculate event age.
This ensures efficient memory usage without requiring changes to the `SolanaEvent` trait.

## Dependencies

- `solana-client`: For RPC and WebSocket communication.
- `dashmap`: For thread-safe event storage.
- `serde`: For event deserialization.
- `tokio`: For asynchronous tasks.
- `log`: For structured logging.
- `thiserror`: For error handling.
- `base64`: For decoding log data.
- `reqwest`: For HTTP requests via `DataClient`.
- `serde_json`: For JSON handling in `DataClient`.

This module is well-suited for Solana developers building applications that demand robust,
real-time event monitoring with flexible processing, such as sending event data to a server
using `DataClient`.
*/
use base64::prelude::Engine as _;
use dashmap::DashMap;
use log::{debug, error, info, trace, warn};
use serde::de::DeserializeOwned;
use solana_client::{
    nonblocking::rpc_client::RpcClient,
    pubsub_client::{PubsubClient, PubsubClientSubscription},
    rpc_config::{
        RpcBlockSubscribeConfig, RpcBlockSubscribeFilter, RpcTransactionLogsConfig,
        RpcTransactionLogsFilter,
    },
    rpc_response::{Response, RpcLogsResponse},
};
use solana_program::pubkey::Pubkey;
use solana_sdk::commitment_config::CommitmentConfig;
use std::fmt::Debug;
use std::sync::Arc;
use std::time::Duration;
use thiserror::Error;
use tokio::task::JoinHandle;
use tokio::time::timeout;

/// Generic error type for the event listener
#[derive(Error, Debug)]
pub enum EventListenerError {
    #[error("Failed to establish subscription: {0}")]
    SubscriptionFailed(String),

    #[error("Failed to deserialize event: {0}")]
    DeserializationFailed(String),

    #[error("Event processing error: {0}")]
    ProcessingFailed(String),

    #[error("Validation failed: {0}")]
    ValidationFailed(String),

    #[error("Connection error: {0}")]
    ConnectionError(String),
}

/// Trait for events that can be processed by the event listener
pub trait SolanaEvent: Send + Sync + Clone + Debug {
    /// Get a unique identifier for the event
    fn id(&self) -> String;

    /// Validate the event
    fn validate(&self) -> bool {
        true
    }
}

/// Configuration for the event listener
#[derive(Debug, Clone)]
pub struct EventListenerConfig {
    pub ws_url: String,               // WebSocket URL for Solana RPC
    pub http_url: String,             // HTTP URL for Solana RPC
    pub program_id: Option<Pubkey>,   // Optional Solana program ID to filter events
    pub commitment: CommitmentConfig, // Commitment level for blockchain operations
    pub retry_interval: Duration,     // Interval to retry connection if failed
    pub retry_attempts: usize,        // Maximum number of retry attempts
}

impl Default for EventListenerConfig {
    fn default() -> Self {
        Self {
            ws_url: "ws://localhost:8900".to_string(),
            http_url: "http://localhost:8899".to_string(),
            program_id: None,
            commitment: CommitmentConfig::confirmed(),
            retry_interval: Duration::from_secs(5),
            retry_attempts: 5,
        }
    }
}

/// Thread-safe map for storing events
pub type EventMap<T> = Arc<DashMap<String, (T, std::time::SystemTime)>>;

/// Event subscription types supported by the generic listener
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SubscriptionType {
    Logs,
    Slots,
    Accounts,
    Blocks,
    Program,
}

/// Callback type for event processing
pub type EventCallback<T> = Arc<dyn Fn(&T) -> Result<(), EventListenerError> + Send + Sync>;

/// Fallback type for event processing when main processing fails
pub type EventFallback<T> =
    Arc<dyn Fn(&T, &EventListenerError) -> Result<(), EventListenerError> + Send + Sync>;

/// Generic Solana event listener capable of handling multiple event types
pub struct GenericEventListener<T: SolanaEvent + DeserializeOwned + 'static> {
    config: EventListenerConfig,
    event_map: EventMap<T>, // Now Arc<DashMap<String, (T, SystemTime)>>
    callback: Option<EventCallback<T>>,
    fallback: Option<EventFallback<T>>,
    subscription_type: SubscriptionType,
    rpc_client: Arc<RpcClient>,
    is_running: bool,
    subscription_tasks: Vec<JoinHandle<()>>,
}

impl<T: SolanaEvent + DeserializeOwned + 'static> GenericEventListener<T> {
    /// Creates a new GenericEventListener instance
    pub fn new(
        config: EventListenerConfig,
        event_map: EventMap<T>,
        subscription_type: SubscriptionType,
    ) -> Self {
        let rpc_client = Arc::new(RpcClient::new(config.http_url.clone()));

        Self {
            config,
            event_map,
            callback: None,
            fallback: None,
            subscription_type,
            rpc_client,
            is_running: false,
            subscription_tasks: Vec::new(),
        }
    }

    /// Set a callback function for event processing
    pub fn with_callback(
        mut self,
        callback: impl Fn(&T) -> Result<(), EventListenerError> + Send + Sync + 'static,
    ) -> Self {
        self.callback = Some(Arc::new(callback));
        self
    }

    /// Set a fallback function for handling events when processing fails
    pub fn with_fallback(
        mut self,
        fallback: impl Fn(&T, &EventListenerError) -> Result<(), EventListenerError>
            + Send
            + Sync
            + 'static,
    ) -> Self {
        self.fallback = Some(Arc::new(fallback));
        self
    }

    /// Starts the event listener
    pub async fn start(&mut self) -> Result<(), EventListenerError> {
        if self.is_running {
            warn!("Event listener is already running");
            return Ok(());
        }

        info!(
            "Starting event listener for subscription type: {:?}",
            self.subscription_type
        );

        match self.subscription_type {
            SubscriptionType::Logs => self.start_logs_subscription().await?,
            SubscriptionType::Slots => self.start_slots_subscription().await?,
            SubscriptionType::Accounts => self.start_accounts_subscription().await?,
            SubscriptionType::Blocks => self.start_blocks_subscription().await?,
            SubscriptionType::Program => {
                if self.config.program_id.is_none() {
                    return Err(EventListenerError::SubscriptionFailed(
                        "Program ID is required for Program subscription".to_string(),
                    ));
                }
                self.start_program_subscription().await?
            }
        }

        self.is_running = true;
        Ok(())
    }

    /// Stops the event listener
    pub async fn stop(&mut self) {
        if !self.is_running {
            warn!("Event listener is not running");
            return;
        }

        info!("Stopping event listener");
        for task in self.subscription_tasks.drain(..) {
            task.abort();
        }

        self.is_running = false;
    }

    /// Process an event - calls the callback if defined, else stores in event map
    async fn process_event(&self, event: T) -> Result<(), EventListenerError> {
        trace!("Processing event: {:?}", event);

        // Store the event in the map with its creation timestamp
        let event_id = event.id();
        self.event_map.insert(
            event_id.clone(),
            (event.clone(), std::time::SystemTime::now()),
        );
        debug!("Event stored in map with ID: {}", event_id);

        // If callback is provided, invoke it
        if let Some(callback) = &self.callback {
            match callback(&event) {
                Ok(_) => {
                    debug!("Event callback executed successfully for ID: {}", event_id);
                    Ok(())
                }
                Err(err) => {
                    warn!("Event callback failed for ID: {}: {:?}", event_id, err);
                    // Try fallback if available
                    if let Some(fallback) = &self.fallback {
                        debug!("Executing fallback for event ID: {}", event_id);
                        fallback(&event, &err)
                    } else {
                        Err(err)
                    }
                }
            }
        } else {
            // No callback defined, just store in map (already done above)
            Ok(())
        }
    }

    /// Parse event from log data (for log subscriptions)
    async fn parse_event(&self, log: &str) -> Option<T> {
        trace!("Parsing event from log: {}", log);

        // Extract data part from log
        let data = if log.contains("Program data: ") {
            match log.strip_prefix("Program data: ") {
                Some(data) => data.trim(),
                None => {
                    warn!("Log does not start with 'Program data:': {}", log);
                    return None;
                }
            }
        } else {
            // Handle other log formats or return the whole log for parsing
            log
        };

        // Attempt to deserialize using various methods
        match serde_json::from_str::<T>(data) {
            Ok(event) => {
                debug!("Successfully parsed event using JSON");
                return Some(event);
            }
            Err(_) => {
                trace!("Failed to parse as JSON, trying base64");
                // Try base64 decode if applicable
                if let Ok(decoded) = base64::prelude::BASE64_STANDARD.decode(data) {
                    if !decoded.is_empty() {
                        // Try bincode deserialization
                        if let Ok(event) = bincode::deserialize::<T>(&decoded) {
                            debug!("Successfully parsed event using bincode");
                            return Some(event);
                        }

                        // If decoded successfully but bincode failed, try JSON on the decoded data
                        if let Ok(json_str) = String::from_utf8(decoded) {
                            if let Ok(event) = serde_json::from_str::<T>(&json_str) {
                                debug!("Successfully parsed event from decoded JSON");
                                return Some(event);
                            }
                        }
                    }
                }
            }
        }

        warn!("Failed to parse event from log");
        None
    }

    /// Start log subscription for transaction logs
    async fn start_logs_subscription(&mut self) -> Result<(), EventListenerError> {
        info!("Starting logs subscription");

        let filter = match &self.config.program_id {
            Some(program_id) => RpcTransactionLogsFilter::Mentions(vec![program_id.to_string()]),
            None => RpcTransactionLogsFilter::All,
        };

        let logs_config = RpcTransactionLogsConfig { commitment: None };

        let config = self.config.clone();
        let event_map = self.event_map.clone();
        let callback = self.callback.clone();
        let fallback = self.fallback.clone();
        let client = self.rpc_client.clone();

        let task = tokio::spawn(async move {
            let mut retry_count = 0;

            loop {
                match Self::subscribe_logs(&config.ws_url, filter.clone(), logs_config.clone())
                    .await
                {
                    Ok((subscription, stream)) => {
                        info!("Logs subscription established");
                        retry_count = 0;

                        // Process incoming log messages
                        loop {
                            match timeout(Duration::from_millis(500), async { stream.try_recv() })
                                .await
                            {
                                Ok(Ok(response)) => {
                                    trace!("Received log response");
                                    let logs_response = response.value;

                                    for log in logs_response.logs {
                                        let this = GenericEventListener {
                                            config: config.clone(),
                                            event_map: event_map.clone(),
                                            callback: callback.clone(),
                                            fallback: fallback.clone(),
                                            subscription_type: SubscriptionType::Logs,
                                            rpc_client: client.clone(),
                                            is_running: true,
                                            subscription_tasks: vec![],
                                        };

                                        if let Some(event) = this.parse_event(&log).await {
                                            if let Err(e) = this.process_event(event).await {
                                                warn!("Error processing log event: {:?}", e);
                                            }
                                        }
                                    }
                                }
                                Ok(Err(crossbeam_channel::TryRecvError::Empty)) => {
                                    trace!("No new log messages available");
                                }
                                Ok(Err(crossbeam_channel::TryRecvError::Disconnected)) => {
                                    error!("WebSocket subscription disconnected");
                                    break;
                                }
                                Err(_) => {
                                    trace!("Timeout waiting for log message");
                                }
                            }
                            tokio::time::sleep(Duration::from_millis(100)).await;
                        }

                        // Try to unsubscribe gracefully
                        let _ = subscription.send_unsubscribe();
                    }
                    Err(e) => {
                        retry_count += 1;
                        error!("Failed to establish logs subscription: {}", e);

                        if retry_count >= config.retry_attempts {
                            error!("Max retry attempts reached, giving up");
                            break;
                        }

                        info!("Retrying in {:?}...", config.retry_interval);
                        tokio::time::sleep(config.retry_interval).await;
                    }
                }
            }
        });

        self.subscription_tasks.push(task);
        Ok(())
    }

    /// Start slot subscription for updates on new slots
    async fn start_slots_subscription(&mut self) -> Result<(), EventListenerError> {
        info!("Starting slots subscription");

        let config = self.config.clone();
        let event_map = self.event_map.clone();
        let callback = self.callback.clone();
        let fallback = self.fallback.clone();
        let client = self.rpc_client.clone();

        let task = tokio::spawn(async move {
            let mut retry_count = 0;

            loop {
                match PubsubClient::slot_subscribe(&config.ws_url) {
                    Ok((subscription, stream)) => {
                        info!("Slots subscription established");
                        retry_count = 0;

                        // Process incoming slot updates
                        loop {
                            match timeout(Duration::from_millis(500), async { stream.try_recv() })
                                .await
                            {
                                Ok(Ok(slot_update)) => {
                                    trace!("Received slot update: {:?}", slot_update);

                                    let this = GenericEventListener {
                                        config: config.clone(),
                                        event_map: event_map.clone(),
                                        callback: callback.clone(),
                                        fallback: fallback.clone(),
                                        subscription_type: SubscriptionType::Slots,
                                        rpc_client: client.clone(),
                                        is_running: true,
                                        subscription_tasks: vec![],
                                    };

                                    // Try to convert SlotUpdate to generic event T
                                    if let Ok(json_data) = serde_json::to_string(&slot_update) {
                                        if let Ok(event) = serde_json::from_str::<T>(&json_data) {
                                            if let Err(e) = this.process_event(event).await {
                                                warn!("Error processing slot event: {:?}", e);
                                            }
                                        }
                                    }
                                }
                                Ok(Err(crossbeam_channel::TryRecvError::Empty)) => {
                                    trace!("No new slot updates available");
                                }
                                Ok(Err(crossbeam_channel::TryRecvError::Disconnected)) => {
                                    error!("WebSocket subscription disconnected");
                                    break;
                                }
                                Err(_) => {
                                    trace!("Timeout waiting for slot update");
                                }
                            }
                            tokio::time::sleep(Duration::from_millis(100)).await;
                        }

                        // Try to unsubscribe gracefully
                        let _ = subscription.send_unsubscribe();
                    }
                    Err(e) => {
                        retry_count += 1;
                        error!("Failed to establish slots subscription: {}", e);

                        if retry_count >= config.retry_attempts {
                            error!("Max retry attempts reached, giving up");
                            break;
                        }

                        info!("Retrying in {:?}...", config.retry_interval);
                        tokio::time::sleep(config.retry_interval).await;
                    }
                }
            }
        });

        self.subscription_tasks.push(task);
        Ok(())
    }

    /// Start blocks subscription for updates on new blocks
    async fn start_blocks_subscription(&mut self) -> Result<(), EventListenerError> {
        info!("Starting blocks subscription");

        let config = self.config.clone();
        let event_map = self.event_map.clone();
        let callback = self.callback.clone();
        let fallback = self.fallback.clone();
        let client = self.rpc_client.clone();

        let block_config = RpcBlockSubscribeConfig {
            commitment: None,
            encoding: None,
            transaction_details: None,
            show_rewards: None,
            max_supported_transaction_version: None,
        };

        let task = tokio::spawn(async move {
            let mut retry_count = 0;

            loop {
                match PubsubClient::block_subscribe(
                    &config.ws_url,
                    RpcBlockSubscribeFilter::All,
                    Some(block_config.clone()),
                ) {
                    Ok((subscription, stream)) => {
                        info!("Blocks subscription established");
                        retry_count = 0;

                        // Process incoming block updates
                        loop {
                            match timeout(Duration::from_millis(500), async { stream.try_recv() })
                                .await
                            {
                                Ok(Ok(block_update)) => {
                                    trace!("Received block update");

                                    let this = GenericEventListener {
                                        config: config.clone(),
                                        event_map: event_map.clone(),
                                        callback: callback.clone(),
                                        fallback: fallback.clone(),
                                        subscription_type: SubscriptionType::Blocks,
                                        rpc_client: client.clone(),
                                        is_running: true,
                                        subscription_tasks: vec![],
                                    };

                                    // Try to convert RpcBlockUpdate to generic event T
                                    if let Ok(json_data) = serde_json::to_string(&block_update) {
                                        if let Ok(event) = serde_json::from_str::<T>(&json_data) {
                                            if let Err(e) = this.process_event(event).await {
                                                warn!("Error processing block event: {:?}", e);
                                            }
                                        }
                                    }
                                }
                                Ok(Err(crossbeam_channel::TryRecvError::Empty)) => {
                                    trace!("No new block updates available");
                                }
                                Ok(Err(crossbeam_channel::TryRecvError::Disconnected)) => {
                                    error!("WebSocket subscription disconnected");
                                    break;
                                }
                                Err(_) => {
                                    trace!("Timeout waiting for block update");
                                }
                            }
                            tokio::time::sleep(Duration::from_millis(100)).await;
                        }

                        // Try to unsubscribe gracefully
                        let _ = subscription.send_unsubscribe();
                    }
                    Err(e) => {
                        retry_count += 1;
                        error!("Failed to establish blocks subscription: {}", e);

                        if retry_count >= config.retry_attempts {
                            error!("Max retry attempts reached, giving up");
                            break;
                        }

                        info!("Retrying in {:?}...", config.retry_interval);
                        tokio::time::sleep(config.retry_interval).await;
                    }
                }
            }
        });

        self.subscription_tasks.push(task);
        Ok(())
    }

    /// Start accounts subscription for updates on account data
    async fn start_accounts_subscription(&mut self) -> Result<(), EventListenerError> {
        info!("Starting accounts subscription");

        if self.config.program_id.is_none() {
            return Err(EventListenerError::SubscriptionFailed(
                "Program ID is required for accounts subscription".to_string(),
            ));
        }

        let program_id: solana_program::pubkey::Pubkey = self.config.program_id.unwrap();
        let config = self.config.clone();
        let event_map = self.event_map.clone();
        let callback = self.callback.clone();
        let fallback = self.fallback.clone();
        let client = self.rpc_client.clone();

        let task = tokio::spawn(async move {
            let mut retry_count = 0;

            loop {
                match PubsubClient::program_subscribe(&config.ws_url, &program_id, None) {
                    Ok((subscription, stream)) => {
                        info!("Program accounts subscription established");
                        retry_count = 0;

                        // Process incoming account updates
                        loop {
                            match timeout(Duration::from_millis(500), async { stream.try_recv() })
                                .await
                            {
                                Ok(Ok(account_update)) => {
                                    trace!("Received account update");

                                    let this = GenericEventListener {
                                        config: config.clone(),
                                        event_map: event_map.clone(),
                                        callback: callback.clone(),
                                        fallback: fallback.clone(),
                                        subscription_type: SubscriptionType::Accounts,
                                        rpc_client: client.clone(),
                                        is_running: true,
                                        subscription_tasks: vec![],
                                    };

                                    // Try to convert RpcKeyedAccount to generic event T
                                    if let Ok(json_data) = serde_json::to_string(&account_update) {
                                        if let Ok(event) = serde_json::from_str::<T>(&json_data) {
                                            if let Err(e) = this.process_event(event).await {
                                                warn!("Error processing account event: {:?}", e);
                                            }
                                        }
                                    }
                                }
                                Ok(Err(crossbeam_channel::TryRecvError::Empty)) => {
                                    trace!("No new account updates available");
                                }
                                Ok(Err(crossbeam_channel::TryRecvError::Disconnected)) => {
                                    error!("WebSocket subscription disconnected");
                                    break;
                                }
                                Err(_) => {
                                    trace!("Timeout waiting for account update");
                                }
                            }
                            tokio::time::sleep(Duration::from_millis(100)).await;
                        }

                        // Try to unsubscribe gracefully
                        let _ = subscription.send_unsubscribe();
                    }
                    Err(e) => {
                        retry_count += 1;
                        error!("Failed to establish accounts subscription: {}", e);

                        if retry_count >= config.retry_attempts {
                            error!("Max retry attempts reached, giving up");
                            break;
                        }

                        info!("Retrying in {:?}...", config.retry_interval);
                        tokio::time::sleep(config.retry_interval).await;
                    }
                }
            }
        });

        self.subscription_tasks.push(task);
        Ok(())
    }

    /// Start program subscription for specific program events
    async fn start_program_subscription(&mut self) -> Result<(), EventListenerError> {
        // This is essentially a specialized form of accounts subscription
        self.start_accounts_subscription().await
    }

    /// Helper function to subscribe to logs
    async fn subscribe_logs(
        ws_url: &str,
        filter: RpcTransactionLogsFilter,
        config: RpcTransactionLogsConfig,
    ) -> Result<
        (
            PubsubClientSubscription<Response<RpcLogsResponse>>,
            crossbeam_channel::Receiver<Response<RpcLogsResponse>>,
        ),
        EventListenerError,
    > {
        PubsubClient::logs_subscribe(ws_url, filter, config).map_err(|e| {
            EventListenerError::SubscriptionFailed(format!("Failed to subscribe to logs: {}", e))
        })
    }

    /// Clean up old events periodically
    pub async fn start_cleanup(&self, max_age: Duration) -> JoinHandle<()> {
        let event_map = self.event_map.clone();

        tokio::spawn(async move {
            loop {
                debug!("Running event cleanup");
                let now = std::time::SystemTime::now();

                // Clean up events older than max_age
                let before_count = event_map.len();
                event_map.retain(|_, (_, created)| {
                    if let Ok(age) = now.duration_since(*created) {
                        age <= max_age
                    } else {
                        // Keep events with invalid (e.g., future) timestamps
                        true
                    }
                });
                let after_count = event_map.len();
                debug!(
                    "Cleaned up events: {} removed, {} remaining",
                    before_count - after_count,
                    after_count
                );

                // Sleep to prevent tight loop
                tokio::time::sleep(Duration::from_secs(60)).await;
            }
        })
    }
}
