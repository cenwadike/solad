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

#[derive(Debug, BorshDeserialize, BorshSerialize)]
pub struct Upload {
    pub data_hash: String,
    pub size_bytes: u64,
    pub shard_count: u8,
    pub node_lamports: u64,
    pub payer: Pubkey,
    pub upload_time: i64,
    pub storage_duration_days: u64,
    pub expiry_time: i64,
    pub current_slot: u64,
    pub shards: Vec<ShardInfo>,
}

#[derive(Debug, BorshDeserialize, BorshSerialize)]
pub struct ShardInfo {
    pub shard_id: u8,
    pub node_keys: [Pubkey; 3],
    pub verified_count: u8,
    pub size_mb: u64,
    pub challenger: Pubkey,
    pub oversized_reports: Vec<OversizedReport>,
    pub rewarded_nodes: Vec<Pubkey>,
}

#[derive(Debug, BorshDeserialize, BorshSerialize)]
pub struct OversizedReport {
    pub node: Pubkey,
    pub actual_size_mb: u64,
}

/// Anchor client wrapper for interacting with the Solad program
pub struct SoladClient {
    program: Program<Arc<Keypair>>,
    payer: Arc<Keypair>,
}

impl SoladClient {
    /// Initializes a new Solad client
    ///
    /// # Arguments
    /// * `rpc_url` - Solana RPC endpoint URL
    /// * `payer` - Keypair for signing transactions
    /// * `program_id` - Solad program ID
    pub async fn new(rpc_url: &str, payer: Arc<Keypair>, program_id: Pubkey) -> Result<Self> {
        let client = Client::new(
            Cluster::Custom(rpc_url.to_string(), "".to_string()),
            payer.clone(),
        );
        let program = client.program(program_id)?;
        Ok(SoladClient { program, payer })
    }

    /// Registers a new node in the Solad network
    ///
    /// # Arguments
    /// * `stake_amount` - Amount of lamports to stake
    /// * `config_pubkey` - Public key of the storage configuration account
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

    /// Claims rewards for a node based on a data upload
    ///
    /// # Arguments
    /// * `data_hash` - Hash of the uploaded data
    /// * `shard_id` - Shard ID for the reward claim
    /// * `upload_pda` - PDA of the upload account
    /// * `config_pubkey` - Public key of the storage configuration account
    /// * `treasury_pubkey` - Public key of the treasury account
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
