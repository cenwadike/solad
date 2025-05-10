import { Auth, LoginOptions } from '@particle-network/auth';
import { Connection, ConnectionConfig, PublicKey, Transaction } from '@solana/web3.js';
import { ISolanaWallet } from './types';
export declare class SolanaWallet implements ISolanaWallet {
    private auth;
    readonly isParticleNetwork = true;
    name: string;
    url: string;
    icon: string;
    private _publicKey;
    private _connecting;
    private events;
    constructor(auth: Auth);
    get version(): string;
    on(event: string, listener: any): void;
    once(event: string, listener: any): void;
    off(event: string, listener: any): void;
    removeListener(event: string, listener: any): void;
    get connecting(): boolean;
    get connected(): boolean;
    get publicKey(): PublicKey | null;
    connect(config?: LoginOptions): Promise<void>;
    disconnect(): Promise<void>;
    signTransaction(transaction: Transaction): Promise<Transaction>;
    signAllTransactions(transactions: Transaction[]): Promise<Transaction[]>;
    signAndSendTransaction(transaction: Transaction): Promise<string>;
    signMessage(message: Uint8Array): Promise<Uint8Array>;
    getConnection(config?: ConnectionConfig): Connection;
}
