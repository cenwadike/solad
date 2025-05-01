use actix_web::{web, HttpResponse};
use async_std::sync::{Arc, Mutex as AsyncMutex};
use async_std::task;
use log::info;
use rocksdb::DB;
use sha2::{Digest, Sha256};
use solana_client::nonblocking::rpc_client::RpcClient;
use solana_sdk::pubkey::Pubkey;
use std::str::FromStr;

use crate::data_upload_event::{EventListenerConfig, EventMap, UploadEventConsumer};
use crate::db::Database;
use crate::error::{ApiError, ApiError::NotFound};
use crate::libp2p::NetworkManager;
use crate::models::{KeyQuery, KeyValuePayload};
// use crate::utils::{hash, brute_force_hash};

// Get value by key
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

// Set key-value pair
pub async fn set_value(
    db: web::Data<Arc<Database>>,
    event_map: web::Data<EventMap>,
    payload: web::Json<KeyValuePayload>,
    config: web::Data<EventListenerConfig>,
    network_manager: web::Data<Arc<AsyncMutex<NetworkManager>>>,
) -> Result<HttpResponse, ApiError> {
    // check hash and compared  data
    // Verify data hash
    let computed_hash = format!("{:x}", Sha256::digest(payload.data.clone()));
    if computed_hash != payload.hash {
        return Err(ApiError::InvalidHash);
    }

    // node must be registered on blockchain
    // Node must be registered
    let rpc_client = RpcClient::new(config.http_url.clone());
    let node_account = rpc_client.get_account(&config.node_pubkey).await?;
    if node_account.owner != config.program_id {
        return Err(ApiError::NodeNotRegistered);
    }

    //node must verify payment with event
    // Find matching event in map
    let upload_pda =
        Pubkey::from_str(&payload.upload_pda).map_err(|e| ApiError::NetworkError(e.into()))?;

    let event = event_map
        .remove(&upload_pda)
        .map(|(_, event)| event)
        .ok_or(ApiError::PaymentNotVerified)?;

    if event.data_hash != payload.hash {
        // Reinsert event if hash doesn't match
        event_map.insert(upload_pda, event);
        return Err(ApiError::InvalidHash);
    }

    // Verify event (payment and node registration)
    let consumer =
        UploadEventConsumer::new(config.get_ref().clone(), event_map.get_ref().clone()).await;

    consumer
        .verify_event(&event)
        .await
        .map_err(|_| ApiError::PaymentNotVerified)?;

    // in payment is correct store data else report user for slashing

    db.inner
        .put(payload.key.as_bytes(), payload.data.clone())
        .map_err(ApiError::Database)?;

    //gossip to other node in shard with data u stored
    // Mark data as local
    {
        let mut network_manager = network_manager.lock().await;
        network_manager.mark_as_local(&payload.key).await;
    }

    // Gossip data to other nodes in the shard
    task::spawn({
        let network_manager = network_manager.clone();
        let key = payload.key.clone();
        let data = payload.data.clone();
        let origin_pubkey = config.node_pubkey;
        let upload_pda = payload.upload_pda.clone();
        async move {
            let mut network_manager = network_manager.lock().await;
            network_manager
                .gossip_data(&key, &data, origin_pubkey, &upload_pda)
                .await;
            info!("Gossiped data for key: {}", key);
        }
    });

    //request first payment for itself
    // Request initial payment (25% reward) by invoking claim_rewards
    // Note: This assumes a mechanism to call the smart contract's process_claim_rewards function.
    // In a real implementation, you would interact with the Solana blockchain to invoke the function.
    // For simplicity, we'll log the intent here.
    info!(
        "Initiating reward claim for node: {}, upload_pda: {}, shard_id: 0",
        config.node_pubkey, payload.upload_pda
    );

    // Respond to user
    Ok(HttpResponse::Ok().body("Data set successfully"))
}

// Delete key
pub async fn delete_value(
    db: web::Data<Arc<DB>>,
    query: web::Query<KeyQuery>,
) -> Result<HttpResponse, ApiError> {
    db.delete(query.key.as_bytes())
        .map_err(ApiError::Database)?;

    Ok(HttpResponse::Ok().body("Key deleted"))
}
