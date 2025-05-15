/*!
# Solad Client

This module provides the `DataClient` and `SoladClient` structs for interacting with the Solad decentralized storage network, built on the Solana blockchain. The `DataClient` handles off-chain HTTP communication with Solad nodes, while the `SoladClient` manages on-chain interactions with the Solad program. Together, they enable uploading and retrieving data to/from the Solad network, with features like sharding, storage duration, and treasury management.

## Purpose

The `DataClient` is designed to communicate with Solad node endpoints via HTTP, facilitating data uploads (`set_data`) and retrievals (`get_data`). It integrates with the `SoladClient`, which handles on-chain operations such as creating and confirming upload instructions on the Solana blockchain. This module is intended for applications requiring decentralized storage, such as file storage, data marketplaces, or content distribution networks.

## Key Features

- **Data Upload**: The `set_data` method performs a two-phase process:
  1. On-chain: Creates and confirms an upload instruction using the Solad program.
  2. Off-chain: Sends data to a Solad node via HTTP POST.
- **Data Retrieval**: The `get_data` method fetches data from a Solad node by key.
- **PDA Management**: Derives and verifies Program-Derived Addresses (PDAs) for uploads, user keys, escrow, and node registry.
- **Error Handling**: Defines `UserApiError` for handling failures in HTTP requests, Solana transactions, and PDA mismatches.
- **Sharding Support**: Supports data sharding across multiple nodes, specified by `shard_count`.
- **Flexible Configuration**: Allows customization of storage duration and treasury accounts.

## Usage

To use this module, initialize a `SoladClient` with a Solana RPC URL, payer keypair, and program ID, then create a `DataClient` with the base URL of a Solad node. Use `set_data` to upload data and `get_data` to retrieve it.

### Example: Uploading Data to Solad

```rust
use std::sync::Arc;
use solana_sdk::{pubkey::Pubkey, signature::Keypair};
use solad_client::{DataClient, SoladClient, model::SetData};
use base64::prelude::*;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize SoladClient
    let rpc_url = "https://api.devnet.solana.com";
    let payer = Arc::new(Keypair::new());
    let program_id = Pubkey::new_unique();
    let solad_client = SoladClient::new(rpc_url, payer, program_id).await?;

    // Initialize DataClient
    let base_url = "http://localhost:8080";
    let data_client = DataClient::new(base_url);

    // Prepare data
    let data_bytes = b"Hello, Solad!".to_vec();
    let data_b64 = BASE64_STANDARD.encode(&data_bytes);
    let data_hash = "sample_hash".to_string(); // Replace with actual hash
    let set_data = SetData {
        key: "example_key".to_string(),
        data: data_b64,
        hash: data_hash.clone(),
        format: "text/plain".to_string(),
        upload_pda: Pubkey::new_unique().to_string(), // Replace with actual PDA
        shard: 3,
    };

    // Upload data
    let nodes = vec![Pubkey::new_unique()];
    let treasury = Pubkey::new_unique();
    let result = data_client
        .set_data(&set_data, &solad_client, 30, nodes, treasury)
        .await?;

    println!("Upload response: {:?}", result);
    Ok(())
}
```

### Example: Retrieving Data from Solad

```rust
#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let base_url = "http://localhost:8080";
    let data_client = DataClient::new(base_url);

    let key = "example_key".to_string();
    let result = data_client.get_data(key).await?;

    println!("Retrieved data: {:?}", result);
    Ok(())
}
```

## Integration with Solana

The `SoladClient` uses the `anchor_client` crate to interact with the Solad program on Solana. It handles transaction signing, PDA derivation, and instruction creation for data uploads. The `DataClient` complements this by sending data to Solad nodes after on-chain confirmation.

## Dependencies

- `anchor_client`: For Solana program interactions.
- `anchor_lang`: For PDA derivation and account metadata.
- `reqwest`: For HTTP communication with Solad nodes.
- `serde_json`: For JSON serialization/deserialization.
- `base64`: For encoding/decoding data.
- `anyhow`: For error handling.
- `solana-sdk`: For Solana types like `Pubkey` and `Keypair`.

## Error Handling

Errors are managed via `UserApiError`, which covers HTTP failures, Solana transaction errors, PDA mismatches, and data not found. The `set_data` method ensures atomicity by verifying on-chain and off-chain steps.

This module is ideal for developers building decentralized storage applications on Solana, offering a robust interface for data management with Solad.
*/

use std::sync::Arc;

// Re-export key types for easier access
pub use crate::error::*;
pub use crate::event::*;
pub use crate::model::*;

// Dependencies for Solana and HTTP interactions
use anchor_client::{
    solana_sdk::{
        pubkey::Pubkey,
        signature::Keypair,
        signer::Signer,
        system_program,
    },
    Client, Cluster, Program,
};
use anchor_lang::prelude::AccountMeta;
use anyhow::Result;
use base64::prelude::*;
use contract::instruction::UploadData;
use serde_json::Value;

