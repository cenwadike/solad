pub use anchor_lang::prelude::*;
use anchor_lang::system_program;

use crate::{
    errors::SoladError,
    events::{OversizedDataReportedEvent, PoSEvent, ReplacementVerifiedEvent},
    states::{
        Node, OversizedReport, PoSSubmission, Replacement, StorageConfig, Upload, NODE_SEED,
        REPLACEMENT_SEED, STAKE_ESCROW_SEED, UPLOAD_SEED,
    },
    utils::{verify_merkle_proof, verify_signature},
};

// Submits a batch of Proof of Storage (PoS) submissions for multiple shards.
// This function allows nodes to submit multiple Merkle proofs or oversized data reports in a single
// transaction, reducing transaction costs on Solana. Each submission is validated independently,
// but all are processed atomically. The function handles PoS verification, challenger authentication,
// replacement node verification, and oversized data reporting, maintaining the original logic for
// individual submissions. It emits events for transparency and finalizes uploads when fully verified.
/// Submits batch Proof of Storage.
/// # Arguments
/// * `ctx` - Context containing upload, node, replacement, and owner accounts.
/// * `submissions` - Vector of PoS submission data for multiple shards.
/// # Errors
/// Returns errors for invalid proofs, signatures, unauthorized challengers, or invalid submissions.
/// If any submission fails, the entire transaction is reverted to ensure consistency.
pub fn process_submit_pos<'info>(
    ctx: Context<'_, '_, 'info, 'info, SubmitPoS<'info>>,
    submissions: Vec<PoSSubmission>,
) -> Result<()> {
    let config = &ctx.accounts.config;
    require!(config.is_initialized, SoladError::NotInitialized);
    require!(!submissions.is_empty(), SoladError::InvalidSubmission);

    // Process each PoS submission in the batch
    for submission in submissions {
        // Immutable borrow for validations
        let upload = &ctx.accounts.upload;
        require!(
            upload.data_hash == submission.data_hash,
            SoladError::InvalidHash
        );
        require!(
            submission.shard_id < upload.shard_count,
            SoladError::InvalidShardId
        );

        // Store data needed later to avoid immutable borrows
        let shard_data = &upload.shards[submission.shard_id as usize];
        require!(
            shard_data.node_keys.contains(&ctx.accounts.node.key()),
            SoladError::Unauthorized
        );

        let node_count = shard_data
            .node_keys
            .iter()
            .filter(|&&k| k != Pubkey::default())
            .count();
        if node_count == 1 {
            return Err(SoladError::SingleNodeShard.into());
        }

        // Store data for oversized report event
        let declared_size_mb = shard_data.size_mb;
        let upload_time = upload.upload_time;

        // Now start mutable borrow
        let upload = &mut ctx.accounts.upload;
        let shard = &mut upload.shards[submission.shard_id as usize];

        // Handle oversized data report
        if let Some(actual_size) = submission.actual_size_mb {
            require!(actual_size > shard.size_mb, SoladError::InvalidSizeReport);
            require!(
                upload_time + (5 * config.slots_per_epoch as i64) > Clock::get()?.unix_timestamp,
                SoladError::SizeReportTimeout
            );

            let report = OversizedReport {
                node: ctx.accounts.node.key(),
                actual_size_mb: actual_size,
            };
            shard.oversized_reports.push(report);

            emit!(OversizedDataReportedEvent {
                data_hash: submission.data_hash.clone(),
                shard_id: submission.shard_id,
                node: ctx.accounts.node.key(),
                declared_size_mb,
                actual_size_mb: actual_size,
            });

            // Check if enough nodes reported oversized data (2/3 of non-default nodes)
            let required_reports = (node_count as u64 * 2) / 3;
            if shard.oversized_reports.len() as u64 >= required_reports {
                shard.verified_count = u8::MAX; // Mark shard as invalid to prevent further PoS
            }

            continue; // Move to the next submission
        }

        // Standard PoS submission
        let merkle_root = submission.merkle_root.ok_or(SoladError::MissingPoSData)?;
        let merkle_proof = submission.merkle_proof.ok_or(SoladError::MissingPoSData)?;
        let leaf = submission.leaf.ok_or(SoladError::MissingPoSData)?;
        let challenger_signature = submission
            .challenger_signature
            .ok_or(SoladError::MissingPoSData)?;
        let challenger_pubkey = submission
            .challenger_pubkey
            .ok_or(SoladError::MissingPoSData)?;

        require!(
            shard.node_keys.contains(&challenger_pubkey),
            SoladError::InvalidChallenger
        );
        require!(
            ctx.accounts.node.key() != challenger_pubkey,
            SoladError::ChallengerIsNode
        );

        require!(
            verify_merkle_proof(&merkle_root, &merkle_proof, &leaf),
            SoladError::InvalidMerkleProof
        );

        let message = format!(
            "{}:{}:{}",
            submission.data_hash, submission.shard_id, merkle_root
        );
        require!(
            verify_signature(&message, &challenger_signature, &challenger_pubkey),
            SoladError::InvalidChallengerSignature
        );

        shard.verified_count = shard
            .verified_count
            .checked_add(1)
            .ok_or(SoladError::MathOverflow)?;
        shard.challenger = challenger_pubkey;

        let replacement = &mut ctx.accounts.replacement;
        if replacement.data_hash == submission.data_hash
            && replacement.shard_id == submission.shard_id
            && replacement.replacement_node == ctx.accounts.node.key()
            && !replacement.pos_submitted
        {
            replacement.pos_submitted = true;

            let exiting_node_account = ctx
                .remaining_accounts
                .iter()
                .find(|acc| acc.key() == replacement.exiting_node)
                .ok_or(SoladError::InvalidNodeAccount)?;

            let (stake_escrow_key, _bump) = Pubkey::find_program_address(
                &[STAKE_ESCROW_SEED, replacement.exiting_node.as_ref()],
                ctx.program_id,
            );
            let exiting_stake_escrow = ctx
                .remaining_accounts
                .iter()
                .find(|acc| acc.key() == stake_escrow_key)
                .ok_or(SoladError::InvalidNodeAccount)?;

            let exiting_node_data = exiting_node_account.data.borrow();
            let exiting_node: &Node = &Node::try_deserialize(&mut exiting_node_data.as_ref())
                .map_err(|_| SoladError::InvalidNodeAccount)?;

            let stake_escrow_seeds = &[
                STAKE_ESCROW_SEED,
                exiting_node.owner.as_ref(),
                &[exiting_stake_escrow.data.borrow()[8]],
            ];
            system_program::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.system_program.clone().to_account_info(),
                    system_program::Transfer {
                        from: exiting_stake_escrow.to_account_info().clone(),
                        to: ctx.accounts.owner.clone().to_account_info().clone(),
                    },
                    &[&stake_escrow_seeds[..]],
                ),
                exiting_node.stake_amount,
            )?;

            emit!(ReplacementVerifiedEvent {
                exiting_node: replacement.exiting_node,
                replacement_node: replacement.replacement_node,
                data_hash: submission.data_hash.clone(),
                shard_id: submission.shard_id,
            });
        }

        if shard.verified_count as usize >= node_count {
            for key in shard.node_keys.iter().filter(|&&k| k != Pubkey::default()) {
                let node_account = ctx
                    .remaining_accounts
                    .iter()
                    .find(|acc| acc.key() == *key)
                    .ok_or(SoladError::InvalidNodeAccount)?;
                let mut node_data = node_account.data.borrow_mut();
                let mut node: Node = Node::try_deserialize(&mut node_data.as_ref())
                    .map_err(|_| SoladError::InvalidNodeAccount)?;
                node.upload_count = node
                    .upload_count
                    .checked_sub(1)
                    .ok_or(SoladError::MathOverflow)?;
                let mut serialized = Vec::new();
                node.try_serialize(&mut serialized)?;
                node_data.copy_from_slice(&serialized);
            }
        }

        emit!(PoSEvent {
            data_hash: submission.data_hash,
            shard_id: submission.shard_id,
            node: ctx.accounts.node.key(),
            merkle_root,
            challenger: challenger_pubkey,
        });
    }

    Ok(())
}

#[derive(Accounts)]
#[instruction(data_hash: String, shard_id: u8)]
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
    #[account(
        mut,
        seeds = [REPLACEMENT_SEED, node.key().as_ref(), data_hash.as_bytes(), &[shard_id]],
        bump,
        close = owner
    )]
    pub replacement: Account<'info, Replacement>,
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(mut)]
    pub config: Account<'info, StorageConfig>,
    /// CHECK: Safe, as the treasury account is validated against config.treasury in other instructions
    #[account(mut)]
    pub treasury: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}
