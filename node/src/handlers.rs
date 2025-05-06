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
use log::{error, info};
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
    let value = db
        .get(query.key.as_bytes())
        .map_err(ApiError::Database)?
        .ok_or(NotFound)?;

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
    // Verify the provided hash matches the computed SHA-256 hash of the data
    let computed_hash = format!("{:x}", Sha256::digest(payload.data.clone()));
    if computed_hash != payload.hash {
        return Err(ApiError::InvalidHash);
    }

    // Check if the node is registered
    let registration_key = "node_registered";
    let is_registered = data_store
        .db
        .inner
        .get(registration_key.as_bytes())
        .map_err(|e| ApiError::Database(e))?
        .map(|val| val == b"true")
        .unwrap_or(false);

    if !is_registered {
        return Err(ApiError::NodeNotRegistered);
    }

    // Parse the upload PDA from the payload
    let upload_pda =
        Pubkey::from_str(&payload.upload_pda).map_err(|e| ApiError::NetworkError(e.into()))?;

    // Retrieve and remove the upload event from the event map
    let event = event_map
        .remove(&upload_pda)
        .map(|(_, event)| event)
        .ok_or(ApiError::PaymentNotVerified)?;

    // Verify the event's data hash matches the provided hash
    if event.data_hash != payload.hash {
        event_map.insert(upload_pda, event);
        return Err(ApiError::InvalidHash);
    }

    // Initialize and use UploadEventConsumer to verify the event
    let consumer =
        UploadEventConsumer::new(config.get_ref().clone(), event_map.get_ref().clone()).await;

    consumer
        .verify_event(&event)
        .await
        .map_err(|_| ApiError::PaymentNotVerified)?;

    // Store the data in the DataStore
    data_store
        .store_data(
            &payload.key,
            &payload.data,
            &payload.format,
            config.node_pubkey,
            &payload.upload_pda,
        )
        .await?;

    // Mark the key as locally stored
    data_store.mark_as_local(&payload.key).await;

    // Spawn a task to gossip the data to the network
    async_std::task::spawn({
        let network_manager = network_manager.clone();
        let key = payload.key.clone();
        let data = payload.data.clone();
        let format = payload.format.clone();
        let origin_pubkey = config.node_pubkey;
        let upload_pda = payload.upload_pda.clone();
        async move {
            let mut network_manager = network_manager.lock().await;
            network_manager
                .gossip_data(&key, &data, origin_pubkey, &upload_pda, &format)
                .await;
            info!("Gossiped data for key: {}", key);
        }
    });

    // Load the Solana admin private key from environment
    let payer =
        Keypair::from_base58_string(&env::var("SOLANA_ADMIN_PRIVATE_KEY").map_err(|e| {
            ApiError::NetworkError(anyhow::anyhow!("SOLANA_ADMIN_PRIVATE_KEY not set: {}", e))
        })?);
    let payer = Arc::new(payer);

    // Initialize SoladClient for blockchain interactions
    let solad_client = SoladClient::new(&config.http_url, payer.clone(), config.program_id)
        .await
        .map_err(|e| {
            ApiError::NetworkError(anyhow::anyhow!("Failed to initialize SoladClient: {}", e))
        })?;

    // Fetch the upload account data from Solana
    let rpc_client = RpcClient::new(config.http_url.clone());
    let account_data = rpc_client
        .get_account_data(&upload_pda)
        .await
        .map_err(|e| {
            ApiError::NetworkError(anyhow::anyhow!("Failed to fetch Upload account: {}", e))
        })?;

    // Deserialize the upload account
    let upload_account = Upload::deserialize(&mut account_data.as_slice()).map_err(|e| {
        ApiError::NetworkError(anyhow::anyhow!(
            "Failed to deserialize Upload account: {}",
            e
        ))
    })?;

    // Determine the shard ID for the node
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
            ApiError::NetworkError(anyhow::anyhow!(
                "Node {} is not assigned to any shard for upload PDA {}",
                node_pubkey,
                upload_pda
            ))
        })?;

    // Derive the storage config public key
    let (storage_config_pubkey, _storage_config_bump) =
        Pubkey::find_program_address(&[b"storage_config", payer.pubkey().as_ref()], &contract::ID);

    // Log the reward claim initiation
    info!(
        "Initiating reward claim for node: {}, upload_pda: {}.",
        config.node_pubkey, payload.upload_pda
    );
    let treasury_pubkey = Pubkey::new_unique();
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

    Ok(HttpResponse::Ok().body("Data set successfully"))
}
