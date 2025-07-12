import { useState, useRef, useEffect } from 'react';
import { useImmer } from 'use-immer';
import ChatMessages from '@/components/ChatMessages';
import ChatInput from '@/components/ChatInput';
import logo from '@/assets/images/logo.svg';
import white_logo from '@/assets/images/logo-white.png';
import ModelSelector from '@/components/ModelSelector';
import { useTTS } from '@/contexts/TTSContext';

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
  const [status, setStatus] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loadingLog, setLoadingLog] = useState(false);
  const messagesEndRef = useRef(null);
  // const [conversationId, setConversationId] = useState(null);

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
      setStatus('');
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

    // if (messages.length === 0 && onNewChatCreated) {
    //   const newId = crypto.randomUUID();
    //   setConversationId(newId);
    //   onNewChatCreated(newId);
    // }
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
    setStatus("Processing your message...");

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8000/process', {
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
          setStatus("✗ Error: Invalid JSON from server.");
          return;
        }
        parsedQuestions = data.questions || [];

        if (parsedQuestions.length === 0) {
          setStatus("No HR-related questions found.");
          setMessages(draft => {
            draft.push({ role: 'assistant', content: "I'm here to help with HR-related concerns like leave, policies, or claims!" });
          });
          return;
        }
      } else {
        let text = "";
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let done = false;
        let assistantIndex = null;

        setMessages(draft => {
          assistantIndex = draft.length;
          draft.push({ role: 'assistant', content: '', loading: true });
        });

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
        setStatus("");
        return;
      }

      setStatus(`Extracted ${parsedQuestions.length} question(s).`);
      const assistantIndexes = [];
      setMessages(draft => {
        parsedQuestions.forEach(() => {
          const index = draft.length;
          draft.push({ role: 'assistant', content: '', loading: true });
          assistantIndexes.push(index);
        });
      });

      parsedQuestions.forEach((q, i) => {
        setTimeout(() => {
          streamAnswer(q, assistantIndexes[i]);
        }, 0);
      });

    } catch (err) {
      setStatus(`✗ Error: ${err.message}`);
    }
  }

  async function streamAnswer(questionText, assistantIndex) {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8000/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        // body: JSON.stringify({ message: questionText, model: selectedModel })
        body: JSON.stringify({
          message: questionText,
          model: selectedModel,
          conversation_id: conversationId   // ✅ add this line
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

      setStatus("Done :)");
    } catch (err) {
      setStatus(`✗ Stream error: ${err.message}`);
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

      <div className="flex-1 overflow-y-auto px-4 pt-6 min-h-0">
        {messages.length === 0 ? (
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
                I’m your AI assistant here at Verztec, think of me as your go-to guide for all things work and HR. From office policies to pantry rules, I’m here 24/7 to help you navigate your workday with ease.
              </p>
              <p>Whenever you’re ready, I’m here to help.</p>
            </div>
          </>
        ) : (
          <ChatMessages messages={messages} isLoading={isLoading} />
        )}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput
        newMessage={newMessage}
        isLoading={isLoading}
        setNewMessage={setNewMessage}
        submitNewMessage={submitNewMessage}
      />

      <div className="text-sm text-gray-500 px-4 py-2">{status}</div>
    </div>
  );
}

export default Chatbot;