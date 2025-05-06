/// This module defines data structures for API request payloads in a decentralized
/// storage network. It includes structs for querying keys and submitting key-value
/// data with validation rules to ensure data integrity.

use serde::{Deserialize, Serialize};
use validator::Validate;

/// Represents a query parameter for retrieving a value by key.
///
/// Used in GET requests to specify the key for data retrieval.
#[derive(Deserialize)]
pub struct KeyQuery {
    pub key: String, // The key to query for data retrieval
}

/// Represents the payload for storing a key-value pair in the storage network.
///
/// This struct is used in POST requests to submit data for storage, including metadata
/// such as the data hash, shard number, upload PDA, and format. It includes validation
/// rules to enforce non-empty fields and valid shard values.
#[derive(Serialize, Deserialize, Validate)]
pub struct KeyValuePayload {
    /// The unique identifier for the data.
    ///
    /// Must be a non-empty string.
    #[validate(length(min = 1, message = "key cannot be empty"))]
    pub key: String,

    /// The SHA-256 hash of the data for integrity verification.
    ///
    /// Must be a non-empty string.
    #[validate(length(min = 1, message = "hash cannot be empty"))]
    pub hash: String,

    /// The raw data to be stored.
    ///
    /// Must be a non-empty byte vector.
    #[validate(length(min = 1, message = "data cannot be empty"))]
    pub data: Vec<u8>,

    /// The shard number for the data.
    ///
    /// Must be a positive integer greater than 0.
    #[validate(range(min = 1, message = "shard must be greater than 0"))]
    pub shard: u32,

    /// The Solana program-derived address (PDA) for the upload.
    ///
    /// Must be a non-empty string.
    #[validate(length(min = 1, message = "upload_pda cannot be empty"))]
    pub upload_pda: String,

    /// The format of the data (e.g., "text", "json").
    ///
    /// Must be a non-empty string.
    #[validate(length(min = 1, message = "format cannot be empty"))]
    pub format: String,
}
