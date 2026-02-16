import { test } from '@playwright/test';

test('Debug routing and errors', async ({ page }) => {
  const errors = [];
  const consoleMessages = [];

  // Cattura tutti i messaggi di console
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push(`[${msg.type()}] ${text}`);
    if (msg.type() === 'error') {
      errors.push(text);
    }
  });

  // Cattura errori di pagina
  page.on('pageerror', error => {
    errors.push(`PAGE ERROR: ${error.message}`);
  });

  // Naviga alla pagina
  await page.goto('http://localhost:3002/lists-management');

  // Aspetta un po'
  await page.waitForTimeout(4000);

  // Screenshot
  await page.screenshot({
    path: 'test-results/debug-routing.png',
    fullPage: true
  });

  // Stampa risultati
  console.log('\n========================================');
  console.log('URL FINALE:', page.url());
  console.log('========================================\n');

  console.log('CONSOLE MESSAGES:');
  consoleMessages.forEach(msg => console.log(msg));

  console.log('\n========================================');
  if (errors.length > 0) {
    console.log('❌ ERRORS FOUND:');
    errors.forEach(err => console.log('  -', err));
  } else {
    console.log('✅ NO ERRORS');
  }
  console.log('========================================\n');

  // Cattura HTML del root
  const rootHTML = await page.locator('#root').innerHTML();
  console.log('ROOT HTML (first 500 chars):');
  console.log(rootHTML.substring(0, 500));
  console.log('\n');

  // Cerca specifici elementi
  const hasListsManagementTitle = rootHTML.includes('Gestione Liste');
  const hasSidebar = rootHTML.includes('w-64');
  const hasLoginForm = rootHTML.includes('Accedi al Sistema');

  console.log('CONTENT CHECK:');
  console.log('  - "Gestione Liste" title:', hasListsManagementTitle ? '✅' : '❌');
  console.log('  - Sidebar (w-64):', hasSidebar ? '✅' : '❌');
  console.log('  - Login form:', hasLoginForm ? '✅' : '❌');
});
