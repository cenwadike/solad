/// This module provides a client for interacting with the Solad program on the Solana
/// blockchain. It uses the Anchor client library to facilitate node registration and
/// reward claiming for a decentralized storage network. The module defines data structures
/// for upload and shard information and implements methods to send transactions to the
/// Solad program.

use anchor_client::{
    solana_sdk::{
        pubkey::Pubkey,
        signature::{Keypair, Signature},
        signer::Signer,
    },
    Client, Cluster, Program,
};
use anchor_lang::{prelude::AccountMeta, solana_program::system_program};
use anyhow::Result;
use borsh::{BorshDeserialize, BorshSerialize};
use std::sync::Arc;

// Constants for seed values (must match the Solad program)
const NODE_REGISTRY_SEED: &[u8] = b"node_registry";
const ESCROW_SEED: &[u8] = b"escrow";
const NODE_SEED: &[u8] = b"node";
const STAKE_ESCROW_SEED: &[u8] = b"stake_escrow";

/// Represents an upload account in the Solad program.
///
/// This struct captures details about a data upload, including the data hash, size,
/// shard count, payment details, and shard assignments.
#[derive(Debug, BorshDeserialize, BorshSerialize)]
pub struct Upload {
    pub data_hash: String,            // SHA-256 hash of the uploaded data
    pub size_bytes: u64,              // Size of the data in bytes
    pub shard_count: u8,              // Number of shards for the data
    pub node_lamports: u64,           // Lamports allocated per node
    pub payer: Pubkey,                // Public key of the payer
    pub upload_time: i64,             // Unix timestamp of the upload
    pub storage_duration_days: u64,   // Duration for which the data should be stored
    pub expiry_time: i64,             // Unix timestamp when the storage expires
    pub current_slot: u64,            // Current Solana slot at upload time
    pub shards: Vec<ShardInfo>,       // List of shard assignments
}

/// Represents information about a single shard in an upload.
///
/// Contains details about the shard's ID, assigned nodes, verification status, and
/// any oversized reports.
#[derive(Debug, BorshDeserialize, BorshSerialize)]
pub struct ShardInfo {
    pub shard_id: u8,                   // Unique identifier for the shard
    pub node_keys: [Pubkey; 3],         // Public keys of nodes assigned to the shard
    pub verified_count: u8,             // Number of verified nodes
    pub size_mb: u64,                   // Size of the shard in megabytes
    pub challenger: Pubkey,             // Public key of the challenger (if any)
    pub oversized_reports: Vec<OversizedReport>, // Reports of oversized data
    pub rewarded_nodes: Vec<Pubkey>,    // Nodes that have claimed rewards
}

/// Represents a report of oversized data for a shard.
///
/// Used to track discrepancies in reported data size for a node.
#[derive(Debug, BorshDeserialize, BorshSerialize)]
pub struct OversizedReport {
    pub node: Pubkey,         // Public key of the node reporting oversized data
    pub actual_size_mb: u64,  // Reported size in megabytes
}

/// Anchor client wrapper for interacting with the Solad program.
///
/// `SoladClient` encapsulates an Anchor `Program` instance and a payer keypair, providing
/// methods to register nodes and claim rewards.
pub struct SoladClient {
    program: Program<Arc<Keypair>>, // Anchor program instance for Solad
    payer: Arc<Keypair>,           // Keypair for signing transactions
}

