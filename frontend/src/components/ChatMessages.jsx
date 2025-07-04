import Markdown from 'react-markdown';
import useAutoScroll from '@/hooks/useAutoScroll';
import Spinner from '@/components/Spinner';
import userIcon from '@/assets/images/user.svg';
import errorIcon from '@/assets/images/error.svg';
import { useEffect, useRef } from 'react';

// changed this line below
function ChatMessages({ messages, isLoading, selectedAvatar }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

// changed this chunk below (only 2 types of voices, one for all the female avatars, another for all the male avatars)
  useEffect(() => {
    if (!messages.length) return;
    const last = messages[messages.length - 1];

    if (last.role === 'assistant' && last.content && !last.loading) {
      const speakWithAvatarVoice = () => {
        const voices = speechSynthesis.getVoices();

        // Trim at "📄"
        const trimmedContent = last.content.split("📄")[0];
        if (trimmedContent.trim().length === 0) return;

        // ✅ Extract avatar number (e.g., 'avatar6' → 6)
        const avatarNum = parseInt(selectedAvatar.replace('avatar', ''), 10);
        const isFemale = [1, 5, 6].includes(avatarNum);

        // ✅ Pick voice based on gender
        const preferredVoice = voices.find(v =>
          v.lang === 'en-US' &&
          (
            (isFemale && (
              v.name.toLowerCase().includes('female') ||
              v.name.toLowerCase().includes('zira') ||
              v.name.toLowerCase().includes('samantha') ||
              v.name.toLowerCase().includes('google us english')
            )) ||
            (!isFemale && (
              v.name.toLowerCase().includes('male') ||
              v.name.toLowerCase().includes('david') ||
              v.name.toLowerCase().includes('google us english')
            ))
          )
        ) || voices.find(v => v.lang === 'en-US'); // fallback

        const utterance = new SpeechSynthesisUtterance(trimmedContent);
        utterance.voice = preferredVoice;
        utterance.lang = 'en-US';
        utterance.pitch = 1;
        utterance.rate = 1;
        speechSynthesis.speak(utterance);
      };

      if (speechSynthesis.getVoices().length) {
        speakWithAvatarVoice();
      } else {
        speechSynthesis.onvoiceschanged = () => {
          speakWithAvatarVoice();
        };
      }
    }
  }, [messages, selectedAvatar]);



  return (
    // changed this line below
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
