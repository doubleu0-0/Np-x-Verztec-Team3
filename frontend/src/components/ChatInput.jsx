import { useState } from 'react';
import axios from 'axios';
import useAutosize from '@/hooks/useAutosize';
import sendIcon from '@/assets/images/send.svg';

function ChatInput({ newMessage, isLoading, setNewMessage, submitNewMessage }) {
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
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        console.log("Blob size:", audioBlob.size); // Debug log

        if (audioBlob.size === 0) {
          console.error('Empty audio blob. Try recording again.');
          return;
        }

        const formData = new FormData();
        formData.append('file', audioBlob, 'recording.webm');

        try {
          const res = await axios.post('http://localhost:8000/transcribe', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
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
    <div className='sticky bottom-0 shrink-0 bg-transparent dark:bg-transparent py-4'>
      <div className='p-1.5 bg-primary-blue/35 dark:bg-gray-700 rounded-3xl'>

        {/* Microphone Controls */}
        <div className='mb-2 flex gap-2'>
          {!isRecording ? (
            <button
              onClick={startRecording}
              className='bg-green-500 text-white px-3 py-1 rounded'
            >
              🎙 Start Recording
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className='bg-red-500 text-white px-3 py-1 rounded'
            >
              ⏹ Stop
            </button>
          )}
        </div>

        {/* Text Input */}
        <div className='pr-0.5 bg-white dark:bg-gray-900 relative shrink-0 rounded-3xl ring-primary-blue ring-1 focus-within:ring-2'>
          <textarea
            className='block w-full max-h-[140px] py-2 px-4 pr-11 bg-white dark:bg-gray-900 text-black dark:text-white placeholder:text-primary-blue focus:outline-none rounded-3xl resize-none'
            ref={textareaRef}
            rows='1'
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            className='absolute top-1/2 -translate-y-1/2 right-3 p-1 rounded-md hover:bg-primary-blue/20'
            onClick={submitNewMessage}
          >
            <img src={sendIcon} alt='send' />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatInput;
