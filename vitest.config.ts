import { defineConfig } from 'vitest/config';
import path from 'node:path';
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@lib': path.resolve(import.meta.dirname, 'src/lib'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
  },
});
