import useAutosize from '@/hooks/useAutosize';
import sendIcon from '@/assets/images/send.svg';

function ChatInput({ newMessage, isLoading, setNewMessage, submitNewMessage }) {
  const textareaRef = useAutosize(newMessage);

  function handleKeyDown(e) {
    if(e.keyCode === 13 && !e.shiftKey && !isLoading) {
      e.preventDefault();
      submitNewMessage();
    }
  }
  
  return(
    <div className='sticky bottom-0 shrink-0 bg-transparent dark:bg-transparent py-4'>
      <div className='p-1.5 bg-primary-blue/35 dark:bg-gray-700 rounded-3xl'>
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