import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Contract } from "../target/types/contract";
import { Keypair, LAMPORTS_PER_SOL, PublicKey, Signer, SystemProgram } from "@solana/web3.js";
import { expect } from "chai";
import { sha256 } from "@noble/hashes/sha256";
import * as secp256k1 from "@noble/secp256k1";
import { hmac } from "@noble/hashes/hmac";

// Utility function to generate a Merkle tree and proof
function generateMerkleTreeAndProof(leaves: any[]) {
  // Hash leaves
  const hashedLeaves = leaves.map(leaf => sha256(leaf));

  // Build tree
  let nodes = [...hashedLeaves];
  const tree = [nodes];
  while (nodes.length > 1) {
    const level = [];
    for (let i = 0; i < nodes.length; i += 2) {
      const left = nodes[i];
      const right = i + 1 < nodes.length ? nodes[i + 1] : left;
      const combined = left < right ? Buffer.concat([left, right]) : Buffer.concat([right, left]);
      level.push(sha256(combined));
    }
    tree.push(level);
    nodes = level;
  }

  // Generate proof for the first leaf
  const proof = [];
  let index = 0; // Proof for first leaf
  for (let level = 0; level < tree.length - 1; level++) {
    const siblingIndex = index % 2 === 0 ? index + 1 : index - 1;
    if (siblingIndex < tree[level].length) {
      proof.push([...tree[level][siblingIndex]]);
    }
    index = Math.floor(index / 2);
  }

  return {
    root: tree[tree.length - 1][0],
    leaf: hashedLeaves[0],
    proof,
  };
}

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
      const reporting_window = new anchor.BN(1);
      const oversized_report_threshold = 66.6
      const max_submssions = new anchor.BN(100);

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
          user_slash_penalty_percent,
          reporting_window,
          oversized_report_threshold,
          max_submssions
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
    // Create and fund two nodes for the upload (to satisfy challenger requirement)
    const node1 = Keypair.generate();
    const node2 = Keypair.generate();
    const node1Sig: Signer = {
      publicKey: node1.publicKey,
      secretKey: node1.secretKey,
    };
    const node2Sig: Signer = {
      publicKey: node2.publicKey,
      secretKey: node2.secretKey,
    };

    const [node1Pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("node"), node1.publicKey.toBuffer()],
      program.programId
    );
    const [node2Pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("node"), node2.publicKey.toBuffer()],
      program.programId
    );

    const [stakeEscrow1Pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("stake_escrow"), node1.publicKey.toBuffer()],
      program.programId
    );
    const [stakeEscrow2Pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("stake_escrow"), node2.publicKey.toBuffer()],
      program.programId
    );

    // Fund nodes
    await Promise.all([
      program.provider.connection.confirmTransaction(
        await program.provider.connection.requestAirdrop(node1.publicKey, 5 * LAMPORTS_PER_SOL),
        "confirmed"
      ),
      program.provider.connection.confirmTransaction(
        await program.provider.connection.requestAirdrop(node2.publicKey, 5 * LAMPORTS_PER_SOL),
        "confirmed"
      ),
    ]);

    // Register nodes
    const stake_amount = new anchor.BN(0.2 * LAMPORTS_PER_SOL);
    await Promise.all([
      program.methods
        .registerNode(stake_amount)
        .accounts({
          owner: node1.publicKey,
          config: storageConfigPda,
        })
        .signers([node1Sig])
        .rpc(),
      program.methods
        .registerNode(stake_amount)
        .accounts({
          owner: node2.publicKey,
          config: storageConfigPda,
        })
        .signers([node2Sig])
        .rpc(),
    ]);

    const data_hash = "test_upload_123";
    const size_bytes = new anchor.BN(10000);
    const shard_count = 1;
    const duration = new anchor.BN(1);

    // Derive upload PDAs
    [uploadPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("upload"), Buffer.from(data_hash), user.publicKey.toBuffer()],
      program.programId
    );

    [uploadEscrowPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), Buffer.from(data_hash), user.publicKey.toBuffer()],
      program.programId
    );

    // Derive user upload keys PDA
    const [userUploadKeysPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("upload_keys"), user.publicKey.toBuffer()],
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
        .remainingAccounts([
          { pubkey: node1Pda, isWritable: true, isSigner: false },
          { pubkey: node2Pda, isWritable: true, isSigner: false },
        ])
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

    const upload = await program.account.upload.fetch(uploadPda);
    expect(upload.dataHash).to.equal(data_hash);
    expect(upload.shardCount).to.equal(shard_count);
    expect(upload.shards[0].nodeKeys.map(k => k.toBase58())).to.include.members([
      node1Pda.toBase58(),
      node2Pda.toBase58(),
    ]);

    console.log("Data Uploaded Successfully. Tx Hash:", tx);
  });

  it("Submits Proof of Storage successfully", async () => {
    // Setup nodes
    const node1 = Keypair.generate();
    const node2 = Keypair.generate();
    const node1Sig: Signer = {
      publicKey: node1.publicKey,
      secretKey: node1.secretKey,
    };
    const node2Sig: Signer = {
      publicKey: node2.publicKey,
      secretKey: node2.secretKey,
    };

    const [node1Pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("node"), node1.publicKey.toBuffer()],
      program.programId
    );
    const [node2Pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("node"), node2.publicKey.toBuffer()],
      program.programId
    );

    const [stakeEscrow1Pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("stake_escrow"), node1.publicKey.toBuffer()],
      program.programId
    );
    const [stakeEscrow2Pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("stake_escrow"), node2.publicKey.toBuffer()],
      program.programId
    );

    // Fund nodes
    await Promise.all([
      program.provider.connection.confirmTransaction(
        await program.provider.connection.requestAirdrop(node1.publicKey, 5 * LAMPORTS_PER_SOL),
        "confirmed"
      ),
      program.provider.connection.confirmTransaction(
        await program.provider.connection.requestAirdrop(node2.publicKey, 5 * LAMPORTS_PER_SOL),
        "confirmed"
      ),
    ]);

    // Register nodes
    const stake_amount = new anchor.BN(0.2 * LAMPORTS_PER_SOL);
    await Promise.all([
      program.methods
        .registerNode(stake_amount)
        .accounts({
          owner: node1.publicKey,
          config: storageConfigPda,
        })
        .signers([node1Sig])
        .rpc(),
      program.methods
        .registerNode(stake_amount)
        .accounts({
          owner: node2.publicKey,
          config: storageConfigPda,
        })
        .signers([node2Sig])
        .rpc(),
    ]);

    // Perform upload
    const data_hash = "pos_test_456";
    const size_bytes = new anchor.BN(10000);
    const shard_count = 1;
    const duration = new anchor.BN(1);

    const [uploadPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("upload"), Buffer.from(data_hash), user.publicKey.toBuffer()],
      program.programId
    );

    const [uploadEscrowPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), Buffer.from(data_hash), user.publicKey.toBuffer()],
      program.programId
    );

    const [userUploadKeysPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("upload_keys"), user.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .uploadData(data_hash, size_bytes, shard_count, duration)
      .accounts({
        config: storageConfigPda,
        payer: user.publicKey,
        treasury: treasury,
      })
      .remainingAccounts([
        { pubkey: node1Pda, isWritable: true, isSigner: false },
        { pubkey: node2Pda, isWritable: true, isSigner: false },
      ])
      .signers([userSig])
      .rpc();

    // Derive replacement PDA
    const [replacementPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("replacement"), node1Pda.toBuffer(), Buffer.from(data_hash), Buffer.from([0])],
      program.programId
    );

    // Generate Merkle tree and proof
    const leaves = [
      Buffer.from("leaf1"),
      Buffer.from("leaf2"),
      Buffer.from("leaf3"),
      Buffer.from("leaf4"),
    ];
    const { root: merkle_root, leaf, proof: merkle_proof } = generateMerkleTreeAndProof(leaves);

    // Set HMAC-SHA256 implementation
    secp256k1.etc.hmacSha256Sync = (key, ...msgs) => {
      const h = hmac.create(sha256, key);
      msgs.forEach(msg => h.update(msg));
      return h.digest();
    };

    // Generate ECDSA signature
    const timestamp = Math.floor(Date.now() / 1000); // Unix timestamp
    const message = `${data_hash}:0:[${merkle_root.join(",")}]:${timestamp}`; // Matches Rust format
    const message_hash = sha256(message);
    const privateKey = node2.secretKey.slice(0, 32); // First 32 bytes of Solana keypair
    const signature = secp256k1.sign(message_hash, privateKey, {extraEntropy: false});
    // Convert signature to 64-byte r|s format
    const challenger_signature = signature.toCompactRawBytes(); // 64-byte r|s

    // Create PoSSubmission
    const submission = {
      dataHash: data_hash,
      shardId: 0,
      merkleRoot: [...merkle_root],
      merkleProof: merkle_proof.map(p => [...p]),
      leaf: [...leaf],
      challengerSignature: [...challenger_signature],
      challengerPubkey: node2Pda,
      actualSizeMb: null,
    };

    // Capture PoSEvent
    let eventEmitted = false;
    program.addEventListener("poSEvent", (event, _slot, _signature) => {
      expect(event.dataHash).to.equal(data_hash);
      expect(event.shardId).to.equal(0);
      expect(event.node.toBase58()).to.equal(node1Pda.toBase58());
      expect(event.challenger.toBase58()).to.equal(node2Pda.toBase58());
      expect(event.merkleRoot).to.deep.equal([...merkle_root]);
      eventEmitted = true;
    });

    // Execute submitPos
    let tx;
    try {
      tx = await program.methods
        .submitPos(submission, userSig.publicKey)
        .accounts({
          replacement: replacementPda,
          owner: node1.publicKey,
          config: storageConfigPda,
          treasury: treasury,
        })
        .remainingAccounts([
          { pubkey: node1Pda, isWritable: true, isSigner: false },
          { pubkey: node2Pda, isWritable: true, isSigner: false },
        ])
        .signers([node1Sig])
        .rpc();
      console.log("SubmitPoS transaction:", tx);
    } catch (error) {
      if (error instanceof anchor.web3.SendTransactionError) {
        const logs = await error.getLogs(provider.connection);
        console.error("SubmitPoS failed. Logs:", logs);
        throw new Error(`SubmitPoS failed: ${error.message}\nLogs: ${logs.join("\n")}`);
      }
      throw error;
    }

    // Validate outcomes
    const upload = await program.account.upload.fetch(uploadPda);
    expect(upload.shards[0].verifiedCount).to.equal(1);
    expect(upload.shards[0].challenger.toBase58()).to.equal(node2Pda.toBase58());

    const node1Account = await program.account.node.fetch(node1Pda);
    expect(node1Account.uploadCount.toNumber()).to.equal(0); // Decremented since verified_count >= node_count (2 nodes)

    const replacementAccountInfo = await program.provider.connection.getAccountInfo(replacementPda);
    expect(replacementAccountInfo).to.not.be.null; // Not closed since pos_submitted is false

    expect(eventEmitted).to.be.true;

    console.log("Proof of Storage Submitted Successfully. Tx Hash:", tx);
  });

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
        throw error;
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

    console.log("Node Exit Requested Successfully. Tx Hash:", tx);
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