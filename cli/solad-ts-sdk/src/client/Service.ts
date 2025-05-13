import { sha256 } from "@noble/hashes/sha2"; // TODO: Hash from here or from crypto lib
import { PublicKey, TransactionSignature } from "@solana/web3.js";
import { StorageSDK } from "../client";
import { Core } from "./Core";
import { PDAHelper } from "../utils/pda-helper";
import { createHash } from "crypto";
import axios from "axios";
import { DataUploadRequest, DataUploadPayload, StorageConfig } from "../types";

// ==================================
// Service Layer: Common Workflows.
// ==================================
export class Service {
  private core: Core;
  constructor(private client: StorageSDK) {
    // get instance of core
    this.core = this.client.use(new Core(this.client));
  }

  /**
   * Initialize the Solad network with the given configuration parameters.
   * This method calls the `initialize` instruction and sends the transaction
   * to the blockchain.
   * @param {StorageConfig} params - Parameters for initializing the storage network.
   * @returns {Promise<TransactionSignature>} - The promise resolves to the transaction signature.
   */
  async initializeNetwork(
    params: StorageConfig
  ): Promise<TransactionSignature> {
    const initIx = await this.core.createInitializeIx(params);
    return this.client.sendTransactions([initIx]);
  }

  /**
   * Register a new node with the specified stake amount and then upload the
   * given data to the Solad network.
   *
   * This method first registers a new node with the given stake amount using the
   * `registerNode` instruction. After the registration is confirmed, it then
   * uploads the given data using the `uploadData` method.
   *
   * @param {DataUploadRequest & { stakeAmount: number }} params - Parameters for registering a node and uploading data.
   * @returns {Promise<{ dataHash: string; uploadPDA: PublicKey }>} - The promise resolves to an object containing the data hash and the upload PDA.
   */
  async registerAndUpload(
    params: DataUploadRequest & { stakeAmount: number }
  ): Promise<{ dataHash: string; uploadPDA: PublicKey }> {
    // Phase 1: Register node
    const registerIx = await this.core.createRegisterNodeIx(params.stakeAmount);

    try {
      // Create custom transaction & ensure it's confirmed before proceeding
      const txSig = await this.client.sendTransactions([registerIx]);

      // Confirm the transaction
      await this.client.confirmTransaction(txSig);
    } catch (err: any) {
      // TODO: use error type
      throw new Error(`Node registeration failed: ${err.message}`);
    }

    // Phase 2: Upload data
    return this.uploadData(params);
  }

  /**
   * Uploads data to the Solad network. This method first calls the `uploadData` instruction
   * on the Solad program to create an upload instruction. After the instruction is confirmed,
   * it then uploads the data to the specified endpoint.
   *
   * @param {DataUploadRequest} params - Parameters for uploading data.
   * @returns {Promise<{ dataHash: string; uploadPDA: PublicKey }>} - The promise resolves to an object containing the data hash and the upload PDA.
   */
  async uploadData(
    params: DataUploadRequest
  ): Promise<{ dataHash: string; uploadPDA: PublicKey }> {
    const pdas = new PDAHelper(this.client.programId);

    const dataHash = createHash("sha256").update(params.data).digest("hex");
    const shardCount = params.nodes.length;

    // Phase 1: On-chain contract call
    const ix = await this.core.createUploadIx({
      dataHash,
      sizeBytes: params.data.length,
      shardCount,
      duration: params.duration,
      nodes: params.nodes,
    });

    const uploadPDA = pdas.upload(dataHash, this.client.wallet.publicKey);

    try {
      // Create custom transaction & ensure it's confirmed before proceeding
      const txSig = await this.client.sendTransactions([ix]);

      // Confirm the transaction or use catch block
      await this.client.confirmTransaction(txSig);
    } catch (err: any) {
      // TODO: use error type
      throw new Error(`On-chain upload failed: ${err.message}`);
    }

    // Phaase 2: Off-chain upload
    const payload: DataUploadPayload = {
      key: params.key,
      data: params.data.toString("base64"),
      hash: dataHash,
      format: params.format,
      upload_pda: uploadPDA,
    };

    await this.postWithRetry(`${params.endpoint}/set_value`, payload);

    return { dataHash, uploadPDA };
  }

  /**
   * Makes a POST request with retry logic. If the request fails, it waits for a certain amount of time
   * (exponential backoff) before retrying. If all retries fail, it throws an error.
   *
   * @param url - The URL to make the POST request to.
   * @param payload - The payload to send with the request.
   * @param maxRetries - The maximum number of retries. Defaults to 3.
   * @param delayMs - The initial delay in milliseconds. Defaults to 1000.
   * @returns A promise that resolves if all retries succeed, or rejects if all retries fail.
   */
  private async postWithRetry(
    url: string,
    payload: DataUploadPayload,
    maxRetries = 3,
    delayMs = 1000
  ): Promise<void> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await axios.post(url, payload, {
          headers: { "Content-Type": "application/json" },
        });

        if (response.status === 200) return; // success

        throw new Error(`Unexpected status: ${response.status}`);
      } catch (err: any) {
        const isLastAttempt = attempt === maxRetries;
        if (isLastAttempt) {
          throw new Error(
            `Off-chain upload failed after ${maxRetries} attempts: ${
              err.response?.data?.error || err.message
            }`
          );
        }
        await new Promise((res) => setTimeout(res, delayMs * attempt)); // Exponential backoff
      }
    }
  }

  /**
   * Retrieves data from a given endpoint using the specified key.
   *
   * This method makes a GET request to the provided endpoint to fetch data
   * associated with the given key. The response data is expected to be in
   * binary format and is returned as a Buffer. If the key is not found, an
   * error is thrown.
   *
   * @param {string} endpoint - The URL of the server endpoint to fetch data from.
   * @param {string} key - The unique key identifying the data to retrieve.
   * @returns {Promise<Buffer>} A promise that resolves to a Buffer containing the retrieved data.
   * @throws {Error} If the data is not found (404 status) or if there is a network or server error.
   */
  async retrieveData(endpoint: string, key: string): Promise<Buffer> {
    try {
      const response = await axios.get(`${endpoint}/get_value`, {
        params: { key },
        responseType: "arraybuffer",
      });

      return Buffer.from(response.data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        throw new Error("Data not found");
      }
      throw new Error(
        `Retrieval failed: ${err.response?.data?.error || err.message}`
      );
    }
  }
}
