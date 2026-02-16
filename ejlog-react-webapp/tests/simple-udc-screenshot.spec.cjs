// @ts-check
const { test } = require('@playwright/test');

/**
 * Test semplice per generare screenshot della pagina UDC
 */
test('Screenshot pagina UDC', async ({ page }) => {
  // Naviga direttamente alla pagina UDC-LIST (che usa udcService con mock data)
  await page.goto('http://localhost:3002/udc-list');

  // Aspetta che la pagina sia completamente caricata
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Screenshot completo
  await page.screenshot({
    path: 'tests/screenshots/udc-page-full.png',
    fullPage: true,
  });

  console.log('Screenshot salvato: tests/screenshots/udc-page-full.png');

  // Screenshot solo viewport
  await page.screenshot({
    path: 'tests/screenshots/udc-page-viewport.png',
    fullPage: false,
  });

  console.log('Screenshot salvato: tests/screenshots/udc-page-viewport.png');
});
