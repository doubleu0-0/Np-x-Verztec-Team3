import { useState, useRef, useEffect } from 'react';
import { useImmer } from 'use-immer';
import ChatMessages from '@/components/ChatMessages';
import ChatInput from '@/components/ChatInput';
import logo from '@/assets/images/logo.svg';
import white_logo from '@/assets/images/logo-white.png';
import ModelSelector from '@/components/ModelSelector';
import { useTTS } from '@/contexts/TTSContext';
const remoteip = import.meta.env.VITE_REMOTE_IP

function Chatbot({
  userProfile,
  selectedModel,
  setSelectedModel,
  selectedLogId = null,
  onNewChatCreated,
  messages: initialMessages = [],
  conversationId,
  setConversationId  
}) {
  const [messages, setMessages] = useImmer([]);
  const [newMessage, setNewMessage] = useState('');
  const [processingState, setProcessingState] = useState(null); // Replace status with processingState
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loadingLog, setLoadingLog] = useState(false);
  const messagesEndRef = useRef(null);

  const isLoading = messages.length && messages[messages.length - 1].loading;
  const { speakText } = useTTS();

  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
    }
  }, [initialMessages, setMessages]);

  useEffect(() => {
    // Stop any ongoing TTS when switching to a new chat or clearing messages
    window.speechSynthesis.cancel();

    if (selectedLogId === null) {
      setMessages([]);
      setProcessingState(null); // Clear processing state
    }
  }, [selectedLogId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const checkDark = () => setIsDarkMode(document.documentElement.classList.contains('dark'));
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  async function submitNewMessage() {
    const trimmedMessage = newMessage.trim();
    if (!trimmedMessage || isLoading) return;

    let finalConversationId = conversationId;
    if (!finalConversationId) {
      finalConversationId = crypto.randomUUID();
      setConversationId(finalConversationId);
      if (onNewChatCreated) {
        onNewChatCreated(finalConversationId);
      }
    }

    setMessages(draft => {
      draft.push({ role: 'user', content: trimmedMessage });
    });

    setNewMessage('');
    setProcessingState('processing'); // Show processing animation

    try {
      const token = localStorage.getItem('token');
      
      // Add a small delay to show the processing animation
      await new Promise(resolve => setTimeout(resolve, 800));

      const res = await fetch(`http://${remoteip}:8000/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: trimmedMessage,
          model: selectedModel,
          conversation_id: finalConversationId
        }),
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const contentType = res.headers.get("content-type");
      let parsedQuestions = [];

      if (contentType && contentType.includes("application/json")) {
        setProcessingState('extracting'); // Show extracting animation
        
        // Add delay to show extracting animation
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        let text = "";
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let done = false;
        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          if (value) text += decoder.decode(value);
        }
        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          setProcessingState(null);
          return;
        }
        parsedQuestions = data.questions || [];
        const originalMessage = data.original_message;

        if (parsedQuestions.length === 0) {
          setProcessingState(null);
          setMessages(draft => {
            draft.push({ role: 'assistant', content: "I'm here to help with HR-related concerns like leave, policies, or claims!" });
          });
          return;
        }

        setProcessingState('searching'); // Show searching animation
        
        // Add delay to show searching animation
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        const assistantIndexes = [];
        setMessages(draft => {
          parsedQuestions.forEach(() => {
            const index = draft.length;
            draft.push({ role: 'assistant', content: '', loading: true });
            assistantIndexes.push(index);
          });
        });

        setProcessingState(null); // Clear processing state when messages start loading
        parsedQuestions.forEach((q, i) => {
          setTimeout(() => {
            streamAnswer(q, assistantIndexes[i], originalMessage);
          }, 0);
        });
      } else {
        setProcessingState('generating'); // Show generating animation
        
        // Add delay to show generating animation
        await new Promise(resolve => setTimeout(resolve, 800));
        
        let text = "";
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let done = false;
        let assistantIndex = null;

        setMessages(draft => {
          assistantIndex = draft.length;
          draft.push({ role: 'assistant', content: '', loading: true });
        });

        setProcessingState(null); // Clear processing state when streaming starts

        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          if (value) {
            const chunk = decoder.decode(value);
            text += chunk;
            setMessages(draft => {
              if (draft[assistantIndex]) draft[assistantIndex].content += chunk;
            });
          }
        }

        setMessages(draft => {
          if (draft[assistantIndex]) draft[assistantIndex].loading = false;
          const finalResponse = draft[assistantIndex].content;
          speakText(finalResponse);
        });
        return;
      }

    } catch (err) {
      setProcessingState(null);
      // Could add an error state here if needed
    }
  }

  async function streamAnswer(questionText, assistantIndex, originalMessage) {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://${remoteip}:8000/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: questionText,
          model: selectedModel,
          conversation_id: conversationId,
          original_message: originalMessage
        }),
     });

      if (!res.ok) throw new Error(`Stream error: ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value);
          setMessages(draft => {
            if (!draft[assistantIndex]) return;
            draft[assistantIndex].content += chunk;
          });
        }
      }

      setMessages(draft => {
        if (!draft[assistantIndex]) return;
        draft[assistantIndex].loading = false;
      });

    } catch (err) {
      setMessages(draft => {
        if (!draft[assistantIndex]) return;
        draft[assistantIndex].loading = false;
        draft[assistantIndex].content = "Error streaming response.";
      });
    }
  }

  return (
    <div className="relative flex flex-col h-full min-h-0">
      {userProfile && (
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2 mb-4 flex flex-wrap gap-4 text-sm text-gray-700 dark:text-gray-200">
          <div><b>User:</b> {userProfile.username}</div>
          <div><b>Role:</b> {userProfile.role}</div>
          <div><b>Country:</b> {userProfile.country}</div>
          <div><b>Department:</b> {userProfile.department}</div>
        </div>
      )}

      <div className='flex-1 overflow-y-auto min-h-0 space-y-4 p-4'>
        {messages.length === 0 && !processingState ? (
          <>
            <div className="flex flex-col items-center mb-6">
              <img src={isDarkMode ? white_logo : logo} className="w-32 mb-2" alt="logo" />
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white transition-all duration-300">
                Verztec's AI Assistant
              </h1>
            </div>
            <div className="font-urbanist text-primary-blue text-xl font-light space-y-2 text-center">
              <p>👋 Hi there!</p>
              <p>
                I'm your AI assistant here at Verztec, think of me as your go-to guide for all things work and HR. From office policies to pantry rules, I'm here 24/7 to help you navigate your workday with ease.
              </p>
              <p>Whenever you're ready, I'm here to help.</p>
            </div>
          </>
        ) : (
          <ChatMessages 
            messages={messages} 
            isLoading={isLoading} 
            processingState={processingState}
          />
        )}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput
        newMessage={newMessage}
        isLoading={isLoading || processingState !== null}
        setNewMessage={setNewMessage}
        submitNewMessage={submitNewMessage}
      />
    </div>
  );
}

export default Chatbot;