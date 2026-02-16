import { chromium } from '@playwright/test';

(async () => {
  console.log('🔍 Verifico la pagina Items...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Cattura richieste API
  const apiRequests = [];
  page.on('request', request => {
    if (request.url().includes('/api/items')) {
      apiRequests.push({
        method: request.method(),
        url: request.url()
      });
      console.log('📤 API REQUEST:', request.method(), request.url());
    }
  });

  page.on('response', async response => {
    if (response.url().includes('/api/items')) {
      console.log('📥 API RESPONSE:', response.status(), response.url());
      try {
        const body = await response.json();
        console.log('   Response data:');
        console.log('   - Items count:', body.items?.length || 0);
        console.log('   - Total count:', body.totalCount);
        console.log('   - Source:', body.source);
        if (body.items && body.items.length > 0) {
          console.log('   - First item:', JSON.stringify(body.items[0], null, 2));
        }
      } catch (err) {
        const text = await response.text();
        console.log('   Body (text):', text.substring(0, 200));
      }
    }
  });

  try {
    console.log('📡 Caricamento http://localhost:3003/items ...');
    await page.goto('http://localhost:3003/items', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(3000);

    console.log('\n📸 Screenshot salvato: items-page-check.png');
    await page.screenshot({
      path: 'items-page-check.png',
      fullPage: true
    });

    // Verifica URL
    console.log('\n🔗 URL corrente:', page.url());

    // Conta elementi nella pagina
    const tables = await page.locator('table').count();
    const rows = await page.locator('[role="row"], tr').count();
    const listItems = await page.locator('li, .item, .product').count();

    console.log('\n📊 Elementi trovati:');
    console.log('   - Tabelle:', tables);
    console.log('   - Righe (tr/role=row):', rows);
    console.log('   - List items:', listItems);

    // Cerca messaggi di errore o vuoto
    const errorText = await page.locator('text=/error|errore|nessun|vuoto|empty|no items|no data/i').count();
    console.log('   - Messaggi errore/vuoto:', errorText);

    // Estrai testo visibile
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('\n📝 Contenuto pagina (primi 600 caratteri):');
    console.log(bodyText.substring(0, 600));

    console.log('\n📡 Richieste API /items effettuate:', apiRequests.length);
    apiRequests.forEach(req => {
      console.log('   -', req.method, req.url);
    });

    console.log('\n✅ Verifica completata!');

  } catch (error) {
    console.error('\n❌ ERRORE:', error.message);
  } finally {
    await browser.close();
  }
})();
