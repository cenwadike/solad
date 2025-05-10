"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrustWalletAdapter = exports.TrustWalletName = void 0;
const wallet_adapter_base_1 = require("@solana/wallet-adapter-base");
const web3_js_1 = require("@solana/web3.js");
exports.TrustWalletName = 'Trust';
class TrustWalletAdapter extends wallet_adapter_base_1.BaseMessageSignerWalletAdapter {
    constructor(config = {}) {
        super();
        this.name = exports.TrustWalletName;
        this.url = 'https://trustwallet.com';
        this.icon = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48c3ZnIGlkPSJMYXllcl8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB2aWV3Qm94PSIwIDAgMTkyMCAxMDgwIj48ZGVmcz48c3R5bGU+LmNscy0xe2ZpbGw6dXJsKCNsaW5lYXItZ3JhZGllbnQpO30uY2xzLTJ7ZmlsbDojMDUwMGZmO308L3N0eWxlPjxsaW5lYXJHcmFkaWVudCBpZD0ibGluZWFyLWdyYWRpZW50IiB4MT0iMTEyMy4yNiIgeTE9IjE4NjUuNzgiIHgyPSI5NTQuNjEiIHkyPSIxMzM3LjUiIGdyYWRpZW50VHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCAyMTgyKSBzY2FsZSgxIC0xKSIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPjxzdG9wIG9mZnNldD0iLjAyIiBzdG9wLWNvbG9yPSJibHVlIi8+PHN0b3Agb2Zmc2V0PSIuMDgiIHN0b3AtY29sb3I9IiMwMDk0ZmYiLz48c3RvcCBvZmZzZXQ9Ii4xNiIgc3RvcC1jb2xvcj0iIzQ4ZmY5MSIvPjxzdG9wIG9mZnNldD0iLjQyIiBzdG9wLWNvbG9yPSIjMDA5NGZmIi8+PHN0b3Agb2Zmc2V0PSIuNjgiIHN0b3AtY29sb3I9IiMwMDM4ZmYiLz48c3RvcCBvZmZzZXQ9Ii45IiBzdG9wLWNvbG9yPSIjMDUwMGZmIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHBhdGggY2xhc3M9ImNscy0yIiBkPSJtNzM4LjcxLDQyMy40MWwyMjEuNDUtNzIuM3Y1MDAuNTJjLTE1OC4xOC02Ni43NC0yMjEuNDUtMTk0LjY1LTIyMS40NS0yNjYuOTR2LTE2MS4yOFoiLz48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Im0xMTgxLjYyLDQyMy40MWwtMjIxLjQ1LTcyLjN2NTAwLjUyYzE1OC4xOC02Ni43NCwyMjEuNDUtMTk0LjY1LDIyMS40NS0yNjYuOTR2LTE2MS4yOFoiLz48cGF0aCBjbGFzcz0iY2xzLTIiIGQ9Im04MjUuOTEsMjMwLjg1aDMwLjl2MTcuMzFjMTAuMTMtMTUuNTYsMjEuNzgtMTcuMzEsMzguODQtMTcuMzF2MzAuNmgtNy43N2MtMjAuNDQsMC0zMC4yMyw5LjYyLTMwLjIzLDI4LjY3djMyLjUyaC0zMS43NXYtOTEuNzlaIi8+PHBhdGggY2xhc3M9ImNscy0yIiBkPSJtOTk4Ljc4LDMyMi42M2gtMzEuNzV2LTguNzVjLTYuOTMsOC4wNS0xNi4zOCwxMS41NC0yOC4wMywxMS41NC0yMi4xMiwwLTM0LjYyLTEzLjExLTM0LjYyLTM3LjI0di01Ny4zNGgzMS43NXY1MC4xOGMwLDExLjM2LDUuNTcsMTgsMTUuMDIsMThzMTUuODgtNi40NywxNS44OC0xNy40OHYtNTAuN2gzMS43NXY5MS43OVoiLz48cGF0aCBjbGFzcz0iY2xzLTIiIGQ9Im0xMDA2LjU0LDI5NC4zaDI5LjczYzEuMzYsNi42NCw1LjkxLDkuNDMsMTYuODgsOS40Myw4Ljk1LDAsMTQuMTktMi4wOSwxNC4xOS01Ljk0LDAtMi45OC0yLjU0LTQuOS05Ljc5LTYuNDdsLTIzLjk4LTUuNDJjLTE2LjA0LTMuNjYtMjQuMTUtMTIuOTMtMjQuMTUtMjcuOCwwLTE5LjU5LDE0LjM1LTI5LjczLDQyLjIxLTI5LjczczQxLjU0LDkuODgsNDMuOTEsMzEuMDRoLTI5LjU1Yy0uNS01LjU5LTYuMjUtOS4wMS0xNS43LTkuMDEtNy41OSwwLTEyLjQ5LDIuNDQtMTIuNDksNi4xMiwwLDMuMTQsMy4yLDUuNTksOS42Myw3LjE4bDI1LjE2LDYuMTJjMTYuNTQsNC4wMSwyNC40OSwxMi40MSwyNC40OSwyNi4wNSwwLDE4Ljg5LTE2LjM4LDMwLjA4LTQ0LjIzLDMwLjA4cy00Ni4yNy0xMi4wNi00Ni4yNy0zMS42NWgtLjAzWiIvPjxwYXRoIGNsYXNzPSJjbHMtMiIgZD0ibTExODEuNjIsMjU5LjR2LTI4LjU1aC03OC4zNXYyOC41NmgyMy4zOHY2My4yMmgzMS41OHYtNjMuMjRoMjMuMzlaIi8+PHBhdGggY2xhc3M9ImNscy0yIiBkPSJtODE3LjA4LDI1OS40di0yOC41NWgtNzguMzV2MjguNTZoMjMuMzh2NjMuMjJoMzEuNTh2LTYzLjI0aDIzLjM4WiIvPjwvc3ZnPg==';
        this.supportedTransactionVersions = null;
        this._readyState = typeof window === 'undefined' || typeof document === 'undefined'
            ? wallet_adapter_base_1.WalletReadyState.Unsupported
            : wallet_adapter_base_1.WalletReadyState.NotDetected;
        this._disconnected = () => {
            const wallet = this._wallet;
            if (wallet) {
                wallet.off('disconnect', this._disconnected);
                this._wallet = null;
                this._publicKey = null;
                this.emit('error', new wallet_adapter_base_1.WalletDisconnectedError());
                this.emit('disconnect');
            }
        };
        this._connecting = false;
        this._wallet = null;
        this._publicKey = null;
        if (this._readyState !== wallet_adapter_base_1.WalletReadyState.Unsupported) {
            (0, wallet_adapter_base_1.scopePollingDetectionStrategy)(() => {
                var _a, _b;
                if ((_b = (_a = window.trustwallet) === null || _a === void 0 ? void 0 : _a.solana) === null || _b === void 0 ? void 0 : _b.isTrust) {
                    this._readyState = wallet_adapter_base_1.WalletReadyState.Installed;
                    this.emit('readyStateChange', this._readyState);
                    return true;
                }
                return false;
            });
        }
    }
    get publicKey() {
        return this._publicKey;
    }
    get connecting() {
        return this._connecting;
    }
    get connected() {
        var _a;
        return !!((_a = this._wallet) === null || _a === void 0 ? void 0 : _a.isConnected);
    }
    get readyState() {
        return this._readyState;
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.connected || this.connecting)
                    return;
                if (this._readyState !== wallet_adapter_base_1.WalletReadyState.Installed)
                    throw new wallet_adapter_base_1.WalletNotReadyError();
                this._connecting = true;
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const wallet = window.trustwallet.solana;
                if (!wallet.isConnected) {
                    try {
                        yield wallet.connect();
                    }
                    catch (error) {
                        throw new wallet_adapter_base_1.WalletConnectionError(error === null || error === void 0 ? void 0 : error.message, error);
                    }
                }
                if (!wallet.publicKey)
                    throw new wallet_adapter_base_1.WalletAccountError();
                let publicKey;
                try {
                    publicKey = new web3_js_1.PublicKey(wallet.publicKey.toBytes());
                }
                catch (error) {
                    throw new wallet_adapter_base_1.WalletPublicKeyError(error === null || error === void 0 ? void 0 : error.message, error);
                }
                wallet.on('disconnect', this._disconnected);
                this._wallet = wallet;
                this._publicKey = publicKey;
                this.emit('connect', publicKey);
            }
            catch (error) {
                this.emit('error', error);
                throw error;
            }
            finally {
                this._connecting = false;
            }
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            const wallet = this._wallet;
            if (wallet) {
                wallet.off('disconnect', this._disconnected);
                this._wallet = null;
                this._publicKey = null;
                try {
                    yield wallet.disconnect();
                }
                catch (error) {
                    this.emit('error', new wallet_adapter_base_1.WalletDisconnectionError(error === null || error === void 0 ? void 0 : error.message, error));
                }
            }
            this.emit('disconnect');
        });
    }
    sendTransaction(transaction_1, connection_1) {
        return __awaiter(this, arguments, void 0, function* (transaction, connection, options = {}) {
            try {
                const wallet = this._wallet;
                if (!wallet)
                    throw new wallet_adapter_base_1.WalletNotConnectedError();
                try {
                    const { signers } = options, sendOptions = __rest(options, ["signers"]);
                    transaction = yield this.prepareTransaction(transaction, connection, sendOptions);
                    (signers === null || signers === void 0 ? void 0 : signers.length) && transaction.partialSign(...signers);
                    sendOptions.preflightCommitment = sendOptions.preflightCommitment || connection.commitment;
                    const { signature } = yield wallet.signAndSendTransaction(transaction, sendOptions);
                    return signature;
                }
                catch (error) {
                    if (error instanceof wallet_adapter_base_1.WalletError)
                        throw error;
                    throw new wallet_adapter_base_1.WalletSendTransactionError(error === null || error === void 0 ? void 0 : error.message, error);
                }
            }
            catch (error) {
                this.emit('error', error);
                throw error;
            }
        });
    }
    signTransaction(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const wallet = this._wallet;
                if (!wallet)
                    throw new wallet_adapter_base_1.WalletNotConnectedError();
                try {
                    return (yield wallet.signTransaction(transaction)) || transaction;
                }
                catch (error) {
                    throw new wallet_adapter_base_1.WalletSignTransactionError(error === null || error === void 0 ? void 0 : error.message, error);
                }
            }
            catch (error) {
                this.emit('error', error);
                throw error;
            }
        });
    }
    signAllTransactions(transactions) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const wallet = this._wallet;
                if (!wallet)
                    throw new wallet_adapter_base_1.WalletNotConnectedError();
                try {
                    return (yield wallet.signAllTransactions(transactions)) || transactions;
                }
                catch (error) {
                    throw new wallet_adapter_base_1.WalletSignTransactionError(error === null || error === void 0 ? void 0 : error.message, error);
                }
            }
            catch (error) {
                this.emit('error', error);
                throw error;
            }
        });
    }
    signMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const wallet = this._wallet;
                if (!wallet)
                    throw new wallet_adapter_base_1.WalletNotConnectedError();
                try {
                    const { signature } = yield wallet.signMessage(message);
                    return signature;
                }
                catch (error) {
                    throw new wallet_adapter_base_1.WalletSignMessageError(error === null || error === void 0 ? void 0 : error.message, error);
                }
            }
            catch (error) {
                this.emit('error', error);
                throw error;
            }
        });
    }
}
exports.TrustWalletAdapter = TrustWalletAdapter;
//# sourceMappingURL=adapter.js.map