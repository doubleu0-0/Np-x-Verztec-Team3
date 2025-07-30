import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { UploadCloud, Download, ChevronDown, ChevronUp, FileSpreadsheet } from 'lucide-react';
const remoteip = import.meta.env.VITE_REMOTE_IP

export default function UploadXlsxButton() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [users, setUsers] = useState([]);
  const [user, setUser] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [authError, setAuthError] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  const fileInputRef = useRef(null);

  // Fetch current user and users list
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      console.log('Token exists:', !!token);
      
      if (!token) {
        setAuthError(true);
        return;
      }
      
      try {
        const res = await axios.get(`http://${remoteip}:8000/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data.session);
        setAuthError(false);
        console.log('User profile loaded:', res.data.session);
      } catch (err) {
        console.error('Profile fetch error:', err.response?.status, err.response?.data);
        if (err.response?.status === 401) {
          setAuthError(true);
          // Clear invalid token
          localStorage.removeItem('token');
        }
        setUser(null);
      }
    };
    
    fetchUser().then(() => {
      // Only fetch users if we have a valid user
      if (!authError) {
        fetchUsers();
      }
    });
  }, []);

  const fetchUsers = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setAuthError(true);
      return;
    }
    
    try {
      console.log('Fetching users...');
      const res = await axios.get(`http://${remoteip}:8000/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers(res.data);
      console.log('Users loaded:', res.data.length);
    } catch (err) {
      console.error('Users fetch error:', err.response?.status, err.response?.data);
      if (err.response?.status === 401) {
        setAuthError(true);
        localStorage.removeItem('token');
      }
      setStatus('Failed to load users - Authentication error');
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
    
    if (!token) {
      setStatus('Authentication error - please log in again');
      setIsUploading(false);
      setAuthError(true);
      return;
    }
    
    try {
      const response = await axios.post(`http://${remoteip}:8000/upload-xlsx`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      setStatus(response.data.message || 'Upload complete');
      setUploadResult(response.data.result || null);
      await fetchUsers();
    } catch (err) {
      if (err.response?.status === 401) {
        setStatus('Authentication expired - please log in again');
        setAuthError(true);
        localStorage.removeItem('token');
      } else {
        setStatus('Upload failed: ' + (err.response?.data?.detail || err.message));
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Show auth error message
  if (authError) {
    return (
      <div className="text-center py-10">
        <div className="text-red-500 mb-4">Authentication Error</div>
        <div className="text-gray-500">Your session has expired. Please log in again.</div>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-yellow-500 text-black rounded hover:bg-yellow-600"
        >
          Refresh Page
        </button>
      </div>
    );
  }

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

  const filteredUploadResult = uploadResult
    ? uploadResult.filter(
        (row) =>
          !(
            row.status === 'error' &&
            row.message === 'Missing required fields'
          )
      )
    : null;

  return (
    <div className="w-full">
      <div className="relative bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 mb-10 w-full">
        {/* Excel Template Section */}
        <div className="mb-6">
          <div className="flex flex-col items-center text-center">
            <FileSpreadsheet className="w-7 h-7 mb-1 text-yellow-500" aria-label="Excel Template" />
            <span className="font-medium text-gray-900 dark:text-white text-base">Download the User Upload Form</span>
            <div className="text-sm text-gray-600 dark:text-gray-300 mt-1 mb-4">
              Use this Excel form to upload users in bulk.
            </div>
            <a
              href={`http://${remoteip}:8000/static/Adding_Users.xlsx`}
              download
              className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download Form
            </a>
          </div>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors mt-4 mx-auto"
          >
            {showPreview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showPreview ? 'Hide' : 'Show'} Expected Format
          </button>
          {showPreview && (
            <div className="mt-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-white">User Name</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-white">Password</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-white">Email</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-white">Department</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-white">Role</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-white">Country</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">john.doe</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">securePass123</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">john.doe@verztec.com</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">IT</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">USER</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">Singapore</td>
                    </tr>
                    {/* Divider row */}
                    <tr>
                      <td colSpan={6} className="p-0">
                        <div className="border-t border-dashed border-gray-300 dark:border-gray-600 my-1"></div>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">jane.smith</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">myPassword456</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">jane.smith@verztec.com</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">HR</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">MANAGER</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">Malaysia</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                <p><strong>Note:</strong> All columns are required.</p>
              </div>
            </div>
          )}
        </div>

        {/* Upload Section */}
        <div
          className="mb-6 border-2 border-dashed border-gray-400 dark:border-gray-600 rounded-lg p-8 flex flex-col items-center justify-center text-center transition-all duration-200 hover:border-yellow-500 hover:bg-yellow-50/10 dark:hover:bg-gray-800 cursor-pointer"
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
            status.startsWith('Upload failed') || status.includes('valid') || status.includes('Authentication')
              ? 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/40'
              : 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/40'
          }`}>
            {status}
          </div>
        )}

        {/* Upload Result Table */}
        {filteredUploadResult && filteredUploadResult.length > 0 && (
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
                  {filteredUploadResult.map((row, idx) => (
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

        {/* Manager Restrictions Notice */}
        {user.role === 'MANAGER' && (
          <div className="mt-6 rounded-lg border border-yellow-200 dark:border-yellow-700 bg-yellow-100/60 dark:bg-yellow-900/40 shadow-sm px-5 py-3 flex items-start gap-3">
            <span className="mt-0.5 text-yellow-500 dark:text-yellow-300 text-lg" aria-label="warning" role="img">⚠️</span>
            <div>
              <span className="font-medium text-yellow-900 dark:text-yellow-200">Manager Restriction</span>
              <div className="text-sm text-yellow-800 dark:text-yellow-200 mt-0.5">
                You can only upload users from your assigned department
                <span className="font-semibold px-1 rounded bg-yellow-200/60 dark:bg-yellow-800/40 text-yellow-900 dark:text-yellow-100 mx-1">
                  ({user.department})
                </span>
                and country
                <span className="font-semibold px-1 rounded bg-yellow-200/60 dark:bg-yellow-800/40 text-yellow-900 dark:text-yellow-100 mx-1">
                  ({user.country})
                </span>.
                <br />
                Other users will be skipped automatically.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}