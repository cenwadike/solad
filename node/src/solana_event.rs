use solana_client::pubsub_client::PubsubClient;
use solana_sdk::commitment_config::CommitmentConfig;
use crate::db::Database;
use anchor_lang::prelude::*;
use crate::anchor::MyEvent;

pub async fn solana_listener(db: Database, program_id: String) {
    let program_pubkey = program_id.parse().expect("Invalid program ID");
    let ws_url = "wss://api.mainnet-beta.solana.com";
    let commitment = CommitmentConfig::confirmed();

    loop {
        match PubsubClient::new(ws_url).await {
            Ok(client) => {
                let subscription = client
                    .program_subscribe(&program_pubkey, Some(commitment))
                    .await
                    .expect("Subscription failed");

                while let Some(notification) = subscription.next().await {
                    process_transaction(&db, notification).await;
                }
            }
            Err(e) => {
                eprintln!("Connection error: {}. Retrying in 5s...", e);
                tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
            }
        }
    }
}

async fn process_transaction(db: &Database, notification: ProgramNotification) {
    let logs = notification.logs.join("\n");
    if let Some(event) = parse_anchor_event(&logs) {
        let key = notification.signature.as_bytes();
        if let Err(e) = db.store_event(key, &event) {
            eprintln!("Error storing event: {}", e);
        }
    }
}

fn parse_anchor_event(logs: &str) -> Option<MyEvent> {
    const EVENT_DISCRIMINATOR: [u8; 8] = [/* Your event discriminator here */];
    
    logs.lines()
        .find(|line| line.starts_with("Program data:"))
        .and_then(|line| {
            let data = hex::decode(line.replace("Program data: ", "")).ok()?;
            if data[..8] == EVENT_DISCRIMINATOR {
                bincode::deserialize(&data[8..]).ok()
            } else {
                None
            }
        })
}