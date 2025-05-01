mod db;
mod error;
mod handlers;
mod models;
// mod utils;
// mod anchor;
mod data_upload_event;

use std::{str::FromStr, sync::Arc};

use actix_web::{web, App, HttpServer};
use dashmap::DashMap;
use data_upload_event::{
    EventListenerConfig, UploadEvent, UploadEventConsumer, UploadEventListener,
};
use db::Database;
use handlers::{delete_value, get_value, set_value};
use solana_sdk::{commitment_config::CommitmentConfig, pubkey::Pubkey};

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

    // Start HTTP server
    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(db.inner.clone()))
            .app_data(web::Data::new(event_map.clone()))
            .app_data(web::Data::new(config.clone()))
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
