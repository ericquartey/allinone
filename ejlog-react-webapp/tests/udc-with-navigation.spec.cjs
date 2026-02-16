// @ts-check
const { test } = require('@playwright/test');

/**
 * Test navigazione alla pagina UDC tramite menu sidebar
 */
test('Screenshot UDC tramite navigazione menu', async ({ page }) => {
  // Naviga alla home
  await page.goto('http://localhost:3004/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Trova e clicca sul menu "Gestione UDC" nella sidebar
  const udcMenuItem = page.locator('text=Gestione UDC').first();
  await udcMenuItem.click();

  // Aspetta navigazione e caricamento
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Screenshot completo dopo navigazione
  await page.screenshot({
    path: 'tests/screenshots/udc-via-menu-full.png',
    fullPage: true,
  });

  console.log('Screenshot salvato: tests/screenshots/udc-via-menu-full.png');

  // Screenshot viewport
  await page.screenshot({
    path: 'tests/screenshots/udc-via-menu-viewport.png',
    fullPage: false,
  });

  console.log('Screenshot salvato: tests/screenshots/udc-via-menu-viewport.png');
  console.log('URL corrente:', page.url());
});
