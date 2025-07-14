import { useState, useEffect, useRef } from "react"; // added useRef to detect clicks outside popup for closing it
import axios from "axios";

const SearchPopup = ({ isOpen, onClose, onChatSelect }) => {  // ✅ added onChatSelect
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [loading, setLoading] = useState(false); // 🔍 For spinner state while loading search results
  const popupRef = useRef(null); // used to track popup container for detecting outside clicks
  const firstMatchRef = useRef(null);

  // Simple highlight function for user query text (returns html string)
  const highlightQuery = (text, keyword) => {
    if (!keyword.trim()) return text;
    const words = keyword.trim().toLowerCase().split(/\s+/);6
    let highlighted = text;

    words.forEach((word) => {
      if (word.length > 0) {
        // Escape regex special chars and do global case-insensitive replace
        const regex = new RegExp(`(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, "gi");
        highlighted = highlighted.replace(regex, "<strong>$1</strong>");
      }
    });

    return highlighted;
  };

  // Load recent chats when popup opens or when user clears search (query="")
  useEffect(() => {
    if (isOpen && query === "") {
      fetchRecentChats();
    }
  }, [isOpen, query]);

  // Added this useEffect to close popup when user clicks outside of it kinda expected UX nowadays i think?
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event) => {
      // If the click target is outside the popupRef element, close the popup
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    };
    
    // Listen globally for clicks
    document.addEventListener("mousedown", handleClickOutside);
    // Clean up the listener when popup closes or unmounts
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const fetchRecentChats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get("http://localhost:8000/search?q=", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setResults(res.data);
    } catch (err) {
      console.error("Failed to fetch recent chats:", err);
    }
    setLoading(false);
  };

  const handleSearch = async (searchTerm) => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:8000/search?q=${searchTerm}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setResults(res.data);

      // Auto-scroll to first result if search query is at least 3 characters
      if (searchTerm.trim().length >= 3 && res.data.length > 0) {
        setTimeout(() => {
          if (firstMatchRef.current) {
            firstMatchRef.current.scrollIntoView({
              behavior: "smooth",
              block: "start"
            });
          }
        }, 100); // Small delay so results can render first
      }

    } catch (err) {
      console.error("Search failed:", err);
    }
    setLoading(false);
  };  

  // Debounced input handler for search input box like for that automatic search-as-you-type experience
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    if (typingTimeout) clearTimeout(typingTimeout);

    // Wait 300ms after user stops typing before triggering search
    const timeout = setTimeout(() => {
      if (value.trim()) {
        handleSearch(value);
      }
    }, 300);
    setTypingTimeout(timeout);
  };

  // Clear input handler — resets query and reloads recent chats
  const handleClearInput = () => {
    setQuery("");
    fetchRecentChats();
  };

  const handleChatClick = (conversationId) => {
    if (onChatSelect) {
      onChatSelect(conversationId);  // Pass conversation_id, not log_id
    } else {
      onClose();
    }
  };  

  const smartPreview = (text, keyword, fallbackWordLimit = 20) => {
    if (!text) return "";

    const [mainPart] = text.split("📄");
    const allWords = mainPart.split(/\s+/);

    const stopWords = new Set(["and", "or", "the", "a", "an", "of", "for", "in", "on", "at", "to", "with", "by"]);
    const rawTerms = keyword.trim().toLowerCase().split(/\s+/);
    const endsWithSpace = keyword.endsWith(" ");

    const searchTerms = [];
    const boldableTerms = [];

    rawTerms.forEach((term, index) => {
      if (!stopWords.has(term)) {
        searchTerms.push(term);
        if (term.length >= 3 || (endsWithSpace && index === rawTerms.length - 1)) {
          boldableTerms.push(term);
        }
      }
    });

    if (searchTerms.length === 0) {
      const preview = allWords.slice(0, fallbackWordLimit).join(" ");
      return preview + (allWords.length > fallbackWordLimit ? "…" : "");
    }

    const sentences = mainPart.match(/[^.!?]+[.!?]*/g) || [];
    const matches = [];

    for (let i = 0; i < sentences.length; i++) {
      if (matches.length >= 2) break;

      const sentence = sentences[i];
      const words = sentence.trim().split(/\s+/);

      const containsAnySearchTerm = words.some(word => {
        const cleaned = word.toLowerCase().replace(/[.,!?]/g, "");
        return searchTerms.some(term => cleaned.includes(term));
      });

      if (containsAnySearchTerm) {
        const highlighted = words.map(word => {
          let original = word;
          for (let term of boldableTerms) {
            const lower = original.toLowerCase();
            const clean = lower.replace(/[.,!?]/g, "");
            const index = clean.indexOf(term);
            if (index !== -1) {
              const realIndex = lower.indexOf(term);
              original =
                original.slice(0, realIndex) +
                "<strong>" +
                original.slice(realIndex, realIndex + term.length) +
                "</strong>" +
                original.slice(realIndex + term.length);
              break;
            }
          }
          return original;
        });

        matches.push({
          index: i,
          sentence: highlighted.join(" ")
        });
      }
    }

    if (matches.length > 0) {
      const firstIndex = matches[0].index;
      const lastIndex = matches[matches.length - 1].index;

      let fullSnippet = matches.map(m => m.sentence).join(" ");

      // Add ellipses only if context is missing
      if (firstIndex > 0) fullSnippet = "…" + fullSnippet;
      if (lastIndex < sentences.length - 1) fullSnippet = fullSnippet + "…";

      return fullSnippet;
    }

    const fallback = allWords.slice(0, fallbackWordLimit).join(" ");
    return fallback + (allWords.length > fallbackWordLimit ? "…" : "");
  };

  // Format the datetime to show "Today", "Yesterday" or a proper date
  const formatChatTime = (isoDate) => {
    const now = new Date();
    const chatDate = new Date(isoDate);

    const isToday = chatDate.toDateString() === now.toDateString();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = chatDate.toDateString() === yesterday.toDateString();

    const timeString = chatDate.toLocaleTimeString("en-GB", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    if (isToday) return `Today, ${timeString}`;
    if (isYesterday) return `Yesterday, ${timeString}`;

    return chatDate.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  if (!isOpen) return null; // Only show popup if open

  // Build a map of conversation_id to title (first non-empty title for each conversation)
  const conversationTitles = {};
  results.forEach(chat => {
    if (chat.conversation_id && chat.title && chat.title.trim()) {
      if (!conversationTitles[chat.conversation_id]) {
        conversationTitles[chat.conversation_id] = chat.title;
      }
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      {/* Ref attached here so we can detect outside clicks for closing the popup */}
      <div
        ref={popupRef}
        className="bg-gray-100 dark:bg-gray-800 p-6 rounded-2xl w-full max-w-2xl h-[600px] shadow-xl flex flex-col"
      >
        {/* Header with title and explicit close button (kept it cus its pretty standard for clarity and accessibility) */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Search Chats</h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Search input with a clear (✕) button to quickly reset */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search your chats..."
            value={query}
            onChange={handleInputChange}
            className="w-full p-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          {query && (
            <button
              onClick={handleClearInput}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Shows label based on if user has typed a query or not */}
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          {query ? "Results" : "Chats in the last 30 days"}
        </div>

        {/* The results list itself, scrollable with nice scrollbar styling */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
          {results.map((chat, index) => {
            if (!chat.preview || !chat.preview.trim()) return null;

            const highlightedPreview = highlightQuery(chat.preview, query);
            // Use the first available title for this conversation_id
            const displayTitle = conversationTitles[chat.conversation_id] || "Untitled Chat";

            return (
              <div
                key={chat.conversation_id}
                ref={index === 0 ? firstMatchRef : null}
                className="group cursor-pointer transition bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 p-3 rounded-lg text-gray-900 dark:text-white"
                onClick={() => handleChatClick(chat.conversation_id)}
              >
                <h3 className="text-base font-normal mb-1 line-clamp-1">
                  {displayTitle}
                </h3>              
                <p
                  className="text-sm line-clamp-2"
                  dangerouslySetInnerHTML={{ __html: highlightedPreview }}
                ></p>
                <small className="text-xs text-gray-600 dark:text-gray-300 block mt-1 opacity-0 group-hover:opacity-100 transition">
                  {formatChatTime(chat.created_at)}
                </small>
              </div>
            );
          })}          
          {!loading && results.filter(chat => chat.preview && chat.preview.trim()).length === 0 && (
            <p className="text-sm text-gray-400 dark:text-gray-500">No matches found.</p>
          )}          
        </div>
      </div>
    </div>
  );
};

export default SearchPopup;
