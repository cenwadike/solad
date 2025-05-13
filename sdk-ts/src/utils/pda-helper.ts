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

  // Data Ops: upload
  upload(dataHash: string, payer: PublicKey) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("upload"), Buffer.from(dataHash), payer.toBuffer()],
      this.programId
    )[0];
  }

  // Data Ops: upload escrow
  uploadEscrow(dataHash: string, payer: PublicKey) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), Buffer.from(dataHash), payer.toBuffer()],
      this.programId
    )[0];
  }

  // Data Ops: user upload keys
  uploadKeys(user: PublicKey) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("upload_keys"), user.toBuffer()],
      this.programId
    );
  }

  // Data Ops: replacement
  replacement(dataHash: string, nodePda: PublicKey) {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from("replacement"),
        nodePda.toBuffer(),
        Buffer.from(dataHash),
        Buffer.from([0]),
      ],
      this.programId
    );
  }
}
