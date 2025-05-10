/// This module provides API endpoints for a decentralized storage network, enabling
/// data retrieval and storage with integration to a Solana blockchain for payment
/// verification and reward claiming. It uses Actix-web for HTTP handling, RocksDB for
/// persistent storage, and Solana client libraries for blockchain interactions.
///
/// The endpoints ensure data integrity through hash verification, node registration
/// checks, and event-based payment validation, while asynchronously managing network
/// gossip and reward claims.
use actix_web::{web, HttpResponse};
use async_std::sync::{Arc, Mutex as AsyncMutex};
use borsh::BorshDeserialize;
use log::{debug, error, info, trace, warn};
use rocksdb::DB;
use sha2::{Digest, Sha256};
use solana_client::nonblocking::rpc_client::RpcClient;
use solana_sdk::pubkey::Pubkey;
use solana_sdk::signature::Keypair;
use solana_sdk::signer::Signer;
use std::env;
use std::str::FromStr;

use crate::data_store::DataStore;
use crate::data_upload_event::{EventListenerConfig, EventMap, UploadEventConsumer};
use crate::error::{ApiError, ApiError::NotFound};
use crate::models::{KeyQuery, KeyValuePayload};
use crate::network_manager::NetworkManager;
use crate::solad_client::{SoladClient, Upload};

/// Performs a health check on the server.
///
/// This endpoint verifies that the application is running and responsive. It returns
/// a simple HTTP 200 response to indicate the service is healthy. No additional
/// checks or dependencies are queried in this basic implementation.
///
/// # Returns
///
/// * `Result<HttpResponse, ApiError>` - On success, returns an HTTP 200 response
///   with no body. On failure, returns an `ApiError` if an internal error occurs
///   (though this is unlikely in this minimal implementation).
///
/// # Examples
///
/// ```http
/// GET /health
/// ```
///
/// Response (success):
/// ```http
/// HTTP/1.1 200 OK
/// ```
///
/// Response (failure, hypothetical):
/// ```http
/// HTTP/1.1 500 Internal Server Error
/// Content-Type: application/json
/// {"error": "InternalServerError"}
/// ```
pub async fn health() -> Result<HttpResponse, ApiError> {
    Ok(HttpResponse::Ok().into())
}

/// Retrieves a value from the RocksDB database based on the provided key query.
///
/// This endpoint fetches data stored under a specified key, returning it in the HTTP
/// response body if found. It handles database errors and returns a `NotFound` error
/// if the key does not exist.
///
/// # Arguments
///
/// * `db` - Shared reference to the RocksDB instance wrapped in `Arc` for thread safety.
/// * `query` - Query parameter containing the key to look up (`KeyQuery` struct).
///
/// # Returns
///
/// * `Result<HttpResponse, ApiError>` - On success, returns an HTTP 200 response with
///   the value as the body. On failure, returns an `ApiError` (e.g., `Database` or
///   `NotFound`).
///
/// # Examples
///
/// ```http
/// GET /get_value?key=my_key
/// ```
///
/// Response (success):
/// ```http
/// HTTP/1.1 200 OK
/// Content-Type: application/octet-stream
/// [binary data]
/// ```
///
/// Response (not found):
/// ```http
/// HTTP/1.1 404 Not Found
/// Content-Type: application/json
/// {"error": "NotFound"}
/// ```
pub async fn get_value(
    db: web::Data<Arc<DB>>,
    query: web::Query<KeyQuery>,
) -> Result<HttpResponse, ApiError> {
    trace!("Received GET request for key: {}", query.key);
    let value = db
        .get(query.key.as_bytes())
        .map_err(|e| {
            error!("Database error while retrieving key {}: {}", query.key, e);
            ApiError::Database(e)
        })?
        .ok_or_else(|| {
            warn!("Key not found: {}", query.key);
            NotFound
        })?;

    info!("Successfully retrieved value for key: {}", query.key);
    Ok(HttpResponse::Ok().body(value))
}

