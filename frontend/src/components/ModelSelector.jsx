import { useState, useEffect } from 'react';

function ModelSelector({ selectedModel, setSelectedModel }) {
  const models = [
    { name: "llama3.2:latest", label: "Llama 3 Large" },
    { name: "llama3.2:1b", label: "Llama 3 Mini" }
  ];

  return (
    <div>
      <span className="text-sm text-gray-500 font-medium mr-2">Model:</span>
      <select
        value={selectedModel}
        onChange={e => setSelectedModel(e.target.value)}
        className="border rounded px-2 py-1 text-sm"
      >
        {models.map(m => (
          <option key={m.name} value={m.name}>{m.label}</option>
        ))}
      </select>
    </div>
  );
}

export default ModelSelector;