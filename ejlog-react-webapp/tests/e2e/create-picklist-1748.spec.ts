// ============================================================================
// TEST E2E - Creazione Pick List 1748 in stato ATTESA
// ============================================================================

import { test, expect } from '@playwright/test';

test.describe('Creazione Pick List 1748', () => {
  test.beforeEach(async ({ page }) => {
    // Vai alla pagina del wizard creazione lista
    await page.goto('http://localhost:8080/lists/create');
    await page.waitForLoadState('networkidle');
  });

  test('Deve mostrare ID Lista 1748 non modificabile', async ({ page }) => {
    // Verifica che il campo ID Lista sia presente
    const idListaInput = page.locator('input[value="1748"]');
    await expect(idListaInput).toBeVisible();

    // Verifica che sia disabilitato
    await expect(idListaInput).toBeDisabled();

    // Verifica il testo descrittivo
    await expect(page.getByText('ID lista assegnato automaticamente')).toBeVisible();
  });

  test('Deve creare lista in stato ATTESA con successo', async ({ page }) => {
    // Step 1: Informazioni Lista
    await expect(page.getByRole('heading', { name: 'Informazioni Lista' })).toBeVisible();

    // Verifica ID Lista 1748
    await expect(page.locator('input[value="1748"]')).toBeVisible();

    // Seleziona tipo lista (Picking)
    await page.selectOption('select', '0');

    // Inserisci descrizione
    await page.fill('input[placeholder*="Descrizione"]', 'Test Pick List 1748');

    // Imposta priorità
    await page.fill('input[type="number"][min="1"]', '5');

    // Vai al prossimo step
    await page.click('button:has-text("Successivo"), button:has-text("Avanti"), button:has-text("Next")');
    await page.waitForTimeout(500);

    // Step 2: Selezione Articoli
    await expect(page.getByRole('heading', { name: /Seleziona Articoli/i })).toBeVisible();

    // Seleziona almeno 2 articoli (click sulle prime 2 checkbox)
    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();

    if (count >= 2) {
      await checkboxes.nth(0).check();
      await checkboxes.nth(1).check();
    } else if (count === 1) {
      await checkboxes.first().check();
    }

    // Vai al prossimo step
    await page.click('button:has-text("Successivo"), button:has-text("Avanti"), button:has-text("Next")');
    await page.waitForTimeout(500);

    // Step 3: Quantità
    await expect(page.getByRole('heading', { name: /Imposta Quantità/i })).toBeVisible();

    // Le quantità di default sono 1, procedi
    await page.click('button:has-text("Successivo"), button:has-text("Avanti"), button:has-text("Next")');
    await page.waitForTimeout(500);

    // Step 4: Riepilogo
    await expect(page.getByRole('heading', { name: /Riepilogo/i })).toBeVisible();

    // Verifica ID Lista nel riepilogo
    await expect(page.locator('text=1748')).toBeVisible();

    // Verifica stato "In Attesa"
    await expect(page.locator('text=In Attesa')).toBeVisible();

    // Verifica tipo Picking
    await expect(page.locator('text=Picking')).toBeVisible();

    console.log('✅ Riepilogo verificato - ID Lista 1748, Stato: In Attesa');

    // Intercetta la chiamata API POST
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/item-lists') && response.request().method() === 'POST'
    );

    // Conferma creazione lista
    await page.click('button:has-text("Conferma"), button:has-text("Completa"), button:has-text("Crea")');

    // Attendi la risposta
    const response = await responsePromise;
    const status = response.status();

    console.log(`📤 Risposta API: Status ${status}`);

    if (status === 200 || status === 201) {
      const responseBody = await response.json();
      console.log('✅ Lista creata con successo:', responseBody);

      // Verifica toast di successo
      await expect(page.locator('text=/Lista.*1748.*creata.*ATTESA/i')).toBeVisible({ timeout: 5000 });

      console.log('✅ Toast di successo visualizzato');
    } else {
      const errorBody = await response.text();
      console.error(`❌ Errore creazione lista (Status ${status}):`, errorBody);
      throw new Error(`Creazione lista fallita con status ${status}`);
    }

    // Verifica redirect alla lista creata
    await page.waitForURL(/\/lists\/.*/, { timeout: 10000 });
    console.log('✅ Redirect alla pagina della lista completato');
  });

  test('Deve gestire errori di validazione', async ({ page }) => {
    // Step 1: Non compilare nulla

    // Prova ad andare avanti senza selezionare tipo lista
    await page.click('button:has-text("Successivo"), button:has-text("Avanti"), button:has-text("Next")');
    await page.waitForTimeout(500);

    // Step 2: Prova a procedere senza selezionare articoli
    await page.click('button:has-text("Successivo"), button:has-text("Avanti"), button:has-text("Next")');
    await page.waitForTimeout(500);

    await page.click('button:has-text("Successivo"), button:has-text("Avanti"), button:has-text("Next")');
    await page.waitForTimeout(500);

    // Step 4: Prova a confermare senza articoli
    const confirmButton = page.locator('button:has-text("Conferma"), button:has-text("Completa"), button:has-text("Crea")');

    if (await confirmButton.isVisible()) {
      await confirmButton.click();

      // Verifica messaggio di errore
      await expect(page.locator('text=/Seleziona almeno un articolo/i')).toBeVisible({ timeout: 3000 });
      console.log('✅ Validazione articoli funzionante');
    }
  });
});
