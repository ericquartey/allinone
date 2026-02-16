const { test } = require('@playwright/test');

test('Quick visual check - open browser and wait', async ({ page }) => {
  console.log('Opening http://localhost:3003...');

  await page.goto('http://localhost:3003');

  console.log('Page loaded, URL:', page.url());
  console.log('Title:', await page.title());

  // Take screenshot
  await page.screenshot({ path: 'quick-check.png', fullPage: true });
  console.log('Screenshot saved to quick-check.png');

  // Wait for 30 seconds so you can see the page
  console.log('Waiting 30 seconds for manual inspection...');
  await page.waitForTimeout(30000);
});
