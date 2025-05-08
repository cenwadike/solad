import { PublicKey, TransactionInstruction } from "@solana/web3.js";

export interface StorageConfigParams {
  treasury: PublicKey;
  solPerGb: number;
  treasuryFeePercent: number;
  nodeFeePercent: number;
  shardMinMb: number;
  epochsTotal: number;
  slashPenaltyPercent: number;
  minShardCount: number;
  maxShardCount: number;
  slotsPerEpoch: number;
  minNodeStake: number;
  replacementTimeoutEpochs: number;
  minLamportsPerUpload: number;
  maxUserUploads: number;
  userSlashPenaltyPercent: number;
  reportingWindow: number;
  oversizedReportThreshold: number;
  maxSubmssions: number;
}

// create upload instruction arg interface
export interface UploadParams {
  dataHash: string;
  sizeBytes: number;
  shardCount: number;
  duration: number;
  nodes: PublicKey[];
}

export interface UploadReqParams extends UploadParams {
  uploadUrl: string;
}

export interface OffChainMetadata {
  uploadUrl: string;
  payload: {
    dataHash: string;
    sizeBytes: number;
    shardCount: number;
  };
}

export interface PrepareUploadReturn {
  instruction: TransactionInstruction;
  offChainMetadata: OffChainMetadata;
}

// Proof Of Storage submission
export interface PoSSubmission {
  dataHash: string;
  shardId: number;
  merkleRoot: any[];
  merkleProof: any[];
  leaf: any[];
  challengerSignature: any[];
  challengerPubkey: PublicKey;
  actualSizeMb?: number;
}

export interface PoSSubmissionParams {
  submission: PoSSubmission;
  uploader: PublicKey;
  nodes: PublicKey[];
}

export interface RequestReplacementParams {
  dataHash: string;
  shardId: number;
  owner: PublicKey;
  replacementNode?: PublicKey;
}
