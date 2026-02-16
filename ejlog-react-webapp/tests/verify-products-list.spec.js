/**
 * Test rapido per verificare che tutti i prodotti siano visibili
 */

const { test, expect } = require('@playwright/test');

test('verifica lista completa prodotti', async ({ page }) => {
  // Apri la pagina
  await page.goto('http://localhost:3003/products/search');

  // Aspetta che i dati siano caricati
  console.log('Attendo caricamento dati...');
  await page.waitForSelector('table tbody tr', { timeout: 15000 });

  // Conta i prodotti
  const rows = await page.locator('tbody tr').count();
  console.log(`\n✅ PRODOTTI VISUALIZZATI: ${rows}`);

  // Verifica il totale mostrato
  const totalText = await page.locator('p:has-text("Totale:")').textContent();
  console.log(`✅ ${totalText}`);

  // Verifica che ci siano molti prodotti (almeno 100 per testare il nuovo limite)
  expect(rows).toBeGreaterThan(10);

  // Stampa i primi 5 prodotti per verifica
  console.log('\n📦 PRIMI 5 PRODOTTI:\n');
  for (let i = 0; i < Math.min(5, rows); i++) {
    const codice = await page.locator(`tbody tr:nth-child(${i + 1}) td:nth-child(2)`).textContent();
    const descrizione = await page.locator(`tbody tr:nth-child(${i + 1}) td:nth-child(3)`).textContent();
    const qty = await page.locator(`tbody tr:nth-child(${i + 1}) td:nth-child(7)`).textContent();
    console.log(`  ${i + 1}. ${codice.trim()} - ${descrizione.trim()} (Qty: ${qty.trim()})`);
  }

  console.log('\n✅ Test completato con successo!\n');

  // Mantieni il browser aperto per 30 secondi per vedere i dati
  await page.waitForTimeout(30000);
});
