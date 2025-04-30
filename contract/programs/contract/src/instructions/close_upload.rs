use anchor_lang::prelude::*;

use crate::{
    errors::SoladError,
    states::{Escrow, Node, Replacement, Upload, REPLACEMENT_SEED},
};

pub fn process_close_upload<'info>(
    ctx: Context<'_, '_, 'info, 'info, CloseUpload<'info>>,
    data_hash: String,
    shard_id: u8,
) -> Result<()> {
    let upload = &ctx.accounts.upload;
    let payer = &ctx.accounts.payer;

    // Verify payer owns the upload
    require!(upload.payer == payer.key(), SoladError::Unauthorized);

    // Find the specified shard
    let shard = upload
        .shards
        .iter()
        .find(|s| s.shard_id == shard_id)
        .ok_or(SoladError::InvalidShardId)?;

    // Check for pending replacements in remaining_accounts (up to 3)
    for replacement_info in ctx.remaining_accounts.iter().take(3) {
        let replacement: Account<Replacement> = Account::try_from(replacement_info)?;
        let (replacement_pda, _) = Pubkey::find_program_address(
            &[
                REPLACEMENT_SEED,
                replacement.exiting_node.as_ref(),
                data_hash.as_bytes(),
                &[shard_id],
            ],
            ctx.program_id,
        );
        if replacement.key() == replacement_pda
            && shard.node_keys.contains(&replacement.exiting_node)
        {
            return Err(SoladError::PendingReplacement.into());
        }
    }

    // Collect unique node keys and their corresponding AccountInfo with upload_count > 0
    let mut unique_nodes: Vec<(Pubkey, &AccountInfo)> = Vec::new();
    for (i, &node_key) in shard
        .node_keys
        .iter()
        .filter(|&&k| k != Pubkey::default())
        .enumerate()
    {
        if !unique_nodes.iter().any(|(key, _)| key == &node_key) {
            // Get node account from remaining_accounts (indices 3-5 for nodes)
            let node_index = i + 3; // Nodes start after replacements
            if node_index >= ctx.remaining_accounts.len() {
                return Err(SoladError::InvalidNodeAccount.into());
            }
            let node_info = &ctx.remaining_accounts[node_index];
            if node_info.key() != node_key {
                return Err(SoladError::InvalidNodeAccount.into());
            }
            // Deserialize to check upload_count
            let node_account: Account<Node> = Account::try_from(node_info)?;
            if node_account.upload_count > 0 {
                unique_nodes.push((node_key, node_info));
            }
        }
    }

    // Decrement upload_count for nodes with upload_count > 0
    for (_, node_info) in unique_nodes.iter() {
        let mut node_account: Account<Node> = Account::try_from(*node_info)?; // Deserialize here

        require!(node_account.upload_count > 0, SoladError::InvalidState);

        node_account.upload_count = node_account
            .upload_count
            .checked_sub(1)
            .ok_or(SoladError::MathOverflow)?;
    }

    // Close escrow and refund lamports if this is the last shard
    if upload.shards.iter().all(|s| {
        s.verified_count
            >= s.node_keys
                .iter()
                .filter(|&&k| k != Pubkey::default())
                .count() as u8
    }) {
        let escrow = &mut ctx.accounts.escrow;
        let lamports = escrow.to_account_info().lamports();
        **escrow.to_account_info().lamports.borrow_mut() = 0;
        **payer.to_account_info().lamports.borrow_mut() += lamports;
    }

    // Upload account closed by Anchor if all shards are processed
    Ok(())
}

#[derive(Accounts)]
#[instruction(data_hash: String, shard_id: u8)]
pub struct CloseUpload<'info> {
    #[account(
        mut,
        close = payer,
        seeds = [b"upload", data_hash.as_bytes(), payer.key().as_ref()],
        bump
    )]
    pub upload: Account<'info, Upload>,
    #[account(
        mut,
        close = payer,
        seeds = [b"escrow", data_hash.as_bytes(), payer.key().as_ref()],
        bump
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
    /// CHECK: Program itself for CPI
    pub program: AccountInfo<'info>,
}
