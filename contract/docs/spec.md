# Solad Program Reference Specification

## Overview
The Solad Program is a decentralized storage protocol built on the Solana blockchain using the Anchor framework. It provides a scalable, secure, and economically viable solution for distributed data storage, leveraging sharding, node staking, proof-of-storage (PoS) verification, and reward distribution mechanisms. The protocol ensures data availability through node replacement strategies and enforces compliance via slashing penalties for non-performing nodes. This document serves as a comprehensive reference specification, detailing the program's architecture, configuration rationales, operational flows, and best practices for deployment and management.

The Solad Program optimizes for:

- Scalability: Supports large-scale data storage through sharding and dynamic node assignment.
- Economic Viability: Balances costs and incentives for users, nodes, and the treasury to ensure long-term sustainability.
- Resource Efficiency: Minimizes on-chain storage and computation through efficient account structures and cryptographic proofs.
- Security: Uses Merkle proofs and ECDSA signatures for data integrity and node accountability.

`This specification covers the rationale for configurations, operational workflows, and best practices to maximize efficiency, scalability, and economic viability.`

## Program Architecture

### Core Components

#### Storage Configuration:

Defines global parameters such as pricing, fees, shard constraints, and epoch settings.
Stored in a PDA (StorageConfig) to ensure deterministic access and governance.


#### Nodes:

Storage providers stake SOL to participate, ensuring commitment to data availability.
Node state (Node) tracks stake, uploads, and verification history.


#### Uploads:

Data is sharded and distributed across nodes, with metadata stored in a PDA (Upload).
Supports dynamic shard sizing and node assignment based on stake weight.


#### Proof of Storage (PoS):

Nodes submit Merkle proofs to verify data possession, challenged by other nodes in the shard.
Ensures data integrity and availability without storing full data on-chain.


#### Rewards and Slashing:

Nodes earn rewards for verified storage, distributed over epochs.
Non-compliant nodes are slashed, redistributing stake to the treasury and callers.


#### Node Replacement:

Allows nodes to exit or be replaced, maintaining data availability.
Replacement nodes are selected pseudo-randomly based on stake weight.



### Key Design Principles

- Decentralization: No single point of failure; nodes are selected dynamically to prevent collusion.
- Economic Incentives: Aligns interests of users, nodes, and the treasury through configurable fees and penalties.
- Scalability: Sharding and off-chain proofs minimize on-chain overhead, supporting large datasets.
- Security: Cryptographic proofs (Merkle trees, ECDSA signatures) ensure data integrity and node accountability.
- Flexibility: Configurable parameters allow adaptation to network conditions and economic goals.


### Configuration Rationale
The Solad Program's configuration parameters are designed to balance resource efficiency, economic viability, and operational scalability. Below, each parameter is explained with its purpose, optimization strategy, and impact on the system.
1. sol_per_gb (Cost per Gigabyte in Lamports)

- Purpose: Sets the price for storing 1 GB of data, determining user costs and node revenue.
- Default: 30,000,000 lamports (~0.03 SOL/GB at 1 SOL = 1,000,000,000 lamports).

#### Rationale:
- Economic Viability: Ensures storage is affordable for users while providing sufficient revenue for nodes. The default is calibrated to cover node operational costs (e.g., hardware, bandwidth) based on Solana's low transaction fees.
- Scalability: A predictable pricing model encourages adoption by providing cost transparency.
- Optimization: Adjustable to reflect SOL market volatility or network demand. Lower values increase adoption; higher values ensure node profitability.


#### Best Practice:
Monitor SOL price and adjust quarterly to maintain affordability.
Set higher during network congestion to prioritize high-value uploads.


2. treasury_fee_percent and node_fee_percent

- Purpose: Splits upload payments between the treasury (protocol maintenance) and nodes (storage providers).
- Default: 25% treasury, 75% nodes (must sum to 100%).

#### Rationale:
- Economic Viability: The treasury funds protocol development, audits, and governance, ensuring long-term sustainability. Nodes receive the majority to incentivize participation.
- Resource Efficiency: A higher node share encourages more nodes, increasing storage capacity and redundancy.
- Scalability: Adjustable to balance protocol funding vs. node incentives. A lower treasury fee can attract more nodes during early adoption.


#### Best Practice:
Start with 25/75 to prioritize node incentives, reducing to 20/80 as the network scales.
Ensure treasury retains enough for upgrades and emergency slashing reserves.


