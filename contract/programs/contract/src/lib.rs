#![allow(unexpected_cfgs)]
use anchor_lang::prelude::*;
use anchor_lang::solana_program::secp256k1_recover::secp256k1_recover;
use anchor_lang::system_program;
use sha2::{Digest, Sha256};

declare_id!("4Fbo2dQdqrVhxLBbZrxVEbDBxp8GmNa9voEN96d4fQJp");

// PDA Seeds for deterministic account addressing
const STORAGE_CONFIG_SEED: &[u8] = b"storage_config";
const UPLOAD_SEED: &[u8] = b"upload";
const NODE_SEED: &[u8] = b"node";
const ESCROW_SEED: &[u8] = b"escrow";
const STAKE_ESCROW_SEED: &[u8] = b"stake_escrow";

#[program]
pub mod solad {
    use super::*;

    /// Initializes the SoLad program with configurable parameters optimized for low latency and high throughput.
    pub fn initialize(
        ctx: Context<Initialize>,
        treasury: Pubkey,
        sol_per_gb: u64,
        treasury_fee_percent: u64,
        node_fee_percent: u64,
        shard_min_mb: u64,
        epochs_total: u64,
        slash_penalty_percent: u64,
        min_shard_count: u8,
        max_shard_count: u8,
        slots_per_epoch: u64,
        min_node_stake: u64,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.treasury = treasury;
        config.sol_per_gb = sol_per_gb;
        config.treasury_fee_percent = treasury_fee_percent;
        config.node_fee_percent = node_fee_percent;
        config.shard_min_mb = shard_min_mb;
        config.epochs_total = epochs_total;
        config.slash_penalty_percent = slash_penalty_percent;
        config.min_shard_count = min_shard_count;
        config.max_shard_count = max_shard_count;
        config.slots_per_epoch = slots_per_epoch;
        config.min_node_stake = min_node_stake;
        config.is_initialized = true;

        // Validate configuration parameters
        require!(sol_per_gb > 0, SoladError::InvalidPaymentRate);
        require!(
            treasury_fee_percent + node_fee_percent == 100,
            SoladError::InvalidFeeSplit
        );
        require!(
            min_shard_count >= 1 && max_shard_count <= 15,
            SoladError::InvalidShardRange
        );
        require!(
            min_shard_count <= max_shard_count,
            SoladError::InvalidShardRange
        );
        require!(epochs_total > 0, SoladError::InvalidEpochs);
        require!(slash_penalty_percent <= 50, SoladError::InvalidPenalty);
        require!(slots_per_epoch > 0, SoladError::InvalidSlotsPerEpoch);
        require!(min_node_stake >= 100_000_000, SoladError::InvalidStake); // Minimum 0.1 SOL

        emit!(ConfigInitializedEvent {
            treasury,
            sol_per_gb,
            treasury_fee_percent,
            node_fee_percent,
            shard_min_mb,
            epochs_total,
            slash_penalty_percent,
            min_shard_count,
            max_shard_count,
            slots_per_epoch,
            min_node_stake,
        });

        Ok(())
    }

