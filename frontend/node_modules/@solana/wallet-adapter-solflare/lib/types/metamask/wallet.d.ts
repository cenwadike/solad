import { type SolanaSignAndSendTransactionFeature, type SolanaSignMessageFeature, type SolanaSignTransactionFeature } from '@solana/wallet-standard-features';
import type { Wallet } from '@wallet-standard/base';
import { type StandardConnectFeature, type StandardDisconnectFeature, type StandardEventsFeature } from '@wallet-standard/features';
export declare class SolflareMetaMaskWallet implements Wallet {
    #private;
    get version(): "1.0.0";
    get name(): "MetaMask";
    get icon(): `data:image/svg+xml;base64,${string}` | `data:image/webp;base64,${string}` | `data:image/png;base64,${string}` | `data:image/gif;base64,${string}`;
    get chains(): readonly ["solana:mainnet", "solana:devnet", "solana:testnet"];
    get features(): StandardConnectFeature & StandardDisconnectFeature & StandardEventsFeature & SolanaSignAndSendTransactionFeature & SolanaSignTransactionFeature & SolanaSignMessageFeature;
    get accounts(): import("@solflare-wallet/metamask-sdk").StandardSolflareMetaMaskWalletAccount[];
}
//# sourceMappingURL=wallet.d.ts.map