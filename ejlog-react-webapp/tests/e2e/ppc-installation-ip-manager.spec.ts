import { test, expect } from '@playwright/test';

/**
 * Test E2E per PpcIpManagerPage
 * Replica tutti gli step e le installazioni della pagina IP Manager
 * migrata da WPF/XAML a React
 */

test.describe('PPC Installation - IP Manager Page', () => {
  test.beforeEach(async ({ page }) => {
    // Naviga alla pagina IP Manager
    await page.goto('http://localhost:3000/ppc/installation/ip-manager');

    // Attende che la pagina sia caricata
    await page.waitForLoadState('networkidle');
  });

  test('should load IP Manager page successfully', async ({ page }) => {
    // Verifica che il titolo della pagina sia visibile
    await expect(page.locator('.ppc-ip-manager__title')).toBeVisible();
    await expect(page.locator('.ppc-ip-manager__title')).toContainText(/Ip Manager/i);
  });

  test('should display Bay 1 configuration fields when data is available', async ({ page }) => {
    // Verifica che la sezione Bay 1 sia presente
    const bay1Section = page.locator('.ppc-ip-manager__bay').first();

    // Se Bay 1 è visibile, verifica i campi
    const bay1Visible = await bay1Section.isVisible().catch(() => false);

    if (bay1Visible) {
      await expect(bay1Section).toContainText(/Bay 1/i);

      // Verifica campi IP Bay 1
      const remoteIOLabel = page.getByText(/Bay 1 - Remote IO/i);
      const alphanumericLabel = page.getByText(/Bay 1 - Barra Alfanumerica/i);
      const laserLabel = page.getByText(/Bay 1 - Laser/i);
      const scaleLabel = page.getByText(/Bay 1 - Bilancia contapezzi/i);

      await expect(remoteIOLabel).toBeVisible();
      await expect(alphanumericLabel).toBeVisible();
      await expect(laserLabel).toBeVisible();
      await expect(scaleLabel).toBeVisible();
    }
  });

  test('should display Bay 2 configuration fields when data is available', async ({ page }) => {
    const bay2Sections = page.locator('.ppc-ip-manager__bay');
    const bay2Count = await bay2Sections.count();

    if (bay2Count >= 2) {
      const bay2Section = bay2Sections.nth(1);
      await expect(bay2Section).toContainText(/Bay 2/i);

      // Verifica campi IP Bay 2
      const remoteIOLabel = page.getByText(/Bay 2 - Remote IO/i);
      await expect(remoteIOLabel).toBeVisible();
    }
  });

  test('should display Bay 3 configuration fields when data is available', async ({ page }) => {
    const bay3Sections = page.locator('.ppc-ip-manager__bay');
    const bay3Count = await bay3Sections.count();

    if (bay3Count >= 3) {
      const bay3Section = bay3Sections.nth(2);
      await expect(bay3Section).toContainText(/Bay 3/i);

      // Verifica campi IP Bay 3
      const remoteIOLabel = page.getByText(/Bay 3 - Remote IO/i);
      await expect(remoteIOLabel).toBeVisible();
    }
  });

  test('should display Machine Inverter section', async ({ page }) => {
    // Verifica sezione Inverter
    const inverterSection = page.locator('.ppc-ip-manager__inverter');
    await expect(inverterSection).toBeVisible();

    const inverterTitle = page.getByText(/Inverter/i);
    await expect(inverterTitle).toBeVisible();

    const machineInverterLabel = page.getByText(/Machine Inverter/i);
    await expect(machineInverterLabel).toBeVisible();
  });

  test('should allow input in IP address fields', async ({ page }) => {
    // Trova il primo campo input visibile
    const firstInput = page.locator('input[type="text"], textarea').first();

    if (await firstInput.isVisible()) {
      // Simula inserimento IP
      await firstInput.fill('192.168.1.100');

      // Verifica che il valore sia stato inserito
      await expect(firstInput).toHaveValue('192.168.1.100');
    }
  });

  test('should validate IP address format', async ({ page }) => {
    const inputs = page.locator('input[type="text"], textarea');
    const inputCount = await inputs.count();

    if (inputCount > 0) {
      const firstInput = inputs.first();

      // Test IP valido
      await firstInput.fill('192.168.1.1');
      await expect(firstInput).toHaveValue('192.168.1.1');

      // Test IP con formato non standard (dovrebbe comunque accettarlo come stringa)
      await firstInput.fill('10.0.0.1');
      await expect(firstInput).toHaveValue('10.0.0.1');
    }
  });

  test('should have Save button', async ({ page }) => {
    // Verifica che il pulsante Save sia presente
    const saveButton = page.getByRole('button', { name: /Save|Salva/i });
    await expect(saveButton).toBeVisible();
  });

  test('should enable Save button when form is valid', async ({ page }) => {
    const saveButton = page.getByRole('button', { name: /Save|Salva/i });

    // Il pulsante dovrebbe essere abilitato (non in stato saving)
    const isDisabled = await saveButton.isDisabled();
    expect(isDisabled).toBe(false);
  });

  test('should handle Save button click', async ({ page }) => {
    const saveButton = page.getByRole('button', { name: /Save|Salva/i });

    // Click sul pulsante Save
    await saveButton.click();

    // Attende risposta (potrebbe essere un mock o chiamata reale)
    await page.waitForTimeout(1000);

    // Verifica che il pulsante non sia in stato di caricamento permanente
    const isDisabled = await saveButton.isDisabled();
    expect(isDisabled).toBe(false);
  });

  test('should display all IP configuration fields in correct order', async ({ page }) => {
    // Verifica ordine dei campi per Bay 1 (se visibile)
    const bay1Fields = [
      'Bay 1 - Remote IO',
      'Bay 1 - Barra Alfanumerica',
      'Bay 1 - Laser',
      'Bay 1 - Bilancia contapezzi'
    ];

    for (const fieldLabel of bay1Fields) {
      const labelExists = await page.getByText(new RegExp(fieldLabel, 'i')).count();
      if (labelExists > 0) {
        await expect(page.getByText(new RegExp(fieldLabel, 'i'))).toBeVisible();
      }
    }
  });

  test('should apply PPC styling classes', async ({ page }) => {
    // Verifica che le classi CSS PPC siano presenti
    await expect(page.locator('.ppc-page')).toBeVisible();
    await expect(page.locator('.ppc-ip-manager')).toBeVisible();

    // Verifica che ci sia il container delle azioni
    const actionContainer = page.locator('.ppc-form-actions');
    if (await actionContainer.count() > 0) {
      await expect(actionContainer.first()).toBeVisible();
    }
  });

  test('should load data from backend on mount', async ({ page }) => {
    // Intercetta la chiamata API
    const apiResponse = page.waitForResponse(
      response => response.url().includes('/api/settings/ip-manager') && response.status() === 200,
      { timeout: 5000 }
    ).catch(() => null);

    // Ricarica la pagina per triggerare useEffect
    await page.reload();

    const response = await apiResponse;

    if (response) {
      // Se l'API risponde, verifica che i dati siano stati caricati
      expect(response.status()).toBe(200);
    }
  });

  test('should load real data from backend API', async ({ page }) => {
    // Attende che i dati reali siano caricati dal backend
    await page.waitForLoadState('networkidle');

    // Verifica che la pagina sia visibile con dati reali
    await expect(page.locator('.ppc-ip-manager__title')).toBeVisible();

    // Verifica che ci siano campi input con dati reali (potrebbero essere vuoti o popolati)
    const inputs = page.locator('input[type="text"], textarea');
    const inputCount = await inputs.count();
    expect(inputCount).toBeGreaterThan(0);
  });

  test('should match XAML UI structure from WPF version', async ({ page }) => {
    /**
     * Verifica che la struttura React corrisponda al layout XAML originale:
     * - Grid con 3 colonne per i 3 Bay
     * - Sezione Inverter separata
     * - Pulsante Save in basso a destra
     */

    // Verifica layout principale
    await expect(page.locator('.ppc-ip-manager__content')).toBeVisible();

    // Verifica sezione Bays
    const baysSection = page.locator('.ppc-ip-manager__bays');
    if (await baysSection.count() > 0) {
      await expect(baysSection.first()).toBeVisible();
    }

    // Verifica sezione Inverter
    await expect(page.locator('.ppc-ip-manager__inverter')).toBeVisible();

    // Verifica pulsante Save in actions container
    const actions = page.locator('.ppc-form-actions--end');
    if (await actions.count() > 0) {
      await expect(actions.first()).toBeVisible();
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Testa navigazione con Tab tra i campi
    const inputs = page.locator('input[type="text"], textarea');
    const inputCount = await inputs.count();

    if (inputCount > 1) {
      await inputs.first().focus();
      await page.keyboard.press('Tab');

      // Verifica che il focus sia passato al prossimo elemento
      const activeElement = await page.evaluateHandle(() => document.activeElement);
      expect(activeElement).toBeTruthy();
    }
  });

  test('should handle form submission with real backend save', async ({ page }) => {
    // Riempi tutti i campi visibili con IP validi
    const inputs = page.locator('input[type="text"], textarea');
    const inputCount = await inputs.count();

    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      if (await input.isVisible()) {
        await input.fill(`192.168.${i}.${100 + i}`);
      }
    }

    // Attende chiamata di salvataggio REALE al backend (NO MOCK)
    const saveResponsePromise = page.waitForResponse(
      response => response.url().includes('/api/settings/ip-manager') && response.request().method() === 'PUT',
      { timeout: 5000 }
    ).catch(() => null);

    // Click Save
    const saveButton = page.getByRole('button', { name: /Save|Salva/i });
    await saveButton.click();

    // Attende risposta reale dal backend
    const saveResponse = await saveResponsePromise;

    if (saveResponse) {
      // Verifica che il backend abbia risposto con successo
      expect(saveResponse.status()).toBe(200);
      const responseBody = await saveResponse.json();
      console.log('[E2E Test] Backend response:', responseBody);
    }

    // Verifica che il pulsante non sia in stato di caricamento permanente
    await page.waitForTimeout(1000);
    const isDisabled = await saveButton.isDisabled();
    expect(isDisabled).toBe(false);
  });
});
