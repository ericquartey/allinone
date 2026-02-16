// Test per debuggare la pagina /lists/execution
const { test, expect } = require('@playwright/test');

test('Debug Lists Execution Page', async ({ page }) => {
  // Cattura errori console
  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.log('❌ Console Error:', msg.text());
    }
  });

  page.on('pageerror', error => {
    pageErrors.push(error.message);
    console.log('❌ Page Error:', error.message);
  });

  // Naviga alla pagina
  console.log('🔍 Navigating to /lists/execution...');
  await page.goto('http://localhost:3001/lists/execution', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  // Aspetta un po' per vedere se ci sono errori
  await page.waitForTimeout(3000);

  // Cattura screenshot
  await page.screenshot({
    path: 'test-results/lists-execution-debug.png',
    fullPage: true
  });

  // Log degli errori trovati
  console.log('\n📊 REPORT ERRORI:');
  console.log('Console Errors:', consoleErrors.length);
  console.log('Page Errors:', pageErrors.length);

  if (consoleErrors.length > 0) {
    console.log('\n🔴 CONSOLE ERRORS:');
    consoleErrors.forEach((err, i) => console.log(`${i + 1}. ${err}`));
  }

  if (pageErrors.length > 0) {
    console.log('\n🔴 PAGE ERRORS:');
    pageErrors.forEach((err, i) => console.log(`${i + 1}. ${err}`));
  }

  // Verifica elementi visibili
  const hasHeader = await page.locator('h1:has-text("Liste in Esecuzione")').isVisible();
  const hasError = await page.locator('text=Errore').isVisible();
  const hasLoading = await page.locator('text=Caricamento').isVisible();

  console.log('\n📋 STATO PAGINA:');
  console.log('Header visibile:', hasHeader);
  console.log('Messaggio errore visibile:', hasError);
  console.log('Messaggio loading visibile:', hasLoading);

  // Estrai il testo della pagina per vedere cosa viene mostrato
  const pageText = await page.locator('body').textContent();
  console.log('\n📄 TESTO PAGINA (primi 500 caratteri):');
  console.log(pageText.substring(0, 500));
});
