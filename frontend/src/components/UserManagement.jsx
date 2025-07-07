import { useState, useEffect } from 'react';
import { Search, ChevronUp, ChevronDown, MoreVertical, X, RefreshCw } from 'lucide-react';
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
        return (
          user.department?.trim().toLowerCase() === currentUser.department?.trim().toLowerCase() &&
          user.country?.trim().toLowerCase() === currentUser.country?.trim().toLowerCase()
        );
      }
      return true; // Admins see all
    })
    .filter(user =>
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchTerm.toLowerCase())
    )
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600 dark:text-gray-400">Loading users...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-1 pb-2">
      <div className="mb-4">
        <div className="flex gap-4 mb-2 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search users by username, email, department, country, or role..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-yellow-100 dark:hover:bg-yellow-800 transition"
            title="Refresh user list"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          {/* Users per page selector */}
          <div>
            <select
              value={usersPerPage}
              onChange={e => setUsersPerPage(Number(e.target.value))}
              className="pl-3 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-base font-medium"
              style={{ minWidth: 120 }}
            >
              {[5, 10, 20, 50, 100].map(n => (
                <option key={n} value={n}>{n} per page</option>
              ))}
            </select>
          </div>
        </div>
        {/* Results Summary */}
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Showing {paginatedUsers.length} of {filteredAndSortedUsers.length} users
        </div>
      </div>

      {/* Users Table - Remove horizontal scrolling */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden ml-0">
        {/* Remove overflow-x-auto wrapper */}
        <table className="w-full table-fixed">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
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
            {paginatedUsers.map((user) => (
              <tr key={user.user_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 w-36 truncate" title={user.username}>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{user.username}</span>
                </td>
                <td className="px-4 py-4 w-48 truncate" title={user.email}>
                  <div className="text-sm text-gray-900 dark:text-white">
                    {user.email}
                  </div>
                </td>
                <td className="px-4 py-4 w-20" title={user.role}>
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
                <td className="px-4 py-4 w-28 truncate" title={user.department}>
                  <div className="text-sm text-gray-900 dark:text-white">
                    {user.department}
                  </div>
                </td>
                <td className="px-4 py-4 w-28 truncate" title={user.country}>
                  <div className="text-sm text-gray-900 dark:text-white">
                    {user.country}
                  </div>
                </td>
                <td className="px-4 py-4 w-24 truncate" title={user.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'N/A'}>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {user.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'N/A'}
                  </div>
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
            ))}
          </tbody>
        </table>
        {/* Pagination controls */}
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
        {filteredAndSortedUsers.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-500 dark:text-gray-400">
              {searchTerm ? 'No users match your search.' : 'No users found.'}
            </div>
          </div>
        )}
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              onClick={() => setDeleteUser(null)}
              disabled={deleting}
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Delete User</h2>
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              Are you sure you want to delete <span className="font-bold">{deleteUser.username}</span>?<br />
              This action <span className="text-red-600 font-semibold">cannot be undone</span>.
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200"
                onClick={() => setDeleteUser(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700 flex items-center justify-center"
                onClick={async () => {
                  setDeleting(true);
                  try {
                    const token = localStorage.getItem('token');
                    const response = await fetch(`http://localhost:8000/users/${deleteUser.user_id}`, {
                      method: 'DELETE',
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    if (response.ok) {
                      setUsers(users.filter(u => u.user_id !== deleteUser.user_id));
                      setDeleteUser(null);
                    } else {
                      const data = await response.json();
                      alert(data.detail || 'Failed to delete user.');
                    }
                  } catch (err) {
                    alert('Failed to delete user.');
                  } finally {
                    setDeleting(false);
                  }
                }}
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
    </div>
  );
}