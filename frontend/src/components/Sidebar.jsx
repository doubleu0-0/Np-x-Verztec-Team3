
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';
import { HiOutlineTrash } from 'react-icons/hi2';
import { LuPencil } from 'react-icons/lu';

function Sidebar({
  chats = [],
  selectedChatId,
  onSelectChat,
  onRenameChat,
  onDeleteChat,
  onNewChat,
  onSearch
}) {

  const [menuOpenId, setMenuOpenId] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const renameInputRef = useRef(null);

  const menuBtnRefs = useRef({});
  const [dropdownCoords, setDropdownCoords] = useState({});
  // Update dropdown position when menu opens
  useLayoutEffect(() => {
    if (menuOpenId && menuBtnRefs.current[menuOpenId]) {
      const btn = menuBtnRefs.current[menuOpenId];
      const rect = btn.getBoundingClientRect();
      setDropdownCoords(coords => ({
        ...coords,
        [menuOpenId]: {
          top: rect.top + rect.height + 4,
          left: rect.left - 16, 
        }
      }));
    }
  }, [menuOpenId]);

  // Focus input when renaming
  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
    }
  }, [renamingId]);

  // Handle click outside for rename and menu
  useEffect(() => {
    function handleClick(e) {
      if (renamingId && renameInputRef.current && !renameInputRef.current.contains(e.target)) {
        handleRenameSubmit();
      }
      if (menuOpenId && !e.target.closest('.sidebar-chat-menu')) {
        setMenuOpenId(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [renamingId, menuOpenId]);

  const handleRenameStart = (chat) => {
    setRenamingId(chat.conversation_id);
    setRenameValue(chat.title);
    setMenuOpenId(null);
  };

  const handleRenameChange = (e) => setRenameValue(e.target.value);

  const handleRenameSubmit = () => {
    if (renamingId && renameValue.trim()) {
      onRenameChat(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  };

  const handleRenameKey = (e) => {
    if (e.key === 'Enter') handleRenameSubmit();
    if (e.key === 'Escape') setRenamingId(null);
  };

  const handleDelete = (chat) => {
    setDeleteConfirmId(chat.conversation_id);
    setMenuOpenId(null);
  };

  const confirmDelete = () => {
    onDeleteChat(deleteConfirmId);
    setDeleteConfirmId(null);
  };

  const cancelDelete = () => setDeleteConfirmId(null);
  return (
    <>
      <aside className="sidebar bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-full">
        <div className="flex-1 overflow-y-auto min-h-0">
          {chats.map(chat => (
            <div
              key={chat.conversation_id}
              className={`group flex items-center py-2 cursor-pointer relative transition-all
                mx-2 px-3 rounded-lg
                ${selectedChatId === chat.conversation_id
                  ? 'bg-gray-200 dark:bg-gray-700 shadow-sm'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'}
              `}
              onClick={() => onSelectChat(chat.conversation_id)}
            >
              {renamingId === chat.conversation_id ? (
                <input
                  ref={renameInputRef}
                  className="flex-1 bg-transparent border-b border-primary-blue outline-none text-gray-900 dark:text-white pr-8"
                  value={renameValue}
                  onChange={handleRenameChange}
                  onKeyDown={handleRenameKey}
                  onBlur={handleRenameSubmit}
                  maxLength={40}
                  style={{ minWidth: 0 }}
                />
              ) : (
                <span
                  className="flex-1 pr-2 sidebar-chat-title"
                  style={{
                    display: 'inline-block',
                    maxWidth: 'calc(100% - 2.2rem)', 
                    verticalAlign: 'middle',
                    position: 'relative',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    // Subtle fade to the right, no ellipsis
                    maskImage: 'linear-gradient(to right, black 80%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to right, black 80%, transparent 100%)',
                    transition: 'mask-image 0.2s, -webkit-mask-image 0.2s',
                  }}
                >
                  {chat.title}
                </span>
              )}
              {/* Menu icon, only show on hover */}
              <button
                className={`sidebar-chat-menu absolute right-2 transition-opacity text-xl
                  rounded-full w-8 h-8 flex items-center justify-center
                  ${selectedChatId === chat.conversation_id ? 'bg-gray-100 dark:bg-gray-800' : ''}
                  hover:bg-gray-200 focus:bg-gray-200
                  ${menuOpenId === chat.conversation_id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                `}
                style={{
                  pointerEvents: 'auto',
                  backgroundColor: 'transparent',
                  boxShadow: 'none',
                  outline: 'none',
                  border: 'none',
                  ...(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? {
                    backgroundColor: 'transparent',
                  } : {})
                }}
                tabIndex={-1}
                ref={el => { menuBtnRefs.current[chat.conversation_id] = el; }}
                data-menu-btn-id={chat.conversation_id}
                onClick={e => {
                  e.stopPropagation();
                  setMenuOpenId(menuOpenId === chat.conversation_id ? null : chat.conversation_id);
                }}
                onMouseDown={e => e.preventDefault()}
              >
                <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>⋯</span>
              </button>
              {/* Dropdown menu rendered in portal to overlay main page */}
              {menuOpenId === chat.conversation_id && (() => {
                const coords = dropdownCoords[chat.conversation_id];
                const style = coords
                  ? { position: 'fixed', top: coords.top, left: coords.left, zIndex: 1000, minWidth: '8rem' }
                  : { position: 'absolute', top: 0, left: 0, zIndex: 1000, minWidth: '8rem' };
                return ReactDOM.createPortal(
                  <div
                    className="sidebar-chat-menu bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md py-2 w-40 min-w-[10rem]"
                    style={{ ...style, minHeight: '90px', maxWidth: '260px' }}
                  >
                    <button
                      className="flex items-center gap-2 w-[90%] mx-auto text-left px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white text-base font-normal transition-colors"
                      style={{ display: 'flex', marginTop: '4px', marginBottom: '4px' }}
                      onClick={e => { e.stopPropagation(); handleRenameStart(chat); }}
                    >
                      <LuPencil size={22} strokeWidth={1.5} style={{ flexShrink: 0, verticalAlign: 'middle', borderRadius: '6px' }} />
                      Rename
                    </button>
                    <button
                      className="flex items-center gap-2 w-[90%] mx-auto text-left px-4 py-2 rounded-lg hover:bg-red-100/70 dark:hover:bg-red-700/20 text-red-600 dark:text-red-300 text-base font-normal transition-colors"
                      style={{ display: 'flex', marginTop: '4px', marginBottom: '4px', fontSize: '1rem', fontWeight: 400 }}
                      onClick={e => { e.stopPropagation(); handleDelete(chat); }}
                    >
                      <HiOutlineTrash size={22} className="text-red-600 dark:text-red-300" style={{ flexShrink: 0 }} />
                      <span className="text-red-600 dark:text-red-300">Delete</span>
                    </button>
                  </div>,
                  document.body
                );
              })()}
            </div>
          ))}
        </div>
      </aside>
      {/* Delete confirmation modal */}
      {deleteConfirmId && typeof window !== 'undefined' && ReactDOM.createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Shaded background */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={cancelDelete}
            aria-label="Close delete confirmation"
          />
          {/* Centered modal */}
          <div className="relative z-10 bg-white dark:bg-gray-900 border border-black/10 dark:border-gray-700 rounded-lg shadow-2xl p-8 w-[480px] max-w-full mx-4 animate-fadeIn">
            <div className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Delete Chat</div>
            <div className="mb-4 text-gray-900 dark:text-white">
              Are you sure you want to delete{' '}
              <span className="font-bold">{chats.find(c => c.conversation_id === deleteConfirmId)?.title || ''}</span>?
              <br />
              <span className="block text-sm text-red-600 dark:text-red-300 mt-2">This action cannot be undone.</span>
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                onClick={cancelDelete}
              >
                Cancel
              </button>
              <button
                className="px-4 py-1 rounded bg-red-600 text-white hover:bg-red-700 transition-colors"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}


export default Sidebar;
