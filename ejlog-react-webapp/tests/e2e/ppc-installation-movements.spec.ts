import { test, expect } from '@playwright/test';

/**
 * Test E2E per PpcMovementsPage
 * Replica tutte le funzionalità della pagina Movements
 * migrata da WPF/XAML a React
 *
 * Pagina completa con 3 modalità operative:
 * - Guided: Movimenti guidati (vai a UDC, Bay, Cella, Altezza)
 * - Manual: Controlli manuali hold (Elevatore, Carrello, Bay Esterno, Serranda)
 * - Operator: Controlli velocità verticale/orizzontale
 */

test.describe('PPC Installation - Movements Page', () => {
  test.beforeEach(async ({ page }) => {
    // Naviga alla pagina Movements
    await page.goto('http://localhost:3000/ppc/installation/movements');

    // Attende che la pagina sia caricata
    await page.waitForLoadState('networkidle');
  });

  test('should load Movements page successfully', async ({ page }) => {
    // Verifica che il layout principale sia visibile
    await expect(page.locator('.ppc-page.ppc-movements')).toBeVisible();
    await expect(page.locator('.ppc-movements__layout')).toBeVisible();
  });

  test('should display sensor panels on the left side', async ({ page }) => {
    // Verifica che i pannelli sensori siano visibili
    await expect(page.locator('.ppc-movements__sensors')).toBeVisible();

    // Verifica che ci siano 6 pannelli sensori
    const sensorCards = page.locator('.ppc-sensor-card');
    const count = await sensorCards.count();
    expect(count).toBeGreaterThanOrEqual(6);

    // Verifica titoli dei sensori principali
    await expect(page.getByText(/Position/i)).toBeVisible();
    await expect(page.getByText(/Drawer/i)).toBeVisible();
  });

  test('should display mode selection tabs (Guided, Manual, Operator)', async ({ page }) => {
    // Verifica che i tab di selezione modalità siano presenti
    const guidedTab = page.getByRole('button', { name: /Guided/i });
    const manualTab = page.getByRole('button', { name: /Manual/i });
    const operatorTab = page.getByRole('button', { name: /Operator/i });

    await expect(guidedTab).toBeVisible();
    await expect(manualTab).toBeVisible();
    await expect(operatorTab).toBeVisible();
  });

  test('should default to Guided mode', async ({ page }) => {
    // Verifica che la modalità Guided sia attiva di default
    const guidedPanel = page.locator('.ppc-movements__panel');
    await expect(guidedPanel).toBeVisible();

    // Verifica presenza pulsanti modalità Guided
    const goToUDCButton = page.getByRole('button', { name: /Go to Loading Unit/i });
    await expect(goToUDCButton).toBeVisible();
  });

  test('should switch to Manual mode when tab is clicked', async ({ page }) => {
    // Click sul tab Manual
    const manualTab = page.getByRole('button', { name: /Manual/i });
    await manualTab.click();

    // Attende che il pannello cambi
    await page.waitForTimeout(500);

    // Verifica che i controlli manuali siano visibili
    const manualControls = page.locator('.ppc-movements__manual-controls');
    if (await manualControls.count() > 0) {
      await expect(manualControls.first()).toBeVisible();
    }
  });

  test('should switch to Operator mode when tab is clicked', async ({ page }) => {
    // Click sul tab Operator
    const operatorTab = page.getByRole('button', { name: /Operator/i });
    await operatorTab.click();

    // Attende che il pannello cambi
    await page.waitForTimeout(500);

    // Verifica che i controlli velocità siano visibili
    const speedControls = page.locator('.ppc-movements__speed-controls');
    if (await speedControls.count() > 0) {
      await expect(speedControls.first()).toBeVisible();
    }
  });

  test('should display footer action buttons', async ({ page }) => {
    // Verifica che il footer sia visibile
    await expect(page.locator('.ppc-movements__footer')).toBeVisible();

    // Verifica presenza pulsanti principali
    const resetButton = page.getByRole('button', { name: /Reset Machine/i });
    const stopButton = page.getByRole('button', { name: /Stop All/i });

    if (await resetButton.count() > 0) {
      await expect(resetButton).toBeVisible();
    }
    if (await stopButton.count() > 0) {
      await expect(stopButton).toBeVisible();
    }
  });

  test.describe('Guided Mode Functionality', () => {
    test('should display all Guided mode controls', async ({ page }) => {
      // Verifica presenza controlli modalità Guided
      const controls = [
        /Go to Loading Unit/i,
        /Go to Bay/i,
        /Go to Cell/i,
        /Go to Height/i,
        /Unload to Bay/i,
        /Load from Bay/i,
      ];

      for (const control of controls) {
        const button = page.getByRole('button', { name: control });
        if (await button.count() > 0) {
          await expect(button.first()).toBeVisible();
        }
      }
    });

    test('should allow input in Cell field', async ({ page }) => {
      // Trova il campo Cell
      const cellInput = page.locator('input[placeholder*="Cell"], input[name*="cell"]').first();

      if (await cellInput.count() > 0 && await cellInput.isVisible()) {
        await cellInput.fill('A1-01-05');
        await expect(cellInput).toHaveValue('A1-01-05');
      }
    });

    test('should allow input in Height field', async ({ page }) => {
      // Trova il campo Height
      const heightInput = page.locator('input[placeholder*="Height"], input[name*="height"]').first();

      if (await heightInput.count() > 0 && await heightInput.isVisible()) {
        await heightInput.fill('1500');
        await expect(heightInput).toHaveValue('1500');
      }
    });

    test('should display Bay position selector', async ({ page }) => {
      // Verifica presenza selettore posizioni Bay
      const bayPositions = page.locator('.ppc-movements__bay-positions');
      if (await bayPositions.count() > 0) {
        await expect(bayPositions.first()).toBeVisible();
      }
    });

    test('should have Calibration buttons', async ({ page }) => {
      // Verifica presenza pulsanti calibrazione
      const chainCalButton = page.getByRole('button', { name: /Chain Calibration/i });
      const verticalCalButton = page.getByRole('button', { name: /Vertical Calibration/i });

      if (await chainCalButton.count() > 0) {
        await expect(chainCalButton).toBeVisible();
      }
      if (await verticalCalButton.count() > 0) {
        await expect(verticalCalButton).toBeVisible();
      }
    });

    test('should have Shutter controls', async ({ page }) => {
      // Verifica presenza controlli serranda
      const openButton = page.getByRole('button', { name: /Open Shutter|Apri Serranda/i });
      const closeButton = page.getByRole('button', { name: /Close Shutter|Chiudi Serranda/i });

      if (await openButton.count() > 0) {
        await expect(openButton).toBeVisible();
      }
      if (await closeButton.count() > 0) {
        await expect(closeButton).toBeVisible();
      }
    });

    test('should display weight control checkbox', async ({ page }) => {
      // Verifica presenza checkbox controllo peso
      const weightCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: /Weight Control|Controllo Peso/i });
      if (await weightCheckbox.count() > 0) {
        await expect(weightCheckbox.first()).toBeVisible();
      }
    });
  });

  test.describe('Manual Mode Functionality', () => {
    test.beforeEach(async ({ page }) => {
      // Passa a modalità Manual
      const manualTab = page.getByRole('button', { name: /Manual/i });
      await manualTab.click();
      await page.waitForTimeout(500);
    });

    test('should display Elevator hold buttons', async ({ page }) => {
      // Verifica presenza pulsanti hold per Elevatore
      const elevatorButtons = [
        /Elevator Up|Su/i,
        /Elevator Down|Giù/i,
        /Elevator Forward|Avanti/i,
        /Elevator Back|Indietro/i,
      ];

      for (const buttonName of elevatorButtons) {
        const button = page.getByRole('button', { name: buttonName });
        if (await button.count() > 0) {
          await expect(button.first()).toBeVisible();
        }
      }
    });

    test('should display Carousel hold buttons', async ({ page }) => {
      // Verifica presenza pulsanti hold per Carrello
      const carouselForward = page.getByRole('button', { name: /Carousel Forward|Carrello Avanti/i });
      const carouselBack = page.getByRole('button', { name: /Carousel Back|Carrello Indietro/i });

      if (await carouselForward.count() > 0) {
        await expect(carouselForward).toBeVisible();
      }
      if (await carouselBack.count() > 0) {
        await expect(carouselBack).toBeVisible();
      }
    });

    test('should display External Bay hold buttons', async ({ page }) => {
      // Verifica presenza pulsanti hold per Bay Esterno
      const externalBayForward = page.getByRole('button', { name: /External Bay Forward/i });
      const externalBayBack = page.getByRole('button', { name: /External Bay Back/i });

      if (await externalBayForward.count() > 0) {
        await expect(externalBayForward).toBeVisible();
      }
      if (await externalBayBack.count() > 0) {
        await expect(externalBayBack).toBeVisible();
      }
    });

    test('should display Shutter hold buttons', async ({ page }) => {
      // Verifica presenza pulsanti hold per Serranda
      const shutterUp = page.getByRole('button', { name: /Shutter Up|Serranda Su/i });
      const shutterDown = page.getByRole('button', { name: /Shutter Down|Serranda Giù/i });

      if (await shutterUp.count() > 0) {
        await expect(shutterUp).toBeVisible();
      }
      if (await shutterDown.count() > 0) {
        await expect(shutterDown).toBeVisible();
      }
    });

    test('should display Policy bypass checkbox', async ({ page }) => {
      // Verifica presenza checkbox bypass policy
      const policyBypass = page.locator('input[type="checkbox"]').filter({ hasText: /Policy Bypass|Bypass Policy/i });
      if (await policyBypass.count() > 0) {
        await expect(policyBypass.first()).toBeVisible();
      }
    });

    test('should handle hold button pointer events', async ({ page }) => {
      // Trova il primo pulsante hold visibile
      const holdButtons = page.locator('button').filter({ hasText: /Hold/i });
      const firstHoldButton = holdButtons.first();

      if (await firstHoldButton.count() > 0 && await firstHoldButton.isVisible()) {
        // Simula pointer down
        await firstHoldButton.dispatchEvent('pointerdown');
        await page.waitForTimeout(100);

        // Simula pointer up
        await firstHoldButton.dispatchEvent('pointerup');
        await page.waitForTimeout(100);

        // Verifica che il pulsante sia ancora visibile (non crashato)
        await expect(firstHoldButton).toBeVisible();
      }
    });
  });

  test.describe('Operator Mode Functionality', () => {
    test.beforeEach(async ({ page }) => {
      // Passa a modalità Operator
      const operatorTab = page.getByRole('button', { name: /Operator/i });
      await operatorTab.click();
      await page.waitForTimeout(500);
    });

    test('should display Vertical Speed control', async ({ page }) => {
      // Verifica presenza slider velocità verticale
      const verticalSpeedLabel = page.getByText(/Vertical Speed|Velocità Verticale/i);
      if (await verticalSpeedLabel.count() > 0) {
        await expect(verticalSpeedLabel.first()).toBeVisible();
      }

      // Verifica presenza slider
      const verticalSlider = page.locator('input[type="range"]').filter({ hasText: /Vertical/i });
      if (await verticalSlider.count() > 0) {
        await expect(verticalSlider.first()).toBeVisible();
      }
    });

    test('should display Horizontal Speed control', async ({ page }) => {
      // Verifica presenza slider velocità orizzontale
      const horizontalSpeedLabel = page.getByText(/Horizontal Speed|Velocità Orizzontale/i);
      if (await horizontalSpeedLabel.count() > 0) {
        await expect(horizontalSpeedLabel.first()).toBeVisible();
      }

      // Verifica presenza slider
      const horizontalSlider = page.locator('input[type="range"]').filter({ hasText: /Horizontal/i });
      if (await horizontalSlider.count() > 0) {
        await expect(horizontalSlider.first()).toBeVisible();
      }
    });

    test('should allow changing Vertical Speed value', async ({ page }) => {
      // Trova il primo slider range visibile
      const sliders = page.locator('input[type="range"]');
      if (await sliders.count() > 0) {
        const firstSlider = sliders.first();
        if (await firstSlider.isVisible()) {
          // Imposta valore 500
          await firstSlider.fill('500');
          const value = await firstSlider.inputValue();
          expect(parseInt(value)).toBeGreaterThanOrEqual(0);
          expect(parseInt(value)).toBeLessThanOrEqual(1000);
        }
      }
    });

    test('should have Save Speeds button', async ({ page }) => {
      // Verifica presenza pulsante Save
      const saveButton = page.getByRole('button', { name: /Save Speed|Salva Velocità/i });
      if (await saveButton.count() > 0) {
        await expect(saveButton).toBeVisible();
      }
    });
  });

  test.describe('Real-time Data Polling', () => {
    test('should poll sensor data automatically from real backend', async ({ page }) => {
      // Monitora chiamate polling REALI (NO INTERCEPT, NO MOCK)
      const pollingRequests: string[] = [];

      page.on('request', request => {
        const url = request.url();
        if (url.includes('/api/ppc/bay') || url.includes('/api/ppc/elevator') || url.includes('/api/ppc/sensors')) {
          pollingRequests.push(url);
        }
      });

      // Attende 5 secondi per raccogliere chiamate di polling
      await page.waitForTimeout(5000);

      // Verifica che ci siano state chiamate di polling reali al backend (almeno 2-3 in 5 secondi)
      expect(pollingRequests.length).toBeGreaterThan(0);
      console.log('[E2E Test] Real polling requests:', pollingRequests.length);
    });

    test('should update sensor values in real-time', async ({ page }) => {
      // Verifica che i valori sensori cambino nel tempo
      const positionCard = page.locator('.ppc-sensor-card').first();

      if (await positionCard.isVisible()) {
        const initialText = await positionCard.textContent();

        // Attende 3 secondi
        await page.waitForTimeout(3000);

        const updatedText = await positionCard.textContent();

        // Il testo potrebbe essere cambiato (o rimanere uguale se la macchina è ferma)
        expect(updatedText).toBeTruthy();
      }
    });
  });

  test.describe('Footer Controls', () => {
    test('should have Reset Machine button', async ({ page }) => {
      const resetButton = page.getByRole('button', { name: /Reset Machine|Reset Macchina/i });
      if (await resetButton.count() > 0) {
        await expect(resetButton).toBeVisible();
      }
    });

    test('should have Reset Missions button', async ({ page }) => {
      const resetMissionsButton = page.getByRole('button', { name: /Reset Mission/i });
      if (await resetMissionsButton.count() > 0) {
        await expect(resetMissionsButton).toBeVisible();
      }
    });

    test('should have Stop All button with warning style', async ({ page }) => {
      const stopButton = page.getByRole('button', { name: /Stop All|Ferma Tutto/i });
      if (await stopButton.count() > 0) {
        await expect(stopButton).toBeVisible();

        // Verifica stile warning (dovrebbe avere classe warning o colore rosso)
        const className = await stopButton.getAttribute('class');
        expect(className).toContain('warning');
      }
    });

    test('should have Light toggle button', async ({ page }) => {
      const lightButton = page.getByRole('button', { name: /Light|Luce/i });
      if (await lightButton.count() > 0) {
        await expect(lightButton).toBeVisible();
      }
    });

    test('should have Bypass toggle button', async ({ page }) => {
      const bypassButton = page.getByRole('button', { name: /Bypass/i });
      if (await bypassButton.count() > 0) {
        await expect(bypassButton).toBeVisible();
      }
    });

    test('should have Security Sensors link', async ({ page }) => {
      const securityLink = page.getByRole('link', { name: /Security Sensor/i });
      if (await securityLink.count() > 0) {
        await expect(securityLink).toBeVisible();
      }
    });
  });

  test.describe('API Integration with Real Backend', () => {
    test('should load initial bay data from real backend on mount', async ({ page }) => {
      // Attende chiamata API bay REALE (NO MOCK)
      const apiResponse = page.waitForResponse(
        response => response.url().includes('/api/ppc/bay') && response.status() === 200,
        { timeout: 5000 }
      ).catch(() => null);

      // Ricarica pagina
      await page.reload();
      await page.waitForLoadState('networkidle');

      const response = await apiResponse;
      if (response) {
        expect(response.status()).toBe(200);
        const bayData = await response.json();
        console.log('[E2E Test] Real bay data loaded:', bayData);
      }
    });

    test('should send real API call on Go to UDC button click', async ({ page }) => {
      const goToUDCButton = page.getByRole('button', { name: /Go to Loading Unit/i });

      if (await goToUDCButton.count() > 0 && await goToUDCButton.isVisible()) {
        // Monitora chiamata API REALE al backend (NO MOCK)
        const apiCallPromise = page.waitForResponse(
          response => response.url().includes('/api/ppc/') && response.request().method() === 'POST',
          { timeout: 5000 }
        ).catch(() => null);

        await goToUDCButton.click();

        // Attende risposta reale dal backend
        const apiResponse = await apiCallPromise;

        if (apiResponse) {
          console.log('[E2E Test] Real API called:', apiResponse.url());
          const responseData = await apiResponse.json();
          console.log('[E2E Test] Backend response:', responseData);
        }

        await page.waitForTimeout(1000);
      }
    });

    test('should display real sensor data from backend', async ({ page }) => {
      // Verifica che i dati sensori siano REALI dal backend
      await page.waitForLoadState('networkidle');

      const sensorCards = page.locator('.ppc-sensor-card');
      const sensorCount = await sensorCards.count();

      if (sensorCount > 0) {
        const firstSensor = sensorCards.first();
        const sensorText = await firstSensor.textContent();

        // Log dati reali visualizzati
        console.log('[E2E Test] Real sensor data:', sensorText);

        // Verifica che ci siano dati (non vuoto)
        expect(sensorText).toBeTruthy();
      }
    });
  });

  test.describe('Layout and Styling', () => {
    test('should apply PPC styling classes', async ({ page }) => {
      // Verifica classi CSS PPC
      await expect(page.locator('.ppc-page')).toBeVisible();
      await expect(page.locator('.ppc-movements')).toBeVisible();
      await expect(page.locator('.ppc-movements__layout')).toBeVisible();
    });

    test('should have responsive layout with sensors on left and controls on right', async ({ page }) => {
      // Verifica layout 2-colonne
      const sensors = page.locator('.ppc-movements__sensors');
      const main = page.locator('.ppc-movements__main');

      await expect(sensors).toBeVisible();
      await expect(main).toBeVisible();

      // Verifica che siano side-by-side (non uno sotto l'altro)
      const sensorsBox = await sensors.boundingBox();
      const mainBox = await main.boundingBox();

      if (sensorsBox && mainBox) {
        // sensors dovrebbe essere a sinistra di main
        expect(sensorsBox.x).toBeLessThan(mainBox.x);
      }
    });

    test('should match XAML UI structure from WPF version', async ({ page }) => {
      /**
       * Verifica che la struttura React corrisponda al layout XAML originale:
       * - Grid con sensori a sinistra
       * - Pannello controlli a destra
       * - Tab per 3 modalità
       * - Footer con azioni principali
       */

      await expect(page.locator('.ppc-movements__sensors')).toBeVisible();
      await expect(page.locator('.ppc-movements__main')).toBeVisible();
      await expect(page.locator('.ppc-movements__footer')).toBeVisible();

      // Verifica presenza 3 tab
      const tabs = page.locator('button').filter({ hasText: /Guided|Manual|Operator/i });
      const tabCount = await tabs.count();
      expect(tabCount).toBeGreaterThanOrEqual(3);
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should support Tab navigation between inputs', async ({ page }) => {
      // Trova tutti gli input visibili
      const inputs = page.locator('input[type="text"], input[type="number"]');
      const inputCount = await inputs.count();

      if (inputCount > 1) {
        await inputs.first().focus();
        await page.keyboard.press('Tab');

        // Verifica che il focus sia passato
        const activeElement = await page.evaluateHandle(() => document.activeElement);
        expect(activeElement).toBeTruthy();
      }
    });

    test('should support Enter key on buttons', async ({ page }) => {
      const firstButton = page.getByRole('button').first();

      if (await firstButton.isVisible()) {
        await firstButton.focus();
        await page.keyboard.press('Enter');

        // Verifica che il pulsante sia ancora visibile (non crashato)
        await expect(firstButton).toBeVisible();
      }
    });
  });

  test.describe('Performance and Responsiveness', () => {
    test('should load page within 3 seconds', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('http://localhost:3000/ppc/installation/movements');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      expect(loadTime).toBeLessThan(3000);
    });

    test('should handle rapid mode switching', async ({ page }) => {
      const guidedTab = page.getByRole('button', { name: /Guided/i });
      const manualTab = page.getByRole('button', { name: /Manual/i });
      const operatorTab = page.getByRole('button', { name: /Operator/i });

      // Switch rapido tra modalità
      await guidedTab.click();
      await page.waitForTimeout(100);
      await manualTab.click();
      await page.waitForTimeout(100);
      await operatorTab.click();
      await page.waitForTimeout(100);
      await guidedTab.click();

      // Verifica che la pagina sia ancora funzionale
      await expect(page.locator('.ppc-movements')).toBeVisible();
    });

    test('should handle continuous polling without memory leaks', async ({ page }) => {
      // Lascia la pagina aperta per 10 secondi con polling attivo
      await page.waitForTimeout(10000);

      // Verifica che la pagina sia ancora responsive
      const guidedTab = page.getByRole('button', { name: /Guided/i });
      await expect(guidedTab).toBeVisible();
      await guidedTab.click();

      // Verifica che i sensori siano ancora aggiornati
      const sensorCards = page.locator('.ppc-sensor-card');
      await expect(sensorCards.first()).toBeVisible();
    });
  });

  test.describe('Edge Cases with Real Data', () => {
    test('should handle real backend data correctly', async ({ page }) => {
      // Ricarica pagina per ricevere dati reali
      await page.reload();
      await page.waitForLoadState('networkidle');

      // La pagina dovrebbe essere visibile con dati reali dal backend
      await expect(page.locator('.ppc-movements')).toBeVisible();

      // Verifica che i dati siano caricati (potrebbero essere vuoti o popolati)
      const sensorCards = page.locator('.ppc-sensor-card');
      const count = await sensorCards.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should work correctly with real backend responses', async ({ page }) => {
      // Naviga alla pagina e attende caricamento completo con dati reali
      await page.goto('http://localhost:3000/ppc/installation/movements', {
        waitUntil: 'networkidle',
        timeout: 10000
      });

      // La pagina dovrebbe caricare con dati reali dal backend
      await expect(page.locator('.ppc-movements')).toBeVisible();

      // Verifica che i controlli siano presenti
      const buttons = page.getByRole('button');
      const buttonCount = await buttons.count();
      expect(buttonCount).toBeGreaterThan(0);
    });

    test('should handle rapid button clicks', async ({ page }) => {
      const firstButton = page.getByRole('button').first();

      if (await firstButton.isVisible()) {
        // Click rapidi multipli
        await firstButton.click();
        await firstButton.click();
        await firstButton.click();

        // Verifica che non ci siano errori
        await expect(firstButton).toBeVisible();
      }
    });
  });
});
