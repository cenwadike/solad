export interface SignedPartialTransactionPayload extends Record<string, string> {
    transactionB58String: string;
}
export declare function assertPayloadIsSignedPartialTransactionPayload(payload: unknown): payload is SignedPartialTransactionPayload;
//# sourceMappingURL=signed-partial-transaction.d.ts.map