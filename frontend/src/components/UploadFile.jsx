import { useState, useRef, useEffect } from 'react';
import { UploadCloud, Globe, MapPin, Lock, Building, Users } from 'lucide-react';
import axios from 'axios';

const ALL_COUNTRIES = ['Singapore', 'United Kingdom', 'United States', 'Thailand', 
  'Indonesia', 'Korea', 'China', 'Japan', 'Vietnam', 'Myanmar'];
const ALL_DEPARTMENTS = ['Human Resource', 'Admin & Operations', 'Project Management',
  'Procurement', 'IT', 'Marketing', 'Business Development', 'Finance', 'Service Delivery'];
const remoteip = import.meta.env.VITE_REMOTE_IP

export default function UploadFile() {
  const [file, setFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [status, setStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [user, setUser] = useState(null);
  const [accessLevel, setAccessLevel] = useState('ALL');
  const VITE_BASE_URL = import.meta.env.VITE_API_URL;

  // Form state
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('ALL');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');

  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const fileInputRef = useRef(null);

  // Mock effect for demo
  useEffect(() => {
    if (user && user.role === 'MANAGER') {
      setSelectedCountry(user.country);
    }
  }, [user]);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://${remoteip}:8000/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data.session);
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Handle error - maybe redirect to login
      }
    };

    fetchUserData();
  }, []);

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
    if (user?.role === 'MANAGER') return;
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
        if (selectedDepartments.length === ALL_DEPARTMENTS.length) {
          setSelectedDepartments([]);
        } else {
          setSelectedDepartments([...ALL_DEPARTMENTS]);
        }
      } else {
        setSelectedDepartments([dept]);
      }
    } else {
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

    setIsUploading(true);
    setStatus('');

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);
      
      // Prepare countries and departments arrays
      const countries = selectedCountry === 'ALL' ? ALL_COUNTRIES : [selectedCountry];
      const departments = selectedDepartment === 'ALL' ? ALL_DEPARTMENTS : [selectedDepartment];
      
      formData.append('countries', JSON.stringify(countries));
      formData.append('departments', JSON.stringify(departments));

      const response = await axios.post(`http://${remoteip}:8000/upload-file`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setStatus('File uploaded successfully!');
      setFile(null);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      setStatus(`Upload failed: ${error.response?.data?.detail || error.message}`);
    } finally {
      setIsUploading(false);
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
    setStatus('');

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      // Append all files
      files.forEach(file => {
        formData.append('files', file);
      });
      
      // Prepare countries and departments arrays
      const countries = selectedCountry === 'ALL' ? ALL_COUNTRIES : [selectedCountry];
      const departments = selectedDepartment === 'ALL' ? ALL_DEPARTMENTS : [selectedDepartment];
      
      formData.append('countries', JSON.stringify(countries));
      formData.append('departments', JSON.stringify(departments));

      const response = await axios.post(`http://${remoteip}:8000/batch-upload-files`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setStatus(`Successfully uploaded ${files.length} files`);
      setFiles([]);
      // Reset file input
      const fileInput = document.querySelector('input[type="file"][multiple]');
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error) {
      console.error('Batch upload error:', error);
      setStatus(`Batch upload failed: ${error.response?.data?.detail || error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // UI rendering rules
  if (!user) return <div className="text-center py-10 text-gray-500">Loading...</div>;
  if (user.role === 'USER') {
    return (
      <div className="text-center py-10 px-4">
        <h2 className="text-xl font-semibold mb-2">Document Viewer</h2>
        <p className="text-gray-500">You do not have permission to upload files.</p>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-0">
      <div className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-4 sm:p-6 lg:p-8 mb-10">
        
        {/* Upload Mode Toggle */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="uploadMode"
                checked={!isBatchMode}
                onChange={() => setIsBatchMode(false)}
                className="w-4 h-4"
              />
              <span className="text-sm sm:text-base">Single File Upload</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="uploadMode"
                checked={isBatchMode}
                onChange={() => setIsBatchMode(true)}
                className="w-4 h-4"
              />
              <span className="text-sm sm:text-base">Batch Upload</span>
            </label>
          </div>
        </div>

        {/* Upload Box */}
        {!isBatchMode ? (
          <div
            className="border-2 border-dashed border-gray-400 dark:border-gray-600 rounded-lg p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center text-center transition-all duration-200 hover:border-yellow-500 hover:bg-yellow-50/10 dark:hover:bg-gray-800 cursor-pointer min-h-[120px] sm:min-h-[160px]"
            onClick={() => fileInputRef.current.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <UploadCloud className="w-8 h-8 sm:w-10 sm:h-10 text-gray-500 dark:text-gray-400 mb-2" />
            <p className="text-gray-700 dark:text-gray-300 mb-2 text-sm sm:text-base">
              {file ? (
                <span className="font-medium text-yellow-600 dark:text-yellow-400 break-all">
                  {file.name}
                </span>
              ) : (
                <>
                  <span className="hidden sm:inline">Drag and drop your file here</span>
                  <span className="sm:hidden">Tap to select file</span>
                  <br />
                  <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    {window.innerWidth < 640 ? 'or browse files' : 'or click to browse'}
                  </span>
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
          <div className="border-2 border-dashed border-gray-400 dark:border-gray-600 rounded-lg p-4 sm:p-6 lg:p-8 min-h-[120px] sm:min-h-[160px]">
            <div className="flex flex-col items-center">
              <UploadCloud className="w-8 h-8 sm:w-10 sm:h-10 text-gray-500 dark:text-gray-400 mb-2" />
              <div className="text-center mb-4 w-full">
                <p className="text-gray-700 dark:text-gray-300 mb-2 text-sm sm:text-base">
                  Select multiple files for batch upload
                </p>
                <input
                  type="file"
                  multiple
                  onChange={handleMultipleFileChange}
                  className="block w-full text-xs sm:text-sm text-gray-500 file:mr-2 sm:file:mr-4 file:py-1 sm:file:py-2 file:px-2 sm:file:px-4 file:rounded-full file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100"
                />
              </div>
              {files.length > 0 && (
                <div className="mt-4 w-full">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Selected files ({files.length}):
                  </p>
                  <div className="max-h-24 sm:max-h-32 overflow-y-auto">
                    {files.map((file, index) => (
                      <div key={index} className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 py-1 break-all">
                        • {file.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Country Select - Mobile Optimized */}
        <div className="mt-6">
          <label className="block font-medium mb-2 text-gray-900 dark:text-gray-100 text-sm sm:text-base">
            Country:
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            {user.role === 'ADMIN' ? (
              <>
                <button
                  type="button"
                  className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-full border transition text-sm sm:text-base min-h-[40px] ${
                    selectedCountry === 'ALL'
                      ? 'bg-yellow-500 text-white border-yellow-500'
                      : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200'
                  }`}
                  onClick={() => {
                    setSelectedCountry('ALL');
                    setShowCountryDropdown(false);
                  }}
                >
                  <Globe className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">All Countries</span>
                </button>
                <button
                  type="button"
                  className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-full border transition text-sm sm:text-base min-h-[40px] ${
                    selectedCountry !== 'ALL'
                      ? 'bg-yellow-500 text-white border-yellow-500'
                      : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200'
                  }`}
                  onClick={() => setShowCountryDropdown((v) => !v)}
                >
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">
                    {selectedCountry !== 'ALL' && selectedCountry ? selectedCountry : 'Select Country'}
                  </span>
                  <span className="ml-1 flex-shrink-0">{showCountryDropdown ? '▲' : '▼'}</span>
                </button>
              </>
            ) : (
              <span
                className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-full border bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed select-none text-sm sm:text-base min-h-[40px]"
                title="Country is locked to your profile"
              >
                <Lock className="w-4 h-4 flex-shrink-0" />
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{user.country}</span>
              </span>
            )}
          </div>
          {/* Country Dropdown */}
          {showCountryDropdown && user.role === 'ADMIN' && (
            <div className="mt-2 animate-fade-in">
              <select
                className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white text-sm sm:text-base min-h-[40px]"
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

        {/* Department Select - Mobile Optimized */}
        <div className="mt-6">
          <label className="block font-medium mb-2 text-gray-900 dark:text-gray-100 text-sm sm:text-base">
            Department:
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-full border transition text-sm sm:text-base min-h-[40px] ${
                selectedDepartment === 'ALL'
                  ? 'bg-yellow-500 text-white border-yellow-500'
                  : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200'
              }`}
              onClick={() => {
                setSelectedDepartment('ALL');
                setShowDepartmentDropdown(false);
              }}
            >
              <Building className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">All Departments</span>
            </button>
            {user.role === 'ADMIN' ? (
              <button
                type="button"
                className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-full border transition text-sm sm:text-base min-h-[40px] ${
                  selectedDepartment !== 'ALL'
                    ? 'bg-yellow-500 text-white border-yellow-500'
                    : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200'
                }`}
                onClick={() => setShowDepartmentDropdown((v) => !v)}
              >
                <Users className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">
                  {selectedDepartment !== 'ALL' && selectedDepartment ? selectedDepartment : 'Select Department'}
                </span>
                <span className="ml-1 flex-shrink-0">{showDepartmentDropdown ? '▲' : '▼'}</span>
              </button>
            ) : (
              <button
                type="button"
                className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-full border transition text-sm sm:text-base min-h-[40px] ${
                  selectedDepartment === user.department
                    ? 'bg-yellow-500 text-white border-yellow-500'
                    : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200'
                }`}
                onClick={() => setSelectedDepartment(user.department)}
              >
                <Users className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{user.department}</span>
              </button>
            )}
          </div>
          {/* Department Dropdown */}
          {showDepartmentDropdown && user.role === 'ADMIN' && (
            <div className="mt-2 animate-fade-in">
              <select
                className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white text-sm sm:text-base min-h-[40px]"
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
          className={`mt-6 w-full py-3 rounded-lg text-white transition font-medium text-sm sm:text-base min-h-[48px] ${
            isUploading ||
            (!isBatchMode && !file) ||
            (isBatchMode && files.length === 0)
              ? 'bg-gray-400 dark:bg-gray-700 cursor-not-allowed'
              : 'bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700'
          }`}
        >
          {isUploading 
            ? (isBatchMode ? `Uploading ${files.length} files...` : 'Uploading...') 
            : (isBatchMode ? `Upload ${files.length} Files` : 'Upload File')
          }
        </button>

        {/* Status Message */}
        {status && (
          <div className={`mt-4 text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-3 rounded-lg ${
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
