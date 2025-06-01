import Markdown from 'react-markdown';
import useAutoScroll from '@/hooks/useAutoScroll';
import Spinner from '@/components/Spinner';
import userIcon from '@/assets/images/user.svg';
import errorIcon from '@/assets/images/error.svg';
import { useEffect, useRef } from 'react';

function ChatMessages({ messages, isLoading }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Default Male Voice
  // useEffect(() => {
  //   if (!messages.length) return;
  //   const last = messages[messages.length - 1];

  //   if (last.role === 'assistant' && last.content && !last.loading) {
  //     const utterance = new SpeechSynthesisUtterance(last.content);
  //     utterance.lang = 'en-US';
  //     speechSynthesis.speak(utterance);
  //   }
  // }, [messages]);

  // Default Female Voice
  useEffect(() => {
    if (!messages.length) return;
    const last = messages[messages.length - 1];

    if (last.role === 'assistant' && last.content && !last.loading) {
      const speakWithFemaleVoice = () => {
        const voices = speechSynthesis.getVoices();
        
        // Try to find a female-sounding English voice
        const femaleVoice = voices.find(
          (v) =>
            v.lang === 'en-US' &&
            (v.name.toLowerCase().includes('female') ||
            v.name.toLowerCase().includes('zira') || // Windows
            v.name.toLowerCase().includes('samantha') || // macOS
            v.name.toLowerCase().includes('google us english')) // Chrome
        ) || voices.find(v => v.lang === 'en-US'); // fallback

        const utterance = new SpeechSynthesisUtterance(last.content);
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
    <div className='grow overflow-y-auto space-y-4 p-4'>
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
          <div>
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
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

export default ChatMessages;