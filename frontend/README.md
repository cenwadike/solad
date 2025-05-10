# Solad dApp

This is a decentralized application (dApp) for uploading files and registering metadata on the Solana blockchain using a custom program.

---

## 🚀 Features

- Upload files to our storage services
- Store metadata (hash, size, shards, duration) on Solana via smart contract
- Custom Solana smart contract for `upload_data` instruction

---

## Setup Instructions

### 1. Clone the repo


git clone https://github.com/anonscodex/solad.git
cd solad


2. Install dependencies

npm install

3. Create .env file

VITE_SOLANA_PROGRAM_ID=<YOUR_PROGRAM_ID>
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
Replace <YOUR_PROGRAM_ID> with deployed Solana program ID.

4. Start the dev server

npm run dev

 Upload Flow
User uploads a file

File is hashed and optionally uploaded to storage

A transaction is created with metadata:

data_hash, size_bytes, shard_count, storage_duration_days

Transaction is signed and sent to your Solana program