import { defineConfig } from 'vitest/config';
import path from 'node:path';
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    tags: [
      {
        name: 'heavy',
        description: 'Тяжелые тесты ',
        timeout: 60_000,
      },
      {
        name: 'calendar',
        description: 'Тесты календаря ',
      },
      {
        name: 'parser',
        description: 'Тесты парсера ',
      },
    ],
  },
});
