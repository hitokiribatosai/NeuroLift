import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(() => {
  return {
    server: {
      port: 3000,
      host: '127.0.0.1',
      proxy: { '/api': 'http://127.0.0.1:8000' },
    },
    build: {
      target: 'es2022',
      rollupOptions: { output: { manualChunks: { react: ['react', 'react-dom'], motion: ['framer-motion'] } } },
    },
    plugins: [
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
