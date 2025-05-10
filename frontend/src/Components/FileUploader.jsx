import React, { useState, useRef } from 'react';
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram
} from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';

const PROGRAM_ID = new PublicKey('4Fbo2dQdqrVhxLBbZrxVEbDBxp8GmNa9voEN96d4fQJp');
const RPC_URL = 'https://api.devnet.solana.com';
const connection = new Connection(RPC_URL);
const NODE_API_URL = 'http://127.0.0.1:8080/api/set';

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024,
    sizes = ['B', 'KB', 'MB', 'GB', 'TB'],
    i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

const FileUploader = () => {
  const wallet = useWallet();
  const [files, setFiles] = useState(() => {
    const saved = localStorage.getItem('uploadedFiles');
    return saved ? JSON.parse(saved) : [];
  });

  const [progress, setProgress] = useState(0);
  const [copiedHash, setCopiedHash] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const inputRef = useRef();
  const [searchHash, setSearchHash] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleFiles = async (fileList) => {
    for (let file of fileList) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 5;
        });
      }, 20);
  
      const reader = new FileReader();
      reader.readAsArrayBuffer(file);
      reader.onloadend = async () => {
        const arrayBuffer = reader.result;
        const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const dataHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // Convert ArrayBuffer to base64
        const binary = new Uint8Array(arrayBuffer);
        const base64Data = btoa(String.fromCharCode(...binary));

        const size_bytes = file.size;
        const shard_count = 1;
        const storage_duration_days = 1;
  
        const fileData = {
          name: file.name,
          size: file.size,
          formattedSize: formatBytes(file.size),
          hash: dataHash,
        };
  
        try {
          // Upload to Solana
          const signature = await uploadToSolana({
            wallet,
            dataHash,
            size_bytes,
            shard_count,
            storage_duration_days
          });

          // Derive upload_pda
          const uploadPda = PublicKey.findProgramAddressSync(
            [
              Buffer.from('upload'),
              Buffer.from(dataHash.slice(0, 32)),
              wallet.publicKey.toBuffer(),
            ],
            PROGRAM_ID
          )[0].toBase58();

          // Upload to node
          await uploadToNode({
            key: file.name,
            data: base64Data,
            hash: dataHash,
            format: 'binary',
            upload_pda: uploadPda,
          });
          
          setFiles((prev) => {
            const updated = [fileData, ...prev];
            localStorage.setItem('uploadedFiles', JSON.stringify(updated));
            return updated;
          });
        } catch (err) {
          console.error("Upload error:", err);
          alert(`❌ Failed to upload: ${err.message}`);
        } finally {
          clearInterval(interval);
          setProgress(100);
        }
      };
    }
  };
  
  const uploadToSolana = async ({ wallet, dataHash, size_bytes, shard_count, storage_duration_days }) => {
    if (!wallet?.publicKey) throw new Error("Wallet not connected");
  
    const dataBuffer = Buffer.from(dataHash.padEnd(32), 'utf-8');
    const sizeBuffer = Buffer.alloc(8);
    sizeBuffer.writeBigUInt64LE(BigInt(size_bytes));
  
    const durationBuffer = Buffer.alloc(8);
    durationBuffer.writeBigUInt64LE(BigInt(storage_duration_days));
  
    const instructionData = Buffer.concat([
      dataBuffer,
      sizeBuffer,
      Buffer.from([shard_count]),
      durationBuffer
    ]);
  
    const transaction = new Transaction().add({
      keys: [{ pubkey: wallet.publicKey, isSigner: true, isWritable: false }],
      programId: PROGRAM_ID,
      data: instructionData
    });
  
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;
  
    const signed = await wallet.signTransaction(transaction);
    const sig = await connection.sendRawTransaction(signed.serialize());
    await connection.confirmTransaction(sig);
    return sig;
  };

  // Function to upload data to the node
  const uploadToNode = async (payload) => {
    try {
      const response = await fetch(NODE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      }

      const text = await response.text();
      if (text !== 'Data set successfully') {
        throw new Error('Unexpected response from node');
      }
    } catch (err) {
      console.error('Node upload error:', err);
      throw new Error(`Failed to upload to node: ${err.message}`);
    }
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    const droppedFiles = event.dataTransfer.files;
    await handleFiles(droppedFiles);
  };

  const handleFileInput = (e) => {
    handleFiles(e.target.files);
  };

  const handleCopy = (hash) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleDragOver = (e) => e.preventDefault();

  const openModal = () => setShowModal(true);
  const closeModal = () => {
    setShowModal(false);
    setResult(null);
    setSearchHash('');
    setError('');
  };

  const handleSearch = () => {
    const savedFiles = JSON.parse(localStorage.getItem('uploadedFiles')) || [];
    const foundFile = savedFiles.find((file) => file.hash === searchHash.trim());

    if (foundFile) {
      setResult(foundFile);
      setError('');
    } else {
      setResult(null);
      setError('❌ No file found for this hash.');
    }
  };

  const [showStreamModal, setShowStreamModal] = useState(false);
  const [streamConfig, setStreamConfig] = useState({
    source: 'Direct',
    type: 'Transaction Logs',
    duration: '',
  });

  const handleStreamStart = () => {
    setShowStreamModal(false);

    // Simulate streaming event
    const mockStreamData = {
      name: `${streamConfig.type} Stream`,
      size: Math.floor(Math.random() * 50000 + 5000),
      formattedSize: formatBytes(Math.floor(Math.random() * 50000 + 5000)),
      hash: generateMockHash({
        name: `${streamConfig.type}-${Date.now()}`,
        size: 1,
      }),
    };

    setFiles((prev) => {
      const updated = [mockStreamData, ...prev];
      localStorage.setItem('uploadedFiles', JSON.stringify(updated));
      return updated;
    });

    alert(`🔄 Streaming started for ${streamConfig.duration} using ${streamConfig.source}`);
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-gray-800 rounded-2xl shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold"> Upload File</h2>
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => setShowStreamModal(true)}
            className="bg-blue-600 font-medium text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition"
          >
            Start Data Stream
          </button>
        </div>

        <button
          onClick={openModal}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg"
        >
          Retrieve Data
        </button>
      </div>

      {/* Upload Section */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => inputRef.current.click()}
        className="w-full h-40 border-2 border-dashed border-gray-500 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-700 transition"
      >
        <input
          type="file"
          multiple
          ref={inputRef}
          className="hidden"
          onChange={handleFileInput}
        />
        <span className="text-gray-300">Drag & drop or click to upload</span>
      </div>

      {progress > 0 && progress < 100 && (
        <div className="w-full bg-gray-700 rounded mt-4">
          <div
            className="bg-blue-500 text-xs leading-none py-1 text-center text-white rounded"
            style={{ width: `${progress}%` }}
          >
            Uploading... {progress}%
          </div>
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Uploaded Files</h3>
          <table className="w-full text-left table-auto border-collapse">
            <thead>
              <tr className="text-sm text-gray-400">
                <th className="pb-2">File Name</th>
                <th className="pb-2">Size</th>
                <th className="pb-2">Hash</th>
                <th className="pb-2">Copy</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file, i) => (
                <tr key={i} className="border-t border-gray-700 text-sm">
                  <td className="py-2">{file.name}</td>
                  <td>{file.formattedSize}</td>
                  <td className="break-all text-green-400">{file.hash}</td>
                  <td>
                    <button
                      onClick={() => handleCopy(file.hash)}
                      className="bg-blue-700 text-white rounded-lg px-2 hover:text-blue-700 hover:bg-white"
                    >
                      {copiedHash === file.hash ? "Copied!" : "Copy"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-gray-800 p-6 rounded-xl max-w-md w-full relative">
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-gray-400 hover:text-white"
            >
              ✖
            </button>
            <h2 className="text-xl font-bold mb-4 text-white">🔎 Query by Hash</h2>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Enter file hash..."
                value={searchHash}
                onChange={(e) => setSearchHash(e.target.value)}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400"
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg"
              >
                Search
              </button>
            </div>

            {result && (
              <div className="bg-gray-700 p-4 rounded-lg text-sm text-white">
                <p><strong>Name:</strong> {result.name}</p>
                <p><strong>Size:</strong> {result.formattedSize}</p>
                <p className="break-all"><strong>Hash:</strong> {result.hash}</p>
              </div>
            )}

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}
          </div>
        </div>
      )}

      {showStreamModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-xl w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold mb-4">🔌 Stream Blockchain Data</h3>

            <label className="block mb-2 text-sm">Source</label>
            <select
              value={streamConfig.source}
              onChange={(e) => setStreamConfig({ ...streamConfig, source: e.target.value })}
              className="w-full p-2 mb-4 bg-gray-800 border border-gray-700 rounded"
            >
              <option>Geyser</option>
              <option>Direct</option>
            </select>

            <label className="block mb-2 text-sm">Event Type</label>
            <select
              value={streamConfig.type}
              onChange={(e) => setStreamConfig({ ...streamConfig, type: e.target.value })}
              className="w-full p-2 mb-4 bg-gray-800 border border-gray-700 rounded"
            >
              <option>Transaction Logs</option>
              <option>Slot Events</option>
              <option>Vote Events</option>
              <option>Block Events</option>
            </select>

            {streamConfig.type === 'Transaction Logs' && (
              <>
                <label className="block mb-2 text-sm">Program</label>
                <input
                  type="text"
                  value={streamConfig.program || ''}
                  onChange={(e) => setStreamConfig({ ...streamConfig, program: e.target.value })}
                  className="w-full p-2 mb-4 bg-gray-800 border border-gray-700 rounded text-white"
                  placeholder="Enter program ID"
                />

                <label className="block mb-2 text-sm">Event</label>
                <input
                  type="text"
                  value={streamConfig.event || ''}
                  onChange={(e) => setStreamConfig({ ...streamConfig, event: e.target.value })}
                  className="w-full p-2 mb-4 bg-gray-800 border border-gray-700 rounded text-white"
                  placeholder="Enter event name"
                />
              </>
            )}

            <label className="block mb-2 text-sm">Duration (mins)</label>
            <input
              type="number"
              value={streamConfig.duration}
              onChange={(e) => setStreamConfig({ ...streamConfig, duration: e.target.value })}
              className="w-full p-2 mb-4 bg-gray-800 border border-gray-700 rounded text-white"
              placeholder="e.g. 30"
            />

            <div className="flex justify-between">
              <button
                onClick={() => setShowStreamModal(false)}
                className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleStreamStart}
                className="px-4 py-2 bg-green-600 rounded hover:bg-green-500"
              >
                Start Streaming
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploader;