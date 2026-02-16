import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for API Testing Only
 * No web server startup required - backend should already be running on port 3077
 */
export default defineConfig({
  testDir: './tests/api',

  // Maximum time one test can run
  timeout: 30 * 1000,

  // Test execution settings
  fullyParallel: false, // Run API tests sequentially to avoid conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker for API tests

  // Reporter configuration
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report-api', open: 'never' }],
    ['json', { outputFile: 'test-results/api-results.json' }],
  ],

  // Shared settings for all projects
  use: {
    // API base URL
    baseURL: 'http://localhost:3077',

    // Collect trace on failure
    trace: 'on-first-retry',

    // Extra HTTP headers for all API requests
    extraHTTPHeaders: {
      'Accept': 'application/json',
    },

    // Timeout for each action
    actionTimeout: 10 * 1000,
  },

  // Single project for API testing
  projects: [
    {
      name: 'api-tests',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],

  // NO web server - backend should already be running
  // webServer: undefined,
});

