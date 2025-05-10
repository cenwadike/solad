"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyDerivationSchema = exports.DerivationAlgorithm = exports.Curve = void 0;
const RegistryType_1 = require("../RegistryType");
const RegistryItem_1 = require("../RegistryItem");
const lib_1 = require("../lib");
const CryptoKeypath_1 = require("../CryptoKeypath");
var Keys;
(function (Keys) {
    Keys[Keys["keyPath"] = 1] = "keyPath";
    Keys[Keys["curve"] = 2] = "curve";
    Keys[Keys["algo"] = 3] = "algo";
    Keys[Keys["chainType"] = 4] = "chainType";
})(Keys || (Keys = {}));
var Curve;
(function (Curve) {
    Curve[Curve["secp256k1"] = 0] = "secp256k1";
    Curve[Curve["ed25519"] = 1] = "ed25519";
})(Curve = exports.Curve || (exports.Curve = {}));
var DerivationAlgorithm;
(function (DerivationAlgorithm) {
    DerivationAlgorithm[DerivationAlgorithm["slip10"] = 0] = "slip10";
    DerivationAlgorithm[DerivationAlgorithm["bip32ed25519"] = 1] = "bip32ed25519";
})(DerivationAlgorithm = exports.DerivationAlgorithm || (exports.DerivationAlgorithm = {}));
class KeyDerivationSchema extends RegistryItem_1.RegistryItem {
    constructor(keypath, curve = Curve.secp256k1, algo = DerivationAlgorithm.slip10, chainType) {
        super();
        this.keypath = keypath;
        this.curve = curve;
        this.algo = algo;
        this.chainType = chainType;
        this.getRegistryType = () => RegistryType_1.RegistryTypes.KEY_DERIVATION_SCHEMA;
        this.getKeypath = () => this.keypath;
        this.getCurve = () => this.curve;
        this.getAlgo = () => this.algo;
        this.getChainType = () => this.chainType;
        this.toDataItem = () => {
            const map = {};
            const dataItem = this.getKeypath().toDataItem();
            dataItem.setTag(this.getKeypath().getRegistryType().getTag());
            map[Keys.keyPath] = dataItem;
            map[Keys.curve] = this.curve;
            map[Keys.algo] = this.algo;
            if (this.chainType) {
                map[Keys.chainType] = this.chainType;
            }
            return new lib_1.DataItem(map);
        };
    }
}
exports.KeyDerivationSchema = KeyDerivationSchema;
KeyDerivationSchema.fromDataItem = (dataItem) => {
    const map = dataItem.getData();
    const keypaths = CryptoKeypath_1.CryptoKeypath.fromDataItem(map[Keys.keyPath]);
    const curve = map[Keys.curve];
    const algo = map[Keys.algo];
    const chainType = map[Keys.chainType];
    return new KeyDerivationSchema(keypaths, curve, algo, chainType);
};
KeyDerivationSchema.fromCBOR = (_cborPayload) => {
    const dataItem = (0, lib_1.decodeToDataItem)(_cborPayload);
    return KeyDerivationSchema.fromDataItem(dataItem);
};
//# sourceMappingURL=DerivationSchema.js.map