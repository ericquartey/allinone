import { test, expect } from '@playwright/test';

test('Debug Lists Page - Check real data', async ({ page }) => {
  console.log('🌐 Navigating to http://localhost:8088/lists...');

  // Intercetta le richieste di rete
  page.on('request', request => {
    if (request.url().includes('/api/lists')) {
      console.log('📤 REQUEST:', request.method(), request.url());
    }
  });

  page.on('response', async response => {
    if (response.url().includes('/api/lists')) {
      console.log('📥 RESPONSE:', response.status(), response.url());
      try {
        const data = await response.json();
        console.log('📊 RESPONSE DATA:', JSON.stringify(data, null, 2));
      } catch (e) {
        console.log('❌ Failed to parse response JSON');
      }
    }
  });

  // Ascolta i log della console del browser
  page.on('console', msg => {
    const text = msg.text();
    console.log('🖥️  BROWSER LOG:', text);
  });

  // Vai alla pagina
  await page.goto('http://localhost:8088/lists', { waitUntil: 'networkidle' });

  // Aspetta un po' per vedere i log
  await page.waitForTimeout(2000);

  // Controlla se ci sono righe nella tabella
  const tableRows = await page.locator('table tbody tr').count();
  console.log(`📋 Table rows found: ${tableRows}`);

  // Prendi screenshot
  await page.screenshot({
    path: 'C:\\F_WMS\\dev\\workspacesEjlog\\EjLog\\documentazioni\\ejlog-react-webapp\\tests\\screenshots\\lists-debug.png',
    fullPage: true
  });
  console.log('📸 Screenshot saved');

  // Controlla se ci sono errori visibili
  const errorMessages = await page.locator('text=/error|errore/i').count();
  console.log(`❌ Error messages visible: ${errorMessages}`);

  // Verifica che ci siano le 2 liste
  if (tableRows === 0) {
    console.log('⚠️  WARNING: No table rows found!');

    // Controlla se la tabella esiste
    const tableExists = await page.locator('table').count();
    console.log(`Table exists: ${tableExists > 0 ? 'YES' : 'NO'}`);

    // Controlla se c'è un messaggio di loading
    const loadingVisible = await page.locator('text=/loading|caricamento/i').count();
    console.log(`Loading message visible: ${loadingVisible > 0 ? 'YES' : 'NO'}`);
  } else {
    console.log(`✅ Found ${tableRows} rows in table`);

    // Leggi i dati delle righe
    for (let i = 0; i < tableRows; i++) {
      const row = page.locator('table tbody tr').nth(i);
      const cells = await row.locator('td').allTextContents();
      console.log(`Row ${i + 1}:`, cells);
    }
  }

  // Aspetta ancora un po' prima di chiudere
  await page.waitForTimeout(1000);
});
