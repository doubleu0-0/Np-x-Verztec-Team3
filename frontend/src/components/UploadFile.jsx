import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { UploadCloud } from 'lucide-react';

const ALL_COUNTRIES = ['Singapore', 'United Kingdom', 'United States', 'Thailand', 
  'Indonesia', 'Korea', 'China', 'Japan', 'Vietnam', 'Myanmar'];
const ALL_DEPARTMENTS = ['Human Resource', 'Admin & Operations', 'Project Management',
  'Procurement', 'IT', 'Marketing', 'Business Development', 'Finance', 'Service Delivery'];

const VISIBILITY_OPTIONS = [
  { value: 'department', label: 'Department only' },
  { value: 'country', label: 'Country-wide' },
  { value: 'global', label: 'Global' },
];

export default function UploadFile() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [user, setUser] = useState(null);

  // Form state
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [visibility, setVisibility] = useState('department');

  const fileInputRef = useRef(null);

  // Fetch user info on mount
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await axios.get('http://localhost:8000/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data.session);
        // Set defaults for MANAGER
        if (res.data.session.role === 'MANAGER') {
          setSelectedCountries([res.data.session.country]);
          setVisibility('department');
        }
      } catch (err) {
        setUser(null);
      }
    };
    fetchUser();
    fetchFileList();
  }, []);

  // Fetch file list
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

  // Handle file selection
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setFile(selected);
    setStatus('');
  };

  // Drag and drop
  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    setFile(droppedFile);
    setStatus('');
  };
  const handleDragOver = (e) => e.preventDefault();

  // Handle country checkbox
  const handleCountryChange = (country) => {
    if (user?.role === 'MANAGER') return; // Locked for MANAGER
    setSelectedCountries((prev) =>
      prev.includes(country)
        ? prev.filter((c) => c !== country)
        : [...prev, country]
    );
  };

  // Handle department checkbox
  const handleDepartmentChange = (dept) => {
    setSelectedDepartments((prev) =>
      prev.includes(dept)
        ? prev.filter((d) => d !== dept)
        : [...prev, dept]
    );
  };

  // Handle visibility change
  const handleVisibilityChange = (val) => {
    setVisibility(val);

    // Auto-adjust checkboxes
    if (val === 'country') {
      // Select all departments in selected countries
      setSelectedDepartments([...ALL_DEPARTMENTS]);
    } else if (val === 'department') {
      // Do not auto-select departments
    } else if (val === 'global') {
      setSelectedCountries([...ALL_COUNTRIES]);
      setSelectedDepartments([...ALL_DEPARTMENTS]);
    }
  };

  // Upload handler
  const handleUpload = async () => {
    if (!file) {
      setStatus('No file selected');
      return;
    }
    if (selectedCountries.length === 0 || selectedDepartments.length === 0) {
      setStatus('Please select at least one country and one department');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('countries', JSON.stringify(selectedCountries));
    formData.append('departments', JSON.stringify(selectedDepartments));
    formData.append('visibility', visibility);

    setIsUploading(true);
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post('http://localhost:8000/upload-file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      setStatus(response.data.message);
      await fetchFileList();
    } catch (err) {
      setStatus('Upload failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setIsUploading(false);
    }
  };

  // Delete handler
  const handleDelete = async (filename) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete "${filename}"?`);
    if (!confirmDelete) return;
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

  // --- UI rendering rules ---
  if (!user) return <div className="text-center py-10 text-gray-500">Loading...</div>;
  if (user.role === 'USER') {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-semibold mb-2">Document Viewer</h2>
        {/* Place document viewer/search here */}
        <p className="text-gray-500">You do not have permission to upload files.</p>
      </div>
    );
  }

  // Visibility options by role
  const visibilityOptions =
    user.role === 'ADMIN'
      ? VISIBILITY_OPTIONS
      : VISIBILITY_OPTIONS.filter((v) => v.value !== 'global');

  // Countries by role
  const countries =
    user.role === 'ADMIN'
      ? ALL_COUNTRIES
      : [user.country];

  // Departments by role (could be filtered further if needed)
  const departments = ALL_DEPARTMENTS;

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      {/* Rounded rectangle for upload form and controls */}
      <div className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-8 mb-10">
        {/* Upload Box */}
        <div
          className="border-2 border-dashed border-gray-400 dark:border-gray-600 rounded-lg p-8 flex flex-col items-center justify-center text-center transition-all duration-200 hover:border-yellow-500 hover:bg-yellow-50/10 dark:hover:bg-gray-800 cursor-pointer"
          onClick={() => fileInputRef.current.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <UploadCloud className="w-10 h-10 text-gray-500 dark:text-gray-400 mb-2" />
          <p className="text-gray-700 dark:text-gray-300 mb-2">
            {file ? (
              <span className="font-medium text-yellow-600 dark:text-yellow-400">{file.name}</span>
            ) : (
              <>
                Drag and drop your file here<br />
                <span className="text-sm text-gray-500 dark:text-gray-400">or click to browse</span>
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

        {/* Visibility Scope */}
        <div className="mt-6">
          <label className="block font-medium mb-1 text-gray-900 dark:text-gray-100">Visibility Scope:</label>
          <div className="flex gap-4">
            {visibilityOptions.map((opt) => (
              <label key={opt.value} className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                <input
                  type="radio"
                  name="visibility"
                  value={opt.value}
                  checked={visibility === opt.value}
                  onChange={() => handleVisibilityChange(opt.value)}
                  disabled={user.role === 'MANAGER' && opt.value === 'global'}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        {/* Country Checkboxes */}
        <div className="mt-6">
          <label className="block font-medium mb-1 text-gray-900 dark:text-gray-100">Countries:</label>
          <div className="flex gap-4 flex-wrap">
            {countries.map((country) => (
              <label key={country} className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={selectedCountries.includes(country)}
                  onChange={() => handleCountryChange(country)}
                  disabled={user.role === 'MANAGER'}
                />
                {country}
              </label>
            ))}
          </div>
        </div>

        {/* Department Checkboxes */}
        <div className="mt-6">
          <label className="block font-medium mb-1 text-gray-900 dark:text-gray-100">Departments:</label>
          <div className="flex gap-4 flex-wrap">
            {departments.map((dept) => (
              <label key={dept} className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={selectedDepartments.includes(dept)}
                  onChange={() => handleDepartmentChange(dept)}
                />
                {dept}
              </label>
            ))}
          </div>
        </div>

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={
            isUploading ||
            !file ||
            selectedCountries.length === 0 ||
            selectedDepartments.length === 0
          }
          className={`mt-4 w-full py-2 rounded text-white transition ${
            isUploading ||
            !file ||
            selectedCountries.length === 0 ||
            selectedDepartments.length === 0
              ? 'bg-gray-400 dark:bg-gray-700 cursor-not-allowed'
              : 'bg-yellow-500 hover:bg-yellow-600'
          }`}
        >
          {isUploading ? 'Uploading...' : 'Upload File'}
        </button>

        {/* Status Message */}
        {status && (
          <div className={`mt-2 text-sm px-4 py-2 rounded ${
            status.startsWith('Upload failed') || status.startsWith('Delete failed') || status.includes('No file')
              ? 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/40'
              : 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/40'
          }`}>
            {status}
          </div>
        )}
      </div>

      {/* File List */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Files in raw_data</h2>
        {fileList.length > 0 ? (
          <ul className="space-y-2">
            {fileList.map((filename, idx) => (
              <li
                key={idx}
                className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 px-4 py-2 rounded shadow-sm border border-gray-200 dark:border-gray-700"
              >
                <span className="text-gray-800 dark:text-gray-100">{filename}</span>
                <button
                  onClick={() => handleDelete(filename)}
                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No files found. Upload a file to get started.</p>
        )}
      </div>
    </div>
  );
}