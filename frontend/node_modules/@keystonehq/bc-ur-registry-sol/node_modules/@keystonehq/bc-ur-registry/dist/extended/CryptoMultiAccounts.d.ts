/// <reference types="node" />
import { CryptoHDKey } from "../CryptoHDKey";
import { RegistryItem } from "../RegistryItem";
import { DataItem } from '../lib';
export declare class CryptoMultiAccounts extends RegistryItem {
    private masterFingerprint;
    private keys;
    private device?;
    private deviceId?;
    private version?;
    getRegistryType: () => import("../RegistryType").RegistryType;
    constructor(masterFingerprint: Buffer, keys: CryptoHDKey[], device?: string, deviceId?: string, version?: string);
    getMasterFingerprint: () => Buffer;
    getKeys: () => CryptoHDKey[];
    getDevice: () => string;
    getDeviceId: () => string;
    getVersion: () => string;
    toDataItem: () => DataItem;
    static fromDataItem: (dataItem: DataItem) => CryptoMultiAccounts;
    static fromCBOR: (_cborPayload: Buffer) => CryptoMultiAccounts;
}
