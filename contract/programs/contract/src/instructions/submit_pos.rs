use anchor_lang::prelude::*;
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

/// Submits a single Proof of Storage (PoS) submission for a specific shard.
/// # Arguments
/// * `ctx` - Context containing upload, node, replacement, and owner accounts.
/// * `submission` - PoS submission data for a single shard.
/// # Errors
/// Returns errors for invalid proofs, signatures, unauthorized challengers, or invalid submissions.
pub fn process_submit_pos<'info>(
    ctx: Context<'_, '_, 'info, 'info, SubmitPoS<'info>>,
    submission: PoSSubmission,
    uploader: Pubkey,
) -> Result<()> {
    let config = &ctx.accounts.config;
    require!(config.is_initialized, SoladError::NotInitialized);
    require_eq!(
        ctx.accounts.owner.key(),
        ctx.accounts.node.owner,
        SoladError::InvalidNodeAccount
    );
    require_eq!(
        ctx.accounts.treasury.key(),
        ctx.accounts.config.treasury,
        SoladError::InvalidTreasury
    );
    require_eq!(
        ctx.accounts.upload.payer.key(), uploader.key(), SoladError::InvalidUploader
    );

    let upload = &mut ctx.accounts.upload.clone();
    require!(
        upload.data_hash == submission.data_hash,
        SoladError::InvalidHash
    );
    require!(
        submission.shard_id < upload.shard_count,
        SoladError::InvalidShardId
    );

    let shard = upload
        .shards
        .get_mut(submission.shard_id as usize)
        .ok_or(SoladError::InvalidShardId)?;
    require!(
        shard.node_keys.contains(&ctx.accounts.node.key()),
        SoladError::Unauthorized
    );

    let node_count = shard
        .node_keys
        .iter()
        .filter(|&&k| k != Pubkey::default())
        .count();
    require!(node_count > 1, SoladError::SingleNodeShard);

    // Handle oversized data report
    let upload = &ctx.accounts.upload;
    if let Some(actual_size) = submission.actual_size_mb {
        require!(actual_size > shard.size_mb, SoladError::InvalidSizeReport);
        require!(
            upload.upload_time + ((config.reporting_window * config.slots_per_epoch) as i64)
                > Clock::get()?.unix_timestamp,
            SoladError::SizeReportTimeout
        );
        require!(
            !shard
                .oversized_reports
                .iter()
                .any(|r| r.node == ctx.accounts.node.key()),
            SoladError::TooManyReports
        );

        let report = OversizedReport {
            node: ctx.accounts.node.key(),
            actual_size_mb: actual_size,
        };
        shard.oversized_reports.push(report);

        emit!(OversizedDataReportedEvent {
            data_hash: submission.data_hash,
            shard_id: submission.shard_id,
            node: ctx.accounts.node.key(),
            declared_size_mb: shard.size_mb,
            actual_size_mb: actual_size,
            timestamp: Clock::get()?.unix_timestamp,
        });

        let required_reports =
            ((node_count as f64 * config.oversized_report_threshold) / 100.0) as u64;
        if shard.oversized_reports.len() as u64 >= required_reports {
            shard.verified_count = u8::MAX; // Mark shard as invalid
        }

        return Ok(());
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

    verify_merkle_proof(&merkle_root, &merkle_proof, &leaf)?;

    let timestamp = Clock::get()?.unix_timestamp;
    let message = format!(
        "{}:{}:{:?}:{}",
        submission.data_hash, submission.shard_id, merkle_root, timestamp
    );
    verify_signature(
        &message,
        &challenger_signature,
        &challenger_pubkey,
        timestamp,
    )?;

    shard.verified_count = shard
        .verified_count
        .checked_add(1)
        .ok_or(SoladError::MathOverflow)?;
    shard.challenger = challenger_pubkey;

    // Handle node replacement
    let replacement = &mut ctx.accounts.replacement;
    if replacement.data_hash == submission.data_hash
        && replacement.shard_id == submission.shard_id
        && replacement.replacement_node == ctx.accounts.node.key()
        && !replacement.pos_submitted
        && replacement.request_epoch + config.replacement_timeout_epochs > Clock::get()?.epoch
    {
        replacement.pos_submitted = true;

        let exiting_node_account = ctx
            .remaining_accounts
            .iter()
            .find(|acc| acc.key() == replacement.exiting_node)
            .ok_or(SoladError::InvalidNodeAccount)?;
        msg!("Found exiting_node_account: {}", exiting_node_account.key());

        let (stake_escrow_key, _bump) = Pubkey::find_program_address(
            &[STAKE_ESCROW_SEED, replacement.exiting_node.as_ref()],
            ctx.program_id,
        );
        let exiting_stake_escrow = ctx
            .remaining_accounts
            .iter()
            .find(|acc| acc.key() == stake_escrow_key)
            .ok_or(SoladError::InvalidNodeAccount)?;
        msg!("Found exiting_stake_escrow: {}", exiting_stake_escrow.key());

        let exiting_node_data = exiting_node_account.data.borrow();
        let exiting_node: Node = Node::try_deserialize(&mut exiting_node_data.as_ref())
            .map_err(|_| SoladError::InvalidNodeAccount)?;

        let stake_escrow_seeds = &[
            STAKE_ESCROW_SEED,
            exiting_node.owner.as_ref(),
            &[exiting_stake_escrow.data.borrow()[8]],
        ];
        system_program::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: exiting_stake_escrow.to_account_info(),
                    to: ctx.accounts.owner.to_account_info(),
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
            timestamp,
        });
    }

    // Update node accounts if shard is fully verified
    if shard.verified_count as usize >= node_count {
        for key in shard.node_keys.iter().filter(|&&k| k != Pubkey::default()) {
            msg!("Resolving node account: {}", key);
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
        timestamp,
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction(data_hash: String, shard_id: u8, uploader: Pubkey)]
pub struct SubmitPoS<'info> {
    #[account(
        mut,
        seeds = [UPLOAD_SEED, data_hash.as_bytes(), uploader.key().as_ref()],
        bump
    )]
    pub upload: Box<Account<'info, Upload>>,
    #[account(
        mut,
        seeds = [NODE_SEED, node.key().as_ref()],
        bump
    )]
    pub node: Box<Account<'info, Node>>,
    #[account(
        mut,
        seeds = [REPLACEMENT_SEED, node.key().as_ref(), data_hash.as_bytes(), &[shard_id]],
        bump,
        close = owner
    )]
    pub replacement: Box<Account<'info, Replacement>>,
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(mut)]
    pub config: Box<Account<'info, StorageConfig>>,
    /// CHECK: Safe, as the treasury account is validated against config.treasury
    #[account(mut)]
    pub treasury: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}
