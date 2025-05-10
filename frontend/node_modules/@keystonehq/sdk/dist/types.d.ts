import { UR } from "@ngraveio/bc-ur";
declare type DecodedSuccess = {
    result: UR;
    status: ReadStatus.success;
};
declare type DecodedCanceled = {
    status: ReadStatus.canceled;
};
export declare type DecodedResult = DecodedSuccess | DecodedCanceled;
export declare enum ReadStatus {
    canceled = "canceled",
    success = "success"
}
export declare enum PlayStatus {
    canceled = "canceled",
    success = "success"
}
export declare type Play = (data: UR, options?: {
    refreshSpeed?: number;
    hasNext?: boolean;
    title?: string;
    description?: string;
    maxFragmentLength?: number;
}) => Promise<PlayStatus>;
export declare type Read = (expect: SupportedResult[], options?: {
    title?: string;
    description?: string;
    renderInitial?: {
        walletMode: string;
        link: string;
    };
    URTypeErrorMessage?: string;
}) => Promise<DecodedResult>;
export declare enum SupportedResult {
    UR_BYTES = "bytes",
    UR_CRYPTO_HDKEY = "crypto-hdkey",
    UR_CRYPTO_ACCOUNT = "crypto-account",
    UR_ETH_SIGN_REQUEST = "eth-sign-request",
    UR_ETH_SIGNATURE = "eth-signature",
    UR_CRYPTO_MULTI_ACCOUNTS = "crypto-multi-accounts",
    UR_SOL_SIGN_REQUEST = "sol-sign-request",
    UR_SOL_SIGNATURE = "sol-signature",
    UR_APTOS_SIGN_REQUEST = "aptos-sign-request",
    UR_APTOS_SIGNATURE = "aptos-signature",
    UR_ARWEAVE_SIGN_REQUEST = "arweave-sign-request",
    UR_ARWEAVE_SIGNATURE = "arweave-signature",
    UR_ARWEAVE_CRYPTO_ACCOUNT = "arweave-crypto-account",
    UR_COSMOS_SIGN_REQUEST = "cosmos-sign-request",
    UR_COSMOS_SIGNATURE = "cosmos-signature"
}
export {};
