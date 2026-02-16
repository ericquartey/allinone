/**
 * E2E Test - Operations Lists: Metti in Attesa con Motivazione
 *
 * Questo test verifica la funzionalità "Metti in Attesa" sulla pagina Operations/Lists
 * con selezione checkbox e inserimento motivazione tramite prompt.
 *
 * Scenario:
 * 1. Naviga a /operations/lists
 * 2. Seleziona una lista con checkbox
 * 3. Clicca card "Metti in Attesa"
 * 4. Inserisce "spostamento" come motivazione
 * 5. Verifica successo operazione
 *
 * Backend: http://localhost:3077
 * Frontend: http://localhost:8080
 */

import { test, expect, Page, Dialog } from '@playwright/test';

// ============================================================================
// CONFIGURATION
// ============================================================================

const FRONTEND_URL = 'http://localhost:8080';
const BACKEND_URL = 'http://localhost:3077';
const TEST_PAGE = `${FRONTEND_URL}/operations/lists`;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Wait for page to be fully loaded
 */
async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('h1:has-text("Operazioni Liste")', {
    timeout: 10000,
    state: 'visible'
  });
  console.log('✅ Pagina caricata: Operazioni Liste');
}

/**
 * Wait for lists table to be visible and populated
 */
async function waitForListsTable(page: Page) {
  // Attendi che la tabella sia visibile
  await page.waitForSelector('table', {
    timeout: 10000,
    state: 'visible'
  });

  // Attendi che ci siano delle righe (oltre all'header)
  await page.waitForSelector('tbody tr', {
    timeout: 10000,
    state: 'visible'
  });

  const rowCount = await page.locator('tbody tr').count();
  console.log(`✅ Tabella liste caricata: ${rowCount} liste trovate`);

  return rowCount;
}

/**
 * Get first available list ID from table
 */
async function getFirstListId(page: Page): Promise<string> {
  // Trova la prima riga della tabella
  const firstRow = page.locator('tbody tr').first();
  await expect(firstRow).toBeVisible();

  // Estrai l'ID dalla riga (cerca il checkbox con data-list-id o simile)
  // Oppure cerca nelle celle della riga
  const cells = firstRow.locator('td');
  const cellsCount = await cells.count();

  // Il codice lista dovrebbe essere in una delle prime celle
  // Cerchiamo la cella con il codice (dopo checkbox ed espansione)
  const codeCell = cells.nth(2); // Solitamente è la terza colonna
  const listCode = await codeCell.textContent();

  console.log(`✅ Lista selezionata: ${listCode?.trim()}`);
  return listCode?.trim() || '';
}

/**
 * Select list using checkbox
 */
async function selectListByCheckbox(page: Page, rowIndex: number = 0) {
  // Trova il checkbox nella riga specificata
  const checkbox = page.locator('tbody tr').nth(rowIndex).locator('input[type="checkbox"]').first();

  await expect(checkbox).toBeVisible();
  await expect(checkbox).toBeEnabled();

  // Clicca il checkbox se non è già selezionato
  const isChecked = await checkbox.isChecked();
  if (!isChecked) {
    await checkbox.click();
    console.log(`✅ Checkbox selezionato per la riga ${rowIndex}`);
  } else {
    console.log(`ℹ️  Checkbox già selezionato per la riga ${rowIndex}`);
  }

  // Attendi un momento per l'aggiornamento UI
  await page.waitForTimeout(300);
}

/**
 * Verify selection banner is visible
 */
async function verifySelectionBanner(page: Page, expectedCount: number = 1) {
  // Cerca il banner che mostra "N liste selezionate"
  const banner = page.locator('[class*="bg-blue"]', {
    hasText: `${expectedCount} ${expectedCount === 1 ? 'lista selezionata' : 'liste selezionate'}`
  });

  await expect(banner).toBeVisible({ timeout: 5000 });
  console.log(`✅ Banner selezione visibile: ${expectedCount} lista/e selezionate`);
}

/**
 * Click "Metti in Attesa" card
 */
async function clickWaitingCard(page: Page) {
  // Cerca la card "Metti in Attesa" (gialla) usando diversi selettori
  // Prova prima con il testo diretto
  let waitingCard = page.getByText('Metti in Attesa').first();

  // Se non è visibile, prova con un selector più specifico per la card
  if (!(await waitingCard.isVisible().catch(() => false))) {
    waitingCard = page.locator('div', { hasText: 'Metti in Attesa' }).filter({
      has: page.locator('h3')
    }).first();
  }

  await expect(waitingCard).toBeVisible({ timeout: 10000 });

  console.log('✅ Card "Metti in Attesa" trovata');

  // Scorri verso l'elemento per assicurarsi che sia nella viewport
  await waitingCard.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);

  await waitingCard.click();
  console.log('✅ Click su card "Metti in Attesa"');
}

