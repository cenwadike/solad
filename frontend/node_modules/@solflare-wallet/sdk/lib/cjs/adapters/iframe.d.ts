import { SolflareIframeResponseMessage } from '../types';
import { PublicKey, SendOptions } from '@solana/web3.js';
import WalletAdapter from './base';
export default class IframeAdapter extends WalletAdapter {
    private _iframe;
    private _publicKey;
    private _messageHandlers;
    get publicKey(): PublicKey | null;
    get connected(): boolean;
    constructor(iframe: HTMLIFrameElement, publicKey: any);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    signTransaction(transaction: Uint8Array): Promise<Uint8Array>;
    signAllTransactions(transactions: Uint8Array[]): Promise<Uint8Array[]>;
    signAndSendTransaction(transaction: Uint8Array, options?: SendOptions): Promise<string>;
    signMessage(data: Uint8Array, display?: 'hex' | 'utf8'): Promise<Uint8Array>;
    handleMessage: (data: SolflareIframeResponseMessage) => void;
    private _sendMessage;
}
