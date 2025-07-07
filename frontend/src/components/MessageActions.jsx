import { useState } from 'react';
import { Copy, Globe, Check, ChevronDown } from 'lucide-react';

const MessageActions = ({ content, isDarkMode }) => {
  const [copied, setCopied] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translated, setTranslated] = useState({});
  const [showTranslation, setShowTranslation] = useState(null);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  const languages = [
    { code: 'zh', name: 'Chinese (Simplified)', flag: '🇨🇳' },
    { code: 'ms', name: 'Malay', flag: '🇲🇾' },
    { code: 'th', name: 'Thai', flag: '🇹🇭' },
    { code: 'id', name: 'Indonesian', flag: '🇮🇩' },
    { code: 'ko', name: 'Korean', flag: '🇰🇷' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
    { code: 'my', name: 'Myanmar', flag: '🇲🇲' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', flag: '🇮🇹' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
    { code: 'ta', name: 'Tamil', flag: '🇱🇰' },
  ];

  const handleCopy = async () => {
    try {
      // Remove markdown formatting and citations for cleaner copy
      const cleanText = content
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
        .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
        .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links, keep text
        .replace(/📄.*$/s, '') // Remove citations section
        .trim();
      
      await navigator.clipboard.writeText(cleanText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleTranslate = async (targetLang) => {
    if (showTranslation === targetLang) {
      setShowTranslation(null);
      setShowLanguageDropdown(false);
      return;
    }

    if (translated[targetLang]) {
      setShowTranslation(targetLang);
      setShowLanguageDropdown(false);
      return;
    }

    setTranslating(true);
    setShowLanguageDropdown(false);
    
    try {
      // Clean the content for translation (remove markdown and citations)
      const cleanText = content
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/\[(.*?)\]\(.*?\)/g, '$1')
        .replace(/📄.*$/s, '')
        .trim();

      // Using MyMemory API for translation
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanText)}&langpair=en|${targetLang}`
      );
      const data = await response.json();
      
      if (data.responseData && data.responseData.translatedText) {
        setTranslated(prev => ({
          ...prev,
          [targetLang]: data.responseData.translatedText
        }));
        setShowTranslation(targetLang);
      } else {
        throw new Error('Translation failed');
      }
    } catch (err) {
      console.error('Translation failed:', err);
      // Fallback message
      const fallbackMessage = `Translation to ${languages.find(l => l.code === targetLang)?.name} temporarily unavailable. Please try again later.`;
      setTranslated(prev => ({
        ...prev,
        [targetLang]: fallbackMessage
      }));
      setShowTranslation(targetLang);
    } finally {
      setTranslating(false);
    }
  };

  const getLanguageName = (code) => {
    return languages.find(l => l.code === code)?.name || code;
  };

  const getLanguageFlag = (code) => {
    return languages.find(l => l.code === code)?.flag || '🌐';
  };

  return (
    <div className="mt-3 space-y-2">
      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
            isDarkMode 
              ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
              : 'border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}
          title="Copy message"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>

        {/* Translation Button with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
              isDarkMode 
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
            title="Translate message"
            disabled={translating}
          >
            <Globe className={`w-3 h-3 ${translating ? 'animate-spin' : ''}`} />
            <span>
              {translating ? 'Translating...' : 
               showTranslation ? `Hide ${getLanguageName(showTranslation)}` : 'Translate'}
            </span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showLanguageDropdown ? 'rotate-180' : ''}`} />
          </button>

          {/* Language Dropdown */}
          {showLanguageDropdown && (
            <div className={`absolute top-full left-0 mt-1 w-56 rounded-lg border shadow-lg z-10 max-h-60 overflow-y-auto ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-600' 
                : 'bg-white border-gray-300'
            }`}>
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleTranslate(lang.code)}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-opacity-80 transition-colors flex items-center gap-2 ${
                    isDarkMode 
                      ? 'hover:bg-gray-700 text-gray-200' 
                      : 'hover:bg-gray-100 text-gray-700'
                  } ${showTranslation === lang.code ? (isDarkMode ? 'bg-gray-700' : 'bg-gray-100') : ''}`}
                >
                  <span className="text-sm">{lang.flag}</span>
                  <span>{lang.name}</span>
                  {translated[lang.code] && (
                    <Check className="w-3 h-3 ml-auto text-green-500" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Translation Display */}
      {showTranslation && translated[showTranslation] && (
        <div className={`p-3 rounded-lg border-l-4 border-blue-400 ${
          isDarkMode ? 'bg-gray-700/50' : 'bg-blue-50'
        }`}>
          <div className={`text-xs font-medium mb-1 flex items-center gap-1 ${
            isDarkMode ? 'text-blue-300' : 'text-blue-600'
          }`}>
            <span>{getLanguageFlag(showTranslation)}</span>
            <span>{getLanguageName(showTranslation)} Translation:</span>
          </div>
          <div className={`text-sm ${
            isDarkMode ? 'text-gray-200' : 'text-gray-700'
          }`}>
            {translated[showTranslation]}
          </div>
        </div>
      )}

      {/* Click outside to close dropdown */}
      {showLanguageDropdown && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowLanguageDropdown(false)}
        />
      )}
    </div>
  );
};

export default MessageActions;