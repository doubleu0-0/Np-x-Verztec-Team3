import { Search, ChevronUp, ChevronDown, MoreVertical, X, RefreshCw, Filter } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from "react-dom";

const ALL_DEPARTMENTS = [
  "Marketing","Procurement","IT","Project Management","Human Resource","Admin & Operations","Business Development","Finance","Service Delivery"
];
const ALL_COUNTRIES = [
  "Singapore", "United Kingdom", "United States", "Thailand", 
  "Indonesia", "Korea", "China", "Japan", "Vietnam", "Myanmar"
];

const EditUserModal = ({ user, onClose, onSave, currentUser }) => {
  const [form, setForm] = useState({
    username: user.username || '',
    email: user.email || '',
    department: user.department || '',
    country: user.country || '',
    role: user.role || '',
  });
  const [emailError, setEmailError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    if (name === "email") {
      if (!value.endsWith("@verztec.com")) {
        setEmailError("Email must end with @verztec.com");
      } else {
        setEmailError("");
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.email.endsWith("@verztec.com")) {
      setEmailError("Email must end with @verztec.com");
      return;
    }
    onSave({ ...user, ...form });
  };

  // Only allow USER role if currentUser is MANAGER
  const roleOptions = currentUser?.role === "MANAGER"
    ? [
        { value: "USER", label: "USER" },
        { value: "MANAGER", label: "MANAGER" }
      ]
    : [
        { value: "USER", label: "USER" },
        { value: "MANAGER", label: "MANAGER" },
        { value: "ADMIN", label: "ADMIN" }
      ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md relative">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Edit User</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Username</label>
            <input
              name="username"
              value={form.username}
              className="w-full px-3 py-2 border rounded bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-80 font-semibold"
              required
              disabled
              readOnly
              tabIndex={-1}
              aria-disabled="true"
              title="Username cannot be changed"
              style={{ letterSpacing: "0.03em" }}
            />
            <span className="text-xs text-gray-400 dark:text-gray-500 italic">Username cannot be changed</span>
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white ${emailError ? "border-red-500" : ""}`}
              required
            />
            {emailError && (
              <span className="text-xs text-red-500">{emailError}</span>
            )}
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Department</label>
            <select
              name="department"
              value={form.department}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded 
                ${currentUser?.role === "MANAGER"
                  ? "bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed opacity-80 border-gray-300 dark:border-gray-600"
                  : "dark:bg-gray-700 dark:text-white"
                }`}
              required
              disabled={currentUser?.role === "MANAGER"}
              aria-disabled={currentUser?.role === "MANAGER"}
              title={currentUser?.role === "MANAGER" ? "Managers cannot edit department settings." : undefined}
            >
              <option value="" disabled>Select department</option>
              {ALL_DEPARTMENTS.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            {currentUser?.role === "MANAGER" && (
              <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                MANAGERS cannot edit department settings.
              </span>
            )}
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Country</label>
            <select
              name="country"
              value={form.country}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded 
                ${currentUser?.role === "MANAGER"
                  ? "bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed opacity-80 border-gray-300 dark:border-gray-600"
                  : "dark:bg-gray-700 dark:text-white"
                }`}
              required
              disabled={currentUser?.role === "MANAGER"}
              aria-disabled={currentUser?.role === "MANAGER"}
              title={currentUser?.role === "MANAGER" ? "Managers cannot edit country settings." : undefined}
            >
              <option value="" disabled>Select country</option>
              {ALL_COUNTRIES.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
            {currentUser?.role === "MANAGER" && (
              <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                MANAGERS cannot edit country settings.
              </span>
            )}
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Role</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
              required
            >
              {roleOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-yellow-500 text-black font-semibold hover:bg-yellow-600"
              disabled={!!emailError}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const BatchEditModal = ({ onClose, onSave, currentUser }) => {
  const [form, setForm] = useState({
    email: '',
    department: '',
    country: '',
    role: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Only send fields that have values
    const fieldsToUpdate = {};
    Object.keys(form).forEach(key => {
      if (form[key] && form[key].trim() !== '') {
        fieldsToUpdate[key] = form[key];
      }
    });

    if (Object.keys(fieldsToUpdate).length === 0) {
      alert('Please select at least one field to update.');
      return;
    }

    onSave(fieldsToUpdate);
  };

  // Role options based on current user
  const roleOptions = currentUser?.role === "MANAGER"
    ? [
        { value: "", label: "No change" },
        { value: "USER", label: "USER" },
        { value: "MANAGER", label: "MANAGER" }
      ]
    : [
        { value: "", label: "No change" },
        { value: "USER", label: "USER" },
        { value: "MANAGER", label: "MANAGER" },
        { value: "ADMIN", label: "ADMIN" }
      ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md relative">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Batch Edit Users</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Only filled fields will be updated for selected users.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Leave empty to keep unchanged"
              className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Department</label>
            <select
              name="department"
              value={form.department}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded 
                ${currentUser?.role === "MANAGER"
                  ? "bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed opacity-80"
                  : "dark:bg-gray-700 dark:text-white"
                }`}
              disabled={currentUser?.role === "MANAGER"}
            >
              <option value="">No change</option>
              {ALL_DEPARTMENTS.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Country</label>
            <select
              name="country"
              value={form.country}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded 
                ${currentUser?.role === "MANAGER"
                  ? "bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed opacity-80"
                  : "dark:bg-gray-700 dark:text-white"
                }`}
              disabled={currentUser?.role === "MANAGER"}
            >
              <option value="">No change</option>
              {ALL_COUNTRIES.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Role</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
            >
              {roleOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-yellow-500 text-black font-semibold hover:bg-yellow-600"
            >
              Update Selected Users
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function UserManagement({ isDarkMode, currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [menuOpen, setMenuOpen] = useState(null); // user_id of open menu
  const [editUser, setEditUser] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [usersPerPage, setUsersPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    department: "",
    country: "",
    role: "",
  });
  const [selectedRows, setSelectedRows] = useState([]);
  const [showBatchEdit, setShowBatchEdit] = useState(false);
  const [batchEditFields, setBatchEditFields] = useState({ role: "", department: "", country: "" });
  const scrollRef = useRef();
  const dragRef = useRef(false);
  const [expandedRow, setExpandedRow] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

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

  // Filtering and sorting
  const filteredAndSortedUsers = users
    .filter(user => {
      // If manager, only show users in same department and country
      if (currentUser?.role === "MANAGER") {
        if (
          user.department?.trim().toLowerCase() !== currentUser.department?.trim().toLowerCase() ||
          user.country?.trim().toLowerCase() !== currentUser.country?.trim().toLowerCase()
        ) {
          return false;
        }
      }
      // Filter by search
      const matchesSearch =
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role?.toLowerCase().includes(searchTerm.toLowerCase());

      // Filter by selected filters
      const matchesDepartment = !selectedFilters.department || user.department === selectedFilters.department;
      const matchesCountry = !selectedFilters.country || user.country === selectedFilters.country;
      const matchesRole = !selectedFilters.role || user.role === selectedFilters.role;

      return matchesSearch && matchesDepartment && matchesCountry && matchesRole;
    })
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      const aValue = a[sortConfig.key] || '';
      const bValue = b[sortConfig.key] || '';
      if (sortConfig.key === 'user_id') {
        return sortConfig.direction === 'asc'
          ? Number(aValue) - Number(bValue)
          : Number(bValue) - Number(aValue);
      }
      return sortConfig.direction === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedUsers.length / usersPerPage);
  const paginatedUsers = filteredAndSortedUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  // Reset to page 1 if usersPerPage changes
  useEffect(() => {
    setCurrentPage(1);
  }, [usersPerPage, searchTerm]);

  const handleMenuOpen = (userId) => {
    setMenuOpen(menuOpen === userId ? null : userId);
  };

  const handleEdit = (user) => {
    if (user.user_id === currentUser?.user_id) {
      alert("You cannot edit your own information.");
      return;
    }
    if (currentUser?.role === "MANAGER" && user.role === "ADMIN") {
      alert("Managers cannot edit ADMIN information.");
      return;
    }
    setEditUser(user);
    setMenuOpen(null);
  };

  const handleDelete = (user) => {
    // Prevent deleting yourself
    if (String(user.user_id) === String(currentUser?.user_id)) {
      alert("You cannot delete your own account.");
      return;
    }
    if (currentUser?.role === "MANAGER" && user.role === "ADMIN") {
      alert("Managers cannot delete ADMINs.");
      return;
    }
    setMenuOpen(null);
    setDeleteUser(user);
  };

  const handleEditSave = async (updatedUser) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/users/${updatedUser.user_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedUser),
      });
      if (response.ok) {
        setUsers(users.map(u => u.user_id === updatedUser.user_id ? updatedUser : u));
        setEditUser(null);
      } else {
        alert('Failed to update user.');
      }
    } catch {
      alert('Failed to update user.');
    }
  };

  const handleBatchEditSave = async (fieldsToUpdate) => {
    const token = localStorage.getItem('token');
    
    const payload = {
      user_ids: selectedRows,
      data: fieldsToUpdate,
    };
    
    // Add this line to see what you're sending
    console.log("Sending batch update payload:", payload);
    
    try {
      const res = await fetch('http://localhost:8000/users/batch-update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      
      // Add this to see the response
      const responseText = await res.text();
      console.log("Response status:", res.status);
      console.log("Response body:", responseText);
      
      if (res.ok) {
        const data = JSON.parse(responseText);
        // Update users in state
        setUsers(users =>
          users.map(u =>
            data.updated.includes(u.user_id)
              ? { ...u, ...fieldsToUpdate, updated_at: new Date().toISOString() }
              : u
          )
        );
        setSelectedRows([]);
        setShowBatchEdit(false);
        if (data.failed.length > 0) {
          alert(
            `Some users could not be updated:\n` +
            data.failed.map(f => `User ID ${f.user_id}: ${f.reason}`).join('\n')
          );
        }
      } else {
        alert(`Batch update failed: ${responseText}`);
      }
    } catch (e) {
      console.error("Request failed:", e);
      alert("Batch update failed.");
    }
  };

  // Only allow managers to edit/delete users and managers (not admins), and only in their own country
  const canManagerEditOrDelete = (targetUser) => {
    if (!currentUser || currentUser.role !== "MANAGER") return true; // Admins can edit/delete anyone
    if (targetUser.role === "ADMIN") return false;
    return (
      (targetUser.role === "USER" || targetUser.role === "MANAGER") &&
      targetUser.department.trim().toLowerCase() === currentUser.department.trim().toLowerCase() &&
      targetUser.country.trim().toLowerCase() === currentUser.country.trim().toLowerCase()
    );
  };

  // Add this function to manually refresh users
  const handleRefresh = () => {
    setLoading(true);
    fetchUsers();
  };

  const handleResetPassword = async (user) => {
    if (window.confirm(`Are you sure you want to reset the password for ${user.username}? They will receive a temporary password via email.`)) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:8000/reset-password/${user.user_id}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          alert(`✅ ${data.message}`);
          
          // If email failed, show the temporary password
          if (data.temp_password) {
            const showPassword = window.confirm(
              "Email delivery failed. Would you like to see the temporary password to provide manually?"
            );
            if (showPassword) {
              prompt("Temporary Password (expires in 24 hours):", data.temp_password);
            }
          }
        } else {
          const errorData = await response.json();
          alert(`❌ Failed to reset password: ${errorData.detail}`);
        }
      } catch (error) {
        console.error('Error resetting password:', error);
        alert('❌ Failed to reset password. Please try again.');
      }
      setMenuOpen(null);
    } else {
      setMenuOpen(null);
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let isDown = false;
    let startX;
    let scrollLeft;
    let moved = false;

    const mouseDownHandler = (e) => {
      isDown = true;
      moved = false;
      el.classList.add("cursor-grabbing");
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
    };
    const mouseLeaveHandler = () => {
      isDown = false;
      el.classList.remove("cursor-grabbing");
    };
    const mouseUpHandler = () => {
      isDown = false;
      el.classList.remove("cursor-grabbing");
      dragRef.current = moved;
      setTimeout(() => { dragRef.current = false; }, 0);
    };
    const mouseMoveHandler = (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX) * 1.5;
      if (Math.abs(x - startX) > 5) moved = true;
      el.scrollLeft = scrollLeft - walk;
    };

    el.addEventListener("mousedown", mouseDownHandler);
    el.addEventListener("mouseleave", mouseLeaveHandler);
    el.addEventListener("mouseup", mouseUpHandler);
    el.addEventListener("mousemove", mouseMoveHandler);

    return () => {
      el.removeEventListener("mousedown", mouseDownHandler);
      el.removeEventListener("mouseleave", mouseLeaveHandler);
      el.removeEventListener("mouseup", mouseUpHandler);
      el.removeEventListener("mousemove", mouseMoveHandler);
    };
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600 dark:text-gray-400">Loading users...</div>
        </div>
      </div>
    );
  }

  // Helper for select all
  const allowedIds = paginatedUsers
    .filter(user =>
      user.user_id !== currentUser?.user_id &&
      !(
        currentUser?.role === "MANAGER" && user.role === "ADMIN"
      ) &&
      canManagerEditOrDelete(user)
    )
    .map(u => u.user_id);

  const allSelected = allowedIds.length > 0 && allowedIds.every(id => selectedRows.includes(id));
  const someSelected = allowedIds.some(id => selectedRows.includes(id));

  return (
    <div className="pt-1 pb-2">
      <div className="mb-4">
        <div className="flex gap-4 mb-2 items-center">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search users by username, email, department, country, or role..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:bg-gray-700 dark:text-white"
            />
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <Search className="w-4 h-4" />
            </span>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-yellow-100 dark:hover:bg-yellow-800 transition"
            title="Refresh user list"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <select
            value={usersPerPage}
            onChange={e => setUsersPerPage(Number(e.target.value))}
            className="pl-3 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-base font-medium h-[44px]"
            style={{ minWidth: 120 }}
          >
            {[5, 10, 20, 50, 100, 1000].map(n => (
              <option key={n} value={n}>{n} per page</option>
            ))}
          </select>
          {/* Filter Button */}
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
        {/* Results Summary */}
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400 flex items-center justify-between">
          <span>
            Showing {paginatedUsers.length} of {filteredAndSortedUsers.length} users
          </span>
          {selectedRows.length > 0 && (
            <div className="flex gap-2">
              <button
                className="px-4 py-2 h-8 rounded bg-yellow-500 text-black font-semibold hover:bg-yellow-600 text-xs"
                onClick={() => setShowBatchEdit(true)}
              >
                Batch Edit
              </button>
              <button
                className="px-4 py-2 h-8 rounded bg-red-600 text-white font-semibold hover:bg-red-700 text-xs"
                onClick={async () => {
                  if (!window.confirm(`Are you sure you want to delete ${selectedRows.length} selected users? This cannot be undone.`)) return;
                  const token = localStorage.getItem('token');
                  try {
                    const res = await fetch('http://localhost:8000/users/batch-delete', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                      body: JSON.stringify({ user_ids: selectedRows }),
                    });
                    if (res.ok) {
                      const data = await res.json();
                      setUsers(users => users.filter(u => !data.deleted.includes(u.user_id)));
                      setSelectedRows([]);
                      if (data.failed.length > 0) {
                        alert(
                          `Some users could not be deleted:\n` +
                          data.failed.map(f => `User ID ${f.user_id}: ${f.reason}`).join('\n')
                        );
                      }
                    } else {
                      const err = await res.json();
                      alert(err.detail || "Batch delete failed.");
                    }
                  } catch (e) {
                    alert("Batch delete failed.");
                  }
                }}
              >
                Batch Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter Popup */}
      {showFilterPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-sm relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              onClick={() => setShowFilterPopup(false)}
            >
              ×
            </button>
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Filter Users</h2>
            {/* Department Filter */}
            <div className="mb-4">
              <label className="block font-medium mb-1 text-gray-900 dark:text-gray-100">
                Department
              </label>
              <select
                className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
                value={selectedFilters.department}
                onChange={e => setSelectedFilters(f => ({ ...f, department: e.target.value }))}
              >
                <option value="">All</option>
                {ALL_DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            {/* Country Filter */}
            <div className="mb-4">
              <label className="block font-medium mb-1 text-gray-900 dark:text-gray-100">
                Country
              </label>
              <select
                className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
                value={selectedFilters.country}
                onChange={e => setSelectedFilters(f => ({ ...f, country: e.target.value }))}
              >
                <option value="">All</option>
                {ALL_COUNTRIES.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
            {/* Role Filter */}
            <div className="mb-4">
              <label className="block font-medium mb-1 text-gray-900 dark:text-gray-100">
                Role
              </label>
              <select
                className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
                value={selectedFilters.role}
                onChange={e => setSelectedFilters(f => ({ ...f, role: e.target.value }))}
              >
                <option value="">All</option>
                <option value="USER">USER</option>
                <option value="MANAGER">MANAGER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                onClick={() => setSelectedFilters({ department: "", country: "", role: "" })}
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

      {/* Users Table - Remove horizontal scrolling */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden ml-0">
        <div
          ref={scrollRef}
          className="overflow-x-auto rounded-lg cursor-grab"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <table className="w-full table-fixed">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {/* Checkbox header */}
                <th className="px-2 py-3 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={el => {
                      if (el) el.indeterminate = !allSelected && someSelected;
                    }}
                    onChange={e => {
                      if (e.target.checked) {
                        setSelectedRows(prev => Array.from(new Set([...prev, ...allowedIds])));
                      } else {
                        setSelectedRows(prev => prev.filter(id => !allowedIds.includes(id)));
                      }
                    }}
                  />
                </th>
                <th className="px-6 py-3 w-36 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('username')}>
                  <div className="flex items-center gap-1">
                    Username
                    {getSortIcon('username')}
                  </div>
                </th>
                <th className="px-4 py-3 w-48 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('email')}>
                  <div className="flex items-center gap-1">
                    Email
                    {getSortIcon('email')}
                  </div>
                </th>
                <th className="px-4 py-3 w-20 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('role')}>
                  <div className="flex items-center gap-1">
                    Role
                    {getSortIcon('role')}
                  </div>
                </th>
                <th className="px-4 py-3 w-28 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('department')}>
                  <div className="flex items-center gap-1">
                    Department
                    {getSortIcon('department')}
                  </div>
                </th>
                <th className="px-4 py-3 w-28 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('country')}>
                  <div className="flex items-center gap-1">
                    Country
                    {getSortIcon('country')}
                  </div>
                </th>
                <th className="px-4 py-3 w-24 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('updated_at')}>
                  <div className="flex items-center gap-1">
                    Updated
                    {getSortIcon('updated_at')}
                  </div>
                </th>
                <th className="w-8 px-1 py-3 text-center"></th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((user, idx) => {
                  const isExpanded = expandedRow === idx;
                  return (
                    <tr
                      key={user.user_id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer`}
                      onClick={() => {
                        if (dragRef.current) return;
                        setExpandedRow(isExpanded ? null : idx);
                      }}
                    >
                      {/* Checkbox cell */}
                      <td className="px-2 py-4 w-8 text-center" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(user.user_id)}
                          disabled={
                            user.user_id === currentUser?.user_id ||
                            (currentUser?.role === "MANAGER" && user.role === "ADMIN") ||
                            !canManagerEditOrDelete(user)
                          }
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedRows([...selectedRows, user.user_id]);
                            } else {
                              setSelectedRows(selectedRows.filter(id => id !== user.user_id));
                            }
                          }}
                        />
                      </td>
                      <td className={isExpanded
                        ? "px-6 py-4 w-36 whitespace-pre-line text-sm font-medium text-gray-900 dark:text-white align-top"
                        : "px-6 py-4 w-36 truncate text-sm font-medium text-gray-900 dark:text-white"}
                        title={!isExpanded ? user.username : undefined}
                      >
                        {user.username}
                      </td>
                      <td className={isExpanded
                        ? "px-4 py-4 w-48 whitespace-pre-line text-sm text-gray-900 dark:text-white align-top"
                        : "px-4 py-4 w-48 truncate text-sm text-gray-900 dark:text-white"}
                        title={!isExpanded ? user.email : undefined}
                      >
                        {user.email}
                      </td>
                      <td className={isExpanded
                        ? "px-4 py-4 w-20 whitespace-pre-line text-sm font-medium text-gray-900 dark:text-white align-top"
                        : "px-4 py-4 w-20 truncate text-sm font-medium text-gray-900 dark:text-white"}
                        title={!isExpanded ? user.role : undefined}
                      >
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'ADMIN'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : user.role === 'MANAGER'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className={isExpanded
                        ? "px-4 py-4 w-28 whitespace-pre-line text-sm text-gray-900 dark:text-white align-top"
                        : "px-4 py-4 w-28 truncate text-sm text-gray-900 dark:text-white"}
                        title={!isExpanded ? user.department : undefined}
                      >
                        {user.department}
                      </td>
                      <td className={isExpanded
                        ? "px-4 py-4 w-28 whitespace-pre-line text-sm text-gray-900 dark:text-white align-top"
                        : "px-4 py-4 w-28 truncate text-sm text-gray-900 dark:text-white"}
                        title={!isExpanded ? user.country : undefined}
                      >
                        {user.country}
                      </td>
                      <td className={isExpanded
                        ? "px-4 py-4 w-24 whitespace-pre-line text-sm text-gray-500 dark:text-gray-400 align-top"
                        : "px-4 py-4 w-24 truncate text-sm text-gray-500 dark:text-gray-400"}
                        title={!isExpanded ? new Date(user.updated_at).toLocaleDateString() : 'N/A'}
                      >
                        {user.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="w-8 px-1 py-4 text-center">
                        {canManagerEditOrDelete(user) && user.user_id !== currentUser?.user_id && (
                          <>
                            <button
                              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                              onClick={() => handleMenuOpen(user.user_id)}
                            >
                              <MoreVertical className="w-5 h-5" />
                            </button>
                            {menuOpen === user.user_id &&
                              createPortal(
                                <div
                                  className="fixed z-50 right-8 top-1/2 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl"
                                  style={{ transform: "translateY(-50%)" }}
                                >
                                  <button
                                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-xl text-gray-900 dark:text-white"
                                    onClick={() => handleEdit(user)}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400"
                                    onClick={() => handleResetPassword(user)}
                                  >
                                    Reset Password
                                  </button>
                                  <button
                                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-xl"
                                    onClick={() => handleDelete(user)}
                                  >
                                    Delete
                                  </button>
                                </div>,
                                document.body
                              )
                            }
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500 dark:text-gray-400">
                    {searchTerm || selectedFilters.department || selectedFilters.country || selectedFilters.role
                      ? 'No users match your search or filters.'
                      : 'No users found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination controls always at the bottom */}
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
      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSave={handleEditSave}
          currentUser={currentUser}
        />
      )}
      {deleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-sm relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              onClick={() => setDeleteUser(null)}
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Delete User</h2>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
              Are you sure you want to delete the user <span className="font-semibold">{deleteUser.username}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteUser(null)}
                className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setDeleting(true);
                  try {
                    const token = localStorage.getItem('token');
                    const response = await fetch(`http://localhost:8000/users/${deleteUser.user_id}`, {
                      method: 'DELETE',
                      headers: {
                        Authorization: `Bearer ${token}`,
                      },
                    });
                    if (response.ok) {
                      setUsers(users => users.filter(u => u.user_id !== deleteUser.user_id));
                      setDeleteUser(null);
                    } else {
                      alert('Failed to delete user.');
                    }
                  } catch {
                    alert('Failed to delete user.');
                  } finally {
                    setDeleting(false);
                  }
                }}
                className="px-4 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700"
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <RefreshCw className="animate-spin w-4 h-4 mr-2" />
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
      {showBatchEdit && (
        <BatchEditModal
          onClose={() => setShowBatchEdit(false)}
          onSave={handleBatchEditSave}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}