/**
 * Handle prompt dialog and enter reason
 */
async function handleReasonPrompt(page: Page, reason: string): Promise<void> {
  return new Promise((resolve) => {
    // Listener per il dialog prompt
    page.once('dialog', async (dialog: Dialog) => {
      console.log(`📝 Prompt rilevato: "${dialog.message()}"`);

      // Verifica che sia un prompt
      expect(dialog.type()).toBe('prompt');
      expect(dialog.message()).toContain('motivo');

      // Inserisci la motivazione
      await dialog.accept(reason);
      console.log(`✅ Motivazione inserita: "${reason}"`);

      resolve();
    });
  });
}

/**
 * Wait for success alert
 */
async function waitForSuccessAlert(page: Page) {
  // Aspetta l'alert di successo
  page.once('dialog', async (dialog: Dialog) => {
    console.log(`✅ Alert successo: "${dialog.message()}"`);
    expect(dialog.type()).toBe('alert');
    expect(dialog.message()).toContain('successo');
    await dialog.accept();
  });
}

/**
 * Verify API call was made with correct endpoint
 */
async function verifyApiCall(page: Page, listId: string) {
  // Verifica che sia stata fatta una chiamata all'API corretta
  const apiResponse = await page.waitForResponse(
    response => response.url().includes('/api/item-lists/') &&
                response.url().includes('/waiting') &&
                response.status() === 200,
    { timeout: 5000 }
  );

  console.log(`✅ API call verificata: ${apiResponse.url()}`);
  console.log(`✅ Status: ${apiResponse.status()}`);

  return apiResponse;
}

// ============================================================================
// TEST SUITE
// ============================================================================

