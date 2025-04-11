import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.ts',
  use: {
    headless: true,
    viewport: { width: 1280, height: 1720 },
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'bun run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 120 seconds
  },
  retries: 1,
  reporter: [['html'], ['list']],
}); 