impl SoladClient {
    /// Initializes a new `SoladClient` instance.
    ///
    /// Creates an Anchor client and program instance for the specified Solana RPC endpoint
    /// and program ID, using the provided payer keypair for transaction signing.
    ///
    /// # Arguments
    ///
    /// * `rpc_url` - The Solana RPC endpoint URL (HTTP).
    /// * `payer` - Shared reference to the keypair for signing transactions.
    /// * `program_id` - The public key of the Solad program.
    ///
    /// # Returns
    ///
    /// * `Result<Self>` - Returns a new `SoladClient` instance on success, or an error
    ///   if the client or program initialization fails.
    ///
    /// # Examples
    ///
    /// ```rust
    /// use std::sync::Arc;
    /// use solana_sdk::{pubkey::Pubkey, signature::Keypair};
    /// use crate::solad_client::SoladClient;
    ///
    /// #[tokio::main]
    /// async fn main() -> anyhow::Result<()> {
    ///     let rpc_url = "https://api.mainnet-beta.solana.com";
    ///     let payer = Arc::new(Keypair::new());
    ///     let program_id = Pubkey::new_unique();
    ///     let client = SoladClient::new(rpc_url, payer, program_id).await?;
    ///     Ok(())
    /// }
    /// ```
    pub async fn new(rpc_url: &str, payer: Arc<Keypair>, program_id: Pubkey) -> Result<Self> {
        let client = Client::new(
            Cluster::Custom(rpc_url.to_string(), "".to_string()),
            payer.clone(),
        );
        let program = client.program(program_id)?;
        Ok(SoladClient { program, payer })
    }

    /// Registers a new node in the Solad network.
    ///
    /// Sends a transaction to the Solad program to register a node, staking the specified
    /// amount of lamports and associating it with a storage configuration account.
    ///
    /// # Arguments
    ///
    /// * `stake_amount` - The amount of lamports to stake for the node.
    /// * `config_pubkey` - The public key of the storage configuration account.
    ///
    /// # Returns
    ///
    /// * `Result<Signature>` - Returns the transaction signature on success, or an error
    ///   if the transaction fails.
    ///
    /// # Workflow
    ///
    /// 1. **PDA Derivation**: Derives program-derived addresses (PDAs) for the node,
    ///    stake escrow, and node registry using predefined seeds.
    /// 2. **Account Setup**: Constructs the account metas for the transaction, including
    ///    the node PDA, stake escrow PDA, node registry PDA, payer, configuration public
    ///    key, and system program.
    /// 3. **Instruction Building**: Creates a `RegisterNode` instruction with the stake
    ///    amount.
    /// 4. **Transaction Submission**: Sends the transaction to the Solana network, signed
    ///    by the payer.
    ///
    /// # Examples
    ///
    /// ```rust
    /// use std::sync::Arc;
    /// use solana_sdk::{pubkey::Pubkey, signature::Keypair};
    /// use crate::solad_client::SoladClient;
    ///
    /// #[tokio::main]
    /// async fn main() -> anyhow::Result<()> {
    ///     let rpc_url = "https://api.mainnet-beta.solana.com";
    ///     let payer = Arc::new(Keypair::new());
    ///     let program_id = Pubkey::new_unique();
    ///     let client = SoladClient::new(rpc_url, payer, program_id).await?;
    ///     let stake_amount = 1_000_000_000;
    ///     let config_pubkey = Pubkey::new_unique();
    ///     let signature = client.register_node(stake_amount, config_pubkey).await?;
    ///     println!("Node registered with signature: {}", signature);
    ///     Ok(())
    /// }
    /// ```
    pub async fn register_node(
        &self,
        stake_amount: u64,
        config_pubkey: Pubkey,
    ) -> Result<Signature> {
        // Derive PDAs
        let (node_pda, _node_bump) = Pubkey::find_program_address(
            &[NODE_SEED, self.payer.pubkey().as_ref()],
            &self.program.id(),
        );
        let (stake_escrow_pda, _escrow_bump) = Pubkey::find_program_address(
            &[STAKE_ESCROW_SEED, self.payer.pubkey().as_ref()],
            &self.program.id(),
        );
        let (node_registry_pda, _registry_bump) =
            Pubkey::find_program_address(&[NODE_REGISTRY_SEED], &self.program.id());

        // Build instruction
        let accounts = vec![
            AccountMeta::new(node_pda, false),
            AccountMeta::new(stake_escrow_pda, false),
            AccountMeta::new(node_registry_pda, false),
            AccountMeta::new(self.payer.pubkey(), true),
            AccountMeta::new(config_pubkey, false),
            AccountMeta::new_readonly(system_program::ID, false),
        ];

        let instruction_data = contract::instruction::RegisterNode { stake_amount };

        let signature = self
            .program
            .request()
            .accounts(accounts)
            .args(instruction_data)
            .signer(&self.payer)
            .send()
            .await?;

        Ok(signature)
    }

