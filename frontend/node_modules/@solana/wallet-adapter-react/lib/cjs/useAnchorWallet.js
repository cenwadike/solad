"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAnchorWallet = useAnchorWallet;
const react_1 = require("react");
const useWallet_js_1 = require("./useWallet.js");
function useAnchorWallet() {
    const { publicKey, signTransaction, signAllTransactions } = (0, useWallet_js_1.useWallet)();
    return (0, react_1.useMemo)(() => publicKey && signTransaction && signAllTransactions
        ? { publicKey, signTransaction, signAllTransactions }
        : undefined, [publicKey, signTransaction, signAllTransactions]);
}
//# sourceMappingURL=useAnchorWallet.js.map