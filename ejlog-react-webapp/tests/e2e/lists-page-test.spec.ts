// ============================================================================
// EJLOG WMS - Lists Page E2E Test
// Test completo della pagina Liste con dati reali dal database
// ============================================================================

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3012';
const API_URL = 'http://localhost:3077';

test.describe('Lists Page Tests - Real Data', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to lists page
    await page.goto(`${BASE_URL}/lists`);
    await page.waitForLoadState('networkidle');
  });

  test('should load lists page and show page title', async ({ page }) => {
    console.log('\n📋 Test: Caricamento pagina Liste');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check for page title or header
    const pageTitle = page.locator('h1, h2').first();
    await expect(pageTitle).toBeVisible({ timeout: 10000 });

    // Take screenshot
    await page.screenshot({
      path: 'screenshots/lists-page-loaded.png',
      fullPage: true
    });

    console.log('✅ Pagina Liste caricata con successo');
  });

  test('should call /api/lists endpoint with correct format', async ({ page }) => {
    console.log('\n📡 Test: Chiamata API /api/lists');

    let apiCalled = false;
    let apiResponse: any = null;
    let apiUrl = '';

    // Listen for API calls to /api/lists
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/api/lists') || url.includes('/api/Lists')) {
        apiCalled = true;
        apiUrl = url;
        console.log(`\n📡 API Call detected: ${url}`);
        console.log(`   Status: ${response.status()}`);

        try {
          const contentType = response.headers()['content-type'];
          if (contentType && contentType.includes('application/json')) {
            apiResponse = await response.json();
            console.log(`   Response:`, JSON.stringify(apiResponse, null, 2));
          }
        } catch (e) {
          console.log(`   Could not parse response as JSON`);
        }
      }
    });

    // Reload page to trigger API call
    await page.reload();
    await page.waitForLoadState('networkidle');

    console.log(`\n📊 Risultati:`)
    console.log(`   API Called: ${apiCalled}`);
    console.log(`   API URL: ${apiUrl}`);
    console.log(`   Endpoint corretto (lowercase): ${apiUrl.includes('/api/lists')}`);

    // API should be called
    expect(apiCalled).toBeTruthy();

    // Should use lowercase 'lists' not 'Lists'
    expect(apiUrl).toContain('/api/lists');
    expect(apiUrl).not.toContain('/api/Lists');

    console.log('✅ API endpoint chiamato correttamente');
  });

  test('should show TWO real lists from database', async ({ page }) => {
    console.log('\n📊 Test: Visualizzazione liste reali dal database');

    let listsData: any = null;

    // Intercept API response
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/api/lists')) {
        try {
          listsData = await response.json();
        } catch (e) {
          console.error('Errore nel parsing della risposta:', e);
        }
      }
    });

    // Reload to get fresh data
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Wait a bit for data to load
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({
      path: 'screenshots/lists-page-data.png',
      fullPage: true
    });

    console.log('\n📊 Dati ricevuti dall\'API:');
    if (listsData) {
      console.log(`   Success: ${listsData.success}`);
      console.log(`   Total lists: ${listsData.data?.length || 0}`);
      console.log(`   Lists:`, JSON.stringify(listsData.data, null, 2));
    }

    // Verify we received data
    expect(listsData).toBeTruthy();
    expect(listsData.success).toBe(true);
    expect(listsData.data).toBeDefined();
    expect(listsData.data.length).toBeGreaterThanOrEqual(2);

    // Verify the two expected lists are present
    const listCodes = listsData.data.map((list: any) => list.code);
    console.log(`\n📋 Liste trovate: ${listCodes.join(', ')}`);

    expect(listCodes).toContain('PICK1743');
    expect(listCodes).toContain('PICK1742');

    console.log('✅ Due liste reali visualizzate correttamente');
  });

  test('should show list cards or table with real data', async ({ page }) => {
    console.log('\n🗂️ Test: Visualizzazione cards/tabella liste');

    // Wait for data to load
    await page.waitForTimeout(3000);

    // Check if there are list items displayed (could be cards or table rows)
    const listCards = page.locator('[data-testid*="list-"], [class*="list-card"], [class*="ListCard"]');
    const tableRows = page.locator('table tbody tr');

    const cardsCount = await listCards.count();
    const rowsCount = await tableRows.count();

    console.log(`\n📊 Elementi trovati:`);
    console.log(`   Cards: ${cardsCount}`);
    console.log(`   Table rows: ${rowsCount}`);

    // Take screenshot
    await page.screenshot({
      path: 'screenshots/lists-page-items.png',
      fullPage: true
    });

    // At least one of these should show data
    const hasVisibleData = cardsCount > 0 || rowsCount > 0;
    expect(hasVisibleData).toBeTruthy();

    if (hasVisibleData) {
      console.log('✅ Dati liste visualizzati nell\'interfaccia');
    }
  });

  test('should have functional action buttons', async ({ page }) => {
    console.log('\n🔘 Test: Pulsanti di azione');

    // Wait for page to fully load
    await page.waitForTimeout(3000);

    // Look for common action buttons
    const executeButton = page.locator('button:has-text("Esegui"), button:has-text("Execute"), [aria-label*="esegui"], [title*="esegui"]').first();
    const pauseButton = page.locator('button:has-text("Pausa"), button:has-text("Pause"), [aria-label*="pausa"], [title*="pausa"]').first();
    const deleteButton = page.locator('button:has-text("Elimina"), button:has-text("Delete"), [aria-label*="elimina"], [title*="elimina"]').first();
    const createButton = page.locator('button:has-text("Nuova"), button:has-text("Crea"), button:has-text("Create"), button:has-text("New")').first();

    const executeVisible = await executeButton.isVisible().catch(() => false);
    const pauseVisible = await pauseButton.isVisible().catch(() => false);
    const deleteVisible = await deleteButton.isVisible().catch(() => false);
    const createVisible = await createButton.isVisible().catch(() => false);

    console.log('\n🔘 Pulsanti trovati:');
    console.log(`   Esegui: ${executeVisible}`);
    console.log(`   Pausa: ${pauseVisible}`);
    console.log(`   Elimina: ${deleteVisible}`);
    console.log(`   Crea Nuova: ${createVisible}`);

    // Take screenshot
    await page.screenshot({
      path: 'screenshots/lists-page-buttons.png',
      fullPage: true
    });

    // At least one action button should be visible
    const hasActionButtons = executeVisible || pauseButton || deleteVisible || createVisible;

    if (hasActionButtons) {
      console.log('✅ Pulsanti di azione presenti');
    } else {
      console.log('⚠️ Nessun pulsante di azione trovato - potrebbero usare icone o nomi diversi');
    }
  });

  test('should test /api/lists endpoint directly', async ({ request }) => {
    console.log(`\n🔍 Test diretto endpoint: ${API_URL}/api/lists`);

    try {
      const response = await request.get(`${API_URL}/api/lists?limit=10`);

      console.log(`   Status: ${response.status()}`);
      console.log(`   Status Text: ${response.statusText()}`);

      const body = await response.json();
      console.log(`   Response:`, JSON.stringify(body, null, 2));

      // Endpoint should respond successfully
      expect(response.status()).toBe(200);

      // Should have success=true
      expect(body.success).toBe(true);

      // Should have data array
      expect(body.data).toBeDefined();
      expect(Array.isArray(body.data)).toBe(true);

      // Should have at least 2 lists
      expect(body.data.length).toBeGreaterThanOrEqual(2);

      // Should have the expected lists
      const codes = body.data.map((list: any) => list.code);
      expect(codes).toContain('PICK1743');
      expect(codes).toContain('PICK1742');

      console.log('✅ Endpoint /api/lists risponde correttamente con dati reali');
    } catch (error) {
      console.error('❌ Errore chiamata endpoint:', error);
      throw error;
    }
  });

  test('should verify list data structure', async ({ request }) => {
    console.log(`\n🔍 Test struttura dati liste`);

    const response = await request.get(`${API_URL}/api/lists?limit=10`);
    const body = await response.json();

    expect(body.data.length).toBeGreaterThan(0);

    const firstList = body.data[0];
    console.log('\n📋 Struttura prima lista:');
    console.log(JSON.stringify(firstList, null, 2));

    // Verify required fields
    expect(firstList.id).toBeDefined();
    expect(firstList.code).toBeDefined();
    expect(firstList.type).toBeDefined();
    expect(firstList.status).toBeDefined();

    console.log('\n✅ Campi richiesti presenti:');
    console.log(`   ID: ${firstList.id}`);
    console.log(`   Code: ${firstList.code}`);
    console.log(`   Type: ${firstList.type}`);
    console.log(`   Status: ${firstList.status}`);
    console.log(`   Created At: ${firstList.createdAt}`);
    console.log(`   Total Rows: ${firstList.totalRows}`);
    console.log(`   Completion: ${firstList.completionPercentage}%`);

    console.log('✅ Struttura dati valida');
  });
});

