"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QRHardwareCall = exports.QRHardwareCallVersion = exports.QRHardwareCallType = void 0;
const RegistryType_1 = require("../RegistryType");
const RegistryItem_1 = require("../RegistryItem");
const lib_1 = require("../lib");
const KeyDerivation_1 = require("./KeyDerivation");
var Keys;
(function (Keys) {
    Keys[Keys["type"] = 1] = "type";
    Keys[Keys["params"] = 2] = "params";
    Keys[Keys["origin"] = 3] = "origin";
    Keys[Keys["version"] = 4] = "version";
})(Keys || (Keys = {}));
var QRHardwareCallType;
(function (QRHardwareCallType) {
    QRHardwareCallType[QRHardwareCallType["KeyDerivation"] = 0] = "KeyDerivation";
})(QRHardwareCallType = exports.QRHardwareCallType || (exports.QRHardwareCallType = {}));
var QRHardwareCallVersion;
(function (QRHardwareCallVersion) {
    QRHardwareCallVersion[QRHardwareCallVersion["V0"] = 0] = "V0";
    QRHardwareCallVersion[QRHardwareCallVersion["V1"] = 1] = "V1";
})(QRHardwareCallVersion = exports.QRHardwareCallVersion || (exports.QRHardwareCallVersion = {}));
class QRHardwareCall extends RegistryItem_1.RegistryItem {
    constructor(type, params, origin, version) {
        super();
        this.type = type;
        this.params = params;
        this.origin = origin;
        this.version = version;
        this.getRegistryType = () => RegistryType_1.RegistryTypes.QR_HARDWARE_CALL;
        this.getType = () => this.type;
        this.getParams = () => this.params;
        this.getOrigin = () => this.origin;
        this.getVersion = () => this.version;
        this.toDataItem = () => {
            const map = {};
            map[Keys.type] = this.type;
            const param = this.params.toDataItem();
            param.setTag(this.params.getRegistryType().getTag());
            map[Keys.params] = param;
            if (this.origin) {
                map[Keys.origin] = this.origin;
            }
            if (this.version) {
                map[Keys.version] = this.version;
            }
            return new lib_1.DataItem(map);
        };
    }
}
exports.QRHardwareCall = QRHardwareCall;
QRHardwareCall.fromDataItem = (dataItem) => {
    const map = dataItem.getData();
    const type = map[Keys.type] || QRHardwareCallType.KeyDerivation;
    let params;
    switch (type) {
        case QRHardwareCallType.KeyDerivation:
            params = KeyDerivation_1.KeyDerivation.fromDataItem(map[Keys.params]);
    }
    const origin = map[Keys.origin];
    const version = map[Keys.version];
    return new QRHardwareCall(type, params, origin, version);
};
QRHardwareCall.fromCBOR = (_cborPayload) => {
    const dataItem = (0, lib_1.decodeToDataItem)(_cborPayload);
    return QRHardwareCall.fromDataItem(dataItem);
};
//# sourceMappingURL=QRHardwareCall.js.map