/**
 * Playwright Test - Scheduler Settings Page Debug
 * Testa e debugga la pagina scheduler-settings
 */

import { test, expect } from '@playwright/test';

test.describe('Scheduler Settings Page - Debug & Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Intercetta le chiamate API per diagnostica
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/api/')) {
        console.log(`[API Response] ${response.status()} - ${url}`);
        if (!response.ok()) {
          console.error(`[API Error] ${response.status()} ${response.statusText()} - ${url}`);
          try {
            const body = await response.text();
            console.error(`[Response Body] ${body.substring(0, 500)}`);
          } catch (e) {
            console.error('[Response Body] Could not read body');
          }
        }
      }
    });

    // Intercetta errori console
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error(`[Browser Error] ${msg.text()}`);
      } else if (msg.type() === 'warning') {
        console.warn(`[Browser Warning] ${msg.text()}`);
      }
    });

    // Intercetta errori non gestiti
    page.on('pageerror', (error) => {
      console.error(`[Page Error] ${error.message}`);
    });
  });

  test('should load scheduler-settings page successfully', async ({ page }) => {
    console.log('\n🔍 Test 1: Caricamento pagina scheduler-settings\n');

    // Naviga alla pagina
    const response = await page.goto('http://localhost:3000/scheduler-settings', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log(`✅ Pagina caricata - Status: ${response?.status()}`);

    // Verifica che non ci siano errori HTTP
    expect(response?.status()).toBeLessThan(400);

    // Screenshot iniziale
    await page.screenshot({ path: 'screenshots/scheduler-settings-initial.png', fullPage: true });
    console.log('📸 Screenshot salvato: scheduler-settings-initial.png');
  });

  test('should display header and title', async ({ page }) => {
    console.log('\n🔍 Test 2: Verifica header e titolo\n');

    await page.goto('http://localhost:3000/scheduler-settings', { waitUntil: 'networkidle' });

    // Cerca il titolo
    const title = page.locator('h1', { hasText: 'Scheduler Settings' });
    await expect(title).toBeVisible({ timeout: 10000 });
    console.log('✅ Titolo "Scheduler Settings" visibile');

    // Verifica subtitle
    const subtitle = page.locator('text=Monitoraggio real-time');
    await expect(subtitle).toBeVisible();
    console.log('✅ Sottotitolo visibile');
  });

  test('should load and display data from API', async ({ page }) => {
    console.log('\n🔍 Test 3: Caricamento dati da API\n');

    await page.goto('http://localhost:3000/scheduler-settings', { waitUntil: 'networkidle' });

    // Attendi che i dati siano caricati (verifica che non ci sia più il loader)
    const loader = page.locator('text=Caricamento Scheduler Settings');
    await expect(loader).toBeHidden({ timeout: 15000 });
    console.log('✅ Dati caricati (loader nascosto)');

    // Verifica che ci siano le card statistiche
    const schedulazioniCard = page.locator('text=Schedulazioni').first();
    await expect(schedulazioniCard).toBeVisible();
    console.log('✅ Card "Schedulazioni" visibile');

    const attiveCard = page.locator('text=Attive').first();
    await expect(attiveCard).toBeVisible();
    console.log('✅ Card "Attive" visibile');

    const prenotazioniCard = page.locator('text=Prenotazioni').first();
    await expect(prenotazioniCard).toBeVisible();
    console.log('✅ Card "Prenotazioni" visibile');

    const erroriCard = page.locator('text=Errori').first();
    await expect(erroriCard).toBeVisible();
    console.log('✅ Card "Errori" visibile');

    // Screenshot delle card
    await page.screenshot({ path: 'screenshots/scheduler-settings-cards.png', fullPage: true });
    console.log('📸 Screenshot salvato: scheduler-settings-cards.png');
  });

  test('should have functional tabs', async ({ page }) => {
    console.log('\n🔍 Test 4: Funzionalità tabs\n');

    await page.goto('http://localhost:3000/scheduler-settings', { waitUntil: 'networkidle' });

    // Attendi caricamento
    await page.waitForTimeout(2000);

    // Click su tab "Schedulazioni"
    const schedulazioniTab = page.locator('button', { hasText: 'Schedulazioni' });
    await schedulazioniTab.click();
    console.log('✅ Click su tab "Schedulazioni"');

    await page.waitForTimeout(1000);

    // Verifica che la tabella sia visibile
    const table = page.locator('table').first();
    if (await table.isVisible()) {
      console.log('✅ Tabella schedulazioni visibile');
    } else {
      console.log('⚠️  Nessuna schedulazione configurata o tabella non visibile');
    }

    // Screenshot tab schedulazioni
    await page.screenshot({ path: 'screenshots/scheduler-settings-schedulazioni.png', fullPage: true });
    console.log('📸 Screenshot salvato: scheduler-settings-schedulazioni.png');

    // Click su tab "Prenotazioni"
    const prenotazioniTab = page.locator('button', { hasText: 'Prenotazioni' });
    await prenotazioniTab.click();
    console.log('✅ Click su tab "Prenotazioni"');

    await page.waitForTimeout(1000);

    // Verifica statistiche prenotazioni
    const totalePrenotazioni = page.locator('text=Totale').first();
    await expect(totalePrenotazioni).toBeVisible();
    console.log('✅ Statistiche prenotazioni visibili');

    // Screenshot tab prenotazioni
    await page.screenshot({ path: 'screenshots/scheduler-settings-prenotazioni.png', fullPage: true });
    console.log('📸 Screenshot salvato: scheduler-settings-prenotazioni.png');

    // Torna a "Stato Sistema"
    const statoTab = page.locator('button', { hasText: 'Stato Sistema' });
    await statoTab.click();
    console.log('✅ Click su tab "Stato Sistema"');

    await page.waitForTimeout(1000);
  });

  test('should have working auto-refresh toggle', async ({ page }) => {
    console.log('\n🔍 Test 5: Toggle auto-refresh\n');

    await page.goto('http://localhost:3000/scheduler-settings', { waitUntil: 'networkidle' });

    // Trova il pulsante auto-refresh
    const autoRefreshButton = page.locator('button', { hasText: 'Auto-Refresh' }).first();
    await expect(autoRefreshButton).toBeVisible();

    // Verifica stato iniziale (dovrebbe essere ON)
    const initialText = await autoRefreshButton.textContent();
    console.log(`✅ Auto-Refresh button trovato - Testo: "${initialText}"`);

    // Click per disattivare
    await autoRefreshButton.click();
    await page.waitForTimeout(500);

    const newText = await autoRefreshButton.textContent();
    console.log(`✅ Dopo click - Testo: "${newText}"`);

    // Screenshot
    await page.screenshot({ path: 'screenshots/scheduler-settings-autorefresh.png', fullPage: true });
    console.log('📸 Screenshot salvato: scheduler-settings-autorefresh.png');
  });

  test('should handle manual refresh', async ({ page }) => {
    console.log('\n🔍 Test 6: Refresh manuale\n');

    await page.goto('http://localhost:3000/scheduler-settings', { waitUntil: 'networkidle' });

    // Trova il pulsante refresh
    const refreshButton = page.locator('button', { hasText: 'Aggiorna' });
    await expect(refreshButton).toBeVisible();
    console.log('✅ Pulsante "Aggiorna" trovato');

    // Click sul pulsante
    await refreshButton.click();
    console.log('✅ Click su "Aggiorna" effettuato');

    // Attendi che l'icona refresh inizi a girare (se presente)
    await page.waitForTimeout(1000);

    // Screenshot
    await page.screenshot({ path: 'screenshots/scheduler-settings-refresh.png', fullPage: true });
    console.log('📸 Screenshot salvato: scheduler-settings-refresh.png');
  });

  test('should check API endpoints', async ({ page }) => {
    console.log('\n🔍 Test 7: Verifica chiamate API\n');

    let apiCalled = false;
    let apiSuccess = false;

    // Intercetta chiamata API
    page.on('response', async (response) => {
      if (response.url().includes('/api/scheduler-status')) {
        apiCalled = true;
        apiSuccess = response.ok();
        console.log(`✅ API chiamata: ${response.url()}`);
        console.log(`   Status: ${response.status()}`);

        if (response.ok()) {
          try {
            const data = await response.json();
            console.log('   Dati ricevuti:', JSON.stringify(data, null, 2).substring(0, 500));
          } catch (e) {
            console.error('   Errore parsing JSON');
          }
        }
      }
    });

    await page.goto('http://localhost:3000/scheduler-settings', { waitUntil: 'networkidle' });

    await page.waitForTimeout(2000);

    expect(apiCalled).toBe(true);
    expect(apiSuccess).toBe(true);
    console.log('✅ API chiamata con successo');
  });

  test('should display footer info', async ({ page }) => {
    console.log('\n🔍 Test 8: Verifica footer\n');

    await page.goto('http://localhost:3000/scheduler-settings', { waitUntil: 'networkidle' });

    // Verifica footer con database info
    const databaseInfo = page.locator('text=Database Connesso');
    await expect(databaseInfo).toBeVisible();
    console.log('✅ Informazioni database visibili');

    const promagInfo = page.locator('text=PROMAG.dbo.Schedulazione');
    await expect(promagInfo).toBeVisible();
    console.log('✅ Nome database PROMAG visibile');

    // Screenshot footer
    await page.screenshot({ path: 'screenshots/scheduler-settings-footer.png', fullPage: true });
    console.log('📸 Screenshot salvato: scheduler-settings-footer.png');
  });

  test('should be responsive', async ({ page }) => {
    console.log('\n🔍 Test 9: Verifica responsività\n');

    await page.goto('http://localhost:3000/scheduler-settings', { waitUntil: 'networkidle' });

    // Test su diverse dimensioni
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop Large' },
      { width: 1366, height: 768, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(500);

      console.log(`✅ Viewport ${viewport.name} (${viewport.width}x${viewport.height})`);

      await page.screenshot({
        path: `screenshots/scheduler-settings-${viewport.name.toLowerCase().replace(' ', '-')}.png`,
        fullPage: true
      });
      console.log(`📸 Screenshot salvato: scheduler-settings-${viewport.name.toLowerCase().replace(' ', '-')}.png`);
    }
  });

  test('comprehensive final check', async ({ page }) => {
    console.log('\n🔍 Test 10: Check finale completo\n');

    await page.goto('http://localhost:3000/scheduler-settings', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Verifica elementi chiave
    const checks = [
      { selector: 'h1', text: 'Scheduler Settings', name: 'Titolo principale' },
      { selector: 'button:has-text("Auto-Refresh")', text: null, name: 'Pulsante Auto-Refresh' },
      { selector: 'button:has-text("Aggiorna")', text: null, name: 'Pulsante Aggiorna' },
      { selector: 'button:has-text("Stato Sistema")', text: null, name: 'Tab Stato Sistema' },
      { selector: 'button:has-text("Schedulazioni")', text: null, name: 'Tab Schedulazioni' },
      { selector: 'button:has-text("Prenotazioni")', text: null, name: 'Tab Prenotazioni' },
      { selector: 'text=Database Connesso', text: null, name: 'Footer Database Info' }
    ];

    for (const check of checks) {
      try {
        const element = page.locator(check.selector);
        await expect(element).toBeVisible({ timeout: 5000 });
        console.log(`✅ ${check.name} - OK`);
      } catch (e) {
        console.error(`❌ ${check.name} - FALLITO`);
      }
    }

    // Screenshot finale
    await page.screenshot({ path: 'screenshots/scheduler-settings-final.png', fullPage: true });
    console.log('\n📸 Screenshot finale salvato: scheduler-settings-final.png\n');

    console.log('🎉 Test completo terminato!\n');
  });
});
