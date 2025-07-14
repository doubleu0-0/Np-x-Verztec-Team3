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
import Feedback from '@/components/Feedback';
import logo from '@/assets/images/logo.svg';
import white_logo from '@/assets/images/logo-white.png';
import ReactMarkdown from 'react-markdown';
import FloatingWindow from "@/components/FloatingWindow";
import GLBAvatar from '@/components/GLBAvatar';
import { TTSProvider } from '@/contexts/TTSContext';
import AdminConsole from '@/components/AdminConsole';
import AdminPasswordPrompt from '@/components/AdminPasswordPrompt';
import PasswordReset from './components/PasswordReset';
import MuteButton from '@/components/MuteButton';

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

const avatarNames = {
  avatar1: "Lunar",
  avatar2: "Alex",
  avatar3: "Nova",
  avatar4: "Zara",
  avatar5: "Sage",
  avatar6: "Her"
};

function AppContent({ selectedAvatar, setSelectedAvatar }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [selectedModel, setSelectedModel] = useState('llama3.2:latest');
  const [view, setView] = useState('chat');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [selectedLogId, setSelectedLogId] = useState(null);
  const [adminPasswordVerified, setAdminPasswordVerified] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [chats, setChats] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [markdownContent, setMarkdownContent] = useState('');
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [selectedChatMessages, setSelectedChatMessages] = useState([]);
  const [conversationId, setConversationId] = useState(() => crypto.randomUUID());
  
  const modelDropdownRef = useRef(null);

  // Load chats when user logs in
  useEffect(() => {
    if (isLoggedIn && userProfile) {
      loadChats();
    }
  }, [isLoggedIn, userProfile]);

  // Load chats from your API
  const loadChats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/chat-history/titles', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const chatTitles = await response.json();
        setChats(chatTitles);
        setFilteredChats(chatTitles); // show all chats initially
      }
    } catch (error) {
      console.error('Failed to load chats:', error);
    }
  };

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

  // Filter chats based on search query
  useEffect(() => {
    if (chatSearchQuery.trim() === '') {
      setFilteredChats(chats);
    } else {
      const filtered = chats.filter(chat =>
        chat.query?.toLowerCase().includes(chatSearchQuery.toLowerCase()) ||
        chat.response?.toLowerCase().includes(chatSearchQuery.toLowerCase())
      );
      setFilteredChats(filtered);
    }
  }, [chatSearchQuery, chats]);

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

  const handleNewChat = async () => {
    const newId = crypto.randomUUID();
    setConversationId(newId);
    setSelectedLogId(newId);
    setSelectedChatMessages([]);
    setIsSidebarOpen(false);
    setView('chat');
    await loadChats(); // Always reload chat list after new chat
  };

  const loadChatMessages = async (conversation_id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/chat-history/${conversation_id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const chatMessages = await response.json();
        setSelectedChatMessages(chatMessages);
      }
    } catch (error) {
      console.error('Failed to load chat messages:', error);
    }
  };

  const handleSearch = () => {
    setIsSearchOpen(true);
  };

  const handleLogin = async (email) => {
    const token = localStorage.getItem('token');
    const profileRes = await fetch('http://localhost:8000/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const profileData = await profileRes.json();
    setUserProfile(profileData.session);
    setIsLoggedIn(true);
  };

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
    setIsLoggedIn(false);
    setSelectedProfile(null);
    setChats([]);
    setFilteredChats([]);
    setSelectedChatMessages([]);
    setSelectedLogId(null);
    setView('chat');  // Optional: Reset view    
  };

  const handleAvatarChange = (avatarName) => {
    setSelectedAvatar(avatarName);
  };

  const handleAdminConsole = () => {
    setAdminPasswordVerified(false);
    setView('adminConsole');
    setIsSidebarOpen(false);
  };

  const handleChatSelect = async(conversation_id) => {
    setSelectedLogId(conversation_id);
    setConversationId(conversation_id); // Set conversationId here
    setView('chat');
    setIsSidebarOpen(false);
    setIsSearchOpen(false);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/chat-history/${conversation_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    if (response.ok) {
      const fullChat = await response.json();
      console.log("Fetched messages for conversation", conversation_id, fullChat); // 👈 ADD THIS
      setSelectedChatMessages(fullChat);  // Set full chat here
    } else {
      console.warn("Chat history not found or failed for", conversation_id);
      setSelectedChatMessages([]);  // Clear if no chat
    }
  } catch (error) {
    console.error('Failed to load chat messages:', error);
    setSelectedChatMessages([]);
  }
};

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  // Add function to refresh chats when a new chat is created
  const handleNewChatCreated = async (newConversationId) => {
    await loadChats(); // Wait for chats to load
    setSelectedLogId(newConversationId); // Select the new chat
    setConversationId(newConversationId); // Set conversationId for new chat
    setView('chat'); // Ensure chat view is active
    // Optionally, load messages for the new chat if available
    await loadChatMessages(newConversationId);
  };

  const currentModel = models.find(m => m.name === selectedModel);

  // Add useEffect to check URL parameters for password reset
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userId = urlParams.get('user_id');
    
    if (token && userId) {
      setIsPasswordReset(true);
    }
  }, []);

  // If it's a password reset, show the password reset component BEFORE the login check
  if (isPasswordReset) {
    return (
      <div className={isDarkMode ? 'dark' : ''}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <PasswordReset 
            onComplete={() => {
              setIsPasswordReset(false);
              // Clear URL parameters
              window.history.replaceState({}, document.title, window.location.pathname);
            }}
          />
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className={isDarkMode ? 'dark' : ''}>
        <SignIn onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <div className={`flex h-screen overflow-hidden ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white'}`}>
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Enhanced Sidebar with Avatar and Chat Search - Hide in verified admin console */}
      {!(view === "adminConsole" && adminPasswordVerified) && (
        <div className={`
          fixed lg:relative inset-y-0 left-0 z-50 w-80 lg:w-64 xl:w-72 2xl:w-80
          transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          transition-transform duration-300 ease-in-out
          ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}
          border-r flex flex-col
        `}>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Chats
              </h2>
              <button
                onClick={handleCloseSidebar}
                className="lg:hidden p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* New Chat Button */}
            <button
              onClick={handleNewChat}
              className="w-full mb-3 px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-black rounded-md font-medium transition-colors"
            >
              + New Chat
            </button>

            {/* Chat Search Button */}
            <div className="relative">
              <button
                onClick={() => setIsSearchOpen(true)}
                className={`
                  w-full text-left pl-9 pr-3 py-2 rounded-md text-sm
                  ${isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 hover:bg-gray-600' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 hover:bg-gray-50'
                  }
                  border focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-colors
                `}
              >
                Search chats...
              </button>
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0z" />
              </svg>
            </div>
          </div>

          {/* Avatar Section */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            {/* Avatar Navigation Bar */}
            <div className="flex items-center justify-between mb-4">
              {/* Previous Avatar Button */}
              <button
                onClick={() => {
                  const avatarKeys = Object.keys(avatarNames);
                  const currentIndex = avatarKeys.indexOf(selectedAvatar);
                  const prevIndex = currentIndex > 0 ? currentIndex - 1 : avatarKeys.length - 1;
                  handleAvatarChange(avatarKeys[prevIndex]);
                }}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title="Previous avatar"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Avatar Name - Now centred between arrows */}
              <div className="text-center">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                  {avatarNames[selectedAvatar] || 'Assistant'}
                </h3>
              </div>

              {/* Next Avatar Button */}
              <button
                onClick={() => {
                  const avatarKeys = Object.keys(avatarNames);
                  const currentIndex = avatarKeys.indexOf(selectedAvatar);
                  const nextIndex = currentIndex < avatarKeys.length - 1 ? currentIndex + 1 : 0;
                  handleAvatarChange(avatarKeys[nextIndex]);
                }}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title="Next avatar"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Avatar Container - Larger size and centred */}
            <div className="flex justify-center">
              <div className="w-full max-w-[200px] sm:max-w-[250px] lg:max-w-[280px] xl:max-w-[320px] mx-auto aspect-square">
                <GLBAvatar 
                  selectedAvatar={selectedAvatar}
                  onAvatarChange={handleAvatarChange}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto p-2">
            {filteredChats.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {chatSearchQuery ? 'No chats found' : 'No chats yet'}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredChats.map((chat) => (
                  <button
                    key={chat.conversation_id}
                    onClick={() => handleChatSelect(chat.conversation_id)}
                    className={`
                      w-full text-left p-3 rounded-md transition-colors
                      ${selectedLogId === chat.conversation_id
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }
                    `}
                  >
                    <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
                      {chat.title || 'Untitled Chat'}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Role Panel */}
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
                {/* Close Panel Button for Desktop */}
                <button
                  onClick={handleCloseSidebar}
                  className="hidden lg:flex p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  title="Close panel"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                {/* Profile Dropdown */}
                <div className="relative">
                  <ProfileDropdown
                    selectedProfile={selectedProfile}
                    setSelectedProfile={setSelectedProfile}
                    selectedAvatar={selectedAvatar}
                    setSelectedAvatar={setSelectedAvatar}
                    theme={isDarkMode ? 'dark' : 'light'}
                    toggleTheme={toggleTheme}
                    onLogout={handleLogout}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-w-0">
      {/* Mobile Header */}
      {!(view === "adminConsole" && adminPasswordVerified) && (
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <img src={isDarkMode ? white_logo : logo} className="w-24" alt="logo" />
          <div className="w-10"></div>
        </div>
      )}

        {/* Desktop Header - Hide in verified admin console */}
        {!(view === "adminConsole" && adminPasswordVerified) && (
          <div className="hidden lg:block px-6 pt-4 pb-2">
            <div className="flex justify-between items-center">
              <img src={isDarkMode ? white_logo : logo} className="w-32" alt="logo" />
              <h1 className="text-xl xl:text-2xl font-semibold text-gray-900 dark:text-white">
                Verztec's AI Assistant
              </h1>
            </div>
          </div>
        )}

        {/* Model Selector and View Buttons - Hide in verified admin console */}
        {!(view === "adminConsole" && adminPasswordVerified) && (
          <div className="flex justify-center w-full px-4">
            <div className="w-full max-w-5xl">
              <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-2 border-b border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3">
                <div className="flex items-center gap-2 order-2 sm:order-1">
                  <div className="relative" ref={modelDropdownRef}>
                    <button
                      onClick={() => setShowModelDropdown(v => !v)}
                      className={`flex items-center px-3 py-2 text-sm rounded border font-semibold shadow transition
                        ${showModelDropdown ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-blue-400'}
                      `}
                    >
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {currentModel.label}
                      </span>
                      {currentModel.beta && (
                        <span className="ml-2 px-2 py-0.5 text-xs font-bold rounded bg-yellow-400 text-yellow-900">
                          Beta
                        </span>
                      )}
                      <svg className="ml-2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showModelDropdown && (
                      <div className="absolute left-0 mt-2 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
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
                  <MuteButton />
                </div>
                
                <div className="flex items-center gap-2 order-1 sm:order-2">
                  <button
                    onClick={() => setView('chat')}
                    className={`px-4 py-2 text-sm rounded font-medium transition-colors ${
                      view === 'chat' ? 'bg-yellow-500 text-black' : 'bg-yellow-300 hover:bg-yellow-400 text-black'
                    }`}
                  >
                    Chat
                  </button>

                  <button
                    onClick={() => {
                      setView('feedback');
                      setIsSidebarOpen(false);
                    }}
                    className={`px-4 py-2 text-sm rounded font-medium transition-colors ${
                      view === 'feedback' ? 'bg-yellow-500 text-black' : 'bg-yellow-300 hover:bg-yellow-400 text-black'
                    }`}
                  >
                    Feedback
                  </button>

                  {(userProfile?.role === 'ADMIN' || userProfile?.role === 'MANAGER') && (
                    <button
                      onClick={handleAdminConsole}
                      className={`px-4 py-2 text-sm rounded font-medium transition-colors ${
                        view === 'adminConsole' ? 'bg-yellow-500 text-black' : 'bg-yellow-300 hover:bg-yellow-400 text-black'
                      }`}
                    >
                      Admin Console
                    </button>
                  )}
                </div>
              </header>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        {view === "adminConsole" && adminPasswordVerified ? (
          // Full screen AdminConsole - no scrolling, no constraints
          <div className="flex-1 h-full">
            <AdminConsole
              userProfile={userProfile}
              onBack={() => setView('chat')}
              isDarkMode={isDarkMode}
              toggleTheme={toggleTheme}
            />
          </div>
        ) : (
          <div className="flex justify-center flex-1 overflow-y-auto px-4 pb-6 relative min-h-0">
            <div className="w-full max-w-5xl flex flex-col flex-1 min-h-0">
              <main className="flex-1 min-h-0 flex flex-col">
                {view === 'chat' && (
                  <Chatbot 
                    userProfile={userProfile}
                    selectedModel={selectedModel}
                    setSelectedModel={setSelectedModel}
                    selectedLogId={selectedLogId}
                    onNewChatCreated={handleNewChatCreated}
                    messages={selectedChatMessages}
                    conversationId={conversationId} // ⬅ ADD THIS
                    setConversationId={setConversationId} // ⬅ ADD THIS     
                  />
                )}
                {view === 'feedback' && (
                  <Feedback 
                    userProfile={userProfile}
                    isDarkMode={isDarkMode}
                  />
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
                {view === "adminConsole" && !adminPasswordVerified && (
                  <div className="flex flex-1 items-center justify-center">
                    <AdminPasswordPrompt
                      onPasswordVerified={() => setAdminPasswordVerified(true)}
                      onCancel={() => setView('chat')}
                      isDarkMode={isDarkMode}
                    />
                  </div>
                )}
              </main>
            </div>
          </div>
        )}
      </div>

      {/* Search Popup */}
      <SearchPopup
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onChatSelect={handleChatSelect}
      />
    </div>
  );
}

// Main App component wrapped with TTSProvider
function App() {
  const [selectedAvatar, setSelectedAvatar] = useState('avatar6');
  return (
    <TTSProvider selectedAvatar={selectedAvatar}>
      <AppContent 
        selectedAvatar={selectedAvatar}
        setSelectedAvatar={setSelectedAvatar}
      />
    </TTSProvider>
  );
}

export default App;
