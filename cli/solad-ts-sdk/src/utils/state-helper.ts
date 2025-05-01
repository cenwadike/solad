import { PublicKey } from "@solana/web3.js";
import { PDAHelper } from "./pda-helper";
import { Program } from "@coral-xyz/anchor";

export class StateHelper {
  constructor(private programId: PublicKey) {}

  async getStorageConfig(program: Program): Promise<{ treasury: any }> {
    // TODO: Import Contract type in arg [program: Program<Contract>], then removed typed return type.
    const pdas = new PDAHelper(this.programId);

    return (program.account as any).storageConfig.fetch(pdas.storageConfig());
  }
}
