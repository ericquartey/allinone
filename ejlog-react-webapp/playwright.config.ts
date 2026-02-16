import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for EjLog WMS E2E Testing
 *
 * Configuration optimized for:
 * - Frontend + Backend Proxy: http://localhost:3004 (Vite dev server with integrated proxy)
 * - Backend API proxied through Vite to port 3077
 * - Dev mode authentication bypass enabled
 * - No separate backend server needed - Vite handles proxy automatically
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Test directory
  testDir: './tests/e2e',

  // Maximum time one test can run (60s - increased from 30s)
  timeout: 60 * 1000,

  // Global timeout for entire test run (30 minutes - increased from 10)
  globalTimeout: 30 * 60 * 1000,

  // Expect timeout for assertions (10s - increased from 5s)
  expect: {
    timeout: 10 * 1000,
  },

  // Test execution settings
  fullyParallel: true, // Enable parallel execution for speed
  forbidOnly: !!process.env.CI, // Fail if test.only in CI
  retries: process.env.CI ? 2 : 1, // Retry failed tests
  workers: process.env.CI ? 1 : 4, // 4 workers in local (increased from 2)

  // Reporter configuration
  reporter: [
    ['html', {
      outputFolder: 'playwright-report',
      open: process.env.CI ? 'never' : 'on-failure'
    }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list'],
    // GitHub Actions reporter if in CI
    process.env.CI ? ['github'] : ['list'],
  ].filter(Boolean),

  // Shared settings for all projects
  use: {
    // Base URL - frontend running on port 3000
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    // Collect trace on first retry for debugging
    trace: process.env.CI ? 'on-first-retry' : 'retain-on-failure',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video recording
    video: process.env.CI ? 'retain-on-failure' : 'off',

    // Action timeout (15s for network-heavy operations)
    actionTimeout: 15 * 1000,

    // Navigation timeout (30s)
    navigationTimeout: 30 * 1000,

    // Ignore HTTPS errors for local development
    ignoreHTTPSErrors: true,

    // Context options
    contextOptions: {
      // Permissions
      permissions: ['clipboard-read', 'clipboard-write'],

      // Locale
      locale: 'it-IT',

      // Timezone
      timezoneId: 'Europe/Rome',
    },

    // Viewport size
    viewport: { width: 1920, height: 1080 },
  },

  // Test projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        launchOptions: {
          args: [
            '--disable-web-security', // For CORS in dev
            '--disable-features=IsolateOrigins,site-per-process',
            '--allow-file-access-from-files', // Allow localStorage access
            '--disable-site-isolation-trials', // Fix localStorage security errors
          ],
        },
      },
    },

    // Uncomment for cross-browser testing
    // {
    //   name: 'firefox',
    //   use: {
    //     ...devices['Desktop Firefox'],
    //     viewport: { width: 1920, height: 1080 },
    //   },
    // },

    // {
    //   name: 'webkit',
    //   use: {
    //     ...devices['Desktop Safari'],
    //     viewport: { width: 1920, height: 1080 },
    //   },
    // },

    // Mobile viewports for responsive testing
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
  ],

  // Web server configuration
  // Vite dev server automatically handles backend proxy to port 8080
  // Frontend runs on port 3000
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes to start
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      NODE_ENV: 'development',
      PORT: '3000',
    },
  },

  // Output folder
  outputDir: 'test-results/artifacts',
});

