import { Cluster, PublicKey, SendOptions, Transaction, VersionedTransaction } from '@solana/web3.js';
import {
  MessageHandlers,
  PromiseCallback,
  SolflareMetaMaskConfig,
  SolflareIframeEvent,
  SolflareIframeMessage,
  SolflareIframeRequest,
  SolflareIframeResizeCoordinates,
  SolflareIframeResizeMessage,
  TransactionOrVersionedTransaction,
  WindowWithParams
} from './types';
import EventEmitter from 'eventemitter3';
import bs58 from 'bs58';
import { v4 as uuidv4 } from 'uuid';
import { isLegacyTransactionInstance, serializeTransaction } from './utils';
import { detectProvider } from './detectProvider';
import {
  SolanaSignAndSendTransactionInput,
  SolanaSignAndSendTransactionOutput,
  SolanaSignMessageInput,
  SolanaSignMessageOutput,
  SolanaSignTransactionInput,
  SolanaSignTransactionOutput
} from '@solana/wallet-standard-features';
import { StandardSolflareMetaMaskWalletAccount } from './standard/account';
import { isSolanaChain, SolanaChain } from './standard/solana';

export * from './types';
export * from './standard/account';

export default class SolflareMetaMask extends EventEmitter {
  private _network: Cluster = 'mainnet-beta';
  private _iframeParams: Record<string, any> = {};
  private _element: HTMLElement | null = null;
  private _iframe: HTMLIFrameElement | null = null;
  private _publicKey: string | null = null;
  private _account: StandardSolflareMetaMaskWalletAccount | null = null;
  private _isConnected = false;
  private _connectHandler: { resolve: PromiseCallback; reject: PromiseCallback } | null = null;
  private _messageHandlers: MessageHandlers = {};

  private static IFRAME_URL = 'https://widget.solflare.com/';

  constructor(config?: SolflareMetaMaskConfig) {
    super();

    if (config?.network) {
      this._network = config?.network;
    }

    if ((window as WindowWithParams).SolflareMetaMaskParams) {
      this._iframeParams = {
        ...this._iframeParams,
        ...(window as WindowWithParams).SolflareMetaMaskParams
      };
    }

    if (config?.params) {
      this._iframeParams = {
        ...this._iframeParams,
        ...config?.params
      };
    }
  }

  get publicKey() {
    return this._publicKey ? new PublicKey(this._publicKey) : null;
  }

  get standardAccount() {
    return this._account;
  }

  get standardAccounts() {
    return this._account ? [this._account] : [];
  }

  get isConnected() {
    return this._isConnected;
  }

  get connected() {
    return this.isConnected;
  }

  get autoApprove() {
    return false;
  }

  async connect() {
    if (this.connected) {
      return;
    }

    this._injectElement();

    await new Promise((resolve, reject) => {
      this._connectHandler = { resolve, reject };
    });
  }

  async disconnect() {
    await this._sendIframeMessage({
      method: 'disconnect'
    });

    this._disconnected();
  }

  async signTransaction(
    transaction: TransactionOrVersionedTransaction
  ): Promise<TransactionOrVersionedTransaction> {
    if (!this.connected || !this.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const serializedTransaction = serializeTransaction(transaction);

      const response = await this._sendIframeMessage<{
        publicKey: string;
        transaction: string;
      }>({
        method: 'signTransactionV2',
        params: {
          transaction: bs58.encode(serializedTransaction)
        }
      });

      const { transaction: signedTransaction } = response;

      return isLegacyTransactionInstance(transaction) ? Transaction.from(bs58.decode(signedTransaction)) : VersionedTransaction.deserialize(bs58.decode(signedTransaction));
    } catch (e) {
      throw new Error(e?.toString?.() || 'Failed to sign transaction');
    }
  }

  async signAllTransactions(
    transactions: TransactionOrVersionedTransaction[]
  ): Promise<TransactionOrVersionedTransaction[]> {
    if (!this.connected || !this.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const serializedTransactions = transactions.map((transaction) =>
        serializeTransaction(transaction)
      );

      const { transactions: signedTransactions } = await this._sendIframeMessage<{
        publicKey: string;
        transactions: string[];
      }>({
        method: 'signAllTransactionsV2',
        params: {
          transactions: serializedTransactions.map((transaction) => bs58.encode(transaction))
        }
      });


      return signedTransactions.map((signedTransaction, index) => {
        return isLegacyTransactionInstance(transactions[index]) ? Transaction.from(bs58.decode(signedTransaction)) : VersionedTransaction.deserialize(bs58.decode(signedTransaction));
      });
    } catch (e) {
      throw new Error(e?.toString?.() || 'Failed to sign transactions');
    }
  }

  async signAndSendTransaction(
    transaction: TransactionOrVersionedTransaction,
    options?: SendOptions
  ): Promise<string> {
    if (!this.connected || !this.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const serializedTransaction = serializeTransaction(transaction);

      const { signature } = await this._sendIframeMessage<{ publicKey: string; signature: string }>(
        {
          method: 'signAndSendTransaction',
          params: {
            transaction: bs58.encode(serializedTransaction),
            options
          }
        }
      );

      return signature;
    } catch (e) {
      throw new Error(e?.toString?.() || 'Failed to sign and send transaction');
    }
  }

