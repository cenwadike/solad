import { Program, AnchorProvider, Idl } from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  Commitment,
  VersionedTransaction,
} from "@solana/web3.js";
import idl from "../secrete-deps/contract.json";

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

  use<T extends object>(plugin: T): this & T {
    Object.assign(this, plugin);
    return this as this & T;
  }
}
