import Markdown from 'react-markdown';
import useAutoScroll from '@/hooks/useAutoScroll';
import Spinner from '@/components/Spinner';
import userIcon from '@/assets/images/user.svg';
import errorIcon from '@/assets/images/error.svg';
import { useEffect, useRef } from 'react';
import { useTTS } from '@/contexts/TTSContext';

function ChatMessages({ messages, isLoading }) {
  const bottomRef = useRef(null);
  const lastSpokenMessageIndex = useRef(-1);
  const { setIsSpeaking, setAudioLevel, setVisemeData } = useTTS();
  const visemeIntervalRef = useRef(null);
  const currentUtteranceRef = useRef(null);
  const speechMonitorRef = useRef(null);
  const textPositionRef = useRef(0);
  const animationStartTimeRef = useRef(0);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Phoneme to viseme mapping (keep existing function)
  const getVisemeFromPhoneme = (char, nextChar, prevChar) => {
    const lower = char.toLowerCase();
    
    // Vowels - mouth open
    if ('aeiou'.includes(lower)) {
      const openness = {
        'a': 0.8, 'e': 0.6, 'i': 0.4, 'o': 0.7, 'u': 0.5
      };
      return {
        mouthOpen: openness[lower] || 0.6,
        mouthWide: lower === 'e' || lower === 'i' ? 0.6 : 0.2,
        lipsPursed: lower === 'o' || lower === 'u' ? 0.6 : 0,
        smile: lower === 'i' || lower === 'e' ? 0.4 : 0.1,
        jawOpen: openness[lower] || 0.6
      };
    }
    
    // Consonants
    switch (lower) {
      case 'p':
      case 'b':
      case 'm':
        return {
          mouthOpen: 0.1,
          mouthWide: 0,
          lipsPursed: 0.9,
          smile: 0,
          jawOpen: 0.1
        };
      
      case 'f':
      case 'v':
        return {
          mouthOpen: 0.3,
          mouthWide: 0.4,
          lipsPursed: 0.5,
          smile: 0,
          jawOpen: 0.2
        };
      
      case 's':
      case 'z':
      case 'sh':
      case 'ch':
        return {
          mouthOpen: 0.2,
          mouthWide: 0.6,
          lipsPursed: 0.3,
          smile: 0.3,
          jawOpen: 0.1
        };
      
      case 't':
      case 'd':
      case 'n':
      case 'l':
        return {
          mouthOpen: 0.4,
          mouthWide: 0.3,
          lipsPursed: 0,
          smile: 0.2,
          jawOpen: 0.3
        };
      
      case 'k':
      case 'g':
        return {
          mouthOpen: 0.5,
          mouthWide: 0.2,
          lipsPursed: 0,
          smile: 0,
          jawOpen: 0.4
        };
      
      case 'r':
        return {
          mouthOpen: 0.3,
          mouthWide: 0.1,
          lipsPursed: 0.4,
          smile: 0,
          jawOpen: 0.2
        };
      
      case 'w':
        return {
          mouthOpen: 0.3,
          mouthWide: 0,
          lipsPursed: 0.8,
          smile: 0,
          jawOpen: 0.2
        };
      
      case 'y':
        return {
          mouthOpen: 0.4,
          mouthWide: 0.7,
          lipsPursed: 0,
          smile: 0.5,
          jawOpen: 0.3
        };
      
      case 'h':
        return {
          mouthOpen: 0.6,
          mouthWide: 0.3,
          lipsPursed: 0,
          smile: 0.1,
          jawOpen: 0.5
        };
      
      default:
        // Default for other consonants
        return {
          mouthOpen: 0.3,
          mouthWide: 0.2,
          lipsPursed: 0.1,
          smile: 0.1,
          jawOpen: 0.2
        };
    }
  };

  // Get neutral/rest position
  const getNeutralViseme = () => ({
    mouthOpen: 0.05,
    mouthWide: 0,
    lipsPursed: 0,
    smile: 0.15,
    jawOpen: 0,
    volume: 0
  });

  // Stop animation immediately
  const stopAnimation = () => {
    if (visemeIntervalRef.current) {
      clearInterval(visemeIntervalRef.current);
      visemeIntervalRef.current = null;
    }
    if (speechMonitorRef.current) {
      clearInterval(speechMonitorRef.current);
      speechMonitorRef.current = null;
    }
    setVisemeData(getNeutralViseme());
    setIsSpeaking(false);
    setAudioLevel(0);
    textPositionRef.current = 0;
    animationStartTimeRef.current = 0;
  };

  // Monitor speech synthesis status and sync animation
  const startSpeechMonitor = (text, speechRate) => {
    const cleanText = text.replace(/[^\w\s]/g, '').toLowerCase();
    const chars = cleanText.split('');
    
    // Improved timing calculation
    const wordsPerMinute = 140 * speechRate;
    const wordCount = cleanText.split(' ').filter(word => word.length > 0).length;
    const estimatedDuration = (wordCount / wordsPerMinute) * 60 * 1000;
    const charDuration = estimatedDuration / chars.length;
    
    animationStartTimeRef.current = Date.now();
    textPositionRef.current = 0;
    
    speechMonitorRef.current = setInterval(() => {
      // CRITICAL: Check if speech is still active
      if (!speechSynthesis.speaking) {
        console.log('Speech synthesis stopped - ending animation');
        stopAnimation();
        return;
      }
      
      // Only animate if we're actually speaking
      const elapsedTime = Date.now() - animationStartTimeRef.current;
      const charIndex = Math.floor(elapsedTime / charDuration);
      
      // Safety check for text completion
      if (charIndex >= chars.length) {
        console.log('Text animation complete');
        stopAnimation();
        return;
      }
      
      const currentChar = chars[charIndex];
      const nextChar = chars[charIndex + 1];
      const prevChar = chars[charIndex - 1];
      
      if (currentChar === ' ') {
        // Brief pause for spaces
        setVisemeData({
          ...getNeutralViseme(),
          volume: 0.1
        });
        setAudioLevel(0.1);
      } else {
        const viseme = getVisemeFromPhoneme(currentChar, nextChar, prevChar);
        
        // Add natural variation
        const variation = Math.sin(Date.now() / 100) * 0.05;
        
        const smoothedViseme = {
          ...viseme,
          mouthOpen: Math.max(0, Math.min(1, viseme.mouthOpen + variation)),
          volume: 0.6 + Math.random() * 0.3,
          naturalVariation: variation
        };
        
        setVisemeData(smoothedViseme);
        setAudioLevel(smoothedViseme.volume);
      }
      
      textPositionRef.current = charIndex;
    }, 50); // Check every 50ms
  };

  // Enhanced TTS with better synchronization
  useEffect(() => {
    if (!messages.length) return;
    
    const lastMessageIndex = messages.length - 1;
    const lastMessage = messages[lastMessageIndex];

    if (
      lastMessage.role === 'assistant' && 
      lastMessage.content && 
      !lastMessage.loading &&
      lastMessageIndex > lastSpokenMessageIndex.current
    ) {
      console.log('Attempting to speak:', lastMessage.content.substring(0, 50) + '...');
      
      lastSpokenMessageIndex.current = lastMessageIndex;
      
      const speakMessage = () => {
        try {
          // Cancel any existing speech and animation
          speechSynthesis.cancel();
          stopAnimation();
          
          // Small delay to ensure cancellation is complete
          setTimeout(() => {
            const voices = speechSynthesis.getVoices();
            const femaleVoice = voices.find(
              (v) =>
                v.lang.startsWith('en') &&
                (v.name.toLowerCase().includes('female') ||
                v.name.toLowerCase().includes('zira') ||
                v.name.toLowerCase().includes('samantha') ||
                v.name.toLowerCase().includes('karen') ||
                v.name.toLowerCase().includes('susan') ||
                v.name.toLowerCase().includes('google us english female') ||
                v.name.toLowerCase().includes('microsoft zira'))
            ) || voices.find(v => v.lang.startsWith('en'));

            const cleanContent = lastMessage.content
              .replace(/[#*_`]/g, '')
              .replace(/\n+/g, ' ')
              .trim();

            if (!cleanContent) return;

            const utterance = new SpeechSynthesisUtterance(cleanContent);
            currentUtteranceRef.current = utterance;
            
            if (femaleVoice) {
              utterance.voice = femaleVoice;
            }
            
            utterance.lang = 'en-US';
            utterance.pitch = 1;
            utterance.rate = 0.9;
            utterance.volume = 0.8;

            utterance.onstart = () => {
              console.log('Speech started');
              setIsSpeaking(true);
              
              // Start synchronized animation
              startSpeechMonitor(cleanContent, utterance.rate);
            };
            
            utterance.onend = () => {
              console.log('Speech ended');
              stopAnimation();
            };

            utterance.onpause = () => {
              console.log('Speech paused');
              stopAnimation();
            };

            utterance.onresume = () => {
              console.log('Speech resumed');
              setIsSpeaking(true);
              // Restart animation from current position
              startSpeechMonitor(cleanContent, utterance.rate);
            };
            
            utterance.onerror = (event) => {
              console.error('Speech error:', event.error);
              stopAnimation();
            };

            speechSynthesis.speak(utterance);
          }, 100);
        } catch (error) {
          console.error('TTS Error:', error);
          stopAnimation();
        }
      };

      if (speechSynthesis.getVoices().length > 0) {
        speakMessage();
      } else {
        speechSynthesis.onvoiceschanged = () => {
          speakMessage();
          speechSynthesis.onvoiceschanged = null;
        };
      }
    }
  }, [messages, setIsSpeaking, setAudioLevel, setVisemeData]);

  // Cleanup
  useEffect(() => {
    return () => {
      speechSynthesis.cancel();
      stopAnimation();
    };
  }, [setIsSpeaking, setAudioLevel, setVisemeData]);

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
