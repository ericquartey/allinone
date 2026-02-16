// @ts-check
const { test } = require('@playwright/test');

test('quick screenshot Lists Management', async ({ page }) => {
  console.log('Opening http://localhost:3005/lists/management...');
  await page.goto('http://localhost:3005/lists/management');

  // Wait for page to load
  await page.waitForTimeout(3000);

  // Take screenshot
  await page.screenshot({
    path: 'lists-current-view.png',
    fullPage: true
  });

  console.log('Screenshot saved to: lists-current-view.png');

  // Get page HTML snippet
  const title = await page.title();
  console.log('Page title:', title);

  const bodyText = await page.textContent('body');
  console.log('Page contains "Gestione Liste":', bodyText.includes('Gestione Liste'));
  console.log('Page contains "PICK1742":', bodyText.includes('PICK1742'));
  console.log('Page contains "Aggiorna":', bodyText.includes('Aggiorna'));
});
