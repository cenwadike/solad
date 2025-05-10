import { isObject } from "../lib/guards.js";
export function assertPayloadIsSignedPartialTransactionPayload(payload) {
    if (!isObject(payload)) {
        return false;
    }
    if (!('transactionB58String' in payload)) {
        return false;
    }
    return typeof payload.transactionB58String === 'string';
}
//# sourceMappingURL=signed-partial-transaction.js.map