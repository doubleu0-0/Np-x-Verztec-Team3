import { useState, useEffect } from 'react';

function ModelSelector({ selectedModel, setSelectedModel }) {
  const models = [
    { name: "llama3.2:latest", label: "Llama 3 Large" },
    { name: "llama3.2:1b", label: "Llama 3 Mini" }
  ];

  return (
    <div>
      <span className="text-sm font-medium mr-2 text-gray-900 dark:text-white transition-all duration-300">Model:</span>
      <select
        value={selectedModel}
        onChange={e => setSelectedModel(e.target.value)}
        className="border rounded px-2 py-1 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 transition-all duration-300"
      >
        {models.map(m => (
          <option
            key={m.name}
            value={m.name}
            className="text-gray-900 dark:text-white bg-white dark:bg-gray-800"
          >
            {m.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default ModelSelector;