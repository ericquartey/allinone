import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Settings Navigation Tests
 * Uses existing dev server on port 3001
 */
export default defineConfig({
  testDir: './tests',
  testMatch: '**/settings-navigation-test.spec.js',

  timeout: 60 * 1000,

  fullyParallel: false,
  retries: 0,
  workers: 1,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'test-results/settings-html' }]
  ],

  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on',
    screenshot: 'on',
    video: 'on',
    actionTimeout: 15 * 1000,
    navigationTimeout: 30 * 1000,
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
    },
  ],

  // No webServer - use existing server on port 3001
});
