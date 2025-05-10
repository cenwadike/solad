"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyDerivation = void 0;
const RegistryType_1 = require("../RegistryType");
const RegistryItem_1 = require("../RegistryItem");
const lib_1 = require("../lib");
const DerivationSchema_1 = require("./DerivationSchema");
var Keys;
(function (Keys) {
    Keys[Keys["schemas"] = 1] = "schemas";
})(Keys || (Keys = {}));
class KeyDerivation extends RegistryItem_1.RegistryItem {
    constructor(schemas) {
        super();
        this.schemas = schemas;
        this.getRegistryType = () => RegistryType_1.RegistryTypes.KEY_DERIVATION_CALL;
        this.getSchemas = () => this.schemas;
        this.toDataItem = () => {
            const map = {};
            map[Keys.schemas] = this.schemas.map(schema => {
                const dataItem = schema.toDataItem();
                dataItem.setTag(schema.getRegistryType().getTag());
                return dataItem;
            });
            return new lib_1.DataItem(map);
        };
    }
}
exports.KeyDerivation = KeyDerivation;
KeyDerivation.fromDataItem = (dataItem) => {
    const map = dataItem.getData();
    const schemas = map[Keys.schemas].map(keypath => DerivationSchema_1.KeyDerivationSchema.fromDataItem(keypath));
    return new KeyDerivation(schemas);
};
KeyDerivation.fromCBOR = (_cborPayload) => {
    const dataItem = (0, lib_1.decodeToDataItem)(_cborPayload);
    return KeyDerivation.fromDataItem(dataItem);
};
//# sourceMappingURL=KeyDerivation.js.map