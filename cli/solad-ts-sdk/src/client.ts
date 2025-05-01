import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider, Idl } from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  TransactionInstruction,
  Commitment,
  VersionedTransaction,
} from "@solana/web3.js";
import idl from "../secrete-deps/contract.json";
import { StorageConfigParams } from "./types";
import { PDAHelper } from "./utils/pda-helper";
import { StateHelper } from "./utils/state-helper";

export class StorageSDK {
  private provider: AnchorProvider;
  public program: Program; // TODO: Import Contract type [public program: Program<Contract>].

  constructor(
    readonly connection: Connection,
    readonly wallet: Keypair,
    readonly programId: PublicKey,
    readonly opts: { commitment?: Commitment } = {}
  ) {
    this.provider = new AnchorProvider(
      connection,
      {
        publicKey: wallet.publicKey,
        signTransaction: async <T extends Transaction | VersionedTransaction>(
          tx: T
        ): Promise<T> => {
          if (tx instanceof Transaction) {
            tx.sign(wallet);
            return tx;
          } else {
            tx.sign([wallet]);
            return tx;
          }
        },
        signAllTransactions: async <
          T extends Transaction | VersionedTransaction
        >(
          txs: T[]
        ): Promise<T[]> => {
          return txs.map((tx) => {
            if (tx instanceof Transaction) {
              tx.sign(wallet);
              return tx;
            } else {
              tx.sign([wallet]);
              return tx;
            }
          });
        },
      },
      opts
    );

    this.program = new Program(idl as Idl, this.provider); // TODO: Import Contract type [new Program<Contract>].
  }

  // ========================
  // Core - Define instruction builders.
  // ========================

  // Config mgmt
  async createInitializeIx(
    params: StorageConfigParams
  ): Promise<TransactionInstruction> {
    const pdas = new PDAHelper(this.programId);

    return this.program.methods
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
        authority: this.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .instruction();
  }

  // Node mgmt
  async createRegisterNodeIx(
    stakeAmount: number
  ): Promise<TransactionInstruction> {
    const pdas = new PDAHelper(this.programId);
    const nodePda = pdas.nodeAccount(this.wallet.publicKey);
    const stakeEscrow = pdas.stakeEscrow(this.wallet.publicKey);

    return this.program.methods
      .registerNode(new anchor.BN(stakeAmount))
      .accounts({
        owner: this.wallet.publicKey,
        node: nodePda,
        stakeEscrow: stakeEscrow,
        systemProgram: SystemProgram.programId,
      })
      .instruction();
  }

  // Data Ops
  async createUploadIx(params: {
    dataHash: string;
    sizeBytes: number;
    shardCount: number;
    duration: number;
    nodes: PublicKey[];
  }): Promise<TransactionInstruction> {
    const pdas = new PDAHelper(this.programId);
    const storageConfig = await new StateHelper(
      this.programId
    ).getStorageConfig(this.program);

    return this.program.methods
      .uploadData(
        params.dataHash,
        new anchor.BN(params.sizeBytes),
        params.shardCount,
        new anchor.BN(params.duration)
      )
      .accounts({
        config: pdas.storageConfig,
        payer: this.wallet.publicKey,
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
}
