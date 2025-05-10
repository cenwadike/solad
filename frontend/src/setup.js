import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { AnchorProvider, Program, web3 } from "@project-serum/anchor";
import idl from "./idl.json"; // Exported IDL from Anchor build


const PROGRAM_ID = new PublicKey("4Fbo2dQdqrVhxLBbZrxVEbDBxp8GmNa9voEN96d4fQJp");
const network = clusterApiUrl("devnet");

const getProvider = () => {
  const connection = new Connection(network, "processed");
  const provider = new AnchorProvider(connection, window.solana, {
    preflightCommitment: "processed",
  });
  return provider;
};

const getProgram = () => {
  const provider = getProvider();
  return new Program(idl, PROGRAM_ID, provider);
};

export { getProvider, getProgram };
