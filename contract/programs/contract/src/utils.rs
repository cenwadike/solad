pub use anchor_lang::prelude::*;
use anchor_lang::solana_program::secp256k1_recover::secp256k1_recover;
use sha2::{Digest as _, Sha256};

use crate::errors::SoladError;

// Utility functions for shard ID generation and cryptographic verification.

// Verifies a Merkle proof for a given leaf and root.
// This function ensures data integrity by confirming the leaf is part of the Merkle tree.
pub fn verify_merkle_proof(root: &[u8; 32], proof: &[[u8; 32]], leaf: &[u8; 32]) -> Result<()> {
    let mut computed_hash = *leaf;
    for sibling in proof.iter() {
        let mut hasher = Sha256::new();
        if computed_hash <= *sibling {
            hasher.update(computed_hash);
            hasher.update(sibling);
        } else {
            hasher.update(sibling);
            hasher.update(computed_hash);
        }
        computed_hash = hasher.finalize().into();
    }
    require!(
        computed_hash.as_slice() == root.as_slice(),
        SoladError::InvalidMerkleProof
    );
    Ok(())
}

// Verifies an ECDSA signature using the secp256k1 curve.
// Used to authenticate challengers in the Proof of Storage process.
pub fn verify_signature(
    message: &str,
    signature: &[u8; 64],
    pubkey: &Pubkey,
    timestamp: i64,
) -> Result<()> {
    let full_message = format!("{}:{}", message, timestamp);
    let message_bytes = Sha256::digest(full_message.as_bytes());
    let recovered = secp256k1_recover(&message_bytes[..], 0, signature)
        .map_err(|_| SoladError::InvalidChallengerSignature)?;
    let recovered_bytes = recovered.to_bytes();
    let _provided_bytes = pubkey.to_bytes();
    require!(
        matches!(recovered_bytes, _provided_bytes),
        SoladError::InvalidChallengerSignature
    );
    Ok(())
}
