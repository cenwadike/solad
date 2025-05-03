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
use crate::libp2p::NetworkManager;
use crate::models::{KeyQuery, KeyValuePayload};
use crate::solad_client::{SoladClient, Upload};

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

pub async fn set_value(
    data_store: web::Data<Arc<DataStore>>,
    event_map: web::Data<EventMap>,
    payload: web::Json<KeyValuePayload>,
    config: web::Data<EventListenerConfig>,
    network_manager: web::Data<Arc<AsyncMutex<NetworkManager>>>,
) -> Result<HttpResponse, ApiError> {
    let computed_hash = format!("{:x}", Sha256::digest(payload.data.clone()));
    if computed_hash != payload.hash {
        return Err(ApiError::InvalidHash);
    }

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

    let upload_pda =
        Pubkey::from_str(&payload.upload_pda).map_err(|e| ApiError::NetworkError(e.into()))?;

    let event = event_map
        .remove(&upload_pda)
        .map(|(_, event)| event)
        .ok_or(ApiError::PaymentNotVerified)?;

    if event.data_hash != payload.hash {
        event_map.insert(upload_pda, event);
        return Err(ApiError::InvalidHash);
    }

    let consumer =
        UploadEventConsumer::new(config.get_ref().clone(), event_map.get_ref().clone()).await;

    consumer
        .verify_event(&event)
        .await
        .map_err(|_| ApiError::PaymentNotVerified)?;

    data_store
        .store_data(
            &payload.key,
            &payload.data,
            &payload.format,
            config.node_pubkey,
            &payload.upload_pda,
        )
        .await?;

    data_store.mark_as_local(&payload.key).await;

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

    let payer =
        Keypair::from_base58_string(&env::var("SOLANA_ADMIN_PRIVATE_KEY").map_err(|e| {
            ApiError::NetworkError(anyhow::anyhow!("SOLANA_ADMIN_PRIVATE_KEY not set: {}", e))
        })?);
    let payer = Arc::new(payer);

    let solad_client = SoladClient::new(&config.http_url, payer.clone(), config.program_id)
        .await
        .map_err(|e| {
            ApiError::NetworkError(anyhow::anyhow!("Failed to initialize SoladClient: {}", e))
        })?;

    let rpc_client = RpcClient::new(config.http_url.clone());
    let account_data = rpc_client
        .get_account_data(&upload_pda)
        .await
        .map_err(|e| {
            ApiError::NetworkError(anyhow::anyhow!("Failed to fetch Upload account: {}", e))
        })?;

    let upload_account = Upload::deserialize(&mut account_data.as_slice()).map_err(|e| {
        ApiError::NetworkError(anyhow::anyhow!(
            "Failed to deserialize Upload account: {}",
            e
        ))
    })?;

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

    let (storage_config_pubkey, _storage_config_bump) =
        Pubkey::find_program_address(&[b"storage_config", payer.pubkey().as_ref()], &contract::ID);

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

    info!(
        "Successfully claimed reward for node: {}, upload_pda: {}, shard_id: {}, signature: {}",
        node_pubkey, upload_pda, shard_id, signature
    );

    Ok(HttpResponse::Ok().body("Data set successfully"))
}

pub async fn delete_value(
    db: web::Data<Arc<DB>>,
    query: web::Query<KeyQuery>,
) -> Result<HttpResponse, ApiError> {
    db.delete(query.key.as_bytes())
        .map_err(ApiError::Database)?;

    Ok(HttpResponse::Ok().body("Key deleted"))
}
