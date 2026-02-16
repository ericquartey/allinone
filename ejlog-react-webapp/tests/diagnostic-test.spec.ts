/**
 * Comprehensive Diagnostic Test for EjLog Frontend-Backend Integration
 *
 * This test verifies:
 * 1. Frontend loads correctly
 * 2. Network requests go to correct backend (port 3079)
 * 3. Real data is received from API
 * 4. Data is properly displayed in the UI
 */
import { test, expect, Page } from '@playwright/test';

// Configuration
const FRONTEND_URL = 'http://localhost:3001';
const BACKEND_URL = 'http://localhost:3079/EjLogHostVertimag';

// Helper to capture all network requests
const captureNetworkRequests = (page: Page) => {
  const requests: Array<{
    url: string;
    method: string;
    status: number | null;
    responseBody?: any;
  }> = [];

  page.on('request', (request) => {
    console.log(`>>> REQUEST: ${request.method()} ${request.url()}`);
  });

  page.on('response', async (response) => {
    const url = response.url();
    const status = response.status();
    const method = response.request().method();

    console.log(`<<< RESPONSE: ${method} ${url} - Status: ${status}`);

    let responseBody = null;
    try {
      if (url.includes('/EjLogHostVertimag/')) {
        responseBody = await response.json();
        console.log(`    Body:`, JSON.stringify(responseBody, null, 2).substring(0, 500));
      }
    } catch (e) {
      // Not JSON or failed to parse
    }

    requests.push({ url, method, status, responseBody });
  });

  return requests;
};

