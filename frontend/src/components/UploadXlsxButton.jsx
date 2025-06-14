import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { UploadCloud } from 'lucide-react';

export default function UploadXlsxButton() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [users, setUsers] = useState([]);
  const fileInputRef = useRef(null);

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://localhost:8000/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setStatus('Failed to load users');
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.name.endsWith('.xlsx')) {
      setFile(selected);
      setStatus('');
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

    const formData = new FormData();
    formData.append('file', file);
    setIsUploading(true);
    setStatus('');

    try {
      const response = await axios.post('http://localhost:8000/upload-xlsx', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setStatus(response.data.message);
      await fetchUsers(); // Refresh after upload
    } catch (err) {
      setStatus('Upload failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = (index, field, value) => {
    const updated = [...users];
    updated[index][field] = value;
    setUsers(updated);
  };

  const handleSave = async (user) => {
    try {
      await axios.put(`http://localhost:8000/users/${user.user_id}`, {
        username: user.username,
        email: user.email,
        department: user.department,
        role: user.role,
        country: user.country,
      });
      setStatus(`User ${user.user_id} updated successfully`);
    } catch (err) {
      setStatus(`Update failed: ${err.response?.data?.detail || err.message}`);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      {/* Upload Section */}
      <div
        className="border-2 border-dashed border-gray-400 rounded-lg p-8 flex flex-col items-center justify-center text-center transition-all duration-200 hover:border-yellow-500 hover:bg-yellow-50/20 cursor-pointer"
        onClick={() => fileInputRef.current.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <UploadCloud className="w-10 h-10 text-gray-500 mb-2" />
        <p className="text-gray-700">
          {file ? (
            <span className="font-medium text-yellow-600">{file.name}</span>
          ) : (
            <>
              Drag and drop your <code>.xlsx</code> file here<br />
              <span className="text-sm text-gray-500">or click to browse</span>
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
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-yellow-500 hover:bg-yellow-600'
        }`}
      >
        {isUploading ? 'Uploading...' : 'Upload File'}
      </button>

      {status && (
        <div className={`mt-2 text-sm px-4 py-2 rounded ${
          status.startsWith('Upload failed') || status.includes('valid')
            ? 'text-red-700 bg-red-100'
            : 'text-green-700 bg-green-100'
        }`}>
          {status}
        </div>
      )}

      <h2 className="mt-10 mb-4 text-xl font-semibold text-gray-800">Users Table</h2>
      <div className="overflow-x-auto border rounded">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-yellow-100">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">User ID</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Username</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Email</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Department</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Role</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Country</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Last Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.length > 0 ? (
              users.map((user, index) => (
                <tr key={user.user_id}>
                  <td className="px-4 py-2 text-sm">{user.user_id}</td>
                  {['username', 'email', 'department', 'role', 'country'].map((field) => (
                    <td key={field} className="px-4 py-2 text-sm">
                      <input
                        className="w-full border border-gray-300 rounded px-1 py-0.5"
                        value={user[field]}
                        onChange={(e) => handleEdit(index, field, e.target.value)}
                        onBlur={() => handleSave(user)}
                      />
                    </td>
                  ))}
                  <td className="px-4 py-2 text-sm">{new Date(user.updated_at).toLocaleString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-4 text-center text-gray-500">
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
