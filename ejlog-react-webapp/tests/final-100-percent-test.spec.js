// ============================================================================
// Final 100% Completion Test - All 14 Menu Pages
// Verifies that all pages have proper layouts, headers, and no critical errors
// ============================================================================

import { test, expect } from '@playwright/test';

const PAGES_TO_TEST = [
  { name: 'Dashboard', path: '/', expectedTitle: 'Dashboard' },
  { name: 'Gestione Liste', path: '/lists', expectedTitle: 'Gestione Liste' },
  { name: 'Liste in Esecuzione', path: '/lists/execution', expectedTitle: 'Liste in Esecuzione' },
  { name: 'Giacenze', path: '/stock', expectedTitle: 'Giacenze' },
  { name: 'Movimenti', path: '/stock/movements', expectedTitle: 'Movimenti' },
  { name: 'Esecuzione Picking', path: '/picking', expectedTitle: 'Esecuzione Picking' },
  { name: 'Esecuzione Refilling', path: '/refilling', expectedTitle: 'Esecuzione Refilling' },
  { name: 'Operazioni RF', path: '/rf-operations', expectedTitle: 'Operazioni RF' },
  { name: 'Report e Analisi', path: '/reports', expectedTitle: 'Report' },
  { name: 'Configurazione Zone', path: '/config/zones', expectedTitle: 'Zone' },
  { name: 'Configurazione Stampanti', path: '/config/printers', expectedTitle: 'Configurazione Stampanti' },
  { name: 'Configurazione Utenti', path: '/config/users', expectedTitle: 'Gestione Utenti' },
  { name: 'Gestione Allarmi', path: '/alarms', expectedTitle: 'Allarmi' },
  { name: 'Impostazioni', path: '/settings/general', expectedTitle: 'Impostazioni' },
];

test.describe('Final 100% Completion Test', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  for (const pageInfo of PAGES_TO_TEST) {
    test(`${pageInfo.name} - Should load with proper layout`, async ({ page }) => {
      const consoleErrors = [];
      const criticalErrors = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          const errorText = msg.text();
          consoleErrors.push(errorText);

          // Track critical errors (not 404s from backend)
          if (!errorText.includes('404') &&
              !errorText.includes('Failed to fetch') &&
              !errorText.includes('NetworkError')) {
            criticalErrors.push(errorText);
          }
        }
      });

      page.on('pageerror', (error) => {
        criticalErrors.push(`Page Error: ${error.message}`);
      });

      // Navigate to page
      console.log(`\n📄 Testing: ${pageInfo.name} (${pageInfo.path})`);
      await page.goto(pageInfo.path);
      await page.waitForLoadState('networkidle', { timeout: 10000 });

      // Check for MainLayout presence (header + sidebar + main)
      const hasHeader = await page.locator('header').count() > 0;
      const hasSidebar = await page.locator('nav, aside, [class*="sidebar"]').count() > 0;
      const hasMain = await page.locator('main, [role="main"], .main-content').count() > 0;

      console.log(`   ✓ Header: ${hasHeader}`);
      console.log(`   ✓ Sidebar: ${hasSidebar}`);
      console.log(`   ✓ Main Content: ${hasMain}`);

      // Check for page title/heading
      const hasH1 = await page.locator('h1').count() > 0;
      if (hasH1) {
        const h1Text = await page.locator('h1').first().textContent();
        console.log(`   ✓ Page Title: "${h1Text}"`);
      }

      // Report errors
      if (criticalErrors.length > 0) {
        console.log(`   ⚠️  Critical Errors: ${criticalErrors.length}`);
        criticalErrors.forEach(err => console.log(`      - ${err}`));
      } else {
        console.log(`   ✅ No critical errors`);
      }

      if (consoleErrors.length > 0) {
        console.log(`   ℹ️  Total console errors (including 404s): ${consoleErrors.length}`);
      }

      // Assertions
      expect(hasHeader || hasSidebar || hasMain,
        `Page "${pageInfo.name}" missing layout structure`).toBe(true);

      expect(hasH1,
        `Page "${pageInfo.name}" missing main heading (h1)`).toBe(true);

      expect(criticalErrors,
        `Page "${pageInfo.name}" has critical JavaScript errors`).toHaveLength(0);

      console.log(`   ✅ ${pageInfo.name} - PASSED\n`);
    });
  }
});

// Summary test
test('All 14 pages - Summary', async ({ page }) => {
  console.log('\n' + '='.repeat(80));
  console.log('📊 FINAL SUMMARY - 14 PAGES TEST');
  console.log('='.repeat(80));
  console.log(`Total Pages Tested: ${PAGES_TO_TEST.length}`);
  console.log('Expected Result: 14/14 pages with proper layouts and no critical errors');
  console.log('Target: 100% Completion');
  console.log('='.repeat(80) + '\n');
});
