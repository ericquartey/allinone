const { test, expect } = require('@playwright/test');

test('Debug single page to see console errors', async ({ page }) => {
  // Listen to console messages
  page.on('console', msg => {
    console.log(`[${msg.type()}] ${msg.text()}`);
  });

  // Listen to page errors
  page.on('pageerror', error => {
    console.log(`[PAGE ERROR] ${error.message}`);
  });

  // Go to one of the new pages
  console.log('Navigating to /adjustments...');
  await page.goto('http://localhost:3001/adjustments');

  // Wait for navigation
  await page.waitForTimeout(3000);

  // Try to find any visible content
  const bodyText = await page.textContent('body');
  console.log(`Body text length: ${bodyText?.length || 0}`);

  // Check for specific elements
  const hasH1 = await page.locator('h1').count();
  const hasButton = await page.locator('button').count();
  const hasCard = await page.locator('[class*="card"]').count();

  console.log(`Found elements: h1=${hasH1}, button=${hasButton}, cards=${hasCard}`);

  // Take a screenshot
  await page.screenshot({ path: 'test-results/debug-adjustments.png', fullPage: true });
  console.log('Screenshot saved to test-results/debug-adjustments.png');
});
