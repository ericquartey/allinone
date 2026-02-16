import { test, expect } from '@playwright/test';

/**
 * Comprehensive Page Analysis Test
 * Analizza tutte le 14 pagine del menu React
 * Identifica errori di rendering, console errors, network failures
 */

const PAGES = [
  { name: 'Dashboard', path: '/', expectedTitle: 'Dashboard' },
  { name: 'Gestione Liste', path: '/lists', expectedTitle: 'Liste' },
  { name: 'Gestione Articoli', path: '/items', expectedTitle: 'Articoli' },
  { name: 'Gestione Ubicazioni', path: '/locations', expectedTitle: 'Ubicazioni' },
  { name: 'Gestione UDC', path: '/udc', expectedTitle: 'UDC' },
  { name: 'Esecuzione Picking', path: '/picking', expectedTitle: 'Picking' },
  { name: 'Esecuzione Refilling', path: '/refilling', expectedTitle: 'Refilling' },
  { name: 'Movimenti Stock', path: '/stock/movements', expectedTitle: 'Stock' },
  { name: 'Configurazione Zone', path: '/config/zones', expectedTitle: 'Zone' },
  { name: 'Configurazione Stampanti', path: '/config/printers', expectedTitle: 'Stampanti' },
  { name: 'Configurazione Utenti', path: '/config/users', expectedTitle: 'Utenti' },
  { name: 'Gestione Allarmi', path: '/alarms', expectedTitle: 'Allarmi' },
  { name: 'Report Dashboard', path: '/reports', expectedTitle: 'Report' },
  { name: 'Gestione Ricevimento', path: '/receiving', expectedTitle: 'Ricevimento' },
];

// Collezione errori globali
const allErrors = {
  consoleErrors: [],
  networkErrors: [],
  renderingErrors: [],
  missingElements: [],
};

