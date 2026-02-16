import { test, expect } from '@playwright/test';

test.describe('Inventory Page Diagnostics', () => {
  let consoleErrors = [];
  let pageErrors = [];

  test.beforeEach(async ({ page }) => {
    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Capture page errors
    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });

    // Capture network errors
    page.on('response', response => {
      if (response.status() >= 400) {
        console.log(`HTTP Error: ${response.status()} ${response.url()}`);
      }
    });
  });

  test('should diagnose inventory hub page errors', async ({ page }) => {
    console.log('Testing: /inventory-hub');

    await page.goto('http://localhost:3001/inventory-hub', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Take screenshot
    await page.screenshot({
      path: 'test-results/inventory-hub-screenshot.png',
      fullPage: true
    });

    // Check for errors
    console.log('Console Errors:', consoleErrors);
    console.log('Page Errors:', pageErrors);

    // Log page state
    const title = await page.title();
    console.log('Page Title:', title);

    // Check if error boundary or error message is visible
    const errorElements = await page.locator('[class*="error"], [class*="Error"]').count();
    console.log('Error elements found:', errorElements);

    if (errorElements > 0) {
      const errorText = await page.locator('[class*="error"], [class*="Error"]').first().textContent();
      console.log('Error text:', errorText);
    }
  });

  test('should diagnose inventory execution page errors', async ({ page }) => {
    console.log('Testing: /lists/inventory-execution');

    await page.goto('http://localhost:3001/lists/inventory-execution', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Take screenshot
    await page.screenshot({
      path: 'test-results/inventory-execution-screenshot.png',
      fullPage: true
    });

    // Check for errors
    console.log('Console Errors:', consoleErrors);
    console.log('Page Errors:', pageErrors);
  });

  test('should diagnose inventory adjustments page errors', async ({ page }) => {
    console.log('Testing: /adjustments/inventory');

    await page.goto('http://localhost:3001/adjustments/inventory', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Take screenshot
    await page.screenshot({
      path: 'test-results/inventory-adjustments-screenshot.png',
      fullPage: true
    });

    // Check for errors
    console.log('Console Errors:', consoleErrors);
    console.log('Page Errors:', pageErrors);
  });

  test.afterEach(async ({}, testInfo) => {
    if (consoleErrors.length > 0 || pageErrors.length > 0) {
      console.log('\n=== ERROR SUMMARY ===');
      console.log('Console Errors:', consoleErrors.length);
      console.log('Page Errors:', pageErrors.length);
      console.log('Test Status:', testInfo.status);
    }
  });
});
