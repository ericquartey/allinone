// ============================================================================
// Test E2E - Touch Mode Feature
// Verifica funzionalità modalità touch screen
// ============================================================================

const { test, expect } = require('@playwright/test');

test.describe('Touch Mode Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Naviga alla home page
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('should enable touch mode from settings', async ({ page }) => {
    // 1. Vai alle impostazioni
    await page.click('text=Impostazioni');
    await page.waitForURL('**/settings**');

    // 2. Verifica che il toggle touch mode sia presente
    const touchModeSection = page.locator('text=Modalità Touch Screen');
    await expect(touchModeSection).toBeVisible();

    // 3. Clicca sul toggle per attivare touch mode
    const toggleButton = page.locator('button').filter({ has: page.locator('.transform.rounded-full') });
    await toggleButton.click();

    // 4. Verifica che appaia il messaggio di conferma
    await expect(page.locator('text=Modalità Touch attiva')).toBeVisible({ timeout: 5000 });

    // 5. Verifica che il toast di successo appaia
    const successToast = page.locator('text=Modalità Touch attivata');
    await expect(successToast).toBeVisible({ timeout: 3000 });
  });

  test('should redirect to touch page when touch mode is enabled', async ({ page }) => {
    // 1. Abilita touch mode
    await page.goto('http://localhost:3000/settings');
    const toggleButton = page.locator('button').filter({ has: page.locator('.transform.rounded-full') });
    await toggleButton.click();
    await page.waitForTimeout(1000);

    // 2. Naviga a /operations/lists
    await page.goto('http://localhost:3000/operations/lists');
    await page.waitForLoadState('networkidle');

    // 3. Verifica che sia stato reindirizzato a /operations/lists/touch
    await expect(page).toHaveURL(/.*\/operations\/lists\/touch/);
  });

  test('should display touch interface correctly', async ({ page }) => {
    // 1. Vai direttamente alla pagina touch
    await page.goto('http://localhost:3000/operations/lists/touch');
    await page.waitForLoadState('networkidle');

    // 2. Verifica presenza tab navigation
    await expect(page.locator('button:has-text("Liste")')).toBeVisible();
    await expect(page.locator('button:has-text("Esegui")')).toBeVisible();
    await expect(page.locator('button:has-text("Attesa")')).toBeVisible();
    await expect(page.locator('button:has-text("Termina")')).toBeVisible();
    await expect(page.locator('button:has-text("Terminate")')).toBeVisible();

    // 3. Verifica che i pulsanti siano grandi (touch-friendly)
    const listeButton = page.locator('button:has-text("Liste")').first();
    const buttonBox = await listeButton.boundingBox();
    expect(buttonBox.height).toBeGreaterThan(40); // Pulsanti touch > 44px raccomandato

    // 4. Verifica presenza contatori liste
    await expect(page.locator('text=In Esecuzione')).toBeVisible();
    await expect(page.locator('text=In Attesa')).toBeVisible();
    await expect(page.locator('text=Terminate')).toBeVisible();
  });

  test('should show terminated lists in separate tab', async ({ page }) => {
    // 1. Vai alla pagina touch
    await page.goto('http://localhost:3000/operations/lists/touch');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Attendi caricamento liste

    // 2. Clicca sul tab "Terminate"
    const terminatedTab = page.locator('button:has-text("Terminate")').last();
    await terminatedTab.click();
    await page.waitForTimeout(1000);

    // 3. Verifica che il tab sia attivo
    await expect(terminatedTab).toHaveClass(/bg-gray-600/);

    // 4. Verifica header "Liste Terminate"
    await expect(page.locator('text=Liste Terminate')).toBeVisible();

    // 5. Verifica che vengano mostrate solo liste completate
    const completedBadges = page.locator('text=Completata');
    const count = await completedBadges.count();
    console.log(`Liste terminate trovate: ${count}`);

    // Se ci sono liste, verifica che abbiano il badge verde
    if (count > 0) {
      const firstBadge = completedBadges.first();
      await expect(firstBadge).toHaveClass(/bg-green-500/);
    }
  });

  test('should navigate between pages in terminated tab', async ({ page }) => {
    // 1. Vai alla pagina touch e al tab terminate
    await page.goto('http://localhost:3000/operations/lists/touch');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const terminatedTab = page.locator('button:has-text("Terminate")').last();
    await terminatedTab.click();
    await page.waitForTimeout(1000);

    // 2. Verifica se ci sono pulsanti di paginazione
    const nextButton = page.locator('button:has-text("Avanti")');
    const prevButton = page.locator('button:has-text("Indietro")');

    // 3. Se ci sono più di 6 liste, testa la paginazione
    const totalText = page.locator('text=/\\d+ liste terminate/');
    if (await totalText.isVisible()) {
      const text = await totalText.textContent();
      const total = parseInt(text.match(/\d+/)[0]);

      if (total > 6) {
        // Clicca su "Avanti"
        await nextButton.click();
        await page.waitForTimeout(500);

        // Verifica che il numero di pagina sia cambiato
        await expect(page.locator('text=2 /')).toBeVisible();

        // Torna indietro
        await prevButton.click();
        await page.waitForTimeout(500);
        await expect(page.locator('text=1 /')).toBeVisible();
      }
    }
  });

  test('should select terminated list and show details', async ({ page }) => {
    // 1. Vai al tab terminate
    await page.goto('http://localhost:3000/operations/lists/touch');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const terminatedTab = page.locator('button:has-text("Terminate")').last();
    await terminatedTab.click();
    await page.waitForTimeout(1000);

    // 2. Cerca una lista terminata
    const listCards = page.locator('.rounded-xl').filter({ hasText: 'Completata' });
    const count = await listCards.count();

    if (count > 0) {
      // 3. Clicca sulla prima lista
      await listCards.first().click();
      await page.waitForTimeout(500);

      // 4. Verifica che la lista sia selezionata (bordo blu e scala)
      const selectedCard = listCards.first();
      await expect(selectedCard).toHaveClass(/border-gray-600/);
      await expect(selectedCard).toHaveClass(/scale-105/);

      // 5. Verifica che l'info lista selezionata sia aggiornata
      const selectedInfo = page.locator('text=Selezionata').locator('..');
      await expect(selectedInfo).toBeVisible();
    }
  });

  test('should persist touch mode setting in localStorage', async ({ page }) => {
    // 1. Abilita touch mode
    await page.goto('http://localhost:3000/settings');
    const toggleButton = page.locator('button').filter({ has: page.locator('.transform.rounded-full') });
    await toggleButton.click();
    await page.waitForTimeout(1000);

    // 2. Verifica localStorage
    const settings = await page.evaluate(() => {
      return localStorage.getItem('ejlog_settings');
    });

    expect(settings).toBeTruthy();
    const parsed = JSON.parse(settings);
    expect(parsed.touchMode).toBe(true);

    // 3. Ricarica la pagina
    await page.reload();
    await page.waitForLoadState('networkidle');

    // 4. Verifica che il toggle sia ancora attivo
    await expect(page.locator('text=Modalità Touch attiva')).toBeVisible();
  });

  test('should show correct statistics in terminated lists', async ({ page }) => {
    // 1. Vai al tab terminate
    await page.goto('http://localhost:3000/operations/lists/touch');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const terminatedTab = page.locator('button:has-text("Terminate")').last();
    await terminatedTab.click();
    await page.waitForTimeout(1000);

    // 2. Verifica presenza statistiche nelle card
    const listCards = page.locator('.rounded-xl').filter({ hasText: 'Completata' });
    const count = await listCards.count();

    if (count > 0) {
      const firstCard = listCards.first();

      // 3. Verifica che ci siano le statistiche Tot/OK/KO
      await expect(firstCard.locator('text=Tot')).toBeVisible();
      await expect(firstCard.locator('text=OK')).toBeVisible();
      await expect(firstCard.locator('text=KO')).toBeVisible();

      // 4. Verifica che ci sia la data di completamento
      const dateElement = firstCard.locator('.text-xs.text-gray-500').last();
      await expect(dateElement).toBeVisible();
    }
  });

  test('should disable touch mode and allow normal navigation', async ({ page }) => {
    // 1. Abilita touch mode
    await page.goto('http://localhost:3000/settings');
    const toggleButton = page.locator('button').filter({ has: page.locator('.transform.rounded-full') });
    await toggleButton.click();
    await page.waitForTimeout(1000);

    // 2. Verifica redirect a touch page
    await page.goto('http://localhost:3000/operations/lists');
    await expect(page).toHaveURL(/.*\/operations\/lists\/touch/);

    // 3. Disabilita touch mode
    await page.goto('http://localhost:3000/settings');
    await toggleButton.click();
    await page.waitForTimeout(1000);

    // 4. Verifica che ora /operations/lists non reindirizza
    await page.goto('http://localhost:3000/operations/lists');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Dovrebbe rimanere su /operations/lists (non touch)
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/touch');
  });

  test('should handle empty terminated lists gracefully', async ({ page }) => {
    // 1. Vai al tab terminate
    await page.goto('http://localhost:3000/operations/lists/touch');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const terminatedTab = page.locator('button:has-text("Terminate")').last();
    await terminatedTab.click();
    await page.waitForTimeout(1000);

    // 2. Se non ci sono liste terminate, verifica messaggio vuoto
    const listCards = page.locator('.rounded-xl').filter({ hasText: 'Completata' });
    const count = await listCards.count();

    if (count === 0) {
      // 3. Verifica messaggio "Nessuna lista terminata"
      await expect(page.locator('text=Nessuna lista terminata')).toBeVisible();
      await expect(page.locator('text=Le liste completate appariranno qui')).toBeVisible();

      // 4. Verifica icona CheckCircle
      const icon = page.locator('.text-gray-300').first();
      await expect(icon).toBeVisible();
    }
  });
});
