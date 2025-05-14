// src/components/StorageStats.jsx
import React, { useEffect, useState } from 'react';

const MAX_UPLOADS = 100000;
const MAX_STORAGE = 100 * 1024 * 1024 * 1024; // 100GB in bytes

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const StorageStats = () => {
  const [files, setFiles] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('uploadedFiles');
    if (saved) {
      setFiles(JSON.parse(saved));
    }
  }, []);

  const totalUploads = files.length;
  const totalSize = files.reduce((acc, file) => acc + file.size, 0);
  const uploadsRemaining = MAX_UPLOADS - totalUploads;
  const storageRemaining = MAX_STORAGE - totalSize;
  const averageFileSize = totalUploads > 0 ? totalSize / totalUploads : 0;

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-gray-800 rounded-2xl shadow-xl">
      <h2 className="text-xl font-bold mb-4"> Storage Stats</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
        <div className="p-4 bg-gray-700 rounded-lg">
          <p className="font-semibold">Total Uploads</p>
          <p>{totalUploads}</p>
        </div>
        <div className="p-4 bg-gray-700 rounded-lg">
          <p className="font-semibold">Total Size</p>
          <p>{formatBytes(totalSize)}</p>
        </div>
        <div className="p-4 bg-gray-700 rounded-lg">
          <p className="font-semibold">Uploads Remaining</p>
          <p>{uploadsRemaining}</p>
        </div>
        <div className="p-4 bg-gray-700 rounded-lg">
          <p className="font-semibold">Storage Remaining</p>
          <p>{formatBytes(storageRemaining)}</p>
        </div>
        <div className="p-4 bg-gray-700 rounded-lg col-span-1 md:col-span-2">
          <p className="font-semibold">Average File Size</p>
          <p>{formatBytes(averageFileSize)}</p>
        </div>
      </div>
    </div>
  );
};

export default StorageStats;
