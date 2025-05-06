/// This module serves as the entry point for a decentralized storage network application.
/// It initializes the core components, including the database, data store, event listeners,
/// network manager, and HTTP server, using Actix-web for API endpoints and libp2p for
/// peer-to-peer networking. The application integrates with the Solana blockchain for
/// event listening and payment verification.
///
/// The module sets up asynchronous tasks for event processing, gossip data handling, and
/// HTTP request handling, ensuring robust operation of the decentralized storage node.
use ::libp2p::{identity, PeerId};
use actix_web::{web, App, HttpServer};
use async_std::sync::{Arc, Mutex as AsyncMutex};
use dashmap::DashMap;
use data_upload_event::UploadEventConsumer;
use solana_client::nonblocking::rpc_client::RpcClient;
use solana_sdk::commitment_config::CommitmentConfig;
use solana_sdk::pubkey::Pubkey;
use std::str::FromStr;

use crate::data_store::DataStore;
use crate::data_upload_event::{EventListenerConfig, UploadEvent, UploadEventListener};
use crate::db::Database;
use crate::handlers::{get_value, set_value};
use crate::network_manager::{NetworkManager, PeerInfo};

mod data_store;
mod data_upload_event;
mod db;
mod error;
mod handlers;
mod models;
mod network_manager;
mod solad_client;

/// Sets up the `NetworkManager` for peer-to-peer communication and gossip handling.
///
/// This function initializes a Solana RPC client, generates a libp2p keypair, creates
/// placeholder peer information, and constructs a `NetworkManager` instance. It also
/// spawns an asynchronous task to handle receiving and processing gossiped data.
///
/// # Arguments
///
/// * `config` - Configuration for event listeners, including Solana RPC URLs and node
///   public key.
/// * `db` - Shared reference to the RocksDB database instance.
/// * `data_store` - Shared reference to the `DataStore` for managing key-value pairs.
///
/// # Returns
///
/// * `Arc<AsyncMutex<NetworkManager>>` - A thread-safe reference to the initialized
///   `NetworkManager`.
///
/// # Workflow
///
/// 1. **RPC Client Initialization**: Creates a non-blocking Solana RPC client using the
///    HTTP URL from the config.
/// 2. **Keypair Generation**: Generates an Ed25519 keypair for libp2p authentication.
/// 3. **Peer Setup**: Creates a placeholder peer with a default public key, multiaddress,
///    and peer ID (intended to be replaced with actual peer data).
/// 4. **NetworkManager Initialization**: Constructs a `NetworkManager` with the generated
///    keypair, peer list, node public key, RPC client, database, and program ID.
/// 5. **Gossip Task**: Spawns a task to run `receive_gossiped_data` on the `NetworkManager`,
///    processing incoming gossiped data and storing it in the `DataStore`.
///
/// # Panics
///
/// Panics if the `NetworkManager` initialization fails or if the placeholder multiaddress
/// is invalid.
async fn setup_network_manager(
    config: &EventListenerConfig,
    db: Arc<Database>,
    data_store: Arc<DataStore>,
) -> Arc<AsyncMutex<NetworkManager>> {
    // Initialize Solana RPC client
    let rpc_client = RpcClient::new(config.http_url.clone());

    // Generate a local keypair for libp2p
    let local_key = identity::Keypair::generate_ed25519();
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();
    // Placeholder peers (replace with actual peer information)
    let peers = vec![PeerInfo {
        pubkey: Pubkey::from_str("11111111111111111111111111111111").unwrap(),
        multiaddr: "/ip4/127.0.0.1/tcp/4001".parse().expect("Valid multiaddr"),
        peer_id: PeerId::from_public_key(&identity::Keypair::generate_ed25519().public()),
        last_seen: now,
    }];

    // Initialize NetworkManager
    let network_manager = NetworkManager::new(
        local_key,
        peers,
        config.node_pubkey,
        Arc::new(rpc_client),
        db.clone(),
        config.program_id,
    )
    .await
    .expect("Failed to initialize NetworkManager");
    let network_manager_arc = Arc::new(AsyncMutex::new(network_manager));

    // Start the receive_gossiped_data task
    tokio::spawn({
        let data_store = data_store.clone();
        let net_manager = network_manager_arc.clone();
        async move {
            let mut network_manager = net_manager.lock().await;
            network_manager.receive_gossiped_data(data_store).await;
        }
    });

    network_manager_arc
}

