import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Listen for console messages
  page.on('console', msg => {
    const type = msg.type();
    if (type === 'error' || type === 'warning') {
      console.log(`[BROWSER ${type.toUpperCase()}]:`, msg.text());
    }
  });

  // Listen for page errors
  page.on('pageerror', error => {
    console.log('[PAGE ERROR]:', error.message);
  });

  console.log('Navigating to drawer management page...');
  await page.goto('http://localhost:3005/drawer-management');

  console.log('Waiting for page to load...');
  await page.waitForTimeout(5000);

  console.log('Taking screenshot...');
  await page.screenshot({
    path: 'drawer-management-debug.png',
    fullPage: true
  });

  console.log('\n=== PAGE CONTENT ===');
  const pageText = await page.textContent('body');
  console.log(pageText.substring(0, 800));

  console.log('\nScreenshot saved to: drawer-management-debug.png');
  console.log('Browser will close in 10 seconds...');
  await page.waitForTimeout(10000);

  await browser.close();
})();