3. shard_min_mb (Minimum Shard Size in Megabytes)

- Purpose: Defines the smallest allowable shard size to prevent inefficient fragmentation.
- Default: 100 MB.

#### Rationale:
- Resource Efficiency: Prevents excessive sharding, reducing on-chain metadata overhead (each shard requires a ShardInfo struct).
- Economic Viability: Ensures shards are large enough to justify node storage costs, avoiding low-value micro-shards.
- Scalability: Balances shard count with node capacity, preventing overload on small nodes.


#### Best Practice:
Set based on typical node storage capabilities (e.g., 100 MB for consumer-grade hardware).
Increase for enterprise-grade nodes to optimize for larger datasets.

4. epochs_total (Total Epochs for Reward Distribution)

- Purpose: Defines the duration over which node rewards are distributed.
- Default: 2,920 epochs (~1 year at 1 epoch/day).

#### Rationale:
- Economic Viability: Spreads rewards over time, ensuring nodes remain committed to long-term storage.
- Resource Efficiency: Prevents premature reward claims, reducing transaction volume.
- Scalability: Long epochs reduce on-chain claim operations, preserving Solana bandwidth.


#### Best Practice:
Align with expected data retention periods (e.g., 1 year for archival storage).
Adjust shorter for temporary storage use cases to attract users.

5. slash_penalty_percent (Penalty for Non-Compliance)

- Purpose: Percentage of stake slashed for failing PoS or replacement timeouts.
- Default: 10% (max 50%).

#### Rationale:
- Economic Viability: Deters non-compliance without overly punishing nodes, maintaining network participation.
- Security: Ensures nodes prioritize data availability, as slashing impacts profitability.
- Scalability: Moderate penalties prevent mass node exits, preserving network capacity.

#### Best Practice:
Keep below 20% to avoid discouraging new nodes.
Increase temporarily during high non-compliance periods to enforce accountability.

6. min_shard_count and max_shard_count

- Purpose: Defines the range of shards per upload, controlling data redundancy and distribution.
- Default: Min 1, Max 15.

#### Rationale:
- Resource Efficiency: Min 1 allows small uploads; max 15 caps metadata size to fit within Solana account limits.
- Scalability: Multiple shards increase redundancy but require more nodes; 15 balances availability with node availability.
- Economic Viability: Higher shard counts increase node revenue opportunities but raise user costs.


#### Best Practice:
Set min to 1 for low-cost uploads, max to 10-15 for high redundancy.
Adjust max based on active node count to avoid insufficient node errors.

7. slots_per_epoch (Solana Slots per Epoch)

- Purpose: Defines epoch duration in Solana slots (~0.4s per slot).
- Default: 432,000 slots (~2 days).

#### Rationale:
- Resource Efficiency: Longer epochs reduce claim and PoS submission frequency, lowering transaction costs.
- Economic Viability: Balances reward frequency with node operational costs, ensuring regular payouts.
- Scalability: Prevents network congestion by spacing out on-chain operations.


### Best Practice:
Set to 1-3 days (216,000-648,000 slots) for stable networks.
Shorten during testing or high node turnover to accelerate feedback loops.


8. min_node_stake (Minimum Stake in Lamports)

- Purpose: Minimum SOL stake required for node registration.
- Default: 100,000,000 lamports (~0.1 SOL).

#### Rationale:
- Economic Viability: Ensures nodes have skin in the game, deterring malicious or unreliable participants.
- Security: Higher stakes increase slashing impact, enforcing compliance.
- Scalability: Moderate stakes allow broad participation, increasing node count.


#### Best Practice:
Set to 0.1-0.5 SOL to balance accessibility and accountability.
Lower during early adoption to attract nodes, increase as network matures.


9. replacement_timeout_epochs (Epochs Before Slashing Replacement Nodes)

- Purpose: Time window for replacement nodes to submit PoS before slashing.
- Default: 30 epochs (~60 days).

#### Rationale:
- Economic Viability: Gives nodes sufficient time to transfer data, avoiding unfair penalties.
- Scalability: Long timeouts reduce slashing frequency, preserving node participation.
- Security: Ensures replacement nodes prioritize data availability.


#### Best Practice:
Set to 15-30 epochs for stable networks, shorter for high-turnover scenarios.
Monitor node compliance and adjust to balance leniency and enforcement.

