// src/api.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function sendChatMessage(prompt) {
  const response = await fetch(`${API_URL}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  const data = await response.json();
  return data.response;
}

export default {
  sendChatMessage,
};