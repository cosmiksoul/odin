import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// base '/odin/' only for the production build (GitHub Pages serves the
// project site under /<repo>/); dev server stays at root.
export default defineConfig(({ command }) => ({
  root: 'src',
  base: command === 'build' ? '/odin/' : '/',
  plugins: [react()],
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },
}));
