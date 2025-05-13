import { Program, AnchorProvider, Idl } from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  Commitment,
  VersionedTransaction,
  TransactionInstruction,
  RpcResponseAndContext,
  SignatureResult,
} from "@solana/web3.js";
import idl from "../idl/contract.json";

export class StorageSDK {
  private provider: AnchorProvider;
  public program: Program<Idl>;

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

    this.program = new Program(idl as unknown as Idl, this.provider);
  }

  /**
   * Send a list of instructions in a single transaction.
   * @param instructions A list of instructions to be included in the transaction.
   * @returns A promise for the transaction signature.
   */
  async sendTransactions(instructions: TransactionInstruction[]) {
    const tx = new Transaction().add(...instructions);
    const { blockhash } = await this.connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = this.wallet.publicKey;

    const signedTx = await this.provider.wallet.signTransaction(tx);
    return await this.connection.sendRawTransaction(signedTx.serialize());
  }

  /**
   * Wait for a transaction to be confirmed and return the signature result.
   *
   * @param txSig The transaction signature to wait for.
   * @param commitment The level of commitment required for the transaction to be considered confirmed.
   * @param timeoutMs The maximum amount of time to wait for the transaction to be confirmed.
   * @returns The signature result for the transaction.
   * @throws If the transaction is not confirmed within the specified timeout.
   */
  async confirmTransaction(
    txSig: string,
    commitment: Commitment = "confirmed",
    timeoutMs: number = 30000
  ): Promise<RpcResponseAndContext<SignatureResult>> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const result = await this.connection.getSignatureStatus(txSig);
      const status = result.value;

      if (
        status?.confirmationStatus === "confirmed" || // commitment??
        status?.confirmationStatus === "finalized"
      ) {
        if (status.err) {
          throw new Error(
            `Transaction ${txSig} failed: ${JSON.stringify(status.err)}`
          );
        }
        return result as RpcResponseAndContext<SignatureResult>;
      }

      await new Promise((resolve) => setTimeout(resolve, 500)); // Wait 500ms before retry
    }

    throw new Error(
      `Transaction ${txSig} not confirmed within timeout (${timeoutMs} ms)`
    );
  }

  use<T extends object>(plugin: T): this & T {
    Object.assign(this, plugin);
    return this as this & T;
  }
}
