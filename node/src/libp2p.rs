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

use crate::db::Database;
use crate::error::ApiError;

// Structure to hold peer information
#[derive(Clone)]
pub struct PeerInfo {
    pub pubkey: Pubkey,
    pub multiaddr: Multiaddr,
    pub peer_id: PeerId,
}

// Message structure for gossip
#[derive(Serialize, Deserialize, Clone)]
struct GossipMessage {
    key: String,
    data: Vec<u8>,
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
    peers: HashMap<String, PeerInfo>,
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
        rpc_client: &RpcClient,
    ) -> Result<Self, ApiError> {
        let local_peer_id = PeerId::from(local_key.public());

        // Verify that local_pubkey corresponds to local_key (enhances security)
        let account = rpc_client
            .get_account(&local_pubkey)
            .await
            .map_err(|e| ApiError::NetworkError(anyhow::anyhow!("Failed to fetch local account: {}", e)))?;
        if account.owner != Pubkey::from_str("11111111111111111111111111111111").unwrap() {
            return Err(ApiError::NetworkError(anyhow::anyhow!(
                "Local pubkey {} is not a valid node account",
                local_pubkey
            )));
        }
        info!("Verified local node pubkey: {}", local_pubkey);

        let (_sender, receiver) = mpsc::channel(100);

        // Create gossipsub configuration with enhanced security
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

        let topic = gossipsub::IdentTopic::new("solad-shard");
        gossipsub
            .subscribe(&topic)
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

        // Wrap swarm in Arc<AsyncMutex<...>>
        let swarm = Arc::new(AsyncMutex::new(swarm));

        let listen_addr: Multiaddr = "/ip4/0.0.0.0/tcp/0"
            .parse()
            .map_err(|e: multiaddr::Error| ApiError::NetworkError(anyhow::anyhow!(e.to_string())))?;
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

        let mut peers_map = HashMap::new();
        for peer in peers {
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
            let pubkey_str = peer.pubkey.to_string();
            peers_map.insert(pubkey_str, peer.clone());
        }

        if peers_map.len() < 4 {
            return Err(ApiError::NetworkError(anyhow::anyhow!(
                "Insufficient trusted peers".to_string()
            )));
        }

        let bootstrap_addr: Multiaddr = "/ip4/127.0.0.1/tcp/4000"
            .parse()
            .map_err(|e: multiaddr::Error| ApiError::NetworkError(anyhow::anyhow!(e.to_string())))?;
        swarm
            .lock()
            .await
            .dial(bootstrap_addr.clone())
            .map_err(|e| ApiError::NetworkError(anyhow::anyhow!(e.to_string())))?;

        let mut peer_vec: Vec<_> = peers_map.values().collect();
        peer_vec.shuffle(&mut rand::rng());
        for peer in peer_vec.iter().take(8) {
            swarm
                .lock()
                .await
                .dial(peer.multiaddr.clone())
                .map_err(|e| ApiError::NetworkError(anyhow::anyhow!(e.to_string())))?;
        }

        // Initialize shared state
        let peer_reputation = Arc::new(AsyncMutex::new(HashMap::new()));
        let message_rate = Arc::new(AsyncMutex::new(HashMap::new()));
        let seen_messages = Arc::new(AsyncMutex::new(HashSet::new()));
        let connection_attempts = Arc::new(AsyncMutex::new(HashMap::new()));

        // Clone Arcs for the async task
        let swarm_clone = Arc::clone(&swarm);
        let sender_clone = _sender.clone();
        let peers_clone = peers_map.clone();
        let peer_reputation_clone = Arc::clone(&peer_reputation);
        let message_rate_clone = Arc::clone(&message_rate);
        let seen_messages_clone = Arc::clone(&seen_messages);
        let connection_attempts_clone = Arc::clone(&connection_attempts);

        // Spawn task to handle swarm events
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
                        }

                        // Check for replay attacks
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

                        // Validate message size
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

                        // Process gossip message
                        if let Ok(gossip_msg) =
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

                            // Send message to channel
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

                        // Ban peers with low reputation
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
                            if let Some(peer) = peers_clone.values().find(|p| p.peer_id == peer_id)
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
                                if let Some(peer) =
                                    peers_clone.values().find(|p| p.peer_id == peer_id)
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
            peers: peers_map,
            receiver,
            _sender,
            local_data: Arc::new(AsyncMutex::new(HashSet::new())),
            peer_reputation,
            message_rate,
            seen_messages,
            ip_blacklist: Arc::new(AsyncMutex::new(ip_blacklist)),
            connection_attempts,
        })
    }

    pub async fn gossip_data(
        &mut self,
        key: &str,
        data: &[u8],
        origin_pubkey: Pubkey,
        upload_pda: &str,
    ) {
        // Ensure only known peers are targeted
        let valid_peers: Vec<PeerId> = self
            .peers
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
            info!("Published gossip message for key: {} to {} peers", key, valid_peers.len());
        }

        // Log connection attempts for monitoring
        let connection_stats = self.connection_attempts.lock().await;
        info!("Current connection attempts: {:?}", *connection_stats);
    }

    pub async fn receive_gossiped_data(&mut self, db: Arc<Database>) {
        while let Some(message) = self.receiver.recv().await {
            // Check if data is already local to prevent overwriting
            if self.is_local(&message.key).await {
                info!("Skipping gossiped data for key: {} (already local)", message.key);
                continue;
            }

            // Check peer reputation
            let source_peer_id = self
                .peers
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

            // Check IP blacklist
            let is_blacklisted = if let Some(peer) = self.peers.get(&message.origin_pubkey) {
                let ip = peer.multiaddr.iter().find_map(|p| match p {
                    Protocol::Ip4(ip) => Some(ip),
                    _ => None,
                });
                if let Some(ip) = ip {
                    self.ip_blacklist.lock().await.iter().any(|net| net.contains(ip))
                } else {
                    false
                }
            } else {
                false
            };
            if is_blacklisted {
                warn!("Ignoring message from blacklisted peer: {}", message.origin_pubkey);
                continue;
            }

            // Verify message hasn't been seen before
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

            // Store gossiped data in database
            if let Err(e) = db.inner.put(message.key.as_bytes(), message.data) {
                error!("Failed to store gossiped data: {}", e);
            } else {
                info!("Stored gossiped data for key: {}", message.key);
            }

            // Log message rate statistics
            if let Some(peer_id) = source_peer_id {
                let message_rate = self.message_rate.lock().await;
                if let Some((time, count)) = message_rate.get(&peer_id) {
                    info!("Peer {} message rate: {} messages at time {}", peer_id, count, time);
                }
            }
        }
    }

    pub async fn mark_as_local(&mut self, key: &str) {
        self.local_data.lock().await.insert(key.to_string());
    }

    pub async fn is_local(&self, key: &str) -> bool {
        self.local_data.lock().await.contains(key)
    }
}
