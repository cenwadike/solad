"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.containsDuplicates = exports.validateCredentialsList = exports.validateCredentialType = exports.parseAmountValue = exports.validateBaseTransaction = exports.validateOptionalField = exports.validateRequiredField = exports.isXChainBridge = exports.isAmount = exports.isAccount = exports.isMPTAmount = exports.isAuthorizeCredential = exports.isIssuedCurrency = exports.isCurrency = exports.isNumber = exports.isString = exports.MAX_AUTHORIZED_CREDENTIALS = void 0;
const utils_1 = require("@xrplf/isomorphic/utils");
const ripple_address_codec_1 = require("ripple-address-codec");
const ripple_binary_codec_1 = require("ripple-binary-codec");
const errors_1 = require("../../errors");
const utils_2 = require("../utils");
const MEMO_SIZE = 3;
exports.MAX_AUTHORIZED_CREDENTIALS = 8;
const MAX_CREDENTIAL_BYTE_LENGTH = 64;
const MAX_CREDENTIAL_TYPE_LENGTH = MAX_CREDENTIAL_BYTE_LENGTH * 2;
function isMemo(obj) {
    if (obj.Memo == null) {
        return false;
    }
    const memo = obj.Memo;
    const size = Object.keys(memo).length;
    const validData = memo.MemoData == null || typeof memo.MemoData === 'string';
    const validFormat = memo.MemoFormat == null || typeof memo.MemoFormat === 'string';
    const validType = memo.MemoType == null || typeof memo.MemoType === 'string';
    return (size >= 1 &&
        size <= MEMO_SIZE &&
        validData &&
        validFormat &&
        validType &&
        (0, utils_2.onlyHasFields)(memo, ['MemoFormat', 'MemoData', 'MemoType']));
}
const SIGNER_SIZE = 3;
function isSigner(obj) {
    const signerWrapper = obj;
    if (signerWrapper.Signer == null) {
        return false;
    }
    const signer = signerWrapper.Signer;
    return (Object.keys(signer).length === SIGNER_SIZE &&
        typeof signer.Account === 'string' &&
        typeof signer.TxnSignature === 'string' &&
        typeof signer.SigningPubKey === 'string');
}
const XRP_CURRENCY_SIZE = 1;
const ISSUE_SIZE = 2;
const ISSUED_CURRENCY_SIZE = 3;
const XCHAIN_BRIDGE_SIZE = 4;
const MPTOKEN_SIZE = 2;
const AUTHORIZE_CREDENTIAL_SIZE = 1;
function isRecord(value) {
    return value !== null && typeof value === 'object';
}
function isString(str) {
    return typeof str === 'string';
}
exports.isString = isString;
function isNumber(num) {
    return typeof num === 'number';
}
exports.isNumber = isNumber;
function isCurrency(input) {
    return (isRecord(input) &&
        ((Object.keys(input).length === ISSUE_SIZE &&
            typeof input.issuer === 'string' &&
            typeof input.currency === 'string') ||
            (Object.keys(input).length === XRP_CURRENCY_SIZE &&
                input.currency === 'XRP')));
}
exports.isCurrency = isCurrency;
function isIssuedCurrency(input) {
    return (isRecord(input) &&
        Object.keys(input).length === ISSUED_CURRENCY_SIZE &&
        typeof input.value === 'string' &&
        typeof input.issuer === 'string' &&
        typeof input.currency === 'string');
}
exports.isIssuedCurrency = isIssuedCurrency;
function isAuthorizeCredential(input) {
    return (isRecord(input) &&
        isRecord(input.Credential) &&
        Object.keys(input).length === AUTHORIZE_CREDENTIAL_SIZE &&
        typeof input.Credential.CredentialType === 'string' &&
        typeof input.Credential.Issuer === 'string');
}
exports.isAuthorizeCredential = isAuthorizeCredential;
function isMPTAmount(input) {
    return (isRecord(input) &&
        Object.keys(input).length === MPTOKEN_SIZE &&
        typeof input.value === 'string' &&
        typeof input.mpt_issuance_id === 'string');
}
exports.isMPTAmount = isMPTAmount;
function isAccount(account) {
    return (typeof account === 'string' &&
        ((0, ripple_address_codec_1.isValidClassicAddress)(account) || (0, ripple_address_codec_1.isValidXAddress)(account)));
}
exports.isAccount = isAccount;
function isAmount(amount) {
    return (typeof amount === 'string' ||
        isIssuedCurrency(amount) ||
        isMPTAmount(amount));
}
exports.isAmount = isAmount;
function isXChainBridge(input) {
    return (isRecord(input) &&
        Object.keys(input).length === XCHAIN_BRIDGE_SIZE &&
        typeof input.LockingChainDoor === 'string' &&
        isCurrency(input.LockingChainIssue) &&
        typeof input.IssuingChainDoor === 'string' &&
        isCurrency(input.IssuingChainIssue));
}
exports.isXChainBridge = isXChainBridge;
function validateRequiredField(tx, paramName, checkValidity) {
    if (tx[paramName] == null) {
        throw new errors_1.ValidationError(`${tx.TransactionType}: missing field ${paramName}`);
    }
    if (!checkValidity(tx[paramName])) {
        throw new errors_1.ValidationError(`${tx.TransactionType}: invalid field ${paramName}`);
    }
}
exports.validateRequiredField = validateRequiredField;
function validateOptionalField(tx, paramName, checkValidity) {
    if (tx[paramName] !== undefined && !checkValidity(tx[paramName])) {
        throw new errors_1.ValidationError(`${tx.TransactionType}: invalid field ${paramName}`);
    }
}
exports.validateOptionalField = validateOptionalField;
function validateBaseTransaction(common) {
    if (common.TransactionType === undefined) {
        throw new errors_1.ValidationError('BaseTransaction: missing field TransactionType');
    }
    if (typeof common.TransactionType !== 'string') {
        throw new errors_1.ValidationError('BaseTransaction: TransactionType not string');
    }
    if (!ripple_binary_codec_1.TRANSACTION_TYPES.includes(common.TransactionType)) {
        throw new errors_1.ValidationError('BaseTransaction: Unknown TransactionType');
    }
    validateRequiredField(common, 'Account', isString);
    validateOptionalField(common, 'Fee', isString);
    validateOptionalField(common, 'Sequence', isNumber);
    validateOptionalField(common, 'AccountTxnID', isString);
    validateOptionalField(common, 'LastLedgerSequence', isNumber);
    const memos = common.Memos;
    if (memos !== undefined && !memos.every(isMemo)) {
        throw new errors_1.ValidationError('BaseTransaction: invalid Memos');
    }
    const signers = common.Signers;
    if (signers !== undefined &&
        (signers.length === 0 || !signers.every(isSigner))) {
        throw new errors_1.ValidationError('BaseTransaction: invalid Signers');
    }
    validateOptionalField(common, 'SourceTag', isNumber);
    validateOptionalField(common, 'SigningPubKey', isString);
    validateOptionalField(common, 'TicketSequence', isNumber);
    validateOptionalField(common, 'TxnSignature', isString);
    validateOptionalField(common, 'NetworkID', isNumber);
}
exports.validateBaseTransaction = validateBaseTransaction;
function parseAmountValue(amount) {
    if (!isAmount(amount)) {
        return NaN;
    }
    if (typeof amount === 'string') {
        return parseFloat(amount);
    }
    return parseFloat(amount.value);
}
exports.parseAmountValue = parseAmountValue;
function validateCredentialType(tx) {
    if (typeof tx.TransactionType !== 'string') {
        throw new errors_1.ValidationError('Invalid TransactionType');
    }
    if (tx.CredentialType === undefined) {
        throw new errors_1.ValidationError(`${tx.TransactionType}: missing field CredentialType`);
    }
    if (!isString(tx.CredentialType)) {
        throw new errors_1.ValidationError(`${tx.TransactionType}: CredentialType must be a string`);
    }
    if (tx.CredentialType.length === 0) {
        throw new errors_1.ValidationError(`${tx.TransactionType}: CredentialType cannot be an empty string`);
    }
    else if (tx.CredentialType.length > MAX_CREDENTIAL_TYPE_LENGTH) {
        throw new errors_1.ValidationError(`${tx.TransactionType}: CredentialType length cannot be > ${MAX_CREDENTIAL_TYPE_LENGTH}`);
    }
    if (!utils_1.HEX_REGEX.test(tx.CredentialType)) {
        throw new errors_1.ValidationError(`${tx.TransactionType}: CredentialType must be encoded in hex`);
    }
}
exports.validateCredentialType = validateCredentialType;
function validateCredentialsList(credentials, transactionType, isStringID, maxCredentials) {
    if (credentials == null) {
        return;
    }
    if (!Array.isArray(credentials)) {
        throw new errors_1.ValidationError(`${transactionType}: Credentials must be an array`);
    }
    if (credentials.length > maxCredentials) {
        throw new errors_1.ValidationError(`${transactionType}: Credentials length cannot exceed ${maxCredentials} elements`);
    }
    else if (credentials.length === 0) {
        throw new errors_1.ValidationError(`${transactionType}: Credentials cannot be an empty array`);
    }
    credentials.forEach((credential) => {
        if (isStringID) {
            if (!isString(credential)) {
                throw new errors_1.ValidationError(`${transactionType}: Invalid Credentials ID list format`);
            }
        }
        else if (!isAuthorizeCredential(credential)) {
            throw new errors_1.ValidationError(`${transactionType}: Invalid Credentials format`);
        }
    });
    if (containsDuplicates(credentials)) {
        throw new errors_1.ValidationError(`${transactionType}: Credentials cannot contain duplicate elements`);
    }
}
exports.validateCredentialsList = validateCredentialsList;
function isAuthorizeCredentialArray(list) {
    return typeof list[0] !== 'string';
}
function containsDuplicates(objectList) {
    if (typeof objectList[0] === 'string') {
        const objSet = new Set(objectList.map((obj) => JSON.stringify(obj)));
        return objSet.size !== objectList.length;
    }
    const seen = new Set();
    if (isAuthorizeCredentialArray(objectList)) {
        for (const item of objectList) {
            const key = `${item.Credential.Issuer}-${item.Credential.CredentialType}`;
            if (seen.has(key)) {
                return true;
            }
            seen.add(key);
        }
    }
    return false;
}
exports.containsDuplicates = containsDuplicates;
//# sourceMappingURL=common.js.map