export default class Wallet extends EventEmitter<string | symbol, any> {
    constructor(provider: any, network: any);
    _injectedProvider: any;
    _providerUrl: URL | undefined;
    _network: any;
    _publicKey: any;
    _autoApprove: boolean;
    _popup: Window | null;
    _handlerAdded: boolean;
    _nextRequestId: number;
    _responsePromises: Map<any, any>;
    _handleMessage: (e: any) => void;
    _handleConnect: () => Promise<any>;
    _handleDisconnect: () => void;
    _sendRequest: (method: any, params: any) => Promise<any>;
    get publicKey(): any;
    get connected(): boolean;
    get autoApprove(): boolean;
    connect: () => Promise<any>;
    disconnect: () => Promise<void>;
    sign: (data: any, display: any) => Promise<{
        signature: Uint8Array;
        publicKey: PublicKey;
    }>;
}
import EventEmitter from 'eventemitter3';
import { PublicKey } from '@solana/web3.js';
