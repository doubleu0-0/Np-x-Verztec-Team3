import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { UploadCloud } from 'lucide-react';

export default function UploadXlsxButton() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [users, setUsers] = useState([]);
  const [user, setUser] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const fileInputRef = useRef(null);

  // Fetch current user and users list
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await axios.get('http://localhost:8000/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data.session);
      } catch (err) {
        setUser(null);
      }
    };
    fetchUser();
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8000/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers(res.data);
    } catch (err) {
      setStatus('Failed to load users');
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.name.endsWith('.xlsx')) {
      setFile(selected);
      setStatus('');
      setUploadResult(null);
    } else {
      setStatus('Please upload a valid .xlsx file');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.xlsx')) {
      setFile(droppedFile);
      setStatus('');
      setUploadResult(null);
    } else {
      setStatus('Only .xlsx files are allowed.');
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleUpload = async () => {
    if (!file) {
      setStatus('No file selected');
      return;
    }
    setIsUploading(true);
    setStatus('');
    setUploadResult(null);
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post('http://localhost:8000/upload-xlsx', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      setStatus(response.data.message || 'Upload complete');
      setUploadResult(response.data.result || null);
      await fetchUsers();
    } catch (err) {
      setStatus('Upload failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setIsUploading(false);
    }
  };

  // Hide UI for USER role or if not loaded yet
  if (!user) {
    return <div className="text-center py-10 text-gray-500">Loading...</div>;
  }
  if (user.role === 'USER') {
    return (
      <div className="text-center py-10 text-gray-500">
        You do not have access to this feature.
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4">

      {/* Upload Section */}
      <div
        className="border-2 border-dashed border-gray-400 dark:border-gray-600 rounded-lg p-8 flex flex-col items-center justify-center text-center transition-all duration-200 hover:border-yellow-500 hover:bg-yellow-50/10 dark:hover:bg-gray-800 cursor-pointer"
        onClick={() => fileInputRef.current.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <UploadCloud className="w-10 h-10 text-gray-500 dark:text-gray-400 mb-2" />
        <p className="text-gray-700 dark:text-gray-300">
          {file ? (
            <span className="font-medium text-yellow-600 dark:text-yellow-400">{file.name}</span>
          ) : (
            <>
              Drag and drop your <code>.xlsx</code> file here<br />
              <span className="text-sm text-gray-500 dark:text-gray-400">or click to browse</span>
            </>
          )}
        </p>
        <input
          type="file"
          accept=".xlsx"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <button
        onClick={handleUpload}
        disabled={isUploading || !file}
        className={`mt-4 w-full py-2 rounded text-white transition ${
          isUploading || !file
            ? 'bg-gray-400 dark:bg-gray-700 cursor-not-allowed'
            : 'bg-yellow-500 hover:bg-yellow-600'
        }`}
      >
        {isUploading ? 'Uploading...' : 'Upload File'}
      </button>

      {status && (
        <div className={`mt-2 text-sm px-4 py-2 rounded ${
          status.startsWith('Upload failed') || status.includes('valid')
            ? 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/40'
            : 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/40'
        }`}>
          {status}
        </div>
      )}

      {/* Upload Result Table */}
      {uploadResult && (
        <div className="mt-6">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Upload Results</h3>
          <div className="overflow-x-auto">
            <table className="min-w-max text-xs border border-gray-300 dark:border-gray-700">
              <thead>
                <tr className="bg-yellow-100 dark:bg-gray-700">
                  <th className="px-2 py-1 border border-gray-300 dark:border-gray-700">Line</th>
                  <th className="px-2 py-1 border border-gray-300 dark:border-gray-700">Username</th>
                  <th className="px-2 py-1 border border-gray-300 dark:border-gray-700">Status</th>
                  <th className="px-2 py-1 border border-gray-300 dark:border-gray-700">Message</th>
                </tr>
              </thead>
              <tbody>
                {uploadResult.map((row, idx) => (
                  <tr key={idx}>
                    <td className="px-2 py-1 border border-gray-300 dark:border-gray-700">{row.line}</td>
                    <td className="px-2 py-1 border border-gray-300 dark:border-gray-700">{row.username}</td>
                    <td className={`px-2 py-1 border border-gray-300 dark:border-gray-700 font-semibold ${
                      row.status === 'success'
                        ? 'text-green-700 dark:text-green-400'
                        : 'text-red-700 dark:text-red-400'
                    }`}>
                      {row.status}
                    </td>
                    <td className="px-2 py-1 border border-gray-300 dark:border-gray-700">{row.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Users Table */}
      <h2 className="mt-10 mb-4 text-xl font-semibold text-gray-800 dark:text-gray-100">Users Table</h2>
      <div className="overflow-x-auto border rounded border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-yellow-100 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-300">User ID</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Username</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Email</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Department</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Role</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Country</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Last Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {users.length > 0 ? (
              users.map((user, index) => (
                <tr key={user.user_id}>
                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{user.user_id}</td>
                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{user.username}</td>
                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{user.email}</td>
                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{user.department}</td>
                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{user.role}</td>
                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{user.country}</td>
                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{user.updated_at ? new Date(user.updated_at).toLocaleString() : ''}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-4 text-center text-gray-500 dark:text-gray-400">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}