    /// Registers a node with a stake, locking SOL in an escrow.
    pub fn register_node(ctx: Context<RegisterNode>, stake_amount: u64) -> Result<()> {
        let config = &ctx.accounts.config;
        require!(config.is_initialized, SoladError::NotInitialized);
        require!(stake_amount >= config.min_node_stake, SoladError::InvalidStake);

        let node = &mut ctx.accounts.node;
        node.owner = ctx.accounts.owner.key();
        node.stake_amount = stake_amount;
        node.upload_count = 0;
        node.last_pos_time = 0;
        node.last_claimed_epoch = 0;

        // Transfer stake to stake escrow
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.owner.to_account_info(),
                    to: ctx.accounts.stake_escrow.to_account_info(),
                },
            ),
            stake_amount,
        )?;

        emit!(NodeRegisteredEvent {
            node: ctx.accounts.owner.key(),
            stake_amount,
        });

        Ok(())
    }

    /// Deregisters a node, closing accounts and returning the stake.
    pub fn deregister_node(ctx: Context<DeregisterNode>) -> Result<()> {
        let config = &ctx.accounts.config;
        require!(config.is_initialized, SoladError::NotInitialized);

        let node = &ctx.accounts.node;
        require!(
            node.owner == ctx.accounts.owner.key(),
            SoladError::Unauthorized
        );
        require!(node.upload_count == 0, SoladError::NodeHasActiveUploads);

        // Transfer remaining stake back to owner
        let stake_amount = node.stake_amount;
        let stake_escrow_seeds = &[
            STAKE_ESCROW_SEED,
            node.owner.as_ref(),
            &[ctx.accounts.stake_escrow.bump],
        ];
        system_program::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.stake_escrow.to_account_info(),
                    to: ctx.accounts.owner.to_account_info(),
                },
                &[&stake_escrow_seeds[..]],
            ),
            stake_amount,
        )?;

        emit!(NodeDeregisteredEvent {
            node: ctx.accounts.owner.key(),
            stake_amount,
        });

        Ok(())
    }

    /// Updates configuration parameters, allowing dynamic adjustment without redeployment.
    pub fn update_config(
        ctx: Context<UpdateConfig>,
        sol_per_gb: Option<u64>,
        treasury_fee_percent: Option<u64>,
        node_fee_percent: Option<u64>,
        shard_min_mb: Option<u64>,
        epochs_total: Option<u64>,
        slash_penalty_percent: Option<u64>,
        min_shard_count: Option<u8>,
        max_shard_count: Option<u8>,
        slots_per_epoch: Option<u64>,
        min_node_stake: Option<u64>,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;
        require!(config.is_initialized, SoladError::NotInitialized);

        // Update and validate parameters if provided
        if let Some(sol_per_gb) = sol_per_gb {
            require!(sol_per_gb > 0, SoladError::InvalidPaymentRate);
            config.sol_per_gb = sol_per_gb;
        }
        if let (Some(treasury_fee), Some(node_fee)) = (treasury_fee_percent, node_fee_percent) {
            require!(treasury_fee + node_fee == 100, SoladError::InvalidFeeSplit);
            config.treasury_fee_percent = treasury_fee;
            config.node_fee_percent = node_fee;
        }
        if let Some(shard_min_mb) = shard_min_mb {
            config.shard_min_mb = shard_min_mb;
        }
        if let Some(epochs_total) = epochs_total {
            require!(epochs_total > 0, SoladError::InvalidEpochs);
            config.epochs_total = epochs_total;
        }
        if let Some(slash_penalty_percent) = slash_penalty_percent {
            require!(slash_penalty_percent <= 50, SoladError::InvalidPenalty);
            config.slash_penalty_percent = slash_penalty_percent;
        }
        if let (Some(min_shard_count), Some(max_shard_count)) = (min_shard_count, max_shard_count) {
            require!(
                min_shard_count >= 1 && max_shard_count <= 15,
                SoladError::InvalidShardRange
            );
            require!(
                min_shard_count <= max_shard_count,
                SoladError::InvalidShardRange
            );
            config.min_shard_count = min_shard_count;
            config.max_shard_count = max_shard_count;
        }
        if let Some(slots_per_epoch) = slots_per_epoch {
            require!(slots_per_epoch > 0, SoladError::InvalidSlotsPerEpoch);
            config.slots_per_epoch = slots_per_epoch;
        }
        if let Some(min_node_stake) = min_node_stake {
            require!(min_node_stake >= 100_000_000, SoladError::InvalidStake);
            config.min_node_stake = min_node_stake;
        }

        emit!(ConfigUpdatedEvent {
            sol_per_gb: config.sol_per_gb,
            treasury_fee_percent: config.treasury_fee_percent,
            node_fee_percent: config.node_fee_percent,
            shard_min_mb: config.shard_min_mb,
            epochs_total: config.epochs_total,
            slash_penalty_percent: config.slash_penalty_percent,
            min_shard_count: config.min_shard_count,
            max_shard_count: config.max_shard_count,
            slots_per_epoch: config.slots_per_epoch,
            min_node_stake: config.min_node_stake,
        });

        Ok(())
    }

    /// Processes a data upload, handling payments and shard assignments.
    pub fn upload_data(
        ctx: Context<UploadData>,
        data_hash: String,
        size_mb: u64,
        shard_count: u8,
    ) -> Result<()> {
        let config = &ctx.accounts.config;
        require!(config.is_initialized, SoladError::NotInitialized);
        require!(size_mb >= 1, SoladError::InvalidSize);
        require!(
            shard_count >= config.min_shard_count && shard_count <= config.max_shard_count,
            SoladError::InvalidShardCount
        );
        require!(
            data_hash.len() <= 64 && !data_hash.is_empty(),
            SoladError::InvalidHash
        );

        let upload = &mut ctx.accounts.upload;

        // Calculate payment in lamports
        let total_lamports = size_mb
            .checked_mul(config.sol_per_gb / 1000)
            .ok_or(SoladError::MathOverflow)?;
        let treasury_lamports = total_lamports
            .checked_mul(config.treasury_fee_percent)
            .ok_or(SoladError::MathOverflow)?
            / 100;
        let node_lamports = total_lamports
            .checked_mul(config.node_fee_percent)
            .ok_or(SoladError::MathOverflow)?
            / 100;

        // Validate payer's balance
        require!(
            ctx.accounts.payer.lamports() >= total_lamports,
            SoladError::InsufficientFunds
        );

        // Transfer SOL to treasury
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.payer.to_account_info(),
                    to: ctx.accounts.treasury.to_account_info(),
                },
            ),
            treasury_lamports,
        )?;

        // Transfer SOL to escrow for node rewards
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.payer.to_account_info(),
                    to: ctx.accounts.escrow.to_account_info(),
                },
            ),
            node_lamports,
        )?;

        // Optimize shard distribution to meet minimum size requirements
        let mut adjusted_shard_count = shard_count;
        let mut shard_sizes_mb = vec![0u64; shard_count as usize];
        let base_shard_size = size_mb / (shard_count as u64);
        let remainder_mb = size_mb % (shard_count as u64);

        // Distribute sizes evenly, prioritizing minimum shard size
        for i in 0..shard_count as usize {
            shard_sizes_mb[i] = base_shard_size + if i < remainder_mb as usize { 1 } else { 0 };
        }

        // Adjust shard count if sizes are below minimum (except for small uploads)
        if size_mb >= config.shard_min_mb {
            let mut all_valid = true;
            for &size in shard_sizes_mb.iter() {
                if size > 0 && size < config.shard_min_mb {
                    all_valid = false;
                    break;
                }
            }
            if !all_valid {
                adjusted_shard_count = ((size_mb + config.shard_min_mb - 1) / config.shard_min_mb)
                    .max(config.min_shard_count as u64)
                    .min(config.max_shard_count as u64)
                    as u8;
                shard_sizes_mb = vec![0u64; adjusted_shard_count as usize];
                let new_base_size = size_mb / (adjusted_shard_count as u64);
                let new_remainder = size_mb % (adjusted_shard_count as u64);
                for j in 0..adjusted_shard_count as usize {
                    shard_sizes_mb[j] =
                        new_base_size + if j < new_remainder as usize { 1 } else { 0 };
                }
            }
        }

        // Ensure adjusted shard count is within bounds
        require!(
            adjusted_shard_count >= config.min_shard_count
                && adjusted_shard_count <= config.max_shard_count,
            SoladError::InvalidShardCount
        );

        // Initialize upload account
        upload.data_hash = data_hash.clone();
        upload.size_mb = size_mb;
        upload.shard_count = adjusted_shard_count;
        upload.node_lamports = node_lamports;
        upload.payer = ctx.accounts.payer.key();
        upload.upload_time = Clock::get()?.unix_timestamp;

        // Automatically assign nodes to shards based on stake
        let available_nodes = &ctx.remaining_accounts;
        require!(
            available_nodes.len() >= adjusted_shard_count as usize * 3,
            SoladError::InsufficientNodes
        );

        let mut node_stakes = Vec::with_capacity(available_nodes.len());
        let mut total_stake = 0u64;
        for node_account in available_nodes.iter() {
            let node_data = node_account.data.borrow();
            let node: &Node = &Node::try_deserialize(&mut node_data.as_ref())
                .map_err(|_| SoladError::InvalidNodeAccount)?;
            require!(
                node.stake_amount >= config.min_node_stake,
                SoladError::InsufficientStake
            );
            node_stakes.push((node_account.key(), node.stake_amount));
            total_stake = total_stake
                .checked_add(node.stake_amount)
                .ok_or(SoladError::MathOverflow)?;
        }

        let mut assigned_nodes: Vec<Vec<Pubkey>> = vec![vec![]; adjusted_shard_count as usize];

        // Assign up to 3 nodes per shard with weighted selection
        for i in 0..adjusted_shard_count as usize {
            let mut nodes_for_shard = vec![];
            let mut remaining_nodes = node_stakes.clone();
            let seed = format!("{}:{}", data_hash, i);
            let mut rng_state = u64::from_le_bytes(
                Sha256::digest(seed.as_bytes())[..8]
                    .try_into()
                    .unwrap(),
            );

            // Select 3 unique nodes
            for _ in 0..3 {
                if remaining_nodes.is_empty() {
                    break;
                }
                let total_remaining_stake: u64 = remaining_nodes
                    .iter()
                    .map(|(_, stake)| stake)
                    .sum();
                if total_remaining_stake == 0 {
                    break;
                }

                // Weighted random selection
                rng_state ^= rng_state << 13;
                rng_state ^= rng_state >> 7;
                rng_state ^= rng_state << 17;
                let target = rng_state % total_remaining_stake;
                let mut cumulative = 0u64;
                let mut selected_index = 0;

                for (j, (_, stake)) in remaining_nodes.iter().enumerate() {
                    cumulative = cumulative
                        .checked_add(*stake)
                        .ok_or(SoladError::MathOverflow)?;
                    if target < cumulative {
                        selected_index = j;
                        break;
                    }
                }

                let (selected_pubkey, _) = remaining_nodes.remove(selected_index);
                nodes_for_shard.push(selected_pubkey);
            }

            require!(
                nodes_for_shard.len() >= 1,
                SoladError::InsufficientNodes
            );
            assigned_nodes[i] = nodes_for_shard;
        }

        // Assign shards with nodes and increment upload_count
        for i in 0..adjusted_shard_count {
            let shard_id = hash_to_shard(&data_hash, i);
            let mut node_array = [Pubkey::default(); 3];
            let nodes = &assigned_nodes[i as usize];
            for (j, &key) in nodes.iter().enumerate().take(3) {
                node_array[j] = key;
                // Increment upload_count for each assigned node
                let node_account = available_nodes
                    .iter()
                    .find(|acc| acc.key() == key)
                    .ok_or(SoladError::InvalidNodeAccount)?;
                let mut node_data = node_account.data.borrow_mut();
                let mut node: Node = Node::try_deserialize(&mut node_data.as_ref())
                    .map_err(|_| SoladError::InvalidNodeAccount)?;
                node.upload_count = node
                    .upload_count
                    .checked_add(1)
                    .ok_or(SoladError::MathOverflow)?;
                let mut serialized = Vec::new();
                node.try_serialize(&mut serialized)?;
                node_data.copy_from_slice(&serialized);
            }
            upload.shards[i as usize] = ShardInfo {
                shard_id,
                node_keys: node_array,
                verified: false,
                size_mb: shard_sizes_mb[i as usize],
                challenger: Pubkey::default(),
            };
        }

        emit!(UploadEvent {
            data_hash,
            size_mb,
            shard_count: adjusted_shard_count,
            payer: ctx.accounts.payer.key(),
        });

        Ok(())
    }

    /// Submits Proof of Storage (PoS) with Merkle proof verification.
    pub fn submit_pos(
        ctx: Context<SubmitPoS>,
        data_hash: String,
        shard_id: u8,
        merkle_root: String,
        merkle_proof: Vec<[u8; 32]>,
        leaf: [u8; 32],
        challenger_signature: [u8; 64],
        challenger_pubkey: Pubkey,
    ) -> Result<()> {
        let upload = &mut ctx.accounts.upload;
        let config = &ctx.accounts.config;
        require!(config.is_initialized, SoladError::NotInitialized);
        require!(upload.data_hash == data_hash, SoladError::InvalidHash);
        require!(shard_id < upload.shard_count, SoladError::InvalidShardId);

        let shard = &mut upload.shards[shard_id as usize];
        require!(
            shard.node_keys.contains(&ctx.accounts.node.key()),
            SoladError::Unauthorized
        );

        // Ensure challenger is one of the nodes in the shard
        require!(
            shard.node_keys.contains(&challenger_pubkey),
            SoladError::InvalidChallenger
        );

        // Ensure challenger is not the node submitting PoS
        require!(
            ctx.accounts.node.key() != challenger_pubkey,
            SoladError::ChallengerIsNode
        );

        // Validate Merkle proof
        require!(
            verify_merkle_proof(&merkle_root, &merkle_proof, &leaf),
            SoladError::InvalidMerkleProof
        );

        // Verify challenger signature
        let message = format!("{data_hash}:{shard_id}:{merkle_root}");
        require!(
            verify_signature(&message, &challenger_signature, &challenger_pubkey),
            SoladError::InvalidChallengerSignature
        );

        // Update shard verification status
        shard.verified = true;
        shard.challenger = challenger_pubkey;

        emit!(PoSEvent {
            data_hash,
            shard_id,
            node: ctx.accounts.node.key(),
            merkle_root,
            challenger: challenger_pubkey,
        });

        Ok(())
    }

    /// Allows nodes to claim their rewards per Solana epoch.
    pub fn claim_rewards(
        ctx: Context<ClaimRewards>,
        data_hash: String,
        shard_id: u8,
    ) -> Result<()> {
        let upload = &ctx.accounts.upload;
        let node = &mut ctx.accounts.node;
        let escrow = &ctx.accounts.escrow;
        let config = &ctx.accounts.config;
        require!(config.is_initialized, SoladError::NotInitialized);

        require!(upload.data_hash == data_hash, SoladError::InvalidHash);
        require!(shard_id < upload.shard_count, SoladError::InvalidShardId);

        let shard = &upload.shards[shard_id as usize];
        require!(
            shard.node_keys.contains(&node.key()),
            SoladError::Unauthorized
        );

        // Ensure node is not the challenger
        require!(
            shard.challenger == Pubkey::default() || node.key() != shard.challenger,
            SoladError::ChallengerIsNode
        );

        // Use Solana's current epoch
        let current_epoch = Clock::get()?.slot / config.slots_per_epoch;
        require!(
            node.last_claimed_epoch < current_epoch,
            SoladError::AlreadyClaimed
        );

        // Calculate reward based on shard size
        let shard_lamports = upload
            .node_lamports
            .checked_mul(shard.size_mb)
            .ok_or(SoladError::MathOverflow)?
            .checked_div(upload.size_mb)
            .ok_or(SoladError::MathOverflow)?;
        let node_lamports = shard_lamports
            .checked_div(3)
            .ok_or(SoladError::MathOverflow)?; // 3 nodes per shard
        let epoch_lamports = node_lamports
            .checked_div(config.epochs_total)
            .ok_or(SoladError::MathOverflow)?;

        // Apply slashing if PoS not verified
        let reward = if shard.verified {
            epoch_lamports
        } else {
            epoch_lamports
                .checked_mul(100 - config.slash_penalty_percent)
                .ok_or(SoladError::MathOverflow)?
                / 100
        };

        // Slash stake if PoS not verified
        if !shard.verified {
            let slash_amount = node
                .stake_amount
                .checked_mul(config.slash_penalty_percent)
                .ok_or(SoladError::MathOverflow)?
                / 100;
            node.stake_amount = node
                .stake_amount
                .checked_sub(slash_amount)
                .ok_or(SoladError::MathOverflow)?;
            let stake_escrow_seeds = &[
                STAKE_ESCROW_SEED,
                node.owner.as_ref(),
                &[ctx.accounts.stake_escrow.bump],
            ];
            system_program::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.system_program.to_account_info(),
                    system_program::Transfer {
                        from: ctx.accounts.stake_escrow.to_account_info(),
                        to: ctx.accounts.treasury.to_account_info(),
                    },
                    &[&stake_escrow_seeds[..]],
                ),
                slash_amount,
            )?;
        }

        // Ensure minimum reward
        require!(reward >= 1000, SoladError::InsufficientReward);

        // Transfer SOL reward from escrow
        let seeds = &[
            ESCROW_SEED,
            upload.data_hash.as_bytes(),
            upload.payer.as_ref(),
            &[ctx.accounts.escrow.bump],
        ];
        system_program::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: escrow.to_account_info(),
                    to: node.to_account_info(),
                },
                &[&seeds[..]],
            ),
            reward,
        )?;

        // Decrement upload_count if this is the last epoch
        if current_epoch >= config.epochs_total {
            node.upload_count = node
                .upload_count
                .checked_sub(1)
                .ok_or(SoladError::MathOverflow)?;
        }

        node.last_claimed_epoch = current_epoch;

        emit!(RewardEvent {
            data_hash,
            shard_id,
            node: node.key(),
            amount: reward,
        });

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(
    treasury: Pubkey,
    sol_per_gb: u64,
    treasury_fee_percent: u64,
    node_fee_percent: u64,
    shard_min_mb: u64,
    epochs_total: u64,
    slash_penalty_percent: u64,
    min_shard_count: u8,
    max_shard_count: u8,
    slots_per_epoch: u64,
    min_node_stake: u64
)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 8 + 8 + 8 + 8 + 8 + 8 + 1 + 1 + 8 + 8 + 1,
        seeds = [STORAGE_CONFIG_SEED],
        bump
    )]
    pub config: Account<'info, StorageConfig>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RegisterNode<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + 32 + 8 + 8 + 8 + 8,
        seeds = [NODE_SEED, owner.key().as_ref()],
        bump
    )]
    pub node: Account<'info, Node>,
    #[account(
        init,
        payer = owner,
        space = 8 + 1,
        seeds = [STAKE_ESCROW_SEED, owner.key().as_ref()],
        bump
    )]
    pub stake_escrow: Account<'info, Escrow>,
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(mut)]
    pub config: Account<'info, StorageConfig>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DeregisterNode<'info> {
    #[account(
        mut,
        seeds = [NODE_SEED, owner.key().as_ref()],
        bump,
        close = owner
    )]
    pub node: Account<'info, Node>,
    #[account(
        mut,
        seeds = [STAKE_ESCROW_SEED, owner.key().as_ref()],
        bump,
        close = owner
    )]
    pub stake_escrow: Account<'info, Escrow>,
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(mut)]
    pub config: Account<'info, StorageConfig>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    #[account(
        mut,
        seeds = [STORAGE_CONFIG_SEED],
        bump
    )]
    pub config: Account<'info, StorageConfig>,
    #[account(mut)]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(data_hash: String, size_mb: u64, shard_count: u8)]
