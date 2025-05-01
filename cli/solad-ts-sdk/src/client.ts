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
} from "@solana/web3.js";
import { Contract } from "./contract";
import idl from "../secrete-deps/contract.json";
import { StorageConfigParams } from "./types";

export class StorageSDK {
  private provider: AnchorProvider;
  public program: Program<Contract>;

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
        signTransaction: (tx: Transaction) => {
          tx.sign(wallet);
          return Promise.resolve(tx);
        },
        signAllTransactions: (txs: Transaction[]) => {
          return Promise.resolve(
            txs.map((tx) => {
              tx.sign(wallet);
              return tx;
            })
          );
        },
      },
      opts
    );

    this.program = new Program<Contract>(idl as Idl, this.provider);
  }

  // ========================
  // Core - Define instruction builders.
  // ========================

  static derivePdas(programId: PublicKey) {
    return {
      // config mgmt
      storageConfig: PublicKey.findProgramAddressSync(
        [Buffer.from("storage_config")],
        programId
      )[0],
    };
  }

  // Config mgmt
  async createInitializeIx(
    params: StorageConfigParams
  ): Promise<TransactionInstruction> {
    const pdas = StorageSDK.derivePdas(this.programId);

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
}
