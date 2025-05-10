import { LitElement } from 'lit';
import '@reown/appkit-ui/wui-button';
import '@reown/appkit-ui/wui-flex';
import '@reown/appkit-ui/wui-icon';
import '@reown/appkit-ui/wui-text';
import '../../partials/w3m-swap-details/index.js';
import '../../partials/w3m-swap-input-skeleton/index.js';
import '../../partials/w3m-swap-input/index.js';
export declare class W3mSwapView extends LitElement {
    static styles: import("lit").CSSResult;
    private unsubscribe;
    private interval?;
    private detailsOpen;
    private caipNetworkId;
    private initialized;
    private loadingQuote;
    private loadingPrices;
    private loadingTransaction;
    private sourceToken;
    private sourceTokenAmount;
    private sourceTokenPriceInUSD;
    private toToken;
    private toTokenAmount;
    private toTokenPriceInUSD;
    private inputError;
    private gasPriceInUSD;
    private fetchError;
    constructor();
    firstUpdated(): void;
    disconnectedCallback(): void;
    render(): import("lit").TemplateResult<1>;
    private watchTokensAndValues;
    private templateSwap;
    private actionButtonLabel;
    private templateReplaceTokensButton;
    private templateLoading;
    private templateTokenInput;
    private onSetMaxValue;
    private templateDetails;
    private handleChangeAmount;
    private templateActionButton;
    private onDebouncedGetSwapCalldata;
    private onSwitchTokens;
    private onSwapPreview;
}
declare global {
    interface HTMLElementTagNameMap {
        'w3m-swap-view': W3mSwapView;
    }
}
