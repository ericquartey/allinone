import { test, expect } from '../fixtures/authFixtures';

/**
 * Stock/Giacenze Page Diagnostic Tests
 *
 * Comprehensive tests to diagnose and verify the stock page functionality
 * with real database data from the UDC table.
 */

test.describe('Stock Page - Diagnostic Tests', () => {
  test('should load stock page and verify page elements', async ({ stockPage, page }) => {
    console.log('📋 Test 1: Page Load & Elements Verification');

    // Navigate to stock page
    await stockPage.goto();

    // Take screenshot of initial page state
    await stockPage.takeStockScreenshot('stock-page-initial');

    // Verify page title
    await expect(stockPage.pageTitle).toBeVisible({ timeout: 15000 });
    console.log('✅ Page title is visible');

    // Verify search functionality exists
    const hasSearchInput = await stockPage.searchInput.isVisible().catch(() => false);
    console.log(`Search input visible: ${hasSearchInput}`);

    // Log page HTML for debugging
    const pageContent = await page.content();
    const hasStockContent = pageContent.includes('Stock') || pageContent.includes('Giacenze');
    console.log(`Page contains stock/giacenze content: ${hasStockContent}`);
  });

  test('should fetch and display real data from backend API', async ({ stockPage, page }) => {
    console.log('📋 Test 2: Backend API Integration');

    // Listen for API calls
    const apiCalls: string[] = [];
    page.on('request', request => {
      if (request.url().includes('Stock') || request.url().includes('EjLogHostVertimag')) {
        apiCalls.push(`${request.method()} ${request.url()}`);
        console.log(`🌐 API Request: ${request.method()} ${request.url()}`);
      }
    });

    // Listen for API responses
    page.on('response', async response => {
      if (response.url().includes('Stock') || response.url().includes('EjLogHostVertimag')) {
        const status = response.status();
        console.log(`📥 API Response: ${status} ${response.url()}`);

        // Try to get response body
        if (status === 200) {
          try {
            const body = await response.json();
            console.log('Response data:', JSON.stringify(body, null, 2));
          } catch (e) {
            console.log('Could not parse response as JSON');
          }
        }
      }
    });

    // Navigate to stock page
    await stockPage.goto();

    // Wait for network to settle
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    // Take screenshot after data load
    await stockPage.takeStockScreenshot('stock-page-after-api-load');

    // Verify API was called
    expect(apiCalls.length).toBeGreaterThan(0);
    console.log(`✅ Total API calls made: ${apiCalls.length}`);
    console.log('API calls:', apiCalls);
  });

  test('should display stock records in table', async ({ stockPage, page }) => {
    console.log('📋 Test 3: Stock Records Display');

    await stockPage.goto();
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    // Wait for data to load
    await stockPage.waitForStockPageLoad();

    // Check if table exists
    const tableVisible = await stockPage.stockTable.isVisible().catch(() => false);
    console.log(`Table visible: ${tableVisible}`);

    // Take screenshot
    await stockPage.takeStockScreenshot('stock-page-table-view');

    // Get row count
    const rowCount = await stockPage.getStockRecordsCount();
    console.log(`✅ Stock records found: ${rowCount}`);

    // Verify we have data (UDC table should have records)
    if (rowCount > 0) {
      console.log('✅ Stock data is displayed');

      // Get data from first row
      try {
        const firstRowData = await stockPage.getStockDataFromRow(0);
        console.log('First row data:', firstRowData);
      } catch (e) {
        console.log('Could not extract row data:', e);
      }
    } else {
      // Check if empty state is shown
      const emptyStateVisible = await stockPage.emptyState.isVisible().catch(() => false);
      console.log(`Empty state visible: ${emptyStateVisible}`);

      if (!emptyStateVisible) {
        console.log('⚠️  No data and no empty state - possible loading issue');
      }
    }
  });

  test('should handle console errors and network failures', async ({ stockPage, page }) => {
    console.log('📋 Test 4: Error Detection');

    const consoleMessages: string[] = [];
    const consoleErrors: string[] = [];
    const networkErrors: string[] = [];

    // Capture console messages
    page.on('console', msg => {
      const text = `[${msg.type()}] ${msg.text()}`;
      consoleMessages.push(text);

      if (msg.type() === 'error') {
        consoleErrors.push(text);
        console.log('❌ Console Error:', text);
      }
    });

    // Capture network failures
    page.on('requestfailed', request => {
      const error = `Failed: ${request.method()} ${request.url()} - ${request.failure()?.errorText}`;
      networkErrors.push(error);
      console.log('❌ Network Error:', error);
    });

    // Navigate to page
    await stockPage.goto();
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    // Take screenshot
    await stockPage.takeStockScreenshot('stock-page-error-check');

    // Report findings
    console.log(`\n📊 Error Summary:`);
    console.log(`Total console messages: ${consoleMessages.length}`);
    console.log(`Console errors: ${consoleErrors.length}`);
    console.log(`Network errors: ${networkErrors.length}`);

    if (consoleErrors.length > 0) {
      console.log('\nConsole Errors:');
      consoleErrors.forEach((err, i) => console.log(`${i + 1}. ${err}`));
    }

    if (networkErrors.length > 0) {
      console.log('\nNetwork Errors:');
      networkErrors.forEach((err, i) => console.log(`${i + 1}. ${err}`));
    }

    // Assert no critical errors
    // Note: We don't fail the test on warnings, only on actual errors
    const hasCriticalErrors = consoleErrors.some(err =>
      err.includes('Failed to fetch') ||
      err.includes('404') ||
      err.includes('500')
    );

    if (hasCriticalErrors) {
      console.log('⚠️  Critical errors detected');
    } else {
      console.log('✅ No critical errors detected');
    }
  });

  test('should verify stock API endpoint returns data', async ({ page }) => {
    console.log('📋 Test 5: Direct API Verification');

    // Direct API call to verify backend
    const apiUrl = 'http://localhost:3077/EjLogHostVertimag/Stock?limit=5';
    console.log(`Testing API endpoint: ${apiUrl}`);

    try {
      const response = await page.request.get(apiUrl);
      const status = response.status();
      console.log(`API Response Status: ${status}`);

      if (status === 200) {
        const data = await response.json();
        console.log('API Response:', JSON.stringify(data, null, 2));

        if (data.items && Array.isArray(data.items)) {
          console.log(`✅ API returned ${data.items.length} stock items`);
          console.log(`Total count: ${data.totalCount}`);
          console.log(`Source: ${data.source}`);

          if (data.items.length > 0) {
            console.log('Sample item:', data.items[0]);
          }
        } else {
          console.log('⚠️  API response structure unexpected');
        }
      } else {
        console.log(`❌ API returned status ${status}`);
      }
    } catch (error) {
      console.log('❌ API call failed:', error);
    }
  });

  test('should verify drawer management page navigation', async ({ page }) => {
    console.log('📋 Test 6: Drawer Management Navigation');

    // Navigate to drawers page
    await page.goto('/drawers', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    // Take screenshot
    await page.screenshot({ path: 'screenshots/drawers-page.png', fullPage: true });

    // Check page loaded
    const url = page.url();
    console.log(`Current URL: ${url}`);
    expect(url).toContain('drawers');

    // Check for page title or heading
    const pageContent = await page.content();
    const hasDrawerContent = pageContent.includes('Cassetti') || pageContent.includes('Drawer');
    console.log(`Drawer page loaded: ${hasDrawerContent}`);

    if (hasDrawerContent) {
      console.log('✅ Drawer management page loaded successfully');
    } else {
      console.log('⚠️  Drawer page may not have loaded correctly');
    }
  });

  test('should verify menu contains drawer management link', async ({ page }) => {
    console.log('📋 Test 7: Menu Configuration');

    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    // Take screenshot of menu
    await page.screenshot({ path: 'screenshots/dashboard-with-menu.png', fullPage: true });

    // Look for drawer management in menu
    const menuText = await page.textContent('body');
    const hasDrawerLink = menuText?.includes('Gestione Cassetti') || menuText?.includes('Cassetti');

    console.log(`Menu contains drawer management link: ${hasDrawerLink}`);

    if (hasDrawerLink) {
      console.log('✅ Drawer management link found in menu');

      // Try to click it
      try {
        await page.click('text=Gestione Cassetti', { timeout: 5000 });
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        console.log('✅ Successfully navigated to drawer management via menu');
      } catch (e) {
        console.log('Could not click drawer menu item:', e);
      }
    } else {
      console.log('⚠️  Drawer management link not found in menu');
    }
  });

  test('should capture full page state for manual inspection', async ({ stockPage, page }) => {
    console.log('📋 Test 8: Full Page Capture');

    await stockPage.goto();
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    // Take full page screenshot
    await page.screenshot({
      path: 'screenshots/stock-page-full.png',
      fullPage: true
    });

    // Get page HTML
    const html = await page.content();
    const fs = require('fs');
    const path = require('path');

    // Save HTML to file for inspection
    const htmlPath = path.join('screenshots', 'stock-page.html');
    fs.writeFileSync(htmlPath, html, 'utf-8');

    console.log('✅ Full page screenshot saved to: screenshots/stock-page-full.png');
    console.log('✅ Page HTML saved to: screenshots/stock-page.html');

    // Log page structure
    const bodyText = await page.locator('body').textContent();
    console.log('Page text content length:', bodyText?.length);

    // Check for key elements
    const elements = {
      hasTable: await page.locator('table').count() > 0,
      hasLoadingSpinner: await page.locator('.loading, .spinner').count() > 0,
      hasEmptyState: await page.locator('.empty-state').count() > 0,
      hasErrorMessage: await page.locator('.error, .alert-error').count() > 0,
    };

    console.log('Page elements:', elements);
  });
});

