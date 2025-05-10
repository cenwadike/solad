"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseTransactionFlags = exports.convertTxFlagsToNumber = exports.setTransactionFlagsToNumber = exports.parseAccountRootFlags = void 0;
const errors_1 = require("../../errors");
const AccountRoot_1 = require("../ledger/AccountRoot");
const accountSet_1 = require("../transactions/accountSet");
const AMMClawback_1 = require("../transactions/AMMClawback");
const AMMDeposit_1 = require("../transactions/AMMDeposit");
const AMMWithdraw_1 = require("../transactions/AMMWithdraw");
const MPTokenAuthorize_1 = require("../transactions/MPTokenAuthorize");
const MPTokenIssuanceCreate_1 = require("../transactions/MPTokenIssuanceCreate");
const MPTokenIssuanceSet_1 = require("../transactions/MPTokenIssuanceSet");
const NFTokenCreateOffer_1 = require("../transactions/NFTokenCreateOffer");
const NFTokenMint_1 = require("../transactions/NFTokenMint");
const offerCreate_1 = require("../transactions/offerCreate");
const payment_1 = require("../transactions/payment");
const paymentChannelClaim_1 = require("../transactions/paymentChannelClaim");
const trustSet_1 = require("../transactions/trustSet");
const XChainModifyBridge_1 = require("../transactions/XChainModifyBridge");
const _1 = require(".");
function parseAccountRootFlags(flags) {
    const flagsInterface = {};
    Object.values(AccountRoot_1.AccountRootFlags).forEach((flag) => {
        if (typeof flag === 'string' &&
            (0, _1.isFlagEnabled)(flags, AccountRoot_1.AccountRootFlags[flag])) {
            flagsInterface[flag] = true;
        }
    });
    return flagsInterface;
}
exports.parseAccountRootFlags = parseAccountRootFlags;
const txToFlag = {
    AccountSet: accountSet_1.AccountSetTfFlags,
    AMMClawback: AMMClawback_1.AMMClawbackFlags,
    AMMDeposit: AMMDeposit_1.AMMDepositFlags,
    AMMWithdraw: AMMWithdraw_1.AMMWithdrawFlags,
    MPTokenAuthorize: MPTokenAuthorize_1.MPTokenAuthorizeFlags,
    MPTokenIssuanceCreate: MPTokenIssuanceCreate_1.MPTokenIssuanceCreateFlags,
    MPTokenIssuanceSet: MPTokenIssuanceSet_1.MPTokenIssuanceSetFlags,
    NFTokenCreateOffer: NFTokenCreateOffer_1.NFTokenCreateOfferFlags,
    NFTokenMint: NFTokenMint_1.NFTokenMintFlags,
    OfferCreate: offerCreate_1.OfferCreateFlags,
    PaymentChannelClaim: paymentChannelClaim_1.PaymentChannelClaimFlags,
    Payment: payment_1.PaymentFlags,
    TrustSet: trustSet_1.TrustSetFlags,
    XChainModifyBridge: XChainModifyBridge_1.XChainModifyBridgeFlags,
};
function isTxToFlagKey(transactionType) {
    return transactionType in txToFlag;
}
function setTransactionFlagsToNumber(tx) {
    console.warn('This function is deprecated. Use convertTxFlagsToNumber() instead and use the returned value to modify the Transaction.Flags from the caller.');
    if (tx.Flags) {
        tx.Flags = convertTxFlagsToNumber(tx);
    }
}
exports.setTransactionFlagsToNumber = setTransactionFlagsToNumber;
function convertTxFlagsToNumber(tx) {
    if (!tx.Flags) {
        return 0;
    }
    if (typeof tx.Flags === 'number') {
        return tx.Flags;
    }
    if (isTxToFlagKey(tx.TransactionType)) {
        const flagEnum = txToFlag[tx.TransactionType];
        return Object.keys(tx.Flags).reduce((resultFlags, flag) => {
            var _a;
            if (flagEnum[flag] == null) {
                throw new errors_1.ValidationError(`Invalid flag ${flag}. Valid flags are ${JSON.stringify(flagEnum)}`);
            }
            return ((_a = tx.Flags) === null || _a === void 0 ? void 0 : _a[flag]) ? resultFlags | flagEnum[flag] : resultFlags;
        }, 0);
    }
    return 0;
}
exports.convertTxFlagsToNumber = convertTxFlagsToNumber;
function parseTransactionFlags(tx) {
    const flags = convertTxFlagsToNumber(tx);
    if (flags === 0) {
        return {};
    }
    const booleanFlagMap = {};
    if (isTxToFlagKey(tx.TransactionType)) {
        const transactionTypeFlags = txToFlag[tx.TransactionType];
        Object.values(transactionTypeFlags).forEach((flag) => {
            if (typeof flag === 'string' &&
                (0, _1.isFlagEnabled)(flags, transactionTypeFlags[flag])) {
                booleanFlagMap[flag] = true;
            }
        });
    }
    return booleanFlagMap;
}
exports.parseTransactionFlags = parseTransactionFlags;
//# sourceMappingURL=flags.js.map