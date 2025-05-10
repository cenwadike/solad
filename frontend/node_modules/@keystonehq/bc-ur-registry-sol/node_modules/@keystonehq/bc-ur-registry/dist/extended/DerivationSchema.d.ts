/// <reference types="node" />
import { RegistryItem } from '../RegistryItem';
import { DataItem } from '../lib';
import { CryptoKeypath } from '../CryptoKeypath';
export declare enum Curve {
    secp256k1 = 0,
    ed25519 = 1
}
export declare enum DerivationAlgorithm {
    slip10 = 0,
    bip32ed25519 = 1
}
export declare class KeyDerivationSchema extends RegistryItem {
    private keypath;
    private curve;
    private algo;
    private chainType?;
    getRegistryType: () => import("../RegistryType").RegistryType;
    constructor(keypath: CryptoKeypath, curve?: Curve, algo?: DerivationAlgorithm, chainType?: String);
    getKeypath: () => CryptoKeypath;
    getCurve: () => Curve;
    getAlgo: () => DerivationAlgorithm;
    getChainType: () => String;
    toDataItem: () => DataItem;
    static fromDataItem: (dataItem: DataItem) => KeyDerivationSchema;
    static fromCBOR: (_cborPayload: Buffer) => KeyDerivationSchema;
}
