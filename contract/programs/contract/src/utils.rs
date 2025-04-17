pub use anchor_lang::prelude::*;
use anchor_lang::solana_program::secp256k1_recover::secp256k1_recover;
use sha2::{Digest as _, Sha256};

use crate::errors::SoladError;

// Utility functions for shard ID generation and cryptographic verification.

// Generates a shard ID based on the data hash and index.
// This function ensures consistent shard identification for data retrieval.
pub fn hash_to_shard(data_hash: &str, index: u8) -> u8 {
    let hash_bytes = data_hash.as_bytes();
    let sum: u64 = hash_bytes.iter().map(|&b| b as u64).sum();
    ((sum + index as u64) % 10) as u8
}

// Decodes a hexadecimal string into bytes.
// Used for Merkle root validation in proof verification.
pub fn decode_hex(s: &str) -> std::result::Result<Vec<u8>, SoladError> {
    if s.len() % 2 != 0 {
        return Err(SoladError::InvalidHex);
    }
    let mut bytes = Vec::with_capacity(s.len() / 2);
    for i in (0..s.len()).step_by(2) {
        let byte_str = &s[i..i + 2];
        let byte = u8::from_str_radix(byte_str, 16).map_err(|_| SoladError::InvalidHex)?;
        bytes.push(byte);
    }
    Ok(bytes)
}

// Verifies a Merkle proof for a given leaf and root.
// This function ensures data integrity by confirming the leaf is part of the Merkle tree.
pub fn verify_merkle_proof(root: &str, proof: &[[u8; 32]], leaf: &[u8; 32]) -> bool {
    let mut computed_hash = *leaf;
    let root_bytes = match decode_hex(root) {
        Ok(bytes) => bytes,
        Err(_) => return false,
    };

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

    computed_hash.as_slice() == root_bytes.as_slice()
}

// Verifies an ECDSA signature using the secp256k1 curve.
// Used to authenticate challengers in the Proof of Storage process.
pub fn verify_signature(message: &str, signature: &[u8; 64], pubkey: &Pubkey) -> bool {
    let message_bytes = message.as_bytes();
    let pubkey_bytes = pubkey.to_bytes();
    let result = secp256k1_recover(&Sha256::digest(message_bytes)[..], 0, signature);
    match result {
        Ok(recovered_pubkey) => recovered_pubkey.to_bytes()[..32] == pubkey_bytes[..32],
        Err(_) => false,
    }
}
