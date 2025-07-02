import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { UploadCloud, Globe, MapPin, Lock, Building, Users } from 'lucide-react'; // Add Building and Users

const ALL_COUNTRIES = ['Singapore', 'United Kingdom', 'United States', 'Thailand', 
  'Indonesia', 'Korea', 'China', 'Japan', 'Vietnam', 'Myanmar'];
const ALL_DEPARTMENTS = ['Human Resource', 'Admin & Operations', 'Project Management',
  'Procurement', 'IT', 'Marketing', 'Business Development', 'Finance', 'Service Delivery'];

export default function UploadFile() {
  const [file, setFile] = useState(null);
  const [files, setFiles] = useState([]); // For batch upload
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [status, setStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [user, setUser] = useState(null);
  const [accessLevel, setAccessLevel] = useState('ALL');

  // Form state
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('ALL');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');

  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
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
          setSelectedCountry(res.data.session.country); // <-- Set country!
          setSelectedDepartment('ALL'); // or res.data.session.department if you want to default to their dept
        }
      } catch (err) {
        setUser(null);
      }
    };
    fetchUser();
    fetchFileList();
  }, []);

  useEffect(() => {
    if (user && user.role === 'MANAGER') {
      setSelectedCountry(user.country);
    }
  }, [user]);

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
    if (user.role !== 'ADMIN') {
      if (dept === 'ALL') {
        // Toggle: if all departments are already selected, deselect all; else select all
        if (selectedDepartments.length === ALL_DEPARTMENTS.length) {
          setSelectedDepartments([]);
        } else {
          setSelectedDepartments([...ALL_DEPARTMENTS]);
        }
      } else {
        setSelectedDepartments([dept]);
      }
    } else {
      // Usual multi-select for admins
      setSelectedDepartments((prev) =>
        prev.includes(dept)
          ? prev.filter((d) => d !== dept)
          : [...prev, dept]
      );
    }
  };

  // Upload handler
  const handleUpload = async () => {
    if (!file) {
      setStatus('No file selected');
      return;
    }
    if (!selectedCountry || !selectedDepartment) {
      setStatus('Please select a country and a department');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    
    const countries = selectedCountry === 'ALL' ? ALL_COUNTRIES : [selectedCountry];
    const departments = selectedDepartment === 'ALL' ? ALL_DEPARTMENTS : [selectedDepartment];

    formData.append('countries', JSON.stringify(countries));
    formData.append('departments', JSON.stringify(departments));
    formData.append('access_level', accessLevel); // NEW

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

  // Handle multiple file selection
  const handleMultipleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
    setStatus('');
  };

  // Batch upload handler
  const handleBatchUpload = async () => {
    if (files.length === 0) {
      setStatus('No files selected');
      return;
    }
    if (!selectedCountry || !selectedDepartment) {
      setStatus('Please select a country and a department');
      return;
    }

    setIsUploading(true);
    const token = localStorage.getItem('token');
    
    try {
      const formData = new FormData();
      
      // Append all files
      files.forEach((file, index) => {
        formData.append(`files`, file);
      });
      
      const { countries, departments } = inferUploadScope();
      formData.append('countries', JSON.stringify(countries));
      formData.append('departments', JSON.stringify(departments));

      const response = await axios.post('http://localhost:8000/batch-upload-files', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      
      setStatus(`Successfully uploaded ${files.length} files`);
      setFiles([]);
      await fetchFileList();
    } catch (err) {
      setStatus('Batch upload failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setIsUploading(false);
    }
  };

  function inferUploadScope() {
    if (user.role === "MANAGER") {
      return {
        countries: [user.country],
        departments: [user.department]
      };
    }
    if (user.role === "ADMIN") {
      return {
        countries: selectedCountries.length > 0 ? selectedCountries : ALL_COUNTRIES,
        departments: ALL_DEPARTMENTS
      };
    }
    return { countries: [], departments: [] };
  }

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

  // Countries by role
  const countries =
    user.role === 'ADMIN'
      ? ALL_COUNTRIES
      : [user.country];

  // Departments by role
  const departments =
    user && user.role === 'ADMIN'
      ? ALL_DEPARTMENTS
      : ['ALL', user.department];

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <div className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-8 mb-10">
        
        {/* Upload Mode Toggle */}
        <div className="mb-6">
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="uploadMode"
                checked={!isBatchMode}
                onChange={() => setIsBatchMode(false)}
              />
              Single File Upload
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="uploadMode"
                checked={isBatchMode}
                onChange={() => setIsBatchMode(true)}
              />
              Batch Upload
            </label>
          </div>
        </div>

        {/* Upload Box */}
        {!isBatchMode ? (
          // Single file upload (existing code)
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
        ) : (
          // Batch file upload
          <div className="border-2 border-dashed border-gray-400 dark:border-gray-600 rounded-lg p-8">
            <UploadCloud className="w-10 h-10 text-gray-500 dark:text-gray-400 mb-2 mx-auto" />
            <div className="text-center mb-4">
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                Select multiple files for batch upload
              </p>
              <input
                type="file"
                multiple
                onChange={handleMultipleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100"
              />
            </div>
            {files.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Selected files ({files.length}):
                </p>
                <div className="max-h-32 overflow-y-auto">
                  {files.map((file, index) => (
                    <div key={index} className="text-sm text-gray-700 dark:text-gray-300 py-1">
                      • {file.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Country Select (Pill style) */}
        <div className="mt-6">
          <label className="block font-medium mb-1 text-gray-900 dark:text-gray-100">Country:</label>
          <div className="flex gap-2">
            {user.role === 'ADMIN' ? (
              <>
                <button
                  type="button"
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border transition ${
                    selectedCountry === 'ALL'
                      ? 'bg-yellow-500 text-white border-yellow-500'
                      : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200'
                  }`}
                  onClick={() => {
                    setSelectedCountry('ALL');
                    setShowCountryDropdown(false);
                  }}
                >
                  <Globe className="w-4 h-4" /> All Countries
                </button>
                <button
                  type="button"
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border transition ${
                    selectedCountry !== 'ALL'
                      ? 'bg-yellow-500 text-white border-yellow-500'
                      : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200'
                  }`}
                  onClick={() => setShowCountryDropdown((v) => !v)}
                >
                  <MapPin className="w-4 h-4" /> {selectedCountry !== 'ALL' && selectedCountry ? selectedCountry : 'Select a Country'}
                  <span className="ml-1">{showCountryDropdown ? '▲' : '▼'}</span>
                </button>
              </>
            ) : (
              <span
                className="flex items-center gap-2 px-4 py-2 rounded-full border bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed select-none"
                title="Country is locked to your profile"
              >
                <Lock className="w-4 h-4" />
                <MapPin className="w-4 h-4" />
                {user.country}
              </span>
            )}
          </div>
          {/* Collapsible dropdown for admin */}
          {showCountryDropdown && user.role === 'ADMIN' && (
            <div className="mt-2 animate-fade-in">
              <select
                className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
                value={selectedCountry}
                onChange={e => {
                  setSelectedCountry(e.target.value);
                  setShowCountryDropdown(false);
                }}
              >
                <option value="ALL" disabled>Select a country</option>
                {ALL_COUNTRIES.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Department Select (Pill style) */}
        <div className="mt-6">
          <label className="block font-medium mb-1 text-gray-900 dark:text-gray-100">Department:</label>
          <div className="flex gap-2">
            <button
              type="button"
              className={`flex items-center gap-2 px-4 py-2 rounded-full border transition ${
                selectedDepartment === 'ALL'
                  ? 'bg-yellow-500 text-white border-yellow-500'
                  : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200'
              }`}
              onClick={() => {
                setSelectedDepartment('ALL');
                setShowDepartmentDropdown(false);
              }}
            >
              <Building className="w-4 h-4" /> All Departments
            </button>
            <button
              type="button"
              className={`flex items-center gap-2 px-4 py-2 rounded-full border transition ${
                selectedDepartment !== 'ALL'
                  ? 'bg-yellow-500 text-white border-yellow-500'
                  : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200'
              }`}
              onClick={() => setShowDepartmentDropdown((v) => !v)}
            >
              <Users className="w-4 h-4" /> {selectedDepartment !== 'ALL' && selectedDepartment ? selectedDepartment : 'Select a Department'}
              <span className="ml-1">{showDepartmentDropdown ? '▲' : '▼'}</span>
            </button>
          </div>
          {/* Collapsible dropdown for both admin and manager */}
          {showDepartmentDropdown && (
            <div className="mt-2 animate-fade-in">
              <select
                className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
                value={selectedDepartment === 'ALL' ? '' : selectedDepartment}
                onChange={e => {
                  setSelectedDepartment(e.target.value);
                  setShowDepartmentDropdown(false);
                }}
              >
                <option value="" disabled>Select a department</option>
                {ALL_DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Upload Button */}
        <button
          onClick={isBatchMode ? handleBatchUpload : handleUpload}
          disabled={
            isUploading ||
            (!isBatchMode && !file) ||
            (isBatchMode && files.length === 0)
          }
          className={`mt-4 w-full py-2 rounded text-white transition ${
            isUploading ||
            (!isBatchMode && !file) ||
            (isBatchMode && files.length === 0)
              ? 'bg-gray-400 dark:bg-gray-700 cursor-not-allowed'
              : 'bg-yellow-500 hover:bg-yellow-600'
          }`}
        >
          {isUploading 
            ? (isBatchMode ? `Uploading ${files.length} files...` : 'Uploading...') 
            : (isBatchMode ? `Upload ${files.length} Files` : 'Upload File')
          }
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
    </div>
  );
}