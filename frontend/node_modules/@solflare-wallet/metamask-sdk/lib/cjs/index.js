"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const web3_js_1 = require("@solana/web3.js");
const eventemitter3_1 = __importDefault(require("eventemitter3"));
const bs58_1 = __importDefault(require("bs58"));
const uuid_1 = require("uuid");
const utils_1 = require("./utils");
const detectProvider_1 = require("./detectProvider");
const account_1 = require("./standard/account");
const solana_1 = require("./standard/solana");
__exportStar(require("./types"), exports);
__exportStar(require("./standard/account"), exports);
class SolflareMetaMask extends eventemitter3_1.default {
    constructor(config) {
        super();
        this._network = 'mainnet-beta';
        this._iframeParams = {};
        this._element = null;
        this._iframe = null;
        this._publicKey = null;
        this._account = null;
        this._isConnected = false;
        this._connectHandler = null;
        this._messageHandlers = {};
        this._handleEvent = (event) => {
            var _a, _b;
            switch (event.type) {
                case 'connect': {
                    this._collapseIframe();
                    if ((_a = event.data) === null || _a === void 0 ? void 0 : _a.publicKey) {
                        this._publicKey = event.data.publicKey;
                        this._isConnected = true;
                        if (this._connectHandler) {
                            this._connectHandler.resolve();
                            this._connectHandler = null;
                        }
                        this._connected();
                    }
                    else {
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
                    if ((_b = event.data) === null || _b === void 0 ? void 0 : _b.publicKey) {
                        this._publicKey = event.data.publicKey;
                        this.emit('accountChanged', this.publicKey);
                        this._standardConnected();
                    }
                    else {
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
        this._handleResize = (data) => {
            if (data.resizeMode === 'full') {
                if (data.params.mode === 'fullscreen') {
                    this._expandIframe();
                }
                else if (data.params.mode === 'hide') {
                    this._collapseIframe();
                }
            }
            else if (data.resizeMode === 'coordinates') {
                this._resizeIframe(data.params);
            }
        };
        this._handleMessage = (event) => {
            var _a;
            if (((_a = event.data) === null || _a === void 0 ? void 0 : _a.channel) !== 'solflareIframeToWalletAdapter') {
                return;
            }
            const data = event.data.data || {};
            if (data.type === 'event') {
                this._handleEvent(data.event);
            }
            else if (data.type === 'resize') {
                this._handleResize(data);
            }
            else if (data.type === 'response') {
                if (this._messageHandlers[data.id]) {
                    const { resolve, reject } = this._messageHandlers[data.id];
                    delete this._messageHandlers[data.id];
                    if (data.error) {
                        reject(data.error);
                    }
                    else {
                        resolve(data.result);
                    }
                }
            }
        };
        this._removeElement = () => {
            if (this._element) {
                this._element.remove();
                this._element = null;
            }
        };
        this._removeDanglingElements = () => {
            const elements = document.getElementsByClassName('solflare-metamask-wallet-adapter-iframe');
            for (const element of elements) {
                if (element.parentElement) {
                    element.remove();
                }
            }
        };
        this._injectElement = () => {
            this._removeElement();
            this._removeDanglingElements();
            const params = Object.assign(Object.assign({}, this._iframeParams), { mm: true, v: 1, cluster: this._network || 'mainnet-beta', origin: window.location.origin || '', title: document.title || '' });
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
        this._collapseIframe = () => {
            if (this._iframe) {
                this._iframe.style.top = '';
                this._iframe.style.right = '';
                this._iframe.style.height = '2px';
                this._iframe.style.width = '2px';
            }
        };
        this._expandIframe = () => {
            if (this._iframe) {
                this._iframe.style.top = '0px';
                this._iframe.style.bottom = '0px';
                this._iframe.style.left = '0px';
                this._iframe.style.right = '0px';
                this._iframe.style.width = '100%';
                this._iframe.style.height = '100%';
            }
        };
        this._resizeIframe = (params) => {
            if (!this._iframe) {
                return;
            }
            this._iframe.style.top = isFinite(params.top) ? `${params.top}px` : '';
            this._iframe.style.bottom = isFinite(params.bottom) ? `${params.bottom}px` : '';
            this._iframe.style.left = isFinite(params.left) ? `${params.left}px` : '';
            this._iframe.style.right = isFinite(params.right) ? `${params.right}px` : '';
            this._iframe.style.width = isFinite(params.width)
                ? `${params.width}px`
                : params.width;
            this._iframe.style.height = isFinite(params.height)
                ? `${params.height}px`
                : params.height;
        };
        this._sendIframeMessage = (data) => {
            if (!this.connected || !this.publicKey) {
                throw new Error('Wallet not connected');
            }
            return new Promise((resolve, reject) => {
                var _a, _b;
                const messageId = (0, uuid_1.v4)();
                this._messageHandlers[messageId] = { resolve, reject };
                (_b = (_a = this._iframe) === null || _a === void 0 ? void 0 : _a.contentWindow) === null || _b === void 0 ? void 0 : _b.postMessage({
                    channel: 'solflareWalletAdapterToIframe',
                    data: Object.assign({ id: messageId }, data)
                }, '*');
            });
        };
        this._connected = () => {
            this._isConnected = true;
            this.emit('connect', this.publicKey);
            this._standardConnected();
        };
        this._disconnected = () => {
            this._publicKey = null;
            this._isConnected = false;
            window.removeEventListener('message', this._handleMessage, false);
            this._removeElement();
            this.emit('disconnect');
            this._standardDisconnected();
        };
        this._standardConnected = () => {
            if (!this.publicKey) {
                return;
            }
            const address = this.publicKey.toString();
            if (!this._account || this._account.address !== address) {
                this._account = new account_1.StandardSolflareMetaMaskWalletAccount({
                    address,
                    publicKey: this.publicKey.toBytes()
                });
                this.emit('standard_change', { accounts: this.standardAccounts });
            }
        };
        this._standardDisconnected = () => {
            if (this._account) {
                this._account = null;
                this.emit('standard_change', { accounts: this.standardAccounts });
            }
        };
        if (config === null || config === void 0 ? void 0 : config.network) {
            this._network = config === null || config === void 0 ? void 0 : config.network;
        }
        if (window.SolflareMetaMaskParams) {
            this._iframeParams = Object.assign(Object.assign({}, this._iframeParams), window.SolflareMetaMaskParams);
        }
        if (config === null || config === void 0 ? void 0 : config.params) {
            this._iframeParams = Object.assign(Object.assign({}, this._iframeParams), config === null || config === void 0 ? void 0 : config.params);
        }
    }
    get publicKey() {
        return this._publicKey ? new web3_js_1.PublicKey(this._publicKey) : null;
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
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.connected) {
                return;
            }
            this._injectElement();
            yield new Promise((resolve, reject) => {
                this._connectHandler = { resolve, reject };
            });
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._sendIframeMessage({
                method: 'disconnect'
            });
            this._disconnected();
        });
    }
    signTransaction(transaction) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.connected || !this.publicKey) {
                throw new Error('Wallet not connected');
            }
            try {
                const serializedTransaction = (0, utils_1.serializeTransaction)(transaction);
                const response = yield this._sendIframeMessage({
                    method: 'signTransactionV2',
                    params: {
                        transaction: bs58_1.default.encode(serializedTransaction)
                    }
                });
                const { transaction: signedTransaction } = response;
                return (0, utils_1.isLegacyTransactionInstance)(transaction) ? web3_js_1.Transaction.from(bs58_1.default.decode(signedTransaction)) : web3_js_1.VersionedTransaction.deserialize(bs58_1.default.decode(signedTransaction));
            }
            catch (e) {
                throw new Error(((_a = e === null || e === void 0 ? void 0 : e.toString) === null || _a === void 0 ? void 0 : _a.call(e)) || 'Failed to sign transaction');
            }
        });
    }
    signAllTransactions(transactions) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.connected || !this.publicKey) {
                throw new Error('Wallet not connected');
            }
            try {
                const serializedTransactions = transactions.map((transaction) => (0, utils_1.serializeTransaction)(transaction));
                const { transactions: signedTransactions } = yield this._sendIframeMessage({
                    method: 'signAllTransactionsV2',
                    params: {
                        transactions: serializedTransactions.map((transaction) => bs58_1.default.encode(transaction))
                    }
                });
                return signedTransactions.map((signedTransaction, index) => {
                    return (0, utils_1.isLegacyTransactionInstance)(transactions[index]) ? web3_js_1.Transaction.from(bs58_1.default.decode(signedTransaction)) : web3_js_1.VersionedTransaction.deserialize(bs58_1.default.decode(signedTransaction));
                });
            }
            catch (e) {
                throw new Error(((_a = e === null || e === void 0 ? void 0 : e.toString) === null || _a === void 0 ? void 0 : _a.call(e)) || 'Failed to sign transactions');
            }
        });
    }
    signAndSendTransaction(transaction, options) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.connected || !this.publicKey) {
                throw new Error('Wallet not connected');
            }
            try {
                const serializedTransaction = (0, utils_1.serializeTransaction)(transaction);
                const { signature } = yield this._sendIframeMessage({
                    method: 'signAndSendTransaction',
                    params: {
                        transaction: bs58_1.default.encode(serializedTransaction),
                        options
                    }
                });
                return signature;
            }
            catch (e) {
                throw new Error(((_a = e === null || e === void 0 ? void 0 : e.toString) === null || _a === void 0 ? void 0 : _a.call(e)) || 'Failed to sign and send transaction');
            }
        });
    }
    signMessage(data, display = 'utf8') {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.connected || !this.publicKey) {
                throw new Error('Wallet not connected');
            }
            try {
                const { signature } = yield this._sendIframeMessage({
                    method: 'signMessage',
                    params: {
                        data: bs58_1.default.encode(data),
                        display
                    }
                });
                return Uint8Array.from(bs58_1.default.decode(signature));
            }
            catch (e) {
                throw new Error(((_a = e === null || e === void 0 ? void 0 : e.toString) === null || _a === void 0 ? void 0 : _a.call(e)) || 'Failed to sign message');
            }
        });
    }
    sign(data, display = 'utf8') {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.signMessage(data, display);
        });
    }
    static isSupported() {
        return __awaiter(this, void 0, void 0, function* () {
            const provider = yield (0, detectProvider_1.detectProvider)();
            return !!provider;
        });
    }
    standardSignAndSendTransaction(...inputs) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.connected)
                throw new Error('not connected');
            const outputs = [];
            if (inputs.length === 1) {
                const { transaction, account, chain, options } = inputs[0];
                const { minContextSlot, preflightCommitment, skipPreflight, maxRetries } = options || {};
                if (account !== this._account)
                    throw new Error('invalid account');
                if (!(0, solana_1.isSolanaChain)(chain))
                    throw new Error('invalid chain');
                const signature = yield this.signAndSendTransaction(web3_js_1.VersionedTransaction.deserialize(transaction), {
                    preflightCommitment,
                    minContextSlot,
                    maxRetries,
                    skipPreflight
                });
                outputs.push({ signature: bs58_1.default.decode(signature) });
            }
            else if (inputs.length > 1) {
                for (const input of inputs) {
                    outputs.push(...(yield this.standardSignAndSendTransaction(input)));
                }
            }
            return outputs;
        });
    }
    standardSignTransaction(...inputs) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.connected)
                throw new Error('not connected');
            const outputs = [];
            if (inputs.length === 1) {
                const { transaction, account, chain } = inputs[0];
                if (account !== this._account)
                    throw new Error('invalid account');
                if (chain && !(0, solana_1.isSolanaChain)(chain))
                    throw new Error('invalid chain');
                const signedTransaction = yield this.signTransaction(web3_js_1.VersionedTransaction.deserialize(transaction));
                outputs.push({ signedTransaction: signedTransaction.serialize() });
            }
            else if (inputs.length > 1) {
                let chain;
                for (const input of inputs) {
                    if (input.account !== this._account)
                        throw new Error('invalid account');
                    if (input.chain) {
                        if (!(0, solana_1.isSolanaChain)(input.chain))
                            throw new Error('invalid chain');
                        if (chain) {
                            if (input.chain !== chain)
                                throw new Error('conflicting chain');
                        }
                        else {
                            chain = input.chain;
                        }
                    }
                }
                const transactions = inputs.map(({ transaction }) => web3_js_1.VersionedTransaction.deserialize(transaction));
                const signedTransactions = yield this.signAllTransactions(transactions);
                outputs.push(...signedTransactions.map((signedTransaction) => ({
                    signedTransaction: signedTransaction.serialize()
                })));
            }
            return outputs;
        });
    }
    standardSignMessage(...inputs) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.connected)
                throw new Error('not connected');
            const outputs = [];
            if (inputs.length === 1) {
                const { message, account } = inputs[0];
                if (account !== this._account)
                    throw new Error('invalid account');
                const signature = yield this.signMessage(message);
                outputs.push({ signedMessage: message, signature });
            }
            else if (inputs.length > 1) {
                for (const input of inputs) {
                    outputs.push(...(yield this.standardSignMessage(input)));
                }
            }
            return outputs;
        });
    }
}
SolflareMetaMask.IFRAME_URL = 'https://widget.solflare.com/';
exports.default = SolflareMetaMask;
