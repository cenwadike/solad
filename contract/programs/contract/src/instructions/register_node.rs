use anchor_lang::prelude::*;
use anchor_lang::system_program;

use crate::{
    errors::SoladError,
    events::NodeRegisteredEvent,
    states::{Escrow, Node, NodeRegistry, StorageConfig, NODE_SEED, STAKE_ESCROW_SEED},
};

// Registers a new storage node in the Solad network.
// This function allows a node operator to join the network by staking a minimum amount
// of lamports, as defined in the storage configuration. The stake is transferred to an
// escrow account, and the node is added to the node registry. The function initializes
// node metadata, including owner, stake amount, upload count, and activity status. It
// ensures the program is initialized, the stake meets the minimum requirement, and the
// node is not already registered. Upon success, it emits a `NodeRegisteredEvent` for
// transparency.
// # Arguments
// * `ctx` - Context containing node, stake escrow, node registry, owner, config, and system program accounts.
// * `stake_amount` - Amount of lamports to stake (must be ≥ config.min_node_stake).
// # Errors
// Returns `SoladError` variants for cases such as uninitialized program, insufficient stake,
// or if the node is already registered.
pub fn process_register_node(ctx: Context<RegisterNode>, stake_amount: u64) -> Result<()> {
    let config = &ctx.accounts.config;
    require!(config.is_initialized, SoladError::NotInitialized);
    require!(
        stake_amount >= config.min_node_stake,
        SoladError::InvalidStake
    );

    let node = &mut ctx.accounts.node;
    node.owner = ctx.accounts.owner.key();
    node.stake_amount = stake_amount;
    node.upload_count = 0;
    node.last_pos_time = 0;
    node.last_claimed_epoch = 0;
    node.is_active = true; // Set node as active

    let node_registry = &mut ctx.accounts.node_registry;
    require!(
        !node_registry.nodes.contains(&ctx.accounts.node.key()),
        SoladError::NodeAlreadyRegistered
    );
    node_registry.nodes.push(ctx.accounts.node.key());

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
        node: ctx.accounts.node.key(), // Fixed from owner.key()
        stake_amount,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct RegisterNode<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + 32 + 8 + 8 + 8 + 8 + 1,
        seeds = [NODE_SEED, owner.key().as_ref()],
        bump
    )]
    pub node: Account<'info, Node>,
    #[account(
        init,
        payer = owner,
        space = 8 + 8+ 1,
        seeds = [STAKE_ESCROW_SEED, owner.key().as_ref()],
        bump
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
