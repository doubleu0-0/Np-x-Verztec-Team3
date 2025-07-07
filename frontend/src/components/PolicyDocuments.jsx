import { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronUp, ChevronDown, MoreVertical, X, Filter, Loader } from 'lucide-react';

const ALL_DEPARTMENTS = [
  "Marketing","Procurement","IT","Project Management","Human Resource","Admin & Operations","Business Development","Finance","Service Delivery"
];
const ALL_COUNTRIES = [
  "Singapore","Japan","Vietnam","United Kingdom","Myanmar","United States","Indonesia","Thailand","Korea","China"
];

function isAll(list, allList) {
  if (!list) return false;
  if (typeof list === "string") list = list.split(",");
  return list.length === allList.length;
}

const EditFileModal = ({ file, onClose, onSave, currentUser, saving }) => {
  const [form, setForm] = useState({
    file_name: file.file_name || "",
    departments: file.departments || "",
    countries: file.countries || "",
    uploaded_by: file.uploaded_by || "",
  });

  const isManager = currentUser?.role === "MANAGER";
  const managerDept = currentUser?.department;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...file, ...form });
  };

  // Department options: managers get only their department or ALL, admins get all
  const departmentOptions = isManager
    ? [managerDept, "ALL"]
    : ["ALL", ...ALL_DEPARTMENTS];

  // Country select: managers cannot change, admins can
  const countrySelectProps = isManager
    ? {
        disabled: true,
        className:
          "w-full px-3 py-2 border rounded bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-80 border-gray-300 dark:border-gray-600",
        "aria-disabled": true,
        title: "Managers cannot change country",
      }
    : {
        className: "w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white",
      };

  const countryOptions = ["ALL", ...ALL_COUNTRIES];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md relative">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Edit File</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">File Name</label>
            <input
              name="file_name"
              value={form.file_name}
              className="w-full px-3 py-2 border rounded bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-80 font-semibold"
              disabled
              readOnly
              tabIndex={-1}
              aria-disabled="true"
              title="File name cannot be changed"
            />
            <span className="text-xs text-gray-400 dark:text-gray-500 italic">File name cannot be changed</span>
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Departments</label>
            <select
              name="departments"
              value={form.departments}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
              required
            >
              <option value="" disabled>Select department</option>
              {departmentOptions.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Countries</label>
            <select
              name="countries"
              value={form.countries}
              onChange={handleChange}
              required
              {...countrySelectProps}
            >
              <option value="" disabled>Select country</option>
              {countryOptions.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
            {isManager && (
              <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                Managers cannot change country.
              </span>
            )}
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Uploader</label>
            <input
              name="uploaded_by"
              value={form.uploaded_by}
              className="w-full px-3 py-2 border rounded bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-80 font-semibold"
              disabled
              readOnly
              tabIndex={-1}
              aria-disabled="true"
              title="Uploader cannot be changed"
            />
            <span className="text-xs text-gray-400 dark:text-gray-500 italic">Uploader cannot be changed</span>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-yellow-500 text-black font-semibold hover:bg-yellow-600 flex items-center justify-center"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader className="animate-spin w-4 h-4 mr-2" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function PolicyDocuments({ currentUser }) {
  const [fileList, setFileList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [docsPerPage, setDocsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [menuOpen, setMenuOpen] = useState(null);
  const [editFile, setEditFile] = useState(null);
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [countryFilter, setCountryFilter] = useState('ALL');
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [saving, setSaving] = useState(false);
  const [deleteFile, setDeleteFile] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchFileList();
  }, []);

  const fetchFileList = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get('http://localhost:8000/files', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFileList(res.data);
    } catch {
      setFileList([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtering
  const filteredFiles = fileList
    .filter(file => !file.file_name?.toLowerCase().endsWith('.txt'))
    .filter(file =>
      file.file_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.uploaded_by?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (file.departments && file.departments.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (file.countries && file.countries.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .filter(file => {
      // Department filter
      if (departmentFilter === 'ALL') return true;
      if (!file.departments) return false;
      const depts = typeof file.departments === 'string' ? file.departments.split(',').map(d => d.trim()) : file.departments;
      return depts.includes(departmentFilter);
    })
    .filter(file => {
      // Country filter
      if (countryFilter === 'ALL') return true;
      if (!file.countries) return false;
      const countries = typeof file.countries === 'string' ? file.countries.split(',').map(c => c.trim()) : file.countries;
      return countries.includes(countryFilter);
    })
    .filter(file => {
      // Department multi-select filter
      if (!selectedDepartments.length) return true;
      if (!file.departments) return false;
      const depts = typeof file.departments === 'string' ? file.departments.split(',').map(d => d.trim()) : file.departments;
      return selectedDepartments.some(dept => depts.includes(dept));
    })
    .filter(file => {
      // Country multi-select filter
      if (!selectedCountries.length) return true;
      if (!file.countries) return false;
      const countries = typeof file.countries === 'string' ? file.countries.split(',').map(c => c.trim()) : file.countries;
      return selectedCountries.some(country => countries.includes(country));
    });

  // Sorting
  const sortedFiles = [...filteredFiles].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aValue = a[sortConfig.key] || '';
    const bValue = b[sortConfig.key] || '';
    return sortConfig.direction === 'asc'
      ? String(aValue).localeCompare(String(bValue))
      : String(bValue).localeCompare(String(aValue));
  });

  const totalPages = Math.ceil(sortedFiles.length / docsPerPage);
  const paginatedFiles = sortedFiles.slice(
    (currentPage - 1) * docsPerPage,
    currentPage * docsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [docsPerPage, searchTerm]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronUp className="w-4 h-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc'
      ? <ChevronUp className="w-4 h-4 text-yellow-600" />
      : <ChevronDown className="w-4 h-4 text-yellow-600" />;
  };

  const handleMenuOpen = (fileId) => {
    setMenuOpen(menuOpen === fileId ? null : fileId);
  };

  const handleEdit = (file) => {
    setMenuOpen(null);
    setEditFile(file);
  };

  const handleDelete = async (file) => {
    setMenuOpen(null);
    if (!window.confirm(`Are you sure you want to delete "${file.file_name}"? This cannot be undone.`)) return;
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`http://localhost:8000/delete-file/${encodeURIComponent(file.file_name)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchFileList(); // Refresh the list after deletion
    } catch (err) {
      alert("Failed to delete file: " + (err?.response?.data?.detail || err.message));
    }
  };

  const closeEditModal = () => setEditFile(null);

  const handleEditSave = async (updatedFile) => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const form = new FormData();

      // Ensure departments is always an array
      let departments = updatedFile.departments;
      if (departments === "ALL") departments = ALL_DEPARTMENTS;
      else if (typeof departments === "string") departments = [departments];

      departments.forEach(dept => form.append("departments", dept));

      // Ensure countries is always an array
      let countries = updatedFile.countries;
      if (countries === "ALL") countries = ALL_COUNTRIES;
      else if (typeof countries === "string") countries = [countries];

      countries.forEach(country => form.append("countries", country));

      await axios.put(
        `http://localhost:8000/update-file/${encodeURIComponent(updatedFile.file_name)}`,
        form,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setEditFile(null);
      fetchFileList(); // Refresh the list after update
    } catch (err) {
      alert("Failed to update file: " + (err?.response?.data?.detail || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pt-1 pb-2">
      <div className="mb-2">
        <div className="flex gap-4 mb-1 items-center">
          <input
            type="text"
            placeholder="Search by file name, department, country, or uploader..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-3 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:bg-gray-700 dark:text-white"
          />
          <div>
            <select
              value={docsPerPage}
              onChange={e => setDocsPerPage(Number(e.target.value))}
              className="pl-3 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-base font-medium h-[44px]"
              style={{ minWidth: 120 }}
            >
              {[5, 10, 20, 50, 100].map(n => (
                <option key={n} value={n}>{n} per page</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center justify-center h-[44px]"
            onClick={() => setShowFilterPopup(true)}
            title="Filter"
            style={{ minWidth: 44 }}
          >
            <Filter className="w-5 h-5 text-gray-500 dark:text-gray-300" />
          </button>
        </div>
      </div>
      {/* Results Summary */}
      <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        Showing {paginatedFiles.length} of {filteredFiles.length} documents
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th
                className="px-6 py-3 w-72 max-w-xs text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none"
                onClick={() => handleSort('file_name')}
              >
                <div className="flex items-center gap-1">
                  File Name
                  {getSortIcon('file_name')}
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none"
                onClick={() => handleSort('departments')}
              >
                <div className="flex items-center gap-1">
                  Departments
                  {getSortIcon('departments')}
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none"
                onClick={() => handleSort('countries')}
              >
                <div className="flex items-center gap-1">
                  Countries
                  {getSortIcon('countries')}
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none"
                onClick={() => handleSort('uploaded_by')}
              >
                <div className="flex items-center gap-1">
                  Uploader
                  {getSortIcon('uploaded_by')}
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none"
                onClick={() => handleSort('upload_time')}
              >
                <div className="flex items-center gap-1">
                  Created
                  {getSortIcon('upload_time')}
                </div>
              </th>
              <th className="w-10 px-1 py-3"></th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <span className="flex items-center justify-center gap-2">
                    <Loader className="animate-spin w-6 h-6 text-yellow-500" />
                    Loading files...
                  </span>
                </td>
              </tr>
            ) : paginatedFiles.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">No files found.</td>
              </tr>
            ) : (
              paginatedFiles.map((file, idx) => {
                const departments = typeof file.departments === "string" ? file.departments.split(",") : file.departments;
                const countries = typeof file.countries === "string" ? file.countries.split(",") : file.countries;
                return (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700 relative">
                    <td className="px-6 py-4 w-72 max-w-xs whitespace-nowrap overflow-hidden text-ellipsis text-gray-900 dark:text-white" title={file.file_name}>
                      {file.file_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-700 dark:text-gray-300">
                      {isAll(departments, ALL_DEPARTMENTS) ? "ALL" : departments.join(", ")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                      {isAll(countries, ALL_COUNTRIES) ? "ALL" : countries.join(", ")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-700 dark:text-gray-300">
                      {file.uploaded_by}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-700 dark:text-gray-300">
                      {file.upload_time ? new Date(file.upload_time).toLocaleDateString() : "N/A"}
                    </td>
                    <td className="w-10 px-1 py-4 relative">
                      <button
                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                        onClick={() => handleMenuOpen(file.file_id)}
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      {menuOpen === file.file_id && (
                        <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-20">
                          <button
                            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-xl"
                            onClick={() => handleEdit(file)}
                          >
                            Edit
                          </button>
                          <button
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-xl"
                            onClick={() => setDeleteFile(file)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {/* Pagination controls inside the border */}
        <div className="flex justify-end items-center gap-1 px-2 py-0 pb-2 text-xs">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 text-xs"
          >
            Prev
          </button>
          <span className="text-xs text-gray-700 dark:text-gray-300">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 text-xs"
          >
            Next
          </button>
        </div>
      </div>

      {/* Edit File Modal */}
      {editFile && (
        <EditFileModal
          file={editFile}
          onClose={closeEditModal}
          onSave={handleEditSave}
          currentUser={currentUser}
          saving={saving}
        />
      )}

      {/* Filter Popup */}
      {showFilterPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-sm relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              onClick={() => setShowFilterPopup(false)}
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Filter Documents</h2>
            <div className="mb-4">
              <label className="block font-medium mb-1 text-gray-900 dark:text-gray-100">Departments</label>
              <div className="flex flex-wrap gap-2 mb-2">
                <button
                  type="button"
                  className={`px-3 py-1 rounded-full border text-sm ${
                    selectedDepartments.length === 0
                      ? 'bg-yellow-500 text-white border-yellow-500'
                      : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200'
                  }`}
                  onClick={() => setSelectedDepartments([])}
                >
                  All
                </button>
                {ALL_DEPARTMENTS.map(dept => (
                  <button
                    key={dept}
                    type="button"
                    className={`px-3 py-1 rounded-full border text-sm ${
                      selectedDepartments.includes(dept)
                        ? 'bg-yellow-500 text-white border-yellow-500'
                        : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200'
                    }`}
                    onClick={() => setSelectedDepartments(selectedDepartments.includes(dept)
                      ? selectedDepartments.filter(d => d !== dept)
                      : [...selectedDepartments, dept]
                    )}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="block font-medium mb-1 text-gray-900 dark:text-gray-100">Countries</label>
              <div className="flex flex-wrap gap-2 mb-2">
                <button
                  type="button"
                  className={`px-3 py-1 rounded-full border text-sm ${
                    selectedCountries.length === 0
                      ? 'bg-yellow-500 text-white border-yellow-500'
                      : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200'
                  }`}
                  onClick={() => setSelectedCountries([])}
                >
                  All
                </button>
                {ALL_COUNTRIES.map(country => (
                  <button
                    key={country}
                    type="button"
                    className={`px-3 py-1 rounded-full border text-sm ${
                      selectedCountries.includes(country)
                        ? 'bg-yellow-500 text-white border-yellow-500'
                        : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200'
                    }`}
                    onClick={() => setSelectedCountries(selectedCountries.includes(country)
                      ? selectedCountries.filter(c => c !== country)
                      : [...selectedCountries, country]
                    )}
                  >
                    {country}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                onClick={() => {
                  setSelectedDepartments([]);
                  setSelectedCountries([]);
                }}
              >
                Clear
              </button>
              <button
                className="px-4 py-2 rounded bg-yellow-500 hover:bg-yellow-600 text-white font-semibold"
                onClick={() => setShowFilterPopup(false)}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              onClick={() => setDeleteFile(null)}
              disabled={deleting}
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Delete File</h2>
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              Are you sure you want to delete <span className="font-bold">{deleteFile.file_name}</span>?<br />
              This action <span className="text-red-600 font-semibold">cannot be undone</span>.
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200"
                onClick={() => setDeleteFile(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700 flex items-center justify-center"
                onClick={async () => {
                  setDeleting(true);
                  const token = localStorage.getItem('token');
                  try {
                    await axios.delete(`http://localhost:8000/delete-file/${encodeURIComponent(deleteFile.file_name)}`, {
                      headers: { Authorization: `Bearer ${token}` }
                    });
                    setDeleteFile(null);
                    fetchFileList();
                  } catch (err) {
                    alert("Failed to delete file: " + (err?.response?.data?.detail || err.message));
                  } finally {
                    setDeleting(false);
                  }
                }}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader className="animate-spin w-4 h-4 mr-2" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}