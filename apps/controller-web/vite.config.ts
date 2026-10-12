import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  base: '/controller/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'next/link': fileURLToPath(new URL('./src/lib/next-compat.tsx', import.meta.url)),
      'next/navigation': fileURLToPath(new URL('./src/lib/next-compat.tsx', import.meta.url)),
    },
  },
  server: {
    port: 5201,
    strictPort: true,
    host: true,
  },
});
