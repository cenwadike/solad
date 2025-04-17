pub use anchor_lang::prelude::*;
#[error_code]
pub enum SoladError {
    #[msg("Invalid PoS submission")]
    InvalidSubmission,
    #[msg("Invalid size report")]
    InvalidSizeReport,
    #[msg("Size report timeout expired")]
    SizeReportTimeout,
    #[msg("Shard not marked as invalid")]
    ShardNotInvalid,
    #[msg("Insufficient oversized reports")]
    InsufficientReports,
    #[msg("Missing PoS data")]
    MissingPoSData,
    #[msg("Invalid user slash penalty")]
    InvalidUserPenalty,
    #[msg("Insufficient fee provided")]
    InsufficientFee,
    #[msg("Transfer failed")]
    TransferFailed,
    #[msg("Escrow account underfunded")]
    EscrowUnderfunded,
    #[msg("Upload limit exceeded for payer")]
    UploadLimitExceeded,
    #[msg("Invalid minimum fee")]
    InvalidMinFee,
    #[msg("Invalid data size")]
    InvalidSize,
    #[msg("Invalid shard count")]
    InvalidShardCount,
    #[msg("Invalid shard size")]
    InvalidShardSize,
    #[msg("Invalid data hash")]
    InvalidHash,
    #[msg("Insufficient funds")]
    InsufficientFunds,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Invalid shard ID")]
    InvalidShardId,
    #[msg("Insufficient nodes available")]
    InsufficientNodes,
    #[msg("Unauthorized access")]
    Unauthorized,
    #[msg("Already claimed rewards")]
    AlreadyClaimed,
    #[msg("Invalid fee split")]
    InvalidFeeSplit,
    #[msg("Invalid shard range")]
    InvalidShardRange,
    #[msg("Invalid payment rate")]
    InvalidPaymentRate,
    #[msg("Invalid epochs")]
    InvalidEpochs,
    #[msg("Invalid penalty")]
    InvalidPenalty,
    #[msg("Invalid Merkle proof")]
    InvalidMerkleProof,
    #[msg("Program not initialized")]
    NotInitialized,
    #[msg("Insufficient reward amount")]
    InsufficientReward,
    #[msg("Invalid challenger signature")]
    InvalidChallengerSignature,
    #[msg("Challenger cannot be the node")]
    ChallengerIsNode,
    #[msg("Challenger must be one of the assigned nodes")]
    InvalidChallenger,
    #[msg("Invalid slots per epoch")]
    InvalidSlotsPerEpoch,
    #[msg("Invalid hex string")]
    InvalidHex,
    #[msg("Invalid stake amount")]
    InvalidStake,
    #[msg("Insufficient stake")]
    InsufficientStake,
    #[msg("Invalid node account")]
    InvalidNodeAccount,
    #[msg("Node has active uploads")]
    NodeHasActiveUploads,
    #[msg("No replacement node available")]
    NoReplacementAvailable,
    #[msg("Single-node shard cannot submit PoS")]
    SingleNodeShard,
    #[msg("Invalid timeout")]
    InvalidTimeout,
    #[msg("Invalid replacement account")]
    InvalidReplacement,
    #[msg("PoS already submitted")]
    PoSAlreadySubmitted,
    #[msg("Timeout not expired")]
    TimeoutNotExpired,
    #[msg("Invalid replacement account data")]
    InvalidReplacementAccount,
}
