import React from 'react';

const models = [
  {
    name: "llama3.3",
    label: "Lunar ai 4",
    description: "Powerful, large model for complex challenges",
    beta: true,
  },
  {
    name: "llama3.2:latest",
    label: "Lunar ai 3",
    description: "Smart, efficient model for everyday use",
    beta: false,
  },
  {
    name: "llama3.2:1b",
    label: "Lunar ai 3 mini",
    description: "Fastest model for daily tasks",
    beta: false,
  },
];

function ModelSelector({ selectedModel, setSelectedModel }) {
  return (
    <div className="flex flex-col p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <span className="text-sm font-medium mb-1 text-gray-400 dark:text-gray-400 transition-all duration-300">Models</span>
      {models.map((m) => (
        <button
          key={m.name}
          onClick={() => setSelectedModel(m.name)}
          className={`flex items-start w-full px-4 py-2 text-left transition-all duration-200 cursor-pointer bg-transparent shadow-none
            hover:bg-gray-100 dark:hover:bg-gray-700 hover:rounded-lg
          `}
          style={{ minWidth: 0 }}
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 dark:text-white">{m.label}</span>
              {m.beta && (
                <span className="ml-2 px-2 py-0.5 text-xs font-bold rounded bg-yellow-400 text-yellow-900"
                  style={{ fontSize: '0.7rem', position: 'relative', top: '-2px' }}>
                  Beta
                </span>
              )}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">{m.description}</div>
          </div>
          <div className="ml-4 mt-1">
            <input
              type="radio"
              checked={selectedModel === m.name}
              onChange={() => setSelectedModel(m.name)}
              className="accent-blue-500"
              name="model"
              aria-label={m.label}
            />
          </div>
        </button>
      ))}
    </div>
  );
}

export default ModelSelector;