## Operational Workflows
1. Network Setup

- Deploy Program: Deploy the Solad Program to Solana mainnet or devnet.
- Initialize Config: Run solad initialize with balanced parameters (e.g., 25/75 fee split, 0.1 SOL min stake).
- Register Nodes: Encourage nodes to register with stakes above the minimum to ensure robust capacity.
- Monitor: Track node count and stake distribution to ensure sufficient redundancy.

2. Data Upload

- Prepare Data: Hash the data off-chain (e.g., SHA-256) and determine size.
- Select Shards: Choose a shard count based on redundancy needs (e.g., 5 for critical data).
- Submit Upload: Run solad upload with node and replacement pubkeys.
- Verify: Confirm shard assignments via emitted UploadEvent.

3. Proof of Storage (PoS)

- Generate Proofs: Nodes compute Merkle proofs for their shards off-chain.
- Challenge: Other nodes in the shard sign challenges using ECDSA.
- Submit PoS: Run solad submit-pos with proof and signature.
- Monitor: Track verified_count to ensure shard completion.

4. Node Replacement

- Request Exit: Run solad request-replacement for the exiting node.
- Transfer Data: Coordinate off-chain data transfer to the replacement node.
- Submit PoS: Replacement node runs solad submit-pos to verify data.
- Slash if Timeout: Run solad slash-timeout if the replacement node fails to submit PoS.

5. Reward Claiming

- Check Epoch: Ensure the current epoch differs from last_claimed_epoch.
- Claim Rewards: Run solad claim-rewards for each shard.
- Monitor: Track RewardEvent for reward amounts and slashing penalties.

6. Node Deregistration

- Complete Uploads: Ensure upload_count is 0 by completing or replacing all shards.
- Deregister: Run solad deregister-node to close accounts and reclaim stake.
- Verify: Confirm stake return via transaction logs.


## Best Practices for Optimization
1. Resource Efficiency

- Minimize On-Chain Data: Store only metadata (hashes, shard info) on-chain; keep raw data off-chain.
- Batch Operations: Aggregate PoS submissions and reward claims to reduce transaction fees.
- Optimize Shards: Use the minimum viable shard count to reduce Upload account size.
- Reuse PDAs: Leverage deterministic PDAs (StorageConfig, Node, Upload) to avoid redundant account creation.

2. Economic Viability

- Dynamic Pricing: Adjust sol_per_gb based on SOL price and node costs to maintain affordability.
- Incentive Alignment: Keep node_fee_percent high (70-80%) to attract nodes, ensuring treasury sustainability.
- Slashing Moderation: Set slash_penalty_percent low (10-20%) to avoid deterring nodes while enforcing accountability.
- Reward Scheduling: Use long epochs_total to spread rewards, encouraging long-term node commitment.

3. Scalability

- Node Growth: Lower min_node_stake during early adoption to increase node count, raising it as the network matures.
- Shard Management: Cap max_shard_count based on active nodes to avoid InsufficientNodes errors.
- Epoch Tuning: Set slots_per_epoch to 1-3 days to balance reward frequency with network load.
- Replacement Strategy: Use long replacement_timeout_epochs to give nodes time to transfer data, reducing slashing frequency.

4. Security

- Cryptographic Proofs: Use SHA-256 for data hashes and Merkle trees to ensure integrity.
- Signature Verification: Enforce ECDSA signatures for PoS challenges to prevent spoofing.
- Multi-Sig Treasury: Secure the treasury with a multi-signature wallet to protect funds.
- Audit Contracts: Regularly audit the program for vulnerabilities, especially in slashing and reward logic.

5. Monitoring and Maintenance

- Event Tracking: Monitor emitted events (UploadEvent, PoSEvent, RewardEvent, etc.) for operational insights.
- Node Health: Track node upload_count and last_pos_time to detect non-compliance early.
- Config Updates: Schedule periodic update-config calls to adapt to network growth and economic changes.
- Community Engagement: Communicate configuration changes to nodes and users to maintain trust.


## Advanced Configurations
1. High-Redundancy Storage

Use Case: Critical data requiring maximum availability (e.g., medical records, legal documents).
Config:
min_shard_count: 5
max_shard_count: 15
shard_min_mb: 500 MB
slash_penalty_percent: 20%


