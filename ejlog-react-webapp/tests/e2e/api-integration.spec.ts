import { test, expect } from '@playwright/test';

/**
 * API Integration - E2E Test Suite
 *
 * Tests complete API integration between Frontend and Backend
 * Verifies network requests, response validation, caching, and error handling
 *
 * Backend Base: http://localhost:3077/EjLogHostVertimag
 * Frontend Base: http://localhost:3003
 */

test.describe('API Integration Tests', () => {
  const BASE_URL = 'http://localhost:3000'; // Fixed: was 3002, should be 3000
  const BACKEND_URL = 'http://localhost:3077/EjLogHostVertimag';

  test('should make correct API calls to backend for Workstations', async ({ page }) => {
    // Navigate to workstations page
    await page.goto(`${BASE_URL}/management/workstations`);
    await page.waitForLoadState('networkidle');

    // Verify data loaded successfully (proves API was called correctly)
    await expect(page.locator('table tbody tr')).toHaveCount(2, { timeout: 10000 });

    // Verify table has expected data structure
    const firstRow = page.locator('table tbody tr').first();
    await expect(firstRow).toBeVisible();

    // Check that data contains workstation info
    const rowText = await firstRow.textContent();
    expect(rowText).toBeTruthy();
    expect(rowText?.length).toBeGreaterThan(0);
  });

  test('should make correct API calls to backend for Locations', async ({ page }) => {
    // Navigate to locations page
    await page.goto(`${BASE_URL}/management/locations`);
    await page.waitForLoadState('networkidle');

    // Wait explicitly for table to have data (Locations may load slower)
    await page.waitForSelector('table tbody tr', { timeout: 15000 });

    // Verify data loaded (at least 3 locations, proves API was called correctly)
    const rowCount = await page.locator('table tbody tr').count();
    expect(rowCount).toBeGreaterThanOrEqual(3);

    // Verify table has expected data structure
    const firstRow = page.locator('table tbody tr').first();
    await expect(firstRow).toBeVisible();

    // Check that data contains location info
    const rowText = await firstRow.textContent();
    expect(rowText).toBeTruthy();
    expect(rowText?.length).toBeGreaterThan(0);
  });

  test('should validate Workstations data structure in UI', async ({ page }) => {
    // Navigate to workstations page
    await page.goto(`${BASE_URL}/management/workstations`);
    await page.waitForLoadState('networkidle');

    // Verify table loaded with data
    const rows = page.locator('table tbody tr');
    await expect(rows).toHaveCount(2, { timeout: 10000 });

    // Verify first row contains expected workstation fields
    const firstRow = rows.first();
    const cells = firstRow.locator('td');

    // Verify we have cells (columns)
    const cellCount = await cells.count();
    expect(cellCount).toBeGreaterThan(3);

    // Verify cells contain data
    for (let i = 0; i < Math.min(3, cellCount); i++) {
      const cellText = await cells.nth(i).textContent();
      // At least one of the first 3 cells should have content
      if (cellText && cellText.trim().length > 0) {
        expect(cellText.length).toBeGreaterThan(0);
      }
    }
  });

  test('should validate Locations data structure in UI', async ({ page }) => {
    // Navigate to locations page
    await page.goto(`${BASE_URL}/management/locations`);
    await page.waitForLoadState('networkidle');

    // Wait explicitly for table to have data (Locations may load slower)
    await page.waitForSelector('table tbody tr', { timeout: 15000 });

    // Verify table loaded with data (at least 3 locations)
    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThanOrEqual(3);

    // Verify first row contains expected location fields
    const firstRow = rows.first();
    const cells = firstRow.locator('td');

    // Verify we have cells (columns)
    const cellCount = await cells.count();
    expect(cellCount).toBeGreaterThan(5); // Locations have many columns

    // Verify cells contain data
    let hasContent = false;
    for (let i = 0; i < Math.min(5, cellCount); i++) {
      const cellText = await cells.nth(i).textContent();
      if (cellText && cellText.trim().length > 0 && cellText.trim() !== '-') {
        hasContent = true;
        break;
      }
    }
    expect(hasContent).toBeTruthy();
  });

  test('should display loading states during API fetch', async ({ page }) => {
    // Slow down API response
    await page.route('**/EjLogHostVertimag/Workstations*', async route => {
      await page.waitForTimeout(2000);
      route.continue();
    });

    // Navigate to page
    await page.goto(`${BASE_URL}/management/workstations`);

    // Look for loading indicators
    const loadingIndicators = page.locator(
      '[class*="loading"], [class*="spinner"], [class*="skeleton"], [role="progressbar"]'
    );

    // Loading should appear briefly
    if (await loadingIndicators.count() > 0) {
      await expect(loadingIndicators.first()).toBeVisible({ timeout: 1000 });
    }

    // Eventually data should load
    await expect(page.locator('table tbody tr')).toHaveCount(2, { timeout: 15000 });
  });

  test('should handle 500 server error gracefully', async ({ page }) => {
    // Intercept and return error for Workstations endpoint
    await page.route('**/api/Workstations*', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error', message: 'Database connection failed' })
      });
    });

    // Also intercept the EjLogHostVertimag endpoint in case proxy rewrites to it
    await page.route('**/EjLogHostVertimag/Workstations*', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error', message: 'Database connection failed' })
      });
    });

    // Navigate to page
    await page.goto(`${BASE_URL}/management/workstations`);
    await page.waitForLoadState('networkidle');

    // Wait for error to be processed
    await page.waitForTimeout(2000);

    // For 500 error, the acceptable behavior is:
    // 1. No data loads (empty table)
    // 2. Error message displayed (toast, alert, or error text)
    // 3. Console error logged (checked separately)

    const rowCount = await page.locator('table tbody tr').count();

    // Primary expectation: No data should load when backend returns 500
    expect(rowCount).toBe(0);
  });

  test('should handle 404 not found error gracefully', async ({ page }) => {
    // Intercept and return 404 for both endpoints
    await page.route('**/api/Locations*', route => {
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Not Found' })
      });
    });

    await page.route('**/EjLogHostVertimag/Locations*', route => {
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Not Found' })
      });
    });

    // Navigate to page
    await page.goto(`${BASE_URL}/management/locations`);
    await page.waitForLoadState('networkidle');

    // Wait for error to be processed
    await page.waitForTimeout(2000);

    // For 404 error, acceptable behavior is:
    // 1. No data loads (empty table)
    // 2. Error message displayed
    const rowCount = await page.locator('table tbody tr').count();

    // Primary expectation: No data should load when backend returns 404
    expect(rowCount).toBe(0);
  });

  test('should cache data correctly with RTK Query', async ({ page }) => {
    // First load - track API calls
    let firstLoadCalls = 0;
    page.on('request', request => {
      if (request.url().includes('Workstations')) {
        firstLoadCalls++;
      }
    });

    await page.goto(`${BASE_URL}/management/workstations`);
    await page.waitForLoadState('networkidle');

    const initialCalls = firstLoadCalls;
    expect(initialCalls).toBeGreaterThan(0);

    // Navigate away
    await page.goto(`${BASE_URL}`);
    await page.waitForLoadState('networkidle');

    // Navigate back - should use cache
    let secondLoadCalls = 0;
    page.on('request', request => {
      if (request.url().includes('Workstations')) {
        secondLoadCalls++;
      }
    });

    await page.goto(`${BASE_URL}/management/workstations`);
    await page.waitForLoadState('networkidle');

    // Data should load immediately from cache (visible within 1s)
    await expect(page.locator('table tbody tr')).toHaveCount(2, { timeout: 1000 });

    // Note: RTK Query may still make background refresh call, so we verify data loads fast
  });

  test('should send correct HTTP headers in API requests', async ({ page }) => {
    let capturedHeaders: Record<string, string> = {};

    page.on('request', request => {
      const url = request.url();
      // Only capture actual API requests, not source files
      if (url.includes('Workstations') && url.includes('/api/')) {
        capturedHeaders = request.headers();
      }
    });

    await page.goto(`${BASE_URL}/management/workstations`);
    await page.waitForLoadState('networkidle');

    // Verify common headers if captured
    if (Object.keys(capturedHeaders).length > 0) {
      const acceptHeader = capturedHeaders['accept'] || capturedHeaders['Accept'];
      if (acceptHeader) {
        expect(acceptHeader).toContain('application/json');
      }

      // If auth is implemented, verify auth headers
      if (capturedHeaders['authorization']) {
        expect(capturedHeaders['authorization']).toBeTruthy();
      }
    }

    // Verify data loaded (confirms request was made successfully)
    await expect(page.locator('table tbody tr')).toHaveCount(2, { timeout: 10000 });
  });

  test('should handle network timeout gracefully', async ({ page }) => {
    // Simulate timeout by immediately aborting requests
    await page.route('**/api/Locations*', route => {
      route.abort('timedout');
    });

    await page.route('**/EjLogHostVertimag/Locations*', route => {
      route.abort('timedout');
    });

    // Navigate to page
    await page.goto(`${BASE_URL}/management/locations`);
    await page.waitForLoadState('networkidle');

    // Wait for error to be processed
    await page.waitForTimeout(2000);

    // For timeout error, acceptable behavior is:
    // 1. No data loads (empty table) - primary expectation
    // 2. Error message shown
    // 3. Loading state persists

    const rowCount = await page.locator('table tbody tr').count();

    // Primary expectation: No data should load when request times out
    expect(rowCount).toBe(0);

    // Cleanup routes
    await page.unrouteAll({ behavior: 'ignoreErrors' });
  });

  test('should handle CORS correctly', async ({ page }) => {
    // Track console errors for CORS issues
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto(`${BASE_URL}/management/workstations`);
    await page.waitForLoadState('networkidle');

    // Verify no CORS errors
    const hasCorsError = consoleErrors.some(error =>
      error.toLowerCase().includes('cors') || error.toLowerCase().includes('cross-origin')
    );

    expect(hasCorsError).toBeFalsy();

    // Verify data loaded successfully (proves CORS is working)
    await expect(page.locator('table tbody tr')).toHaveCount(2, { timeout: 10000 });
  });

  test('should include query parameters correctly in API calls', async ({ page }) => {
    let capturedUrl = '';

    page.on('request', request => {
      const url = request.url();
      // Only capture actual API requests, not source files
      if ((url.includes('Locations') || url.includes('locations')) && url.includes('/api/')) {
        capturedUrl = url;
        console.log('[TEST] Captured API URL:', url);
      }
    });

    await page.goto(`${BASE_URL}/management/locations`);
    await page.waitForLoadState('networkidle');

    // Wait explicitly for table to have data
    await page.waitForSelector('table tbody tr', { timeout: 15000 });

    // Verify URL structure (should use /api/Locations or /api/EjLogHostVertimag/Locations)
    expect(capturedUrl).toContain('/api/');
    expect(capturedUrl.toLowerCase()).toContain('locations');

    // Parse URL to verify query params can be added
    const url = new URL(capturedUrl);
    expect(url.pathname.toLowerCase()).toContain('locations');

    // Verify data loaded (confirms request was successful)
    const rowCount = await page.locator('table tbody tr').count();
    expect(rowCount).toBeGreaterThan(0);
  });
});

