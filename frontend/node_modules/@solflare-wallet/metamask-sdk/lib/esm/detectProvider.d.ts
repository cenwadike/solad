import { EthereumProvider } from './types';
export declare function isSnapSupported(provider: EthereumProvider): Promise<boolean>;
export declare function detectProvider(): Promise<EthereumProvider | null>;
