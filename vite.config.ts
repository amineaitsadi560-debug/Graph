import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// VITE_DEMO=1 builds a self-contained in-memory preview (no Supabase): fonts come from Google Fonts in the host page.
const demo = process.env.VITE_DEMO === '1';
export default defineConfig({
  plugins: [react()],
  resolve: demo ? { alias: { './fonts.css': resolve(__dirname, 'src/empty.css') } } : {},
  build: { target: 'es2021', ...(demo ? { cssCodeSplit: false, rollupOptions: { output: { inlineDynamicImports: true } } } : {}) },
});
