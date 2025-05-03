use async_std::sync::{Arc, Mutex as AsyncMutex};
use async_std::task;
use futures::StreamExt;
use ip_network::IpNetwork;
use libp2p::multiaddr;
use libp2p::swarm::{SwarmBuilder, SwarmEvent};
use libp2p::{
    core::upgrade,
    gossipsub::{self, GossipsubEvent, MessageAuthenticity, MessageId, ValidationMode},
    identity,
    multiaddr::Protocol,
    noise, tcp, yamux, Multiaddr, NetworkBehaviour, PeerId, Swarm, Transport,
};
use log::{error, info, warn};
use rand::seq::SliceRandom;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use solana_client::nonblocking::rpc_client::RpcClient;
use solana_sdk::pubkey::Pubkey;
use std::collections::{HashMap, HashSet};
use std::net::Ipv4Addr;
use std::str::FromStr;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tokio::sync::mpsc;

use crate::data_store::DataStore;
use crate::db::Database;
use crate::error::ApiError;
use crate::solad_client::SoladClient;
use solana_sdk::signature::Keypair;
use std::env;

// Structure to hold peer information
#[derive(Clone)]
pub struct PeerInfo {
    pub pubkey: Pubkey,
    pub multiaddr: Multiaddr,
    pub peer_id: PeerId,
    pub last_seen: u64, // Timestamp of last activity
}

// Message structure for gossip
#[derive(Serialize, Deserialize, Clone)]
struct GossipMessage {
    key: String,
    data: Vec<u8>,
    format: String,
    origin_pubkey: String,
    upload_pda: String,
    timestamp: u64, // For replay protection
    hash: String,   // Data hash for integrity
}

// Custom network behaviour combining gossipsub
#[derive(NetworkBehaviour)]
#[behaviour(out_event = "gossipsub::GossipsubEvent")]
struct SoladBehaviour {
    gossipsub: gossipsub::Gossipsub,
}

// Structure to manage libp2p swarm
pub struct NetworkManager {
    swarm: Arc<AsyncMutex<Swarm<SoladBehaviour>>>,
    peers: Arc<AsyncMutex<HashMap<String, PeerInfo>>>,
    receiver: mpsc::Receiver<GossipMessage>,
    _sender: mpsc::Sender<GossipMessage>,
    local_data: Arc<AsyncMutex<HashSet<String>>>,
    peer_reputation: Arc<AsyncMutex<HashMap<PeerId, i32>>>,
    message_rate: Arc<AsyncMutex<HashMap<PeerId, (u64, u32)>>>,
    seen_messages: Arc<AsyncMutex<HashSet<MessageId>>>,
    ip_blacklist: Arc<AsyncMutex<HashSet<IpNetwork>>>,
    connection_attempts: Arc<AsyncMutex<HashMap<PeerId, (u64, u32)>>>,
}