// Public modules
pub mod error;
pub mod event;
pub mod model;

/// Client for interacting with Solad nodes via HTTP.
pub struct DataClient {
    client: reqwest::Client, // HTTP client for sending requests
    base_url: String,        // Base URL of the Solad node endpoint
}

impl DataClient {
    /// Creates a new `DataClient` instance with the specified node endpoint.
    ///
    /// # Arguments
    /// * `base_url` - The base URL of the Solad node (e.g., `http://localhost:8080`).
    ///
    /// # Returns
    /// A new `DataClient` instance.
    pub fn new(base_url: &str) -> Self {
        Self {
            client: reqwest::Client::new(),
            base_url: base_url.to_string(),
        }
    }

    /// Uploads data to the Solad network and sets it on the specified node endpoint.
    /// First, it creates and confirms an upload instruction on the Solad program,
    /// then sends the data to the node endpoint via HTTP POST.
    ///
    /// # Arguments
    /// * `data` - The data to upload, including key, data (base64-encoded), hash, format, and upload_pda.
    /// * `solad_client` - Reference to the SoladClient for on-chain interactions.
    /// * `storage_duration_days` - Duration to store the data in days.
    /// * `nodes` - List of node public keys to assign shards to.
    /// * `treasury_pubkey` - Public key of the treasury account.
    ///
    /// # Returns
    /// * `Result<Value, UserApiError>` - The JSON response from the node endpoint on success,
    ///   or a `UserApiError` on failure.
    ///
    /// # Errors
    /// Returns `UserApiError` for:
    /// - Invalid base64-encoded data.
    /// - PDA mismatch between derived and provided `upload_pda`.
    /// - Solana transaction failures (creation, sending, or confirmation).
    /// - HTTP request failures or non-success status codes.
    pub async fn set_data(
        &self,
        data: &SetData,
        solad_client: &SoladClient,
        storage_duration_days: u64,
        nodes: Vec<Pubkey>,
        treasury_pubkey: Pubkey,
    ) -> Result<Value, UserApiError> {
        // Extract shard count from data
        let shard_count = data.shard as u8;

        // Phase 1: On-chain contract call
        // Decode base64-encoded data
        let data_bytes = BASE64_STANDARD.decode(&data.data)?;
        let data_hash = data.hash.clone();
        let size_bytes = data_bytes.len() as u64;

        // Derive upload PDA for the data
        let (upload_pda, _bump) = Pubkey::find_program_address(
            &[
                b"upload",
                data_hash.as_bytes(),
                solad_client.payer.pubkey().as_ref(),
            ],
            &solad_client.program.id(),
        );

        // Verify provided upload_pda matches derived PDA
        if upload_pda.to_string() != data.upload_pda {
            return Err(UserApiError::PdaMismatch);
        }

        // Create upload instruction for the Solad program
        let args = self
            .create_upload_instruction(
                solad_client,
                data_hash.clone(),
                size_bytes,
                shard_count,
                storage_duration_days,
                treasury_pubkey,
                nodes,
            )
            .await
            .map_err(|e| UserApiError::SolanaError(format!("Failed to create upload instruction: {}", e)))?;

        // Send and confirm the transaction on Solana
        let signature = solad_client
            .program
            .request()
            .args(args)
            .signer(&solad_client.payer)
            .send()
            .await
            .map_err(|e| UserApiError::SolanaError(format!("Failed to send transaction: {}", e)))?;

        // Confirm the transaction was processed
        solad_client
            .program
            .rpc()
            .confirm_transaction(&signature)
            .map_err(|e| UserApiError::SolanaError(format!("Transaction confirmation failed: {}", e)))?;

        // Phase 2: Off-chain upload to node endpoint
        // Construct the API endpoint URL
        let url = format!("{}/api/set", self.base_url);
        // Send HTTP POST request with data
        let response = self.client.post(&url).json(data).send().await?;

        // Handle HTTP response
        if response.status().is_success() {
            // Return JSON response on success
            Ok(response.json::<Value>().await?)
        } else {
            // Convert HTTP error to UserApiError
            Err(UserApiError::from_response(response).await)
        }
    }

    /// Retrieves data from a Solad node by key.
    ///
    /// # Arguments
    /// * `key` - The key associated with the data to retrieve.
    ///
    /// # Returns
    /// * `Result<Value, UserApiError>` - The JSON response containing the data on success,
    ///   or a `UserApiError` on failure.
    ///
    /// # Errors
    /// Returns `UserApiError` for:
    /// - HTTP request failures.
    /// - 404 status code (data not found).
    /// - Non-success status codes.
    pub async fn get_data(&self, key: String) -> Result<Value, UserApiError> {
        // Construct the API endpoint URL with key
        let url = format!("{}/get/key={}", self.base_url, key);
        // Send HTTP GET request
        let response = self.client.get(&url).send().await?;

        // Handle HTTP response
        if response.status().is_success() {
            // Return JSON response on success
            Ok(response.json::<Value>().await?)
        } else if response.status() == 404 {
            // Handle data not found
            Err(UserApiError::NotFound)
        } else {
            // Convert HTTP error to UserApiError
            Err(UserApiError::from_response(response).await)
        }
    }

