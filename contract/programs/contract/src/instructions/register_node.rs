pub use anchor_lang::prelude::*;
use anchor_lang::system_program;

use crate::{
    errors::SoladError,
    events::NodeRegisteredEvent,
    states::{Escrow, Node, StorageConfig, NODE_SEED, STAKE_ESCROW_SEED},
};

// Registers a new storage node in the Solad network.
// Nodes must stake a minimum amount of SOL to participate, ensuring commitment
// to storage responsibilities. The function transfers the stake to an escrow
// account and initializes node metadata, such as upload count and claim epochs.
// It enforces configuration initialization and minimum stake requirements.
/// Registers a node.
/// # Arguments
/// * `ctx` - Context containing node, stake escrow, owner, and config accounts.
/// * `stake_amount` - Amount of lamports to stake.
/// # Errors
/// Returns errors if the program is not initialized or the stake is insufficient.
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
