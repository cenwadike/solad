import { type ChainNamespace } from '@reown/appkit-common';
import type { ChainAdapter } from '@reown/appkit-controllers';
import { AccountController } from '@reown/appkit-controllers';
import type { AdapterBlueprint } from '../adapters/ChainAdapterBlueprint.js';
import { AppKitBaseClient } from './appkit-base-client.js';
declare global {
    interface Window {
        ethereum?: Record<string, unknown>;
    }
}
export { AccountController };
export interface OpenOptions {
    view?: 'Account' | 'Connect' | 'Networks' | 'ApproveTransaction' | 'OnRampProviders' | 'ConnectingWalletConnectBasic' | 'Swap' | 'WhatIsAWallet' | 'WhatIsANetwork' | 'AllWallets' | 'WalletSend';
    uri?: string;
}
export declare class AppKit extends AppKitBaseClient {
    activeAdapter?: AdapterBlueprint;
    adapters?: ChainAdapter[];
    activeChainNamespace?: ChainNamespace;
    adapter?: ChainAdapter;
    open(options?: OpenOptions): Promise<void>;
    close(): Promise<void>;
    syncIdentity(_request: Pick<AdapterBlueprint.ConnectResult, 'address' | 'chainId'> & {
        chainNamespace: ChainNamespace;
    }): Promise<void>;
    syncBalance(_params: {
        address: string;
        chainId: string | number | undefined;
        chainNamespace: ChainNamespace;
    }): Promise<void>;
    protected injectModalUi(): Promise<void>;
}
