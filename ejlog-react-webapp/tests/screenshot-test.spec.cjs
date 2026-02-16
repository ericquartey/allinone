// @ts-check
const { test } = require('@playwright/test');

test('Take screenshot of homepage', async ({ page }) => {
  await page.goto('http://localhost:3013');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Take full page screenshot
  await page.screenshot({
    path: 'test-results/homepage-screenshot.png',
    fullPage: true
  });

  console.log('Screenshot salvato in test-results/homepage-screenshot.png');
});
