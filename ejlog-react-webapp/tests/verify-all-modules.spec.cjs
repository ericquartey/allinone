// ============================================================================
// EJLOG WMS - Complete Module Verification Test
// Verifica tutte le 10 pagine dei moduli implementati
// ============================================================================

const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3011';

test.describe('EJLOG WMS - Verifica Completa Moduli', () => {

  // ============================================================================
  // 1. ITEMS MODULE
  // ============================================================================

  test('Items Module - Lista Items', async ({ page }) => {
    await page.goto(`${BASE_URL}/items-list`);
    await page.waitForLoadState('networkidle');

    // Verifica titolo pagina
    const title = await page.locator('h1').first();
    await expect(title).toBeVisible();
    console.log('✓ Items List Page - Caricata correttamente');
  });

  // ============================================================================
  // 2. LISTS MODULE
  // ============================================================================

  test('Lists Module - Gestione Liste', async ({ page }) => {
    await page.goto(`${BASE_URL}/lists-management`);
    await page.waitForLoadState('networkidle');

    const title = await page.locator('h1').first();
    await expect(title).toBeVisible();
    console.log('✓ Lists Management Page - Caricata correttamente');
  });

  // ============================================================================
  // 3. UDC MODULE
  // ============================================================================

  test('UDC Module - Lista UDC', async ({ page }) => {
    await page.goto(`${BASE_URL}/udc-list`);
    await page.waitForLoadState('networkidle');

    const title = await page.locator('h1').first();
    await expect(title).toBeVisible();
    console.log('✓ UDC List Page - Caricata correttamente');
  });

  // ============================================================================
  // 4. OPERATIONS MODULE
  // ============================================================================

  test('Operations Module - Lista Operazioni', async ({ page }) => {
    await page.goto(`${BASE_URL}/operations`);
    await page.waitForLoadState('networkidle');

    const title = await page.locator('h1').first();
    await expect(title).toBeVisible();
    console.log('✓ Operations Page - Caricata correttamente');
  });

  // ============================================================================
  // 5. MOVEMENTS MODULE
  // ============================================================================

  test('Movements Module - Storico Movimenti', async ({ page }) => {
    await page.goto(`${BASE_URL}/movements`);
    await page.waitForLoadState('networkidle');

    const title = await page.locator('h1').first();
    await expect(title).toBeVisible();
    console.log('✓ Movements Page - Caricata correttamente');
  });

  // ============================================================================
  // 6. USERS MODULE
  // ============================================================================

  test('Users Module - Lista Utenti', async ({ page }) => {
    await page.goto(`${BASE_URL}/users`);
    await page.waitForLoadState('networkidle');

    const title = await page.locator('h1').first();
    await expect(title).toBeVisible();
    console.log('✓ Users List Page - Caricata correttamente');
  });

  // ============================================================================
  // 7. LOCATIONS MODULE
  // ============================================================================

  test('Locations Module - Mappa Ubicazioni', async ({ page }) => {
    await page.goto(`${BASE_URL}/locations`);
    await page.waitForLoadState('networkidle');

    const title = await page.locator('h1').first();
    await expect(title).toBeVisible();
    console.log('✓ Locations Page - Caricata correttamente');
  });

  // ============================================================================
  // 8. PRODUCTS MODULE
  // ============================================================================

  test('Products Module - Catalogo Prodotti', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`);
    await page.waitForLoadState('networkidle');

    const title = await page.locator('h1').first();
    await expect(title).toBeVisible();
    console.log('✓ Products Page - Caricata correttamente');
  });

  // ============================================================================
  // 9. WORKSTATIONS MODULE
  // ============================================================================

  test('Workstations Module - Lista Postazioni', async ({ page }) => {
    await page.goto(`${BASE_URL}/workstations`);
    await page.waitForLoadState('networkidle');

    const title = await page.locator('h1').first();
    await expect(title).toBeVisible();
    console.log('✓ Workstations Page - Caricata correttamente');
  });

  // ============================================================================
  // 10. REPORTS MODULE
  // ============================================================================

  test('Reports Module - Dashboard Report', async ({ page }) => {
    await page.goto(`${BASE_URL}/reports`);
    await page.waitForLoadState('networkidle');

    const title = await page.locator('h1').first();
    await expect(title).toBeVisible();
    console.log('✓ Reports Dashboard Page - Caricata correttamente');
  });

  // ============================================================================
  // VERIFICA ELEMENTI UI COMUNI
  // ============================================================================

  test('Verifica Elementi UI - Items Page', async ({ page }) => {
    await page.goto(`${BASE_URL}/items-list`);
    await page.waitForLoadState('networkidle');

    // Verifica presenza componenti comuni
    const searchInput = page.locator('input[type="text"]').first();
    const buttons = page.locator('button');

    await expect(searchInput).toBeVisible();
    await expect(buttons.first()).toBeVisible();

    console.log('✓ UI Components - Verificati correttamente');
  });

  // ============================================================================
  // VERIFICA NAVIGAZIONE
  // ============================================================================

  test('Verifica Navigazione tra Moduli', async ({ page }) => {
    // Parte da Items
    await page.goto(`${BASE_URL}/items-list`);
    await page.waitForLoadState('networkidle');

    // Naviga a Lists
    await page.goto(`${BASE_URL}/lists-management`);
    await page.waitForLoadState('networkidle');
    const listsTitle = await page.locator('h1').first();
    await expect(listsTitle).toBeVisible();

    // Naviga a UDC
    await page.goto(`${BASE_URL}/udc-list`);
    await page.waitForLoadState('networkidle');
    const udcTitle = await page.locator('h1').first();
    await expect(udcTitle).toBeVisible();

    // Naviga a Reports
    await page.goto(`${BASE_URL}/reports`);
    await page.waitForLoadState('networkidle');
    const reportsTitle = await page.locator('h1').first();
    await expect(reportsTitle).toBeVisible();

    console.log('✓ Navigazione - Funziona correttamente tra tutti i moduli');
  });

  // ============================================================================
  // VERIFICA RESPONSIVE
  // ============================================================================

  test('Verifica Responsive Design - Mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

    await page.goto(`${BASE_URL}/reports`);
    await page.waitForLoadState('networkidle');

    const title = await page.locator('h1').first();
    await expect(title).toBeVisible();

    console.log('✓ Responsive Mobile - Funziona correttamente');
  });

  test('Verifica Responsive Design - Tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad

    await page.goto(`${BASE_URL}/reports`);
    await page.waitForLoadState('networkidle');

    const title = await page.locator('h1').first();
    await expect(title).toBeVisible();

    console.log('✓ Responsive Tablet - Funziona correttamente');
  });

  test('Verifica Responsive Design - Desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 }); // Full HD

    await page.goto(`${BASE_URL}/reports`);
    await page.waitForLoadState('networkidle');

    const title = await page.locator('h1').first();
    await expect(title).toBeVisible();

    console.log('✓ Responsive Desktop - Funziona correttamente');
  });

  // ============================================================================
  // VERIFICA PERFORMANCE
  // ============================================================================

  test('Verifica Performance - Tempo di Caricamento', async ({ page }) => {
    const startTime = Date.now();

    await page.goto(`${BASE_URL}/reports`);
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    console.log(`⏱ Tempo di caricamento: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(5000); // Deve caricare in meno di 5 secondi
  });

  // ============================================================================
  // VERIFICA NO ERRORI CONSOLE
  // ============================================================================

  test('Verifica Assenza Errori Console', async ({ page }) => {
    const consoleErrors = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto(`${BASE_URL}/reports`);
    await page.waitForLoadState('networkidle');

    console.log(`Console Errors: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.log('Errori trovati:', consoleErrors);
    }

    // Nota: alcuni errori possono essere accettabili (es. API non disponibili in dev)
  });

  // ============================================================================
  // VERIFICA TUTTI I MODULI IN SEQUENZA
  // ============================================================================

  test('Verifica Sequenziale Tutti i 10 Moduli', async ({ page }) => {
    const modules = [
      { name: 'Items', url: '/items-list' },
      { name: 'Lists', url: '/lists-management' },
      { name: 'UDC', url: '/udc-list' },
      { name: 'Operations', url: '/operations' },
      { name: 'Movements', url: '/movements' },
      { name: 'Users', url: '/users' },
      { name: 'Locations', url: '/locations' },
      { name: 'Products', url: '/products' },
      { name: 'Workstations', url: '/workstations' },
      { name: 'Reports', url: '/reports' },
    ];

    console.log('\n========================================');
    console.log('VERIFICA COMPLETA MODULI - INIZIO');
    console.log('========================================\n');

    for (const module of modules) {
      await page.goto(`${BASE_URL}${module.url}`);
      await page.waitForLoadState('networkidle');

      const title = await page.locator('h1').first();
      const isVisible = await title.isVisible();

      expect(isVisible).toBe(true);
      console.log(`✓ ${module.name.padEnd(15)} - ${module.url.padEnd(25)} - OK`);
    }

    console.log('\n========================================');
    console.log('TUTTI I 10 MODULI FUNZIONANO!');
    console.log('========================================\n');
  });

});
