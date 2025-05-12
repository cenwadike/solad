import { PublicKey } from "@solana/web3.js";
import { PDAHelper } from "./pda-helper";
import { Program } from "@coral-xyz/anchor";
import { StorageConfig } from "../types";

export class StateHelper {
  constructor(private programId: PublicKey) {}

  async getStorageConfig(program: Program): Promise<StorageConfig> {
    const pdas = new PDAHelper(this.programId);

    return (program.account as any).storageConfig.fetch(pdas.storageConfig());
  }
}
