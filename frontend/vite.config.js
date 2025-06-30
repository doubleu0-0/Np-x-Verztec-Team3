import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  server: {
    host: '0.0.0.0',   // Accept connections from any IP (LAN)
    port: 5173,         // Set preferred port
    strictPort: true    // Do not fallback to random port
  },
  preview: {
    port: 5173,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [react()],
});
