import { TransactionOrVersionedTransaction } from './types';
import { Transaction } from '@solana/web3.js';
export declare function isLegacyTransactionInstance(transaction: TransactionOrVersionedTransaction): transaction is Transaction;
