# SoLad: Solana’s Storage Lad

**Tagline**: $6/GB for 20 years—decentralized storage for Solana’s logs and data.

## Overview

SoLad is a peer-to-peer storage network for Solana, tackling transient log pruning (RPCs clear logs in days) and centralized explorer risks (e.g., Solscan). It stores Geyser streams, Layer 2 data, and off-chain assets (e.g., NFT metadata) at $6/GB for 20 years. It uses 5-10 shards, each with 3 nodes, for redundancy and speed (8.33MB/s).

- **Client**: Splits data (e.g., 10MB → 5 shards × 2MB).
- **Payment**: $6/GB (0.03 SOL/GB at $200/SOL), 25% treasury ($1.50/GB), 75% nodes ($4.50/GB).
- **Nodes**: Store shards redundantly, earn $0.15/100MB/node (8.7% margin).
- **Use Case**: 500 dApps, ~275GB/year (2025 estimate).

## Features

- **One-Time Fee**: $6/GB locks data for 20 years.
- **Sharding**: 5-10 shards, 3 nodes each, client-split (e.g., 100MB/shard for 1GB).
- **Proof of Storage (PoS)**: Nodes prove data in <2s, claim rewards over 2,920 epochs (~2.5 days).
- **Solana L1**: Payments and rewards via Anchor program.
- **Demo**: 10MB upload, 5 shards, 0.06 SOL, query in 216ms.