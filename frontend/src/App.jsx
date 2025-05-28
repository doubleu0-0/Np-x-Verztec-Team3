import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import SearchPopup from '@/components/SearchPopup';
import Chatbot from '@/components/Chatbot';
import SignIn from '@/components/SignIn';
import ProfileDropdown from '@/components/ProfileDropdown';
import ModelSelector from '@/components/ModelSelector'; // <-- import
import logo from '@/assets/images/logo.svg';

function App() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [selectedModel, setSelectedModel] = useState('llama3.2:latest'); // <-- add

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
    console.log("New Chat Triggered");
  };

  const handleSearch = () => {
    setIsSearchOpen(true);
  };

  const handleLogin = (email) => {
    console.log("Logged in as", email);
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
        <div className="px-6 pt-4 pb-2">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white transition-all duration-300">
            Verztec's AI Assistant
          </h1>
        </div>

        {/* Chat area container*/}
        <div className="flex justify-center flex-1 overflow-y-auto px-4 pb-6">
          <div className="w-full max-w-5xl flex flex-col">
            
            {/* Header with ModelSelector and ProfileDropdown */}
            <header className="flex justify-between items-center mb-4 sticky top-0 bg-inherit z-20">
              <ModelSelector selectedModel={selectedModel} setSelectedModel={setSelectedModel} />
              <ProfileDropdown
                selectedProfile={selectedProfile}
                setSelectedProfile={setSelectedProfile}
                theme={isDarkMode ? 'dark' : 'light'}
                toggleTheme={toggleTheme}
                onLogout={handleLogout}
              />
            </header>

            {/* Chatbot */}
            <Chatbot selectedModel={selectedModel} setSelectedModel={setSelectedModel} />
          </div>
        </div>
      </div>

      {/* Search Popup */}
      <SearchPopup isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
}

export default App;