pub struct UploadData<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + 64 + 8 + 1 + 8 + 32 + 8 + (40 * shard_count as usize),
        seeds = [UPLOAD_SEED, data_hash.as_bytes(), payer.key().as_ref()],
        bump
    )]
    pub upload: Account<'info, Upload>,
    #[account(mut)]
    pub config: Account<'info, StorageConfig>,
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: Verified via config.treasury
    #[account(mut, address = config.treasury)]
    pub treasury: AccountInfo<'info>,
    #[account(
        init,
        payer = payer,
        space = 8 + 1,
        seeds = [ESCROW_SEED, data_hash.as_bytes(), payer.key().as_ref()],
        bump
    )]
    pub escrow: Account<'info, Escrow>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(data_hash: String, shard_id: u8, merkle_root: String, merkle_proof: Vec<[u8; 32]>, leaf: [u8; 32], challenger_signature: [u8; 64], challenger_pubkey: Pubkey)]
pub struct SubmitPoS<'info> {
    #[account(
        mut,
        seeds = [UPLOAD_SEED, data_hash.as_bytes(), upload.payer.as_ref()],
        bump
    )]
    pub upload: Account<'info, Upload>,
    #[account(
        mut,
        seeds = [NODE_SEED, node.key().as_ref()],
        bump
    )]
    pub node: Account<'info, Node>,
    #[account(mut)]
    pub config: Account<'info, StorageConfig>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(data_hash: String, shard_id: u8)]
