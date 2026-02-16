import { test, expect } from '@playwright/test';

test('Login and view lists management page', async ({ page }) => {
  // 1. Vai alla pagina di login
  await page.goto('http://localhost:3002/login');

  // 2. Compila il form di login con credenziali di default
  await page.fill('input[name="username"], input[placeholder*="username" i]', 'admin');
  await page.fill('input[name="password"], input[type="password"]', 'admin');

  // 3. Click sul bottone Accedi
  await page.click('button:has-text("Accedi")');

  // 4. Aspetta la navigazione dopo il login
  await page.waitForTimeout(2000);

  // 5. Naviga alla pagina gestione liste
  await page.goto('http://localhost:3002/lists-management');

  // 6. Aspetta che la pagina si carichi
  await page.waitForTimeout(3000);

  // 7. Screenshot completo
  await page.screenshot({
    path: 'test-results/lists-management-logged-in.png',
    fullPage: true
  });

  // 8. Verifica URL e contenuto
  console.log('URL dopo login:', page.url());
  console.log('Title:', await page.title());

  const headings = await page.locator('h1, h2').allTextContents();
  console.log('Headings found:', headings);

  // 9. Cerca markers della versione Enhanced
  const hasSidebar = await page.locator('.w-64.bg-gray-50').count() > 0;
  const hasGestioneStato = await page.locator('text=Gestione Stato').count() > 0;
  const hasStatsCards = await page.locator('text=Totale').count() > 0;

  console.log('\n📊 Enhanced Features:');
  console.log('  - Sidebar (w-64):', hasSidebar ? '✅' : '❌');
  console.log('  - "Gestione Stato" section:', hasGestioneStato ? '✅' : '❌');
  console.log('  - Stats cards:', hasStatsCards ? '✅' : '❌');

  if (hasSidebar && hasGestioneStato) {
    console.log('\n✅ ENHANCED VERSION IS ACTIVE!');
  } else {
    console.log('\n⚠️ Different version active');
  }

  // 10. Screenshot specifico della sidebar se presente
  if (hasSidebar) {
    await page.locator('.w-64').first().screenshot({
      path: 'test-results/lists-management-sidebar.png'
    });
  }
});
