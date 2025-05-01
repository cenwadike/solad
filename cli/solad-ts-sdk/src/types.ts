import { PublicKey } from "@solana/web3.js";

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
