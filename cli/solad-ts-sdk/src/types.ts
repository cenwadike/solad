import { PublicKey, TransactionInstruction } from "@solana/web3.js";

export interface StorageConfig {
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
  maxSubmissions: number;
}

export interface UploadRequest {
  dataHash: string;
  sizeBytes: number;
  shardCount: number;
  duration: number;
  nodes: PublicKey[];
}

export interface OffChainMetadata {
  uploadUrl: string;
  payload: Omit<UploadRequest, "duration" | "nodes">;
}

export interface PreparedUpload {
  instruction: TransactionInstruction;
  offChainMetadata: OffChainMetadata;
}

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

export interface PoSSubmissionRequest {
  submission: PoSSubmission;
  uploader: PublicKey;
  nodes: PublicKey[];
}

export interface RequestReplacement {
  dataHash: string;
  shardId: number;
  owner: PublicKey;
  replacementNode?: PublicKey;
}

export interface DataUploadRequest {
  key: string;
  data: Buffer;
  format: string;
  duration: number; // in days
  nodes: PublicKey[];
  endpoint: string;
}
export interface DataUploadPayload {
  key: string;
  data: string;
  hash: string;
  format: string;
  upload_pda: PublicKey;
}
