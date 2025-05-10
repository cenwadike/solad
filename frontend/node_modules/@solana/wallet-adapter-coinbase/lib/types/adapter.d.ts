import type { SendTransactionOptions, WalletName } from '@solana/wallet-adapter-base';
import { BaseMessageSignerWalletAdapter, WalletReadyState } from '@solana/wallet-adapter-base';
import type { Connection, Transaction, VersionedTransaction, TransactionSignature, TransactionVersion } from '@solana/web3.js';
import { PublicKey } from '@solana/web3.js';
export interface CoinbaseWalletAdapterConfig {
}
export declare const CoinbaseWalletName: WalletName<"Coinbase Wallet">;
export declare class CoinbaseWalletAdapter extends BaseMessageSignerWalletAdapter {
    name: WalletName<"Coinbase Wallet">;
    url: string;
    icon: string;
    supportedTransactionVersions: ReadonlySet<TransactionVersion>;
    private _connecting;
    private _wallet;
    private _publicKey;
    private _readyState;
    constructor(config?: CoinbaseWalletAdapterConfig);
    get publicKey(): PublicKey | null;
    get connecting(): boolean;
    get readyState(): WalletReadyState;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    sendTransaction<T extends Transaction | VersionedTransaction>(transaction: T, connection: Connection, options?: SendTransactionOptions): Promise<TransactionSignature>;
    signTransaction<T extends Transaction | VersionedTransaction>(transaction: T): Promise<T>;
    signAllTransactions<T extends Transaction | VersionedTransaction>(transactions: T[]): Promise<T[]>;
    signMessage(message: Uint8Array): Promise<Uint8Array>;
    private _disconnected;
}
//# sourceMappingURL=adapter.d.ts.map