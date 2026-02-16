import { test, expect } from '@playwright/test';

test('Debug Stock API calls', async ({ page }) => {
  const apiCalls: any[] = [];

  // Intercetta TUTTE le richieste HTTP
  page.on('request', request => {
    const url = request.url();
    console.log(`[REQUEST] ${request.method()} ${url}`);
  });

  page.on('response', async response => {
    const url = response.url();
    const status = response.status();

    // Log di tutte le risposte
    console.log(`[RESPONSE] ${status} ${url}`);

    // Salva chiamate che contengono Stock
    if (url.includes('Stock') || url.includes('stock') || url.includes('EjLogHost')) {
      try {
        const body = await response.text();
        apiCalls.push({
          url,
          status,
          method: response.request().method(),
          body: body.substring(0, 500)
        });
        console.log(`[API-DATA] ${url}`);
        console.log(`[API-BODY] ${body.substring(0, 200)}`);
      } catch (e) {
        console.log(`[API-ERROR] Cannot read body: ${e}`);
      }
    }
  });

  // Intercetta errori console
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`[CONSOLE-ERROR] ${msg.text()}`);
    }
  });

  console.log('\n=== STEP 1: Navigazione a /stock ===');
  await page.goto('http://localhost:8080/stock');
  await page.waitForLoadState('networkidle');

  console.log('\n=== STEP 2: Screenshot pagina iniziale ===');
  await page.screenshot({ path: 'tests/e2e/screenshots/debug-01-initial.png', fullPage: true });

  console.log('\n=== STEP 3: Compilazione filtro ID Magazzino = 1 ===');
  // Trova il campo ID Magazzino (è il secondo input number)
  const inputs = await page.locator('input[type="number"]').all();
  console.log(`Trovati ${inputs.length} campi numerici`);

  if (inputs.length > 0) {
    await inputs[0].fill('1');
    console.log('Compilato ID Magazzino = 1');
  }

  await page.screenshot({ path: 'tests/e2e/screenshots/debug-02-filled.png', fullPage: true });

  console.log('\n=== STEP 4: Click su pulsante Cerca ===');
  const searchButtons = await page.locator('button:has-text("Cerca")').all();
  console.log(`Trovati ${searchButtons.length} pulsanti Cerca`);

  if (searchButtons.length > 0) {
    await searchButtons[0].click();
    console.log('Cliccato su Cerca');
  }

  // Aspetta 5 secondi per vedere le chiamate API
  await page.waitForTimeout(5000);

  console.log('\n=== STEP 5: Screenshot dopo ricerca ===');
  await page.screenshot({ path: 'tests/e2e/screenshots/debug-03-after-search.png', fullPage: true });

  console.log('\n=== RISULTATI API CALLS ===');
  console.log(`Totale chiamate API Stock: ${apiCalls.length}`);
  apiCalls.forEach((call, index) => {
    console.log(`\n[${index + 1}] ${call.method} ${call.url}`);
    console.log(`    Status: ${call.status}`);
    console.log(`    Body: ${call.body}`);
  });

  // Conta righe tabella
  const tableRows = await page.locator('tbody tr').count();
  console.log(`\n=== Righe in tabella: ${tableRows} ===`);

  // Verifica contenuto prima riga
  if (tableRows > 0) {
    const firstRowText = await page.locator('tbody tr').first().textContent();
    console.log(`Prima riga: ${firstRowText}`);
  }

  console.log('\n=== TEST COMPLETATO ===');
});