test.describe('Comprehensive Page Analysis - All 14 Pages', () => {

  test.beforeEach(async ({ page }) => {
    // Cattura errori console
    page.on('console', msg => {
      if (msg.type() === 'error') {
        allErrors.consoleErrors.push({
          page: page.url(),
          message: msg.text(),
          timestamp: new Date().toISOString()
        });
      }
    });

    // Cattura errori di rete
    page.on('requestfailed', request => {
      allErrors.networkErrors.push({
        page: page.url(),
        url: request.url(),
        method: request.method(),
        failure: request.failure()?.errorText,
        timestamp: new Date().toISOString()
      });
    });

    // Cattura errori non gestiti
    page.on('pageerror', error => {
      allErrors.renderingErrors.push({
        page: page.url(),
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    });
  });

  for (const pageInfo of PAGES) {
    test(`Analyze: ${pageInfo.name} (${pageInfo.path})`, async ({ page }) => {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`ANALYZING PAGE: ${pageInfo.name}`);
      console.log(`PATH: ${pageInfo.path}`);
      console.log(`${'='.repeat(80)}\n`);

      // Naviga alla pagina con timeout lungo
      const response = await page.goto(`http://localhost:3002${pageInfo.path}`, {
        waitUntil: 'domcontentloaded',
        timeout: 20000
      }).catch(err => {
        console.error(`❌ Navigation failed for ${pageInfo.name}: ${err.message}`);
        return null;
      });

      // Screenshot per debug
      await page.screenshot({
        path: `test-results/page-${pageInfo.name.replace(/\s+/g, '-').toLowerCase()}.png`,
        fullPage: true
      });

      // Test 1: Response status
      if (response) {
        const status = response.status();
        console.log(`📊 HTTP Status: ${status}`);
        if (status >= 400) {
          console.error(`❌ ERROR: HTTP ${status} for ${pageInfo.name}`);
        }
      }

      // Test 2: Page title
      const title = await page.title();
      console.log(`📄 Page Title: "${title}"`);

      // Test 3: Check for error boundaries
      const errorBoundary = await page.locator('[data-error-boundary], .error-boundary').count();
      if (errorBoundary > 0) {
        console.error(`❌ ERROR BOUNDARY DETECTED on ${pageInfo.name}`);
        const errorText = await page.locator('[data-error-boundary], .error-boundary').first().textContent().catch(() => 'N/A');
        console.error(`Error text: ${errorText}`);
      }

      // Test 4: Check body text for error messages
      const bodyText = await page.locator('body').textContent();
      if (bodyText && (bodyText.toLowerCase().includes('something went wrong') || bodyText.includes('Unhandled'))) {
        console.error(`❌ Critical error text found in page body`);
      }

      // Test 5: Verifica elementi principali
      const checks = {
        hasHeader: await page.locator('header, [role="banner"]').count() > 0,
        hasSidebar: await page.locator('aside, nav').count() > 0,
        hasMainContent: await page.locator('main, [role="main"]').count() > 0,
        hasButtons: await page.locator('button').count() > 0,
      };

      console.log('\n📋 Page Structure:');
      console.log(`  Header: ${checks.hasHeader ? '✅' : '❌'}`);
      console.log(`  Sidebar: ${checks.hasSidebar ? '✅' : '❌'}`);
      console.log(`  Main Content: ${checks.hasMainContent ? '✅' : '❌'}`);
      console.log(`  Buttons: ${checks.hasButtons ? '✅' : '❌'}`);

      if (!checks.hasMainContent) {
        allErrors.missingElements.push({
          page: pageInfo.name,
          path: pageInfo.path,
          missing: 'main content area'
        });
      }

      // Test 6: Verifica presenza tabelle/liste (dove applicabile)
      const hasTables = await page.locator('table, [role="table"]').count() > 0;
      const hasLists = await page.locator('ul, ol').count() > 0;
      console.log(`  Tables: ${hasTables ? '✅' : '➖'}`);
      console.log(`  Lists: ${hasLists ? '✅' : '➖'}`);

      // Test 7: Check for loading states stuck
      await page.waitForTimeout(3000); // Aspetta eventuali loading
      const loadingIndicators = await page.locator('text=/loading/i, [data-loading], .loading, .spinner').count();
      if (loadingIndicators > 0) {
        console.warn(`⚠️  Loading indicator still visible after 3s on ${pageInfo.name}`);
      }

      // Test 8: Check for empty states
      const emptyState = await page.locator('text=/no data/i, text=/nessun dato/i, text=/empty/i, text=/vuoto/i').count();
      if (emptyState > 0) {
        console.log(`ℹ️  Empty state detected on ${pageInfo.name}`);
      }

      // Test 9: Accessibility - check for missing alt texts on images
      const images = await page.locator('img').all();
      let missingAlt = 0;
      for (const img of images) {
        const alt = await img.getAttribute('alt');
        if (!alt) missingAlt++;
      }
      if (missingAlt > 0) {
        console.warn(`⚠️  ${missingAlt} images without alt text`);
      }

      console.log(`\n✅ Analysis completed for ${pageInfo.name}\n`);
    });
  }

  test.afterAll(async () => {
    console.log('\n\n');
    console.log('╔═══════════════════════════════════════════════════════════════════════════╗');
    console.log('║                    COMPREHENSIVE ERROR REPORT                              ║');
    console.log('╚═══════════════════════════════════════════════════════════════════════════╝');
    console.log('\n');

    // Console Errors
    if (allErrors.consoleErrors.length > 0) {
      console.log('🔴 CONSOLE ERRORS:');
      console.log(`   Total: ${allErrors.consoleErrors.length}`);
      const uniqueErrors = [...new Set(allErrors.consoleErrors.map(e => e.message))];
      uniqueErrors.forEach((err, i) => {
        console.log(`   ${i + 1}. ${err}`);
      });
      console.log('\n');
    }

    // Network Errors
    if (allErrors.networkErrors.length > 0) {
      console.log('🌐 NETWORK ERRORS:');
      console.log(`   Total: ${allErrors.networkErrors.length}`);

      // Raggruppa per URL
      const errorsByUrl = {};
      allErrors.networkErrors.forEach(err => {
        const url = err.url;
        if (!errorsByUrl[url]) {
          errorsByUrl[url] = { count: 0, method: err.method, failure: err.failure };
        }
        errorsByUrl[url].count++;
      });

      Object.entries(errorsByUrl).forEach(([url, info], i) => {
        console.log(`   ${i + 1}. [${info.method}] ${url}`);
        console.log(`      Count: ${info.count}, Failure: ${info.failure || 'Unknown'}`);
      });
      console.log('\n');
    }

    // Rendering Errors
    if (allErrors.renderingErrors.length > 0) {
      console.log('⚛️  RENDERING ERRORS:');
      console.log(`   Total: ${allErrors.renderingErrors.length}`);
      allErrors.renderingErrors.forEach((err, i) => {
        console.log(`   ${i + 1}. ${err.message}`);
        if (err.stack) {
          console.log(`      Stack: ${err.stack.split('\n')[0]}`);
        }
      });
      console.log('\n');
    }

    // Missing Elements
    if (allErrors.missingElements.length > 0) {
      console.log('🔍 MISSING ELEMENTS:');
      allErrors.missingElements.forEach((err, i) => {
        console.log(`   ${i + 1}. Page: ${err.page} (${err.path})`);
        console.log(`      Missing: ${err.missing}`);
      });
      console.log('\n');
    }

    // Summary
    console.log('📊 SUMMARY:');
    console.log(`   Console Errors: ${allErrors.consoleErrors.length}`);
    console.log(`   Network Errors: ${allErrors.networkErrors.length}`);
    console.log(`   Rendering Errors: ${allErrors.renderingErrors.length}`);
    console.log(`   Missing Elements: ${allErrors.missingElements.length}`);
    console.log(`   Total Issues: ${
      allErrors.consoleErrors.length +
      allErrors.networkErrors.length +
      allErrors.renderingErrors.length +
      allErrors.missingElements.length
    }`);
    console.log('\n');
  });
});
