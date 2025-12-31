import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Vocabulary Game E2E tests.
 * Tests game initialization, scene navigation, and core functionality.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 30000,

  use: {
    baseURL: 'http://localhost:3007',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'node server.js',
    url: 'http://localhost:3007',
    reuseExistingServer: true,
    timeout: 15000,
    ignoreHTTPSErrors: true,
  },
});
