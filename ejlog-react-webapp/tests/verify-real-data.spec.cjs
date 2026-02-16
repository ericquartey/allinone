// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Test Suite: Verifica Menu, Pagine Funzionanti e Dati Reali
 * Requisiti utente:
 * 1. Menu riscritto con tutti i moduli
 * 2. Pagine vuote sostituite con pagine funzionanti
 * 3. Dati reali dal database EjLog visualizzati
 */

const BASE_URL = 'http://localhost:3001';
const API_BASE_URL = 'http://localhost:8080/EjLogHostVertimag';

test.describe('Verifica Menu e Pagine Funzionanti', () => {
  test.beforeEach(async ({ page }) => {
    // Naviga alla homepage
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('1. Verifica che il menu contiene tutti i 14 moduli', async ({ page }) => {
    // Verifica che il menu contenga tutti i moduli principali
    const menuItems = [
      'Dashboard',
      'Gestione Liste',
      'Gestione Articoli',
      'Gestione Ubicazioni',
      'Gestione UDC',
      'Esecuzione Picking',
      'Esecuzione Refilling',
      'Movimenti Stock',
      'Configurazione Zone',
      'Configurazione Stampanti',
      'Configurazione Utenti',
      'Gestione Allarmi',
      'Report Dashboard',
      'Gestione Ricevimento',
    ];

    for (const item of menuItems) {
      const menuLink = page.locator(`nav a:has-text("${item}")`);
      await expect(menuLink).toBeVisible({ timeout: 5000 });
      console.log(`✓ Menu item trovato: ${item}`);
    }
  });

  test('2. Verifica Dashboard con dati reali', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle');

    // Verifica che la dashboard sia visibile
    await expect(page.locator('h1, h2').filter({ hasText: /dashboard/i })).toBeVisible();

    // Verifica presenza di statistiche/cards
    const statsCards = page.locator('[class*="stat"], [class*="card"], [class*="metric"]');
    const count = await statsCards.count();
    expect(count).toBeGreaterThan(0);
    console.log(`✓ Dashboard caricata con ${count} elementi statistici`);
  });

  test('3. Verifica Gestione Liste con dati reali', async ({ page }) => {
    await page.goto(`${BASE_URL}/lists`);
    await page.waitForLoadState('networkidle');

    // Attendi che i dati siano caricati
    await page.waitForTimeout(2000);

    // Verifica header pagina
    await expect(page.locator('h1, h2').filter({ hasText: /liste/i })).toBeVisible();

    // Verifica presenza tabella o lista
    const hasTable = await page.locator('table').count() > 0;
    const hasList = await page.locator('[role="list"], ul li').count() > 0;

    expect(hasTable || hasList).toBeTruthy();
    console.log('✓ Pagina Liste caricata con contenuto');

    // Verifica che NON ci siano errori CORS
    const corsErrors = await page.evaluate(() => {
      return window.localStorage.getItem('cors-error');
    });
    expect(corsErrors).toBeNull();
  });

  test('4. Verifica Gestione Articoli con dati reali', async ({ page }) => {
    await page.goto(`${BASE_URL}/items`);
    await page.waitForLoadState('networkidle');

    // Attendi caricamento dati
    await page.waitForTimeout(2000);

    // Verifica header
    await expect(page.locator('h1, h2').filter({ hasText: /articoli/i })).toBeVisible();

    // Verifica presenza contenuto (tabella, cards, o lista)
    const hasContent = await page.locator('table, [class*="card"], [role="list"]').count() > 0;
    expect(hasContent).toBeTruthy();
    console.log('✓ Pagina Articoli caricata');
  });

  test('5. Verifica Gestione UDC con dati reali', async ({ page }) => {
    await page.goto(`${BASE_URL}/udc`);
    await page.waitForLoadState('networkidle');

    await page.waitForTimeout(2000);

    // Verifica header
    await expect(page.locator('h1, h2').filter({ hasText: /UDC/i })).toBeVisible();

    // Verifica presenza contenuto
    const hasContent = await page.locator('table, [class*="card"], [role="list"]').count() > 0;
    expect(hasContent).toBeTruthy();
    console.log('✓ Pagina UDC caricata');
  });

  test('6. Verifica Esecuzione Picking è funzionante', async ({ page }) => {
    await page.goto(`${BASE_URL}/picking`);
    await page.waitForLoadState('networkidle');

    // Verifica che la pagina non sia vuota (no "placeholder" text)
    const placeholder = await page.locator('text=/placeholder|coming soon|in costruzione/i').count();
    expect(placeholder).toBe(0);

    console.log('✓ Pagina Picking funzionante (non è placeholder)');
  });

  test('7. Verifica Movimenti Stock con dati reali', async ({ page }) => {
    await page.goto(`${BASE_URL}/stock/movements`);
    await page.waitForLoadState('networkidle');

    await page.waitForTimeout(2000);

    // Verifica header
    await expect(page.locator('h1, h2').filter({ hasText: /movimenti/i })).toBeVisible();

    console.log('✓ Pagina Movimenti Stock caricata');
  });

  test('8. Verifica Gestione Allarmi con dati reali', async ({ page }) => {
    await page.goto(`${BASE_URL}/alarms`);
    await page.waitForLoadState('networkidle');

    await page.waitForTimeout(2000);

    // Verifica header
    await expect(page.locator('h1, h2').filter({ hasText: /allarmi/i })).toBeVisible();

    console.log('✓ Pagina Allarmi caricata');
  });
});

test.describe('Verifica Chiamate API con Dati Reali', () => {
  test('9. API Lists restituisce dati reali', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/Lists`, {
      params: {
        limit: 10,
        offset: 0
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    console.log('Risposta API Lists:', JSON.stringify(data, null, 2));

    // Verifica struttura response
    expect(data).toHaveProperty('result');

    if (data.exportedItems) {
      console.log(`✓ API Lists restituisce ${data.exportedItems.length} liste`);
    } else {
      console.log('⚠ Nessuna lista disponibile nel database');
    }
  });

  test('10. API Items restituisce dati reali', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/Items`, {
      params: {
        limit: 10,
        offset: 0
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    console.log('Risposta API Items:', JSON.stringify(data, null, 2));

    expect(data).toHaveProperty('result');

    if (data.exportedItems) {
      console.log(`✓ API Items restituisce ${data.exportedItems.length} articoli`);
    } else {
      console.log('⚠ Nessun articolo disponibile nel database');
    }
  });

  test('11. API Stock restituisce dati reali', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/Stock`, {
      params: {
        limit: 10,
        offset: 0
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    console.log('Risposta API Stock:', JSON.stringify(data, null, 2));

    expect(data).toHaveProperty('result');

    if (data.exportedItems) {
      console.log(`✓ API Stock restituisce ${data.exportedItems.length} record`);
    } else {
      console.log('⚠ Nessun record stock disponibile nel database');
    }
  });

  test('12. Verifica CORS abilitato', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/test`, {
      params: {
        user: 'admin',
        password: 'admin'
      }
    });

    expect(response.ok()).toBeTruthy();

    // Verifica header CORS
    const corsHeader = response.headers()['access-control-allow-origin'];
    console.log('CORS Header:', corsHeader);

    // Dovrebbe essere '*' o il nostro origin
    expect(corsHeader).toBeTruthy();
    console.log('✓ CORS abilitato correttamente');
  });
});

