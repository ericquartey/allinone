import { test, expect } from '@playwright/test';

test('Debug pagina gestione utenti', async ({ page }) => {
  console.log('\n🔍 Diagnostica Pagina Gestione Utenti\n');

  // Intercetta richieste API
  page.on('request', request => {
    if (request.url().includes('/api/') || request.url().includes('/EjLogHostVertimag/')) {
      console.log('📤 REQUEST:', request.method(), request.url());
    }
  });

  page.on('response', async response => {
    if (response.url().includes('/api/') || response.url().includes('/EjLogHostVertimag/')) {
      console.log('📥 RESPONSE:', response.status(), response.url());
      if (response.url().includes('User')) {
        try {
          const data = await response.json();
          console.log('📊 DATA:', JSON.stringify(data).substring(0, 200) + '...');
        } catch (e) {
          console.log('⚠️  Response non è JSON');
        }
      }
    }
  });

  // Intercetta errori console
  page.on('console', msg => {
    const type = msg.type();
    if (type === 'error' || type === 'warning') {
      console.log(`🔴 CONSOLE ${type.toUpperCase()}:`, msg.text());
    }
  });

  // Vai alla homepage
  console.log('1️⃣ Navigazione a http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  // Screenshot homepage
  await page.screenshot({ path: 'screenshot-homepage.png', fullPage: true });
  console.log('📸 Screenshot homepage salvato');

  // Attendi caricamento
  await page.waitForTimeout(2000);

  // Cerca link o bottone per gestione utenti
  console.log('\n2️⃣ Cerco link Gestione Utenti...');

  // Prova diversi selettori
  const possibleSelectors = [
    'text=Utenti',
    'text=Users',
    'text=Gestione Utenti',
    'a[href*="users"]',
    'a[href*="utenti"]',
    '[data-testid*="users"]',
    'nav a:has-text("Utenti")',
  ];

  let found = false;
  for (const selector of possibleSelectors) {
    const element = await page.locator(selector).first();
    if (await element.isVisible().catch(() => false)) {
      console.log(`✅ Trovato elemento: ${selector}`);
      await element.click();
      found = true;
      break;
    }
  }

  if (!found) {
    console.log('⚠️  Link utenti non trovato, provo navigazione diretta...');
    await page.goto('http://localhost:3000/users', { waitUntil: 'networkidle' });
  }

  await page.waitForTimeout(3000);

  // Screenshot pagina utenti
  await page.screenshot({ path: 'screenshot-users-page.png', fullPage: true });
  console.log('📸 Screenshot pagina utenti salvato');

  // Verifica presenza tabella/lista utenti
  console.log('\n3️⃣ Verifico presenza utenti nella pagina...');

  const pageContent = await page.content();

  // Cerca elementi comuni
  const tableExists = await page.locator('table').count();
  const listExists = await page.locator('ul, ol').count();
  const userCardExists = await page.locator('[class*="user"], [data-testid*="user"]').count();

  console.log(`📊 Elementi trovati:`);
  console.log(`   - Tabelle: ${tableExists}`);
  console.log(`   - Liste: ${listExists}`);
  console.log(`   - Card utenti: ${userCardExists}`);

  // Cerca testo specifico
  const hasAdminText = pageContent.includes('admin') || pageContent.includes('Admin');
  const hasUsersText = pageContent.includes('USERS') || pageContent.includes('users');

  console.log(`   - Contiene "admin": ${hasAdminText}`);
  console.log(`   - Contiene "users": ${hasUsersText}`);

  // Verifica errori
  const errorMessages = await page.locator('text=/error|errore|failed|impossibile/i').count();
  if (errorMessages > 0) {
    console.log(`\n⚠️  Trovati ${errorMessages} messaggi di errore nella pagina`);
    const errors = await page.locator('text=/error|errore|failed|impossibile/i').allTextContents();
    errors.forEach(err => console.log(`   - ${err}`));
  }

  // Verifica loading spinner
  const loadingExists = await page.locator('[class*="loading"], [class*="spinner"], [aria-busy="true"]').count();
  if (loadingExists > 0) {
    console.log(`\n⏳ Pagina ancora in caricamento (${loadingExists} loading indicators)`);
  }

  console.log('\n✅ Diagnostica completata');
});
