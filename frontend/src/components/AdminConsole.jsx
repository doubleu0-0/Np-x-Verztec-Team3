import { useState, useEffect } from 'react';
import { Users, UserPlus, FileText, Upload, Moon, Sun, LogOut, ArrowLeft, Search, ChevronUp, ChevronDown, MoreVertical, X, MessageSquare, Menu } from 'lucide-react';
import UploadXlsxButton from './UploadXlsxButton';
import UploadFile from './UploadFile';
import PolicyDocuments from './PolicyDocuments';
import logo from '@/assets/images/logo.svg';
import white_logo from '@/assets/images/logo-white.png';
import ViewFeedback from './ViewFeedback'; 
import UserManagement from './UserManagement';
import DatabaseLogs from './DatabaseLogs';
import { ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const ALL_COUNTRIES = ['Singapore', 'United Kingdom', 'United States', 'Thailand', 
  'Indonesia', 'Korea', 'China', 'Japan', 'Vietnam', 'Myanmar'];
const ALL_DEPARTMENTS = ['Human Resource', 'Admin & Operations', 'Project Management',
  'Procurement', 'IT', 'Marketing', 'Business Development', 'Finance', 'Service Delivery'];
const LOG_TABS = [
  { key: "chatbot_logs", label: "Chatbot Logs" },
  { key: "login_logs", label: "Login Logs" },
  { key: "upload_user_logs", label: "Upload User Logs" },
  { key: "upload_file_logs", label: "Upload File Logs" },
  { key: "file_deletion_logs", label: "File Deletion Logs" },
  { key: "user_update_logs", label: "User Update Logs" },
  { key: "user_deletion_logs", label: "User Deletion Logs" },
  { key: "file_update_logs", label: "File Update Logs" },
  { key: "password_reset_audit", label: "Password Reset Audit" },
  { key: "password_reset_tokens", label: "Password Reset Tokens" },
];
const remoteip = import.meta.env.VITE_REMOTE_IP

const AdminSidebar = ({
  activeTab,
  setActiveTab,
  isDarkMode,
  userProfile,
  toggleTheme,
  handleLogout,
  activeLogTab,
  setActiveLogTab,
  dbLogsOpen,
  setDbLogsOpen,
  onBack,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}) => {
  const menuItems = [
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'addUser', label: 'Add Users', icon: UserPlus },
    { id: 'policies', label: 'Policy Management', icon: FileText },
    { id: 'documents', label: 'Upload Documents', icon: Upload },
    { id: 'feedback', label: 'View Feedback', icon: MessageSquare },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      <div 
        className={`
          h-screen fixed left-0 top-0 bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col z-50
          w-64 lg:w-64
          transform transition-transform duration-300 ease-in-out lg:transform-none
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Admin Console</h2>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden p-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Scrollable navigation area */}
        <nav className="flex-1 overflow-y-auto p-4 relative">
          <div className="relative">
            {menuItems.map((item, idx) => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;
              return (
                <div key={item.id} className="relative mb-2">
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-highlight"
                      className="absolute inset-0 rounded-lg bg-yellow-500 z-0"
                      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                      transition={{ type: "spring", stiffness: 300, damping: 35, duration: 0.5 }}
                    />
                  )}
                  <button
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left relative z-10 transition font-semibold
                      ${isActive ? 'text-black' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}
                    `}
                    style={{ background: 'transparent' }}
                  >
                    <IconComponent className="w-5 h-5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                </div>
              );
            })}
          </div>
          {/* Database Logs Collapsible Section */}
          {userProfile?.role === "ADMIN" && (
            <div className="relative">
              <button
                onClick={() => {
                  setDbLogsOpen((open) => !open);
                  setActiveTab('dbLogs');
                  if (!dbLogsOpen) setActiveLogTab(LOG_TABS[0].key);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left mb-0 transition
                  ${dbLogsOpen && activeTab === 'dbLogs'
                    ? 'border border-yellow-300 rounded-t-xl rounded-b-none bg-yellow-500 text-black font-semibold border-b-0'
                    : 'border border-transparent rounded-xl bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}
                `}
                style={{ zIndex: 2, position: 'relative' }}
              >
                <FileText className="w-5 h-5 shrink-0" />
                <span className="truncate">Database Logs</span>
                {dbLogsOpen ? <ChevronDown className="ml-auto w-4 h-4 shrink-0" /> : <ChevronRight className="ml-auto w-4 h-4 shrink-0" />}
              </button>
              <AnimatePresence initial={false}>
                {dbLogsOpen && activeTab === 'dbLogs' && (
                  <motion.div
                    key="dbLogs"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.75, ease: [0.4, 0, 0.2, 1] }}
                    className="w-full rounded-b-xl p-2 -mt-1 overflow-hidden"
                    style={{
                      minWidth: 0,
                      zIndex: 1,
                      position: 'relative',
                      backgroundColor: 'rgba(254, 224, 109, 0.2)'
                    }}
                  >
                    {LOG_TABS.map((tab) => {
                      const isLogActive = activeLogTab === tab.key;
                      return (
                        <div key={tab.key} className="relative mb-1">
                          {isLogActive && (
                            <motion.div
                              layoutId="db-log-highlight"
                              className="absolute inset-0 rounded-lg bg-yellow-500 z-0"
                              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                              transition={{ type: "spring", stiffness: 300, damping: 35, duration: 0.4 }}
                            />
                          )}
                          <button
                            onClick={() => {
                              setActiveLogTab(tab.key);
                              setIsMobileMenuOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition font-semibold font-sans relative z-10 ${
                              isLogActive ? 'text-black' : 'text-white'
                            }`}
                            style={
                              isLogActive
                                ? { backgroundColor: 'transparent' }
                                : undefined
                            }
                          >
                            <span className="truncate block">{tab.label}</span>
                          </button>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </nav>
        
        {/* Bottom section - Enhanced User Role Panel and Back to Chat */}
        <div className="shrink-0">
          {/* Enhanced User Role Panel */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {userProfile?.email || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Role: {userProfile?.role || 'Member'}
                </p>
              </div>
              <div className="flex items-center space-x-2 ml-2">
                <button
                  onClick={toggleTheme}
                  className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  title="Toggle theme"
                >
                  {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Back to Chat button */}
          <div className="flex justify-center pb-4">
            <button
              onClick={() => {
                onBack();
                setIsMobileMenuOpen(false);
              }}
              className="w-[90%] flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 shadow transition"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              <span className="truncate">Back to Chat</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default function AdminConsole({ userProfile, onBack, isDarkMode, toggleTheme }) {
  const [activeTab, setActiveTab] = useState('users');
  const [activeLogTab, setActiveLogTab] = useState(LOG_TABS[0].key);
  const [dbLogsOpen, setDbLogsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await fetch(`http://${remoteip}:8000/logout`, {
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
          <div className="pt-0 pb-0 px-4 lg:px-6">
            <UserManagement currentUser={userProfile} />
          </div>
        );
      case 'addUser':
        return (
          <div className="pt-0 pb-0 px-4 lg:px-6">
            <UploadXlsxButton />
          </div>
        );
      case 'policies':
        return (
          <div className="pt-0 pb-0 px-4 lg:px-6">
            <PolicyDocuments currentUser={userProfile}/>
          </div>
        );
      case 'documents':
        return (
          <div className="pt-0 pb-0 px-4 lg:px-6">
            <UploadFile />
          </div>
        );
      case 'feedback':
        return (
          <div className="pt-0 pb-0 px-4 lg:px-6">
            <ViewFeedback />
          </div>
        );
      case 'dbLogs':
        return (
          <div className="pt-6 pb-0 px-4 lg:px-6">
            <div className="flex justify-between items-center pb-0">
              <h2 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white truncate">
                {(() => {
                  const tab = LOG_TABS.find(t => t.key === activeLogTab);
                  return tab ? tab.label : "Database Logs";
                })()}
              </h2>
            </div>
            <DatabaseLogs isDarkMode={isDarkMode} activeLogTab={activeLogTab} />
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
        activeLogTab={activeLogTab}
        setActiveLogTab={setActiveLogTab}
        dbLogsOpen={dbLogsOpen}
        setDbLogsOpen={setDbLogsOpen}
        onBack={onBack}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
      <div className="lg:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 py-4 pl-0 pr-0">
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 ml-4"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            {/* Left side - Logo */}
            <div className="flex items-center gap-4 pl-4 lg:pl-6">
              <img src={isDarkMode ? white_logo : logo} className="w-16 lg:w-24" alt="logo" />
            </div>
            
            {/* Right side - Verztec's AI Assistant */}
            <div className="flex-1 flex justify-end pr-4 lg:pr-8">
              <h1 className="text-lg lg:text-2xl font-semibold text-gray-900 dark:text-white truncate">
                Verztec's AI Assistant
              </h1>
            </div>
          </div>
        </header>
        
        {/* Main content area with scroll */}
        <main className="h-[calc(100vh-72px)] overflow-y-auto bg-gray-50 dark:bg-gray-900 px-2">
          {/* Page title below header - only for non-dbLogs tabs */}
          {activeTab !== 'dbLogs' && (
            <div className="flex justify-between items-center px-4 lg:px-6 pt-6 pb-0">
              <h2 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white truncate">
                {activeTab === 'users' && 'User Management'}
                {activeTab === 'addUser' && 'Add Users'}
                {activeTab === 'policies' && 'Policy Management'}
                {activeTab === 'documents' && 'Upload Documents'}
                {activeTab === 'feedback' && 'View Feedback'}
              </h2>
            </div>
          )}
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
