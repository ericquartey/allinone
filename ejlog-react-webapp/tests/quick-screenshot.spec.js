import { test } from '@playwright/test';

test('Quick screenshot of lists-management', async ({ page }) => {
  // Naviga alla pagina
  await page.goto('http://localhost:3002/lists-management');

  // Aspetta 3 secondi
  await page.waitForTimeout(3000);

  // Screenshot completo
  await page.screenshot({
    path: 'test-results/quick-screenshot-full.png',
    fullPage: true
  });

  // Stampa URL e titolo
  console.log('URL:', page.url());
  console.log('Title:', await page.title());

  // Stampa tutti gli h1
  const headings = await page.locator('h1').allTextContents();
  console.log('H1 headings:', headings);

  // Stampa eventuali errori nella console
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    }
  });

  // Cattura HTML del body
  const bodyHTML = await page.locator('body').innerHTML();
  console.log('Body HTML length:', bodyHTML.length);
  console.log('Body HTML preview:', bodyHTML.substring(0, 500));
});
