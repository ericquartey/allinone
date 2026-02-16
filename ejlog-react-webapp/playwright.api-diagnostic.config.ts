import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for API Diagnostic Tests
 * NON avvia automaticamente il dev server - assume che sia già running
 */
export default defineConfig({
  testDir: './tests',
  testMatch: 'test-api-integration.spec.ts',

  timeout: 60 * 1000,

  fullyParallel: false, // Esegui test sequenzialmente per logging chiaro
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report' }],
  ],

  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10 * 1000,
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

  // NON avviare webServer - assume che sia già running
  // webServer: undefined,
});
