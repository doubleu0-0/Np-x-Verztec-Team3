import { useState, useEffect } from 'react';
import { Search, ChevronUp, ChevronDown, MoreVertical, X } from 'lucide-react';

const EditUserModal = ({ user, onClose, onSave }) => {
  const [form, setForm] = useState({
    username: user.username || '',
    email: user.email || '',
    department: user.department || '',
    country: user.country || '',
    role: user.role || '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...user, ...form });
  };

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
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Department</label>
            <input
              name="department"
              value={form.department}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Country</label>
            <input
              name="country"
              value={form.country}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
            />
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
              <option value="USER">USER</option>
              <option value="MANAGER">MANAGER</option>
              <option value="ADMIN">ADMIN</option>
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
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function UserManagement({ isDarkMode }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [menuOpen, setMenuOpen] = useState(null); // user_id of open menu
  const [editUser, setEditUser] = useState(null);

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
      // Numeric sort for user_id, string sort for others
      if (sortConfig.key === 'user_id') {
        return sortConfig.direction === 'asc'
          ? Number(aValue) - Number(bValue)
          : Number(bValue) - Number(aValue);
      }
      return sortConfig.direction === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });

  const handleMenuOpen = (userId) => {
    setMenuOpen(menuOpen === userId ? null : userId);
  };

  const handleEdit = (user) => {
    setEditUser(user);
    setMenuOpen(null);
  };

  const handleDelete = async (user) => {
    setMenuOpen(null);
    if (window.confirm(`Delete user "${user.username}"?`)) {
      try {
        const token = localStorage.getItem('token');
        await fetch(`http://localhost:8000/users/${user.user_id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(users.filter(u => u.user_id !== user.user_id));
      } catch (err) {
        alert('Failed to delete user.');
      }
    }
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
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">User Management</h3>
        {/* Only Search Bar */}
        <div className="flex gap-4 mb-4 items-center">
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
        </div>
        {/* Results Summary */}
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredAndSortedUsers.length} of {users.length} users
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('user_id')}
                >
                  <div className="flex items-center gap-1">
                    ID
                    {getSortIcon('user_id')}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('username')}
                >
                  <div className="flex items-center gap-1">
                    Username
                    {getSortIcon('username')}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('email')}
                >
                  <div className="flex items-center gap-1">
                    Email
                    {getSortIcon('email')}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('role')}
                >
                  <div className="flex items-center gap-1">
                    Role
                    {getSortIcon('role')}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('department')}
                >
                  <div className="flex items-center gap-1">
                    Department
                    {getSortIcon('department')}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('country')}
                >
                  <div className="flex items-center gap-1">
                    Country
                    {getSortIcon('country')}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('updated_at')}
                >
                  <div className="flex items-center gap-1">
                    Updated
                    {getSortIcon('updated_at')}
                  </div>
                </th>
                <th className="w-10 px-1 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAndSortedUsers.map((user) => (
                <tr key={user.user_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900 dark:text-white">{user.user_id}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{user.username}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {user.department}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {user.country}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {user.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'N/A'}
                    </div>
                  </td>
                  <td className="w-10 px-1 py-4 relative">
                    <button
                      className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                      onClick={() => handleMenuOpen(user.user_id)}
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    {menuOpen === user.user_id && (
                      <div className="absolute right-0 mt-2 w-28 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg z-10">
                        <button
                          className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => handleEdit(user)}
                        >
                          Edit
                        </button>
                        <button
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => handleDelete(user)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
        />
      )}
    </div>
  );
}