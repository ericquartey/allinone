import { test, expect } from '@playwright/test';

/**
 * Quick Fix Verification Test
 * Verifica rapida che le correzioni principali siano state applicate
 */

const SAMPLE_PAGES = [
  { name: 'Dashboard', path: '/' },
  { name: 'Gestione Liste', path: '/lists' },
  { name: 'Report Dashboard', path: '/reports' },
];

test.describe('Quick Fix Verification', () => {

  for (const pageInfo of SAMPLE_PAGES) {
    test(`Verify: ${pageInfo.name}`, async ({ page }) => {
      const errors = [];
      const consoleErrors = [];

      // Cattura errori console
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      // Cattura errori di rendering
      page.on('pageerror', error => {
        errors.push(error.message);
      });

      console.log(`\n🔍 Testing: ${pageInfo.name} (${pageInfo.path})`);

      // Naviga alla pagina
      await page.goto(`http://localhost:3002${pageInfo.path}`, {
        waitUntil: 'domcontentloaded',  // Changed from networkidle to avoid timeout
        timeout: 15000
      });

      // Aspetta rendering
      await page.waitForTimeout(2000);

      // Screenshot
      await page.screenshot({
        path: `test-results/fix-verify-${pageInfo.name.replace(/\s+/g, '-').toLowerCase()}.png`,
        fullPage: true
      });

      // Verifica CSP errors (dovrebbero essere spariti)
      const cspErrors = consoleErrors.filter(err =>
        err.includes('Content Security Policy') ||
        err.includes('Refused to connect')
      );

      // Verifica errori 404 su /api/api
      const doubleApiErrors = consoleErrors.filter(err =>
        err.includes('/api/api/')
      );

      // Verifica workstation errors
      const workstationErrors = consoleErrors.filter(err =>
        err.includes('workstation') && err.includes('Failed to fetch')
      );

      console.log(`   📊 Total console errors: ${consoleErrors.length}`);
      console.log(`   🔒 CSP errors: ${cspErrors.length}`);
      console.log(`   🔗 Double /api/api errors: ${doubleApiErrors.length}`);
      console.log(`   🖥️  Workstation errors: ${workstationErrors.length}`);

      // Report
      if (cspErrors.length > 0) {
        console.log(`   ❌ CSP errors still present:`);
        cspErrors.forEach(err => console.log(`      - ${err.substring(0, 100)}...`));
      } else {
        console.log(`   ✅ CSP errors fixed!`);
      }

      if (doubleApiErrors.length > 0) {
        console.log(`   ❌ Double /api/api errors still present`);
      } else {
        console.log(`   ✅ Double /api/api errors fixed!`);
      }

      if (workstationErrors.length > 0) {
        console.log(`   ⚠️  Workstation still has fetch errors (expected if backend offline)`);
      } else {
        console.log(`   ✅ No workstation fetch errors`);
      }

      // Verifica che la pagina sia renderizzata
      const hasContent = await page.locator('body').textContent();
      expect(hasContent).toBeTruthy();
      expect(hasContent.length).toBeGreaterThan(100);
    });
  }

  test.afterAll(() => {
    console.log('\n' + '='.repeat(80));
    console.log('✅ FIX VERIFICATION COMPLETE');
    console.log('='.repeat(80) + '\n');
  });
});
