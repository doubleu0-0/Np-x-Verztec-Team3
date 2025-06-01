// FloatingWindow.jsx
import { useState } from "react";

function FloatingWindow() {
  const [size, setSize] = useState(220); // default 220px

  // Clamp size between 60 and 220 pixels (bigger range)
  const clampSize = (val) => Math.max(60, Math.min(220, val));

  // One-shot size up/down handlers
  const handleSizeDown = () => setSize(clampSize(60));
  const handleSizeUp = () => setSize(clampSize(180));

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-center">
      <div
        className="rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center transition-all duration-200"
        style={{ width: size, height: size }}
      >
        <img
          src="/human_avatar/woman2.png"
          alt="Avatar"
          className="rounded-full object-cover"
          style={{ width: size - 12, height: size - 12, transition: "all 0.2s" }}
        />
      </div>
      <div className="flex items-center space-x-3 mt-2">
        <button
          className="w-7 h-7 rounded-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold flex items-center justify-center text-lg"
          onClick={handleSizeDown}
        >
          −
        </button>
        <button
          className="w-7 h-7 rounded-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold flex items-center justify-center text-lg"
          onClick={handleSizeUp}
        >
          +
        </button>
      </div>
    </div>
  );
}

export default FloatingWindow;