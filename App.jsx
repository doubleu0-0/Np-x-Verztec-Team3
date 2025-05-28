import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import SearchPopup from '@/components/SearchPopup';
import Chatbot from '@/components/Chatbot';
import SignIn from '@/components/SignIn';
import UploadXlsxButton from '@/components/UploadXlsxButton';
import logo from '@/assets/images/logo.svg';

function App() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [view, setView] = useState('chat'); // 'chat' or 'upload'

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
    <div className="flex min-h-screen bg-white">
      <Sidebar onNewChat={handleNewChat} onSearch={handleSearch} />

      <div className="flex flex-col flex-1 max-w-3xl mx-auto px-4">
        <header className="sticky top-0 shrink-0 z-20 bg-white">
          <div className="flex flex-col h-full w-full gap-1 pt-4 pb-2">
            <a href="https://www.verztec.com">
              <img src={logo} className="w-32" alt="logo" />
            </a>
            <h1 className="font-urbanist text-[1.65rem] font-semibold">Verztec's AI Assistant</h1>
          </div>

          {/* Toggle buttons */}
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setView('chat')}
              className={`px-3 py-1 text-sm rounded ${
                view === 'chat' ? 'bg-yellow-500 text-black font-semibold' : 'bg-yellow-300 hover:bg-yellow-400 text-black'
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setView('upload')}
              className={`px-3 py-1 text-sm rounded ${
                view === 'upload' ? 'bg-yellow-500 text-black font-semibold' : 'bg-yellow-300 hover:bg-yellow-400 text-black'
              }`}
            >
              Upload Excel
            </button>
          </div>
        </header>

        {/* View content */}
        <main className="flex-1 mt-4">
          {view === 'chat' ? <Chatbot /> : <UploadXlsxButton />}
        </main>
      </div>

      <SearchPopup isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
}

export default App;
