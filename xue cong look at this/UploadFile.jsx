// 2. create new component UploadFile.jsx

import { useState } from 'react';
import axios from 'axios';

export default function UploadFile() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setStatus('No file selected');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:8000/upload-file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setStatus(response.data.message);
    } catch (err) {
      setStatus('Upload failed: ' + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="space-y-4 mt-4">
      <input type="file" onChange={handleFileChange} />
      <button
        onClick={handleUpload}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Upload File
      </button>
      {status && <p className="text-sm text-gray-700">{status}</p>}
    </div>
  );
}
