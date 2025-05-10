import { Amount, Path, MPTAmount } from '../common';
import { BaseTransaction, GlobalFlags, Account } from './common';
import type { TransactionMetadataBase } from './metadata';
export declare enum PaymentFlags {
    tfNoRippleDirect = 65536,
    tfPartialPayment = 131072,
    tfLimitQuality = 262144
}
export interface PaymentFlagsInterface extends GlobalFlags {
    tfNoRippleDirect?: boolean;
    tfPartialPayment?: boolean;
    tfLimitQuality?: boolean;
}
export interface Payment extends BaseTransaction {
    TransactionType: 'Payment';
    Amount: Amount | MPTAmount;
    Destination: Account;
    DestinationTag?: number;
    InvoiceID?: string;
    Paths?: Path[];
    SendMax?: Amount | MPTAmount;
    DeliverMin?: Amount | MPTAmount;
    CredentialIDs?: string[];
    Flags?: number | PaymentFlagsInterface;
}
export interface PaymentMetadata extends TransactionMetadataBase {
    DeliveredAmount?: Amount | MPTAmount;
    delivered_amount?: Amount | MPTAmount | 'unavailable';
}
export declare function validatePayment(tx: Record<string, unknown>): void;
//# sourceMappingURL=payment.d.ts.map