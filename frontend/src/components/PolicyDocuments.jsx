import { useState, useEffect } from 'react';
import { Search, Trash2 } from 'lucide-react';
import axios from 'axios';

export default function PolicyDocuments() {
  const [fileList, setFileList] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetchFileList();
  }, []);

  const fetchFileList = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get('http://localhost:8000/list-files', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFileList(res.data);
    } catch (err) {
      setStatus('Failed to load file list');
    }
  };

  const handleDelete = async (filename) => {
    if (!window.confirm(`Delete "${filename}"?`)) return;
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`http://localhost:8000/delete-file/${filename}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStatus(`Deleted "${filename}"`);
      await fetchFileList();
    } catch (err) {
      setStatus('Delete failed: ' + (err.response?.data?.detail || err.message));
    }
  };

  // Filter files (excluding .txt and .json)
  const filteredFiles = fileList
    .filter(filename => !filename.endsWith('.txt') && !filename.endsWith('.json'))
    .filter(filename => filename.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6">
      <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Policy Documents</h3>
      <div className="flex gap-4 mb-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search files..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>
      {status && (
        <div className="mb-4 text-sm px-4 py-2 rounded bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
          {status}
        </div>
      )}
      {filteredFiles.length > 0 ? (
        <ul className="space-y-2">
          {filteredFiles.map((filename, idx) => (
            <li
              key={idx}
              className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 px-4 py-2 rounded shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <span className="text-gray-800 dark:text-gray-100">{filename}</span>
              <button
                onClick={() => handleDelete(filename)}
                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">No files found. Upload a file to get started.</p>
      )}
    </div>
  );
}