use anchor_lang::prelude::*;

use crate::{
    errors::SoladError,
    events::NodeDeregisteredEvent,
    states::{Escrow, Node, NodeRegistry, StorageConfig, NODE_SEED, STAKE_ESCROW_SEED},
};

// Deregisters a storage node from the Solad network, closing its accounts and returning the staked lamports.
// This function ensures the program is initialized, the caller is the node owner, and the node has no active
// uploads to prevent data loss. It removes the node from the node registry, transfers the stake from the escrow
// account back to the owner, and closes the node and escrow accounts. Upon success, it emits a
// `NodeDeregisteredEvent` for transparency.
// # Arguments
// * `ctx` - Context containing node, stake escrow, node registry, owner, config, and system program accounts.
// # Errors
// Returns `SoladError` variants if the program is not initialized, the caller is not the node owner,
// or the node has active uploads.
pub fn process_deregister_node(ctx: Context<DeregisterNode>) -> Result<()> {
    let config = &ctx.accounts.config;
    require!(config.is_initialized, SoladError::NotInitialized);

    let node = &ctx.accounts.node;
    require!(
        node.owner == ctx.accounts.owner.key(),
        SoladError::Unauthorized
    );
    require!(node.upload_count == 0, SoladError::NodeHasActiveUploads);

    let node_registry = &mut ctx.accounts.node_registry;
    node_registry.nodes.retain(|key| *key != node.key());

    let stake_amount = node.stake_amount;

    emit!(NodeDeregisteredEvent {
        node: ctx.accounts.node.key(),
        stake_amount,
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
    #[account(mut, seeds = [b"node_registry"], bump)]
    pub node_registry: Account<'info, NodeRegistry>,
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(mut)]
    pub config: Account<'info, StorageConfig>,
    pub system_program: Program<'info, System>,
}
