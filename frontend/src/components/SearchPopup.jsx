const SearchPopup = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Search Chats</h2>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">✕</button>
        </div>
        <input
          type="text"
          placeholder="Search your chats..."
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Recent</p>
          <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600">
            <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-gray-900 dark:text-white">Chat A</div>
            <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-gray-900 dark:text-white">Chat B</div>
            {/* Replace with recent chats list */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPopup;