/// Stores a key-value pair in the data store, verifies payment, and initiates gossip
/// and reward claiming.
///
/// This endpoint handles data uploads by validating the provided hash, checking node
/// registration, verifying payment events on the Solana blockchain, storing the data,
/// and triggering network gossip and reward claiming. It ensures data integrity and
/// node authorization through multiple checks.
///
/// # Arguments
///
/// * `data_store` - Shared reference to the `DataStore` for storing key-value pairs.
/// * `event_map` - Shared `EventMap` containing upload events for payment verification.
/// * `payload` - JSON payload (`KeyValuePayload`) containing the key, data, hash,
///   format, and upload PDA.
/// * `config` - Configuration for event listeners (`EventListenerConfig`), including
///   node public key and RPC URL.
/// * `network_manager` - Shared `NetworkManager` for gossiping data to the network.
///
/// # Returns
///
/// * `Result<HttpResponse, ApiError>` - On success, returns an HTTP 200 response with
///   a confirmation message. On failure, returns an `ApiError` (e.g., `InvalidHash`,
///   `NodeNotRegistered`, `PaymentNotVerified`, or `NetworkError`).
///
/// # Workflow
///
/// 1. **Hash Verification**: Validates the provided hash against the computed SHA-256
///    hash of the data.
/// 2. **Node Registration Check**: Ensures the node is registered by checking the
///    `node_registered` key in the database.
/// 3. **Payment Verification**: Retrieves and verifies the upload event from the
///    `event_map` using the upload PDA, ensuring the event's data hash matches the
///    provided hash.
/// 4. **Event Consumer Validation**: Uses `UploadEventConsumer` to further verify the
///    event's validity.
/// 5. **Data Storage**: Stores the key, data, format, node public key, and upload PDA
///    in the `DataStore`.
/// 6. **Local Marking**: Marks the key as locally stored in the `DataStore`.
/// 7. **Gossip Initiation**: Spawns an asynchronous task to gossip the data to the
///    network using `NetworkManager`.
/// 8. **Reward Claiming**: Initializes a `SoladClient` to fetch the upload account,
///    determine the shard ID, and claim rewards for the node.
/// 9. **Response**: Returns a success message if all steps complete successfully.
///
/// # Errors
///
/// - `InvalidHash`: If the provided hash does not match the computed hash or the
///   event's hash.
/// - `NodeNotRegistered`: If the node is not registered in the database.
/// - `PaymentNotVerified`: If the upload event is missing or invalid.
/// - `NetworkError`: For issues like invalid Solana keys, RPC failures, or reward
///   claim failures.
/// - `Database`: For database operation errors.
///
/// # Examples
///
/// ```http
/// POST /set_value
/// Content-Type: application/json
///
/// {
///   "key": "my_key",
///   "data": "SGVsbG8gV29ybGQh",
///   "hash": "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
///   "format": "text",
///   "upload_pda": "7b8f4a2e9c1d4b3e8f5c3a7b9e2d1f4a..."
/// }
/// ```
///
/// Response (success):
/// ```http
/// HTTP/1.1 200 OK
/// Content-Type: text/plain
/// Data set successfully
/// ```
///
/// Response (invalid hash):
/// ```http
/// HTTP/1.1 400 Bad Request
/// Content-Type: application/json
/// {"error": "InvalidHash"}
/// ```
pub async fn set_value(
    data_store: web::Data<Arc<DataStore>>,
    event_map: web::Data<EventMap>,
    payload: web::Json<KeyValuePayload>,
    config: web::Data<EventListenerConfig>,
    network_manager: web::Data<Arc<AsyncMutex<NetworkManager>>>,
) -> Result<HttpResponse, ApiError> {
    trace!(
        "Received POST request to set value for key: {}",
        payload.key
    );
    debug!(
        "Payload details: key={}, hash={}, format={}, upload_pda={}",
        payload.key, payload.hash, payload.format, payload.upload_pda
    );

    // Verify the provided hash matches the computed SHA-256 hash of the data
    let computed_hash = format!("{:x}", Sha256::digest(payload.data.clone()));
    if computed_hash != payload.hash {
        warn!(
            "Hash verification failed: computed={}, provided={}",
            computed_hash, payload.hash
        );
        return Err(ApiError::InvalidHash);
    }
    debug!("Hash verification successful for key: {}", payload.key);

    // Check if the node is registered
    let registration_key = "node_registered";
    let is_registered = data_store
        .db
        .inner
        .get(registration_key.as_bytes())
        .map_err(|e| {
            error!("Database error while checking node registration: {}", e);
            ApiError::Database(e)
        })?
        .map(|val| val == b"true")
        .unwrap_or(false);

    if !is_registered {
        warn!("Node not registered for key: {}", payload.key);
        return Err(ApiError::NodeNotRegistered);
    }
    debug!("Node registration verified for key: {}", payload.key);

    // Parse the upload PDA from the payload
    let upload_pda = Pubkey::from_str(&payload.upload_pda).map_err(|e| {
        error!("Failed to parse upload PDA {}: {}", payload.upload_pda, e);
        ApiError::NetworkError(e.into())
    })?;
    debug!("Parsed upload PDA: {}", upload_pda);

    // Retrieve and remove the upload event from the event map
    let event = event_map
        .remove(&upload_pda)
        .map(|(_, event)| event)
        .ok_or_else(|| {
            warn!("No upload event found for PDA: {}", upload_pda);
            ApiError::PaymentNotVerified
        })?;
    debug!("Retrieved upload event for PDA: {}", upload_pda);

    // Verify the event's data hash matches the provided hash
    if event.data_hash != payload.hash {
        event_map.insert(upload_pda, event.clone());
        warn!(
            "Event data hash mismatch: event_hash={}, provided_hash={}",
            event.data_hash, payload.hash
        );
        return Err(ApiError::InvalidHash);
    }
    debug!("Event data hash verified for PDA: {}", upload_pda);

    // Initialize and use UploadEventConsumer to verify the event
    trace!("Initializing UploadEventConsumer for event verification");
    let consumer =
        UploadEventConsumer::new(config.get_ref().clone(), event_map.get_ref().clone()).await;

    consumer.verify_event(&event).await.map_err(|e| {
        error!("Event verification failed for PDA {}: {}", upload_pda, e);
        ApiError::PaymentNotVerified
    })?;
    info!("Event verification successful for PDA: {}", upload_pda);

    // Store the data in the DataStore
    trace!("Storing data in DataStore for key: {}", payload.key);
    data_store
        .store_data(
            &payload.key,
            &payload.data,
            &payload.format,
            config.node_pubkey,
            &payload.upload_pda,
        )
        .await
        .map_err(|e| {
            error!("Failed to store data for key {}: {}", payload.key, e);
            e
        })?;
    info!("Data stored successfully for key: {}", payload.key);

    // Mark the key as locally stored
    trace!("Marking key as locally stored: {}", payload.key);
    data_store.mark_as_local(&payload.key).await;
    debug!("Key marked as locally stored: {}", payload.key);

    // Spawn a task to gossip the data to the network
    trace!("Spawning task to gossip data for key: {}", payload.key);
    async_std::task::spawn({
        let network_manager = network_manager.clone();
        let key = payload.key.clone();
        let data = payload.data.clone();
        let format = payload.format.clone();
        let origin_pubkey = config.node_pubkey;
        let upload_pda = payload.upload_pda.clone();
        async move {
            trace!("Acquiring network manager lock for gossiping key: {}", key);
            let mut network_manager = network_manager.lock().await;
            network_manager
                .gossip_data(&key, &data, origin_pubkey, &upload_pda, &format)
                .await;
            info!("Gossiped data for key: {}", key);
        }
    });

    // Load the Solana node private key from environment
    trace!("Loading Solana node private key");
    let payer = Keypair::from_base58_string(&env::var("NODE_SOLANA_PRIVKEY").map_err(|e| {
        error!("Failed to load NODE_SOLANA_PRIVKEY: {}", e);
        ApiError::NetworkError(anyhow::anyhow!("NODE_SOLANA_PRIVKEY not set: {}", e))
    })?);
    let payer = Arc::new(payer);
    debug!("Solana node private key loaded successfully");

    // Initialize SoladClient for blockchain interactions
    trace!("Initializing SoladClient");
    let solad_client = SoladClient::new(&config.http_url, payer.clone(), config.program_id)
        .await
        .map_err(|e| {
            error!("Failed to initialize SoladClient: {}", e);
            ApiError::NetworkError(anyhow::anyhow!("Failed to initialize SoladClient: {}", e))
        })?;
    debug!("SoladClient initialized successfully");

    // Fetch the upload account data from Solana
    trace!("Fetching upload account data for PDA: {}", upload_pda);
    let rpc_client = RpcClient::new(config.http_url.clone());
    let account_data = rpc_client
        .get_account_data(&upload_pda)
        .await
        .map_err(|e| {
            error!(
                "Failed to fetch Upload account for PDA {}: {}",
                upload_pda, e
            );
            ApiError::NetworkError(anyhow::anyhow!("Failed to fetch Upload account: {}", e))
        })?;
    debug!("Fetched upload account data for PDA: {}", upload_pda);

    // Deserialize the upload account
    trace!("Deserializing upload account for PDA: {}", upload_pda);
    let upload_account = Upload::deserialize(&mut account_data.as_slice()).map_err(|e| {
        error!(
            "Failed to deserialize Upload account for PDA {}: {}",
            upload_pda, e
        );
        ApiError::NetworkError(anyhow::anyhow!(
            "Failed to deserialize Upload account: {}",
            e
        ))
    })?;
    debug!("Deserialized upload account for PDA: {}", upload_pda);

    // Determine the shard ID for the node
    trace!("Determining shard ID for node: {}", config.node_pubkey);
    let node_pubkey = config.node_pubkey;
    let shard_id = upload_account
        .shards
        .iter()
        .enumerate()
        .find_map(|(index, shard)| {
            if shard.node_keys.contains(&node_pubkey) {
                Some((index + 1) as u8)
            } else {
                None
            }
        })
        .ok_or_else(|| {
            error!(
                "Node {} is not assigned to any shard for upload PDA {}",
                node_pubkey, upload_pda
            );
            ApiError::NetworkError(anyhow::anyhow!(
                "Node {} is not assigned to any shard for upload PDA {}",
                node_pubkey,
                upload_pda
            ))
        })?;
    debug!(
        "Determined shard ID: {} for node: {}",
        shard_id, node_pubkey
    );

    // Derive the storage config public key
    trace!("Deriving storage config public key");
    let (storage_config_pubkey, _storage_config_bump) =
        Pubkey::find_program_address(&[b"storage_config", payer.pubkey().as_ref()], &contract::ID);
    debug!(
        "Derived storage config public key: {}",
        storage_config_pubkey
    );

    // Log the reward claim initiation
    info!(
        "Initiating reward claim for node: {}, upload_pda: {}.",
        config.node_pubkey, payload.upload_pda
    );
    let treasury_pubkey = Pubkey::new_unique();
    trace!(
        "Claiming rewards for hash: {}, shard_id: {}, upload_pda: {}",
        payload.hash,
        shard_id,
        upload_pda
    );
    let signature = solad_client
        .claim_rewards(
            payload.hash.clone(),
            shard_id,
            upload_pda,
            storage_config_pubkey,
            treasury_pubkey,
        )
        .await
        .map_err(|e| {
            error!(
                "Failed to claim reward for node: {}, upload_pda: {}, shard_id: {}: {}",
                node_pubkey, upload_pda, shard_id, e
            );
            ApiError::NetworkError(anyhow::anyhow!("Failed to claim reward: {}", e))
        })?;

    // Log the successful reward claim
    info!(
        "Successfully claimed reward for node: {}, upload_pda: {}, shard_id: {}, signature: {}",
        node_pubkey, upload_pda, shard_id, signature
    );

    info!("Data set successfully for key: {}", payload.key);
    Ok(HttpResponse::Ok().body("Data set successfully"))
}