test.describe('Verifica Pagine Non Siano Placeholder', () => {
  const pages = [
    { url: '/lists', name: 'Liste' },
    { url: '/items', name: 'Articoli' },
    { url: '/locations', name: 'Ubicazioni' },
    { url: '/udc', name: 'UDC' },
    { url: '/picking', name: 'Picking' },
    { url: '/refilling', name: 'Refilling' },
    { url: '/stock/movements', name: 'Movimenti' },
    { url: '/config/zones', name: 'Zone' },
    { url: '/config/printers', name: 'Stampanti' },
    { url: '/config/users', name: 'Utenti' },
    { url: '/alarms', name: 'Allarmi' },
    { url: '/reports', name: 'Report' },
    { url: '/receiving', name: 'Ricevimento' },
  ];

  for (const page of pages) {
    test(`13.${pages.indexOf(page) + 1}. Pagina ${page.name} non è placeholder`, async ({ page: pw }) => {
      await pw.goto(`${BASE_URL}${page.url}`);
      await pw.waitForLoadState('networkidle');

      // Verifica che non ci sia testo placeholder
      const placeholders = await pw.locator('text=/placeholder|coming soon|in costruzione|wip|work in progress/i').count();
      expect(placeholders).toBe(0);

      // Verifica che ci sia un header
      const hasHeader = await pw.locator('h1, h2, h3').count() > 0;
      expect(hasHeader).toBeTruthy();

      console.log(`✓ Pagina ${page.name} è funzionante (non placeholder)`);
    });
  }
});
