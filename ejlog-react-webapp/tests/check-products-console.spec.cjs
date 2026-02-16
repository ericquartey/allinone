const { test } = require('@playwright/test');

test('Check products page console output', async ({ page }) => {
  // Capture all console messages
  page.on('console', msg => {
    console.log(`[BROWSER ${msg.type()}]:`, msg.text());
  });

  // Capture page errors
  page.on('pageerror', err => {
    console.log(`[BROWSER ERROR]:`, err.message);
  });

  console.log('🔍 Navigating to /products on port 3005...');
  await page.goto('http://localhost:3005/products');

  // Wait for page to load
  await page.waitForLoadState('domcontentloaded');
  console.log('✅ DOM loaded');

  await page.waitForTimeout(5000); // 5 seconds to allow all code to execute

  console.log('✅ Page fully loaded - check console output above');
});