  async signMessage(data: Uint8Array, display: 'hex' | 'utf8' = 'utf8'): Promise<Uint8Array> {
    if (!this.connected || !this.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const { signature } = await this._sendIframeMessage<{ publicKey: string; signature: string }>(
        {
          method: 'signMessage',
          params: {
            data: bs58.encode(data),
            display
          }
        }
      );

      return Uint8Array.from(bs58.decode(signature));
    } catch (e) {
      throw new Error(e?.toString?.() || 'Failed to sign message');
    }
  }

  async sign(data: Uint8Array, display: 'hex' | 'utf8' = 'utf8'): Promise<Uint8Array> {
    return await this.signMessage(data, display);
  }

  static async isSupported(): Promise<boolean> {
    const provider = await detectProvider();
    return !!provider;
  }

  private _handleEvent = (event: SolflareIframeEvent) => {
    switch (event.type) {
      case 'connect': {
        this._collapseIframe();

        if (event.data?.publicKey) {
          this._publicKey = event.data.publicKey;

          this._isConnected = true;

          if (this._connectHandler) {
            this._connectHandler.resolve();
            this._connectHandler = null;
          }

          this._connected();
        } else {
          if (this._connectHandler) {
            this._connectHandler.reject();
            this._connectHandler = null;
          }

          this._disconnected();
        }
        return;
      }
      case 'disconnect': {
        if (this._connectHandler) {
          this._connectHandler.reject();
          this._connectHandler = null;
        }

        this._disconnected();

        return;
      }
      case 'accountChanged': {
        if (event.data?.publicKey) {
          this._publicKey = event.data.publicKey;

          this.emit('accountChanged', this.publicKey);

          this._standardConnected();
        } else {
          this.emit('accountChanged', undefined);

          this._standardDisconnected();
        }

        return;
      }
      default: {
        return;
      }
    }
  };

  private _handleResize = (data: SolflareIframeResizeMessage) => {
    if (data.resizeMode === 'full') {
      if (data.params.mode === 'fullscreen') {
        this._expandIframe();
      } else if (data.params.mode === 'hide') {
        this._collapseIframe();
      }
    } else if (data.resizeMode === 'coordinates') {
      this._resizeIframe(data.params);
    }
  };

  private _handleMessage = (event: MessageEvent) => {
    if (event.data?.channel !== 'solflareIframeToWalletAdapter') {
      return;
    }

    const data: SolflareIframeMessage = event.data.data || {};

    if (data.type === 'event') {
      this._handleEvent(data.event);
    } else if (data.type === 'resize') {
      this._handleResize(data);
    } else if (data.type === 'response') {
      if (this._messageHandlers[data.id]) {
        const { resolve, reject } = this._messageHandlers[data.id];

        delete this._messageHandlers[data.id];

        if (data.error) {
          reject(data.error);
        } else {
          resolve(data.result);
        }
      }
    }
  };

  private _removeElement = () => {
    if (this._element) {
      this._element.remove();
      this._element = null;
    }
  };

  private _removeDanglingElements = () => {
    const elements = document.getElementsByClassName('solflare-metamask-wallet-adapter-iframe');
    for (const element of elements) {
      if (element.parentElement) {
        element.remove();
      }
    }
  };

  private _injectElement = () => {
    this._removeElement();
    this._removeDanglingElements();

    const params = {
      ...this._iframeParams,
      mm: true,
      v: 1,
      cluster: this._network || 'mainnet-beta',
      origin: window.location.origin || '',
      title: document.title || ''
    };

    const queryString = Object.keys(params)
      .map((key) => `${key}=${encodeURIComponent(params[key])}`)
      .join('&');

    const iframeUrl = `${SolflareMetaMask.IFRAME_URL}?${queryString}`;

    this._element = document.createElement('div');
    this._element.className = 'solflare-metamask-wallet-adapter-iframe';
    this._element.innerHTML = `
      <iframe src='${iframeUrl}' style='position: fixed; top: 0; bottom: 0; left: 0; right: 0; width: 100%; height: 100%; border: none; border-radius: 0; z-index: 99999; color-scheme: auto;' allowtransparency='true'></iframe>
    `;
    document.body.appendChild(this._element);
    this._iframe = this._element.querySelector('iframe');

    window.addEventListener('message', this._handleMessage, false);
  };

  private _collapseIframe = () => {
    if (this._iframe) {
      this._iframe.style.top = '';
      this._iframe.style.right = '';
      this._iframe.style.height = '2px';
      this._iframe.style.width = '2px';
    }
  };

  private _expandIframe = () => {
    if (this._iframe) {
      this._iframe.style.top = '0px';
      this._iframe.style.bottom = '0px';
      this._iframe.style.left = '0px';
      this._iframe.style.right = '0px';
      this._iframe.style.width = '100%';
      this._iframe.style.height = '100%';
    }
  };

