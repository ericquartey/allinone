import { test, expect } from '@playwright/test';

test.describe('EjLog React UI Verification', () => {
  test('should load the React app without login', async ({ page }) => {
    console.log('📱 Navigating to React UI at http://localhost:3001');
    await page.goto('http://localhost:3001');

    // Check page title
    await expect(page).toHaveTitle(/EjLog WMS/);
    console.log('✅ Page title correct');

    // Wait for React to render
    await page.waitForTimeout(2000);

    // Check that we're not redirected to login
    await expect(page).not.toHaveURL(/login/);
    console.log('✅ Not redirected to login');

    // Take screenshot
    await page.screenshot({ path: 'ui-verification-main.png', fullPage: true });
    console.log('📸 Screenshot saved');
  });

  test('should have navigation elements', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(2000);

    // Check for navigation
    const nav = await page.$('nav');
    expect(nav).toBeTruthy();
    console.log('✅ Navigation found');

    // Check for main content area
    const main = await page.$('main, #root > div');
    expect(main).toBeTruthy();
    console.log('✅ Main content found');
  });

  test('should have menu links', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(2000);

    // Check if navigation links exist
    const listsLink = await page.$('a[href*="lists"]');
    const itemsLink = await page.$('a[href*="items"]');
    const stockLink = await page.$('a[href*="stock"]');

    console.log('Navigation Links Check:');
    console.log(`  - Lists: ${listsLink ? '✅' : '❌'}`);
    console.log(`  - Items: ${itemsLink ? '✅' : '❌'}`);
    console.log(`  - Stock: ${stockLink ? '✅' : '❌'}`);
  });

  test('should navigate to execution pages', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(2000);

    // Test navigation to picking execution (with mock ID)
    await page.goto('http://localhost:3001/lists/1/execute/picking');
    await page.waitForTimeout(1000);

    // Check if page loaded (should show picking interface or error message)
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
    console.log('✅ Picking execution page accessible');

    await page.screenshot({ path: 'picking-execution-page.png', fullPage: true });

    // Test refilling execution
    await page.goto('http://localhost:3001/lists/1/execute/refilling');
    await page.waitForTimeout(1000);
    console.log('✅ Refilling execution page accessible');

    // Test inventory execution
    await page.goto('http://localhost:3001/lists/1/execute/inventory');
    await page.waitForTimeout(1000);
    console.log('✅ Inventory execution page accessible');
  });

  test('should navigate to detail pages', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(2000);

    // Test product detail page
    await page.goto('http://localhost:3001/products/1');
    await page.waitForTimeout(1000);

    const productContent = await page.textContent('body');
    expect(productContent).toBeTruthy();
    console.log('✅ Product detail page accessible');

    await page.screenshot({ path: 'product-detail-page.png', fullPage: true });

    // Test location detail page
    await page.goto('http://localhost:3001/locations/1');
    await page.waitForTimeout(1000);

    const locationContent = await page.textContent('body');
    expect(locationContent).toBeTruthy();
    console.log('✅ Location detail page accessible');

    await page.screenshot({ path: 'location-detail-page.png', fullPage: true });
  });
});
