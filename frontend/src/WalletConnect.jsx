import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';
import { useEffect, useState } from 'react';

export default function WalletConnect() {
  const { publicKey, connected } = useWallet();
  const [balance, setBalance] = useState(null);
  const connection = new Connection(clusterApiUrl('devnet'));

  useEffect(() => {
    const fetchBalance = async () => {
      if (publicKey) {
        const balance = await connection.getBalance(new PublicKey(publicKey));
        setBalance(balance / 1e9);
      }
    };
    fetchBalance();
  }, [publicKey]);

  return (
    <div className="flex flex-col items-end gap-2 p-2 rounded-xl bg-gray-800 shadow-lg">
      <WalletMultiButton />
      {connected && (
        <div className="text-xs text-right text-gray-300 leading-tight">
          <p>{publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}</p>
          <p>{balance !== null ? `${balance.toFixed(4)} SOL` : 'Loading...'}</p>
        </div>
      )}
    </div>
  );
}
