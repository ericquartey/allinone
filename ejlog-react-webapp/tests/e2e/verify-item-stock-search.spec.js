import { test, expect } from '@playwright/test';

test.describe('Item Stock Search Verification', () => {
  test('should display real stock data in item details page', async ({ page }) => {
    console.log('🚀 Starting item stock search verification...');

    // Naviga direttamente alla pagina dettagli articolo
    await page.goto('http://localhost:3004');
    console.log('📱 Navigated to home page');

    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/stock-01-home.png', fullPage: true });

    // Cerca il menu Articoli
    try {
      await page.click('text=Articoli', { timeout: 5000 });
      console.log('✅ Clicked on Articoli menu');
    } catch (e) {
      console.log('⚠️  Articoli menu not found, trying Items...');
      try {
        await page.click('text=Items', { timeout: 5000 });
      } catch (e2) {
        console.log('⚠️  No menu found, trying direct navigation');
      }
    }

    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/stock-02-items-list.png', fullPage: true });

    // Naviga alla pagina dettagli dell'articolo 001TEST (ID 133)
    console.log('📦 Navigating to item details page for ID 133...');

    try {
      // Prova a cliccare su un link o pulsante che porta ai dettagli
      const detailsLink = page.locator('a[href*="/items/133"]').first();
      const hasLink = await detailsLink.count();

      if (hasLink > 0) {
        await detailsLink.click();
        console.log('✅ Clicked on item details link');
      } else {
        // Naviga direttamente
        await page.goto('http://localhost:3004/items/133');
        console.log('✅ Navigated directly to item details');
      }
    } catch (e) {
      console.log('⚠️  Error clicking link, navigating directly');
      await page.goto('http://localhost:3004/items/133');
    }

    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/stock-03-item-details.png', fullPage: true });

    // Verifica il contenuto della pagina
    const bodyText = await page.textContent('body');
    console.log('📄 Page loaded, checking content...');

    // Cerca sezioni di stock/giacenze
    const hasStock = bodyText.includes('giacenze') ||
                     bodyText.includes('stock') ||
                     bodyText.includes('Stock') ||
                     bodyText.includes('Giacenze') ||
                     bodyText.includes('Ubicazioni') ||
                     bodyText.includes('Location');

    console.log('📊 Stock section found:', hasStock);

    // Cerca i dati specifici che sappiamo essere presenti
    const hasLocPostPTL = bodyText.includes('Loc. POST-PTL') || bodyText.includes('POST-PTL');
    const hasVertimag = bodyText.includes('Vertimag 1') || bodyText.includes('Vertimag');

    console.log('📍 Location "Loc. POST-PTL" found:', hasLocPostPTL);
    console.log('📍 Location "Vertimag 1" found:', hasVertimag);

    // Cerca elementi UI per giacenze
    const stockButtons = await page.locator('button:has-text("giacenze"), button:has-text("Stock"), button:has-text("Ricerca")').count();
    const stockTabs = await page.locator('[role="tab"]:has-text("giacenze"), [role="tab"]:has-text("Stock")').count();
    const stockSections = await page.locator('[class*="stock"], [class*="giacenze"], [class*="inventory"]').count();

    console.log(`🔍 Found: ${stockButtons} stock buttons, ${stockTabs} stock tabs, ${stockSections} stock sections`);

    // Se ci sono pulsanti/tab per giacenze, prova a cliccarli
    if (stockButtons > 0) {
      try {
        await page.click('button:has-text("giacenze"), button:has-text("Stock"), button:has-text("Ricerca")');
        console.log('✅ Clicked on stock button');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'screenshots/stock-04-after-click.png', fullPage: true });
      } catch (e) {
        console.log('⚠️  Could not click stock button');
      }
    } else if (stockTabs > 0) {
      try {
        await page.click('[role="tab"]:has-text("giacenze"), [role="tab"]:has-text("Stock")');
        console.log('✅ Clicked on stock tab');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'screenshots/stock-05-after-tab-click.png', fullPage: true });
      } catch (e) {
        console.log('⚠️  Could not click stock tab');
      }
    }

    // Controlla gli elementi della pagina
    const tables = await page.locator('table').count();
    const rows = await page.locator('tr').count();
    const cards = await page.locator('[class*="card"]').count();

    console.log(`📊 Page elements: ${tables} tables, ${rows} rows, ${cards} cards`);

    // Screenshot finale
    await page.screenshot({ path: 'screenshots/stock-06-final.png', fullPage: true });

    // Cerca nel body se ci sono numeri che potrebbero essere quantità
    const quantityMatches = bodyText.match(/quantit[àa].*?(\d+)/gi);
    if (quantityMatches) {
      console.log('📊 Quantity indicators found:', quantityMatches.slice(0, 5));
    }

    // Test finale: verifica che ci siano almeno alcuni dati
    console.log('\n✅ Stock search verification completed!');
    console.log('📸 Check screenshots in screenshots/ directory');
    console.log('📊 Expected: Stock data for item 133 should be visible');

    // Assertion: almeno una delle ubicazioni dovrebbe essere visibile
    expect(hasLocPostPTL || hasVertimag).toBe(true);
  });
});
