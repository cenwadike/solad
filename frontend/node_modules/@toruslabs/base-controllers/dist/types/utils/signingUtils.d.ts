import { OPENLOGIN_NETWORK_TYPE } from "@toruslabs/openlogin-utils";
import { ChainNamespaceType } from "../Network/INetworkController";
export declare const authServer = "https://authjs.web3auth.io";
export declare const signChallenge: (payload: Record<string, string | number>, chainNamespace: ChainNamespaceType) => Promise<string>;
export declare const verifySignedChallenge: (chainNamespace: ChainNamespaceType, signedMessage: string, challenge: string, issuer: string, sessionTime: number, clientId?: string, web3AuthNetwork?: OPENLOGIN_NETWORK_TYPE, audience?: string, additionalMetadata?: Record<string, unknown>) => Promise<string>;
