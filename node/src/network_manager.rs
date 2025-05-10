// This module implements a robust NetworkManager for a decentralized storage network.
// It uses libp2p for peer-to-peer communication with
// gossipsub for data propagation. The manager handles peer discovery, message validation,
// reputation tracking, and data gossiping, ensuring secure and efficient network operations.

// Dependencies for async operations, networking, serialization, and cryptography
use async_std::sync::{Arc, Mutex as AsyncMutex};
use async_std::task;
use futures::StreamExt;
use ip_network::IpNetwork;
use libp2p::{
    core::upgrade,
    gossipsub::{self, GossipsubEvent, MessageAuthenticity, MessageId, ValidationMode},
    identity,
    multiaddr::{Multiaddr, Protocol},
    noise,
    swarm::{SwarmBuilder, SwarmEvent},
    tcp, yamux, NetworkBehaviour, PeerId, Swarm, Transport,
};
use log::{debug, error, info, trace, warn};
use rand::seq::SliceRandom;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use solana_client::nonblocking::rpc_client::RpcClient;
use solana_sdk::{
    pubkey::Pubkey,
    signature::{Keypair, Signature},
};
use std::collections::{HashMap, HashSet};
use std::env;
use std::net::Ipv4Addr;
use std::str::FromStr;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tokio::sync::mpsc;

// Local crate dependencies
use crate::data_store::DataStore;
use crate::db::Database;
use crate::error::ApiError;
use crate::solad_client::SoladClient;

// Structure to hold peer information with public key, address, and activity tracking
#[derive(Clone)]
pub struct PeerInfo {
    pub pubkey: Pubkey,       // Solana public key of the peer
    pub multiaddr: Multiaddr, // Multiaddress for connecting to the peer
    pub peer_id: PeerId,      // Libp2p PeerId for identification
    pub last_seen: u64,       // Timestamp of last peer activity
}

// Message structure for gossiping data across the network
#[derive(Serialize, Deserialize, Clone)]
struct GossipMessage {
    key: String,           // Unique identifier for the data
    data: Vec<u8>,         // Actual data payload
    format: String,        // Data format (e.g., JSON, binary)
    origin_pubkey: String, // Public key of the data originator
    upload_pda: String,    // Program-derived address for upload tracking
    timestamp: u64,        // Timestamp for replay protection
    hash: String,          // SHA-256 hash of data for integrity
}

// Message structure for peer discovery
#[derive(Clone, Serialize, Deserialize)]
struct PeerDiscoveryMessage {
    peers: Vec<(Pubkey, Multiaddr, String)>, // List of peers with pubkey, address, and PeerId
    timestamp: u64,                          // Timestamp for message freshness
    signature: Vec<u8>,                      // Signature for authenticity
}

// Custom network behaviour combining gossipsub for message propagation
#[derive(NetworkBehaviour)]
#[behaviour(out_event = "gossipsub::GossipsubEvent")]
struct NetworkBehaviour {
    gossipsub: gossipsub::Gossipsub, // Gossipsub protocol for pub-sub messaging
}

// Main NetworkManager structure to manage the libp2p swarm and network state
pub struct NetworkManager {
    swarm: Arc<AsyncMutex<Swarm<NetworkBehaviour>>>, // Libp2p swarm for networking
    peers: Arc<AsyncMutex<HashMap<String, PeerInfo>>>, // Map of peers by pubkey
    receiver: mpsc::Receiver<GossipMessage>,         // Channel for receiving gossip messages
    _sender: mpsc::Sender<GossipMessage>,            // Channel for sending gossip messages
    local_data: Arc<AsyncMutex<HashSet<String>>>,    // Set of locally stored data keys
    peer_reputation: Arc<AsyncMutex<HashMap<PeerId, i32>>>, // Peer reputation scores
    _message_rate: Arc<AsyncMutex<HashMap<PeerId, (u64, u32)>>>, // Message rate tracking
    seen_messages: Arc<AsyncMutex<HashSet<MessageId>>>, // Set of seen message IDs
    ip_blacklist: Arc<AsyncMutex<HashSet<IpNetwork>>>, // Blacklisted IP networks
    connection_attempts: Arc<AsyncMutex<HashMap<PeerId, (u64, u32)>>>, // Connection attempt tracking
}

