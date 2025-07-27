import Markdown from 'react-markdown';
import useAutoScroll from '@/hooks/useAutoScroll';
import Spinner from '@/components/Spinner';
import MessageActions from '@/components/MessageActions';
import userIcon from '@/assets/images/user.svg';
import errorIcon from '@/assets/images/error.svg';
import { useEffect, useRef, useState } from 'react';
import { useTTS } from '@/contexts/TTSContext';
const remoteip = import.meta.env.VITE_REMOTE_IP

function ChatMessages({ messages, isLoading, processingState = null, shouldSpeak }) {
  const bottomRef = useRef(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { speakText } = useTTS(); // Get the speakText function from context

  // List of fun facts
  const funFacts = [
    "Did you know? Verztec employees find it difficult to to read with their eyes closed",
    "Fun fact: Everytime a child is born the population increases",
    "Interesting: For every minute you are angry you lose 60 seconds of happiness",
    "Tonight the moon will be visible from Singapore. The last time this happened was last night.",
    "In Portuguese we don't say \"i love you\" instead we say \"eu te amo\" which means the exact same thing only in portuguese",
    "Interesting: In Verztec, height depends on how tall you are",
    "Did you know? Verztec employees with beards are just employees without beards, with beards",
    "Fun fact: Bald people are less likely to have hair",
    "Interesting: In Verztec, the boiling point of water is 100 degrees Celsius",
    "In Verztec, height depends on how tall you are",
    "Fun fact: The average annual salary in Verztec is 5 million dollars!",
    "Fun fact: An employee in Verztec is a person who works at Verztec",
    "Did you know? Verztec was found in the year 2000!",
    "Fun fact: Every minute in Verztec, 60 seconds passes",
    "Interesting: Sabre-tooth cats are extinct because they all died"
  ];
  const [showFunFact, setShowFunFact] = useState(false);
  const [currentFunFact, setCurrentFunFact] = useState('');
  const [usedFacts, setUsedFacts] = useState(new Set());
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [funFactTimer, setFunFactTimer] = useState(null);
  const [rotateTimer, setRotateTimer] = useState(null);

  // --- Fun Fact Effect (runs as long as loading or processingState is active and not in citation phase) ---
  useEffect(() => {
    // Don't show fun facts during citation processing
    const isCitation = messages.some(m => {
      const c = m.content || '';
      return c.includes('__CITATION_START__') && !c.includes('__CITATION_END__');
    });
    const isAnyLoading = messages.some(m => m.loading) || !!processingState;

    if (isCitation || !isAnyLoading) {
      setShowFunFact(false);
      if (funFactTimer) clearTimeout(funFactTimer);
      if (rotateTimer) clearInterval(rotateTimer);
      return;
    }

    // Fun fact logic
    const getRandomUnusedFact = () => {
      if (usedFacts.size >= funFacts.length) setUsedFacts(new Set());
      const availableFacts = funFacts.filter((_, idx) => !usedFacts.has(idx));
      const randomIndex = Math.floor(Math.random() * availableFacts.length);
      const selectedFact = availableFacts[randomIndex];
      const originalIndex = funFacts.indexOf(selectedFact);
      setUsedFacts(prev => new Set([...prev, originalIndex]));
      return selectedFact;
    };

    // Show first fun fact after 8s if not already shown
    if (!showFunFact) {
      const timer = setTimeout(() => {
        setCurrentFunFact(getRandomUnusedFact());
        setShowFunFact(true);
      }, 8000);
      setFunFactTimer(timer);
      return () => clearTimeout(timer);
    }

    // Rotate fun fact every 8s
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentFunFact(getRandomUnusedFact());
        setIsTransitioning(false);
      }, 300); // match transition duration
    }, 8000);
    setRotateTimer(interval);

    return () => {
      clearInterval(interval);
      if (funFactTimer) clearTimeout(funFactTimer);
    };
    // eslint-disable-next-line
  }, [messages, processingState, showFunFact]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, processingState]);

  // Use the TTS context instead of direct speechSynthesis
  useEffect(() => {
    if (!messages.length || !shouldSpeak) return;
    const last = messages[messages.length - 1];

    if (last.role === 'assistant' && last.content && !last.loading) {
      // Clean the content before speaking (remove metadata)
      const cleanContent = last.content.replace('__EMPTY_RESPONSE_METADATA__', '').trim();
      speakText(cleanContent);
    }
  }, [messages, speakText, shouldSpeak]);

  // Check for dark mode
  useEffect(() => {
    const checkDark = () => setIsDarkMode(document.documentElement.classList.contains('dark'));
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // --- RotatingLoadingMessage (NO fun fact logic here) ---
  const RotatingLoadingMessage = ({ messages, color = "green" }) => {
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

    useEffect(() => {
      if (messages.length <= 1) return;
      const interval = setInterval(() => {
        setCurrentMessageIndex(prev => (prev + 1) % messages.length);
      }, 2500);
      return () => clearInterval(interval);
    }, [messages.length]);

    const colorClasses = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      yellow: 'bg-yellow-500',
      purple: 'bg-purple-500',
      orange: 'bg-orange-500'
    };

    return (
      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          <div className={`w-2 h-2 ${colorClasses[color]} rounded-full animate-bounce`}></div>
          <div className={`w-2 h-2 ${colorClasses[color]} rounded-full animate-bounce`} style={{ animationDelay: '0.1s' }}></div>
          <div className={`w-2 h-2 ${colorClasses[color]} rounded-full animate-bounce`} style={{ animationDelay: '0.2s' }}></div>
        </div>
        <div className="relative h-6 flex items-center">
          {messages.map((message, index) => (
            <span
              key={index}
              className={`absolute transition-opacity duration-300 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap ${
                index === currentMessageIndex ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {message}
            </span>
          ))}
        </div>
      </div>
    );
  };

  // LoadingMessage component
  const LoadingMessage = ({ state }) => {
    const getLoadingContent = () => {
      switch (state) {
        case 'processing':
          return (
            <RotatingLoadingMessage 
              messages={[
                "Understanding your request...",
                "Analyzing your query...",
                "Processing information..."
              ]}
              color="blue"
            />
          );
        default:
          return (
            <RotatingLoadingMessage 
              messages={["Processing..."]}
              color="green"
            />
          );
      }
    };

    return (
      <div className="flex items-start gap-4 py-4 px-3 rounded-xl bg-gray-100 dark:bg-gray-800">
        <div className="flex-1">
          <div className="markdown-container">
            {getLoadingContent()}
          </div>
        </div>
      </div>
    );
  };

  // --- Fun Fact Bubble (always rendered, only visible when showFunFact) ---
  const FunFactBubble = () => {
    const [visibleIndex, setVisibleIndex] = useState(0);
    const [facts, setFacts] = useState([currentFunFact, ""]);
    useEffect(() => {
      if (!showFunFact) return;
      setFacts(facts => {
        const newFacts = [...facts];
        newFacts[(visibleIndex + 1) % 2] = currentFunFact;
        return newFacts;
      });
      setVisibleIndex(i => (i + 1) % 2);
      // eslint-disable-next-line
    }, [currentFunFact]);

    return (
      <div
        className={`overflow-hidden transition-all duration-700 ease-out ${
          showFunFact ? 'max-h-20 opacity-100 mt-3' : 'max-h-0 opacity-0 mt-0'
        }`}
      >
        <div
          className={`transform transition-all duration-700 ease-out ${
            showFunFact ? 'scale-100 translate-y-0' : 'scale-95 -translate-y-2'
          }`}
        >
          <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-lg animate-pulse">🌟</span>
              <div className="relative flex-1 h-5 overflow-hidden">
                {[0, 1].map(i => (
                  <span
                    key={i}
                    className={`absolute inset-0 text-sm text-blue-700 dark:text-blue-300 font-medium flex items-center transition-all duration-500 ease-in-out
                      ${visibleIndex === i
                        ? 'opacity-100 translate-y-0 z-10'
                        : 'opacity-0 translate-y-4 z-0'
                      }`}
                  >
                    {facts[i]}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className='flex-1 overflow-y-auto min-h-0 space-y-4 p-4'>
      {messages.map(({ role, content, loading, error }, idx) => {
        // Clean content for display (remove metadata and citation markers)
        let displayContent = content ? content.replace('__EMPTY_RESPONSE_METADATA__', '').trim() : '';
        
        // Check if content contains citation processing markers
        const citationStartIndex = displayContent.indexOf('__CITATION_START__');
        const citationEndIndex = displayContent.indexOf('__CITATION_END__');
        const isProcessingCitations = citationStartIndex !== -1 && citationEndIndex === -1;
        
        // Remove citation markers from display but keep the content
        displayContent = displayContent
          .replace('__CITATION_START__', '')
          .replace('__CITATION_END__', '');
        
        console.log('[DEBUG] Citation check:', {
          hasStart: citationStartIndex !== -1,
          hasEnd: citationEndIndex !== -1,
          isProcessing: isProcessingCitations,
          contentLength: displayContent.length
        });

        const showFunFactHere =
          !isProcessingCitations &&
          (loading || processingState);

        return (
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
                {(loading && !displayContent) ? (
                  <>
                    <RotatingLoadingMessage 
                      messages={[
                        "Streaming response...",
                        "Building your answer...",
                        "Composing reply...",
                        "Almost done..."
                      ]}
                      color="green"
                    />
                    {showFunFactHere && <FunFactBubble />}
                  </>
                ) : isProcessingCitations ? (
                  <div className="space-y-3">
                    {displayContent && <Markdown>{displayContent}</Markdown>}
                    <RotatingLoadingMessage
                      messages={[
                        "Evaluating citations...",
                        "Checking source relevance...",
                        "Verifying information accuracy...",
                        "Finalizing references..."
                      ]}
                      color="orange"
                    />
                  </div>
                ) : (role === 'assistant')
                  ? <Markdown>{displayContent}</Markdown>
                  : <div className='whitespace-pre-line'>{displayContent}</div>
                }
              </div>
              {error && (
                <div className={`flex items-center gap-1 text-sm text-error-red ${displayContent && 'mt-2'}`}>
                  <img className='h-5 w-5' src={errorIcon} alt='error' />
                  <span>Error generating the response</span>
                </div>
              )}
              {role === 'assistant' && content && !loading && !error && !isProcessingCitations && (
                <MessageActions content={content} isDarkMode={isDarkMode} />
              )}            
            </div>
          </div>
        );
      })}

      {/* Show processing state as a loading message */}
      {processingState && <LoadingMessage state={processingState} />}

      <div ref={bottomRef} />
    </div>
  );
}

export default ChatMessages;