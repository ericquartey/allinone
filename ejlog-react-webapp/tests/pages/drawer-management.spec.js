// tests/pages/drawer-management.spec.js

import { test, expect } from '@playwright/test';

test.describe('Drawer Management Page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('http://localhost:3001/');
    await page.evaluate(() => {
      const mockUser = { username: 'testuser', role: 'Operatore' };
      const mockToken = 'mock-jwt-token-drawer-test';

      localStorage.setItem('ejlog_auth_token', mockToken);
      localStorage.setItem('ejlog_user', JSON.stringify(mockUser));

      const authStore = {
        state: {
          user: mockUser,
          token: mockToken,
          isAuthenticated: true,
        }
      };
      localStorage.setItem('ejlog-auth-storage', JSON.stringify(authStore));
    });
  });

  test('01 - should load without infinite loop', async ({ page }) => {
    // Track network requests to detect infinite loops
    let requestCount = 0;
    const requestCounts = {};

    page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/loading-units')) {
        requestCount++;
        requestCounts[url] = (requestCounts[url] || 0) + 1;
      }
    });

    await page.goto('http://localhost:3001/drawer-management');

    // Wait for initial page load
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    // Wait additional 3 seconds to check for infinite loops
    await page.waitForTimeout(3000);

    // Verify that we didn't make excessive API calls
    expect(requestCount).toBeLessThan(5);

    // Check that no single endpoint was called more than 2 times
    for (const [url, count] of Object.entries(requestCounts)) {
      expect(count, `Endpoint ${url} was called ${count} times`).toBeLessThanOrEqual(2);
    }

    // Verify page loaded successfully
    await expect(page.locator('h1')).toContainText('Gestione Cassetti');
  });

  test('02 - should display loading state initially', async ({ page }) => {
    await page.goto('http://localhost:3001/drawer-management');

    // Check for loading spinner
    const loadingSpinner = page.locator('.animate-spin').first();

    // Either the spinner is visible or data has already loaded
    const isSpinnerVisible = await loadingSpinner.isVisible().catch(() => false);
    const hasDrawersList = await page.locator('[class*="divide-y"]').isVisible().catch(() => false);
    const hasEmptyMessage = await page.locator('text=Nessun cassetto trovato').isVisible().catch(() => false);

    expect(isSpinnerVisible || hasDrawersList || hasEmptyMessage).toBeTruthy();
  });

  test('03 - should handle search without infinite loop', async ({ page }) => {
    await page.goto('http://localhost:3001/drawer-management');

    // Wait for initial load
    await page.waitForLoadState('networkidle');

    let requestCount = 0;
    page.on('request', request => {
      if (request.url().includes('/api/loading-units')) {
        requestCount++;
      }
    });

    // Type in search box
    const searchInput = page.locator('input[placeholder*="Cerca cassetto"]');
    await searchInput.fill('TEST');

    // Wait for debounced search
    await page.waitForTimeout(1000);

    // Should trigger at most 1 new request
    expect(requestCount).toBeLessThanOrEqual(1);
  });

  test('04 - should show error message if API fails', async ({ page }) => {
    // Intercept API and return error
    await page.route('**/api/loading-units*', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Server error' })
      });
    });

    await page.goto('http://localhost:3001/drawer-management');

    // Wait for error to appear
    await page.waitForSelector('text=/Errore/i', { timeout: 5000 });

    // Verify error message is displayed
    const errorMessage = page.locator('text=/Errore/i');
    await expect(errorMessage).toBeVisible();
  });

  test('05 - should display drawer list when API returns data', async ({ page }) => {
    // Mock successful API response
    await page.route('**/api/loading-units*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              id: 1,
              code: 'DRAWER001',
              locationCode: 'LOC-A1',
              compartmentCount: 5,
              emptyCompartmentCount: 2
            },
            {
              id: 2,
              code: 'DRAWER002',
              locationCode: 'LOC-B2',
              compartmentCount: 8,
              emptyCompartmentCount: 3
            }
          ],
          totalCount: 2
        })
      });
    });

    await page.goto('http://localhost:3001/drawer-management');

    // Wait for drawer list to appear
    await page.waitForSelector('text=DRAWER001', { timeout: 5000 });

    // Verify drawers are displayed
    await expect(page.locator('text=DRAWER001')).toBeVisible();
    await expect(page.locator('text=DRAWER002')).toBeVisible();
    await expect(page.locator('text=LOC-A1')).toBeVisible();
  });

  test('06 - should select drawer and load compartments without infinite loop', async ({ page }) => {
    // Mock loading units API
    await page.route('**/api/loading-units?*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              id: 1,
              code: 'DRAWER001',
              locationCode: 'LOC-A1',
              compartmentCount: 3,
              emptyCompartmentCount: 1
            }
          ],
          totalCount: 1
        })
      });
    });

    // Mock compartments API
    let compartmentRequestCount = 0;
    await page.route('**/api/loading-units/*/compartments*', route => {
      compartmentRequestCount++;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              id: 101,
              barcode: 'COMP001',
              xPosition: 0,
              yPosition: 0,
              width: 100,
              depth: 100,
              fillPercentage: 50,
              products: []
            }
          ],
          totalCount: 1
        })
      });
    });

    await page.goto('http://localhost:3001/drawer-management');
    await page.waitForLoadState('networkidle');

    // Click on a drawer
    await page.click('text=DRAWER001');

    // Wait for compartments to load
    await page.waitForTimeout(2000);

    // Should have called compartments API at most 2 times
    expect(compartmentRequestCount).toBeLessThanOrEqual(2);

    // Verify visualization loaded
    await expect(page.locator('button:has-text("Vista 2D")')).toBeVisible();
  });

  test('07 - should toggle between 2D and 3D views without errors', async ({ page }) => {
    // Mock APIs
    await page.route('**/api/loading-units?*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [], totalCount: 0 })
      });
    });

    await page.goto('http://localhost:3001/drawer-management');
    await page.waitForLoadState('networkidle');

    // Toggle to 3D
    await page.click('button:has-text("Vista 3D")');
    await page.waitForTimeout(500);

    // Toggle back to 2D
    await page.click('button:has-text("Vista 2D")');
    await page.waitForTimeout(500);

    // Verify no errors occurred (page still functional)
    await expect(page.locator('h1')).toContainText('Gestione Cassetti');
  });
});
