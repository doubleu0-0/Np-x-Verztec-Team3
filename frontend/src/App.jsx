import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import SearchPopup from '@/components/SearchPopup';
import Chatbot from '@/components/Chatbot';
import SignIn from '@/components/SignIn';
import ProfileDropdown from '@/components/ProfileDropdown';
import ModelSelector from '@/components/ModelSelector';
import UploadXlsxButton from '@/components/UploadXlsxButton';
import UploadFile from '@/components/UploadFile';
import logo from '@/assets/images/logo.svg';
import white_logo from '@/assets/images/logo-white.png';
import ReactMarkdown from 'react-markdown';
import FloatingWindow from "@/components/FloatingWindow";

function App() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [selectedModel, setSelectedModel] = useState('llama3.2:latest');
  const [view, setView] = useState('chat');

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
      <div className="flex flex-col flex-1 overflow-y-auto">
        {/* Title aligned top-left beside Sidebar */}
        <div className="px-6 pt-4 pb-2 flex items-center gap-4">
          <img src={isDarkMode ? white_logo : logo} className="w-32" alt="logo" />
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white transition-all duration-300">
            Verztec's AI Assistant
          </h1>
        </div>

        {/* Chat area container */}
        <div className="flex justify-center flex-1 overflow-y-auto px-4 pb-6">
          <div className="w-full max-w-5xl flex flex-col">
            {/* Header with ModelSelector, View Buttons, and ProfileDropdown */}
            <header className="flex justify-between items-center mb-1 sticky top-0 bg-inherit z-20">
              <div className="flex items-center gap-4">
                <ModelSelector selectedModel={selectedModel} setSelectedModel={setSelectedModel} />
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
              </div>
              <ProfileDropdown
                selectedProfile={selectedProfile}
                setSelectedProfile={setSelectedProfile}
                theme={isDarkMode ? 'dark' : 'light'}
                toggleTheme={toggleTheme}
                onLogout={handleLogout}
              />
            </header>

            {/* Main View */}
            <main className="flex-1">
              {view === 'chat' && <Chatbot selectedModel={selectedModel} setSelectedModel={setSelectedModel} />}
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
      </div>

      {/* Search Popup */}
      <SearchPopup isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      <FloatingWindow />
    </div>
  );
}

export default App;