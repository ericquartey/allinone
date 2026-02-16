const { test, expect } = require('@playwright/test');

test('Debug Operations Hub errors', async ({ page }) => {
  const consoleMessages = [];
  const pageErrors = [];

  page.on('console', msg => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
  });

  page.on('pageerror', error => {
    pageErrors.push(error.message);
  });

  console.log('\n--- Testing Operations Hub ---');
  await page.goto('http://localhost:3001/operations-hub');
  await page.waitForTimeout(2000);

  const bodyText = await page.textContent('body');
  console.log(`Body length: ${bodyText.length}`);
  console.log(`\nConsole messages: ${consoleMessages.length}`);
  consoleMessages.forEach(msg => console.log(msg));
  console.log(`\nPage errors: ${pageErrors.length}`);
  pageErrors.forEach(err => console.log(err));
});
