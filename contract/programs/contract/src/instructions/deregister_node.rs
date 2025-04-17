pub use anchor_lang::prelude::*;

use crate::{
    errors::SoladError,
    events::NodeDeregisteredEvent,
    states::{Escrow, Node, StorageConfig, NODE_SEED, STAKE_ESCROW_SEED},
};

// Deregisters a node, closing its accounts and returning the stake.
// This function ensures the node has no active uploads to prevent data loss.
// It requires the program to be initialized and the caller to be the node owner.
/// Deregisters a node.
/// # Arguments
/// * `ctx` - Context containing node, stake escrow, owner, and config accounts.
/// # Errors
/// Returns errors if the node has active uploads or the caller is unauthorized.
pub fn process_deregister_node(ctx: Context<DeregisterNode>) -> Result<()> {
    let config = &ctx.accounts.config;
    require!(config.is_initialized, SoladError::NotInitialized);

    let node = &ctx.accounts.node;
    require!(
        node.owner == ctx.accounts.owner.key(),
        SoladError::Unauthorized
    );
    require!(node.upload_count == 0, SoladError::NodeHasActiveUploads);

    emit!(NodeDeregisteredEvent {
        node: ctx.accounts.owner.key(),
        stake_amount: node.stake_amount,
    });

    Ok(())
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
