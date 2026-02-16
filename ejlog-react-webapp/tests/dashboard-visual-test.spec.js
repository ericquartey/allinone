import { test, expect } from '@playwright/test';

test.describe('Dashboard Visual Test - Grafici e Widget', () => {
  test.beforeEach(async ({ page }) => {
    // Naviga alla dashboard
    await page.goto('http://localhost:3001/dashboard-advanced');

    // Attendi che la pagina sia completamente caricata
    await page.waitForLoadState('networkidle');
  });

  test('Dashboard - Verifica presenza widget KPI Cards', async ({ page }) => {
    console.log('\n=== TEST: KPI Cards Widget ===');

    // Cerca le KPI cards
    const kpiCards = page.locator('[data-testid*="kpi-card"], .kpi-card, [class*="KPI"]');
    const count = await kpiCards.count();

    console.log(`KPI Cards trovate: ${count}`);

    // Screenshot della dashboard
    await page.screenshot({
      path: 'test-results/dashboard-kpi-cards.png',
      fullPage: true
    });

    // Cerca testo indicativo di KPI
    const pageText = await page.textContent('body');
    console.log('Testo trovato sulla pagina:', pageText?.substring(0, 500));
  });

  test('Dashboard - Verifica presenza grafici Recharts', async ({ page }) => {
    console.log('\n=== TEST: Recharts Grafici ===');

    // Cerca elementi SVG (Recharts usa SVG)
    const svgElements = page.locator('svg.recharts-surface');
    const svgCount = await svgElements.count();

    console.log(`Grafici SVG Recharts trovati: ${svgCount}`);

    if (svgCount > 0) {
      console.log('✅ Grafici Recharts presenti!');

      // Screenshot dei grafici
      await page.screenshot({
        path: 'test-results/dashboard-recharts-graphs.png',
        fullPage: true
      });

      // Analizza i tipi di grafici
      const pieCharts = await page.locator('svg.recharts-surface:has(.recharts-pie)').count();
      const barCharts = await page.locator('svg.recharts-surface:has(.recharts-bar)').count();
      const lineCharts = await page.locator('svg.recharts-surface:has(.recharts-line)').count();
      const areaCharts = await page.locator('svg.recharts-surface:has(.recharts-area)').count();

      console.log(`  - Pie Charts: ${pieCharts}`);
      console.log(`  - Bar Charts: ${barCharts}`);
      console.log(`  - Line Charts: ${lineCharts}`);
      console.log(`  - Area Charts: ${areaCharts}`);
    } else {
      console.log('⚠️ Nessun grafico Recharts trovato');
    }
  });

  test('Dashboard - Verifica widget Products Overview', async ({ page }) => {
    console.log('\n=== TEST: Products Overview Widget ===');

    // Cerca il widget prodotti
    const productsWidget = page.locator('text=/prodott/i').first();
    const isVisible = await productsWidget.isVisible().catch(() => false);

    console.log(`Widget Prodotti visibile: ${isVisible}`);

    if (isVisible) {
      // Screenshot del widget
      await productsWidget.screenshot({
        path: 'test-results/dashboard-products-widget.png'
      });
    }

    // Screenshot generale
    await page.screenshot({
      path: 'test-results/dashboard-full-view.png',
      fullPage: true
    });
  });

  test('Dashboard - Verifica widget Items Analytics', async ({ page }) => {
    console.log('\n=== TEST: Items Analytics Widget ===');

    // Cerca riferimenti ad articoli
    const itemsText = page.locator('text=/articol/i').first();
    const isVisible = await itemsText.isVisible().catch(() => false);

    console.log(`Testo Articoli visibile: ${isVisible}`);
  });

  test('Dashboard - Verifica widget Movements', async ({ page }) => {
    console.log('\n=== TEST: Movements Widget ===');

    // Cerca riferimenti a movimenti
    const movementsText = page.locator('text=/moviment/i').first();
    const isVisible = await movementsText.isVisible().catch(() => false);

    console.log(`Testo Movimenti visibile: ${isVisible}`);
  });

  test('Dashboard - Interazione con grafici (hover)', async ({ page }) => {
    console.log('\n=== TEST: Interazione Grafici ===');

    // Trova tutti i grafici SVG
    const graphs = page.locator('svg.recharts-surface');
    const count = await graphs.count();

    console.log(`Grafici da testare: ${count}`);

    if (count > 0) {
      // Hover sul primo grafico
      const firstGraph = graphs.first();
      await firstGraph.hover();

      // Attendi eventuali tooltip
      await page.waitForTimeout(500);

      // Screenshot con hover
      await page.screenshot({
        path: 'test-results/dashboard-graph-hover.png',
        fullPage: true
      });

      // Cerca tooltip
      const tooltips = page.locator('.recharts-tooltip-wrapper, [class*="tooltip"]');
      const tooltipCount = await tooltips.count();
      console.log(`Tooltip trovati dopo hover: ${tooltipCount}`);
    }
  });

  test('Dashboard - Verifica loading states', async ({ page }) => {
    console.log('\n=== TEST: Loading States ===');

    // Screenshot immediato (potrebbe mostrare skeleton loaders)
    await page.screenshot({
      path: 'test-results/dashboard-loading.png',
      fullPage: true
    });

    // Attendi caricamento completo
    await page.waitForTimeout(2000);

    // Screenshot dopo caricamento
    await page.screenshot({
      path: 'test-results/dashboard-loaded.png',
      fullPage: true
    });
  });

  test('Dashboard - Analisi completa elementi', async ({ page }) => {
    console.log('\n=== ANALISI COMPLETA DASHBOARD ===');

    // Conta tutti gli elementi principali
    const analysis = {
      svgGraphs: await page.locator('svg').count(),
      rechartsGraphs: await page.locator('svg.recharts-surface').count(),
      buttons: await page.locator('button').count(),
      headings: await page.locator('h1, h2, h3').count(),
      cards: await page.locator('[class*="card"], [class*="Card"]').count(),
      widgets: await page.locator('[class*="widget"], [class*="Widget"]').count(),
    };

    console.log('\n📊 Elementi Dashboard:');
    console.log(`  Total SVG: ${analysis.svgGraphs}`);
    console.log(`  Recharts Graphs: ${analysis.rechartsGraphs}`);
    console.log(`  Buttons: ${analysis.buttons}`);
    console.log(`  Headings: ${analysis.headings}`);
    console.log(`  Cards: ${analysis.cards}`);
    console.log(`  Widgets: ${analysis.widgets}`);

    // Estrai titoli della pagina
    const h1 = await page.locator('h1').first().textContent().catch(() => 'N/A');
    const h2s = await page.locator('h2').allTextContents().catch(() => []);

    console.log(`\n📝 Titolo principale: ${h1}`);
    console.log(`📝 Sottotitoli (h2): ${h2s.join(', ')}`);

    // Screenshot finale
    await page.screenshot({
      path: 'test-results/dashboard-complete-analysis.png',
      fullPage: true
    });
  });

  test('Dashboard - Verifica responsiveness (mobile)', async ({ page }) => {
    console.log('\n=== TEST: Mobile View ===');

    // Imposta viewport mobile
    await page.setViewportSize({ width: 375, height: 667 });

    // Screenshot mobile
    await page.screenshot({
      path: 'test-results/dashboard-mobile-view.png',
      fullPage: true
    });

    // Verifica che i grafici siano ancora visibili
    const graphs = await page.locator('svg.recharts-surface').count();
    console.log(`Grafici visibili in mobile: ${graphs}`);
  });

  test('Dashboard - Verifica responsiveness (tablet)', async ({ page }) => {
    console.log('\n=== TEST: Tablet View ===');

    // Imposta viewport tablet
    await page.setViewportSize({ width: 768, height: 1024 });

    // Screenshot tablet
    await page.screenshot({
      path: 'test-results/dashboard-tablet-view.png',
      fullPage: true
    });
  });
});

test.describe('Dashboard Settings - Configurazione Widget', () => {
  test('Settings - Verifica pagina configurazione', async ({ page }) => {
    console.log('\n=== TEST: Dashboard Settings Page ===');

    // Naviga alle impostazioni
    await page.goto('http://localhost:3001/settings/dashboard');
    await page.waitForLoadState('networkidle');

    // Screenshot pagina settings
    await page.screenshot({
      path: 'test-results/dashboard-settings-page.png',
      fullPage: true
    });

    // Cerca toggle switches
    const switches = page.locator('input[type="checkbox"], [role="switch"]');
    const switchCount = await switches.count();

    console.log(`Toggle switches trovati: ${switchCount}`);

    // Analizza testo della pagina
    const pageText = await page.textContent('body');
    console.log('Elementi configurabili trovati:', pageText?.substring(0, 500));
  });
});
