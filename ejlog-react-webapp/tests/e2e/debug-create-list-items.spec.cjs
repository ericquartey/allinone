// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Test per debuggare e risolvere il problema degli articoli non visibili
 * nella pagina CreateListTouchPage - tab "Seleziona Articoli"
 */

test.describe('Debug CreateListTouchPage - Articoli', () => {
  test.beforeEach(async ({ page }) => {
    // Intercetta richieste API per debug
    page.on('request', request => {
      if (request.url().includes('/items')) {
        console.log('📤 REQUEST:', request.method(), request.url());
      }
    });

    page.on('response', async response => {
      if (response.url().includes('/items')) {
        console.log('📥 RESPONSE:', response.status(), response.url());
        try {
          const json = await response.json();
          console.log('📦 DATA:', JSON.stringify(json, null, 2).substring(0, 500));
        } catch (e) {
          console.log('❌ Error parsing response:', e.message);
        }
      }
    });

    // Intercetta errori console
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('🔴 CONSOLE ERROR:', msg.text());
      }
    });

    // Vai alla pagina
    await page.goto('http://localhost:3000/operations/lists/touch/create');
    await page.waitForLoadState('networkidle');
  });

  test('Verifica caricamento e visualizzazione articoli', async ({ page }) => {
    console.log('\n🔍 STEP 1: Verifica struttura pagina');

    // Verifica che la pagina sia caricata
    await expect(page.locator('text=Nuova Lista')).toBeVisible();
    console.log('✅ Header pagina visibile');

    // Attendi un po' per il rendering iniziale
    await page.waitForTimeout(1000);

    console.log('\n🔍 STEP 2: Clicca tab Info e compila form');

    // Verifica tab Info sia visibile
    const infoTab = page.locator('text=Informazioni Lista').first();
    await expect(infoTab).toBeVisible();
    console.log('✅ Tab Info visibile');

    // Seleziona tipo lista PICKING
    const pickingButton = page.locator('button:has-text("PICKING")').first();
    await pickingButton.click();
    console.log('✅ Tipo PICKING selezionato');

    // Inserisci descrizione
    const descriptionInput = page.locator('input[placeholder*="Inserisci descrizione"]');
    await descriptionInput.fill('Test Lista Debug Articoli');
    console.log('✅ Descrizione inserita');

    await page.waitForTimeout(500);

    console.log('\n🔍 STEP 3: Vai al tab Seleziona Articoli');

    // Clicca su "Seleziona Articoli" tab o bottone "Avanti"
    const nextButton = page.locator('button:has-text("Avanti")').first();
    await nextButton.click();
    console.log('✅ Cliccato su Avanti');

    await page.waitForTimeout(2000);

    console.log('\n🔍 STEP 4: Verifica presenza tab Seleziona Articoli');

    // Verifica che il tab sia attivo
    const itemsTabHeader = page.locator('text=Seleziona Articoli').first();
    await expect(itemsTabHeader).toBeVisible({ timeout: 10000 });
    console.log('✅ Header "Seleziona Articoli" visibile');

    console.log('\n🔍 STEP 5: Verifica campo ricerca');

    // Verifica campo ricerca
    const searchInput = page.locator('input[placeholder*="Cerca articolo"]');
    await expect(searchInput).toBeVisible();
    console.log('✅ Campo ricerca visibile');

    console.log('\n🔍 STEP 6: Attendi caricamento articoli');

    // Attendi che il loading scompaia
    await page.waitForTimeout(3000);

    // Verifica se c'è uno spinner
    const spinner = page.locator('svg.animate-spin');
    const spinnerVisible = await spinner.isVisible().catch(() => false);
    console.log(`📊 Spinner visibile: ${spinnerVisible}`);

    console.log('\n🔍 STEP 7: Verifica presenza articoli nella lista');

    // Cerca bottoni articolo
    const itemButtons = page.locator('button:has-text("001")').or(
      page.locator('button').filter({ hasText: /^\d+/ })
    );

    const itemCount = await itemButtons.count();
    console.log(`📊 Numero bottoni articolo trovati: ${itemCount}`);

    // Verifica messaggio "Nessun articolo trovato"
    const noItemsMessage = page.locator('text=Nessun articolo trovato');
    const noItemsVisible = await noItemsMessage.isVisible().catch(() => false);
    console.log(`📊 Messaggio "Nessun articolo" visibile: ${noItemsVisible}`);

    // Conta tutti i bottoni nella pagina
    const allButtons = page.locator('button');
    const allButtonsCount = await allButtons.count();
    console.log(`📊 Totale bottoni nella pagina: ${allButtonsCount}`);

    // Stampa il contenuto del tab articoli
    const itemsTabContent = page.locator('div.flex-1.overflow-y-auto');
    const tabHTML = await itemsTabContent.innerHTML().catch(() => 'N/A');
    console.log('\n📄 HTML del tab articoli (primi 1000 char):');
    console.log(tabHTML.substring(0, 1000));

    // Screenshot per debug
    await page.screenshot({
      path: 'screenshots/debug-create-list-items.png',
      fullPage: true
    });
    console.log('📸 Screenshot salvato in screenshots/debug-create-list-items.png');

    console.log('\n🔍 STEP 8: Verifica API /items');

    // Forza una nuova chiamata API cercando un articolo
    await searchInput.fill('001');
    await page.waitForTimeout(2000);

    // Verifica di nuovo gli articoli
    const itemCountAfterSearch = await itemButtons.count();
    console.log(`📊 Articoli dopo ricerca "001": ${itemCountAfterSearch}`);

    // Tenta di trovare qualsiasi elemento con codice articolo
    const anyItemCode = page.locator('[class*="font-bold"]:has-text("001")').or(
      page.locator('text=/^[0-9A-Z-]+$/').first()
    );
    const itemCodeVisible = await anyItemCode.isVisible().catch(() => false);
    console.log(`📊 Codice articolo visibile: ${itemCodeVisible}`);

    console.log('\n📊 RIEPILOGO DEBUG:');
    console.log(`  - Tab caricato: ✅`);
    console.log(`  - Campo ricerca: ✅`);
    console.log(`  - Spinner: ${spinnerVisible ? '🔄' : '✅'}`);
    console.log(`  - Articoli trovati: ${itemCount}`);
    console.log(`  - Messaggio "nessun articolo": ${noItemsVisible ? '⚠️' : '✅'}`);

    // Se non ci sono articoli, il test fallisce
    if (itemCount === 0 && !spinnerVisible) {
      console.error('\n❌ PROBLEMA: Nessun articolo caricato!');
      console.error('Possibili cause:');
      console.error('  1. API /items non risponde correttamente');
      console.error('  2. Trasformazione dati RTK Query errata');
      console.error('  3. Rendering condizionale nasconde gli articoli');
      console.error('  4. Problema con paginatedItems array');
    }

    // Aspettativa: dovrebbero esserci almeno 1 articolo
    expect(itemCount).toBeGreaterThan(0);
  });

  test('Test alternativo: verifica chiamata API diretta', async ({ page }) => {
    console.log('\n🔍 Test API diretta');

    // Vai direttamente al tab items con state già settato
    await page.goto('http://localhost:3000/operations/lists/touch/create');
    await page.waitForLoadState('networkidle');

    // Attendi e monitora le chiamate API
    const apiResponse = await page.waitForResponse(
      response => response.url().includes('/items') && response.status() === 200,
      { timeout: 10000 }
    ).catch(() => null);

    if (apiResponse) {
      console.log('✅ API /items ha risposto con successo');
      const data = await apiResponse.json();
      console.log('📦 Dati ricevuti:', JSON.stringify(data, null, 2).substring(0, 500));

      if (data.data && Array.isArray(data.data)) {
        console.log(`📊 Numero articoli nell'API: ${data.data.length}`);
      }
    } else {
      console.error('❌ API /items non ha risposto entro 10 secondi');
    }
  });
});
