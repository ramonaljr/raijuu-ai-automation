import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';

// Load .env.local then .env (dotenv does not override existing vars)
loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    exclude: ['**/node_modules/**', '**/dist/**', 'tests/e2e/**'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
});
