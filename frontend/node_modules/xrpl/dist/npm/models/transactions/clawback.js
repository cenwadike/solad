"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateClawback = void 0;
const errors_1 = require("../../errors");
const common_1 = require("./common");
function validateClawback(tx) {
    (0, common_1.validateBaseTransaction)(tx);
    (0, common_1.validateOptionalField)(tx, 'Holder', common_1.isAccount);
    if (tx.Amount == null) {
        throw new errors_1.ValidationError('Clawback: missing field Amount');
    }
    if (!(0, common_1.isIssuedCurrency)(tx.Amount) && !(0, common_1.isMPTAmount)(tx.Amount)) {
        throw new errors_1.ValidationError('Clawback: invalid Amount');
    }
    if ((0, common_1.isIssuedCurrency)(tx.Amount) && tx.Account === tx.Amount.issuer) {
        throw new errors_1.ValidationError('Clawback: invalid holder Account');
    }
    if ((0, common_1.isMPTAmount)(tx.Amount) && tx.Account === tx.Holder) {
        throw new errors_1.ValidationError('Clawback: invalid holder Account');
    }
    if ((0, common_1.isIssuedCurrency)(tx.Amount) && tx.Holder) {
        throw new errors_1.ValidationError('Clawback: cannot have Holder for currency');
    }
    if ((0, common_1.isMPTAmount)(tx.Amount) && !tx.Holder) {
        throw new errors_1.ValidationError('Clawback: missing Holder');
    }
}
exports.validateClawback = validateClawback;
//# sourceMappingURL=clawback.js.map