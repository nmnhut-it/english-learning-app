import { defineConfig, devices } from '@playwright/test';

// Check if running in observation/headed mode
const isObservation = process.env.OBSERVE === 'true';

export default defineConfig({
  testDir: './specs',
  fullyParallel: !isObservation, // Serial for observation mode
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : isObservation ? 1 : undefined,
  reporter: isObservation ? 'list' : 'html',
  timeout: 120000, // 2 min timeout for vocab-heavy tests

  use: {
    baseURL: 'http://localhost:3003',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: isObservation ? 'on' : 'off',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'observation',
      use: {
        ...devices['Desktop Chrome'],
        headless: false,
        launchOptions: {
          slowMo: 100, // Slow down actions by 100ms for observation
        },
      },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3003',
    reuseExistingServer: !process.env.CI,
    cwd: '../..',
  },
});
