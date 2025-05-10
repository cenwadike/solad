import type { WalletName } from '@solana/wallet-adapter-base';
import { BaseSignerWalletAdapter, WalletAdapterNetwork, WalletReadyState } from '@solana/wallet-adapter-base';
import type { PublicKey, Transaction, TransactionVersion, VersionedTransaction } from '@solana/web3.js';
import type { WalletConnectWalletAdapterConfig as BaseWalletConnectWalletAdapterConfig } from './types.js';
export declare const WalletConnectWalletName: WalletName<"WalletConnect">;
export type WalletConnectWalletAdapterConfig = {
    network: WalletAdapterNetwork.Mainnet | WalletAdapterNetwork.Devnet;
} & Pick<BaseWalletConnectWalletAdapterConfig, 'options'>;
export declare class WalletConnectWalletAdapter extends BaseSignerWalletAdapter {
    name: WalletName<"WalletConnect">;
    url: string;
    icon: string;
    readonly supportedTransactionVersions: ReadonlySet<TransactionVersion>;
    private _publicKey;
    private _connecting;
    private _wallet;
    private _config;
    private _readyState;
    private _onDisconnect;
    constructor(config: WalletConnectWalletAdapterConfig);
    get publicKey(): PublicKey | null;
    get connecting(): boolean;
    get readyState(): WalletReadyState;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    signTransaction<T extends Transaction | VersionedTransaction>(transaction: T): Promise<T>;
    signMessage(message: Uint8Array): Promise<Uint8Array>;
    signAndSendTransaction<T extends Transaction | VersionedTransaction>(transaction: T): Promise<string>;
    signAllTransactions<T extends Transaction | VersionedTransaction>(transactions: T[]): Promise<T[]>;
}
//# sourceMappingURL=adapter.d.ts.map