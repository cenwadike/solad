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
exports.detectProvider = exports.isSnapSupported = void 0;
function isSnapSupported(provider) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield provider.request({ method: 'wallet_getSnaps' });
            return true;
        }
        catch (error) {
            return false;
        }
    });
}
exports.isSnapSupported = isSnapSupported;
function detectProvider() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const provider = window.ethereum;
            if (!provider) {
                return null;
            }
            if (provider.providers && Array.isArray(provider.providers)) {
                const providers = provider.providers;
                for (const provider of providers) {
                    if (yield isSnapSupported(provider)) {
                        return provider;
                    }
                }
            }
            if (provider.detected && Array.isArray(provider.detected)) {
                const providers = provider.detected;
                for (const provider of providers) {
                    if (yield isSnapSupported(provider)) {
                        return provider;
                    }
                }
            }
            if (yield isSnapSupported(provider)) {
                return provider;
            }
            return null;
        }
        catch (error) {
            console.error(error);
            return null;
        }
    });
}
exports.detectProvider = detectProvider;
