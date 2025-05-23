import { useState } from "react";
import { motion } from "framer-motion";
import {
  FiMenu,
  FiSearch,
  FiMessageCircle,
  FiMoreHorizontal
} from "react-icons/fi";

const Sidebar = ({ onNewChat, onSearch }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);

  const chatsToday = [
    "Project Sign-off Process", 
    "Importing Supplier E-Invoices", 
    "Laptop Return Policy", 
    "Lorem Ipsum"];
  const chatsYesterday = [
    "Pantry Rules", 
    "Digital Meeting Etiquette", 
    "Webmail Auto-Reply Setup", 
    "Professional Meeting Etiquette", 
    "Ownership Policy", 
    "Lorem Ipsum", 
    "Lorem Ipsum", 
    "Lorem Ipsum"];

  const ChatEntry = ({ title, index }) => (
    <div className="relative group flex items-center justify-between hover:bg-gray-800 dark:hover:bg-gray-700 p-2 rounded cursor-pointer">
      <div className="relative flex-1 overflow-hidden">
        <div
          className="pr-2 whitespace-nowrap max-w-full"
          style={{
            maskImage: "linear-gradient(to right, black 90%, transparent)",
            WebkitMaskImage: "linear-gradient(to right, black 90%, transparent)"
          }}
        >
          {title}
        </div>
      </div>

      <div className="relative">
        <button
          className="p-1 rounded-full hover:bg-gray-600"
          onClick={(e) => {
            e.stopPropagation();
            setActiveDropdown(activeDropdown === index ? null : index);
          }}
        >
          <FiMoreHorizontal size={20} />
        </button>
        {activeDropdown === index && (
          <div className="absolute right-0 mt-1 w-28 bg-white dark:bg-gray-800 rounded-lg shadow z-10">
            <button className="w-full text-left px-4 py-2 text-gray-900 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm rounded-t-md">
              Rename
            </button>
            <button className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 text-sm rounded-b-md">
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <motion.div
      animate={{
        width: collapsed ? 64 : 260,
        transition: { duration: 0.2 }
      }}
      className="h-screen bg-gray-900 dark:bg-gray-950 text-white p-4 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => setCollapsed(!collapsed)} className="text-2xl">
          <FiMenu />
        </button>
        {/* Theme toggle removed from here as requested */}
      </div>

      {/* New Chat / Search */}
      <motion.div
        animate={{ opacity: collapsed ? 0 : 1, scale: collapsed ? 0.8 : 1 }}
        transition={{ duration: 0.2 }}
        className={`${collapsed ? "pointer-events-none h-0" : "mb-4 space-y-2"}`}
      >
        <button
          onClick={onNewChat}
          className="flex items-center space-x-2 hover:bg-gray-800 dark:hover:bg-gray-700 p-2 rounded w-full"
        >
          <FiMessageCircle />
          <span>New Chat</span>
        </button>

        <button
          onClick={onSearch}
          className="flex items-center space-x-2 hover:bg-gray-800 dark:hover:bg-gray-700 p-2 rounded w-full"
        >
          <FiSearch />
          <span>Search</span>
        </button>
      </motion.div>

      {/* Collapsed New Chat Icon */}
      {collapsed && (
        <div className="flex flex-col items-center space-y-4">
          <button
            onClick={onNewChat}
            className="p-2 rounded-full hover:bg-gray-700"
            title="New Chat"
          >
            <FiMessageCircle size={20} />
          </button>
        </div>
      )}

      {/* Chat List */}
      <div className="mt-4 flex-1 overflow-y-auto pr-1 custom-scrollbar">
        {!collapsed && (
          <>
            <p className="text-sm text-gray-400 mb-2">Today</p>
            <div className="space-y-2 mb-4">
              {chatsToday.map((title, index) => (
                <ChatEntry key={index} title={title} index={`today-${index}`} />
              ))}
            </div>

            <p className="text-sm text-gray-400 mb-2">Yesterday</p>
            <div className="space-y-2">
              {chatsYesterday.map((title, index) => (
                <ChatEntry key={index} title={title} index={`yest-${index}`} />
              ))}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default Sidebar;
