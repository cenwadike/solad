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
exports.detectAndRegisterSolflareMetaMaskWallet = detectAndRegisterSolflareMetaMaskWallet;
const wallet_1 = require("@wallet-standard/wallet");
const wallet_js_1 = require("./wallet.js");
let registered = false;
function register() {
    if (registered)
        return;
    (0, wallet_1.registerWallet)(new wallet_js_1.SolflareMetaMaskWallet());
    registered = true;
}
/** @internal */
function detectAndRegisterSolflareMetaMaskWallet() {
    return __awaiter(this, void 0, void 0, function* () {
        const id = 'solflare-detect-metamask';
        function postMessage() {
            window.postMessage({
                target: 'metamask-contentscript',
                data: {
                    name: 'metamask-provider',
                    data: {
                        id,
                        jsonrpc: '2.0',
                        method: 'wallet_getSnaps',
                    },
                },
            }, window.location.origin);
        }
        function onMessage(event) {
            var _a, _b;
            const message = event.data;
            if ((message === null || message === void 0 ? void 0 : message.target) === 'metamask-inpage' && ((_a = message.data) === null || _a === void 0 ? void 0 : _a.name) === 'metamask-provider') {
                if (((_b = message.data.data) === null || _b === void 0 ? void 0 : _b.id) === id) {
                    window.removeEventListener('message', onMessage);
                    if (!message.data.data.error) {
                        register();
                    }
                }
                else {
                    postMessage();
                }
            }
        }
        window.addEventListener('message', onMessage);
        window.setTimeout(() => window.removeEventListener('message', onMessage), 5000);
        postMessage();
    });
}
//# sourceMappingURL=detect.js.map