impl NetworkManager {
    pub async fn new(
        local_key: identity::Keypair,
        peers: Vec<PeerInfo>,
        local_pubkey: Pubkey,
        rpc_client: Arc<RpcClient>,
        db: Arc<Database>,
        program_id: Pubkey,
    ) -> Result<Self, ApiError> {
        let local_peer_id = PeerId::from(local_key.public());

        // Verify that local_pubkey corresponds to local_key
        let _ = rpc_client.get_account(&local_pubkey).await.map_err(|e| {
            ApiError::NetworkError(anyhow::anyhow!("Failed to fetch local account: {}", e))
        })?;
        info!("Verified local node pubkey: {}", local_pubkey);

        // Load payer keypair from environment variable
        let payer =
            Keypair::from_base58_string(&env::var("SOLANA_ADMIN_PRIVATE_KEY").map_err(|e| {
                ApiError::NetworkError(anyhow::anyhow!("SOLANA_ADMIN_PRIVATE_KEY not set: {}", e))
            })?);

        // Initialize Solad client
        let solad_client = SoladClient::new(&rpc_client.url(), Arc::new(payer), program_id)
            .await
            .map_err(|e| {
                ApiError::NetworkError(anyhow::anyhow!("Failed to initialize SoladClient: {}", e))
            })?;

        // Derive node PDA
        let (node_pda, _node_bump) =
            Pubkey::find_program_address(&[b"node", local_pubkey.as_ref()], &program_id);

        // Check local registration status
        let registration_key = "node_registered";
        let is_registered = db
            .inner
            .get(registration_key.as_bytes())
            .map_err(|e| ApiError::Database(e))?
            .map(|val| val == b"true")
            .unwrap_or(false);

        if !is_registered {
            let node_exists = rpc_client.get_account(&node_pda).await.is_ok();
            if !node_exists {
                info!("Node account does not exist, registering node with stake...");
                let storage_config_pubkey = Pubkey::from_str("YourStorageConfigPubkeyHere")
                    .map_err(|e| {
                        ApiError::NetworkError(anyhow::anyhow!(
                            "Invalid storage config pubkey: {}",
                            e
                        ))
                    })?;
                solad_client
                    .register_node(1_000_000_000, storage_config_pubkey)
                    .await
                    .map_err(|e| {
                        ApiError::NetworkError(anyhow::anyhow!("Failed to register node: {}", e))
                    })?;
                info!("Node registered successfully at PDA: {}", node_pda);

                db.inner
                    .put(registration_key.as_bytes(), b"true")
                    .map_err(|e| ApiError::Database(e))?;
            } else {
                db.inner
                    .put(registration_key.as_bytes(), b"true")
                    .map_err(|e| ApiError::Database(e))?;
                info!(
                    "Node already registered at PDA: {}, updated local status",
                    node_pda
                );
            }
        } else {
            info!(
                "Node registration status confirmed locally for PDA: {}",
                node_pda
            );
        }

        let (_sender, receiver) = mpsc::channel(100);

        let gossipsub_config = gossipsub::GossipsubConfigBuilder::default()
            .heartbeat_interval(Duration::from_secs(10))
            .validation_mode(ValidationMode::Strict)
            .message_id_fn(|msg| {
                let mut hasher = Sha256::new();
                hasher.update(&msg.data);
                hasher.update(msg.sequence_number.unwrap_or(0).to_be_bytes());
                MessageId::from(hasher.finalize().to_vec())
            })
            .max_transmit_size(64 * 1024)
            .flood_publish(false)
            .mesh_n(6)
            .mesh_n_low(4)
            .mesh_n_high(8)
            .history_length(300)
            .build()
            .map_err(|e| ApiError::NetworkError(anyhow::anyhow!(e.to_string())))?;

        let mut gossipsub = gossipsub::Gossipsub::new(
            MessageAuthenticity::Signed(local_key.clone()),
            gossipsub_config,
        )
        .map_err(|e| ApiError::NetworkError(anyhow::anyhow!(e.to_string())))?;

        let data_topic = gossipsub::IdentTopic::new("solad-shard");
        gossipsub
            .subscribe(&data_topic)
            .map_err(|e| ApiError::NetworkError(anyhow::anyhow!(e.to_string())))?;

        let discovery_topic = gossipsub::IdentTopic::new("solad-discovery");
        gossipsub
            .subscribe(&discovery_topic)
            .map_err(|e| ApiError::NetworkError(anyhow::anyhow!(e.to_string())))?;

        let transport = tcp::TcpTransport::new(tcp::GenTcpConfig::default())
            .upgrade(upgrade::Version::V1)
            .authenticate(
                noise::NoiseAuthenticated::xx(&local_key)
                    .expect("Noise authentication config is valid"),
            )
            .multiplex(yamux::YamuxConfig::default())
            .timeout(Duration::from_secs(20))
            .boxed();

        let behaviour = SoladBehaviour { gossipsub };
        let swarm = SwarmBuilder::new(transport, behaviour, local_peer_id)
            .connection_limits(
                libp2p::swarm::ConnectionLimits::default()
                    .with_max_pending_incoming(Some(100))
                    .with_max_pending_outgoing(Some(100))
                    .with_max_established_incoming(Some(100))
                    .with_max_established_outgoing(Some(100)),
            )
            .build();

        let swarm = Arc::new(AsyncMutex::new(swarm));

        let listen_addr: Multiaddr =
            "/ip4/0.0.0.0/tcp/0"
                .parse()
                .map_err(|e: multiaddr::Error| {
                    ApiError::NetworkError(anyhow::anyhow!(e.to_string()))
                })?;
        swarm
            .lock()
            .await
            .listen_on(listen_addr)
            .map_err(|e| ApiError::NetworkError(anyhow::anyhow!(e.to_string())))?;

        let ip_blacklist: HashSet<IpNetwork> = vec![IpNetwork::new(
            "192.168.0.0"
                .parse::<Ipv4Addr>()
                .map_err(|e| ApiError::NetworkError(anyhow::anyhow!("Invalid IP: {}", e)))?,
            16,
        )
        .map_err(|e| ApiError::NetworkError(anyhow::anyhow!("Invalid netmask: {}", e)))?]
        .into_iter()
        .collect();

        #[derive(Clone, Serialize, Deserialize)]
        struct Node {
            owner: Pubkey,
            stake_amount: u64,
            upload_count: u64,
            last_pos_time: i64,
            last_claimed_epoch: u64,
            is_active: bool,
        }

        #[derive(Clone, Serialize, Deserialize)]
        struct PeerDiscoveryMessage {
            peers: Vec<(Pubkey, Multiaddr, String)>,
            timestamp: u64,
            signature: Vec<u8>,
        }

        async fn validate_active_peers(
            rpc_client: Arc<RpcClient>,
            program_id: &Pubkey,
            peers: Vec<PeerInfo>,
            ip_blacklist: &HashSet<IpNetwork>,
        ) -> Result<Vec<PeerInfo>, ApiError> {
            let (registry_pda, _bump) =
                Pubkey::find_program_address(&[b"node_registry"], program_id);
            let registry_account = rpc_client.get_account(&registry_pda).await.map_err(|e| {
                ApiError::NetworkError(anyhow::anyhow!("Failed to fetch node registry: {}", e))
            })?;
            let node_registry: Vec<Pubkey> = serde_json::from_slice(&registry_account.data)
                .map_err(|e| {
                    ApiError::NetworkError(anyhow::anyhow!(
                        "Failed to deserialize node registry: {}",
                        e
                    ))
                })?;

            let node_pdas: Vec<Pubkey> = node_registry
                .iter()
                .map(|pubkey| {
                    Pubkey::find_program_address(&[b"node", pubkey.as_ref()], program_id).0
                })
                .collect();

            let node_accounts =
                rpc_client
                    .get_multiple_accounts(&node_pdas)
                    .await
                    .map_err(|e| {
                        ApiError::NetworkError(anyhow::anyhow!(
                            "Failed to fetch node accounts: {}",
                            e
                        ))
                    })?;

            let mut active_nodes = HashSet::new();
            for (pubkey, account_opt) in node_registry.iter().zip(node_accounts.iter()) {
                if let Some(account) = account_opt {
                    if let Ok(node_data) = serde_json::from_slice::<Node>(&account.data) {
                        if node_data.is_active {
                            active_nodes.insert(*pubkey);
                        }
                    }
                }
            }

            let mut valid_peers = Vec::new();
            let now = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs();

            for mut peer in peers {
                if !active_nodes.contains(&peer.pubkey) {
                    warn!("Peer {} is not registered or not active", peer.pubkey);
                    continue;
                }

                let ip = peer.multiaddr.iter().find_map(|p| match p {
                    Protocol::Ip4(ip) => Some(ip),
                    _ => None,
                });
                if let Some(ip) = ip {
                    if ip_blacklist.iter().any(|net| net.contains(ip)) {
                        warn!("Skipping blacklisted peer: {}", peer.multiaddr);
                        continue;
                    }
                }

                let account = rpc_client
                    .get_account(&peer.pubkey)
                    .await
                    .map_err(|e| ApiError::NetworkError(anyhow::anyhow!(e.to_string())))?;
                if account.owner != Pubkey::from_str("11111111111111111111111111111111").unwrap() {
                    warn!("Skipping invalid peer: {}", peer.pubkey);
                    continue;
                }

                peer.last_seen = now;
                valid_peers.push(peer);
            }

            Ok(valid_peers)
        }

        fn compute_message_hash(peers: &[(Pubkey, Multiaddr, String)], timestamp: u64) -> Vec<u8> {
            let mut hasher = Sha256::new();
            for (pubkey, multiaddr, peer_id) in peers {
                hasher.update(pubkey.to_bytes());
                hasher.update(multiaddr.to_string().as_bytes());
                hasher.update(peer_id.as_bytes());
            }
            hasher.update(timestamp.to_be_bytes());
            hasher.finalize().to_vec()
        }

        async fn verify_discovery_message(
            message: &PeerDiscoveryMessage,
            rpc_client: Arc<RpcClient>,
            program_id: &Pubkey,
        ) -> Result<Pubkey, ApiError> {
            let (registry_pda, _bump) =
                Pubkey::find_program_address(&[b"node_registry"], program_id);
            let registry_account = rpc_client.get_account(&registry_pda).await.map_err(|e| {
                ApiError::NetworkError(anyhow::anyhow!("Failed to fetch node registry: {}", e))
            })?;
            let node_registry: Vec<Pubkey> = serde_json::from_slice(&registry_account.data)
                .map_err(|e| {
                    ApiError::NetworkError(anyhow::anyhow!(
                        "Failed to deserialize node registry: {}",
                        e
                    ))
                })?;

            let hash = compute_message_hash(&message.peers, message.timestamp);
            if message.signature.len() != 64 {
                return Err(ApiError::NetworkError(anyhow::anyhow!(
                    "Invalid signature length: expected 64 bytes, got {}",
                    message.signature.len()
                )));
            }
            let mut signature_bytes = [0u8; 64];
            signature_bytes.copy_from_slice(&message.signature);
            let signature = solana_sdk::signature::Signature::from(signature_bytes);
            for pubkey in node_registry {
                if signature.verify(&pubkey.to_bytes(), &hash) {
                    return Ok(pubkey);
                }
            }
            Err(ApiError::NetworkError(anyhow::anyhow!(
                "No valid signature found for discovery message"
            )))
        }

        // Initialize peers HashMap with provided peers
        let mut peers_map = HashMap::new();
        for peer in peers {
            let pubkey_str = peer.pubkey.to_string();
            peers_map.insert(pubkey_str, peer);
        }
        let peers = Arc::new(AsyncMutex::new(peers_map));
        let ip_blacklist = Arc::new(AsyncMutex::new(ip_blacklist));
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        let valid_peers = validate_active_peers(
            rpc_client.clone(),
            &program_id,
            peers.lock().await.values().cloned().collect(),
            &*ip_blacklist.lock().await,
        )
        .await?;
        {
            let mut peers_map = peers.lock().await;
            for peer in valid_peers {
                let pubkey_str = peer.pubkey.to_string();
                peers_map.insert(pubkey_str, peer);
            }
        }

        let bootstrap_addr: Multiaddr =
            "/ip4/127.0.0.1/tcp/4000"
                .parse()
                .map_err(|e: multiaddr::Error| {
                    ApiError::NetworkError(anyhow::anyhow!(e.to_string()))
                })?;
        swarm
            .lock()
            .await
            .dial(bootstrap_addr.clone())
            .map_err(|e| ApiError::NetworkError(anyhow::anyhow!(e.to_string())))?;

        let peer_reputation = Arc::new(AsyncMutex::new(HashMap::new()));
        let message_rate = Arc::new(AsyncMutex::new(HashMap::new()));
        let seen_messages = Arc::new(AsyncMutex::new(HashSet::new()));
        let connection_attempts = Arc::new(AsyncMutex::new(HashMap::new()));
        let last_discovery = Arc::new(AsyncMutex::new(now));

        let swarm_clone = Arc::clone(&swarm);
        let peers_clone = Arc::clone(&peers);
        let peer_reputation_clone = Arc::clone(&peer_reputation);
        let message_rate_clone = Arc::clone(&message_rate);
        let seen_messages_clone = Arc::clone(&seen_messages);
        let connection_attempts_clone = Arc::clone(&connection_attempts);
        let ip_blacklist_clone = Arc::clone(&ip_blacklist);
        let sender_clone = _sender.clone();
        let local_key_clone = local_key.clone();
        let last_discovery_clone = Arc::clone(&last_discovery);
        let rpc_client_clone = Arc::clone(&rpc_client);

        task::spawn(async move {
            loop {
                task::sleep(Duration::from_secs(60)).await;
                let now = SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_secs();
                let should_discover = {
                    let last_discovery_time = *last_discovery_clone.lock().await;
                    now - last_discovery_time >= 300
                };

                if should_discover {
                    let new_peers = match validate_active_peers(
                        Arc::clone(&rpc_client_clone),
                        &program_id,
                        vec![],
                        &*ip_blacklist_clone.lock().await,
                    )
                    .await
                    {
                        Ok(peers) => peers,
                        Err(e) => {
                            warn!("Failed to fetch peers from NodeRegistry: {}", e);
                            vec![]
                        }
                    };

                    let mut peers_map = peers_clone.lock().await;
                    let mut swarm = swarm_clone.lock().await;

                    for peer in new_peers {
                        let pubkey_str = peer.pubkey.to_string();
                        if pubkey_str != local_pubkey.to_string() {
                            peers_map.insert(pubkey_str, peer);
                        }
                    }

                    peers_map.retain(|_, peer| now - peer.last_seen < 3600);

                    let recent_peers: Vec<(Pubkey, Multiaddr, String)> = peers_map
                        .values()
                        .filter(|peer| now - peer.last_seen < 1800)
                        .map(|peer| {
                            (
                                peer.pubkey,
                                peer.multiaddr.clone(),
                                peer.peer_id.to_string(),
                            )
                        })
                        .collect();

                    let timestamp = now;
                    let hash = compute_message_hash(&recent_peers, timestamp);
                    let signature = match local_key_clone.sign(&hash) {
                        Ok(sig) => sig,
                        Err(e) => {
                            warn!("Failed to sign discovery message: {}", e);
                            continue;
                        }
                    };
                    let discovery_message = PeerDiscoveryMessage {
                        peers: recent_peers,
                        timestamp,
                        signature: signature.to_vec(),
                    };

                    let message_bytes = serde_json::to_vec(&discovery_message)
                        .expect("Serialize discovery message");
                    if let Err(e) = swarm
                        .behaviour_mut()
                        .gossipsub
                        .publish(discovery_topic.clone(), message_bytes)
                    {
                        warn!("Failed to publish discovery message: {}", e);
                    } else {
                        info!(
                            "Published discovery message with {} peers",
                            discovery_message.peers.len()
                        );
                    }

                    // Log the number of seen messages to monitor message history
                    let seen_messages_count = seen_messages_clone.lock().await.len();
                    info!("Current number of seen messages: {}", seen_messages_count);

                    let mut recent_peers: Vec<_> = peers_map
                        .values()
                        .filter(|peer| now - peer.last_seen < 1800)
                        .collect();
                    recent_peers.shuffle(&mut rand::rng());
                    for peer in recent_peers.iter().take(8) {
                        // Check peer reputation before dialing
                        let reputation = peer_reputation_clone.lock().await;
                        if reputation
                            .get(&peer.peer_id)
                            .map_or(false, |&rep| rep < -20)
                        {
                            warn!("Skipping peer {} due to low reputation", peer.peer_id);
                            continue;
                        }

                        // Log message rate for the peer
                        let message_rate = message_rate_clone.lock().await;
                        if let Some((time, count)) = message_rate.get(&peer.peer_id) {
                            info!(
                                "Peer {} message rate: {} messages at time {}",
                                peer.peer_id, count, time
                            );
                        }

                        // Log connection attempts for the peer
                        let connection_attempts = connection_attempts_clone.lock().await;
                        if let Some((last_attempt, attempts)) =
                            connection_attempts.get(&peer.peer_id)
                        {
                            info!(
                                "Peer {} has {} connection attempts, last at {}",
                                peer.peer_id, attempts, last_attempt
                            );
                        }

                        if !swarm.is_connected(&peer.peer_id) {
                            if let Err(e) = swarm.dial(peer.multiaddr.clone()) {
                                warn!("Failed to dial peer {}: {}", peer.peer_id, e);
                            } else {
                                info!("Dialing peer {}", peer.peer_id);
                            }
                        }
                    }

                    *last_discovery_clone.lock().await = now;
                }
            }
        });

        // Second task with new Arc clones
        let swarm_clone = Arc::clone(&swarm);
        let peers_clone = Arc::clone(&peers);
        let peer_reputation_clone = Arc::clone(&peer_reputation);
        let message_rate_clone = Arc::clone(&message_rate);
        let seen_messages_clone = Arc::clone(&seen_messages);
        let connection_attempts_clone = Arc::clone(&connection_attempts);
        let ip_blacklist_clone = Arc::clone(&ip_blacklist);
        let rpc_client_clone = Arc::clone(&rpc_client);

        task::spawn(async move {
            loop {
                let event = {
                    let mut swarm = swarm_clone.lock().await;
                    swarm.next().await
                };

                match event {
                    Some(SwarmEvent::Behaviour(GossipsubEvent::Message {
                        message,
                        message_id,
                        propagation_source: source,
                        ..
                    })) => {
                        let now = SystemTime::now()
                            .duration_since(UNIX_EPOCH)
                            .unwrap()
                            .as_secs();

                        {
                            let mut message_rate = message_rate_clone.lock().await;
                            let (last_time, count) = message_rate.entry(source).or_insert((now, 0));
                            if *last_time == now {
                                *count += 1;
                                if *count > 10 {
                                    peer_reputation_clone
                                        .lock()
                                        .await
                                        .entry(source)
                                        .and_modify(|r| *r -= 10)
                                        .or_insert(-10);
                                    warn!("Rate limit exceeded for peer: {}", source);
                                    continue;
                                }
                            } else {
                                *last_time = now;
                                *count = 1;
                            }
                        }

                        {
                            let mut seen_messages = seen_messages_clone.lock().await;
                            if seen_messages.contains(&message_id) {
                                peer_reputation_clone
                                    .lock()
                                    .await
                                    .entry(source)
                                    .and_modify(|r| *r -= 5)
                                    .or_insert(-5);
                                warn!("Replay attack detected from peer: {}", source);
                                continue;
                            }
                            seen_messages.insert(message_id.clone());
                        }

                        if message.data.len() > 64 * 1024 {
                            peer_reputation_clone
                                .lock()
                                .await
                                .entry(source)
                                .and_modify(|r| *r -= 10)
                                .or_insert(-10);
                            warn!("Oversized message from peer: {}", source);
                            continue;
                        }

                        if let Ok(discovery_msg) =
                            serde_json::from_slice::<PeerDiscoveryMessage>(&message.data)
                        {
                            let _source_pubkey = match verify_discovery_message(
                                &discovery_msg,
                                Arc::clone(&rpc_client_clone),
                                &program_id,
                            )
                            .await
                            {
                                Ok(pubkey) => pubkey,
                                Err(e) => {
                                    peer_reputation_clone
                                        .lock()
                                        .await
                                        .entry(source)
                                        .and_modify(|r| *r -= 10)
                                        .or_insert(-10);
                                    warn!("Invalid discovery message from {}: {}", source, e);
                                    continue;
                                }
                            };

                            if discovery_msg.timestamp < now - 300
                                || discovery_msg.timestamp > now + 300
                            {
                                peer_reputation_clone
                                    .lock()
                                    .await
                                    .entry(source)
                                    .and_modify(|r| *r -= 5)
                                    .or_insert(-5);
                                warn!("Invalid timestamp in discovery message from {}", source);
                                continue;
                            }

                            let mut peers_map = peers_clone.lock().await;
                            let mut swarm = swarm_clone.lock().await;
                            let ip_blacklist = ip_blacklist_clone.lock().await;

                            for (pubkey, multiaddr, peer_id_str) in discovery_msg.peers {
                                let peer_id = match PeerId::from_str(&peer_id_str) {
                                    Ok(peer_id) => peer_id,
                                    Err(e) => {
                                        warn!("Invalid PeerId {}: {}", peer_id_str, e);
                                        continue;
                                    }
                                };

                                let ip = multiaddr.iter().find_map(|p| match p {
                                    Protocol::Ip4(ip) => Some(ip),
                                    _ => None,
                                });
                                if let Some(ip) = ip {
                                    if ip_blacklist.iter().any(|net| net.contains(ip)) {
                                        warn!("Skipping blacklisted peer: {}", multiaddr);
                                        continue;
                                    }
                                }

                                let pubkey_str = pubkey.to_string();
                                if pubkey_str != local_pubkey.to_string() {
                                    peers_map.insert(
                                        pubkey_str,
                                        PeerInfo {
                                            pubkey,
                                            multiaddr,
                                            peer_id,
                                            last_seen: now,
                                        },
                                    );
                                }
                            }

                            let mut recent_peers: Vec<_> = peers_map
                                .values()
                                .filter(|peer| now - peer.last_seen < 1800)
                                .collect();
                            recent_peers.shuffle(&mut rand::rng());
                            for peer in recent_peers.iter().take(8) {
                                if !swarm.is_connected(&peer.peer_id) {
                                    if let Err(e) = swarm.dial(peer.multiaddr.clone()) {
                                        warn!("Failed to dial peer {}: {}", peer.peer_id, e);
                                    } else {
                                        info!("Dialing peer {}", peer.peer_id);
                                    }
                                }
                            }
                        } else if let Ok(gossip_msg) =
                            serde_json::from_slice::<GossipMessage>(&message.data)
                        {
                            let computed_hash = format!("{:x}", Sha256::digest(&gossip_msg.data));
                            if computed_hash != gossip_msg.hash {
                                peer_reputation_clone
                                    .lock()
                                    .await
                                    .entry(source)
                                    .and_modify(|r| *r -= 10)
                                    .or_insert(-10);
                                warn!("Invalid hash from peer: {}", source);
                                continue;
                            }

                            let current_time = SystemTime::now()
                                .duration_since(UNIX_EPOCH)
                                .unwrap()
                                .as_secs();
                            if gossip_msg.timestamp < current_time - 60
                                || gossip_msg.timestamp > current_time + 60
                            {
                                peer_reputation_clone
                                    .lock()
                                    .await
                                    .entry(source)
                                    .and_modify(|r| *r -= 5)
                                    .or_insert(-5);
                                warn!("Invalid timestamp from peer: {}", source);
                                continue;
                            }

                            if let Err(e) = sender_clone.send(gossip_msg).await {
                                error!("Failed to send gossip message to channel: {}", e);
                            } else {
                                info!("Processed gossip message from peer: {}", source);
                            }
                        } else {
                            peer_reputation_clone
                                .lock()
                                .await
                                .entry(source)
                                .and_modify(|r| *r -= 5)
                                .or_insert(-5);
                            warn!("Invalid message format from peer: {}", source);
                        }

                        if peer_reputation_clone
                            .lock()
                            .await
                            .get(&source)
                            .map_or(false, |&rep| rep < -50)
                        {
                            swarm_clone
                                .lock()
                                .await
                                .behaviour_mut()
                                .gossipsub
                                .blacklist_peer(&source);
                            info!("Banned peer: {}", source);
                        }
                    }
                    Some(SwarmEvent::NewListenAddr { address, .. }) => {
                        info!("Listening on {}", address);
                    }
                    Some(SwarmEvent::ConnectionEstablished { peer_id, .. }) => {
                        peer_reputation_clone
                            .lock()
                            .await
                            .entry(peer_id)
                            .or_insert(0);
                        connection_attempts_clone.lock().await.remove(&peer_id);
                        info!("Connected to peer: {}", peer_id);
                    }
                    Some(SwarmEvent::ConnectionClosed { peer_id, cause, .. }) => {
                        info!("Disconnected from peer: {} {:?}", peer_id, cause);
                        let now = SystemTime::now()
                            .duration_since(UNIX_EPOCH)
                            .unwrap()
                            .as_secs();
                        let should_dial = {
                            let mut connection_attempts = connection_attempts_clone.lock().await;
                            let (last_attempt, attempts) =
                                connection_attempts.entry(peer_id).or_insert((0, 0));
                            let delay = Duration::from_secs(2u64.pow(*attempts));
                            if now - *last_attempt >= delay.as_secs() {
                                *last_attempt = now;
                                *attempts = attempts.saturating_add(1);
                                true
                            } else {
                                false
                            }
                        };

                        if should_dial {
                            let peers_map = peers_clone.lock().await;
                            if let Some(peer) = peers_map.values().find(|p| p.peer_id == peer_id) {
                                let mut swarm = swarm_clone.lock().await;
                                if let Err(e) = swarm.dial(peer.multiaddr.clone()) {
                                    warn!("Failed to retry connection to {}: {}", peer_id, e);
                                } else {
                                    info!("Retrying connection to {}", peer_id);
                                }
                            }
                        }
                    }
                    Some(SwarmEvent::OutgoingConnectionError { peer_id, error, .. }) => {
                        if let Some(peer_id) = peer_id {
                            warn!("Connection error to {}: {}", peer_id, error);
                            let now = SystemTime::now()
                                .duration_since(UNIX_EPOCH)
                                .unwrap()
                                .as_secs();
                            let should_dial = {
                                let mut connection_attempts =
                                    connection_attempts_clone.lock().await;
                                let (last_attempt, attempts) =
                                    connection_attempts.entry(peer_id).or_insert((0, 0));
                                let delay = Duration::from_secs(2u64.pow(*attempts));
                                if now - *last_attempt >= delay.as_secs() {
                                    *last_attempt = now;
                                    *attempts = attempts.saturating_add(1);
                                    true
                                } else {
                                    false
                                }
                            };

                            if should_dial {
                                let peers_map = peers_clone.lock().await;
                                if let Some(peer) =
                                    peers_map.values().find(|p| p.peer_id == peer_id)
                                {
                                    let mut swarm = swarm_clone.lock().await;
                                    if let Err(e) = swarm.dial(peer.multiaddr.clone()) {
                                        warn!("Failed to retry connection to {}: {}", peer_id, e);
                                    } else {
                                        info!("Retrying connection to {}", peer_id);
                                    }
                                }
                            }
                        }
                    }
                    _ => {}
                }
            }
        });

        Ok(NetworkManager {
            swarm,
            peers,
            receiver,
            _sender,
            local_data: Arc::new(AsyncMutex::new(HashSet::new())),
            peer_reputation,
            message_rate,
            seen_messages,
            ip_blacklist,
            connection_attempts,
        })
    }

