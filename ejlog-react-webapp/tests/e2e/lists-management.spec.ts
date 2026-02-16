import { test, expect } from '@playwright/test';

test.describe('Lists Management Page', () => {
  test.beforeEach(async ({ page }) => {
    // Naviga alla pagina di login
    await page.goto('http://localhost:3000/login');

    // Login con credenziali di test
    await page.fill('input[name="username"]', 'superuser');
    await page.fill('input[name="password"]', 'promag26');
    await page.click('button[type="submit"]');

    // Aspetta il redirect alla dashboard
    await page.waitForURL('http://localhost:3000/', { timeout: 10000 });
  });

  test('should display Lists menu item and navigate to Lists Management page', async ({ page }) => {
    // Verifica che il menu laterale sia presente
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();

    // Cerca e clicca sulla voce "Liste" nel menu
    const listsMenuItem = page.locator('a[href="/lists-management"]');
    await expect(listsMenuItem).toBeVisible();
    await expect(listsMenuItem).toContainText('Liste');
    
    await listsMenuItem.click();

    // Verifica che siamo sulla pagina corretta
    await page.waitForURL('http://localhost:3000/lists-management');
    
    // Verifica il titolo della pagina
    await expect(page.locator('h1, h2').first()).toContainText(/Liste|Gestione Liste/i);
  });

  test('should load and display lists from API', async ({ page }) => {
    // Naviga direttamente alla pagina Liste
    await page.goto('http://localhost:3000/lists-management');

    // Aspetta che i dati siano caricati
    await page.waitForTimeout(2000);

    // Verifica che la tabella o la griglia di liste sia visibile
    const listsContainer = page.locator('table, [role="grid"], .lists-container').first();
    await expect(listsContainer).toBeVisible({ timeout: 10000 });

    // Verifica che almeno una lista sia visualizzata (PICK1743 o PICK1742)
    const listItems = page.locator('tr[data-testid*="list-"], .list-item, td');
    await expect(listItems.first()).toBeVisible({ timeout: 10000 });

    // Cerca i codici delle liste reali dal database
    const pageContent = await page.content();
    const hasPick1743 = pageContent.includes('PICK1743') || pageContent.includes('PICK-1743');
    const hasPick1742 = pageContent.includes('PICK1742') || pageContent.includes('PICK-1742');
    
    expect(hasPick1743 || hasPick1742).toBeTruthy();
  });

  test('should display list details (code, type, status, progress)', async ({ page }) => {
    await page.goto('http://localhost:3000/lists-management');
    await page.waitForTimeout(2000);

    const pageContent = await page.content();

    // Verifica presenza di informazioni chiave delle liste
    const hasListCode = pageContent.includes('PICK') || pageContent.includes('pick');
    const hasListType = pageContent.includes('Picking') || pageContent.includes('picking');
    const hasStatus = pageContent.includes('Nuova') || pageContent.includes('InEsecuzione') || pageContent.includes('Completata');
    
    expect(hasListCode).toBeTruthy();
    expect(hasListType || hasStatus).toBeTruthy();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Intercetta l'API e simula un errore
    await page.route('**/api/lists*', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });

    await page.goto('http://localhost:3000/lists-management');
    await page.waitForTimeout(1000);

    // Verifica che venga mostrato un messaggio di errore
    const errorMessage = page.locator('[role="alert"], .error-message, .alert-error');
    const pageText = await page.textContent('body');
    
    const hasErrorIndication = 
      (await errorMessage.count() > 0) || 
      pageText?.includes('errore') || 
      pageText?.includes('error') ||
      pageText?.includes('Nessun dato');

    expect(hasErrorIndication).toBeTruthy();
  });

  test('should have search/filter functionality visible', async ({ page }) => {
    await page.goto('http://localhost:3000/lists-management');
    await page.waitForTimeout(1000);

    // Cerca input di ricerca o filtri
    const searchInput = page.locator('input[type="search"], input[type="text"][placeholder*="cerca"], input[placeholder*="Cerca"]');
    const filterButton = page.locator('button:has-text("Filtri"), button:has-text("Filter")');
    
    const hasSearchOrFilter = 
      (await searchInput.count() > 0) || 
      (await filterButton.count() > 0);

    // La pagina dovrebbe avere almeno un meccanismo di ricerca/filtro
    expect(hasSearchOrFilter).toBeTruthy();
  });
});
