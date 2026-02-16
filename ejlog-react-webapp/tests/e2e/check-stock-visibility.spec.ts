// ============================================================================
// TEST E2E - Verifica Visibilità Giacenze nella pagina Operations/Lists
// ============================================================================

import { test, expect } from '@playwright/test';

test.describe('Verifica Giacenze in Operations/Lists', () => {
  test.beforeEach(async ({ page }) => {
    // Vai alla pagina operations/lists
    await page.goto('http://localhost:8080/operations/lists');
    await page.waitForLoadState('networkidle');
  });

  test('Deve visualizzare articoli con giacenza disponibile', async ({ page }) => {
    console.log('📍 Navigazione a /operations/lists completata');

    // Attendi che la pagina carichi
    await page.waitForTimeout(2000);

    // Prendi screenshot iniziale
    await page.screenshot({ path: 'screenshots/operations-lists-initial.png', fullPage: true });
    console.log('📸 Screenshot iniziale salvato');

    // Cerca la tab "Inserimento Liste" o simile
    const tabSelectors = [
      'button:has-text("Inserimento")',
      'button:has-text("Inserisci")',
      'button:has-text("Nuova Lista")',
      '[role="tab"]:has-text("Inserimento")',
    ];

    let tabFound = false;
    for (const selector of tabSelectors) {
      const tab = page.locator(selector).first();
      if (await tab.isVisible().catch(() => false)) {
        console.log(`✅ Trovata tab con selettore: ${selector}`);
        await tab.click();
        await page.waitForTimeout(1000);
        tabFound = true;
        break;
      }
    }

    if (!tabFound) {
      console.log('⚠️ Tab inserimento non trovata, controllo se siamo già nella sezione giusta');
    }

    // Screenshot dopo click tab
    await page.screenshot({ path: 'screenshots/operations-lists-after-tab.png', fullPage: true });
    console.log('📸 Screenshot dopo selezione tab salvato');

    // Verifica presenza campo ID Lista 1748
    const idListaField = page.locator('input[value="1748"]');
    const isIdListaVisible = await idListaField.isVisible().catch(() => false);

    if (isIdListaVisible) {
      console.log('✅ Campo ID Lista 1748 visibile');
    } else {
      console.log('❌ Campo ID Lista 1748 NON visibile');
    }

    // Cerca la sezione articoli/giacenze
    const stockSelectors = [
      'text=Seleziona Articoli',
      'text=Articoli Disponibili',
      'text=Giacenze',
      'text=Stock',
      '[data-testid="stock-list"]',
      '[data-testid="items-list"]',
    ];

    let stockSectionFound = false;
    for (const selector of stockSelectors) {
      const section = page.locator(selector).first();
      if (await section.isVisible().catch(() => false)) {
        console.log(`✅ Trovata sezione giacenze con selettore: ${selector}`);
        stockSectionFound = true;
        break;
      }
    }

    if (!stockSectionFound) {
      console.log('⚠️ Sezione giacenze non trovata con i selettori standard');
    }

    // Verifica presenza articoli (checkbox, righe, etc)
    const articleIndicators = [
      'input[type="checkbox"]',
      'table tbody tr',
      '[class*="item"]',
      '[class*="stock"]',
    ];

    let articlesFound = false;
    for (const selector of articleIndicators) {
      const elements = page.locator(selector);
      const count = await elements.count();
      if (count > 0) {
        console.log(`✅ Trovati ${count} elementi con selettore: ${selector}`);
        articlesFound = true;

        // Mostra i primi 3 elementi
        for (let i = 0; i < Math.min(3, count); i++) {
          const text = await elements.nth(i).textContent();
          console.log(`   Elemento ${i + 1}: ${text?.substring(0, 100)}`);
        }
        break;
      }
    }

    if (!articlesFound) {
      console.log('❌ Nessun articolo/giacenza trovato');
    }

    // Verifica chiamate API
    console.log('\n📡 Verifica chiamate API...');

    // Intercetta chiamate stock/giacenze
    const stockApiCalls: string[] = [];
    page.on('response', response => {
      const url = response.url();
      if (url.includes('stock') || url.includes('Stock') || url.includes('giacenz')) {
        stockApiCalls.push(url);
        console.log(`📡 API chiamata: ${url} - Status: ${response.status()}`);
      }
    });

    // Ricarica per vedere le chiamate API
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log(`\n📊 Totale chiamate stock/giacenze: ${stockApiCalls.length}`);
    stockApiCalls.forEach((url, idx) => {
      console.log(`   ${idx + 1}. ${url}`);
    });

    // Screenshot finale
    await page.screenshot({ path: 'screenshots/operations-lists-final.png', fullPage: true });
    console.log('📸 Screenshot finale salvato');

    // Dump HTML per analisi
    const html = await page.content();
    const fs = require('fs');
    fs.writeFileSync('screenshots/operations-lists-page.html', html);
    console.log('💾 HTML salvato in screenshots/operations-lists-page.html');

    // Verifica finale
    expect(articlesFound).toBe(true);
  });

  test('Deve caricare giacenze da API Stock', async ({ page }) => {
    let stockApiCalled = false;
    let stockResponseStatus = 0;
    let stockResponseData: any = null;

    // Intercetta chiamata API Stock
    page.on('response', async response => {
      const url = response.url();
      if (url.includes('/Stock') || url.includes('/stock')) {
        stockApiCalled = true;
        stockResponseStatus = response.status();

        try {
          stockResponseData = await response.json();
          console.log(`\n📦 Risposta API Stock (${response.status()}):`);
          console.log(`   Items: ${stockResponseData?.items?.length || 0}`);
          console.log(`   Total: ${stockResponseData?.total || 0}`);

          if (stockResponseData?.items?.length > 0) {
            console.log(`\n   Primi 3 articoli:`);
            for (let i = 0; i < Math.min(3, stockResponseData.items.length); i++) {
              const item = stockResponseData.items[i];
              console.log(`   ${i + 1}. ${item.itemCode} - Qty: ${item.availableQuantity || item.quantity}`);
            }
          }
        } catch (e) {
          console.log(`   ⚠️ Errore parsing JSON: ${e}`);
        }
      }
    });

    // Naviga e attendi
    await page.goto('http://localhost:8080/operations/lists');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Verifica
    console.log(`\n✅ API Stock chiamata: ${stockApiCalled}`);
    console.log(`   Status: ${stockResponseStatus}`);
    console.log(`   Articoli ricevuti: ${stockResponseData?.items?.length || 0}`);

    expect(stockApiCalled).toBe(true);
    expect(stockResponseStatus).toBe(200);
    expect(stockResponseData?.items?.length).toBeGreaterThan(0);
  });
});