    /// Claims rewards for a node based on a data upload.
    ///
    /// Sends a transaction to the Solad program to claim rewards for a node assigned to
    /// a specific shard of an upload, transferring funds from the escrow to the node's
    /// stake escrow account.
    ///
    /// # Arguments
    ///
    /// * `data_hash` - The SHA-256 hash of the uploaded data.
    /// * `shard_id` - The ID of the shard for which to claim rewards.
    /// * `upload_pda` - The program-derived address of the upload account.
    /// * `config_pubkey` - The public key of the storage configuration account.
    /// * `treasury_pubkey` - The public key of the treasury account.
    ///
    /// # Returns
    ///
    /// * `Result<Signature>` - Returns the transaction signature on success, or an error
    ///   if the transaction fails.
    ///
    /// # Workflow
    ///
    /// 1. **PDA Derivation**: Derives PDAs for the node, escrow, and stake escrow using
    ///    the data hash, payer public key, and predefined seeds.
    /// 2. **Account Setup**: Constructs the account metas for the transaction, including
    ///    the upload PDA, node PDA, escrow PDA, configuration public key, treasury public
    ///    key, stake escrow PDA, and system program.
    /// 3. **Instruction Building**: Creates a `ClaimRewards` instruction with the data
    ///    hash and shard ID.
    /// 4. **Transaction Submission**: Sends the transaction to the Solana network, signed
    ///    by the payer.
    ///
    /// # Examples
    ///
    /// ```rust
    /// use std::sync::Arc;
    /// use solana_sdk::{pubkey::Pubkey, signature::Keypair};
    /// use crate::solad_client::SoladClient;
    ///
    /// #[tokio::main]
    /// async fn main() -> anyhow::Result<()> {
    ///     let rpc_url = "https://api.mainnet-beta.solana.com";
    ///     let payer = Arc::new(Keypair::new());
    ///     let program_id = Pubkey::new_unique();
    ///     let client = SoladClient::new(rpc_url, payer, program_id).await?;
    ///     let data_hash = "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e".to_string();
    ///     let shard_id = 1;
    ///     let upload_pda = Pubkey::new_unique();
    ///     let config_pubkey = Pubkey::new_unique();
    ///     let treasury_pubkey = Pubkey::new_unique();
    ///     let signature = client.claim_rewards(data_hash, shard_id, upload_pda, config_pubkey, treasury_pubkey).await?;
    ///     println!("Rewards claimed with signature: {}", signature);
    ///     Ok(())
    /// }
    /// ```
    pub async fn claim_rewards(
        &self,
        data_hash: String,
        shard_id: u8,
        upload_pda: Pubkey,
        config_pubkey: Pubkey,
        treasury_pubkey: Pubkey,
    ) -> Result<Signature> {
        // Derive PDAs
        let (node_pda, _node_bump) = Pubkey::find_program_address(
            &[NODE_SEED, self.payer.pubkey().as_ref()],
            &self.program.id(),
        );
        let (escrow_pda, _escrow_bump) = Pubkey::find_program_address(
            &[
                ESCROW_SEED,
                data_hash.as_bytes(),
                self.payer.pubkey().as_ref(),
            ],
            &self.program.id(),
        );
        let (stake_escrow_pda, _stake_bump) = Pubkey::find_program_address(
            &[STAKE_ESCROW_SEED, self.payer.pubkey().as_ref()],
            &self.program.id(),
        );

        // Build instruction
        let accounts = vec![
            AccountMeta::new_readonly(upload_pda, false),
            AccountMeta::new(node_pda, false),
            AccountMeta::new(escrow_pda, false),
            AccountMeta::new(config_pubkey, false),
            AccountMeta::new(treasury_pubkey, false),
            AccountMeta::new(stake_escrow_pda, false),
            AccountMeta::new_readonly(system_program::ID, false),
        ];

        let instruction_data = contract::instruction::ClaimRewards {
            data_hash,
            shard_id,
        };

        let signature = self
            .program
            .request()
            .accounts(accounts)
            .args(instruction_data)
            .signer(&self.payer)
            .send()
            .await?;

        Ok(signature)
    }
}
