import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Contract } from "../target/types/contract";
import { Keypair, LAMPORTS_PER_SOL, PublicKey, Signer, SystemProgram } from "@solana/web3.js";
import { expect } from "chai";

describe("contract", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Contract as Program<Contract>;
  const admin = Keypair.generate();
  const user = Keypair.generate();
  const treasury = Keypair.generate().publicKey;

  const adminSig: Signer = {
    publicKey: admin.publicKey,
    secretKey: admin.secretKey,
  };

  const userSig: Signer = {
    publicKey: user.publicKey,
    secretKey: user.secretKey,
  };

  let storageConfigPda: PublicKey;
  let nodeRegistryPda: PublicKey;
  let nodePda: PublicKey;
  let stakeEscrowPda: PublicKey;
  let uploadPda: PublicKey;
  let uploadEscrowPda: PublicKey;

  before(async () => {
    // Derive PDAs
    [storageConfigPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("storage_config")],
      program.programId
    );

    [nodeRegistryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("node_registry")],
      program.programId
    );

    [nodePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("node"), user.publicKey.toBuffer()],
      program.programId
    );

    [stakeEscrowPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("stake_escrow"), user.publicKey.toBuffer()],
      program.programId
    );

    // Fund accounts
    await Promise.all([
      program.provider.connection.confirmTransaction(
        await program.provider.connection.requestAirdrop(
          program.programId,
          10 * LAMPORTS_PER_SOL
        ),
        "confirmed"
      ),
      program.provider.connection.confirmTransaction(
        await program.provider.connection.requestAirdrop(
          admin.publicKey,
          10 * LAMPORTS_PER_SOL
        ),
        "confirmed"
      ),
      program.provider.connection.confirmTransaction(
        await program.provider.connection.requestAirdrop(
          user.publicKey,
          10 * LAMPORTS_PER_SOL
        ),
        "confirmed"
      ),
      program.provider.connection.confirmTransaction(
        await program.provider.connection.requestAirdrop(
          treasury,
          1 * LAMPORTS_PER_SOL
        ),
        "confirmed"
      ),
    ]);
  });

  it("Initializes the program", async () => {
    const configAccountInfo = await program.provider.connection.getAccountInfo(storageConfigPda);

    if (!configAccountInfo) {
      const sol_per_gb = new anchor.BN(0.03 * LAMPORTS_PER_SOL);
      const treasury_fee_percent = new anchor.BN(25);
      const node_fee_percent = new anchor.BN(75);
      const shard_min_mb = new anchor.BN(1);
      const epochs_total = new anchor.BN(1);
      const slash_penalty_percent = new anchor.BN(10);
      const min_shard_count = 1;
      const max_shard_count = 10;
      const slots_per_epoch = new anchor.BN(42000);
      const min_node_stake = new anchor.BN(0.1 * LAMPORTS_PER_SOL);
      const replacement_timeout_epochs = new anchor.BN(1);
      const min_lamports_per_upload = new anchor.BN(0.03 * LAMPORTS_PER_SOL);
      const max_user_uploads = new anchor.BN(100);
      const user_slash_penalty_percent = new anchor.BN(10);

      const tx = await program.methods
        .initialize(
          treasury,
          sol_per_gb,
          treasury_fee_percent,
          node_fee_percent,
          shard_min_mb,
          epochs_total,
          slash_penalty_percent,
          min_shard_count,
          max_shard_count,
          slots_per_epoch,
          min_node_stake,
          replacement_timeout_epochs,
          min_lamports_per_upload,
          max_user_uploads,
          user_slash_penalty_percent
        )
        .accounts({
          authority: admin.publicKey,
        })
        .signers([adminSig])
        .rpc();

      const config = await program.account.storageConfig.fetch(storageConfigPda);
      expect(config.treasury.toBase58()).to.equal(treasury.toBase58());
      expect(config.solPerGb.toNumber()).to.equal(sol_per_gb.toNumber());
      expect(config.isInitialized).to.be.true;

      const nodeRegistry = await program.account.nodeRegistry.fetch(nodeRegistryPda);
      expect(nodeRegistry.nodes).to.be.an("array").that.is.empty;

      console.log("Program Initialized Successfully. Tx Hash:", tx);
    } else {
      console.log("Program already initialized");
    }
  });

  it("Registers a node successfully", async () => {
    const stake_amount = new anchor.BN(0.2 * LAMPORTS_PER_SOL);

    const initialUserBalance = await program.provider.connection.getBalance(user.publicKey);
    let initialEscrowBalance = 0;
    const escrowAccountInfo = await program.provider.connection.getAccountInfo(stakeEscrowPda);
    if (escrowAccountInfo) {
      initialEscrowBalance = escrowAccountInfo.lamports;
    }

    const tx = await program.methods
      .registerNode(stake_amount)
      .accounts({
        owner: user.publicKey,
        config: storageConfigPda,
      })
      .signers([userSig])
      .rpc();

    const nodeAccount = await program.account.node.fetch(nodePda);
    expect(nodeAccount.owner.toBase58()).to.equal(user.publicKey.toBase58());
    expect(nodeAccount.stakeAmount.toNumber()).to.equal(stake_amount.toNumber());
    expect(nodeAccount.uploadCount.toNumber()).to.equal(0);
    expect(nodeAccount.isActive).to.be.true;

    const nodeRegistry = await program.account.nodeRegistry.fetch(nodeRegistryPda);
    expect(nodeRegistry.nodes.map(n => n.toBase58())).to.include(nodePda.toBase58());

    console.log("Node Registered Successfully. Tx Hash:", tx);
  });

  it("Uploads data successfully", async () => {
    // Create and fund a new user for node registration
    const newUser = Keypair.generate();
    const newUserSig: Signer = {
      publicKey: newUser.publicKey,
      secretKey: newUser.secretKey,
    };

    // Derive PDAs for the new node
    const [newNodePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("node"), newUser.publicKey.toBuffer()],
      program.programId
    );

    const [newStakeEscrowPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("stake_escrow"), newUser.publicKey.toBuffer()],
      program.programId
    );

    // Fund the new user
    await program.provider.connection.confirmTransaction(
      await program.provider.connection.requestAirdrop(newUser.publicKey, 5 * LAMPORTS_PER_SOL),
      "confirmed"
    );

    // Register the new node
    const stake_amount = new anchor.BN(0.2 * LAMPORTS_PER_SOL);
    await program.methods
      .registerNode(stake_amount)
      .accounts({
        owner: newUser.publicKey,
        config: storageConfigPda,
      })
      .signers([newUserSig])
      .rpc();

    const data_hash = "abc123";
    const size_bytes = new anchor.BN(10000);
    const shard_count = 1;
    const duration = new anchor.BN(1);

    // Derive upload PDAs
    [uploadPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("upload"), Buffer.from("abc123"), user.publicKey.toBuffer()],
      program.programId
    );

    [uploadEscrowPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), Buffer.from(data_hash), user.publicKey.toBuffer()],
      program.programId
    );

    // Execute upload
    let tx;
    try {
      tx = await program.methods
        .uploadData(data_hash, size_bytes, shard_count, duration)
        .accounts({
          config: storageConfigPda,
          payer: user.publicKey,
          treasury: treasury,          
        })
        .remainingAccounts([{ pubkey: newNodePda, isWritable: true, isSigner: false }])
        .signers([userSig])
        .rpc();
      console.log("Upload transaction:", tx);
    } catch (error) {
      if (error instanceof anchor.web3.SendTransactionError) {
        const logs = await error.getLogs(provider.connection);
        console.error("UploadData failed. Logs:", logs);
        throw new Error(`UploadData failed: ${error.message}\nLogs: ${logs.join("\n")}`);
      }
      throw error;
    }
    console.log("Data Uploaded Successfully. Tx Hash:", tx);
  });

  it("Deregisters a node successfully", async () => {
    const newUser = Keypair.generate();
    const newUserSig: Signer = {
      publicKey: newUser.publicKey,
      secretKey: newUser.secretKey,
    };

    const [newNodePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("node"), newUser.publicKey.toBuffer()],
      program.programId
    );

    const [newStakeEscrowPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("stake_escrow"), newUser.publicKey.toBuffer()],
      program.programId
    );

    await program.provider.connection.confirmTransaction(
      await program.provider.connection.requestAirdrop(newUser.publicKey, 5 * LAMPORTS_PER_SOL),
      "confirmed"
    );

    const stake_amount = new anchor.BN(0.2 * LAMPORTS_PER_SOL);
    await program.methods
      .registerNode(stake_amount)
      .accounts({
        owner: newUser.publicKey,
        config: storageConfigPda,
      })
      .signers([newUserSig])
      .rpc();

    const tx = await program.methods
      .deregisterNode()
      .accounts({
        owner: newUser.publicKey,
        config: storageConfigPda,
      })
      .signers([newUserSig])
      .rpc();

    const nodeAccountInfo = await program.provider.connection.getAccountInfo(newNodePda);
    expect(nodeAccountInfo).to.be.null;
    const escrowAccountInfo = await program.provider.connection.getAccountInfo(newStakeEscrowPda);
    expect(escrowAccountInfo).to.be.null;

    const nodeRegistry = await program.account.nodeRegistry.fetch(nodeRegistryPda);
    expect(nodeRegistry.nodes.map(n => n.toBase58())).to.not.include(newNodePda.toBase58());

    console.log("Node Deregistered Successfully. Tx Hash:", tx);
  });

  // it("Requests node exit successfully for single-node shard", async () => {
  //   const data_hash = "abcd1234";
  //   const size_bytes = new anchor.BN(10000);
  //   const shard_id = 0;
  //   const shard_count = 1;
  //   const duration = new anchor.BN(1);
  //   const stake_amount = new anchor.BN(0.2 * LAMPORTS_PER_SOL);
  
  //   const newUser = Keypair.generate();
  //   const newUserSig: Signer = {
  //     publicKey: newUser.publicKey,
  //     secretKey: newUser.secretKey,
  //   };
  
  //   // Derive PDAs for the new node
  //   const [newNodePda] = PublicKey.findProgramAddressSync(
  //     [Buffer.from("node"), newUser.publicKey.toBuffer()],
  //     program.programId
  //   );
  
  //   const [newStakeEscrowPda] = PublicKey.findProgramAddressSync(
  //     [Buffer.from("stake_escrow"), newUser.publicKey.toBuffer()],
  //     program.programId
  //   );
  
  //   // Derive upload PDAs
  //   const [uploadPda] = PublicKey.findProgramAddressSync(
  //     [Buffer.from("upload"), Buffer.from(data_hash), user.publicKey.toBuffer()],
  //     program.programId
  //   );
  
  //   const [uploadEscrowPda] = PublicKey.findProgramAddressSync(
  //     [Buffer.from("escrow"), Buffer.from(data_hash), user.publicKey.toBuffer()],
  //     program.programId
  //   );
  
  //   // Fund new user
  //   await program.provider.connection.confirmTransaction(
  //     await program.provider.connection.requestAirdrop(newUser.publicKey, 5 * LAMPORTS_PER_SOL),
  //     "confirmed"
  //   );
  
  //   // Register node
  //   try {
  //     await program.methods
  //       .registerNode(stake_amount)
  //       .accounts({
  //         owner: newUser.publicKey,
  //         config: storageConfigPda,
  //       })
  //       .signers([newUserSig])
  //       .rpc();
  //     const nodeAccount = await program.account.node.fetch(newNodePda);
  //     expect(nodeAccount.isActive).to.be.true;
  //   } catch (error) {
  //     if (error instanceof anchor.web3.SendTransactionError) {
  //       const logs = await error.getLogs(provider.connection);
  //       console.error("RegisterNode failed. Logs:", logs);
  //       throw new Error(`RegisterNode failed: ${error.message}\nLogs: ${logs.join("\n")}`);
  //     }
  //     throw error;
  //   }
  
  //   // Execute upload
  //   let upload_tx;
  //   try {
  //     upload_tx = await program.methods
  //       .uploadData(data_hash, size_bytes, shard_count, duration)
  //       .accounts({
  //         config: storageConfigPda,
  //         payer: user.publicKey,
  //         treasury: treasury,
  //       })
  //       .remainingAccounts([{ pubkey: newNodePda, isWritable: true, isSigner: false }])
  //       .signers([userSig])
  //       .rpc();
  //     console.log("Upload transaction:", upload_tx);
  //   } catch (error) {
  //     if (error instanceof anchor.web3.SendTransactionError) {
  //       const logs = await error.getLogs(provider.connection);
  //       console.error("UploadData failed. Logs:", logs);
  //       throw new Error(`UploadData failed: ${error.message}\nLogs: ${logs.join("\n")}`);
  //     }
  //     throw error;
  //   }
  
  //   // Derive replacement PDA (for verification, not used in single-node case)
  //   const [replacementPda] = PublicKey.findProgramAddressSync(
  //     [Buffer.from("replacement"), newNodePda.toBuffer(), Buffer.from(data_hash), Buffer.from([shard_id])],
  //     program.programId
  //   );
  
  //   const initialOwnerBalance = await program.provider.connection.getBalance(newUser.publicKey);
  
  //   // Request node exit
  //   let tx;
  //   try {
  //     tx = await program.methods
  //       .requestReplacement(data_hash, shard_id, user.publicKey)
  //       .accounts({
  //         replacement: null,
  //         owner: newUser.publicKey,
  //         config: storageConfigPda,
  //         treasury: treasury,
  //       })
  //       .signers([newUserSig])
  //       .remainingAccounts([])
  //       .rpc();
  //   } catch (error) {
  //     if (error instanceof anchor.web3.SendTransactionError) {
  //       const logs = await error.getLogs(provider.connection);
  //       console.error("RequestReplacement failed. Logs:", logs);
  //       throw new Error(`RequestReplacement failed: ${error.message}\nLogs: ${logs.join("\n")}`);
  //     }
  //     throw error;
  //   }
  
  //   const nodeAccount = await program.account.node.fetch(newNodePda);
  //   expect(nodeAccount.isActive).to.be.false;
  //   expect(nodeAccount.uploadCount.toNumber()).to.equal(0);
  
  //   const uploadAccount = await program.account.upload.fetch(uploadPda);
  //   expect(uploadAccount.shards[shard_id].nodeKeys.map(k => k.toBase58())).to.not.include(
  //     newNodePda.toBase58()
  //   );
  
  //   const finalOwnerBalance = await program.provider.connection.getBalance(newUser.publicKey);
  //   const finalEscrowBalance = await program.provider.connection.getBalance(newStakeEscrowPda);
  //   expect(finalOwnerBalance).to.be.greaterThan(initialOwnerBalance);
  //   expect(finalEscrowBalance).to.equal(0);
  
  // });

  it("Requests node exit successfully for single-node shard", async () => {
    const data_hash = "abcd1234";
    const size_bytes = new anchor.BN(10000);
    const shard_id = 0;
    const shard_count = 1;
    const duration = new anchor.BN(1);
    const stake_amount = new anchor.BN(0.2 * LAMPORTS_PER_SOL);
  
    const newUser = Keypair.generate();
    const newUserSig: Signer = {
      publicKey: newUser.publicKey,
      secretKey: newUser.secretKey,
    };
  
    const [newNodePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("node"), newUser.publicKey.toBuffer()],
      program.programId
    );
  
    const [newStakeEscrowPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("stake_escrow"), newUser.publicKey.toBuffer()],
      program.programId
    );
  
    const [uploadPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("upload"), Buffer.from(data_hash), user.publicKey.toBuffer()],
      program.programId
    );
  
    const [uploadEscrowPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), Buffer.from(data_hash), user.publicKey.toBuffer()],
      program.programId
    );
  
    await program.provider.connection.confirmTransaction(
      await program.provider.connection.requestAirdrop(newUser.publicKey, 5 * LAMPORTS_PER_SOL),
      "confirmed"
    );
  
    // Register node
    await program.methods
      .registerNode(stake_amount)
      .accounts({
        owner: newUser.publicKey,
        config: storageConfigPda,
      })
      .signers([newUserSig])
      .rpc();
    console.log("Registered node PDA:", newNodePda.toBase58());
  
    const nodeAccount = await program.account.node.fetch(newNodePda);
    expect(nodeAccount.isActive).to.be.true;
    console.log("Node account state after registration:", {
      owner: nodeAccount.owner.toBase58(),
      stakeAmount: nodeAccount.stakeAmount.toNumber(),
      isActive: nodeAccount.isActive,
      uploadCount: nodeAccount.uploadCount.toNumber(),
    });
  
    // Execute upload
    const upload_tx = await program.methods
      .uploadData(data_hash, size_bytes, shard_count, duration)
      .accounts({
        config: storageConfigPda,
        payer: user.publicKey,
        treasury: treasury,
      })
      .remainingAccounts([{ pubkey: newNodePda, isWritable: true, isSigner: false }])
      .signers([userSig])
      .rpc();
    console.log("Upload transaction:", upload_tx);
  
    const nodeAfterUpload = await program.account.node.fetch(newNodePda);
    console.log("Node account state after upload:", {
      owner: nodeAfterUpload.owner.toBase58(),
      stakeAmount: nodeAfterUpload.stakeAmount.toNumber(),
      isActive: nodeAfterUpload.isActive,
      uploadCount: nodeAfterUpload.uploadCount.toNumber(),
    });
  
    const initialOwnerBalance = await program.provider.connection.getBalance(newUser.publicKey);
  
    // Verify node account before requestReplacement
    const nodeAccountInfo = await program.provider.connection.getAccountInfo(newNodePda);
    if (!nodeAccountInfo) {
      throw new Error(`Node account ${newNodePda.toBase58()} does not exist`);
    }
    console.log("Node account data (hex):", nodeAccountInfo.data.toString("hex"));
  
    // Request node exit
    let tx;
    try {
      tx = await program.methods
        .requestReplacement(data_hash, shard_id, user.publicKey)
        .accounts({
          replacement: null,
          owner: newUser.publicKey,
          config: storageConfigPda,
          treasury: treasury,
        })
        .signers([newUserSig])
        .rpc();
      console.log("RequestReplacement transaction:", tx);
    } catch (error) {
      if (error instanceof anchor.web3.SendTransactionError) {
        const logs = await error.getLogs(program.provider.connection);
        console.error("RequestReplacement logs:", logs.join("\n"));
      }
      throw error;
    }
  
    const finalNodeAccount = await program.account.node.fetch(newNodePda);
    expect(finalNodeAccount.isActive).to.be.false;
    expect(finalNodeAccount.uploadCount.toNumber()).to.equal(0);
  
    const uploadAccount = await program.account.upload.fetch(uploadPda);
    expect(uploadAccount.shards[shard_id].nodeKeys.map(k => k.toBase58())).to.not.include(
      newNodePda.toBase58()
    );
  
    const finalOwnerBalance = await program.provider.connection.getBalance(newUser.publicKey);
    const finalEscrowBalance = await program.provider.connection.getBalance(newStakeEscrowPda);
    expect(finalOwnerBalance).to.be.greaterThan(initialOwnerBalance);
    expect(finalEscrowBalance).to.equal(0);
  });

  it("Updates configuration successfully", async () => {
    const newSolPerGb = new anchor.BN(0.05 * LAMPORTS_PER_SOL);
    const newTreasuryFeePercent = new anchor.BN(30);
    const newNodeFeePercent = new anchor.BN(70);
    const newShardMinMb = new anchor.BN(2);
    const newEpochsTotal = new anchor.BN(2);
    const newSlashPenaltyPercent = new anchor.BN(20);
    const newMinShardCount = 2;
    const newMaxShardCount = 12;
    const newSlotsPerEpoch = new anchor.BN(50000);
    const newMinNodeStake = new anchor.BN(0.2 * LAMPORTS_PER_SOL);
    const newReplacementTimeoutEpochs = new anchor.BN(3);

    const tx = await program.methods
      .updateConfig(
        newSolPerGb,
        newTreasuryFeePercent,
        newNodeFeePercent,
        newShardMinMb,
        newEpochsTotal,
        newSlashPenaltyPercent,
        newMinShardCount,
        newMaxShardCount,
        newSlotsPerEpoch,
        newMinNodeStake,
        newReplacementTimeoutEpochs
      )
      .accounts({
        authority: admin.publicKey,
      })
      .signers([adminSig])
      .rpc();

    const config = await program.account.storageConfig.fetch(storageConfigPda);
    expect(config.solPerGb.toNumber()).to.equal(newSolPerGb.toNumber());
    expect(config.treasuryFeePercent.toNumber()).to.equal(newTreasuryFeePercent.toNumber());
    expect(config.nodeFeePercent.toNumber()).to.equal(newNodeFeePercent.toNumber());
    expect(config.shardMinMb.toNumber()).to.equal(newShardMinMb.toNumber());
    expect(config.epochsTotal.toNumber()).to.equal(newEpochsTotal.toNumber());
    expect(config.slashPenaltyPercent.toNumber()).to.equal(newSlashPenaltyPercent.toNumber());
    expect(config.minShardCount).to.equal(newMinShardCount);
    expect(config.maxShardCount).to.equal(newMaxShardCount);
    expect(config.slotsPerEpoch.toNumber()).to.equal(newSlotsPerEpoch.toNumber());
    expect(config.minNodeStake.toNumber()).to.equal(newMinNodeStake.toNumber());
    expect(config.replacementTimeoutEpochs.toNumber()).to.equal(newReplacementTimeoutEpochs.toNumber());

    console.log("Configuration Updated Successfully. Tx Hash:", tx);
  });
});