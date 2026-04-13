import { defineConfig } from '@playwright/test';
import { config as loadEnv } from 'dotenv';

// Load .env.local so DB-touching specs (e.g. intake-flow.spec.ts) can reach
// DATABASE_URL via fixtures. The Next.js dev server (booted by `webServer`
// below) loads its own copy of .env.local independently.
loadEnv({ path: '.env.local' });

export default defineConfig({
  testDir: './tests/e2e',
  use: { baseURL: 'http://localhost:3000' },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
