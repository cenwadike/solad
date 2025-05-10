// components/HashQuery.jsx
import React, { useState } from 'react';

const HashQuery = () => {
  const [searchHash, setSearchHash] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

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

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-gray-800 rounded-2xl shadow-xl">
      <h2 className="text-xl font-bold mb-4">🔎 Query by Hash</h2>
      
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
  );
};

export default HashQuery;
