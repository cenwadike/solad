"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertPayloadIsSignedPartialTransactionPayload = void 0;
const guards_1 = require("../lib/guards");
function assertPayloadIsSignedPartialTransactionPayload(payload) {
    if (!(0, guards_1.isObject)(payload)) {
        return false;
    }
    if (!('transactionB58String' in payload)) {
        return false;
    }
    return typeof payload.transactionB58String === 'string';
}
exports.assertPayloadIsSignedPartialTransactionPayload = assertPayloadIsSignedPartialTransactionPayload;
//# sourceMappingURL=signed-partial-transaction.js.map