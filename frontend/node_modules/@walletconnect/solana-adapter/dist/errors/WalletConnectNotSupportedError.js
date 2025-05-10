export class WalletConnectFeatureNotSupportedError extends Error {
    constructor(method) {
        super(`WalletConnect Adapter - Method ${method} is not supported by the wallet`);
        this.name = 'WalletConnectFeatureNotSupportedError';
    }
}
//# sourceMappingURL=WalletConnectNotSupportedError.js.map