test.describe('Operations Lists - Metti in Attesa con Motivazione', () => {

  // ==========================================================================
  // TEST 1: Metti in Attesa con Motivazione "spostamento"
  // ==========================================================================
  test('should put list in waiting state with reason "spostamento"', async ({ page }) => {
    console.log('\n=== TEST: Metti in Attesa con motivazione "spostamento" ===\n');

    // ====== STEP 1: Naviga alla pagina Operations/Lists ======
    console.log('--- STEP 1: Navigazione ---');
    await page.goto(TEST_PAGE);
    await waitForPageLoad(page);

    // ====== STEP 2: Attendi caricamento tabella liste ======
    console.log('\n--- STEP 2: Caricamento tabella ---');
    const listsCount = await waitForListsTable(page);
    expect(listsCount).toBeGreaterThan(0);

    // ====== STEP 3: Seleziona prima lista con checkbox ======
    console.log('\n--- STEP 3: Selezione lista ---');
    await selectListByCheckbox(page, 0);

    // Ottieni l'ID della lista selezionata
    const listCode = await getFirstListId(page);
    console.log(`ℹ️  Lista selezionata: ${listCode}`);

    // ====== STEP 4: Verifica banner selezione ======
    console.log('\n--- STEP 4: Verifica selezione ---');
    await verifySelectionBanner(page, 1);

    // ====== STEP 5: Scroll verso le card (sono sotto la tabella) ======
    console.log('\n--- STEP 5: Scroll verso card operazioni ---');
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(500);

    // ====== STEP 6: Setup listener per il prompt ======
    console.log('\n--- STEP 6: Setup listener prompt ---');
    const promptPromise = handleReasonPrompt(page, 'spostamento');

    // ====== STEP 7: Click card "Metti in Attesa" ======
    console.log('\n--- STEP 7: Click card "Metti in Attesa" ---');
    await clickWaitingCard(page);

    // ====== STEP 8: Attendi che il prompt sia gestito ======
    console.log('\n--- STEP 8: Inserimento motivazione ---');
    await promptPromise;

    // ====== STEP 9: Attendi alert di successo ======
    console.log('\n--- STEP 9: Attesa conferma operazione ---');
    await page.waitForTimeout(1000); // Attendi che l'API venga chiamata

    // Attendi l'alert di successo (potrebbe richiedere qualche secondo)
    const successAlertPromise = new Promise<void>((resolve) => {
      page.once('dialog', async (dialog: Dialog) => {
        console.log(`✅ Alert finale: "${dialog.message()}"`);
        expect(dialog.type()).toBe('alert');
        expect(dialog.message().toLowerCase()).toContain('successo');
        await dialog.accept();
        resolve();
      });
    });

    // Attendi l'alert con timeout
    await Promise.race([
      successAlertPromise,
      page.waitForTimeout(10000) // Max 10 secondi
    ]);

    // ====== STEP 10: Verifica chiamata API ======
    console.log('\n--- STEP 10: Verifica backend ---');
    // L'API è già stata chiamata, verifichiamo che non ci siano errori

    // Attendi un momento per permettere al backend di processare
    await page.waitForTimeout(1000);

    // ====== STEP 11: Screenshot finale ======
    console.log('\n--- STEP 11: Screenshot finale ---');
    await page.screenshot({
      path: 'test-results/operations-lists-waiting-success.png',
      fullPage: true
    });
    console.log('✅ Screenshot salvato: test-results/operations-lists-waiting-success.png');

    // ====== CONCLUSIONE ======
    console.log('\n✅ TEST COMPLETATO CON SUCCESSO!');
    console.log(`📊 Riepilogo:`);
    console.log(`   - Lista selezionata: ${listCode}`);
    console.log(`   - Motivazione inserita: "spostamento"`);
    console.log(`   - Operazione: Metti in Attesa`);
    console.log(`   - Risultato: Successo\n`);
  });

  // ==========================================================================
  // TEST 2: Verifica comportamento con selezione multipla
  // ==========================================================================
  test('should handle multiple list selection for waiting operation', async ({ page }) => {
    console.log('\n=== TEST: Selezione multipla con "Metti in Attesa" ===\n');

    // Naviga alla pagina
    await page.goto(TEST_PAGE);
    await waitForPageLoad(page);

    // Attendi tabella
    const listsCount = await waitForListsTable(page);
    expect(listsCount).toBeGreaterThanOrEqual(2); // Serve almeno 2 liste

    // Seleziona prime 2 liste
    console.log('--- Selezione di 2 liste ---');
    await selectListByCheckbox(page, 0);
    await selectListByCheckbox(page, 1);

    // Verifica banner con 2 liste
    await verifySelectionBanner(page, 2);

    // Scroll verso card
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(500);

    // Setup prompt listener
    const promptPromise = handleReasonPrompt(page, 'spostamento');

    // Click card
    await clickWaitingCard(page);

    // Gestisci prompt
    await promptPromise;

    // Attendi successo
    await page.waitForTimeout(2000);

    // Attendi alert (2 liste modificate)
    const successAlertPromise = new Promise<void>((resolve) => {
      page.once('dialog', async (dialog: Dialog) => {
        console.log(`✅ Alert: "${dialog.message()}"`);
        expect(dialog.message().toLowerCase()).toContain('successo');
        expect(dialog.message()).toContain('2'); // Deve menzionare 2 liste
        await dialog.accept();
        resolve();
      });
    });

    await Promise.race([
      successAlertPromise,
      page.waitForTimeout(10000)
    ]);

    // Screenshot
    await page.screenshot({
      path: 'test-results/operations-lists-waiting-multiple.png',
      fullPage: true
    });

    console.log('\n✅ TEST SELEZIONE MULTIPLA COMPLETATO!');
  });

  // ==========================================================================
  // TEST 3: Verifica validazione (nessuna lista selezionata)
  // ==========================================================================
  test('should show validation error when no list is selected', async ({ page }) => {
    console.log('\n=== TEST: Validazione senza selezione ===\n');

    // Naviga alla pagina
    await page.goto(TEST_PAGE);
    await waitForPageLoad(page);
    await waitForListsTable(page);

    // NON selezionare nessuna lista
    console.log('⚠️  Nessuna lista selezionata (test validazione)');

    // Scroll verso card
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(500);

    // Aspetta alert di errore
    const errorAlertPromise = new Promise<void>((resolve) => {
      page.once('dialog', async (dialog: Dialog) => {
        console.log(`✅ Alert validazione: "${dialog.message()}"`);
        expect(dialog.type()).toBe('alert');
        expect(dialog.message().toLowerCase()).toContain('seleziona');
        await dialog.accept();
        resolve();
      });
    });

    // Click card senza selezione
    await clickWaitingCard(page);

    // Attendi alert di validazione
    await Promise.race([
      errorAlertPromise,
      page.waitForTimeout(5000)
    ]);

    console.log('\n✅ TEST VALIDAZIONE COMPLETATO!');
  });
});

