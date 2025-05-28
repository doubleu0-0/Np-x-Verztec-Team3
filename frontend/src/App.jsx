import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import SearchPopup from '@/components/SearchPopup';
import Chatbot from '@/components/Chatbot';
import SignIn from '@/components/SignIn';
import logo from '@/assets/images/logo.svg';

function App() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Login status

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

  // Sign-in page with background image
  if (!isLoggedIn) {
    return (
      <div
        className="min-h-screen bg-cover bg-center flex items-center justify-center"
        style={{ backgroundImage: "url('/src/assets/images/background.png')" }} // adjust path if needed
      >
        <SignIn onLogin={handleLogin} />
      </div>
    );
  }

  // Main app layout AFTER login (no background image)
  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar onNewChat={handleNewChat} onSearch={handleSearch} />

      <div className="flex flex-col flex-1 overflow-y-auto">
      <div className="max-w-3xl w-full mx-auto px-4">{/*
        <header className="sticky top-0 shrink-0 z-20 bg-white">
          <div className="flex flex-col h-full w-full gap-1 pt-4 pb-2">
            <a href="https://www.verztec.com">
              <img src={logo} className="w-32" alt="logo" />
            </a>
            <h1 className="font-urbanist text-[1.65rem] font-semibold">Verztec's AI Assistant</h1>
          </div>
        </header>
      */}
        <Chatbot />
      </div>
    </div>

      <SearchPopup isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
}

export default App;
