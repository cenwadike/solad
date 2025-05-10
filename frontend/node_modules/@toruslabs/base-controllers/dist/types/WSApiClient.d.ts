/**
 * API client to communicate with wallet services backend
 */
import { CustomOptions, Data } from "@toruslabs/http-helpers";
import { SafeEventEmitter } from "@toruslabs/openlogin-jrpc";
export interface AuthCredentials {
    jwtToken: string;
    publicAddress: string;
}
export declare const constructAuthHeaders: ({ jwtToken, publicAddress }: AuthCredentials) => {
    headers: {
        Authorization: string;
        "public-address": string;
    };
};
export interface IWSApiClient {
    authGet: <T>(url: string, authCredentials?: AuthCredentials, customOptions?: CustomOptions) => Promise<T>;
    authPost: <T>(url: string, data?: Data, authCredentials?: AuthCredentials, customOptions?: CustomOptions) => Promise<T>;
    authPut: <T>(url: string, data?: Data, authCredentials?: AuthCredentials, customOptions?: CustomOptions) => Promise<T>;
    authPatch: <T>(url: string, data?: Data, authCredentials?: AuthCredentials, customOptions?: CustomOptions) => Promise<T>;
    authRemove: <T>(url: string, data?: Data, authCredentials?: AuthCredentials, customOptions?: CustomOptions) => Promise<T>;
}
declare const WSApiClient: (baseApiUrl: string, emitter: SafeEventEmitter) => IWSApiClient;
export default WSApiClient;
