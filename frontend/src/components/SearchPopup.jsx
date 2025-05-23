// src/components/SearchPopup.jsx
const SearchPopup = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Search Chats</h2>
          <button onClick={onClose} className="text-gray-500">✕</button>
        </div>
        <input
          type="text"
          placeholder="Search your chats..."
          className="w-full p-2 border border-gray-300 rounded mb-4"
        />
        <div>
          <p className="text-sm text-gray-500 mb-2">Recent</p>
          <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400">
            <div className="bg-gray-100 p-2 rounded">Chat A</div>
            <div className="bg-gray-100 p-2 rounded">Chat B</div>
            {/* Replace with recent chats list */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPopup;