    pub async fn gossip_data(
        &mut self,
        key: &str,
        data: &[u8],
        origin_pubkey: Pubkey,
        upload_pda: &str,
        format: &str,
    ) {
        let valid_peers: Vec<PeerId> = self
            .peers
            .lock()
            .await
            .values()
            .map(|peer| peer.peer_id)
            .collect();
        if valid_peers.is_empty() {
            warn!("No valid peers to gossip data for key: {}", key);
            return;
        }

        let topic = gossipsub::IdentTopic::new("solad-shard");
        let hash = format!("{:x}", Sha256::digest(data));
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();
        let message = GossipMessage {
            key: key.to_string(),
            data: data.to_vec(),
            format: format.to_string(),
            origin_pubkey: origin_pubkey.to_string(),
            upload_pda: upload_pda.to_string(),
            timestamp,
            hash,
        };
        let message_bytes = serde_json::to_vec(&message).expect("Serialize gossip message");
        let mut swarm = self.swarm.lock().await;
        if let Err(e) = swarm
            .behaviour_mut()
            .gossipsub
            .publish(topic, message_bytes)
        {
            error!("Failed to publish gossip message: {}", e);
        } else {
            info!(
                "Published gossip message for key: {} to {} peers",
                key,
                valid_peers.len()
            );
        }

        let connection_stats = self.connection_attempts.lock().await;
        info!("Current connection attempts: {:?}", *connection_stats);
    }

