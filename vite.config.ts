/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    react(),
    dts({ include: ['src'], exclude: ['**/*.test.*'] }),
  ],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'MeasureGrid',
      formats: ['es', 'cjs'],
      fileName: 'measure-grid',
      cssFileName: 'measure-grid',
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
    },
  },
  test: {
    environment: 'jsdom',
    globals: true, // enables @testing-library/react auto-cleanup
  },
});
