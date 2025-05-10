import { BaseMessageSignerWalletAdapter, scopePollingDetectionStrategy, WalletAccountError, WalletDisconnectionError, WalletNotConnectedError, WalletNotReadyError, WalletPublicKeyError, WalletReadyState, WalletSignTransactionError, } from '@solana/wallet-adapter-base';
import { PublicKey } from '@solana/web3.js';
export const BitgetWalletName = 'Bitget';
export class BitgetWalletAdapter extends BaseMessageSignerWalletAdapter {
    constructor(config = {}) {
        super();
        this.name = BitgetWalletName;
        this.url = 'https://web3.bitget.com';
        this.icon = 'data:image/svg+xml;base64,PHN2ZyBmaWxsPSJub25lIiBoZWlnaHQ9IjI1NiIgdmlld0JveD0iMCAwIDI1NiAyNTYiIHdpZHRoPSIyNTYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPjxmaWx0ZXIgaWQ9ImEiIGNvbG9yLWludGVycG9sYXRpb24tZmlsdGVycz0ic1JHQiIgZmlsdGVyVW5pdHM9InVzZXJTcGFjZU9uVXNlIiBoZWlnaHQ9IjQ1MS40MzEiIHdpZHRoPSI1NjkuNTU4IiB4PSItOTAuMjQxMSIgeT0iLTY5LjczNjkiPjxmZUZsb29kIGZsb29kLW9wYWNpdHk9IjAiIHJlc3VsdD0iQmFja2dyb3VuZEltYWdlRml4Ii8+PGZlQmxlbmQgaW49IlNvdXJjZUdyYXBoaWMiIGluMj0iQmFja2dyb3VuZEltYWdlRml4IiBtb2RlPSJub3JtYWwiIHJlc3VsdD0ic2hhcGUiLz48ZmVHYXVzc2lhbkJsdXIgcmVzdWx0PSJlZmZlY3QxX2ZvcmVncm91bmRCbHVyXzIwMzVfMTEwNiIgc3RkRGV2aWF0aW9uPSI0OS4yMzA4Ii8+PC9maWx0ZXI+PGZpbHRlciBpZD0iYiIgY29sb3ItaW50ZXJwb2xhdGlvbi1maWx0ZXJzPSJzUkdCIiBmaWx0ZXJVbml0cz0idXNlclNwYWNlT25Vc2UiIGhlaWdodD0iMzcxLjUwNyIgd2lkdGg9IjM1MS41OTYiIHg9Ii0xNjAuNTExIiB5PSItMTY1Ljk4NyI+PGZlRmxvb2QgZmxvb2Qtb3BhY2l0eT0iMCIgcmVzdWx0PSJCYWNrZ3JvdW5kSW1hZ2VGaXgiLz48ZmVCbGVuZCBpbj0iU291cmNlR3JhcGhpYyIgaW4yPSJCYWNrZ3JvdW5kSW1hZ2VGaXgiIG1vZGU9Im5vcm1hbCIgcmVzdWx0PSJzaGFwZSIvPjxmZUdhdXNzaWFuQmx1ciByZXN1bHQ9ImVmZmVjdDFfZm9yZWdyb3VuZEJsdXJfMjAzNV8xMTA2IiBzdGREZXZpYXRpb249IjQ5LjIzMDgiLz48L2ZpbHRlcj48ZmlsdGVyIGlkPSJjIiBjb2xvci1pbnRlcnBvbGF0aW9uLWZpbHRlcnM9InNSR0IiIGZpbHRlclVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgaGVpZ2h0PSI0MjQuNDUyIiB3aWR0aD0iNDQ0Ljg1MSIgeD0iLTI0MS4wNzgiIHk9IjY3LjY0MiI+PGZlRmxvb2QgZmxvb2Qtb3BhY2l0eT0iMCIgcmVzdWx0PSJCYWNrZ3JvdW5kSW1hZ2VGaXgiLz48ZmVCbGVuZCBpbj0iU291cmNlR3JhcGhpYyIgaW4yPSJCYWNrZ3JvdW5kSW1hZ2VGaXgiIG1vZGU9Im5vcm1hbCIgcmVzdWx0PSJzaGFwZSIvPjxmZUdhdXNzaWFuQmx1ciByZXN1bHQ9ImVmZmVjdDFfZm9yZWdyb3VuZEJsdXJfMjAzNV8xMTA2IiBzdGREZXZpYXRpb249IjQ5LjIzMDgiLz48L2ZpbHRlcj48ZmlsdGVyIGlkPSJkIiBjb2xvci1pbnRlcnBvbGF0aW9uLWZpbHRlcnM9InNSR0IiIGZpbHRlclVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgaGVpZ2h0PSIzODUuMTA1IiB3aWR0aD0iNDMwLjE5MSIgeD0iLTIwLjM5NjgiIHk9Ii0yNDIuNzU4Ij48ZmVGbG9vZCBmbG9vZC1vcGFjaXR5PSIwIiByZXN1bHQ9IkJhY2tncm91bmRJbWFnZUZpeCIvPjxmZUJsZW5kIGluPSJTb3VyY2VHcmFwaGljIiBpbjI9IkJhY2tncm91bmRJbWFnZUZpeCIgbW9kZT0ibm9ybWFsIiByZXN1bHQ9InNoYXBlIi8+PGZlR2F1c3NpYW5CbHVyIHJlc3VsdD0iZWZmZWN0MV9mb3JlZ3JvdW5kQmx1cl8yMDM1XzExMDYiIHN0ZERldmlhdGlvbj0iNDkuMjMwOCIvPjwvZmlsdGVyPjxjbGlwUGF0aCBpZD0iZSI+PHBhdGggZD0ibTAgMGgyNTZ2MjU2aC0yNTZ6Ii8+PC9jbGlwUGF0aD48ZyBjbGlwLXBhdGg9InVybCgjZSkiPjxwYXRoIGQ9Im0wIDBoMjU2djI1NmgtMjU2eiIgZmlsbD0iIzU0ZmZmNSIvPjxnIGZpbHRlcj0idXJsKCNhKSI+PHBhdGggZD0ibTEzLjQ4MDYgMTk4LjYwNWMtNDIuODA4MiAxMjAuNDM4IDE4Ni4xODA0IDg2LjQyMiAzMDYuMDI2NCA1NC4zNTkgMTIyLjY1OC00MC43MDUgMzcuODc5LTIyMC4xMzcxLTUwLjA5Mi0yMjQuMTA4Mi04Ny45NzItMy45NzExIDEwLjkwNyA4Mi45NjgyLTYzLjgyIDEwNy44MDAyLTc0LjcyNyAyNC44MzEtMTM4LjYwNDMtODguNTk3Ny0xOTIuMTE0NCA2MS45NDl6IiBmaWxsPSIjZmZmIi8+PC9nPjxnIGZpbHRlcj0idXJsKCNiKSI+PHBhdGggZD0ibTg1LjUxMTgtNDUuODIyNWMtMjIuNDU1Ni02MS4zNTM1LTEwMi40MzA3IDIxLjgyNzItMTM5LjYxMTMgNzEuMDg2OC0zNS40NjU3IDUzLjU4MzYgNTcuMTA4ODcgOTkuODg3NyA5My40MjAzIDc0Ljc3MjcgMzYuMzExNS0yNS4xMTQzLTMxLjU0NjMyLTMwLjAwMDctOS45NS02Mi42NTg1IDIxLjU5NjMtMzIuNjU3NzQgODQuMjEwMi02LjUwOSA1Ni4xNDEtODMuMjAxeiIgZmlsbD0iIzAwZmZmMCIgZmlsbC1vcGFjaXR5PSIuNjciLz48L2c+PGcgZmlsdGVyPSJ1cmwoI2MpIj48cGF0aCBkPSJtOTYuNDc5NiAyMjUuNDI0Yy0zMC42Mjk0LTEwMy4wNjEtMTYyLjU2MTQtNDguNzg3LTIyNC42OTg2LTguNzY3LTU5Ljc3MSA0Ny4zODUgODIuMTQ3OSAxODMuNjkxIDE0MS4wOTE1IDE3Ni43MTkgNTguOTQzNi02Ljk3My00Ny4yODQzLTY2LjMxMS0xMC44ODU0OC05NS4yMDYgMzYuMzk4NzgtMjguODk0IDEzMi43Nzg5OCA1Ni4wNzkgOTQuNDkyNTgtNzIuNzQ2eiIgZmlsbD0iIzlkODFmZiIvPjwvZz48ZyBmaWx0ZXI9InVybCgjZCkiPjxwYXRoIGQ9Im0yODIuMTItMTA3LjM1M2MtNjYuMDczLTc4LjY3OC0xNjAuNjU3LTEzLjYxNy0xOTkuNjkwNCAyOC43NDgzLTM0LjE1NTcgNDcuOTYwMSAxNDEuODQ1NCAxMzUuODM1OSAxOTAuNjkxNCAxMjAuNzc2MSA0OC44NDctMTUuMDU5OS02Ni42MDktNDYuMjIxNzgtNDUuODI0LTc1LjQ1OTMgMjAuNzg1LTI5LjIzNzYgMTM3LjQxNSAyNC4yODIyNCA1NC44MjMtNzQuMDY1MXoiIGZpbGw9IiM0ZDk0ZmYiLz48L2c+PHBhdGggY2xpcC1ydWxlPSJldmVub2RkIiBkPSJtOTMuMTg5IDE1Mi44MzZoNDMuNDg1bC00OS40NjU0LTQ5Ljc4NSA1MC4xMDE0LTQ5Ljc4NDcgMTMuNjQ1LTEzLjI2NjNoLTQ1LjEzNmwtNTcuNDgzMSA1Ny43NzczYy0yLjkwMSAyLjkxMTctMi44ODYxIDcuNjI0Ny4wMjk3IDEwLjUyMTd6bTI2LjE0MS00OS42NjhoLS4zMzVsLjMzMS0uMDA0em0wIDAgNDkuNDYxIDQ5Ljc4MS01MC4xMDEgNDkuNzg1LTEzLjY0NSAxMy4yNjZoNDUuMTM1bDU3LjQ4NC01Ny43NzRjMi45MDEtMi45MTIgMi44ODYtNy42MjQtLjAzLTEwLjUyMWwtNDQuODIzLTQ0LjUzN3oiIGZpbGw9IiMwMDAiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvZz48L3N2Zz4=';
        this.supportedTransactionVersions = null;
        this._readyState = typeof window === 'undefined' || typeof document === 'undefined'
            ? WalletReadyState.Unsupported
            : WalletReadyState.NotDetected;
        this._connecting = false;
        this._wallet = null;
        this._publicKey = null;
        if (this._readyState !== WalletReadyState.Unsupported) {
            scopePollingDetectionStrategy(() => {
                if (window.bitkeep?.solana?.isBitKeep) {
                    this._readyState = WalletReadyState.Installed;
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
    get readyState() {
        return this._readyState;
    }
    async connect() {
        try {
            if (this.connected || this.connecting)
                return;
            if (this._readyState !== WalletReadyState.Installed)
                throw new WalletNotReadyError();
            this._connecting = true;
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const wallet = window.bitkeep.solana;
            let account;
            try {
                account = await wallet.getAccount();
            }
            catch (error) {
                throw new WalletAccountError(error?.message, error);
            }
            let publicKey;
            try {
                publicKey = new PublicKey(account);
            }
            catch (error) {
                throw new WalletPublicKeyError(error?.message, error);
            }
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
    }
    async disconnect() {
        const wallet = this._wallet;
        if (wallet) {
            this._wallet = null;
            this._publicKey = null;
            try {
                await wallet.disconnect();
            }
            catch (error) {
                this.emit('error', new WalletDisconnectionError(error?.message, error));
            }
        }
        this.emit('disconnect');
    }
    async signTransaction(transaction) {
        try {
            const wallet = this._wallet;
            if (!wallet)
                throw new WalletNotConnectedError();
            try {
                return (await wallet.signTransaction(transaction)) || transaction;
            }
            catch (error) {
                throw new WalletSignTransactionError(error?.message, error);
            }
        }
        catch (error) {
            this.emit('error', error);
            throw error;
        }
    }
    async signAllTransactions(transactions) {
        try {
            const wallet = this._wallet;
            if (!wallet)
                throw new WalletNotConnectedError();
            try {
                return (await wallet.signAllTransactions(transactions)) || transactions;
            }
            catch (error) {
                throw new WalletSignTransactionError(error?.message, error);
            }
        }
        catch (error) {
            this.emit('error', error);
            throw error;
        }
    }
    async signMessage(message) {
        try {
            const wallet = this._wallet;
            if (!wallet)
                throw new WalletNotConnectedError();
            try {
                const { signature } = await wallet.signMessage(message);
                return signature;
            }
            catch (error) {
                throw new WalletSignTransactionError(error?.message, error);
            }
        }
        catch (error) {
            this.emit('error', error);
            throw error;
        }
    }
}
/**
 * @deprecated Use 'BitgetWalletName' instead."
 */
export const BitKeepWalletName = BitgetWalletName;
/**
 * @deprecated Use 'BitgetWalletAdapter' instead."
 */
export const BitKeepWalletAdapter = BitgetWalletAdapter;
//# sourceMappingURL=adapter.js.map