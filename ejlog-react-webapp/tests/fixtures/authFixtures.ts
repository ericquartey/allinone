import { test as base, Page } from '@playwright/test';
import {
  LoginPage,
  DashboardPage,
  ListsPage,
  ItemsPage,
  StockPage,
} from '../pages';

/**
 * Test Fixtures for EjLog WMS
 *
 * Provides authenticated page objects and common test setup
 */

type TestFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  listsPage: ListsPage;
  itemsPage: ItemsPage;
  stockPage: StockPage;
  authenticatedPage: Page;
};

/**
 * Extended test with custom fixtures
 */
export const test = base.extend<TestFixtures>({
  /**
   * Login Page fixture
   */
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  /**
   * Dashboard Page fixture
   */
  dashboardPage: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page);
    await use(dashboardPage);
  },

  /**
   * Lists Page fixture
   */
  listsPage: async ({ page }, use) => {
    const listsPage = new ListsPage(page);
    await use(listsPage);
  },

  /**
   * Items Page fixture
   */
  itemsPage: async ({ page }, use) => {
    const itemsPage = new ItemsPage(page);
    await use(itemsPage);
  },

  /**
   * Stock Page fixture
   */
  stockPage: async ({ page }, use) => {
    const stockPage = new StockPage(page);
    await use(stockPage);
  },

  /**
   * Authenticated Page fixture
   *
   * Provides a page that's already logged in and ready to use.
   * In dev mode, authentication is bypassed, so we just navigate to dashboard.
   */
  authenticatedPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);

    // Check if in dev mode (authentication bypass)
    const isDevelopment = process.env.NODE_ENV !== 'production';

    if (isDevelopment) {
      // In dev mode, just navigate to dashboard (auth bypass is enabled)
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 15000 });
    } else {
      // In production mode, perform actual login
      await loginPage.goto();
      await loginPage.login('eric', 'eric'); // Default test user
      await loginPage.verifyLoginSuccessful();
    }

    await use(page);

    // Cleanup: Logout after test
    // Note: In dev mode, this might not be necessary
  },
});

/**
 * Export expect from Playwright for convenience
 */
export { expect } from '@playwright/test';

/**
 * Helper function to create authenticated context
 */
export async function createAuthenticatedContext(page: Page): Promise<void> {
  const isDevelopment = process.env.NODE_ENV !== 'production';

  if (isDevelopment) {
    // In dev mode, just navigate to dashboard
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 15000 });
  } else {
    // In production mode, perform login
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('eric', 'eric');
    await loginPage.verifyLoginSuccessful();
  }
}

/**
 * Helper function to skip authentication (for dev mode tests)
 */
export async function skipToPage(page: Page, path: string): Promise<void> {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 15000 });
}
