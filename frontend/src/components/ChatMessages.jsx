import Markdown from 'react-markdown';
import useAutoScroll from '@/hooks/useAutoScroll';
import Spinner from '@/components/Spinner';
import MessageActions from '@/components/MessageActions';
import userIcon from '@/assets/images/user.svg';
import errorIcon from '@/assets/images/error.svg';
import { useEffect, useRef, useState } from 'react';

function ChatMessages({ messages, isLoading }) {
  const bottomRef = useRef(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Check for dark mode
  useEffect(() => {
    const checkDark = () => setIsDarkMode(document.documentElement.classList.contains('dark'));
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Default Female Voice
  useEffect(() => {
    if (!messages.length) return;
    const last = messages[messages.length - 1];

    if (last.role === 'assistant' && last.content && !last.loading) {
      const speakWithFemaleVoice = () => {
        const voices = speechSynthesis.getVoices();

        // Trim at "📄"
        const trimmedContent = last.content.split("📄")[0];
        if (trimmedContent.trim().length === 0) return;
        
        // Try to find a female-sounding English voice
        const femaleVoice = voices.find(
          (v) =>
            v.lang === 'en-US' &&
            (v.name.toLowerCase().includes('female') ||
            v.name.toLowerCase().includes('zira') || // Windows
            v.name.toLowerCase().includes('samantha') || // macOS
            v.name.toLowerCase().includes('google us english')) // Chrome
        ) || voices.find(v => v.lang === 'en-US'); // fallback

        const utterance = new SpeechSynthesisUtterance(trimmedContent);
        utterance.voice = femaleVoice;
        utterance.lang = 'en-US';
        utterance.pitch = 1;
        utterance.rate = 1;
        speechSynthesis.speak(utterance);
      };

      // Handle case when voices might not be ready yet
      if (speechSynthesis.getVoices().length) {
        speakWithFemaleVoice();
      } else {
        speechSynthesis.onvoiceschanged = () => {
          speakWithFemaleVoice();
        };
      }
    }
  }, [messages]);

  return (
    <div className='flex-1 overflow-y-auto min-h-0 space-y-4 p-4'>
      {messages.map(({ role, content, loading, error }, idx) => (
        <div
          key={idx}
          className={`flex items-start gap-4 py-4 px-3 rounded-xl ${
            role === 'user'
              ? 'bg-primary-blue/10 dark:bg-gray-700'
              : 'bg-gray-100 dark:bg-gray-800'
          }`}
        >
          {role === 'user' && (
            <img
              className='h-[26px] w-[26px] shrink-0'
              src={userIcon}
              alt='user'
            />
          )}
          <div className="flex-1">
            <div className='markdown-container'>
              {(loading && !content) ? <Spinner />
                : (role === 'assistant')
                  ? <Markdown>{content}</Markdown>
                  : <div className='whitespace-pre-line'>{content}</div>
              }
            </div>
            {error && (
              <div className={`flex items-center gap-1 text-sm text-error-red ${content && 'mt-2'}`}>
                <img className='h-5 w-5' src={errorIcon} alt='error' />
                <span>Error generating the response</span>
              </div>
            )}
            
            {/* Add action buttons for assistant messages that are complete */}
            {role === 'assistant' && content && !loading && !error && (
              <MessageActions content={content} isDarkMode={isDarkMode} />
            )}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

export default ChatMessages;