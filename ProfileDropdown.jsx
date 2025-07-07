import { useState, useRef, useEffect } from 'react';
import { LogOut, User } from 'lucide-react';

const avatars = [
  '/avatars/avatar1.png',
  '/avatars/avatar2.png',
  '/avatars/avatar3.png',
  '/avatars/avatar4.png',
  '/avatars/avatar5.png',
  '/avatars/avatar6.png',
];

export default function ProfileDropdown({
  selectedProfile,
  setSelectedProfile,
  theme,
  toggleTheme,
  onLogout
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setOpen(!open)} className="focus:outline-none">
        <img
          src={selectedProfile || '/avatars/avatar1.png'}
          alt="Profile"
          className="w-10 h-10 rounded-full border-2 border-gray-300 hover:border-blue-500 transition"
        />
      </button>

      {open && (
        <div className="absolute right-0 bottom-full mb-2 w-64 rounded-xl shadow-lg bg-white dark:bg-gray-800 p-4 z-[60] border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-3 gap-2 mb-4">
            {avatars.map((avatar, index) => (
              <img
                key={index}
                src={avatar}
                alt={`Avatar ${index + 1}`}
                className={`w-14 h-14 rounded-full border-2 p-1 cursor-pointer transition ${
                  selectedProfile === avatar
                    ? 'border-blue-500 ring-2 ring-blue-400'
                    : 'border-transparent hover:border-blue-300'
                }`}
                onClick={() => {
                  setSelectedProfile(avatar);
                  setOpen(false);
                }}
              />
            ))}
          </div>

          <div className="flex justify-between gap-2 mb-4">
            <button
              onClick={() => {
                if (theme !== 'light') toggleTheme();
              }}
              className="flex-1 bg-gray-200 text-black dark:bg-gray-100 dark:text-black py-2 rounded-md hover:bg-white"
            >
              Light
            </button>
            <button
              onClick={() => {
                if (theme !== 'dark') toggleTheme();
              }}
              className="flex-1 bg-gray-900 text-white py-2 rounded-md hover:bg-gray-700"
            >
              Dark
            </button>
          </div>

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-600 text-white py-2 rounded-md hover:bg-red-500 transition"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
