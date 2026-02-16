const { test, expect } = require('@playwright/test');

test('Check 4 warning pages in detail', async ({ page }) => {
  test.setTimeout(60000);

  const pagesToTest = [
    { name: 'Dashboard', href: '/' },
    { name: 'Articoli', href: '/items' },
    { name: 'Liste', href: '/lists' },
    { name: 'Giacenze', href: '/stock' },
  ];

  console.log('\n=== Testing 4 Warning Pages ===\n');

  for (const pageInfo of pagesToTest) {
    console.log(`\n--- Testing ${pageInfo.name} (${pageInfo.href}) ---`);

    const consoleMessages = [];
    const pageErrors = [];

    page.on('console', msg => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });

    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });

    try {
      await page.goto(`http://localhost:3001${pageInfo.href}`, { timeout: 10000 });

      // Wait for page to fully load
      await page.waitForTimeout(2000);

      const hasH1 = await page.locator('h1').count();
      const hasButton = await page.locator('button').count();
      const hasCard = await page.locator('[class*="card"]').count();
      const bodyText = await page.textContent('body');
      const contentLength = bodyText?.length || 0;

      console.log(`  H1 elements: ${hasH1}`);
      console.log(`  Buttons: ${hasButton}`);
      console.log(`  Cards: ${hasCard}`);
      console.log(`  Content length: ${contentLength} chars`);
      console.log(`  Console messages: ${consoleMessages.length}`);
      console.log(`  Page errors: ${pageErrors.length}`);

      if (pageErrors.length > 0) {
        console.log('\n  Errors found:');
        pageErrors.forEach(err => console.log(`    - ${err}`));
      }

      if (consoleMessages.length > 0) {
        console.log('\n  Console messages (last 10):');
        consoleMessages.slice(-10).forEach(msg => console.log(`    ${msg}`));
      }

      // Take screenshot
      await page.screenshot({
        path: `test-results/${pageInfo.name.toLowerCase()}-screenshot.png`,
        fullPage: true
      });

    } catch (error) {
      console.log(`  ERROR: ${error.message}`);
    }

    // Clear listeners
    page.removeAllListeners('console');
    page.removeAllListeners('pageerror');
  }
});
