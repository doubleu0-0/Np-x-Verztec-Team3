import { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import SearchPopup from '@/components/SearchPopup';
import Chatbot from '@/components/Chatbot';
import ChatInput from '@/components/ChatInput';
import SignIn from '@/components/SignIn';
import ProfileDropdown from '@/components/ProfileDropdown';
import ModelSelector from '@/components/ModelSelector';
import UploadXlsxButton from '@/components/UploadXlsxButton';
import UploadFile from '@/components/UploadFile';
import logo from '@/assets/images/logo.svg';
import white_logo from '@/assets/images/logo-white.png';
import ReactMarkdown from 'react-markdown';
import FloatingWindow from "@/components/FloatingWindow";
import GLBAvatar from '@/components/GLBAvatar';

const models = [
  {
    name: "llama3.3",
    label: "Lunar ai 4",
    description: "Powerful, large model for complex challenges",
    beta: true,
  },
  {
    name: "llama3.2:latest",
    label: "Lunar ai 3",
    description: "Smart, efficient model for everyday use",
    beta: false,
  },
  {
    name: "llama3.2:1b",
    label: "Lunar ai 3 mini",
    description: "Fastest model for daily tasks",
    beta: false,
  },
];

function App() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [selectedModel, setSelectedModel] = useState('llama3.2:latest');
  const [view, setView] = useState('chat');
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  const modelDropdownRef = useRef(null);

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        modelDropdownRef.current &&
        !modelDropdownRef.current.contains(event.target)
      ) {
        setShowModelDropdown(false);
      }
    }
    if (showModelDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showModelDropdown]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const handleNewChat = () => {
    setView('chat');
  };

  const handleSearch = () => {
    setIsSearchOpen(true);
  };

  const handleLogin = (email) => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setSelectedProfile(null);
  };

  const currentModel = models.find(m => m.name === selectedModel);

  if (!isLoggedIn) {
    return (
      <div
        className="min-h-screen bg-cover bg-center flex items-center justify-center"
        style={{ backgroundImage: "url('/src/assets/images/background.png')" }}
      >
        <SignIn onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <div className={`flex h-screen overflow-hidden ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white'}`}>
      {/* Sidebar */}
      <Sidebar onNewChat={handleNewChat} onSearch={handleSearch} />

      {/* Main Content */}
      <div className="flex flex-col flex-1">
        {/* Title aligned top-left beside Sidebar */}
        <div className="px-6 pt-4 pb-2 flex justify-between items-center">
          <img src={isDarkMode ? white_logo : logo} className="w-32" alt="logo" />
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white transition-all duration-300">
            Verztec's AI Assistant
          </h1>
        </div>

        {/* Header with Model Button, View Buttons (right), and ProfileDropdown */}
        <div className="flex justify-center w-full px-4">
          <div className="w-full max-w-5xl">
            <header className="flex justify-between items-center mb-2 border-b border-gray-200 dark:border-gray-700 rounded-lg px-4 py-1 z-30">
              <div className="flex items-center gap-2">
                {/* Model Button - now left aligned */}
                <div className="relative" ref={modelDropdownRef}>
                  <button
                    onClick={() => setShowModelDropdown(v => !v)}
                    className={`flex items-center px-3 py-1 text-sm rounded border font-semibold shadow transition
                      ${showModelDropdown ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-blue-400'}
                    `}
                  >
                    <span className="font-semibold text-gray-900 dark:text-white">{currentModel.label}</span>
                    {currentModel.beta && (
                      <span className="ml-2 px-2 py-0.5 text-xs font-bold rounded bg-yellow-400 text-yellow-900"
                        style={{ fontSize: '0.7rem', marginLeft: 6 }}>
                        Beta
                      </span>
                    )}
                    <svg className="ml-2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showModelDropdown && (
                    <div className="absolute left-0 mt-4 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50"
                      style={{ marginTop: '1.5rem' }} // Extra margin above dropdown
                    >
                      <ModelSelector
                        selectedModel={selectedModel}
                        setSelectedModel={(name) => {
                          setSelectedModel(name);
                          setShowModelDropdown(false);
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* View Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setView('chat')}
                    className={`px-3 py-1 text-sm rounded ${
                      view === 'chat' ? 'bg-yellow-500 text-black font-semibold' : 'bg-yellow-300 hover:bg-yellow-400 text-black'
                    }`}
                  >
                    Chat
                  </button>
                  <button
                    onClick={() => setView('uploadXlsx')}
                    className={`px-3 py-1 text-sm rounded ${
                      view === 'uploadXlsx' ? 'bg-yellow-500 text-black font-semibold' : 'bg-yellow-300 hover:bg-yellow-400 text-black'
                    }`}
                  >
                    Upload Excel
                  </button>
                  <button
                    onClick={() => setView('uploadFile')}
                    className={`px-3 py-1 text-sm rounded ${
                      view === 'uploadFile' ? 'bg-yellow-500 text-black font-semibold' : 'bg-yellow-300 hover:bg-yellow-400 text-black'
                    }`}
                  >
                    Upload File
                  </button>
                </div>
                {/* Profile Dropdown */}
                <ProfileDropdown
                  selectedProfile={selectedProfile}
                  setSelectedProfile={setSelectedProfile}
                  theme={isDarkMode ? 'dark' : 'light'}
                  toggleTheme={toggleTheme}
                  onLogout={handleLogout}
                />
              </div>
            </header>
          </div>
        </div>

        {/* Chat area container */}
        <div className="flex justify-center flex-1 overflow-y-auto px-4 pb-6 relative min-h-0">
          <div className="w-full max-w-5xl flex flex-col flex-1 min-h-0">
            {/* Main View */}
            <main className="flex-1 min-h-0 flex flex-col">
              {view === 'chat' && (
                <Chatbot selectedModel={selectedModel} setSelectedModel={setSelectedModel} />
              )}
              {view === 'uploadXlsx' && <UploadXlsxButton />}
              {view === 'uploadFile' && <UploadFile />}
              {view === 'markdown' && (
                <div className="prose max-w-full">
                  <ReactMarkdown
                    components={{
                      a: (props) => (
                        <a {...props} target="_blank" rel="noopener noreferrer" />
                      )
                    }}
                  >
                    {markdownContent}
                  </ReactMarkdown>
                </div>
              )}
            </main>
          </div>
        </div>

        {/* Search Popup */}
        <SearchPopup isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        <GLBAvatar />
        <FloatingWindow />
      </div>
    </div>
  );
}

export default App;
