var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _SolflareMetaMaskWallet_instances, _SolflareMetaMaskWallet_listeners, _SolflareMetaMaskWallet_version, _SolflareMetaMaskWallet_name, _SolflareMetaMaskWallet_icon, _SolflareMetaMaskWallet_solflareMetaMask, _SolflareMetaMaskWallet_on, _SolflareMetaMaskWallet_emit, _SolflareMetaMaskWallet_off, _SolflareMetaMaskWallet_connect, _SolflareMetaMaskWallet_disconnect, _SolflareMetaMaskWallet_signAndSendTransaction, _SolflareMetaMaskWallet_signTransaction, _SolflareMetaMaskWallet_signMessage;
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { SOLANA_DEVNET_CHAIN, SOLANA_MAINNET_CHAIN, SOLANA_TESTNET_CHAIN } from '@solana/wallet-standard-chains';
import { SolanaSignAndSendTransaction, SolanaSignMessage, SolanaSignTransaction, } from '@solana/wallet-standard-features';
import { StandardConnect, StandardDisconnect, StandardEvents, } from '@wallet-standard/features';
import { icon } from './icon.js';
export class SolflareMetaMaskWallet {
    constructor() {
        _SolflareMetaMaskWallet_instances.add(this);
        _SolflareMetaMaskWallet_listeners.set(this, {});
        _SolflareMetaMaskWallet_version.set(this, '1.0.0');
        _SolflareMetaMaskWallet_name.set(this, 'MetaMask');
        _SolflareMetaMaskWallet_icon.set(this, icon);
        _SolflareMetaMaskWallet_solflareMetaMask.set(this, null);
        _SolflareMetaMaskWallet_on.set(this, (event, listener) => {
            __classPrivateFieldGet(this, _SolflareMetaMaskWallet_listeners, "f")[event]?.push(listener) || (__classPrivateFieldGet(this, _SolflareMetaMaskWallet_listeners, "f")[event] = [listener]);
            return () => __classPrivateFieldGet(this, _SolflareMetaMaskWallet_instances, "m", _SolflareMetaMaskWallet_off).call(this, event, listener);
        });
        _SolflareMetaMaskWallet_connect.set(this, async () => {
            if (!__classPrivateFieldGet(this, _SolflareMetaMaskWallet_solflareMetaMask, "f")) {
                let SolflareMetaMaskClass;
                try {
                    SolflareMetaMaskClass = (await import('@solflare-wallet/metamask-sdk')).default;
                }
                catch (error) {
                    throw new Error('Unable to load Solflare MetaMask SDK');
                }
                __classPrivateFieldSet(this, _SolflareMetaMaskWallet_solflareMetaMask, new SolflareMetaMaskClass(), "f");
                __classPrivateFieldGet(this, _SolflareMetaMaskWallet_solflareMetaMask, "f").on('standard_change', (properties) => __classPrivateFieldGet(this, _SolflareMetaMaskWallet_instances, "m", _SolflareMetaMaskWallet_emit).call(this, 'change', properties));
            }
            if (!this.accounts.length) {
                await __classPrivateFieldGet(this, _SolflareMetaMaskWallet_solflareMetaMask, "f").connect();
            }
            return { accounts: this.accounts };
        });
        _SolflareMetaMaskWallet_disconnect.set(this, async () => {
            if (!__classPrivateFieldGet(this, _SolflareMetaMaskWallet_solflareMetaMask, "f"))
                return;
            await __classPrivateFieldGet(this, _SolflareMetaMaskWallet_solflareMetaMask, "f").disconnect();
        });
        _SolflareMetaMaskWallet_signAndSendTransaction.set(this, async (...inputs) => {
            if (!__classPrivateFieldGet(this, _SolflareMetaMaskWallet_solflareMetaMask, "f"))
                throw new WalletNotConnectedError();
            return await __classPrivateFieldGet(this, _SolflareMetaMaskWallet_solflareMetaMask, "f").standardSignAndSendTransaction(...inputs);
        });
        _SolflareMetaMaskWallet_signTransaction.set(this, async (...inputs) => {
            if (!__classPrivateFieldGet(this, _SolflareMetaMaskWallet_solflareMetaMask, "f"))
                throw new WalletNotConnectedError();
            return await __classPrivateFieldGet(this, _SolflareMetaMaskWallet_solflareMetaMask, "f").standardSignTransaction(...inputs);
        });
        _SolflareMetaMaskWallet_signMessage.set(this, async (...inputs) => {
            if (!__classPrivateFieldGet(this, _SolflareMetaMaskWallet_solflareMetaMask, "f"))
                throw new WalletNotConnectedError();
            return await __classPrivateFieldGet(this, _SolflareMetaMaskWallet_solflareMetaMask, "f").standardSignMessage(...inputs);
        });
    }
    get version() {
        return __classPrivateFieldGet(this, _SolflareMetaMaskWallet_version, "f");
    }
    get name() {
        return __classPrivateFieldGet(this, _SolflareMetaMaskWallet_name, "f");
    }
    get icon() {
        return __classPrivateFieldGet(this, _SolflareMetaMaskWallet_icon, "f");
    }
    get chains() {
        return [SOLANA_MAINNET_CHAIN, SOLANA_DEVNET_CHAIN, SOLANA_TESTNET_CHAIN];
    }
    get features() {
        return {
            [StandardConnect]: {
                version: '1.0.0',
                connect: __classPrivateFieldGet(this, _SolflareMetaMaskWallet_connect, "f"),
            },
            [StandardDisconnect]: {
                version: '1.0.0',
                disconnect: __classPrivateFieldGet(this, _SolflareMetaMaskWallet_disconnect, "f"),
            },
            [StandardEvents]: {
                version: '1.0.0',
                on: __classPrivateFieldGet(this, _SolflareMetaMaskWallet_on, "f"),
            },
            [SolanaSignAndSendTransaction]: {
                version: '1.0.0',
                supportedTransactionVersions: ['legacy', 0],
                signAndSendTransaction: __classPrivateFieldGet(this, _SolflareMetaMaskWallet_signAndSendTransaction, "f"),
            },
            [SolanaSignTransaction]: {
                version: '1.0.0',
                supportedTransactionVersions: ['legacy', 0],
                signTransaction: __classPrivateFieldGet(this, _SolflareMetaMaskWallet_signTransaction, "f"),
            },
            [SolanaSignMessage]: {
                version: '1.0.0',
                signMessage: __classPrivateFieldGet(this, _SolflareMetaMaskWallet_signMessage, "f"),
            },
        };
    }
    get accounts() {
        return __classPrivateFieldGet(this, _SolflareMetaMaskWallet_solflareMetaMask, "f") ? __classPrivateFieldGet(this, _SolflareMetaMaskWallet_solflareMetaMask, "f").standardAccounts : [];
    }
}
_SolflareMetaMaskWallet_listeners = new WeakMap(), _SolflareMetaMaskWallet_version = new WeakMap(), _SolflareMetaMaskWallet_name = new WeakMap(), _SolflareMetaMaskWallet_icon = new WeakMap(), _SolflareMetaMaskWallet_solflareMetaMask = new WeakMap(), _SolflareMetaMaskWallet_on = new WeakMap(), _SolflareMetaMaskWallet_connect = new WeakMap(), _SolflareMetaMaskWallet_disconnect = new WeakMap(), _SolflareMetaMaskWallet_signAndSendTransaction = new WeakMap(), _SolflareMetaMaskWallet_signTransaction = new WeakMap(), _SolflareMetaMaskWallet_signMessage = new WeakMap(), _SolflareMetaMaskWallet_instances = new WeakSet(), _SolflareMetaMaskWallet_emit = function _SolflareMetaMaskWallet_emit(event, ...args) {
    // eslint-disable-next-line prefer-spread
    __classPrivateFieldGet(this, _SolflareMetaMaskWallet_listeners, "f")[event]?.forEach((listener) => listener.apply(null, args));
}, _SolflareMetaMaskWallet_off = function _SolflareMetaMaskWallet_off(event, listener) {
    __classPrivateFieldGet(this, _SolflareMetaMaskWallet_listeners, "f")[event] = __classPrivateFieldGet(this, _SolflareMetaMaskWallet_listeners, "f")[event]?.filter((existingListener) => listener !== existingListener);
};
//# sourceMappingURL=wallet.js.map