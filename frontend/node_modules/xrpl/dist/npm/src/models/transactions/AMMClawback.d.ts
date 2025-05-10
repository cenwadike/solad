import { Currency, IssuedCurrency, IssuedCurrencyAmount } from '../common';
import { Account, BaseTransaction, GlobalFlags } from './common';
export declare enum AMMClawbackFlags {
    tfClawTwoAssets = 1
}
export interface AMMClawbackFlagsInterface extends GlobalFlags {
    tfClawTwoAssets?: boolean;
}
export interface AMMClawback extends BaseTransaction {
    TransactionType: 'AMMClawback';
    Holder: Account;
    Asset: IssuedCurrency;
    Asset2: Currency;
    Amount?: IssuedCurrencyAmount;
}
export declare function validateAMMClawback(tx: Record<string, unknown>): void;
//# sourceMappingURL=AMMClawback.d.ts.map