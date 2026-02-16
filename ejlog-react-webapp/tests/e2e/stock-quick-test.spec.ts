/**
 * Quick Stock Diagnostic Test
 * Minimal test to verify stock page accessibility
 */

import { test, expect } from '@playwright/test';

test.describe('Stock Quick Diagnostic', () => {
  test('should load stock page and show ANY content', async ({ page }) => {
    console.log('[STOCK-TEST] Navigating to /stock...');

    // Navigate to stock page
    await page.goto('/stock');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    console.log('[STOCK-TEST] Page loaded, URL:', page.url());

    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/stock-diagnostic.png', fullPage: true });

    // Check if we got redirected to login
    const isLoginPage = page.url().includes('/login');
    console.log('[STOCK-TEST] Is login page?', isLoginPage);

    if (isLoginPage) {
      console.log('[STOCK-TEST] Redirected to login - setting mock auth');

      // Set mock authentication
      await page.evaluate(() => {
        const mockUser = { username: 'testuser', accessLevel: 'OPERATOR' };
        const mockToken = 'mock-jwt-token-12345';

        try {
          localStorage.setItem('ejlog_auth_token', mockToken);
          localStorage.setItem('ejlog_user', JSON.stringify(mockUser));

          // Update Zustand store
          const authStore = {
            state: {
              user: mockUser,
              token: mockToken,
              isAuthenticated: true,
            }
          };
          localStorage.setItem('ejlog-auth-storage', JSON.stringify(authStore));
        } catch (e) {
          console.log('[STOCK-TEST] Storage error:', e);
        }
      });

      // Navigate again after auth
      await page.goto('/stock');
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      console.log('[STOCK-TEST] After auth, URL:', page.url());
    }

    // Get page content
    const bodyText = await page.textContent('body');
    console.log('[STOCK-TEST] Body text length:', bodyText?.length);
    console.log('[STOCK-TEST] Body text preview:', bodyText?.substring(0, 200));

    // Check for any of these elements
    const hasHeading = await page.locator('h1, h2, h3').count();
    const hasTable = await page.locator('table').count();
    const hasCards = await page.locator('[class*="card"]').count();
    const hasError = await page.locator('text=/error|errore/i').count();
    const hasLoading = await page.locator('text=/loading|caricamento/i').count();
    const hasSpinner = await page.locator('[class*="spinner"]').count();

    console.log('[STOCK-TEST] Elements found:', {
      headings: hasHeading,
      tables: hasTable,
      cards: hasCards,
      errors: hasError,
      loading: hasLoading,
      spinner: hasSpinner
    });

    // Success if we have ANY content (not stuck on blank page)
    expect(hasHeading + hasTable + hasCards + hasError).toBeGreaterThan(0);
  });
});