Rationale: High shard count ensures redundancy; larger shards reduce fragmentation; stricter penalties enforce node reliability.

2. Low-Cost Storage

Use Case: Non-critical data with budget constraints (e.g., user media, backups).
Config:
sol_per_gb: 10,000,000 lamports
min_shard_count: 1
max_shard_count: 5
shard_min_mb: 50 MB


Rationale: Lower pricing and shard count reduce user costs; smaller shards allow flexibility for small datasets.

3. High-Throughput Network

Use Case: High-frequency uploads (e.g., IoT data streams).
Config:
slots_per_epoch: 216,000 (~1 day)
epochs_total: 1,460 (~6 months)
min_node_stake: 50,000,000 lamports


Rationale: Shorter epochs enable frequent rewards; lower stake attracts more nodes; shorter reward period suits temporary data.

4. Enterprise-Grade Storage

Use Case: Large-scale enterprise data requiring high security and capacity.
Config:
sol_per_gb: 50,000,000 lamports
min_node_stake: 500,000,000 lamports
shard_min_mb: 1,000 MB
replacement_timeout_epochs: 15


Rationale: Higher pricing and stakes ensure premium service; larger shards optimize for big data; shorter timeouts enforce rapid replacements.


## Economic Model Analysis
### Revenue Streams

- User Payments: Paid to treasury and node escrow based on sol_per_gb and data size.
- Slashing Penalties: Redistributed to treasury (90%) and callers (10%), funding protocol maintenance and incentivizing enforcement.
- Node Rewards: Distributed from escrow over epochs_total, proportional to shard size and verification status.

### Cost Structure

- Node Operations: Hardware, bandwidth, and electricity costs, offset by node fees.
- Transaction Fees: Solana’s low fees (~0.000005 SOL/tx) minimize overhead for uploads, PoS, and claims.
- Account Rent: Minimal due to efficient account structures (e.g., StorageConfig ~200 bytes, Upload ~1 KB for 5 shards).

### Scalability Projections

- Node Capacity: At 100 nodes with 1 TB each, the network supports 100 TB of unique data, expandable with more nodes.
- Shard Limits: Max 15 shards per upload supports up to 45 nodes per upload (3 nodes/shard), sufficient for redundancy.
- Transaction Throughput: Solana’s 65,000 TPS handles thousands of simultaneous uploads and PoS submissions.

### Economic Viability

- Break-Even Point: Nodes break even when rewards cover operational costs (e.g., ~0.01 SOL/GB/month at default config).
- User Affordability: At 0.03 SOL/GB, storage is competitive with centralized providers while offering decentralization.
- Treasury Sustainability: 25% fee share funds development for 5-10 years at 1,000 GB/day upload volume.


Security Considerations
1. Data Integrity

- Merkle Proofs: Ensure nodes store the exact data via off-chain verification.
- Hash Collisions: Mitigated by using SHA-256, which has negligible collision risk.

2. Node Accountability

- Slashing: Penalizes non-compliant nodes, enforced by timeout and PoS failures.
- Stake Requirements: Prevent Sybil attacks by requiring significant stakes.

3. Governance

- Authority Control: Only the authority can update StorageConfig, secured by a multi-sig wallet.
- Event Transparency: All actions emit events, enabling public auditing.

4. Network Attacks

- Collusion: Mitigated by random node assignment and challenger requirements.
- DDoS: Solana’s high throughput and fee market deter transaction flooding.
- Data Loss: Redundant shards and replacement mechanisms ensure availability.

## Future Enhancements

- Dynamic Sharding: Automatically adjust shard count based on data size and node availability.
- Multi-Tier Pricing: Offer tiered sol_per_gb rates for different redundancy levels.
- Node Reputation: Introduce a reputation score based on PoS success and uptime.
- Cross-Chain Integration: Support data bridging to other blockchains for interoperability.


## Conclusion
The Solad Program provides a robust, scalable, and economically viable decentralized storage solution on Solana. Its configurable parameters, efficient account structures, and cryptographic proofs ensure resource optimization, security, and scalability. By following the operational workflows, and best practices, stakeholders can deploy and manage a high-performance storage network that balances user affordability, node profitability, and protocol sustainability. Regular monitoring and configuration updates will ensure the program adapts to evolving network conditions, maintaining its position as a leading decentralized storage protocol.
