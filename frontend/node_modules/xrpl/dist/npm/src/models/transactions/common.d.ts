import { Amount, AuthorizeCredential, Currency, IssuedCurrencyAmount, MPTAmount, Memo, Signer, XChainBridge } from '../common';
export declare const MAX_AUTHORIZED_CREDENTIALS = 8;
export declare function isString(str: unknown): str is string;
export declare function isNumber(num: unknown): num is number;
export declare function isCurrency(input: unknown): input is Currency;
export declare function isIssuedCurrency(input: unknown): input is IssuedCurrencyAmount;
export declare function isAuthorizeCredential(input: unknown): input is AuthorizeCredential;
export declare function isMPTAmount(input: unknown): input is MPTAmount;
export type Account = string;
export declare function isAccount(account: unknown): account is Account;
export declare function isAmount(amount: unknown): amount is Amount;
export declare function isXChainBridge(input: unknown): input is XChainBridge;
export declare function validateRequiredField(tx: Record<string, unknown>, paramName: string, checkValidity: (inp: unknown) => boolean): void;
export declare function validateOptionalField(tx: Record<string, unknown>, paramName: string, checkValidity: (inp: unknown) => boolean): void;
export interface GlobalFlags {
}
export interface BaseTransaction {
    Account: Account;
    TransactionType: string;
    Fee?: string;
    Sequence?: number;
    AccountTxnID?: string;
    Flags?: number | GlobalFlags;
    LastLedgerSequence?: number;
    Memos?: Memo[];
    Signers?: Signer[];
    SourceTag?: number;
    SigningPubKey?: string;
    TicketSequence?: number;
    TxnSignature?: string;
    NetworkID?: number;
}
export declare function validateBaseTransaction(common: Record<string, unknown>): void;
export declare function parseAmountValue(amount: unknown): number;
export declare function validateCredentialType(tx: Record<string, unknown>): void;
export declare function validateCredentialsList(credentials: unknown, transactionType: string, isStringID: boolean, maxCredentials: number): void;
export declare function containsDuplicates(objectList: AuthorizeCredential[] | string[]): boolean;
//# sourceMappingURL=common.d.ts.map