pub struct ClaimRewards<'info> {
    #[account(
        seeds = [UPLOAD_SEED, data_hash.as_bytes(), upload.payer.as_ref()],
        bump
    )]
    pub upload: Account<'info, Upload>,
    #[account(
        mut,
        seeds = [NODE_SEED, node.key().as_ref()],
        bump
    )]
    pub node: Account<'info, Node>,
    #[account(
        mut,
        seeds = [ESCROW_SEED, data_hash.as_bytes(), upload.payer.as_ref()],
        bump
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(mut)]
    pub config: Account<'info, StorageConfig>,
    /// CHECK: Verified via config.treasury
    #[account(mut, address = config.treasury)]
    pub treasury: AccountInfo<'info>,
    #[account(
        mut,
        seeds = [STAKE_ESCROW_SEED, node.owner.as_ref()],
        bump
    )]
    pub stake_escrow: Account<'info, Escrow>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct StorageConfig {
    pub treasury: Pubkey,
    pub sol_per_gb: u64,
    pub treasury_fee_percent: u64,
    pub node_fee_percent: u64,
    pub shard_min_mb: u64,
    pub epochs_total: u64,
    pub slash_penalty_percent: u64,
    pub min_shard_count: u8,
    pub max_shard_count: u8,
    pub slots_per_epoch: u64,
    pub min_node_stake: u64,
    pub is_initialized: bool,
}

