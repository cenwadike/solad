mod db;
mod error;
mod handlers;
mod models;
// mod utils;
// mod anchor;
mod data_upload_event;
mod libp2p;

use std::str::FromStr;

use crate::libp2p::PeerInfo;
use ::libp2p::{identity, PeerId};
use actix_web::{web, App, HttpServer};
use async_std::sync::{Arc, Mutex as AsyncMutex};
use dashmap::DashMap;
use data_upload_event::{
    EventListenerConfig, UploadEvent, UploadEventConsumer, UploadEventListener,
};
use db::Database;
use handlers::{delete_value, get_value, set_value};
use libp2p::NetworkManager;
use solana_client::nonblocking::rpc_client::RpcClient;
use solana_sdk::{commitment_config::CommitmentConfig, pubkey::Pubkey};

async fn setup_network_manager(config: &EventListenerConfig) -> Arc<AsyncMutex<NetworkManager>> {
    // Initialize Solana RPC client
    let rpc_client = RpcClient::new(config.http_url.clone());

    // Generate a local keypair for libp2p
    let local_key = identity::Keypair::generate_ed25519();

    // Placeholder peers (replace with actual peer information)
    let peers = vec![
        PeerInfo {
            pubkey: Pubkey::from_str("11111111111111111111111111111111").unwrap(),
            multiaddr: "/ip4/127.0.0.1/tcp/4001".parse().expect("Valid multiaddr"),
            peer_id: PeerId::from_public_key(&identity::Keypair::generate_ed25519().public()),
        },
        // Add more peers as needed
    ];

    // Initialize NetworkManager
    let network_manager = NetworkManager::new(local_key, peers, config.node_pubkey, &rpc_client)
        .await
        .expect("Failed to initialize NetworkManager");
    let network_manager_arc = Arc::new(AsyncMutex::new(network_manager));

    // Start the receive_gossiped_data task
    let db = Arc::new(Database::new("./mydb").expect("Failed to initialize RocksDB"));
    tokio::spawn({
        let db = db.clone();
        let net_manager = network_manager_arc.clone();
        async move {
            let mut network_manager = net_manager.lock().await;
            network_manager.receive_gossiped_data(db).await;
        }
    });

    network_manager_arc
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Initialize RocksDB
    let db = Arc::new(Database::new("./mydb").expect("Failed to initialize RocksDB"));
    // Initialize event map
    let event_map = Arc::new(DashMap::<Pubkey, UploadEvent>::new());

    // Configure the listener
    let config = EventListenerConfig {
        ws_url: "ws://api.mainnet-beta.solana.com".to_string(),
        http_url: "https://api.mainnet-beta.solana.com".to_string(),
        program_id: contract::ID,
        node_pubkey: Pubkey::from_str("YourNodePubkeyHere").unwrap(),
        commitment: CommitmentConfig::confirmed(),
    };

    // Start event listener
    let listener_config = config.clone();
    let listener_map = event_map.clone();
    tokio::spawn(async move {
        let listener = UploadEventListener::new(listener_config, listener_map).await;
        listener.start().await.expect("Listener failed");
    });

    // Start event consumer
    let consumer_config = config.clone();
    let consumer_map = event_map.clone();
    tokio::spawn(async move {
        let consumer = UploadEventConsumer::new(consumer_config, consumer_map).await;
        consumer.start().await.expect("Consumer failed");
    });

    // Initialize NetworkManager
    let network_manager = setup_network_manager(&config).await;

    // Start HTTP server
    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(db.inner.clone()))
            .app_data(web::Data::new(event_map.clone()))
            .app_data(web::Data::new(config.clone()))
            .app_data(web::Data::new(network_manager.clone()))
            .service(
                web::scope("/api")
                    .route("/get", web::get().to(get_value))
                    .route("/set", web::post().to(set_value))
                    .route("/delete", web::delete().to(delete_value)),
            )
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}
