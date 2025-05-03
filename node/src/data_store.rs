use crate::db::Database;
use crate::error::ApiError;
use async_std::sync::{Arc, Mutex as AsyncMutex};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use solana_sdk::pubkey::Pubkey;
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Serialize, Deserialize, Clone)]
pub struct DataMetadata {
    key: String,
    format: String,
    hash: String,
    timestamp: u64,
    origin_pubkey: String, // Added to store the public key of the data originator
    upload_pda: String,    // Added to store the upload PDA
}

pub struct DataStore {
    pub db: Arc<Database>,
    pub local_data: Arc<AsyncMutex<std::collections::HashSet<String>>>,
}

impl DataStore {
    pub fn new(db: Arc<Database>) -> Self {
        DataStore {
            db,
            local_data: Arc::new(AsyncMutex::new(std::collections::HashSet::new())),
        }
    }

    pub async fn store_data(
        &self,
        key: &str,
        data: &[u8],
        format: &str,
        origin_pubkey: Pubkey,
        upload_pda: &str,
    ) -> Result<(), ApiError> {
        let hash = format!("{:x}", Sha256::digest(data));
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_err(|e| ApiError::InternalError(e.to_string()))?
            .as_secs();

        let metadata = DataMetadata {
            key: key.to_string(),
            format: format.to_string(),
            hash: hash.clone(),
            timestamp,
            origin_pubkey: origin_pubkey.to_string(),
            upload_pda: upload_pda.to_string(),
        };

        let metadata_bytes =
            serde_json::to_vec(&metadata).map_err(|e| ApiError::InternalError(e.to_string()))?;

        let data_key = format!("data:{}", key);
        let metadata_key = format!("metadata:{}", key);
        self.db
            .inner
            .put(data_key.as_bytes(), data)
            .map_err(ApiError::Database)?;
        self.db
            .inner
            .put(metadata_key.as_bytes(), metadata_bytes)
            .map_err(ApiError::Database)?;

        self.local_data.lock().await.insert(key.to_string());

        Ok(())
    }

    pub async fn mark_as_local(&self, key: &str) {
        self.local_data.lock().await.insert(key.to_string());
    }
}
