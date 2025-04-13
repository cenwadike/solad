use anchor_lang::prelude::*;

declare_id!("4Fbo2dQdqrVhxLBbZrxVEbDBxp8GmNa9voEN96d4fQJp");

#[program]
pub mod contract {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
