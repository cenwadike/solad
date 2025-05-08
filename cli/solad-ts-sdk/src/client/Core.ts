import * as anchor from "@coral-xyz/anchor";
import { TransactionInstruction, SystemProgram } from "@solana/web3.js";
import {
  StorageConfigParams,
  UploadParams,
  UploadReqParams,
  OffChainMetadata,
  PrepareUploadReturn,
  PoSSubmissionParams,
  RequestReplacementParams,
} from "../types";
import { PDAHelper } from "../utils/pda-helper";
import { StateHelper } from "../utils/state-helper";
import { StorageSDK } from "../client";

// ====================================
// Core - Define instruction builders.
// ====================================
export class Core {
  constructor(private client: StorageSDK) {}

  /**
   * Constructs a transaction instruction to initialize the storage configuration
   * for the Solad program. This method sets up critical parameters for storage
   * pricing, fee distribution, shard constraints, epoch settings, and node
   * requirements. It is typically called once by the program authority to ensure
   * economic and operational integrity.
   *
   * @param {StorageConfigParams} params - Configuration parameters including; storage pricing, fee allocations, shard constraints, epoch settings,
   *                                       and node requirements.
   * @returns {Promise<TransactionInstruction>} A promise that resolves to the transaction instruction.
   */
  async createInitializeIx(
    params: StorageConfigParams
  ): Promise<TransactionInstruction> {
    const pdas = new PDAHelper(this.client.programId);

    return this.client.program.methods
      .initialize(
        new anchor.BN(params.solPerGb),
        new anchor.BN(params.treasuryFeePercent),
        new anchor.BN(params.nodeFeePercent),
        new anchor.BN(params.shardMinMb),
        new anchor.BN(params.epochsTotal),
        new anchor.BN(params.slashPenaltyPercent),
        params.minShardCount,
        params.maxShardCount,
        new anchor.BN(params.slotsPerEpoch),
        new anchor.BN(params.minNodeStake),
        new anchor.BN(params.replacementTimeoutEpochs),
        new anchor.BN(params.minLamportsPerUpload),
        new anchor.BN(params.maxUserUploads),
        new anchor.BN(params.userSlashPenaltyPercent),
        new anchor.BN(params.reportingWindow),
        params.oversizedReportThreshold,
        new anchor.BN(params.maxSubmssions)
      )
      .accounts({
        storageConfig: pdas.storageConfig,
        authority: this.client.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .instruction();
  }

  /**
   * Node mgmt: create node registration instruction
   *
   * This instruction registers a new node in the Solad network, staking the
   * specified amount of lamports and associating it with a storage configuration account.
   *
   * @param {number} stakeAmount - The amount of lamports to stake for the node.
   * @returns {Promise<TransactionInstruction>} A promise that resolves to the transaction instruction.
   */
  async createRegisterNodeIx(
    stakeAmount: number
  ): Promise<TransactionInstruction> {
    const pdas = new PDAHelper(this.client.programId);
    const nodePda = pdas.nodeAccount(this.client.wallet.publicKey);
    const stakeEscrow = pdas.stakeEscrow(this.client.wallet.publicKey);

    return this.client.program.methods
      .registerNode(new anchor.BN(stakeAmount))
      .accounts({
        owner: this.client.wallet.publicKey,
        node: nodePda,
        stakeEscrow: stakeEscrow,
        systemProgram: SystemProgram.programId,
      })
      .instruction();
  }

  /**
   * Data Ops: create upload instruction
   *
   * Creates a transaction instruction to upload the specified data, with the
   * specified size, shard count, and duration.
   *
   * @param {UploadParams} params - The parameters for the upload:
   *  - dataHash: The SHA-256 hash of the data to be uploaded.
   *  - sizeBytes: The size of the data in bytes.
   *  - shardCount: The number of shards to split the data into.
   *  - duration: The duration of the upload in seconds.
   *  - nodes: The public keys of the nodes to which the shards will be uploaded.
   * @returns {Promise<TransactionInstruction>} A promise that resolves to the transaction instruction.
   */
  async createUploadIx(params: UploadParams): Promise<TransactionInstruction> {
    const pdas = new PDAHelper(this.client.programId);
    const storageConfig = await new StateHelper(
      this.client.programId
    ).getStorageConfig(this.client.program);

    return this.client.program.methods
      .uploadData(
        params.dataHash,
        new anchor.BN(params.sizeBytes),
        params.shardCount,
        new anchor.BN(params.duration)
      )
      .accounts({
        userUploadKeys: pdas.uploadKeys(this.client.wallet.publicKey),
        upload: pdas.upload(params.dataHash, this.client.wallet.publicKey),
        escrow: pdas.uploadEscrow(
          params.dataHash,
          this.client.wallet.publicKey
        ),
        nodeRegistry: pdas.nodeRegistry(),
        config: pdas.storageConfig(),
        payer: this.client.wallet.publicKey, // The payer of the transaction (signer)
        treasury: storageConfig.treasury,
        program: this.client.programId, // The program account (self)
        systemProgram: SystemProgram.programId,
      })
      .remainingAccounts(
        params.nodes.map((pubkey) => ({
          pubkey,
          isWritable: true,
          isSigner: false,
        }))
      )
      .instruction();
  }

  /**
   * Data Ops: get data upload requirements
   *
   * This method takes the required parameters for a data upload and returns an object containing the upload URL,
   *  and an object with the data hash, shard count, and size in bytes.
   *
   * @param {UploadReqParams} params - The parameters for the upload:
   *  - dataHash: The SHA-256 hash of the data to be uploaded.
   *  - shardCount: The number of shards to split the data into.
   *  - sizeBytes: The size of the data in bytes.
   *  - uploadUrl: The URL to which the shards will be uploaded.
   * @returns {OffChainMetadata} An object containing the data upload metadata.
   */
  getUploadRequirements(params: UploadReqParams): OffChainMetadata {
    return {
      uploadUrl: params.uploadUrl,
      payload: {
        dataHash: params.dataHash,
        shardCount: params.shardCount,
        sizeBytes: params.sizeBytes,
      },
    };
  }

  /**
   * Data Ops: prepare upload
   *
   * Prepares the upload process by creating the necessary transaction instruction
   * and gathering metadata for off-chain operations. This function operates at the core layer.
   *
   * @param {UploadReqParams} params - The parameters required for preparing the upload:
   *  - dataHash: The SHA-256 hash of the data to be uploaded.
   *  - shardCount: The number of shards to split the data into.
   *  - sizeBytes: The size of the data in bytes.
   *  - uploadUrl: The URL to which the shards will be uploaded.
   * @returns {Promise<PrepareUploadReturn>} A promise that resolves to an object containing:
   *  - instruction: The transaction instruction for the upload.
   *  - offChainMetadata: Metadata required for the off-chain upload process.
   */
  async prepareUpload(params: UploadReqParams): Promise<PrepareUploadReturn> {
    const instruction = await this.createUploadIx(params);
    const uploadInfo = this.getUploadRequirements(params);

    // Return the prepared upload information including the instruction and metadata
    return {
      instruction,
      offChainMetadata: uploadInfo,
    };
  }

  /**
   * Data Ops: create submit pos instruction
   *
   * Creates a transaction instruction to submit a proof of storage (PoS) for a
   * specific data hash and shard id. This method is used by a node to submit a
   * PoS to the Solad network.
   *
   * @param {PoSSubmissionParams} params - The parameters required for creating the submit pos instruction:
   *  - submission: The PoSSubmission object containing the PoS details.
   *  - uploader: The public key of the node submitting the PoS.
   *  - nodes: The public keys of the nodes to which the shards will be uploaded.
   * @returns {Promise<TransactionInstruction>} A promise that resolves to the transaction instruction.
   */
  async createSubmitPosIx(
    params: PoSSubmissionParams
  ): Promise<TransactionInstruction> {
    const storageConfig = await new StateHelper(
      this.client.programId
    ).getStorageConfig(this.client.program);
    const pdas = new PDAHelper(this.client.program.programId);
    const nodePda = pdas.nodeAccount(params.uploader);
    const replacementPda = pdas.replacement(
      params.submission.dataHash,
      nodePda
    );

    return this.client.program.methods
      .submitPos(params.submission, params.uploader)
      .accounts({
        replacement: replacementPda,
        owner: params.uploader,
        config: pdas.storageConfig,
        treasury: storageConfig.treasury,
        systemProgram: SystemProgram.programId,
      })
      .remainingAccounts(
        params.nodes.map((pubkey) => ({
          pubkey,
          isWritable: true,
          isSigner: false,
        }))
      )
      .instruction();
  }

  /**
   * Data Ops: create submit pos instruction
   *
   * Creates a transaction instruction to request a replacement for a node.
   * This is used when a node wishes to exit or be replaced in the storage network.
   *
   * @param {RequestReplacementParams} params - The parameters for requesting a replacement:
   *  - dataHash: The hash of the data associated with the request.
   *  - shardId: The ID of the shard to be replaced.
   *  - owner: The public key of the current owner of the shard.
   *  - replacementNode: (Optional) The public key of the replacement node.
   * @returns {Promise<TransactionInstruction>} A promise that resolves to the transaction instruction.
   */
  async createRequestReplacementIx(
    params: RequestReplacementParams
  ): Promise<TransactionInstruction> {
    const storageConfig = await new StateHelper(
      this.client.programId
    ).getStorageConfig(this.client.program);

    const pdas = new PDAHelper(this.client.program.programId);

    // Determine replacement account PDA if a replacement node is specified
    const replacementAccount = params.replacementNode
      ? pdas.replacement(params.dataHash, params.replacementNode)
      : {};

    return this.client.program.methods
      .requestReplacement(params.dataHash, params.shardId, params.owner)
      .accounts({
        replacement: replacementAccount,
        config: pdas.storageConfig(),
        treasury: storageConfig.treasury,
        owner: params.owner,
        systemProgram: SystemProgram.programId,
      })
      .instruction();
  }
}
