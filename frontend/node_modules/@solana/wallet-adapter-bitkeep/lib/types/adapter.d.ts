import type { WalletName } from '@solana/wallet-adapter-base';
import { BaseMessageSignerWalletAdapter, WalletReadyState } from '@solana/wallet-adapter-base';
import type { Transaction } from '@solana/web3.js';
import { PublicKey } from '@solana/web3.js';
export interface BitgetWalletAdapterConfig {
}
export declare const BitgetWalletName: WalletName<"Bitget">;
export declare class BitgetWalletAdapter extends BaseMessageSignerWalletAdapter {
    name: WalletName<"Bitget">;
    url: string;
    icon: string;
    readonly supportedTransactionVersions: null;
    private _connecting;
    private _wallet;
    private _publicKey;
    private _readyState;
    constructor(config?: BitgetWalletAdapterConfig);
    get publicKey(): PublicKey | null;
    get connecting(): boolean;
    get readyState(): WalletReadyState;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    signTransaction<T extends Transaction>(transaction: T): Promise<T>;
    signAllTransactions<T extends Transaction>(transactions: T[]): Promise<T[]>;
    signMessage(message: Uint8Array): Promise<Uint8Array>;
}
/**
 * @deprecated Use 'BitgetWalletName' instead."
 */
export declare const BitKeepWalletName: WalletName<"Bitget">;
/**
 * @deprecated Use 'BitgetWalletAdapterConfig' instead."
 */
export type BitKeepWalletAdapterConfig = BitgetWalletAdapterConfig;
/**
 * @deprecated Use 'BitgetWalletAdapter' instead."
 */
export declare const BitKeepWalletAdapter: typeof BitgetWalletAdapter;
//# sourceMappingURL=adapter.d.ts.map