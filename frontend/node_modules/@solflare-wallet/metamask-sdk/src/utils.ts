import { TransactionOrVersionedTransaction } from './types';
import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';

export function isLegacyTransactionInstance(transaction: TransactionOrVersionedTransaction) {
  return (transaction as VersionedTransaction).version === undefined;
}

export function serializeTransaction(transaction: TransactionOrVersionedTransaction): Uint8Array {
  return isLegacyTransactionInstance(transaction)
    ? (transaction as Transaction).serialize({
        verifySignatures: false,
        requireAllSignatures: false
      })
    : (transaction as VersionedTransaction).serialize();
}

export function serializeTransactionMessage(
  transaction: TransactionOrVersionedTransaction
): Uint8Array {
  return isLegacyTransactionInstance(transaction)
    ? (transaction as Transaction).serializeMessage()
    : (transaction as VersionedTransaction).message.serialize();
}

export function addSignature(
  transaction: TransactionOrVersionedTransaction,
  publicKey: PublicKey,
  signature: Uint8Array
) {
  if (isLegacyTransactionInstance(transaction)) {
    (transaction as Transaction).addSignature(publicKey, Buffer.from(signature));
  } else {
    const signerPubkeys = (transaction as VersionedTransaction).message.staticAccountKeys.slice(
      0,
      (transaction as VersionedTransaction).message.header.numRequiredSignatures
    );
    const signerIndex = signerPubkeys.findIndex((pubkey) => pubkey.equals(publicKey));
    if (signerIndex >= 0) {
      transaction.signatures[signerIndex] = signature;
    }
  }
}
