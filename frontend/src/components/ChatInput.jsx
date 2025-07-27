import { useState } from 'react';
import axios from 'axios';
import useAutosize from '@/hooks/useAutosize';
import sendIcon from '@/assets/images/send.svg';
const remoteip = import.meta.env.VITE_REMOTE_IP

function ChatInput({ newMessage, isLoading, setNewMessage, submitNewMessage, isStreaming, onStop, isDarkMode }) {
  const textareaRef = useAutosize(newMessage);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  function handleKeyDown(e) {
    if (e.keyCode === 13 && !e.shiftKey && !isLoading) {
      e.preventDefault();
      submitNewMessage();
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        if (audioBlob.size === 0) {
          console.error('Empty audio blob. Try recording again.');
          return;
        }

        const formData = new FormData();
        formData.append('file', audioBlob, 'recording.webm');

        try {
          const res = await axios.post(`http://${remoteip}:8000/transcribe`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          setNewMessage(res.data.text || '');
        } catch (err) {
          console.error('Transcription error:', err);
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="sticky bottom-0 shrink-0 bg-transparent dark:bg-transparent py-4">
      <div className="p-1.5 bg-primary-blue/35 dark:bg-gray-700 rounded-3xl">
        <div className="pr-0.5 bg-white dark:bg-gray-900 relative shrink-0 rounded-3xl ring-primary-blue ring-1 focus-within:ring-2">
          <textarea
            className="block w-full max-h-[140px] py-2 px-4 pr-[90px] bg-white dark:bg-gray-900 text-black dark:text-white placeholder:text-primary-blue focus:outline-none rounded-3xl resize-none"
            ref={textareaRef}
            rows="1"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
          />

          {/* Mic button */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`absolute top-1/2 -translate-y-1/2 right-14 w-8 h-8 flex items-center justify-center rounded-full hover:bg-primary-blue/20 transition-colors ${
              isRecording ? 'text-red-500' : 'text-primary-blue dark:text-white'
            }`}
            title={isRecording ? 'Stop recording' : 'Start recording'}
            type="button"
          >
            {isRecording ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 pointer-events-none">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" className="w-5 h-5 pointer-events-none">
                <path d="m439.5,236c0-11.3-9.1-20.4-20.4-20.4s-20.4,9.1-20.4,20.4c0,70-64,126.9-142.7,126.9-78.7,0-142.7-56.9-142.7-126.9 0-11.3-9.1-20.4-20.4-20.4s-20.4,9.1-20.4,20.4c0,86.2 71.5,157.4 163.1,166.7v57.5h-23.6c-11.3,0-20.4,9.1-20.4,20.4 0,11.3 9.1,20.4 20.4,20.4h88c11.3,0 20.4-9.1 20.4-20.4 0-11.3-9.1-20.4-20.4-20.4h-23.6v-57.5c91.6-9.3 163.1-80.5 163.1-166.7z" />
                <path d="m256,323.5c51,0 92.3-41.3 92.3-92.3v-127.9c0-51-41.3-92.3-92.3-92.3s-92.3,41.3-92.3,92.3v127.9c0,51 41.3,92.3 92.3,92.3zm-52.3-220.2c0-28.8 23.5-52.3 52.3-52.3s52.3,23.5 52.3,52.3v127.9c0,28.8-23.5,52.3-52.3,52.3s-52.3-23.5-52.3-52.3v-127.9z" />
              </svg>
            )}
          </button>

          {/* Send or Stop Button (replaces send when streaming) */}
          <button
            className={`absolute top-1/2 -translate-y-1/2 right-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-primary-blue/20 transition-colors ${
              isStreaming
                ? (isDarkMode ? 'text-white' : 'text-primary-blue')
                : 'text-primary-blue dark:text-white'
            }`}
            onClick={isStreaming ? onStop : submitNewMessage}
            disabled={isStreaming ? false : isLoading}
            title={isStreaming ? 'Stop streaming' : 'Send message'}
            type="button"
          >
            {isStreaming ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5 pointer-events-none"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              </svg>
            ) : (
              <img src={sendIcon} alt="send" className="w-5 h-5 pointer-events-none" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatInput;