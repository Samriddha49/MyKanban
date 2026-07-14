import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Optional: proxy REST calls to the Spring Boot backend during development.
      // Uncomment if/when you run the backend from lb-simulator/backend.
      // '/api': 'http://localhost:8080',
    },
  },
});