    pub async fn receive_gossiped_data(&mut self, data_store: Arc<DataStore>) {
        while let Some(message) = self.receiver.recv().await {
            if self.is_local(&message.key).await {
                info!(
                    "Skipping gossiped data for key: {} (already local)",
                    message.key
                );
                continue;
            }

            let source_peer_id = self
                .peers
                .lock()
                .await
                .get(&message.origin_pubkey)
                .map(|peer| peer.peer_id);
            if let Some(peer_id) = source_peer_id {
                let reputation = self.peer_reputation.lock().await;
                if reputation.get(&peer_id).map_or(false, |&rep| rep < -20) {
                    warn!("Ignoring message from low-reputation peer: {}", peer_id);
                    continue;
                }
            } else {
                warn!("Unknown peer pubkey: {}", message.origin_pubkey);
                continue;
            }

            let is_blacklisted =
                if let Some(peer) = self.peers.lock().await.get(&message.origin_pubkey) {
                    let ip = peer.multiaddr.iter().find_map(|p| match p {
                        Protocol::Ip4(ip) => Some(ip),
                        _ => None,
                    });
                    if let Some(ip) = ip {
                        self.ip_blacklist
                            .lock()
                            .await
                            .iter()
                            .any(|net| net.contains(ip))
                    } else {
                        false
                    }
                } else {
                    false
                };
            if is_blacklisted {
                warn!(
                    "Ignoring message from blacklisted peer: {}",
                    message.origin_pubkey
                );
                continue;
            }

            let message_id = {
                let mut hasher = Sha256::new();
                hasher.update(&message.data);
                hasher.update(message.timestamp.to_be_bytes());
                MessageId::from(hasher.finalize().to_vec())
            };
            if self.seen_messages.lock().await.contains(&message_id) {
                warn!("Ignoring duplicate message for key: {}", message.key);
                continue;
            }
            self.seen_messages.lock().await.insert(message_id);

            let origin_pubkey = Pubkey::from_str(&message.origin_pubkey)
                .map_err(|e| {
                    error!("Invalid origin_pubkey: {}", e);
                    ApiError::NetworkError(anyhow::anyhow!("Invalid origin_pubkey: {}", e))
                })
                .unwrap();

            if let Err(e) = data_store
                .store_data(
                    &message.key,
                    &message.data,
                    &message.format,
                    origin_pubkey,
                    &message.upload_pda,
                )
                .await
            {
                error!("Failed to store gossiped data: {}", e);
            } else {
                info!("Stored gossiped data for key: {}", message.key);
            }

            if let Some(peer_id) = source_peer_id {
                let message_rate = self.message_rate.lock().await;
                if let Some((time, count)) = message_rate.get(&peer_id) {
                    info!(
                        "Peer {} message rate: {} messages at time {}",
                        peer_id, count, time
                    );
                }
            }
        }
    }

    pub async fn is_local(&self, key: &str) -> bool {
        self.local_data.lock().await.contains(key)
    }
}
