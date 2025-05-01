mod db;
mod error;
mod handlers;
mod models;
// mod utils;
// mod anchor;
// mod solana_event;

use actix_web::{web, App, HttpServer};
use db::Database;
use handlers::{delete_value, get_value, set_value};

// use crate::solana_event::solana_listener;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Initialize RocksDB
    let db = Database::new("./mydb").expect("Failed to initialize RocksDB");

    // let program_id = "YOUR_PROGRAM_ID_HERE";
    
    // // Clone DB for background task
    // let db_clone = db.clone();
    // tokio::spawn(async move {
    //     solana_listener(db_clone, program_id.to_string()).await
    // });

    // Start HTTP server
    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(db.inner.clone()))
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