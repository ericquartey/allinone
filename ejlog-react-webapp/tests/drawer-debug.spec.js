import { test, expect } from '@playwright/test';

test('Debug drawer management page', async ({ page }) => {
  // Listen for console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // Listen for page errors
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push(error.message);
  });

  // Navigate to drawer management page
  await page.goto('http://localhost:3005/drawer-management');

  // Wait for page to load
  await page.waitForTimeout(5000);

  // Take screenshot
  await page.screenshot({
    path: 'test-results/drawer-management-debug.png',
    fullPage: true
  });

  // Print errors
  console.log('=== CONSOLE ERRORS ===');
  consoleErrors.forEach(err => console.log(err));

  console.log('\n=== PAGE ERRORS ===');
  pageErrors.forEach(err => console.log(err));

  // Get page content
  const pageText = await page.textContent('body');
  console.log('\n=== PAGE CONTENT (first 500 chars) ===');
  console.log(pageText.substring(0, 500));

  // Keep browser open for debugging
  await page.waitForTimeout(3000);
});
