use crate::{
    errors::SoladError,
    events::ReplacementRequestedEvent,
    states::{
        Node, Replacement, ShardReplacement, StorageConfig, Upload, REPLACEMENT_SEED, UPLOAD_SEED,
    },
};
use anchor_lang::prelude::*;

/// Processes batch requests to replace an exiting node with a replacement node for specified shards.
/// This function validates the replacement node's stake, verifies the exiting node's involvement in the shards,
/// checks for existing replacement accounts, and decrements the exiting node's upload count via CPI.
/// It emits events for each successful replacement request.
/// # Arguments
/// * `ctx` - Context containing exiting node, replacement node, config, and remaining accounts for uploads and replacements.
/// * `shard_replacements` - Vector of `ShardReplacement` specifying data hash and shard ID for each replacement.
/// # Errors
/// Returns errors for insufficient stake, invalid accounts, missing shards, or unauthorized nodes.
pub fn process_batch_request_replacement<'info>(
    ctx: Context<'_, '_, 'info, 'info, BatchRequestReplacement<'info>>,
    shard_replacements: Vec<ShardReplacement>,
) -> Result<()> {
    // Extract accounts from context
    let exiting_node = &mut ctx.accounts.exiting_node;
    let replacement_node = &ctx.accounts.replacement_node;
    let config = &ctx.accounts.config;

    // Validate that the replacement node has sufficient stake
    require!(
        replacement_node.stake_amount >= config.min_node_stake,
        SoladError::InsufficientStake
    );

    // Ensure there are enough remaining accounts for uploads (at least one per shard)
    require!(
        ctx.remaining_accounts.len() >= shard_replacements.len(),
        SoladError::InsufficientAccounts
    );

    // Initialize vector to track replacements that need processing
    let mut replacements_to_process = Vec::new();

    // Iterate over each shard replacement request
    for (i, shard_replacement) in shard_replacements.iter().enumerate() {
        // Retrieve the upload account from remaining accounts (4 accounts per shard: 1 upload + up to 3 replacements)
        let upload_account = &ctx.remaining_accounts[i * 4];
        let upload: Account<Upload> = Account::try_from(upload_account)?;

        // Derive and validate the upload PDA
        let (upload_pda, _) = Pubkey::find_program_address(
            &[
                UPLOAD_SEED,
                shard_replacement.data_hash.as_bytes(),
                upload.payer.as_ref(),
            ],
            ctx.program_id,
        );
        require!(upload.key() == upload_pda, SoladError::InvalidUpload);

        // Find the specified shard in the upload
        let shard = upload
            .shards
            .iter()
            .find(|s| s.shard_id == shard_replacement.shard_id)
            .ok_or(SoladError::InvalidShardId)?;

        // Verify that the exiting node is part of the shard's node keys
        require!(
            shard.node_keys.contains(&exiting_node.key()),
            SoladError::NodeNotInShard
        );

        // Check for existing replacement accounts (up to 3 per shard)
        let mut has_replacement = false;
        for j in 1..=3 {
            let replacement_index = i * 4 + j;
            if replacement_index >= ctx.remaining_accounts.len() {
                break;
            }
            let replacement_info = &ctx.remaining_accounts[replacement_index];
            let replacement: Account<Replacement> = Account::try_from(replacement_info)?;

            // Derive and validate the replacement PDA
            let (replacement_pda, _) = Pubkey::find_program_address(
                &[
                    REPLACEMENT_SEED,
                    exiting_node.key().as_ref(),
                    shard_replacement.data_hash.as_bytes(),
                    &[shard_replacement.shard_id],
                ],
                ctx.program_id,
            );

            // Check if the replacement account matches the expected PDA and nodes
            if replacement.key() == replacement_pda
                && replacement.exiting_node == exiting_node.key()
                && replacement.replacement_node == replacement_node.key()
            {
                has_replacement = true;
                break;
            }
        }

        // If a valid replacement exists, queue it for processing
        if has_replacement {
            replacements_to_process.push((
                shard_replacement.data_hash.clone(),
                shard_replacement.shard_id,
                upload.node_lamports,
            ));
        }
    }

    // If there are replacements to process, decrement the exiting node's upload count
    if !replacements_to_process.is_empty() {
        require!(exiting_node.upload_count > 0, SoladError::InvalidState);

        exiting_node.upload_count = exiting_node
            .upload_count
            .checked_sub(1)
            .ok_or(SoladError::MathOverflow)?;

        // Emit an event for each replacement request
        for (data_hash, shard_id, storage_fee) in replacements_to_process {
            emit!(ReplacementRequestedEvent {
                data_hash,
                shard_id,
                exiting_node: exiting_node.key(),
                replacement_node: replacement_node.key(),
                storage_fee,
            });
        }
    }

    // Return success if all validations and operations complete
    Ok(())
}

/// Account structure for the `BatchRequestReplacement` instruction.
/// Defines the accounts required to process batch replacement requests.
#[derive(Accounts)]
pub struct BatchRequestReplacement<'info> {
    /// The exiting node account (mutable, as its upload count may be decremented).
    #[account(mut)]
    pub exiting_node: Account<'info, Node>,
    /// The replacement node account (mutable, for potential updates).
    #[account(mut)]
    pub replacement_node: Account<'info, Node>,
    /// The storage configuration account (mutable, for potential updates).
    #[account(mut)]
    pub config: Account<'info, StorageConfig>,
    /// The payer of the transaction (signer).
    #[account(mut)]
    pub payer: Signer<'info>,
    /// The Solana system program.
    pub system_program: Program<'info, System>,
    /// CHECK: The program itself, used for CPI calls.
    pub program: AccountInfo<'info>,
}
