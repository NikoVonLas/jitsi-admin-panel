import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    outDir: 'build',
    emptyOutDir: true,
    // Routes are loaded on demand. The shared Ant Design runtime is intentionally
    // kept together so Rollup can preserve its initialization order.
    chunkSizeWarningLimit: 950,
  },
  server: {
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
    },
  },
});
