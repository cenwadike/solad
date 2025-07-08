/// This module serves as the entry point for a decentralized storage network application.
/// It initializes the core components, including the database, data store, event listeners,
/// network manager, and HTTP server, using Actix-web for API endpoints and libp2p for
/// peer-to-peer networking. The application integrates with the Solana blockchain for
/// event listening and payment verification.
///
/// The module sets up asynchronous tasks for event processing, gossip data handling, and
/// HTTP request handling, ensuring robust operation of the decentralized storage node.
/// Logs are written to `./logs/node.log.txt` in JSON format with rotation for audit purposes,
/// and colored console output is preserved for real-time debugging.
use ::libp2p::{identity, PeerId};
use actix_web::{web, App, HttpServer, post};
use std::sync::Arc;
use tokio::sync::Mutex as TokioMutex;
use chrono::Local;
use colored::Colorize;
use dashmap::DashMap;
use data_upload_event::UploadEventConsumer;
use dotenv::dotenv;
use env_logger::Builder;
use log::{error, info, LevelFilter};
use serde_json::json;
use solana_client::nonblocking::rpc_client::RpcClient;
use solana_sdk::commitment_config::CommitmentConfig;
use solana_sdk::pubkey::Pubkey;
use solana_sdk::signature::Keypair;
use solana_sdk::signer::Signer;
use std::env;
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::Path;
use strip_ansi_escapes;

use jsonrpc_core::{IoHandler, Params, Value, Error as RpcError};
use serde_json::json;

use crate::data_store::DataStore;
use crate::data_upload_event::{EventListenerConfig, UploadEvent, UploadEventListener};
use crate::db::Database;
use crate::handlers::{get_value, health, set_value};
use crate::network_manager::{NetworkManager, PeerInfo};
use  crate::json_rpc::rpc;

mod data_store;
mod data_upload_event;
mod db;
mod error;
mod handlers;
mod models;
mod network_manager;
mod solad_client;
mod json_rpc;

