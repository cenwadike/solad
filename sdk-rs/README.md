This Rust SDK provides a seamless way to interact with a backend service for setting and retrieving user data, as well as listening to upload-related events emitted from a Node.

✨ Features
🧠 DataClient – Interact with a backend API to store and retrieve user data.

📡 UploadEventListener – Listen to upload events emitted by a Solana program.

🧾 UploadEventConsumer – Query on-chain Solana accounts for additional data.

🛠️ Built with reqwest, solana-client, dashmap, and serde.

📦 Installation
Add the following to your Cargo.toml:

[dependencies]
your_sdk_name = { git = "https://github.com/yourusername/your-repo.git" }


🏗️ Structure Overview
pub mod error;   // Custom error types
pub mod model;   // Data models (e.g. SetData)
pub mod event;   // Event definitions and listeners

pub struct DataClient      // Interacts with REST API
pub struct UploadEventListener   // WebSocket event listener
pub struct UploadEventConsumer   // Queries Solana accounts

🚀 Usage
✅ Setting and Getting Data

use your_sdk_name::DataClient;
use your_sdk_name::model::SetData;

#[tokio::main]
async fn main() {
    let client = DataClient::new("https://your-api-url.com");

    let data = SetData {
        key: "user_key".to_string(),
        value: "some value".to_string(),
    };

    let res = client.set_data(&data).await.unwrap();
    println!("Set response: {:?}", res);

    let retrieved = client.get_data("user_key".to_string()).await.unwrap();
    println!("Retrieved: {:?}", retrieved);
}


📡 Listening for Upload Events
use your_sdk_name::{UploadEventListener, EventListenerConfig};
use solana_sdk::pubkey::Pubkey;
use solana_sdk::commitment_config::CommitmentConfig;
use std::sync::Arc;
use dashmap::DashMap;

#[tokio::main]
async fn main() {
    let config = EventListenerConfig {
        ws_url: "wss://your-solana-ws-endpoint".to_string(),
        http_url: "https://your-solana-http-endpoint".to_string(),
        program_id: Pubkey::from_str("YourProgramPubkey").unwrap(),
        node_pubkey: Pubkey::from_str("YourNodePubkey").unwrap(),
        commitment: CommitmentConfig::confirmed(),
    };

    let shared_events = Arc::new(DashMap::new());

    let listener = UploadEventListener {
        config,
        event_map: shared_events.clone(),
    };

    // Call your start_listener() function (not shown in original snippet)
    // listener.start().await;
}

📦 Querying Upload Event Data On-chain

use your_sdk_name::{UploadEventConsumer, EventListenerConfig};
use solana_client::nonblocking::rpc_client::RpcClient;
use std::sync::Arc;

let rpc_client = Arc::new(RpcClient::new_with_commitment(
    "https://your-solana-http-endpoint".to_string(),
    CommitmentConfig::confirmed(),
));

let consumer = UploadEventConsumer {
    config: your_config,
    event_map: shared_events,
    rpc_client,
};

// Use consumer methods to fetch and parse on-chain data.

