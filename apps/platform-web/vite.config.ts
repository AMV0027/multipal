import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'next/link': fileURLToPath(new URL('./src/lib/next-compat.tsx', import.meta.url)),
      'next/navigation': fileURLToPath(new URL('./src/lib/next-compat.tsx', import.meta.url)),
    },
  },
  server: {
    port: 5200,
    strictPort: true,
    host: true,
  },
});