impl NetworkManager {
    // Initializes a new NetworkManager with the provided configuration
    // Verifies local node registration, sets up libp2p swarm, and starts background tasks
    pub async fn new(
        local_key: identity::Keypair, // Libp2p keypair for authentication
        peers: Vec<PeerInfo>,         // Initial list of peers
        local_pubkey: Pubkey,         // Local node's Solana public key
        rpc_client: Arc<RpcClient>,   // Solana RPC client for blockchain interactions
        db: Arc<Database>,            // Database for persistent storage
        program_id: Pubkey,           // Solana program ID
    ) -> Result<Self, ApiError> {
        trace!("Starting NetworkManager initialization");
        // Derive local PeerId from keypair
        let local_peer_id = PeerId::from(local_key.public());
        info!("Initializing NetworkManager for peer: {}", local_peer_id);

        // Verify local node account exists on Solana
        trace!("Verifying local node account for pubkey: {}", local_pubkey);
        rpc_client.get_account(&local_pubkey).await.map_err(|e| {
            error!(
                "Failed to fetch local account for pubkey {}: {}",
                local_pubkey, e
            );
            ApiError::NetworkError(anyhow::anyhow!("Failed to fetch local account: {}", e))
        })?;
        debug!("Verified local node pubkey: {}", local_pubkey);

        // Load Solana payer keypair from environment
        trace!("Loading Solana node private key");
        let payer = Keypair::from_base58_string(&env::var("NODE_SOLANA_PRIVKEY").map_err(|e| {
            error!("NODE_SOLANA_PRIVKEY not set: {}", e);
            ApiError::NetworkError(anyhow::anyhow!("NODE_SOLANA_PRIVKEY not set: {}", e))
        })?);
        debug!("Solana node private key loaded successfully");

        // Initialize Solad client for program interactions
        trace!("Initializing SoladClient for RPC URL: {}", rpc_client.url());
        let solad_client = SoladClient::new(&rpc_client.url(), Arc::new(payer), program_id)
            .await
            .map_err(|e| {
                error!("Failed to initialize SoladClient: {}", e);
                ApiError::NetworkError(anyhow::anyhow!("Failed to initialize SoladClient: {}", e))
            })?;
        debug!("SoladClient initialized successfully");

        // Derive node PDA for registration
        let (node_pda, _bump) =
            Pubkey::find_program_address(&[b"node", local_pubkey.as_ref()], &program_id);
        debug!("Derived node PDA: {}", node_pda);

        // Check and handle node registration
        let registration_key = "node_registered";
        trace!("Checking node registration status");
        let is_registered = db
            .inner
            .get(registration_key.as_bytes())
            .map_err(|e| {
                error!("Database error while checking node registration: {}", e);
                ApiError::Database(e)
            })?
            .map(|val| val == b"true")
            .unwrap_or(false);

        if !is_registered {
            trace!("Node not registered, checking on-chain status");
            let node_exists = rpc_client.get_account(&node_pda).await.is_ok();
            if !node_exists {
                info!("Registering node with stake at PDA: {}", node_pda);
                // TODO: Replace with actual storage config pubkey
                let storage_config_pubkey = Pubkey::from_str("YourStorageConfigPubkeyHere")
                    .map_err(|e| {
                        error!("Invalid storage config pubkey: {}", e);
                        ApiError::NetworkError(anyhow::anyhow!(
                            "Invalid storage config pubkey: {}",
                            e
                        ))
                    })?;
                trace!(
                    "Registering node with storage config pubkey: {}",
                    storage_config_pubkey
                );
                solad_client
                    .register_node(1_000_000_000, storage_config_pubkey)
                    .await
                    .map_err(|e| {
                        error!("Failed to register node for PDA {}: {}", node_pda, e);
                        ApiError::NetworkError(anyhow::anyhow!("Failed to register node: {}", e))
                    })?;
                db.inner
                    .put(registration_key.as_bytes(), b"true")
                    .map_err(|e| {
                        error!("Database error while setting node registration: {}", e);
                        ApiError::Database(e)
                    })?;
                info!("Node registered successfully");
            } else {
                db.inner
                    .put(registration_key.as_bytes(), b"true")
                    .map_err(|e| {
                        error!("Database error while updating node registration: {}", e);
                        ApiError::Database(e)
                    })?;
                info!("Node already registered, updated local status");
            }
        } else {
            debug!("Node registration confirmed for PDA: {}", node_pda);
        }

        // Set up gossipsub configuration
        trace!("Configuring gossipsub");
        let gossipsub_config = gossipsub::GossipsubConfigBuilder::default()
            .heartbeat_interval(Duration::from_secs(10)) // Heartbeat every 10 seconds
            .validation_mode(ValidationMode::Strict) // Strict message validation
            .message_id_fn(|msg| {
                // Custom message ID function
                let mut hasher = Sha256::new();
                hasher.update(&msg.data);
                hasher.update(msg.sequence_number.unwrap_or(0).to_be_bytes());
                MessageId::from(hasher.finalize().to_vec())
            })
            .max_transmit_size(64 * 1024) // Max message size: 64KB
            .flood_publish(false) // Disable flood publishing
            .mesh_n(6) // Ideal mesh size
            .mesh_n_low(4) // Minimum mesh size
            .mesh_n_high(8) // Maximum mesh size
            .history_length(300) // Keep 300 messages in history
            .build()
            .map_err(|e| {
                error!("Gossipsub config error: {}", e);
                ApiError::NetworkError(anyhow::anyhow!("Gossipsub config error: {}", e))
            })?;
        debug!("Gossipsub configuration completed");

        // Initialize gossipsub with signed messages
        trace!("Initializing gossipsub with signed messages");
        let mut gossipsub = gossipsub::Gossipsub::new(
            MessageAuthenticity::Signed(local_key.clone()),
            gossipsub_config,
        )
        .map_err(|e| {
            error!("Gossipsub init error: {}", e);
            ApiError::NetworkError(anyhow::anyhow!("Gossipsub init error: {}", e))
        })?;
        debug!("Gossipsub initialized successfully");

        // Subscribe to shard and discovery topics
        let data_topic = gossipsub::IdentTopic::new("network-shard");
        trace!("Subscribing to data topic: network-shard");
        gossipsub.subscribe(&data_topic).map_err(|e| {
            error!("Subscribe shard error: {}", e);
            ApiError::NetworkError(anyhow::anyhow!("Subscribe shard error: {}", e))
        })?;

        let discovery_topic = gossipsub::IdentTopic::new("network-discovery");
        trace!("Subscribing to discovery topic: network-discovery");
        gossipsub.subscribe(&discovery_topic).map_err(|e| {
            error!("Subscribe discovery error: {}", e);
            ApiError::NetworkError(anyhow::anyhow!("Subscribe discovery error: {}", e))
        })?;
        debug!("Subscribed to shard and discovery topics");

        // Set up TCP transport with noise authentication and yamux multiplexing
        trace!("Setting up TCP transport");
        let transport = tcp::TcpTransport::new(tcp::GenTcpConfig::default())
            .upgrade(upgrade::Version::V1)
            .authenticate(
                noise::NoiseAuthenticated::xx(&local_key)
                    .expect("Noise authentication config is valid"),
            )
            .multiplex(yamux::YamuxConfig::default())
            .timeout(Duration::from_secs(20))
            .boxed();
        debug!("TCP transport configured");

        // Initialize swarm with connection limits
        trace!("Initializing swarm");
        let behaviour = NetworkBehaviour { gossipsub };
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
        debug!("Swarm initialized with connection limits");

        // Start listening on all interfaces
        let listen_addr: Multiaddr = "/ip4/0.0.0.0/tcp/0".parse().map_err(|e| {
            error!("Invalid listen address: {}", e);
            ApiError::NetworkError(anyhow::anyhow!("Invalid listen address: {}", e))
        })?;
        trace!("Starting to listen on address: {}", listen_addr);
        swarm.lock().await.listen_on(listen_addr).map_err(|e| {
            error!("Listen error: {}", e);
            ApiError::NetworkError(anyhow::anyhow!("Listen error: {}", e))
        })?;
        debug!("Swarm listening on address");

        // Initialize IP blacklist
        trace!("Initializing IP blacklist");
        let ip_blacklist: HashSet<IpNetwork> = vec![IpNetwork::new(
            "192.168.0.0".parse::<Ipv4Addr>().map_err(|e| {
                error!("Invalid IP for blacklist: {}", e);
                ApiError::NetworkError(anyhow::anyhow!("Invalid IP: {}", e))
            })?,
            16,
        )
        .map_err(|e| {
            error!("Invalid netmask for blacklist: {}", e);
            ApiError::NetworkError(anyhow::anyhow!("Invalid netmask: {}", e))
        })?]
        .into_iter()
        .collect();
        let ip_blacklist = Arc::new(AsyncMutex::new(ip_blacklist));
        debug!("IP blacklist initialized");

        // Initialize peers map
        trace!("Initializing peers map");
        let mut peers_map = HashMap::new();
        for peer in peers {
            peers_map.insert(peer.pubkey.to_string(), peer);
        }
        let peers = Arc::new(AsyncMutex::new(peers_map.clone()));
        debug!("Peers map initialized with {} peers", peers_map.len());

        // Validate initial peers
        trace!("Validating initial peers");
        let valid_peers = Self::validate_active_peers(
            rpc_client.clone(),
            &program_id,
            peers.lock().await.values().cloned().collect(),
            &*ip_blacklist.lock().await,
        )
        .await?;
        {
            let mut peers_map = peers.lock().await;
            for peer in valid_peers.clone() {
                peers_map.insert(peer.pubkey.to_string(), peer);
            }
        }
        debug!("Validated {} peers", valid_peers.len());

        // Dial bootstrap node
        let bootstrap_addr: Multiaddr = "/ip4/127.0.0.1/tcp/4000".parse().map_err(|e| {
            error!("Invalid bootstrap address: {}", e);
            ApiError::NetworkError(anyhow::anyhow!("Invalid bootstrap address: {}", e))
        })?;
        trace!("Dialing bootstrap node: {}", bootstrap_addr);
        swarm
            .lock()
            .await
            .dial(bootstrap_addr.clone())
            .map_err(|e| {
                error!("Dial bootstrap error: {}", e);
                ApiError::NetworkError(anyhow::anyhow!("Dial bootstrap error: {}", e))
            })?;
        debug!("Dialed bootstrap node");

        // Initialize state tracking
        trace!("Initializing state tracking");
        let (_sender, receiver) = mpsc::channel(100);
        let peer_reputation = Arc::new(AsyncMutex::new(HashMap::new()));
        let message_rate = Arc::new(AsyncMutex::new(HashMap::new()));
        let seen_messages = Arc::new(AsyncMutex::new(HashSet::new()));
        let connection_attempts = Arc::new(AsyncMutex::new(HashMap::new()));
        let last_discovery = Arc::new(AsyncMutex::new(
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        ));
        debug!("State tracking initialized");

        // Spawn peer discovery task
        let swarm_clone = Arc::clone(&swarm);
        let peers_clone = Arc::clone(&peers);
        let peer_reputation_clone = Arc::clone(&peer_reputation);
        let seen_messages_clone = Arc::clone(&seen_messages);
        let ip_blacklist_clone = Arc::clone(&ip_blacklist);
        let last_discovery_clone = Arc::clone(&last_discovery);
        let rpc_client_clone = Arc::clone(&rpc_client);

        task::spawn(async move {
            loop {
                task::sleep(Duration::from_secs(60)).await;
                let now = SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_secs();
                trace!("Checking for peer discovery (current time: {})", now);
                let should_discover = {
                    let last_discovery_time = *last_discovery_clone.lock().await;
                    let should = now - last_discovery_time >= 300;
                    debug!(
                        "Last discovery: {}, Should discover: {}",
                        last_discovery_time, should
                    );
                    should
                };

                if should_discover {
                    trace!("Starting peer discovery");
                    // Fetch and validate new peers
                    let new_peers = match Self::validate_active_peers(
                        Arc::clone(&rpc_client_clone),
                        &program_id,
                        vec![],
                        &*ip_blacklist_clone.lock().await,
                    )
                    .await
                    {
                        Ok(peers) => {
                            debug!("Fetched {} new peers", peers.len());
                            peers
                        }
                        Err(e) => {
                            warn!("Failed to fetch peers: {}", e);
                            vec![]
                        }
                    };

                    let mut peers_map = peers_clone.lock().await;
                    let mut swarm = swarm_clone.lock().await;

                    // Update peer list
                    for peer in new_peers {
                        let pubkey_str = peer.pubkey.to_string();
                        if pubkey_str != local_pubkey.to_string() {
                            peers_map.insert(pubkey_str, peer);
                        }
                    }
                    peers_map.retain(|_, peer| now - peer.last_seen < 3600);
                    debug!("Updated peer list, retained {} peers", peers_map.len());

                    // Prepare discovery message
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
                    trace!(
                        "Prepared discovery message with {} recent peers",
                        recent_peers.len()
                    );

                    let timestamp = now;
                    let hash = Self::compute_message_hash(&recent_peers, timestamp);
                    let signature = local_key
                        .sign(&hash)
                        .map_err(|e| {
                            warn!("Failed to sign discovery message: {}", e);
                            Vec::<u8>::new() // Explicitly specify Vec<u8>
                        })
                        .unwrap_or_default();
                    let discovery_message = PeerDiscoveryMessage {
                        peers: recent_peers,
                        timestamp,
                        signature: signature.to_vec(),
                    };

                    // Publish discovery message
                    trace!("Publishing discovery message");
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

                    // Log seen messages count
                    let seen_messages_count = seen_messages_clone.lock().await.len();
                    debug!("Current seen messages: {}", seen_messages_count);

                    // Dial recent peers
                    let mut recent_peers: Vec<_> = peers_map
                        .values()
                        .filter(|peer| now - peer.last_seen < 1800)
                        .collect();
                    recent_peers.shuffle(&mut rand::rng());
                    trace!("Dialing up to 8 recent peers");
                    for peer in recent_peers.iter().take(8) {
                        let reputation = peer_reputation_clone.lock().await;
                        if reputation
                            .get(&peer.peer_id)
                            .map_or(false, |&rep| rep < -20)
                        {
                            warn!("Skipping low-reputation peer: {}", peer.peer_id);
                            continue;
                        }

                        if !swarm.is_connected(&peer.peer_id) {
                            trace!("Dialing peer: {}", peer.peer_id);
                            if let Err(e) = swarm.dial(peer.multiaddr.clone()) {
                                warn!("Failed to dial peer {}: {}", peer.peer_id, e);
                            } else {
                                info!("Dialing peer {}", peer.peer_id);
                            }
                        }
                    }

                    *last_discovery_clone.lock().await = now;
                    debug!("Updated last discovery time to: {}", now);
                }
            }
        });

        // Spawn event handling task
        let swarm_clone = Arc::clone(&swarm);
        let peers_clone = Arc::clone(&peers);
        let peer_reputation_clone = Arc::clone(&peer_reputation);
        let message_rate_clone = Arc::clone(&message_rate);
        let seen_messages_clone = Arc::clone(&seen_messages);
        let connection_attempts_clone = Arc::clone(&connection_attempts);
        let ip_blacklist_clone = Arc::clone(&ip_blacklist);
        let rpc_client_clone = Arc::clone(&rpc_client);
        let _sender_clone = Arc::new(_sender.clone());

        task::spawn(async move {
            loop {
                trace!("Waiting for next swarm event");
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
                        trace!("Received gossipsub message from peer: {}", source);

                        // Rate limiting
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
                            debug!("Message rate for peer {}: count={}", source, count);
                        }

                        // Replay protection
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
                            debug!("Added message ID {} to seen messages", message_id);
                        }

                        // Size validation
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

                        // Process discovery message
                        if let Ok(discovery_msg) =
                            serde_json::from_slice::<PeerDiscoveryMessage>(&message.data)
                        {
                            trace!("Processing discovery message from peer: {}", source);
                            let source_pubkey = match Self::verify_discovery_message(
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
                            debug!("Verified discovery message from pubkey: {}", source_pubkey);

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
                                        warn!("Invalid Peer LotId {}: {}", peer_id_str, e);
                                        continue;
                                    }
                                };
                                trace!(
                                    "Processing peer: {} with multiaddr: {}",
                                    peer_id,
                                    multiaddr
                                );

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
                                if pubkey_str != source_pubkey.to_string() {
                                    peers_map.insert(
                                        pubkey_str.clone(),
                                        PeerInfo {
                                            pubkey,
                                            multiaddr,
                                            peer_id,
                                            last_seen: now,
                                        },
                                    );
                                    debug!("Added peer {} to peers map", pubkey_str);
                                }
                            }

                            // Dial new peers
                            let mut recent_peers: Vec<_> = peers_map
                                .values()
                                .filter(|peer| now - peer.last_seen < 1800)
                                .collect();
                            recent_peers.shuffle(&mut rand::rng());
                            trace!("Dialing up to 8 recent peers from discovery message");
                            for peer in recent_peers.iter().take(8) {
                                if !swarm.is_connected(&peer.peer_id) {
                                    trace!("Dialing peer: {}", peer.peer_id);
                                    if let Err(e) = swarm.dial(peer.multiaddr.clone()) {
                                        warn!("Failed to dial peer {}: {}", peer.peer_id, e);
                                    } else {
                                        info!("Dialing peer {}", peer.peer_id);
                                    }
                                }
                            }
                        }
                        // Process gossip message
                        else if let Ok(gossip_msg) =
                            serde_json::from_slice::<GossipMessage>(&message.data)
                        {
                            trace!("Processing gossip message for key: {}", gossip_msg.key);
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
                            debug!("Hash verified for gossip message key: {}", gossip_msg.key);

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

                            trace!("Sending gossip message to channel");
                            if let Err(e) = _sender_clone.send(gossip_msg).await {
                                error!("Failed to send gossip message: {}", e);
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

                        // Ban low-reputation peers
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
                                trace!("Retrying connection to peer: {}", peer_id);
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
                                    trace!("Retrying connection to peer: {}", peer_id);
                                    if let Err(e) = swarm.dial(peer.multiaddr.clone()) {
                                        warn!("Failed to retry connection to {}: {}", peer_id, e);
                                    } else {
                                        info!("Retrying connection to {}", peer_id);
                                    }
                                }
                            }
                        }
                    }
                    _ => {
                        trace!("Unhandled swarm event");
                    }
                }
            }
        });

        info!("NetworkManager initialized successfully");
        Ok(NetworkManager {
            swarm,
            peers,
            receiver,
            _sender,
            local_data: Arc::new(AsyncMutex::new(HashSet::new())),
            peer_reputation,
            _message_rate: message_rate,
            seen_messages,
            ip_blacklist,
            connection_attempts,
        })
    }

    // Publishes data to the network via gossipsub
    pub async fn gossip_data(
        &mut self,
        key: &str,             // Data identifier
        data: &[u8],           // Data payload
        origin_pubkey: Pubkey, // Originator's public key
        upload_pda: &str,      // Upload PDA
        format: &str,          // Data format
    ) {
        trace!("Starting gossip_data for key: {}", key);
        // Collect valid peer IDs
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
        debug!("Found {} valid peers for gossiping", valid_peers.len());

        // Prepare gossip message
        let topic = gossipsub::IdentTopic::new("network-shard");
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
        trace!("Prepared gossip message for key: {}", key);
        let message_bytes = serde_json::to_vec(&message).expect("Serialize gossip message");

        // Publish message
        let mut swarm = self.swarm.lock().await;
        trace!("Publishing gossip message to topic: network-shard");
        if let Err(e) = swarm
            .behaviour_mut()
            .gossipsub
            .publish(topic, message_bytes)
        {
            error!("Failed to publish gossip message for key {}: {}", key, e);
        } else {
            info!(
                "Published gossip message for key: {} to {} peers",
                key,
                valid_peers.len()
            );
        }

        // Log connection stats
        let connection_stats = self.connection_attempts.lock().await;
        debug!("Current connection attempts: {:?}", *connection_stats);
    }

    // Receives and processes gossiped data, storing it if valid
    pub async fn receive_gossiped_data(&mut self, data_store: Arc<DataStore>) {
        trace!("Starting receive_gossiped_data loop");
        while let Some(message) = self.receiver.recv().await {
            trace!("Received gossiped message for key: {}", message.key);
            // Skip local data
            if self.is_local(&message.key).await {
                debug!("Skipping local data for key: {}", message.key);
                continue;
            }

            // Validate peer reputation
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
                debug!("Peer {} has acceptable reputation", peer_id);
            } else {
                warn!("Unknown peer pubkey: {}", message.origin_pubkey);
                continue;
            }

            // Check IP blacklist
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
            debug!("Peer {} not blacklisted", message.origin_pubkey);

            // Replay protection
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
            debug!("Added message ID for key: {} to seen messages", message.key);

            // Store valid data
            let origin_pubkey = Pubkey::from_str(&message.origin_pubkey)
                .map_err(|e| {
                    error!("Invalid origin_pubkey: {}", e);
                    ApiError::NetworkError(anyhow::anyhow!("Invalid origin_pubkey: {}", e))
                })
                .unwrap();
            trace!("Storing gossiped data for key: {}", message.key);
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
                error!(
                    "Failed to store gossiped data for key {}: {}",
                    message.key, e
                );
            } else {
                info!("Stored gossiped data for key: {}", message.key);
            }
        }
    }

    // Checks if data is locally stored
    pub async fn is_local(&self, key: &str) -> bool {
        trace!("Checking if key {} is local", key);
        let is_local = self.local_data.lock().await.contains(key);
        debug!("Key {} is_local: {}", key, is_local);
        is_local
    }

    // Validates active peers against the node registry
    async fn validate_active_peers(
        rpc_client: Arc<RpcClient>,
        program_id: &Pubkey,
        peers: Vec<PeerInfo>,
        ip_blacklist: &HashSet<IpNetwork>,
    ) -> Result<Vec<PeerInfo>, ApiError> {
        trace!("Validating active peers");
        // Fetch node registry
        let (registry_pda, _bump) = Pubkey::find_program_address(&[b"node_registry"], program_id);
        trace!("Fetching node registry for PDA: {}", registry_pda);
        let registry_account = rpc_client.get_account(&registry_pda).await.map_err(|e| {
            error!("Failed to fetch node registry: {}", e);
            ApiError::NetworkError(anyhow::anyhow!("Failed to fetch node registry: {}", e))
        })?;
        let node_registry: Vec<Pubkey> =
            serde_json::from_slice(&registry_account.data).map_err(|e| {
                error!("Failed to deserialize node registry: {}", e);
                ApiError::NetworkError(anyhow::anyhow!(
                    "Failed to deserialize node registry: {}",
                    e
                ))
            })?;
        debug!("Fetched node registry with {} nodes", node_registry.len());

        // Fetch node accounts
        let node_pdas: Vec<Pubkey> = node_registry
            .iter()
            .map(|pubkey| Pubkey::find_program_address(&[b"node", pubkey.as_ref()], program_id).0)
            .collect();
        trace!("Fetching {} node accounts", node_pdas.len());
        let node_accounts = rpc_client
            .get_multiple_accounts(&node_pdas)
            .await
            .map_err(|e| {
                error!("Failed to fetch node accounts: {}", e);
                ApiError::NetworkError(anyhow::anyhow!("Failed to fetch node accounts: {}", e))
            })?;

        // Identify active nodes
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
        debug!("Identified {} active nodes", active_nodes.len());

        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();
        let mut valid_peers = Vec::new();

        // Validate peers
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

            trace!("Validating peer account: {}", peer.pubkey);
            let account = rpc_client.get_account(&peer.pubkey).await.map_err(|e| {
                error!("Failed to fetch account for peer {}: {}", peer.pubkey, e);
                ApiError::NetworkError(anyhow::anyhow!(e.to_string()))
            })?;
            if account.owner != Pubkey::from_str("11111111111111111111111111111111").unwrap() {
                warn!("Skipping invalid peer: {}", peer.pubkey);
                continue;
            }

            peer.last_seen = now;
            valid_peers.push(peer.clone());
            debug!("Validated peer: {}", peer.pubkey);
        }

        info!("Validated {} active peers", valid_peers.len());
        Ok(valid_peers)
    }

    // Computes hash for discovery message
    fn compute_message_hash(peers: &[(Pubkey, Multiaddr, String)], timestamp: u64) -> Vec<u8> {
        trace!("Computing message hash for discovery message");
        let mut hasher = Sha256::new();
        for (pubkey, multiaddr, peer_id) in peers {
            hasher.update(pubkey.to_bytes());
            hasher.update(multiaddr.to_string().as_bytes());
            hasher.update(peer_id.as_bytes());
        }
        hasher.update(timestamp.to_be_bytes());
        let hash = hasher.finalize().to_vec();
        debug!("Computed message hash");
        hash
    }

    // Verifies discovery message signature
    async fn verify_discovery_message(
        message: &PeerDiscoveryMessage,
        rpc_client: Arc<RpcClient>,
        program_id: &Pubkey,
    ) -> Result<Pubkey, ApiError> {
        trace!("Verifying discovery message signature");
        let (registry_pda, _bump) = Pubkey::find_program_address(&[b"node_registry"], program_id);
        trace!("Fetching node registry for PDA: {}", registry_pda);
        let registry_account = rpc_client.get_account(&registry_pda).await.map_err(|e| {
            error!("Failed to fetch node registry: {}", e);
            ApiError::NetworkError(anyhow::anyhow!("Failed to fetch node registry: {}", e))
        })?;
        let node_registry: Vec<Pubkey> =
            serde_json::from_slice(&registry_account.data).map_err(|e| {
                error!("Failed to deserialize node registry: {}", e);
                ApiError::NetworkError(anyhow::anyhow!(
                    "Failed to deserialize node registry: {}",
                    e
                ))
            })?;
        debug!("Fetched node registry with {} nodes", node_registry.len());

        let hash = Self::compute_message_hash(&message.peers, message.timestamp);
        if message.signature.len() != 64 {
            error!(
                "Invalid signature length: expected 64 bytes, got {}",
                message.signature.len()
            );
            return Err(ApiError::NetworkError(anyhow::anyhow!(
                "Invalid signature length: expected 64 bytes, got {}",
                message.signature.len()
            )));
        }

        let mut signature_bytes = [0u8; 64];
        signature_bytes.copy_from_slice(&message.signature);
        let signature = Signature::from(signature_bytes);

        for pubkey in node_registry {
            if signature.verify(&pubkey.to_bytes(), &hash) {
                debug!("Signature verified for pubkey: {}", pubkey);
                return Ok(pubkey);
            }
        }

        error!("No valid signature found for discovery message");
        Err(ApiError::NetworkError(anyhow::anyhow!(
            "No valid signature found for discovery message"
        )))
    }
}

// Structure for node data (used in validation)
#[derive(Clone, Serialize, Deserialize)]
struct Node {
    owner: Pubkey,           // Node owner public key
    stake_amount: u64,       // Staked amount in lamports
    upload_count: u64,       // Number of uploads
    last_pos_time: i64,      // Last proof-of-storage time
    last_claimed_epoch: u64, // Last epoch rewards claimed
    is_active: bool,         // Node active status
}
