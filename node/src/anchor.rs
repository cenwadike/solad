use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub struct MyEvent {
    pub data: u64,
    pub timestamp: i64,
}