#[account]
pub struct Upload {
    pub data_hash: String,
    pub size_mb: u64,
    pub shard_count: u8,
    pub node_lamports: u64,
    pub payer: Pubkey,
    pub upload_time: i64,
    pub shards: Vec<ShardInfo>,
}

#[account]
pub struct Node {
    pub owner: Pubkey,
    pub stake_amount: u64,
    pub upload_count: u64,
    pub last_pos_time: i64,
    pub last_claimed_epoch: u64,
}

#[account]
pub struct Escrow {
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ShardInfo {
    pub shard_id: u8,
    pub node_keys: [Pubkey; 3],
    pub verified: bool,
    pub size_mb: u64,
    pub challenger: Pubkey,
}

#[event]
pub struct ConfigInitializedEvent {
    pub treasury: Pubkey,
    pub sol_per_gb: u64,
    pub treasury_fee_percent: u64,
    pub node_fee_percent: u64,
    pub shard_min_mb: u64,
    pub epochs_total: u64,
    pub slash_penalty_percent: u64,
    pub min_shard_count: u8,
    pub max_shard_count: u8,
    pub slots_per_epoch: u64,
    pub min_node_stake: u64,
}

#[event]
pub struct ConfigUpdatedEvent {
    pub sol_per_gb: u64,
    pub treasury_fee_percent: u64,
    pub node_fee_percent: u64,
    pub shard_min_mb: u64,
    pub epochs_total: u64,
    pub slash_penalty_percent: u64,
    pub min_shard_count: u8,
    pub max_shard_count: u8,
    pub slots_per_epoch: u64,
    pub min_node_stake: u64,
}

#[event]
pub struct NodeRegisteredEvent {
    pub node: Pubkey,
    pub stake_amount: u64,
}

#[event]
pub struct NodeDeregisteredEvent {
    pub node: Pubkey,
    pub stake_amount: u64,
}

#[event]
pub struct UploadEvent {
    pub data_hash: String,
    pub size_mb: u64,
    pub shard_count: u8,
    pub payer: Pubkey,
}

#[event]
pub struct PoSEvent {
    pub data_hash: String,
    pub shard_id: u8,
    pub node: Pubkey,
    pub merkle_root: String,
    pub challenger: Pubkey,
}

#[event]
pub struct RewardEvent {
    pub data_hash: String,
    pub shard_id: u8,
    pub node: Pubkey,
    pub amount: u64,
}

#[error_code]
pub enum SoladError {
    #[msg("Insufficient funds")]
    InsufficientFunds,
    #[msg("Invalid data size")]
    InvalidSize,
    #[msg("Invalid shard count")]
    InvalidShardCount,
    #[msg("Invalid shard size")]
    InvalidShardSize,
    #[msg("Invalid data hash")]
    InvalidHash,
    #[msg("Insufficient funds")]
    InvalidShardId,
    #[msg("Insufficient nodes available")]
    InsufficientNodes,
    #[msg("Unauthorized access")]
    Unauthorized,
    #[msg("Already claimed rewards")]
    AlreadyClaimed,
    #[msg("Invalid fee split")]
    InvalidFeeSplit,
    #[msg("Invalid shard range")]
    InvalidShardRange,
    #[msg("Invalid payment rate")]
    InvalidPaymentRate,
    #[msg("Invalid epochs")]
    InvalidEpochs,
    #[msg("Invalid penalty")]
    InvalidPenalty,
    #[msg("Invalid Merkle proof")]
    InvalidMerkleProof,
    #[msg("Program not initialized")]
    NotInitialized,
    #[msg("Insufficient reward amount")]
    InsufficientReward,
    #[msg("Invalid challenger signature")]
    InvalidChallengerSignature,
    #[msg("Challenger cannot be the node")]
    ChallengerIsNode,
    #[msg("Challenger must be one of the assigned nodes")]
    InvalidChallenger,
    #[msg("Invalid slots per epoch")]
    InvalidSlotsPerEpoch,
    #[msg("Invalid hex string")]
    InvalidHex,
    #[msg("Invalid stake amount")]
    InvalidStake,
    #[msg("Insufficient stake")]
    InsufficientStake,
    #[msg("Invalid node account")]
    InvalidNodeAccount,
    #[msg("Node has active uploads")]
    NodeHasActiveUploads,
    #[msg("Math overflow")]
    MathOverflow,
}

/// Generates a deterministic shard ID based on data hash and index.
fn hash_to_shard(data_hash: &str, index: u8) -> u8 {
    let hash_bytes = data_hash.as_bytes();
    let sum: u64 = hash_bytes.iter().map(|&b| b as u64).sum();
    ((sum + index as u64) % 10) as u8
}

/// Decodes a hex string into bytes, tailored for Solana's constraints.
fn decode_hex(s: &str) -> std::result::Result<Vec<u8>, SoladError> {
    if s.len() % 2 != 0 {
        return Err(SoladError::InvalidHex);
    }
    let mut bytes = Vec::with_capacity(s.len() / 2);
    for i in (0..s.len()).step_by(2) {
        let byte_str = &s[i..i + 2];
        let byte = u8::from_str_radix(byte_str, 16).map_err(|_| SoladError::InvalidHex)?;
        bytes.push(byte);
    }
    Ok(bytes)
}

/// Verifies a Merkle proof against a given root and leaf.
fn verify_merkle_proof(root: &str, proof: &[[u8; 32]], leaf: &[u8; 32]) -> bool {
    let mut computed_hash = *leaf;
    let root_bytes = match decode_hex(root) {
        Ok(bytes) => bytes,
        Err(_) => return false,
    };

    for sibling in proof.iter() {
        let mut hasher = Sha256::new();
        if computed_hash <= *sibling {
            hasher.update(computed_hash);
            hasher.update(sibling);
        } else {
            hasher.update(sibling);
            hasher.update(computed_hash);
        }
        computed_hash = hasher.finalize().into();
    }

    computed_hash.as_slice() == root_bytes.as_slice()
}

/// Verifies a challenger's signature over the PoS message.
fn verify_signature(message: &str, signature: &[u8; 64], pubkey: &Pubkey) -> bool {
    let message_bytes = message.as_bytes();
    let pubkey_bytes = pubkey.to_bytes();
    let result = secp256k1_recover(&Sha256::digest(message_bytes)[..], 0, signature);
    match result {
        Ok(recovered_pubkey) => recovered_pubkey.to_bytes()[..32] == pubkey_bytes[..32],
        Err(_) => false,
    }
}

// CLI-compatible instructions for demo (10MB upload, 5 shards, 2MB each, 0.06 SOL payment):
// Initialize program:
/*
solad initialize \
    --treasury <TREASURY_PUBKEY> \
    --sol-per-gb 30000000 \
    --treasury-fee-percent 25 \
    --node-fee-percent 75 \
    --shard-min-mb 100 \
    --epochs-total 2920 \
    --slash-penalty-percent 10 \
    --min-shard-count 1 \
    --max-shard-count 10 \
    --slots-per-epoch 432000 \
    --min-node-stake 100000000
*/

// Register node:
/*
solad register-node \
    --stake-amount 100000000 \
    --owner <NODE_OWNER_KEYPAIR>
*/

// Deregister node:
/*
solad deregister-node \
    --owner <NODE_OWNER_KEYPAIR>
*/

// Upload data:
/*
solad upload \
    --data 10 \
    --hash "5xKj..." \
    --shards 5 \
    --payer <PAYER_KEYPAIR> \
    --nodes <NODE1_PUBKEY>,<NODE2_PUBKEY>,<NODE3_PUBKEY>,...
*/

// Submit PoS:
/*
solad submit-pos \
    --data-hash "5xKj..." \
    --shard-id 0 \
    --merkle-root "abc123..." \
    --merkle-proof "[...]" \
    --leaf "[...]" \
    --challenger-sig "[...]" \
    --challenger-pubkey <CHALLENGER_PUBKEY> \
    --node <NODE_KEYPAIR>
*/

// Claim rewards:
/*
solad claim-rewards \
    --data-hash "5xKj..." \
    --shard-id 0 \
    --node <NODE_KEYPAIR>
*/