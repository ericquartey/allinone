import { test, expect } from '@playwright/test';

test('Verify products page loads with console output', async ({ page }) => {
  // Capture all console messages
  const consoleMessages: string[] = [];
  page.on('console', msg => {
    const text = `[BROWSER ${msg.type()}]: ${msg.text()}`;
    consoleMessages.push(text);
    console.log(text);
  });

  // Capture page errors
  page.on('pageerror', err => {
    const text = `[BROWSER ERROR]: ${err.message}`;
    consoleMessages.push(text);
    console.log(text);
  });

  console.log('🔍 Navigating to /products on port 3006...');
  await page.goto('http://localhost:3006/products');

  // Wait for page to load
  await page.waitForLoadState('domcontentloaded');
  console.log('✅ DOM loaded');

  // Wait for any async operations
  await page.waitForTimeout(5000);

  console.log('✅ Page fully loaded');
  console.log('\n📋 All console messages:');
  consoleMessages.forEach(msg => console.log(msg));

  // Take a screenshot for debugging
  await page.screenshot({ path: 'test-results/products-page-fresh.png', fullPage: true });
  console.log('📸 Screenshot saved to test-results/products-page-fresh.png');

  // Check if page title is correct
  const title = await page.locator('h1').first().textContent();
  console.log(`\n✅ Page title: "${title}"`);
  expect(title).toContain('Gestione Prodotti');
});
