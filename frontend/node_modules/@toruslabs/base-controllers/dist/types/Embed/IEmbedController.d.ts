import type { JRPCEngineEndCallback, JRPCEngineNextCallback, JRPCRequest, JRPCResponse } from "@toruslabs/openlogin-jrpc";
import type { OPENLOGIN_NETWORK_TYPE, WhiteLabelData } from "@toruslabs/openlogin-utils";
import type { BaseState, CommunicationWalletProviderState, PAYMENT_PROVIDER_TYPE, PaymentParams, UserInfo, WindowBlockAlertParams } from "../interfaces";
import type { ProviderConfig } from "../Network/INetworkController";
export declare const BUTTON_POSITION: {
    readonly BOTTOM_LEFT: "bottom-left";
    readonly TOP_LEFT: "top-left";
    readonly BOTTOM_RIGHT: "bottom-right";
    readonly TOP_RIGHT: "top-right";
};
export type BUTTON_POSITION_TYPE = (typeof BUTTON_POSITION)[keyof typeof BUTTON_POSITION];
export declare const CONFIRMATION_STRATEGY: {
    readonly POPUP: "popup";
    readonly MODAL: "modal";
    readonly AUTO_APPROVE: "auto-approve";
    readonly DEFAULT: "default";
};
export type CONFIRMATION_STRATEGY_TYPE = (typeof CONFIRMATION_STRATEGY)[keyof typeof CONFIRMATION_STRATEGY];
export interface BaseEmbedControllerState extends BaseState {
    isIFrameFullScreen: boolean;
    chainConfig: ProviderConfig;
    oauthModalVisibility: boolean;
    loginInProgress: boolean;
    dappMetadata: {
        name: string;
        icon: string;
    };
    showWalletConnect?: boolean;
    showWalletUi?: boolean;
    showCheckout?: boolean;
    windowBlockAlert?: WindowBlockAlertParams[];
    web3AuthClientId: string;
    web3AuthNetwork: OPENLOGIN_NETWORK_TYPE;
    confirmationStrategy: CONFIRMATION_STRATEGY_TYPE;
    whiteLabel?: WhiteLabelData & {
        buttonPosition: BUTTON_POSITION_TYPE;
        hideNftDisplay?: boolean;
        hideTokenDisplay?: boolean;
        hideTransfers?: boolean;
        hideTopup?: boolean;
        hideReceive?: boolean;
        defaultPortfolio?: "token" | "nft";
    };
}
export interface STATUS_NOTIFICATION_DATA {
    loggedIn: boolean;
    rehydrate: boolean;
    currentLoginProvider: string;
}
export interface TopupInput {
    provider: PAYMENT_PROVIDER_TYPE;
    windowId: string;
    params: PaymentParams;
}
export interface Ihandler<T> extends JRPCRequest<T> {
    origin?: string;
    windowId?: string;
}
export interface LoginWithPrivateKeyParams {
    privateKey: string;
    userInfo: UserInfo;
}
export interface ICommunicationProviderHandlers {
    changeProvider: <T extends ProviderConfig & {
        windowId: string;
    }>(req: JRPCRequest<T>) => Promise<boolean>;
    topup: (req: JRPCRequest<TopupInput>) => Promise<boolean>;
    logout: (req: JRPCRequest<[]>, res: JRPCResponse<boolean>, next: JRPCEngineNextCallback, end: JRPCEngineEndCallback) => void;
    getUserInfo: (req: JRPCRequest<[]>, res: JRPCResponse<UserInfo>, next: JRPCEngineNextCallback, end: JRPCEngineEndCallback) => void;
    setIFrameStatus: (req: JRPCRequest<{
        isIFrameFullScreen: boolean;
        rid?: string;
    }>, res: JRPCResponse<boolean>, next: JRPCEngineNextCallback, end: JRPCEngineEndCallback) => void;
    getWalletInstanceId: (req: JRPCRequest<[]>, res: JRPCResponse<string>, next: JRPCEngineNextCallback, end: JRPCEngineEndCallback) => void;
    handleWindowRpc: (req: JRPCRequest<{
        windowId: string;
    }>, res: JRPCResponse<boolean>, next: JRPCEngineNextCallback, end: JRPCEngineEndCallback) => void;
    getProviderState: (req: JRPCRequest<[]>, res: JRPCResponse<CommunicationWalletProviderState>, next: JRPCEngineNextCallback, end: JRPCEngineEndCallback) => void;
    loginWithPrivateKey: (req: Ihandler<LoginWithPrivateKeyParams>) => Promise<{
        success: boolean;
    }>;
    loginWithSessionId: (req: Ihandler<[string, string]>) => Promise<{
        success: boolean;
    }>;
    showWalletConnect: (req: JRPCRequest<[]>, res: JRPCResponse<boolean>, next: JRPCEngineNextCallback, end: JRPCEngineEndCallback) => void;
    showCheckout: (req: JRPCRequest<[]>, res: JRPCResponse<boolean>, next: JRPCEngineNextCallback, end: JRPCEngineEndCallback) => void;
    showWalletUi: (req: JRPCRequest<[]>, res: JRPCResponse<boolean>, next: JRPCEngineNextCallback, end: JRPCEngineEndCallback) => void;
    showWindowBlockAlert: (req: JRPCRequest<[]>, res: JRPCResponse<boolean>, next: JRPCEngineNextCallback, end: JRPCEngineEndCallback) => void;
}
