import { useState } from 'react';
import { useImmer } from 'use-immer';
import ChatMessages from '@/components/ChatMessages';
import ChatInput from '@/components/ChatInput';

function Chatbot() {
  const [messages, setMessages] = useImmer([]); // Stores chat messages
  const [newMessage, setNewMessage] = useState(''); // Stores the current input message
  const [status, setStatus] = useState(''); // Which phase the bot is in (Searching database, preprocessing, etc)

  const isLoading = messages.length && messages[messages.length - 1].loading;

  async function submitNewMessage() {
    const trimmedMessage = newMessage.trim();
    if (!trimmedMessage || isLoading) return;

    setMessages(draft => {
      draft.push({ role: 'user', content: trimmedMessage });
    });

    setStatus("🤖 Thinking...");
    setNewMessage('');

    try {
      // Step 1: Process the full message to extract questions
      const res = await fetch('http://localhost:8000/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmedMessage }),
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();
      const parsedQuestions = data.questions || [];

      if (parsedQuestions.length === 0) {
        setStatus("No HR-related questions found.");
        setMessages(draft => {
          draft.push({ role: 'assistant', content: data.fallback || "I'm here to help with HR-related concerns like leave, policies, or claims!" });
        });
        return;
      }

      setStatus(`🔎 Extracted ${parsedQuestions.length} question(s).`);

      const assistantIndexes = [];

      // Step 2: Add original message and extracted questions
      setMessages(draft => {
        parsedQuestions.forEach(() => {
          const index = draft.length;
          draft.push({ role: 'assistant', content: '', loading: true });
          assistantIndexes.push(index);
        });
      });
      
      // Step 3: Stream answer for each question
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
      const res = await fetch('http://localhost:8000/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: questionText }),
      });

      if (!res.ok) throw new Error(`Stream error: ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      setStatus("🔁 Starting stream for: " + questionText);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        setStatus(chunk);

        setMessages(draft => {
          if (!draft[assistantIndex]) {
            console.warn("❌ Invalid assistant index:", assistantIndex);
            return;
          }

          // Force re-render by replacing the entire object
          draft[assistantIndex] = {
            ...draft[assistantIndex],
            content: draft[assistantIndex].content + chunk,
          };
        });
      }

      setMessages(draft => {
        if (!draft[assistantIndex]) return;
        draft[assistantIndex].loading = false;
      });

      setStatus("✅ Done.");
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
    <div className='relative grow flex flex-col gap-6 pt-6'>
      <ChatMessages
        messages={messages}
        isLoading={isLoading}
      />
      <ChatInput
        newMessage={newMessage}
        isLoading={isLoading}
        setNewMessage={setNewMessage}
        submitNewMessage={submitNewMessage}
      />
      <div className="text-sm text-gray-500 px-4">{status}</div>
    </div>
  );
}

export default Chatbot;