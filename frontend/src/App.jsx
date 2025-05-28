import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import SearchPopup from '@/components/SearchPopup';
import Chatbot from '@/components/Chatbot';
import SignIn from '@/components/SignIn';
import ProfileDropdown from '@/components/ProfileDropdown';
import logo from '@/assets/images/logo.svg';

function App() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const [selectedProfile, setSelectedProfile] = useState(null);

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
      <div className="min-h-screen bg-cover bg-center flex items-center justify-center"
           style={{ backgroundImage: "url('/src/assets/images/background.png')" }}>
        <SignIn onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <div className={`flex h-screen overflow-hidden ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white'}`}>
      <Sidebar onNewChat={handleNewChat} onSearch={handleSearch} />
      <div className="flex flex-col flex-1 max-w-3xl mx-auto px-4">
        <header className="sticky top-0 shrink-0 z-20 bg-inherit">
          <div className="flex justify-between items-center pt-4 pb-2">
            <div>
              <h1 className="font-urbanist text-[1.65rem] font-semibold">Verztec's AI Assistant</h1>
            </div>
            <ProfileDropdown
              selectedProfile={selectedProfile}
              setSelectedProfile={setSelectedProfile}
              theme={isDarkMode ? 'dark' : 'light'}
              toggleTheme={toggleTheme}
              onLogout={handleLogout}
            />
          </div>
        </header>
        <Chatbot />
      </div>
      <SearchPopup isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
}

export default App;
