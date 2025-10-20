import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy only for development
    proxy: process.env.NODE_ENV !== 'production' ? {
      // Only proxy OAuth endpoints to backend, not /auth/success
      '^/auth/(google|hubspot|status|logout)': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    } : undefined,
  },
});