test.describe('EjLog Frontend-Backend Diagnostic', () => {

  test('1. Verify Backend API is accessible', async ({ page }) => {
    console.log('\n=== TEST 1: Backend API Accessibility ===\n');

    // Test Items endpoint
    const itemsResponse = await page.request.get(`${BACKEND_URL}/Items?limit=5&offset=0`);
    expect(itemsResponse.status()).toBe(200);

    const itemsData = await itemsResponse.json();
    console.log('Backend Items Response:', JSON.stringify(itemsData, null, 2));

    expect(itemsData).toHaveProperty('result');
    expect(itemsData.result).toBe('OK');
    expect(itemsData).toHaveProperty('exportedItems');
    expect(itemsData.exportedItems.length).toBeGreaterThan(0);

    // Verify we have real data
    const firstItem = itemsData.exportedItems[0];
    console.log('First Item:', firstItem);
    expect(firstItem).toHaveProperty('code');
    expect(firstItem.code).toBeTruthy();
  });

  test('2. Verify Frontend loads and console is clean', async ({ page }) => {
    console.log('\n=== TEST 2: Frontend Loading ===\n');

    const errors: string[] = [];
    page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      console.log(`[CONSOLE ${type.toUpperCase()}] ${text}`);
      if (type === 'error') {
        errors.push(text);
      }
    });

    page.on('pageerror', (error) => {
      console.log(`[PAGE ERROR] ${error.message}`);
      errors.push(error.message);
    });

    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle' });

    // Check page title
    const title = await page.title();
    console.log('Page Title:', title);
    expect(title).toContain('EjLog');

    // Report errors
    if (errors.length > 0) {
      console.log('\n!!! ERRORS FOUND !!!');
      errors.forEach(err => console.log(`  - ${err}`));
    } else {
      console.log('\nNo console errors found!');
    }
  });

  test('3. Check network requests to backend', async ({ page }) => {
    console.log('\n=== TEST 3: Network Requests Analysis ===\n');

    const requests = captureNetworkRequests(page);

    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle' });

    // Wait for dashboard to load
    await page.waitForTimeout(3000);

    // Analyze requests
    console.log('\n=== ALL CAPTURED REQUESTS ===');
    const apiRequests = requests.filter(r =>
      r.url.includes('/Items') ||
      r.url.includes('/Lists') ||
      r.url.includes('/Stock') ||
      r.url.includes('/Movements')
    );

    console.log(`\nTotal API requests: ${apiRequests.length}`);

    apiRequests.forEach((req, idx) => {
      console.log(`\n${idx + 1}. ${req.method} ${req.url}`);
      console.log(`   Status: ${req.status}`);
      if (req.responseBody) {
        console.log(`   Response:`, JSON.stringify(req.responseBody, null, 2).substring(0, 300));
      }
    });

    // Verify requests go to port 3079
    const wrongPortRequests = apiRequests.filter(r => !r.url.includes(':3079'));
    if (wrongPortRequests.length > 0) {
      console.log('\n!!! WRONG PORT DETECTED !!!');
      wrongPortRequests.forEach(r => console.log(`  ${r.url}`));
    }
    expect(wrongPortRequests.length).toBe(0);

    // Verify we got successful responses
    const failedRequests = apiRequests.filter(r => r.status && r.status >= 400);
    if (failedRequests.length > 0) {
      console.log('\n!!! FAILED REQUESTS !!!');
      failedRequests.forEach(r => console.log(`  ${r.url} - Status: ${r.status}`));
    }
    expect(failedRequests.length).toBe(0);
  });

  test('4. Check Dashboard displays real data', async ({ page }) => {
    console.log('\n=== TEST 4: Dashboard Data Display ===\n');

    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle' });

    // Wait for dashboard to fully load
    await page.waitForSelector('text=/Dashboard WMS/', { timeout: 10000 });
    console.log('Dashboard title found!');

    // Take screenshot for manual verification
    await page.screenshot({ path: 'tests/screenshots/dashboard-full.png', fullPage: true });
    console.log('Screenshot saved: tests/screenshots/dashboard-full.png');

    // Check for stat cards
    const statCards = await page.locator('[role="grid"] > div').count();
    console.log(`Found ${statCards} stat cards`);

    // Try to extract values from cards
    const cardTitles = ['Articoli Totali', 'Liste Attive', 'Giacenze', 'Movimenti'];

    for (const title of cardTitles) {
      try {
        const cardLocator = page.locator(`text=${title}`).first();
        await cardLocator.waitFor({ timeout: 5000 });

        // Get parent card and find the value
        const card = cardLocator.locator('..').locator('..');
        const valueElement = card.locator('h4');
        const value = await valueElement.textContent({ timeout: 5000 });

        console.log(`${title}: ${value}`);

        // Check if it's a real number (not 0, not null, not loading)
        if (value) {
          const numValue = parseInt(value.replace(/,/g, ''), 10);
          if (!isNaN(numValue)) {
            console.log(`  -> Numeric value: ${numValue}`);
            if (numValue === 0) {
              console.log(`  ⚠️ WARNING: Value is 0 for ${title}`);
            } else {
              console.log(`  ✓ Real data detected!`);
            }
          }
        }
      } catch (e) {
        console.log(`  ✗ Could not extract value for ${title}`);
      }
    }

    // Check if there are any error messages
    const errorMessages = await page.locator('[role="alert"]').count();
    console.log(`Error messages on page: ${errorMessages}`);

    if (errorMessages > 0) {
      const errorText = await page.locator('[role="alert"]').first().textContent();
      console.log(`Error message: ${errorText}`);
    }
  });

  test('5. Check Items page data', async ({ page }) => {
    console.log('\n=== TEST 5: Items Page Data ===\n');

    const requests = captureNetworkRequests(page);

    await page.goto(`${FRONTEND_URL}/items`, { waitUntil: 'networkidle' });

    // Wait for page to load
    await page.waitForTimeout(3000);

    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/items-page.png', fullPage: true });
    console.log('Screenshot saved: tests/screenshots/items-page.png');

    // Check for API requests
    const itemsRequests = requests.filter(r => r.url.includes('/Items'));
    console.log(`Items API requests: ${itemsRequests.length}`);

    if (itemsRequests.length > 0) {
      const lastRequest = itemsRequests[itemsRequests.length - 1];
      console.log('Last Items request:', lastRequest.url);
      console.log('Status:', lastRequest.status);
      if (lastRequest.responseBody) {
        console.log('Response:', JSON.stringify(lastRequest.responseBody, null, 2).substring(0, 500));
      }
    }

    // Check if table has data
    const tableRows = await page.locator('table tbody tr').count();
    console.log(`Table rows found: ${tableRows}`);

    if (tableRows > 0) {
      const firstRowText = await page.locator('table tbody tr').first().textContent();
      console.log(`First row content: ${firstRowText}`);
    }
  });

  test('6. Full integration test with login', async ({ page }) => {
    console.log('\n=== TEST 6: Full Integration with Login ===\n');

    const requests = captureNetworkRequests(page);

    await page.goto(FRONTEND_URL);

    // Check if we're on login page
    const isLoginPage = await page.locator('input[type="password"]').count() > 0;
    console.log(`Login page detected: ${isLoginPage}`);

    if (isLoginPage) {
      console.log('Attempting login...');

      // Fill login form (adjust selectors as needed)
      await page.fill('input[name="username"], input[type="text"]', 'eric');
      await page.fill('input[type="password"]', 'eric');
      await page.click('button[type="submit"]');

      // Wait for redirect
      await page.waitForTimeout(2000);

      console.log('Current URL:', page.url());
    }

    // Navigate to dashboard
    await page.goto(`${FRONTEND_URL}/dashboard`);
    await page.waitForTimeout(3000);

    // Check API calls
    const dashboardAPICalls = requests.filter(r =>
      r.url.includes('/Items') ||
      r.url.includes('/Lists') ||
      r.url.includes('/Stock') ||
      r.url.includes('/Movements')
    );

    console.log(`\nDashboard API calls: ${dashboardAPICalls.length}`);
    dashboardAPICalls.forEach(req => {
      console.log(`  - ${req.method} ${req.url} [${req.status}]`);
    });

    // Final screenshot
    await page.screenshot({ path: 'tests/screenshots/final-state.png', fullPage: true });
    console.log('Final screenshot saved');
  });
});

test.describe('Backend Direct Tests', () => {

  test('Direct API: Items endpoint', async ({ request }) => {
    console.log('\n=== Direct Backend Test: Items ===\n');

    const response = await request.get(`${BACKEND_URL}/Items?limit=5&offset=0`);
    const data = await response.json();

    console.log('Status:', response.status());
    console.log('Data:', JSON.stringify(data, null, 2));

    expect(response.status()).toBe(200);
    expect(data.result).toBe('OK');
    expect(data.exportedItems.length).toBeGreaterThan(0);

    console.log('\n✓ Backend Items API working correctly');
    console.log(`  Total items: ${data.recordNumber}`);
    console.log(`  Sample items:`, data.exportedItems.slice(0, 3).map((i: any) => i.code));
  });

  test('Direct API: Lists endpoint', async ({ request }) => {
    console.log('\n=== Direct Backend Test: Lists ===\n');

    const response = await request.get(`${BACKEND_URL}/Lists?limit=5&offset=0`);
    const data = await response.json();

    console.log('Status:', response.status());
    console.log('Data:', JSON.stringify(data, null, 2));

    expect(response.status()).toBe(200);
    expect(data.result).toBe('OK');

    console.log('\n✓ Backend Lists API working correctly');
    console.log(`  Total lists: ${data.recordNumber}`);
  });
});

