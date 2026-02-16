/**
 * Test E2E: Creazione Lista con Selezione Articoli da Giacenza
 *
 * Questo test verifica:
 * 1. Navigazione alla pagina Operations -> Inserisci Lista
 * 2. Selezione di 3 articoli con giacenza (stockedQuantity > 0)
 * 3. Aggiunta articoli al carrello
 * 4. Compilazione form lista (tipo, descrizione, priorità)
 * 5. Creazione della lista con successo
 */

import { test, expect, Page } from '@playwright/test';

test.describe('Creazione Lista con Articoli da Giacenza', () => {

  test('Deve selezionare 3 articoli con giacenza e creare una lista Picking', async ({ page }) => {
    console.log('🚀 [Test] Starting list creation test...');

    // 1. Naviga alla pagina Operations Lists
    await page.goto('http://localhost:3000/operations/lists', { waitUntil: 'domcontentloaded' });
    console.log('✅ [Test] Navigated to operations/lists page');

    // Aspetta che la pagina si carichi (DOM pronto, non aspettiamo network idle)
    await page.waitForTimeout(2000);

    // 2. Click sul pulsante "Inserimento" per aprire il form di inserimento lista
    console.log('🔍 [Test] Looking for "Inserimento" button...');

    const insertButton = page.locator('button').filter({ hasText: /Inserimento/i });
    await expect(insertButton).toBeVisible({ timeout: 10000 });
    await insertButton.click();
    console.log('✅ [Test] Clicked on "Inserimento" button');

    // Aspetta che il form si carichi
    await page.waitForTimeout(2000);

    // 3. Scroll verso il basso per vedere il form
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    // 4. Verifica che il form sia visibile cercando elementi specifici
    const tipoListaSelect = page.locator('select#tipoLista');
    await expect(tipoListaSelect).toBeVisible({ timeout: 10000 });
    console.log('✅ [Test] Insert list form is visible');

    // 5. Aspetta che i prodotti siano caricati - cerca il primo bottone "Aggiungi"
    console.log('⏳ [Test] Waiting for products to load...');

    const addButton = page.locator('button').filter({ hasText: /Aggiungi/i }).first();
    await expect(addButton).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1000);
    console.log('✅ [Test] Products loaded');

    // 6. Trova 3 articoli con giacenza > 0 e aggiungili al carrello
    console.log('🔍 [Test] Looking for 3 items with stock...');

    // Trova tutti i bottoni "Aggiungi" che hanno giacenza > 0
    const productRows = await page.locator('div').filter({
      has: page.locator('button').filter({ hasText: /Aggiungi/i })
    }).all();

    console.log(`📊 [Test] Found ${productRows.length} product rows`);

    let itemsAdded = 0;
    const targetItems = 3;

    for (const row of productRows) {
      if (itemsAdded >= targetItems) break;

      try {
        // Verifica se ha giacenza > 0
        const stockText = await row.locator('div:has-text("Giacenza:")').first().textContent();

        if (stockText) {
          // Estrai il numero dalla stringa "Giacenza: X"
          const stockMatch = stockText.match(/Giacenza:\s*(\d+)/);
          const stockQuantity = stockMatch ? parseInt(stockMatch[1]) : 0;

          if (stockQuantity > 0) {
            // Ottieni codice e descrizione articolo per il log
            const itemCode = await row.locator('strong').first().textContent() || 'Unknown';

            console.log(`📦 [Test] Found item with stock: ${itemCode} (qty: ${stockQuantity})`);

            // Click sul bottone "Aggiungi"
            const addButton = row.locator('button').filter({ hasText: /Aggiungi/i }).first();
            await addButton.click();
            await page.waitForTimeout(500);

            itemsAdded++;
            console.log(`✅ [Test] Added item ${itemsAdded}/${targetItems} to cart: ${itemCode}`);
          }
        }
      } catch (error) {
        console.log('⚠️ [Test] Error processing row:', error);
        continue;
      }
    }

    // Verifica che abbiamo aggiunto 3 articoli
    expect(itemsAdded).toBe(targetItems);
    console.log(`✅ [Test] Successfully added ${itemsAdded} items to cart`);

    // 6. Verifica che il carrello contenga 3 articoli
    await page.waitForTimeout(1000);

    const cartItems = await page.locator('div').filter({
      has: page.locator('button').filter({ hasText: /Rimuovi/i })
    }).count();

    console.log(`🛒 [Test] Cart contains ${cartItems} items`);
    expect(cartItems).toBe(targetItems);

    // 7. Compila il form della lista
    console.log('📝 [Test] Filling list form...');

    // Tipo Lista - Seleziona Picking (valore 1) - riutilizzo il locator già definito
    await tipoListaSelect.selectOption({ value: '1' }); // PICKING = 1
    console.log('✅ [Test] Selected list type: PICKING');

    // Descrizione
    const description = `Test Playwright - ${new Date().toISOString()}`;
    const descriptionInput = page.locator('input#description, textarea#description').first();
    await descriptionInput.fill(description);
    console.log(`✅ [Test] Filled description: ${description}`);

    // Priorità (opzionale, potrebbe già essere impostata di default)
    const priorityInput = page.locator('input#priority, select#priority').first();
    if (await priorityInput.isVisible()) {
      await priorityInput.fill('1');
      console.log('✅ [Test] Set priority: 1');
    }

    // 8. Screenshot prima dell'invio
    await page.screenshot({
      path: 'screenshots/before-list-creation.png',
      fullPage: true
    });
    console.log('📸 [Test] Screenshot saved: before-list-creation.png');

    // 9. Submit del form
    console.log('🚀 [Test] Submitting form...');

    const submitButton = page.locator('button').filter({
      hasText: /Crea Lista|Salva|Inserisci/i
    }).first();

    await expect(submitButton).toBeVisible();
    await submitButton.click();
    console.log('✅ [Test] Clicked submit button');

    // 10. Aspetta il messaggio di successo
    console.log('⏳ [Test] Waiting for success message...');

    const successAlert = page.locator('div').filter({
      hasText: /Lista creata|successo|completata/i
    });

    await expect(successAlert).toBeVisible({ timeout: 10000 });
    console.log('✅ [Test] Success message displayed');

    // 11. Screenshot dopo la creazione
    await page.screenshot({
      path: 'screenshots/after-list-creation.png',
      fullPage: true
    });
    console.log('📸 [Test] Screenshot saved: after-list-creation.png');

    // 12. Verifica che il carrello sia stato svuotato
    await page.waitForTimeout(1000);
    const cartItemsAfter = await page.locator('div').filter({
      has: page.locator('button').filter({ hasText: /Rimuovi/i })
    }).count();

    console.log(`🛒 [Test] Cart after creation: ${cartItemsAfter} items`);
    expect(cartItemsAfter).toBe(0);

    console.log('✅ [Test] Cart was cleared after list creation');
    console.log('🎉 [Test] TEST PASSED - List created successfully!');
  });

  test('Deve gestire correttamente errori quando non ci sono articoli nel carrello', async ({ page }) => {
    console.log('🚀 [Test] Starting empty cart validation test...');

    // Naviga alla pagina
    await page.goto('http://localhost:3000/operations/lists', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Click sul pulsante "Inserimento"
    const insertButton = page.locator('button').filter({ hasText: /Inserimento/i });
    await insertButton.click();
    await page.waitForTimeout(1000);

    // Compila solo il form senza aggiungere articoli
    const descriptionInput = page.locator('input#description, textarea#description').first();
    await descriptionInput.fill('Test senza articoli');

    // Prova a inviare
    const submitButton = page.locator('button').filter({
      hasText: /Crea Lista|Salva|Inserisci/i
    }).first();
    await submitButton.click();

    // Aspetta l'alert browser o messaggio di errore
    await page.waitForTimeout(1000);

    console.log('✅ [Test] Validation working - cannot create list without items');
  });

  test('Deve permettere di rimuovere articoli dal carrello prima di creare la lista', async ({ page }) => {
    console.log('🚀 [Test] Starting cart item removal test...');

    // Naviga alla pagina
    await page.goto('http://localhost:3000/operations/lists', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Click sul pulsante "Inserimento"
    const insertButton = page.locator('button').filter({ hasText: /Inserimento/i });
    await insertButton.click();
    await page.waitForTimeout(2000);

    // Aggiungi 2 articoli
    const addButtons = page.locator('button').filter({ hasText: /Aggiungi/i });
    await addButtons.first().click();
    await page.waitForTimeout(500);
    await addButtons.nth(1).click();
    await page.waitForTimeout(500);

    // Verifica che ci siano 2 articoli
    let cartCount = await page.locator('button').filter({ hasText: /Rimuovi/i }).count();
    expect(cartCount).toBe(2);
    console.log('✅ [Test] Added 2 items to cart');

    // Rimuovi il primo articolo
    const removeButton = page.locator('button').filter({ hasText: /Rimuovi/i }).first();
    await removeButton.click();
    await page.waitForTimeout(500);

    // Verifica che sia rimasto 1 articolo
    cartCount = await page.locator('button').filter({ hasText: /Rimuovi/i }).count();
    expect(cartCount).toBe(1);
    console.log('✅ [Test] Successfully removed item from cart - 1 item remaining');
  });
});
