import { useState, useEffect } from 'react';
import { Users, UserPlus, FileText, Upload, Moon, Sun, LogOut, ArrowLeft, Search, ChevronUp, ChevronDown, MoreVertical, X } from 'lucide-react';
import UploadXlsxButton from './UploadXlsxButton';
import UploadFile from './UploadFile';
import PolicyDocuments from './PolicyDocuments'; // Add this import
import logo from '@/assets/images/logo.svg';
import white_logo from '@/assets/images/logo-white.png';
import UserManagement from './UserManagement'; // Add this at the top

const AdminSidebar = ({ activeTab, setActiveTab, isDarkMode, userProfile, toggleTheme, handleLogout }) => {
  const menuItems = [
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'addUser', label: 'Add Users', icon: UserPlus },
    { id: 'policies', label: 'Policy Management', icon: FileText },
    { id: 'documents', label: 'Upload Documents', icon: Upload },
  ];

  return (
    <div style={{ width: '256px' }} className="h-screen fixed left-0 top-0 bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col justify-between">
      <div>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Admin Console</h2>
        </div>
        <nav className="p-4">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left mb-2 transition ${
                  activeTab === item.id
                    ? 'bg-yellow-500 text-black font-semibold'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <IconComponent className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
      {/* User info at the bottom */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center gap-3">
        <div className="flex-1">
          <div className="font-medium text-gray-900 dark:text-white">{userProfile?.username}</div>
          <div className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded px-2 py-0.5 font-semibold inline-block mt-1">
            {userProfile?.role}
          </div>
        </div>
        <button
          onClick={toggleTheme}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition"
          title="Toggle theme"
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <button
          onClick={handleLogout}
          className="p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default function AdminConsole({ userProfile, onBack, isDarkMode, toggleTheme }) {
  const [activeTab, setActiveTab] = useState('users');

  const handleLogout = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await fetch('http://localhost:8000/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (err) {
        console.error('Logout failed:', err);
      }
    }
    localStorage.removeItem('token');
    window.location.reload();
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'users':
        return (
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">User Management</h3>
            <UserManagement />
          </div>
        );

      case 'addUser':
        return (
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Add Users</h3>
            <UploadXlsxButton />
          </div>
        );
      
      case 'policies':
        return (
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Policy Documents</h3>
            <PolicyDocuments />
          </div>
        );

      case 'documents':
        return (
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Upload Documents</h3>
            <UploadFile />
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDarkMode={isDarkMode}
        userProfile={userProfile}
        toggleTheme={toggleTheme}
        handleLogout={handleLogout}
      />
      <div style={{ marginLeft: '256px' }}>
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 py-4 pl-0 pr-0">
          <div className="flex items-center justify-between">
            {/* Left side - Logo and current page title */}
            <div className="flex items-center gap-4 pl-6">
              <img src={isDarkMode ? white_logo : logo} className="w-24" alt="logo" />
              <div className="flex items-center gap-3">
                <button
                  onClick={onBack}
                  className="flex items-center gap-2 px-3 py-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Chat
                </button>
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {activeTab === 'users' && 'User Management'}
                  {activeTab === 'addUser' && 'Add Users'}
                  {activeTab === 'policies' && 'Policy Management'}
                  {activeTab === 'documents' && 'Upload Documents'}
                </h1>
              </div>
            </div>
            
            {/* Right side - User info and controls */}
            <div className="flex items-center gap-4 pr-6">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">{userProfile?.username}</span>
                <span className="ml-2 px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded text-xs font-semibold">
                  {userProfile?.role}
                </span>
              </div>
              
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </header>
        {/* Main content area with scroll */}
        <main className="h-[calc(100vh-72px)] overflow-y-auto bg-gray-50 dark:bg-gray-900 px-2">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}