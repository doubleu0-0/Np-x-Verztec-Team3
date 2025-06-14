import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { UploadCloud } from 'lucide-react';

export default function UploadFile() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchFileList();
  }, []);

  const fetchFileList = async () => {
    try {
      const res = await axios.get('http://localhost:8000/list-files');
      setFileList(res.data);
    } catch (err) {
      console.error('Failed to fetch file list:', err);
      setStatus('Failed to load file list');
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setFile(selected);
    setStatus('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    setFile(droppedFile);
    setStatus('');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleUpload = async () => {
    if (!file) {
      setStatus('No file selected');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    try {
      const response = await axios.post('http://localhost:8000/upload-file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setStatus(response.data.message);
      await fetchFileList(); // refresh file list after upload
    } catch (err) {
      setStatus('Upload failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (filename) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete "${filename}"?`);
    if (!confirmDelete) return;

    try {
      await axios.delete(`http://localhost:8000/delete-file/${filename}`);
      setStatus(`Deleted "${filename}"`);
      await fetchFileList(); // refresh list
    } catch (err) {
      setStatus('Delete failed: ' + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      {/* Upload Box */}
      <div
        className="border-2 border-dashed border-gray-400 rounded-lg p-8 flex flex-col items-center justify-center text-center transition-all duration-200 hover:border-yellow-500 hover:bg-yellow-50/20 cursor-pointer"
        onClick={() => fileInputRef.current.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <UploadCloud className="w-10 h-10 text-gray-500 mb-2" />
        <p className="text-gray-700 mb-2">
          {file ? (
            <span className="font-medium text-yellow-600">{file.name}</span>
          ) : (
            <>
              Drag and drop your file here<br />
              <span className="text-sm text-gray-500">or click to browse</span>
            </>
          )}
        </p>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={isUploading || !file}
        className={`mt-4 w-full py-2 rounded text-white transition ${
          isUploading || !file
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-yellow-500 hover:bg-yellow-600'
        }`}
      >
        {isUploading ? 'Uploading...' : 'Upload File'}
      </button>

      {/* Status Message */}
      {status && (
        <div className={`mt-2 text-sm px-4 py-2 rounded ${
          status.startsWith('Upload failed') || status.startsWith('Delete failed') || status.includes('No file')
            ? 'text-red-700 bg-red-100'
            : 'text-green-700 bg-green-100'
        }`}>
          {status}
        </div>
      )}

      {/* File List */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Files in raw_data</h2>
        {fileList.length > 0 ? (
          <ul className="space-y-2">
            {fileList.map((filename, idx) => (
              <li
                key={idx}
                className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded shadow-sm border"
              >
                <span className="text-gray-800">{filename}</span>
                <button
                  onClick={() => handleDelete(filename)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No files found in the folder.</p>
        )}
      </div>
    </div>
  );
}
