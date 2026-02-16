import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Configuration for Manual Testing
 *
 * This config assumes servers are already running:
 * - Frontend: http://localhost:3003
 * - Backend: http://localhost:3077/EjLogHostVertimag
 */
export default defineConfig({
  testDir: './tests/e2e',

  // Maximum time one test can run
  timeout: 30 * 1000,

  // Test execution settings
  fullyParallel: false, // Run sequentially for stability
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1, // Retry once on failure
  workers: 1, // Single worker for E2E tests

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/e2e-results.json' }],
    ['list'],
    ['junit', { outputFile: 'test-results/e2e-junit.xml' }]
  ],

  // Shared settings for all projects
  use: {
    // Base URL - frontend running on 3002
    baseURL: 'http://localhost:3002',

    // Collect trace on failure
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Timeout for each action (increased for network requests)
    actionTimeout: 15 * 1000,

    // Navigation timeout
    navigationTimeout: 30 * 1000,

    // Ignore HTTPS errors for local testing
    ignoreHTTPSErrors: true,
  },

  // Test only with Chromium for E2E
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        // Slow down for visual inspection if needed
        launchOptions: {
          slowMo: 0,
        }
      },
    },
  ],

  // NO webServer - servers must be running manually
});

