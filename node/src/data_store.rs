/// This module defines the `DataStore` struct and associated functionality for managing
/// key-value data in a decentralized storage network. It uses RocksDB for persistent
/// storage and maintains metadata for data integrity and tracking. The module supports
/// storing data with associated metadata (e.g., hash, format, and origin) and marking
/// data as locally stored.
use crate::db::Database;
use crate::error::ApiError;
use async_std::sync::{Arc, Mutex as AsyncMutex};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use solana_sdk::pubkey::Pubkey;
use std::time::{SystemTime, UNIX_EPOCH};

/// Metadata structure for stored data, capturing essential attributes for data
/// integrity and traceability.
///
/// This struct is serialized and stored alongside the data to provide context such as
/// the data's key, format, hash, creation timestamp, origin public key, and upload
/// program-derived address (PDA).
#[derive(Serialize, Deserialize, Clone)]
pub struct DataMetadata {
    key: String,           // Unique identifier for the data
    format: String,        // Data format (e.g., JSON, binary)
    hash: String,          // SHA-256 hash of the data for integrity verification
    timestamp: u64,        // Unix timestamp of when the data was stored
    origin_pubkey: String, // Public key of the data originator
    upload_pda: String,    // Solana program-derived address for upload tracking
}

/// Core structure for managing data storage in the decentralized network.
///
/// `DataStore` encapsulates a RocksDB database instance and a thread-safe set of
/// locally stored keys. It provides methods for storing data with metadata and marking
/// keys as local.
pub struct DataStore {
    pub db: Arc<Database>, // Shared reference to the RocksDB database
    pub local_data: Arc<AsyncMutex<std::collections::HashSet<String>>>, // Thread-safe set of locally stored keys
}

impl DataStore {
    /// Creates a new `DataStore` instance with the provided database.
    ///
    /// Initializes the `DataStore` with a shared reference to a RocksDB database and an
    /// empty set for tracking local keys.
    ///
    /// # Arguments
    ///
    /// * `db` - Shared reference to the RocksDB database instance.
    ///
    /// # Returns
    ///
    /// * `Self` - A new `DataStore` instance.
    ///
    /// # Examples
    ///
    /// ```rust
    /// use std::sync::Arc;
    /// use crate::db::Database;
    /// use crate::data_store::DataStore;
    ///
    /// let db = Arc::new(Database::new("./mydb").unwrap());
    /// let data_store = DataStore::new(db);
    /// ```
    pub fn new(db: Arc<Database>) -> Self {
        DataStore {
            db,
            local_data: Arc::new(AsyncMutex::new(std::collections::HashSet::new())),
        }
    }

    /// Stores data and its metadata in the database.
    ///
    /// This method computes a SHA-256 hash of the data, generates metadata with the
    /// provided key, format, origin public key, and upload PDA, and stores both the data
    /// and serialized metadata in RocksDB. It also marks the key as locally stored.
    ///
    /// # Arguments
    ///
    /// * `key` - The unique identifier for the data.
    /// * `data` - The raw data to store (as a byte slice).
    /// * `format` - The format of the data (e.g., "text", "json").
    /// * `origin_pubkey` - The Solana public key of the data originator.
    /// * `upload_pda` - The Solana program-derived address for the upload.
    ///
    /// # Returns
    ///
    /// * `Result<(), ApiError>` - Returns `Ok(())` on success, or an `ApiError` on
    ///   failure (e.g., serialization error, database error, or timestamp error).
    ///
    /// # Workflow
    ///
    /// 1. **Hash Computation**: Calculates the SHA-256 hash of the input data.
    /// 2. **Timestamp Generation**: Retrieves the current Unix timestamp.
    /// 3. **Metadata Creation**: Constructs a `DataMetadata` struct with the key,
    ///    format, hash, timestamp, origin public key, and upload PDA.
    /// 4. **Serialization**: Serializes the metadata to JSON.
    /// 5. **Storage**: Stores the data under `data:{key}` and metadata under
    ///    `metadata:{key}` in RocksDB.
    /// 6. **Local Marking**: Adds the key to the `local_data` set.
    ///
    /// # Errors
    ///
    /// - `ApiError::InternalError`: If the timestamp cannot be generated or metadata
    ///   serialization fails.
    /// - `ApiError::Database`: If writing to the database fails.
    ///
    /// # Examples
    ///
    /// ```rust
    /// use std::sync::Arc;
    /// use solana_sdk::pubkey::Pubkey;
    /// use crate::db::Database;
    /// use crate::data_store::DataStore;
    ///
    /// #[tokio::main]
    /// async fn main() {
    ///     let db = Arc::new(Database::new("./mydb").unwrap());
    ///     let data_store = DataStore::new(db);
    ///     let key = "my_key";
    ///     let data = b"Hello, World!";
    ///     let format = "text";
    ///     let origin_pubkey = Pubkey::from_str("11111111111111111111111111111111").unwrap();
    ///     let upload_pda = "7b8f4a2e9c1d4b3e8f5c3a7b9e2d1f4a...";
    ///
    ///     data_store.store_data(key, data, format, origin_pubkey, upload_pda)
    ///         .await
    ///         .unwrap();
    /// }
    /// ```
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

    /// Marks a key as locally stored in the `local_data` set.
    ///
    /// This method adds the specified key to the thread-safe `local_data` set, indicating
    /// that the data is stored locally on the node. It is typically called after
    /// successful data storage to track local availability.
    ///
    /// # Arguments
    ///
    /// * `key` - The key to mark as locally stored.
    ///
    /// # Examples
    ///
    /// ```rust
    /// use std::sync::Arc;
    /// use crate::db::Database;
    /// use crate::data_store::DataStore;
    ///
    /// #[tokio::main]
    /// async fn main() {
    ///     let db = Arc::new(Database::new("./mydb").unwrap());
    ///     let data_store = DataStore::new(db);
    ///     let key = "my_key";
    ///
    ///     data_store.mark_as_local(key).await;
    ///     assert!(data_store.local_data.lock().await.contains(key));
    /// }
    /// ```
    pub async fn mark_as_local(&self, key: &str) {
        self.local_data.lock().await.insert(key.to_string());
    }
}