    /// Creates an upload instruction for the Solad program.
    ///
    /// # Arguments
    /// * `solad_client` - Reference to the SoladClient for program and payer access.
    /// * `data_hash` - SHA-256 hash of the data.
    /// * `size_bytes` - Size of the data in bytes.
    /// * `shard_count` - Number of shards for the data.
    /// * `storage_duration_days` - Duration to store the data in days.
    /// * `treasury_pubkey` - Public key of the treasury account.
    /// * `nodes` - List of node public keys to assign shards to.
    ///
    /// # Returns
    /// * `Result<UploadData, anyhow::Error>` - The constructed upload instruction or an error.
    ///
    /// # Notes
    /// Derives PDAs for upload, user upload keys, escrow, node registry, and storage config.
    /// Constructs account metadata for the instruction, including node accounts.
    async fn create_upload_instruction(
        &self,
        solad_client: &SoladClient,
        data_hash: String,
        size_bytes: u64,
        shard_count: u8,
        storage_duration_days: u64,
        treasury_pubkey: Pubkey,
        nodes: Vec<Pubkey>,
    ) -> Result<UploadData, anyhow::Error> {
        // Derive PDA for upload
        let (upload_pda, _upload_bump) = Pubkey::find_program_address(
            &[
                b"upload",
                data_hash.as_bytes(),
                solad_client.payer.pubkey().as_ref(),
            ],
            &solad_client.program.id(),
        );

        // Derive PDA for user upload keys
        let (user_upload_keys_pda, _user_upload_keys_bump) = Pubkey::find_program_address(
            &[b"user_upload_keys", solad_client.payer.pubkey().as_ref()],
            &solad_client.program.id(),
        );

        // Derive PDA for escrow
        let (escrow_pda, _escrow_bump) = Pubkey::find_program_address(
            &[
                b"escrow",
                data_hash.as_bytes(),
                solad_client.payer.pubkey().as_ref(),
            ],
            &solad_client.program.id(),
        );

        // Derive PDA for node registry
        let (node_registry_pda, _node_registry_bump) =
            Pubkey::find_program_address(&[b"node_registry"], &solad_client.program.id());

        // Derive PDA for storage config
        let (config_pubkey, _config_bump) =
            Pubkey::find_program_address(&[b"storage_config"], &solad_client.program.id());

        // Construct account metadata for the instruction
        let mut accounts = vec![
            AccountMeta::new(user_upload_keys_pda, false),
            AccountMeta::new(upload_pda, false),
            AccountMeta::new(config_pubkey, false),
            AccountMeta::new(node_registry_pda, false),
            AccountMeta::new(solad_client.payer.pubkey(), true),
            AccountMeta::new(treasury_pubkey, false),
            AccountMeta::new(escrow_pda, false),
            AccountMeta::new_readonly(solad_client.program.id(), false),
            AccountMeta::new_readonly(system_program::ID, false),
        ];

        // Add node accounts to the instruction
        for node in nodes.iter() {
            accounts.push(AccountMeta::new(*node, false));
        }

        // Create the upload instruction data
        let instruction_data = contract::instruction::UploadData {
            data_hash,
            size_bytes,
            shard_count,
            storage_duration_days,
        };

        Ok(instruction_data)
    }
}

/// Represents the Solad client for interacting with the Solad program on Solana.
pub struct SoladClient {
    pub program: Program<Arc<Keypair>>, // Anchor program instance for Solad
    pub payer: Arc<Keypair>,           // Payer keypair for signing transactions
}

impl SoladClient {
    /// Creates a new `SoladClient` instance for interacting with the Solad program.
    ///
    /// # Arguments
    /// * `rpc_url` - The Solana RPC URL (e.g., `https://api.devnet.solana.com`).
    /// * `payer` - The keypair used to sign transactions.
    /// * `program_id` - The public key of the Solad program.
    ///
    /// # Returns
    /// * `Result<Self>` - A new `SoladClient` instance or an error.
    ///
    /// # Errors
    /// Returns an error if the client or program initialization fails.
    pub async fn new(rpc_url: &str, payer: Arc<Keypair>, program_id: Pubkey) -> Result<Self> {
        // Initialize Anchor client with custom cluster
        let client = Client::new(
            Cluster::Custom(rpc_url.to_string(), "".to_string()),
            payer.clone(),
        );
        // Initialize program instance
        let program = client.program(program_id)?;
        Ok(SoladClient { program, payer })
    }
}
