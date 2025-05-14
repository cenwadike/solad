import { useMemo } from 'react';
import '@solana/wallet-adapter-react-ui/styles.css';

import {
  ConnectionProvider,
  WalletProvider
} from '@solana/wallet-adapter-react';

import {
  WalletModalProvider
} from '@solana/wallet-adapter-react-ui';

import {
  PhantomWalletAdapter
} from '@solana/wallet-adapter-wallets';

import {
  WalletAdapterNetwork
} from '@solana/wallet-adapter-base';
import { clusterApiUrl } from '@solana/web3.js';

import WalletConnect from './WalletConnect';
import FileUploader from '../src/Components/FileUploader';
import StorageStats from '../src/Components/StorageStats';

export default function App() {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="min-h-screen bg-gray-900 text-white relative">
            {/* Top Right Wallet */}
            <div className="absolute top-4 right-4 z-50">
              <WalletConnect />
            </div>

            {/* Main UI */}
            <main className="pt-28 px-4">
              <h1 className="text-3xl font-bold text-center mb-10">SOLAD: Solana Storage Lad 🐾</h1>
              <FileUploader />
              <StorageStats />
            </main>
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
