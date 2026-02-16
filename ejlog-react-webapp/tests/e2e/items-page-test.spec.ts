// ============================================================================
// EJLOG WMS - Items Page E2E Test
// Test della pagina articoli con Playwright
// ============================================================================

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:3077';

test.describe('Items Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to items page
    await page.goto(`${BASE_URL}/items`);
  });

  test('should load items page', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check page title or header
    const pageTitle = page.locator('h1, h2').first();
    await expect(pageTitle).toBeVisible({ timeout: 10000 });

    // Take screenshot
    await page.screenshot({
      path: 'screenshots/items-page-loaded.png',
      fullPage: true
    });

    console.log('✅ Items page loaded successfully');
  });

  test('should show items data or error message', async ({ page }) => {
    // Wait for network to be idle
    await page.waitForLoadState('networkidle');

    // Check if there's a table or error message
    const hasTable = await page.locator('table').count() > 0;
    const hasError = await page.locator('text=/error|errore/i').count() > 0;
    const hasNoData = await page.locator('text=/no data|nessun dato/i').count() > 0;

    console.log('📊 Page state:');
    console.log(`  - Has table: ${hasTable}`);
    console.log(`  - Has error: ${hasError}`);
    console.log(`  - Has "no data": ${hasNoData}`);

    // Take screenshot
    await page.screenshot({
      path: 'screenshots/items-page-content.png',
      fullPage: true
    });

    // At least one of these should be true
    expect(hasTable || hasError || hasNoData).toBeTruthy();
  });

  test('should call items API endpoint', async ({ page }) => {
    let apiCalled = false;
    let apiResponse: any = null;

    // Listen for API calls
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/api/items') || url.includes('/items')) {
        apiCalled = true;
        console.log(`\n📡 API Call detected: ${url}`);
        console.log(`   Status: ${response.status()}`);

        try {
          const contentType = response.headers()['content-type'];
          if (contentType && contentType.includes('application/json')) {
            apiResponse = await response.json();
            console.log(`   Response:`, JSON.stringify(apiResponse, null, 2));
          }
        } catch (e) {
          console.log(`   Could not parse response as JSON`);
        }
      }
    });

    // Reload page to trigger API call
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Take screenshot
    await page.screenshot({
      path: 'screenshots/items-page-api-call.png',
      fullPage: true
    });

    console.log(`\n📊 Test Results:`);
    console.log(`   API Called: ${apiCalled}`);

    if (apiCalled) {
      console.log('✅ Items API endpoint was called');
    } else {
      console.log('❌ Items API endpoint was NOT called');
    }

    // API should be called
    expect(apiCalled).toBeTruthy();
  });

  test('should test items endpoint directly', async ({ request }) => {
    console.log(`\n🔍 Testing items endpoint directly: ${API_URL}/api/items`);

    try {
      const response = await request.get(`${API_URL}/api/items?limit=5`);

      console.log(`   Status: ${response.status()}`);
      console.log(`   Status Text: ${response.statusText()}`);

      const body = await response.text();
      console.log(`   Response Body:`, body);

      // Endpoint should respond (even if with an error)
      expect(response.status()).toBeLessThan(500);

      // Should not be 404
      expect(response.status()).not.toBe(404);

      console.log('✅ Items endpoint responds (not 404)');
    } catch (error) {
      console.error('❌ Error calling items endpoint:', error);
      throw error;
    }
  });
});