  private _resizeIframe = (params: SolflareIframeResizeCoordinates) => {
    if (!this._iframe) {
      return;
    }
    this._iframe.style.top = isFinite(params.top as number) ? `${params.top}px` : '';
    this._iframe.style.bottom = isFinite(params.bottom as number) ? `${params.bottom}px` : '';
    this._iframe.style.left = isFinite(params.left as number) ? `${params.left}px` : '';
    this._iframe.style.right = isFinite(params.right as number) ? `${params.right}px` : '';
    this._iframe.style.width = isFinite(params.width as number)
      ? `${params.width}px`
      : (params.width as string);
    this._iframe.style.height = isFinite(params.height as number)
      ? `${params.height}px`
      : (params.height as string);
  };

  private _sendIframeMessage = <T = any>(data: SolflareIframeRequest): Promise<T> => {
    if (!this.connected || !this.publicKey) {
      throw new Error('Wallet not connected');
    }

    return new Promise((resolve, reject) => {
      const messageId = uuidv4();

      this._messageHandlers[messageId] = { resolve, reject };

      this._iframe?.contentWindow?.postMessage(
        {
          channel: 'solflareWalletAdapterToIframe',
          data: { id: messageId, ...data }
        },
        '*'
      );
    });
  };

  private _connected = () => {
    this._isConnected = true;

    this.emit('connect', this.publicKey);

    this._standardConnected();
  };

  private _disconnected = () => {
    this._publicKey = null;
    this._isConnected = false;

    window.removeEventListener('message', this._handleMessage, false);
    this._removeElement();

    this.emit('disconnect');

    this._standardDisconnected();
  };

  private _standardConnected = () => {
    if (!this.publicKey) {
      return;
    }

    const address = this.publicKey.toString();

    if (!this._account || this._account.address !== address) {
      this._account = new StandardSolflareMetaMaskWalletAccount({
        address,
        publicKey: this.publicKey.toBytes()
      });
      this.emit('standard_change', { accounts: this.standardAccounts });
    }
  };

  private _standardDisconnected = () => {
    if (this._account) {
      this._account = null;
      this.emit('standard_change', { accounts: this.standardAccounts });
    }
  };

  async standardSignAndSendTransaction(...inputs: SolanaSignAndSendTransactionInput[]) {
    if (!this.connected) throw new Error('not connected');

    const outputs: SolanaSignAndSendTransactionOutput[] = [];

    if (inputs.length === 1) {
      const { transaction, account, chain, options } = inputs[0]!;
      const { minContextSlot, preflightCommitment, skipPreflight, maxRetries } = options || {};
      if (account !== this._account) throw new Error('invalid account');
      if (!isSolanaChain(chain)) throw new Error('invalid chain');

      const signature = await this.signAndSendTransaction(
        VersionedTransaction.deserialize(transaction),
        {
          preflightCommitment,
          minContextSlot,
          maxRetries,
          skipPreflight
        }
      );

      outputs.push({ signature: bs58.decode(signature) });
    } else if (inputs.length > 1) {
      for (const input of inputs) {
        outputs.push(...(await this.standardSignAndSendTransaction(input)));
      }
    }

    return outputs;
  }

  async standardSignTransaction(...inputs: SolanaSignTransactionInput[]) {
    if (!this.connected) throw new Error('not connected');

    const outputs: SolanaSignTransactionOutput[] = [];

    if (inputs.length === 1) {
      const { transaction, account, chain } = inputs[0]!;
      if (account !== this._account) throw new Error('invalid account');
      if (chain && !isSolanaChain(chain)) throw new Error('invalid chain');

      const signedTransaction = await this.signTransaction(
        VersionedTransaction.deserialize(transaction)
      );

      outputs.push({ signedTransaction: signedTransaction.serialize() });
    } else if (inputs.length > 1) {
      let chain: SolanaChain | undefined;
      for (const input of inputs) {
        if (input.account !== this._account) throw new Error('invalid account');
        if (input.chain) {
          if (!isSolanaChain(input.chain)) throw new Error('invalid chain');
          if (chain) {
            if (input.chain !== chain) throw new Error('conflicting chain');
          } else {
            chain = input.chain;
          }
        }
      }

      const transactions = inputs.map(({ transaction }) =>
        VersionedTransaction.deserialize(transaction)
      );

      const signedTransactions = await this.signAllTransactions(transactions);

      outputs.push(
        ...signedTransactions.map((signedTransaction) => ({
          signedTransaction: signedTransaction.serialize()
        }))
      );
    }

    return outputs;
  }

  async standardSignMessage(...inputs: SolanaSignMessageInput[]) {
    if (!this.connected) throw new Error('not connected');

    const outputs: SolanaSignMessageOutput[] = [];

    if (inputs.length === 1) {
      const { message, account } = inputs[0]!;
      if (account !== this._account) throw new Error('invalid account');

      const signature = await this.signMessage(message);

      outputs.push({ signedMessage: message, signature });
    } else if (inputs.length > 1) {
      for (const input of inputs) {
        outputs.push(...(await this.standardSignMessage(input)));
      }
    }

    return outputs;
  }
}
