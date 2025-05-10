/// <reference types="node" />
import { RegistryItem } from "../RegistryItem";
import { DataItem } from '../lib';
import { KeyDerivationSchema } from './DerivationSchema';
export declare class KeyDerivation extends RegistryItem {
    private schemas;
    getRegistryType: () => import("../RegistryType").RegistryType;
    constructor(schemas: KeyDerivationSchema[]);
    getSchemas: () => KeyDerivationSchema[];
    toDataItem: () => DataItem;
    static fromDataItem: (dataItem: DataItem) => KeyDerivation;
    static fromCBOR: (_cborPayload: Buffer) => KeyDerivation;
}