/// Sets up the logging system to write JSON logs to `./logs/node.log.txt` with rotation
/// and colored console output.
///
/// Creates the logs directory, configures `env_logger` to write structured JSON logs to
/// the file, and rotates the log file when it exceeds 10 MB by archiving it with a
/// timestamp. Console output retains colors and emojis for real-time debugging.
///
/// # Returns
///
/// * `std::io::Result<()>` - Returns `Ok(())` if logging is set up successfully, or an
///   `Err` if there is an I/O error (e.g., failure to create the log file).
fn setup_logging() -> std::io::Result<()> {
    // Create logs directory
    let log_dir = "./logs";
    fs::create_dir_all(log_dir)?;

    // Check current log file size
    let log_path = Path::new(log_dir).join("node.log.txt");
    let max_size = 10 * 1024 * 1024; // 10 MB
    if log_path.exists() {
        if let Ok(metadata) = fs::metadata(&log_path) {
            if metadata.len() > max_size {
                // Rotate log file
                let timestamp = Local::now().format("%Y%m%d_%H%M%S").to_string();
                let archive_path = Path::new(log_dir).join(format!("node.log.{}.txt", timestamp));
                fs::rename(&log_path, &archive_path)?;
                info!("📜 Rotated log file to {}", archive_path.display());
            }
        }
    }

    // Open or create log file
    let log_file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_path)?;

    // Configure logger to write to both file (JSON) and console (colored)
    Builder::new()
        .filter_level(LevelFilter::Info) // Log Info and above
        .format(move |buf, record| {
            let timestamp = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
            // Strip ANSI color codes for file output
            let message = format!("{}", record.args());
            let plain_message = strip_ansi_escapes::strip(&message);
            let plain_message = String::from_utf8(plain_message).unwrap_or(message.clone());

            // Write JSON to file
            let log_entry = json!({
                "timestamp": timestamp,
                "level": record.level().to_string(),
                "message": plain_message
            });
            writeln!(log_file.try_clone()?, "{}", log_entry.to_string())?;

            // Write colored output to console
            writeln!(
                buf,
                "[{}] {}: {}",
                timestamp.bright_blue(),
                record.level(),
                message
            )
        })
        .write_style(env_logger::WriteStyle::Always) // Colors in console
        .init();

    Ok(())
}

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
/// * `Arc<TokioMutex<NetworkManager>>` - A thread-safe reference to the initialized
///   `NetworkManager`.
async fn setup_network_manager(
    config: &EventListenerConfig,
    db: Arc<Database>,
    data_store: Arc<DataStore>,
) -> Arc<TokioMutex<NetworkManager>> {
    // Initialize Solana RPC client
    let rpc_client = RpcClient::new(config.http_url.clone());

    // Generate a local keypair for libp2p
    let local_key = identity::Keypair::generate_ed25519();
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();

    // Load NODE_SOLANA_PRIVKEY as a Pubkey for peers
    let node_pubkey_str =
        env::var("NODE_SOLANA_PRIVKEY").expect("NODE_SOLANA_PRIVKEY environment variable not set");
    let node_pubkey = Keypair::from_base58_string(&node_pubkey_str).pubkey();

    // Peers (using NODE_SOLANA_PRIVKEY as pubkey)
    let seed_nodes = env::var("SEED_NODES").unwrap_or_default();
    let peers = if seed_nodes.is_empty() {
        // Standalone mode with placeholder peer
        vec![PeerInfo {
            pubkey: node_pubkey,
            multiaddr: "/ip4/127.0.0.1/tcp/4001".parse().expect("Valid multiaddr"),
            peer_id: PeerId::from_public_key(&identity::Keypair::generate_ed25519().public()),
            last_seen: now,
        }]
    } else {
        // Parse SEED_NODES (e.g., "/ip4/1.2.3.4/tcp/4001,/ip4/5.6.7.8/tcp/4001")
        seed_nodes
            .split(',')
            .map(|addr| PeerInfo {
                pubkey: node_pubkey,
                multiaddr: addr.parse().expect("Valid multiaddr"),
                peer_id: PeerId::from_public_key(&identity::Keypair::generate_ed25519().public()),
                last_seen: now,
            })
            .collect()
    };

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
    
    let network_manager_arc = Arc::new(TokioMutex::new(network_manager));

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
#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Load environment variables from .env file
    dotenv().ok(); // Continue even if .env file is missing
    info!("Loaded environment variables");

    // Initialize logging
    setup_logging()?;

    info!("🚀 Starting decentralized storage node");

    // Initialize RocksDB
    let db = Arc::new(Database::new("./mydb").expect("Failed to initialize RocksDB"));
    info!("Initialized RocksDB at ./mydb");

    // Initialize data store
    let data_store = Arc::new(DataStore::new(db.clone()));
    info!("Initialized DataStore");

    // Initialize event map
    let event_map = Arc::new(DashMap::<Pubkey, UploadEvent>::new());
    info!("Initialized event map");

    // Configure the listener with environment variables
    let ws_url = env::var("WS_URL").unwrap_or_else(|_| {
        info!("WS_URL not set, using default: ws://api.mainnet-beta.solana.com");
        "ws://api.mainnet-beta.solana.com".to_string()
    });
    let http_url = env::var("HTTP_URL").unwrap_or_else(|_| {
        info!("HTTP_URL not set, using default: https://api.mainnet-beta.solana.com");
        "https://api.mainnet-beta.solana.com".to_string()
    });
    let node_pubkey_str =
        env::var("NODE_SOLANA_PRIVKEY").expect("NODE_SOLANA_PRIVKEY environment variable not set");
    let node_pubkey = Keypair::from_base58_string(&node_pubkey_str).pubkey();

    let config = EventListenerConfig {
        ws_url,
        http_url,
        program_id: contract::ID,
        node_pubkey,
        commitment: CommitmentConfig::confirmed(),
    };
    info!(
        "Configured EventListenerConfig with node_pubkey: {}",
        node_pubkey
    );

    // Start event listener
    let listener_config = config.clone();
    let listener_map = event_map.clone();
    tokio::spawn(async move {
        let listener = UploadEventListener::new(listener_config, listener_map).await;
        if let Err(e) = listener.start().await {
            error!("Event listener failed: {}", e);
        }
    });

    // Start event consumer
    let consumer_config = config.clone();
    let consumer_map = event_map.clone();
    tokio::spawn(async move {
        let consumer = UploadEventConsumer::new(consumer_config, consumer_map).await;
        if let Err(e) = consumer.start().await {
            error!("Event consumer failed: {}", e);
        }
    });

    let config = Arc::new(config);

    // Initialize NetworkManager
    let network_manager = setup_network_manager(&config, db.clone(), data_store.clone()).await;
    info!("Initialized NetworkManager");

    // json rpc server started here
    let mut io = IoHandler::new();

    // get_value JSON-RPC method
    {
        let db = db.clone();
        io.add_method("get_value", move |params: Params| {
            let db = db.clone();
            async move {
                let query: KeyQuery = params.parse()?;
                let value = db
                    .get(query.key.as_bytes())
                    .map_err(|e| RpcError::internal_error().message(e.to_string()))?
                    .ok_or_else(|| RpcError::invalid_params("Key not found"))?;

                Ok(Value::String(String::from_utf8_lossy(&value).to_string()))
            }
        });
    }

    // set_value JSON-RPC method
    {
        let data_store = data_store.clone();
        let event_map = event_map.clone();
        let config = config.clone();
        let network_manager = network_manager.clone();

        io.add_method("set_value", move |params: Params| {
            let data_store = data_store.clone();
            let event_map = event_map.clone();
            let config = config.clone();
            let network_manager = network_manager.clone();

            async move {
                let payload: KeyValuePayload = params.parse()?;

                // Reuse your existing async set_value logic
                let response = set_value(
                    web::Data::new(data_store.clone()),
                    web::Data::new(event_map.clone()),
                    web::Json(payload),
                    web::Data::new(config.clone()),
                    web::Data::new(network_manager.clone()),
                ).await;

                match response {
                    Ok(_) => Ok(Value::String("Data set successfully".into())),
                    Err(e) => Err(RpcError::internal_error().message(format!("{:?}", e)))
                }
            }
        });
    }

    let shared_handler = web::Data::new(Arc::new(TokioMutex::new(io)));

    // end of json-rpc server

    // Start HTTP server
    info!("Starting HTTP server on 127.0.0.1:8080");
    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(db.clone()))
            .app_data(web::Data::new(data_store.clone()))
            .app_data(web::Data::new(event_map.clone()))
            .app_data(web::Data::new(config.clone()))
            .app_data(web::Data::new(network_manager.clone()))
            .service(
                web::scope("/api")
                    .route("/health", web::get().to(health))
                    .route("/get", web::get().to(get_value))
                    .route("/set", web::post().to(set_value)),
            )
            .service(rpc) // <-- add JSON-RPC endpoint here
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}
