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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnsafeBurnerWalletAdapter = exports.UnsafeBurnerWalletName = void 0;
const ed25519_1 = require("@noble/curves/ed25519");
const wallet_adapter_base_1 = require("@solana/wallet-adapter-base");
const wallet_standard_util_1 = require("@solana/wallet-standard-util");
const web3_js_1 = require("@solana/web3.js");
exports.UnsafeBurnerWalletName = 'Burner Wallet';
/**
 * This burner wallet adapter is unsafe to use and is only included to provide an easy way for applications to test
 * Wallet Adapter without using a third-party wallet.
 */
class UnsafeBurnerWalletAdapter extends wallet_adapter_base_1.BaseSignInMessageSignerWalletAdapter {
    constructor() {
        super();
        this.name = exports.UnsafeBurnerWalletName;
        this.url = 'https://github.com/anza-xyz/wallet-adapter#usage';
        this.icon = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzQiIGhlaWdodD0iMzAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0zNCAxMC42djIuN2wtOS41IDE2LjVoLTQuNmw2LTEwLjVhMi4xIDIuMSAwIDEgMCAyLTMuNGw0LjgtOC4zYTQgNCAwIDAgMSAxLjMgM1ptLTQuMyAxOS4xaC0uNmw0LjktOC40djQuMmMwIDIuMy0yIDQuMy00LjMgNC4zWm0yLTI4LjRjLS4zLS44LTEtMS4zLTItMS4zaC0xLjlsLTIuNCA0LjNIMzBsMS43LTNabS0zIDVoLTQuNkwxMC42IDI5LjhoNC43TDI4LjggNi40Wk0xOC43IDBoNC42bC0yLjUgNC4zaC00LjZMMTguNiAwWk0xNSA2LjRoNC42TDYgMjkuOEg0LjJjLS44IDAtMS43LS4zLTIuNC0uOEwxNSA2LjRaTTE0IDBIOS40TDcgNC4zaDQuNkwxNCAwWm0tMy42IDYuNEg1LjdMMCAxNi4ydjhMMTAuMyA2LjRaTTQuMyAwaC40TDAgOC4ydi00QzAgMiAxLjkgMCA0LjMgMFoiIGZpbGw9IiM5OTQ1RkYiLz48L3N2Zz4=';
        this.supportedTransactionVersions = new Set(['legacy', 0]);
        /**
         * Storing a keypair locally like this is not safe because any application using this adapter could retrieve the
         * secret key, and because the keypair will be lost any time the wallet is disconnected or the window is refreshed.
         */
        this._keypair = null;
        console.warn('Your application is presently configured to use the `UnsafeBurnerWalletAdapter`. ' +
            'Find and remove it, then replace it with a list of adapters for ' +
            'wallets you would like your application to support. See ' +
            'https://github.com/anza-xyz/wallet-adapter#usage for an example.');
    }
    get connecting() {
        return false;
    }
    get publicKey() {
        return this._keypair && this._keypair.publicKey;
    }
    get readyState() {
        return wallet_adapter_base_1.WalletReadyState.Loadable;
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            this._keypair = new web3_js_1.Keypair();
            this.emit('connect', this._keypair.publicKey);
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            this._keypair = null;
            this.emit('disconnect');
        });
    }
    signTransaction(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._keypair)
                throw new wallet_adapter_base_1.WalletNotConnectedError();
            if ((0, wallet_adapter_base_1.isVersionedTransaction)(transaction)) {
                transaction.sign([this._keypair]);
            }
            else {
                transaction.partialSign(this._keypair);
            }
            return transaction;
        });
    }
    signMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._keypair)
                throw new wallet_adapter_base_1.WalletNotConnectedError();
            return ed25519_1.ed25519.sign(message, this._keypair.secretKey.slice(0, 32));
        });
    }
    signIn() {
        return __awaiter(this, arguments, void 0, function* (input = {}) {
            const { publicKey, secretKey } = (this._keypair || (this._keypair = new web3_js_1.Keypair()));
            const domain = input.domain || window.location.host;
            const address = input.address || publicKey.toBase58();
            const signedMessage = (0, wallet_standard_util_1.createSignInMessage)(Object.assign(Object.assign({}, input), { domain,
                address }));
            const signature = ed25519_1.ed25519.sign(signedMessage, secretKey.slice(0, 32));
            this.emit('connect', publicKey);
            return {
                account: {
                    address,
                    publicKey: publicKey.toBytes(),
                    chains: [],
                    features: [],
                },
                signedMessage,
                signature,
            };
        });
    }
}
exports.UnsafeBurnerWalletAdapter = UnsafeBurnerWalletAdapter;
//# sourceMappingURL=adapter.js.map