import { PublicKey } from "@solana/web3.js";

export class PDAHelper {
  constructor(private programId: PublicKey) {}

  // config management
  storageConfig() {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("storage_config")],
      this.programId
    )[0];
  }

  // node management: registry
  nodeRegistry() {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("node_registry")],
      this.programId
    )[0];
  }

  // node management: account
  nodeAccount(owner: PublicKey) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("node"), owner.toBuffer()],
      this.programId
    )[0];
  }

  // node management: stake escrow
  stakeEscrow(owner: PublicKey) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("stake_escrow"), owner.toBuffer()],
      this.programId
    )[0];
  }
}
