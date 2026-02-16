import { test, expect } from '@playwright/test';

test('Test authentication bypass with ?bypass=true', async ({ page }) => {
  const errors = [];
  const consoleMessages = [];

  // Cattura messaggi console
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

  console.log('\n========================================');
  console.log('🧪 Testing authentication bypass');
  console.log('========================================\n');

  // Naviga con parametro bypass=true
  await page.goto('http://localhost:3002/lists-management?bypass=true');

  // Aspetta che la pagina si carichi
  await page.waitForTimeout(3000);

  // URL finale
  const finalURL = page.url();
  console.log('URL finale:', finalURL);

  // Verifica che NON sia stato reindirizzato al login
  const isOnLoginPage = finalURL.includes('/login');
  console.log('Reindirizzato a login:', isOnLoginPage ? '❌ SÌ (PROBLEMA!)' : '✅ NO (OK!)');

  // Screenshot completo
  await page.screenshot({
    path: 'test-results/bypass-auth-full.png',
    fullPage: true
  });

  // Cattura HTML del root
  const rootHTML = await page.locator('#root').innerHTML();

  // Verifica markers della pagina Enhanced
  const hasGestioneListeTitle = rootHTML.includes('Gestione Liste');
  const hasSidebar = rootHTML.includes('w-64');
  const hasAzioniTitle = rootHTML.includes('Azioni');
  const hasStatsCards = rootHTML.includes('Totale') || rootHTML.includes('Picking');
  const hasLoginForm = rootHTML.includes('Accedi al Sistema') || rootHTML.includes('Username');

  console.log('\n📊 CONTENT CHECK:');
  console.log('  - "Gestione Liste" title:', hasGestioneListeTitle ? '✅' : '❌');
  console.log('  - Sidebar (w-64):', hasSidebar ? '✅' : '❌');
  console.log('  - "Azioni" title:', hasAzioniTitle ? '✅' : '❌');
  console.log('  - Stats cards:', hasStatsCards ? '✅' : '❌');
  console.log('  - Login form:', hasLoginForm ? '🚨 PRESENTE (non dovrebbe!)' : '✅ ASSENTE');

  console.log('\n========================================');
  if (errors.length > 0) {
    console.log('❌ ERRORS FOUND:');
    errors.forEach(err => console.log('  -', err));
  } else {
    console.log('✅ NO ERRORS');
  }
  console.log('========================================\n');

  // Risultato finale
  if (!isOnLoginPage && hasGestioneListeTitle && hasSidebar && hasAzioniTitle) {
    console.log('✅✅✅ BYPASS FUNZIONA! Pagina Enhanced visualizzata correttamente!\n');
  } else if (isOnLoginPage) {
    console.log('❌ BYPASS NON FUNZIONA - Ancora reindirizzato al login\n');
  } else {
    console.log('⚠️ Bypass funziona ma contenuto non corretto\n');
  }

  // Screenshot della sidebar se esiste
  const sidebarExists = await page.locator('.w-64.bg-gray-50').count() > 0;
  if (sidebarExists) {
    await page.locator('.w-64.bg-gray-50').first().screenshot({
      path: 'test-results/bypass-auth-sidebar.png'
    });
    console.log('📸 Screenshot sidebar salvato: test-results/bypass-auth-sidebar.png\n');
  }

  // Print first 800 chars of HTML per debug
  console.log('ROOT HTML (first 800 chars):');
  console.log(rootHTML.substring(0, 800));
  console.log('\n');
});