/// Main entry point for the decentralized storage node application.
///
/// Initializes the database, data store, event map, event listeners, event consumer,
/// network manager, and HTTP server. Runs the application using Actix-web's async runtime.
///
/// # Returns
///
/// * `std::io::Result<()>` - Returns `Ok(())` if the server runs successfully, or an
///   `Err` if there is an I/O error (e.g., failure to bind to the port).
///
/// # Workflow
///
/// 1. **Database Initialization**: Creates a RocksDB instance at the path `./mydb`.
/// 2. **Data Store Setup**: Initializes a `DataStore` with the database instance.
/// 3. **Event Map Creation**: Creates a thread-safe `DashMap` to store upload events
///    keyed by `Pubkey`.
/// 4. **Configuration Setup**: Configures the `EventListenerConfig` with Solana WebSocket
///    and HTTP URLs, program ID, node public key, and commitment level.
/// 5. **Event Listener**: Spawns a task to run the `UploadEventListener`, which listens
///    for upload events on the Solana blockchain and stores them in the event map.
/// 6. **Event Consumer**: Spawns a task to run the `UploadEventConsumer`, which processes
///    events from the event map for payment verification.
/// 7. **Network Manager**: Calls `setup_network_manager` to initialize the `NetworkManager`
///    and start gossip handling.
/// 8. **HTTP Server**: Starts an Actix-web server on `127.0.0.1:8080`, registering
///    `/api/get` and `/api/set` endpoints for data retrieval and storage.
///
/// # API Endpoints
///
/// - `GET /api/get`: Retrieves a value by key (handled by `get_value`).
/// - `POST /api/set`: Stores a key-value pair with payment verification (handled by
///   `set_value`).
///
/// # Panics
///
/// Panics if:
/// - The RocksDB database fails to initialize.
/// - The `NetworkManager` fails to initialize.
/// - The event listener or consumer fails to start.
///
/// # Examples
///
/// Start the server:
/// ```bash
/// cargo run
/// ```
///
/// Access the API:
/// ```http
/// GET http://127.0.0.1:8080/api/get?key=my_key
/// POST http://127.0.0.1:8080/api/set
/// Content-Type: application/json
/// {
///   "key": "my_key",
///   "data": "SGVsbG8gV29ybGQh",
///   "hash": "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
///   "format": "text",
///   "upload_pda": "7b8f4a2e9c1d4b3e8f5c3a7b9e2d1f4a..."
/// }
/// ```
#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Initialize RocksDB
    let db = Arc::new(Database::new("./mydb").expect("Failed to initialize RocksDB"));
    // Initialize data store
    let data_store = Arc::new(DataStore::new(db.clone()));
    // Initialize event map
    let event_map = Arc::new(DashMap::<Pubkey, UploadEvent>::new());
    // Configure the listener
    let config = EventListenerConfig {
        ws_url: "ws://api.mainnet-beta.solana.com".to_string(),
        http_url: "https://api.mainnet-beta.solana.com".to_string(),
        program_id: contract::ID,
        node_pubkey: Pubkey::from_str("11111111111111111111111111111111").unwrap(),
        commitment: CommitmentConfig::confirmed(),
    };

    // Start event listener
    let listener_config = config.clone();
    let listener_map = event_map.clone();
    tokio::spawn(async move {
        let listener = UploadEventListener::new(listener_config, listener_map);
        listener.await.start().await.expect("Listener failed");
    });

    // Start event consumer
    let consumer_config = config.clone();
    let consumer_map = event_map.clone();
    tokio::spawn(async move {
        let consumer = UploadEventConsumer::new(consumer_config, consumer_map).await;
        consumer.start().await.expect("Consumer failed");
    });

    let config = Arc::new(config);

    // Initialize NetworkManager
    let network_manager = setup_network_manager(&config, db.clone(), data_store.clone()).await;

    // Start HTTP server
    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(db.clone()))
            .app_data(web::Data::new(data_store.clone()))
            .app_data(web::Data::new(event_map.clone()))
            .app_data(web::Data::new(config.clone()))
            .app_data(web::Data::new(network_manager.clone()))
            .service(
                web::scope("/api")
                    .route("/get", web::get().to(get_value))
                    .route("/set", web::post().to(set_value)),
            )
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}
