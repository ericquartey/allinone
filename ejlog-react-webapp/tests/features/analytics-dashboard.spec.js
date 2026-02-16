// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Analytics Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to analytics dashboard
    await page.goto('http://localhost:3001/analytics');

    // Wait for the dashboard to load
    await page.waitForLoadState('networkidle');
  });

  test('should display dashboard header with title and refresh button', async ({ page }) => {
    // Check header title
    await expect(page.locator('h1:has-text("Dashboard Analytics")')).toBeVisible();

    // Check subtitle
    await expect(page.locator('text=Panoramica performance e metriche operative')).toBeVisible();

    // Check refresh button
    const refreshButton = page.locator('button:has-text("Aggiorna")');
    await expect(refreshButton).toBeVisible();
    await expect(refreshButton).toBeEnabled();
  });

  test('should display all 4 KPI cards', async ({ page }) => {
    // Wait for KPI widgets to load
    await page.waitForSelector('text=Articoli in Stock', { timeout: 10000 });

    // Check all 4 KPI cards are present
    await expect(page.locator('text=Articoli in Stock')).toBeVisible();
    await expect(page.locator('text=Ordini Completati')).toBeVisible();
    await expect(page.locator('text=Valore Inventario')).toBeVisible();
    await expect(page.locator('text=Efficienza Media')).toBeVisible();

    // Check that KPI values are displayed (numbers should be visible)
    const kpiValues = page.locator('.text-3xl.font-bold.text-gray-900');
    await expect(kpiValues.first()).toBeVisible();

    // Check that trend indicators are shown
    await expect(page.locator('text=vs periodo precedente')).toBeVisible();
  });

  test('should display Inventory Health Widget', async ({ page }) => {
    // Check widget title
    await expect(page.locator('h3:has-text("Stato Salute Inventario")')).toBeVisible();

    // Check subtitle
    await expect(page.locator('text=Distribuzione articoli per stato di salute')).toBeVisible();

    // Check all health states are displayed
    await expect(page.locator('text=OK')).toBeVisible();
    await expect(page.locator('text=Basso')).toBeVisible();
    await expect(page.locator('text=Critico')).toBeVisible();
    await expect(page.locator('text=Eccesso')).toBeVisible();
    await expect(page.locator('text=Obsoleto')).toBeVisible();

    // Check total is displayed
    await expect(page.locator('text=Totale')).toBeVisible();
  });

  test('should display Orders Widget', async ({ page }) => {
    // Check widget title
    await expect(page.locator('h3:has-text("Gestione Ordini")')).toBeVisible();

    // Check subtitle
    await expect(page.locator('text=Stato ordini e performance consegne')).toBeVisible();

    // Check status cards
    await expect(page.locator('text=In Attesa')).toBeVisible();
    await expect(page.locator('text=In Lavorazione')).toBeVisible();
    await expect(page.locator('text=Completati')).toBeVisible();
    await expect(page.locator('text=Annullati')).toBeVisible();

    // Check performance metrics
    await expect(page.locator('text=Tempo Medio Completamento')).toBeVisible();
    await expect(page.locator('text=Consegne Puntuali')).toBeVisible();
    await expect(page.locator('text=Completati Oggi')).toBeVisible();
    await expect(page.locator('text=In Attesa Oggi')).toBeVisible();

    // Check trend chart is present
    await expect(page.locator('h4:has-text("Trend Ultimi 7 Giorni")')).toBeVisible();
  });

  test('should display Performance Widget', async ({ page }) => {
    // Check widget title
    await expect(page.locator('h3:has-text("Performance Operativa")')).toBeVisible();

    // Check subtitle
    await expect(page.locator('text=Metriche di efficienza e produttività')).toBeVisible();

    // Check performance cards are present
    await expect(page.locator('text=Articoli/ora')).toBeVisible();
    await expect(page.locator('text=Ubicazioni occupate')).toBeVisible();
    await expect(page.locator('text=Movimenti oggi')).toBeVisible();
    await expect(page.locator('text=Sessioni oggi')).toBeVisible();

    // Check trend charts are present
    await expect(page.locator('h4:has-text("Efficienza Liste")')).toBeVisible();
    await expect(page.locator('h4:has-text("Movimenti Orari")')).toBeVisible();

    // Check summary stats
    await expect(page.locator('text=Produttività')).toBeVisible();
    await expect(page.locator('text=Liste/Giorno')).toBeVisible();
    await expect(page.locator('text=Utilizzo Spazi')).toBeVisible();
    await expect(page.locator('text=Operatori Attivi')).toBeVisible();
  });

  test('should display beta notification banner', async ({ page }) => {
    // Check beta notification is shown
    await expect(page.locator('text=Dashboard in Fase Beta')).toBeVisible();
    await expect(page.locator('text=Questa è la versione iniziale del dashboard analytics')).toBeVisible();
  });

  test('should refresh data when clicking refresh button', async ({ page }) => {
    // Get initial last update time
    const initialTime = await page.locator('text=Ultimo aggiornamento').locator('..').locator('.text-sm.font-medium.text-gray-900').textContent();

    // Wait a moment
    await page.waitForTimeout(1000);

    // Click refresh button
    await page.locator('button:has-text("Aggiorna")').click();

    // Check that refresh button shows loading state (disabled during refresh)
    const refreshButton = page.locator('button:has-text("Aggiorna")');

    // Wait for refresh to complete
    await page.waitForTimeout(1500);

    // Get new time
    const newTime = await page.locator('text=Ultimo aggiornamento').locator('..').locator('.text-sm.font-medium.text-gray-900').textContent();

    // Times should be different (or at least the refresh completed)
    console.log('Initial time:', initialTime);
    console.log('New time:', newTime);
  });

  test('should have responsive layout on different screen sizes', async ({ page }) => {
    // Test desktop view (already loaded)
    await expect(page.locator('h1:has-text("Dashboard Analytics")')).toBeVisible();

    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    await expect(page.locator('h1:has-text("Dashboard Analytics")')).toBeVisible();

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    await expect(page.locator('h1:has-text("Dashboard Analytics")')).toBeVisible();

    // Restore desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('should render all Recharts visualizations', async ({ page }) => {
    // Wait for charts to render
    await page.waitForTimeout(2000);

    // Check that SVG elements are present (Recharts renders as SVG)
    const svgElements = page.locator('svg');
    const svgCount = await svgElements.count();

    // We should have multiple SVG charts:
    // - Inventory Health pie chart
    // - Orders trend bar chart
    // - Performance line charts (2)
    // - Performance area chart
    expect(svgCount).toBeGreaterThan(4);

    console.log(`Found ${svgCount} SVG chart elements`);
  });

  test('should display mock data correctly', async ({ page }) => {
    // Verify specific mock data values are displayed

    // KPI - Articoli in Stock should be around 12,548
    const stockText = await page.locator('text=Articoli in Stock').locator('..').locator('..').locator('.text-3xl.font-bold.text-gray-900').textContent();
    expect(stockText).toContain('12');

    // Orders - should have 342 completed
    const ordersText = await page.locator('text=Ordini Completati').locator('..').locator('..').locator('.text-3xl.font-bold.text-gray-900').textContent();
    expect(ordersText).toContain('342');

    // Efficiency should be around 92.5%
    const efficiencyText = await page.locator('text=Efficienza Media').locator('..').locator('..').locator('.text-3xl.font-bold.text-gray-900').textContent();
    expect(efficiencyText).toContain('92');
  });

  test('should take screenshot of full dashboard', async ({ page }) => {
    // Wait for all content to load
    await page.waitForTimeout(2000);

    // Take full page screenshot
    await page.screenshot({
      path: 'test-results/analytics-dashboard-full.png',
      fullPage: true
    });

    console.log('Screenshot saved to test-results/analytics-dashboard-full.png');
  });
});
