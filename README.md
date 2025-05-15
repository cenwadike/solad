# SoLad: Solana’s Storage Lad

**Tagline**: Storing Solana logs and data securely under flexible conditions

## Overview

SoLad is a peer-to-peer storage network for Solana, tackling transient log pruning (RPCs clear logs in days) and centralized explorer risks (e.g., Solscan). It supports Event streams data lake, off-chain assets (e.g., NFT metadata), and Layer 2 data at $6/GB for 20 years. It uses 1-10 shards, each with 3 nodes, for redundancy and speed (~10MB/s).

- **Client**: Uploads data to one shard ($6/GB/20 years).
- **Payment**: $6/GB (0.03 SOL/GB at $200/SOL), 25% treasury ($1.50/GB), 75% nodes ($4.50/GB).
- **Nodes**: Store shards redundantly, earn $0.15/100MB/node (8.7% margin).
- **Use Case**: 10,000 dApps, ~275GB/year/dApp (2025 estimate).

## Features

- **One-Time Flexible Fee**: eg. $6/GB locks data for 20 years.
- **Sharding**: 1-10 shards, 3 nodes each, client-split (e.g., 100MB/shard for 1GB).
- **Proof of Storage (PoS)**: Nodes prove data in <100ms, claim rewards over 2,920 epochs (~2.5 days).
- **Solana L1**: Payments and rewards via Anchor program.
- **Demo**: 10MB upload, 1 shards, 0.00029 SOL, query in 100ms.

## How To Use

- Clone repo; `git clone https://github.com/cenwadike/solad`
- Go to the section you want to use and check out the README and examples

## How To Run Locally

### Requirements
- Solana CLI
- Solana Local Validator
- Anchor v0.30.1
- npm v10.8.2
- node v20.19.1
- rustup 1.28.1
- rustc 1.85.1 
- cargo v1.85.1

### Setup Contract .env 

```sh
  NODE_PRIVATE_KEY=
```

### Setup Node .env 

```sh
  NODE_SOLANA_PRIVKEY=
  WS_URL=ws://127.0.0.1:8900
  HTTP_URL=http://127.0.0.1:8899
```

### Setup frontend .env
```sh
  VITE_SOLANA_PROGRAM_ID=4Fbo2dQdqrVhxLBbZrxVEbDBxp8GmNa9voEN96d4fQJp
  VITE_SOLANA_RPC_URL=http://127.0.0.1:8899
  VITE_NODE_API_URL=http://127.0.0.1:8080
```

`NODE_SOLANA_PRIVKEY` and `NODE_PRIVATE_KEY` must match for a smooth local test

### Run Solana local validator

```sh
  solana-test-validator -r
```

### Run the onchain program initialization

```sh
  anchor test --skip-local-validator
```

### Run one SoLad Node

```sh
  cargo run
```

### Run the frontend

```sh
  npm i
```

```sh
  npm run dev
```

## PS: 
- NODE must stake more than 0.1 Sol (adjustable)
- Wallet connected to the frontend must have enough Sol to cover gas and storage payment

## SDKs

- SoLad provides Rust and TypeScript SDKs for interacting with the node and the smart contract

- Check out the SDK examples to learn how to upload, stream and retrieve data
