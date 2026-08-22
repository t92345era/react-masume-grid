/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';

export default defineConfig(({ mode }) => {
  // `vite build --mode demo` builds the demo app for GitHub Pages
  if (mode === 'demo') {
    return {
      plugins: [react()],
      base: '/react-masume-grid/',
      build: {
        outDir: 'demo-dist',
      },
    };
  }

  return {
    plugins: [
      react(),
      dts({ include: ['src'], exclude: ['**/*.test.*'] }),
    ],
    // public/ はデモサイト用の資材（OGP 画像）なので、配布物には入れない
    publicDir: false,
    build: {
      lib: {
        entry: 'src/index.ts',
        name: 'MasumeGrid',
        formats: ['es', 'cjs'],
        fileName: 'masume-grid',
        cssFileName: 'masume-grid',
      },
      rollupOptions: {
        external: ['react', 'react-dom', 'react/jsx-runtime'],
      },
    },
    test: {
      environment: 'jsdom',
      globals: true, // enables @testing-library/react auto-cleanup
    },
  };
});
