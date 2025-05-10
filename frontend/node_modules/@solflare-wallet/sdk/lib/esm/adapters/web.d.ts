import { Cluster, SendOptions } from '@solana/web3.js';
import WalletAdapter from './base';
import { SolflareIframeMessage } from '../types';
export default class WebAdapter extends WalletAdapter {
    private _instance;
    private _provider;
    private _network;
    private _pollTimer;
    get publicKey(): any;
    get connected(): boolean;
    constructor(iframe: HTMLIFrameElement, network: Cluster, provider: string);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    signTransaction(transaction: Uint8Array): Promise<Uint8Array>;
    signAllTransactions(transactions: Uint8Array[]): Promise<Uint8Array[]>;
    signAndSendTransaction(transaction: Uint8Array, options?: SendOptions): Promise<string>;
    signMessage(data: Uint8Array, display?: 'hex' | 'utf8'): Promise<Uint8Array>;
    handleMessage: (data: SolflareIframeMessage) => void;
    private _sendRequest;
    private _handleConnect;
    private _handleDisconnect;
}
