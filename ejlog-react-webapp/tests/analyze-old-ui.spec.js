/**
 * Playwright Script - Old EjLog UI Complete Analysis
 *
 * Purpose: Automatically navigate and capture screenshots of all 65+ pages
 *          of the old Java/Wicket EjLog UI for documentation and comparison.
 *
 * Prerequisites:
 * 1. Old UI must be running at http://localhost:8080/EjLog (or update OLD_UI_URL)
 * 2. Valid admin credentials (or update USERNAME/PASSWORD)
 * 3. Playwright installed: npm install @playwright/test
 * 4. Browsers installed: npx playwright install chromium
 *
 * Usage:
 *   npx playwright test tests/analyze-old-ui.spec.js --headed
 *
 * Output:
 *   - Screenshots in ./screenshots/old-ui/{category}/
 *   - Analysis report in ./OLD_UI_ANALYSIS_REPORT.md
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// ========================================
// CONFIGURATION
// ========================================

const OLD_UI_URL = 'http://localhost:8080/EjLog'; // TODO: Verify correct URL
const USERNAME = 'admin'; // TODO: Update with correct credentials
const PASSWORD = 'admin';
const SCREENSHOT_DIR = './screenshots/old-ui';

// Ensure screenshot directories exist
const CATEGORIES = [
  'rf-operations',
  'lists',
  'items',
  'stock',
  'udc',
  'locations',
  'users',
  'config',
  'automation',
  'monitoring',
  'reports',
];

CATEGORIES.forEach(category => {
  const dir = path.join(SCREENSHOT_DIR, category);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Take screenshot with metadata extraction
 */
async function capturePageAnalysis(page, category, name, description) {
  const screenshotPath = path.join(SCREENSHOT_DIR, category, `${name}.png`);

  // Take full-page screenshot
  await page.screenshot({ path: screenshotPath, fullPage: true });

  // Extract page structure
  const structure = await page.evaluate(() => {
    return {
      title: document.title,
      tables: Array.from(document.querySelectorAll('table')).length,
      forms: Array.from(document.querySelectorAll('form')).length,
      buttons: Array.from(document.querySelectorAll('button')).map(btn => ({
        text: btn.textContent?.trim(),
        type: btn.type,
        class: btn.className,
      })),
      inputs: Array.from(document.querySelectorAll('input')).map(input => ({
        name: input.name,
        type: input.type,
        placeholder: input.placeholder,
        required: input.required,
      })),
      selects: Array.from(document.querySelectorAll('select')).map(select => ({
        name: select.name,
        multiple: select.multiple,
        optionCount: select.options.length,
      })),
      links: Array.from(document.querySelectorAll('a[href]')).map(a => ({
        text: a.textContent?.trim(),
        href: a.href,
      })).slice(0, 20), // Limit to first 20
    };
  });

  console.log(`✅ Captured: ${category}/${name}`);
  console.log(`   - Tables: ${structure.tables}, Forms: ${structure.forms}, Buttons: ${structure.buttons.length}`);

  return {
    category,
    name,
    description,
    screenshot: screenshotPath,
    structure,
  };
}

/**
 * Wait for network to be idle and page fully loaded
 */
async function waitForPageLoad(page) {
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(500); // Extra buffer for dynamic content
}

// ========================================
// GLOBAL ANALYSIS STORAGE
// ========================================

const analysisData = [];

// ========================================
// TEST SUITE
// ========================================

test.describe('EjLog Old UI - Complete Analysis', () => {

  // Login once before all tests
  test.beforeEach(async ({ page }) => {
    console.log('🔐 Logging in to Old UI...');

    await page.goto(OLD_UI_URL);

    // TODO: Update selectors based on actual login form
    // Try multiple common selectors
    try {
      await page.fill('input[name="username"]', USERNAME);
      await page.fill('input[name="password"]', PASSWORD);
      await page.click('button[type="submit"]');
    } catch (e) {
      // Fallback selectors
      await page.fill('input[id="username"]', USERNAME);
      await page.fill('input[id="password"]', PASSWORD);
      await page.click('button:has-text("Login"), button:has-text("Accedi")');
    }

    await waitForPageLoad(page);

    // Verify login success (TODO: adjust selector)
    await expect(page).toHaveURL(/dashboard|home/i, { timeout: 5000 });
    console.log('✅ Login successful');
  });

  // ========================================
  // SECTION 1: RF OPERATIONS
  // ========================================

  test('RF-01 - Picking Execution', async ({ page }) => {
    await page.goto(`${OLD_UI_URL}/rf/picking/execution`);
    await waitForPageLoad(page);

    const analysis = await capturePageAnalysis(
      page,
      'rf-operations',
      '01-picking-execution',
      'Esecuzione Picking RF - Workflow guidato prelievo'
    );
    analysisData.push(analysis);
  });

  test('RF-02 - Picking View UDC', async ({ page }) => {
    await page.goto(`${OLD_UI_URL}/rf/picking/view-udc`);
    await waitForPageLoad(page);

    const analysis = await capturePageAnalysis(
      page,
      'rf-operations',
      '02-picking-view-udc',
      'Visualizzazione contenuto UDC durante picking'
    );
    analysisData.push(analysis);
  });

  test('RF-03 - Putaway Execution', async ({ page }) => {
    await page.goto(`${OLD_UI_URL}/rf/putaway/execution`);
    await waitForPageLoad(page);

    const analysis = await capturePageAnalysis(
      page,
      'rf-operations',
      '03-putaway-execution',
      'Esecuzione Putaway RF - Versamento merci'
    );
    analysisData.push(analysis);
  });

  test('RF-04 - Inventory Execution', async ({ page }) => {
    await page.goto(`${OLD_UI_URL}/rf/inventory/execution`);
    await waitForPageLoad(page);

    const analysis = await capturePageAnalysis(
      page,
      'rf-operations',
      '04-inventory-execution',
      'Esecuzione Inventario RF - Conteggio ciclico'
    );
    analysisData.push(analysis);
  });

  test('RF-05 - Transfer Material', async ({ page }) => {
    await page.goto(`${OLD_UI_URL}/rf/transfer/manual`);
    await waitForPageLoad(page);

    const analysis = await capturePageAnalysis(
      page,
      'rf-operations',
      '05-transfer-material',
      'Trasferimento Materiale Manuale'
    );
    analysisData.push(analysis);
  });

  // ========================================
  // SECTION 2: LISTS MANAGEMENT
  // ========================================

  test('LISTS-01 - Main List View', async ({ page }) => {
    await page.goto(`${OLD_UI_URL}/maintenance/lists/manage`);
    await waitForPageLoad(page);

    const analysis = await capturePageAnalysis(
      page,
      'lists',
      '01-lists-main',
      'Gestione Liste - Vista principale con filtri'
    );
    analysisData.push(analysis);

    // Extract table columns
    const columns = await page.$$eval('table thead th', headers =>
      headers.map(h => h.textContent?.trim())
    );
    analysis.tableColumns = columns;
  });

  test('LISTS-02 - List Detail', async ({ page }) => {
    await page.goto(`${OLD_UI_URL}/maintenance/lists/manage`);
    await waitForPageLoad(page);

    // Click first list (if any)
    const firstListLink = await page.$('table tbody tr:first-child a');
    if (firstListLink) {
      await firstListLink.click();
      await waitForPageLoad(page);

      const analysis = await capturePageAnalysis(
        page,
        'lists',
        '02-list-detail',
        'Dettaglio Lista - Tab Intestazione e Righe'
      );
      analysisData.push(analysis);

      // Capture tabs if present
      const tabs = await page.$$eval('.tab, [role="tab"]', tabs =>
        tabs.map(t => t.textContent?.trim())
      );
      analysis.tabs = tabs;
    }
  });

  test('LISTS-03 - Create List Wizard', async ({ page }) => {
    await page.goto(`${OLD_UI_URL}/maintenance/lists/wizard`);
    await waitForPageLoad(page);

    const analysis = await capturePageAnalysis(
      page,
      'lists',
      '03-list-create-wizard',
      'Creazione Guidata Lista - Wizard multi-step'
    );
    analysisData.push(analysis);
  });

  // ========================================
  // SECTION 3: ITEMS MANAGEMENT
  // ========================================

  test('ITEMS-01 - Items List', async ({ page }) => {
    await page.goto(`${OLD_UI_URL}/maintenance/items/list`);
    await waitForPageLoad(page);

    const analysis = await capturePageAnalysis(
      page,
      'items',
      '01-items-list',
      'Anagrafica Articoli - Lista principale'
    );
    analysisData.push(analysis);

    // Extract filters
    const filters = await page.$$eval('select, input[type="text"]', elements =>
      elements.map(el => ({
        name: el.name,
        type: el.type || 'select',
        placeholder: el.placeholder,
      }))
    );
    analysis.filters = filters;
  });

  test('ITEMS-02 - Item Detail', async ({ page }) => {
    await page.goto(`${OLD_UI_URL}/maintenance/items/list`);
    await waitForPageLoad(page);

    // Click first item
    const firstItemLink = await page.$('table tbody tr:first-child a');
    if (firstItemLink) {
      await firstItemLink.click();
      await waitForPageLoad(page);

      const analysis = await capturePageAnalysis(
        page,
        'items',
        '02-item-detail',
        'Dettaglio Articolo - Form completo'
      );
      analysisData.push(analysis);
    }
  });

  test('ITEMS-03 - Create Item', async ({ page }) => {
    await page.goto(`${OLD_UI_URL}/maintenance/items/new`);
    await waitForPageLoad(page);

    const analysis = await capturePageAnalysis(
      page,
      'items',
      '03-item-create',
      'Creazione Articolo - Form nuovo articolo'
    );
    analysisData.push(analysis);

    // Extract form fields in detail
    const formFields = await page.$$eval('input, select, textarea', fields =>
      fields.map(field => ({
        label: field.labels?.[0]?.textContent?.trim(),
        name: field.name,
        type: field.type || field.tagName.toLowerCase(),
        required: field.required,
        placeholder: field.placeholder,
      }))
    );
    analysis.formFields = formFields;
  });

  test('ITEMS-04 - Import Items', async ({ page }) => {
    await page.goto(`${OLD_UI_URL}/maintenance/items/import`);
    await waitForPageLoad(page);

    const analysis = await capturePageAnalysis(
      page,
      'items',
      '04-items-import',
      'Import Massivo Articoli - Wizard Excel'
    );
    analysisData.push(analysis);
  });

  // ========================================
  // SECTION 4: STOCK MANAGEMENT
  // ========================================

  test('STOCK-01 - Stock View', async ({ page }) => {
    await page.goto(`${OLD_UI_URL}/maintenance/stock/view`);
    await waitForPageLoad(page);

    const analysis = await capturePageAnalysis(
      page,
      'stock',
      '01-stock-view',
      'Visualizzazione Giacenze - Dettaglio per articolo/locazione'
    );
    analysisData.push(analysis);
  });

  test('STOCK-02 - Stock Adjustments', async ({ page }) => {
    await page.goto(`${OLD_UI_URL}/maintenance/stock/adjust`);
    await waitForPageLoad(page);

    const analysis = await capturePageAnalysis(
      page,
      'stock',
      '02-stock-adjust',
      'Rettifica Giacenze - Form con autorizzazione'
    );
    analysisData.push(analysis);
  });

  test('STOCK-03 - Stock Trends', async ({ page }) => {
    await page.goto(`${OLD_UI_URL}/maintenance/stock/trends`);
    await waitForPageLoad(page);

    const analysis = await capturePageAnalysis(
      page,
      'stock',
      '03-stock-trends',
      'Andamento Giacenze - Chart time series'
    );
    analysisData.push(analysis);
  });

  test('STOCK-04 - Movements History', async ({ page }) => {
    await page.goto(`${OLD_UI_URL}/maintenance/stock/movements`);
    await waitForPageLoad(page);

    const analysis = await capturePageAnalysis(
      page,
      'stock',
      '04-movements-history',
      'Storico Movimenti - Timeline movimenti'
    );
    analysisData.push(analysis);
  });

  // ========================================
  // SECTION 5: UDC MANAGEMENT
  // ========================================

  test('UDC-01 - UDC List', async ({ page }) => {
    await page.goto(`${OLD_UI_URL}/maintenance/udc/list`);
    await waitForPageLoad(page);

    const analysis = await capturePageAnalysis(
      page,
      'udc',
      '01-udc-list',
      'Gestione UDC - Lista unità di carico'
    );
    analysisData.push(analysis);
  });

  test('UDC-02 - UDC Detail', async ({ page }) => {
    await page.goto(`${OLD_UI_URL}/maintenance/udc/list`);
    await waitForPageLoad(page);

    const firstUdc = await page.$('table tbody tr:first-child a');
    if (firstUdc) {
      await firstUdc.click();
      await waitForPageLoad(page);

      const analysis = await capturePageAnalysis(
        page,
        'udc',
        '02-udc-detail',
        'Dettaglio UDC - Contenuto e storico'
      );
      analysisData.push(analysis);
    }
  });

  test('UDC-03 - Create/Close UDC', async ({ page }) => {
    await page.goto(`${OLD_UI_URL}/maintenance/udc/manage`);
    await waitForPageLoad(page);

    const analysis = await capturePageAnalysis(
      page,
      'udc',
      '03-udc-manage',
      'Creazione/Chiusura UDC - Form gestione'
    );
    analysisData.push(analysis);
  });

  // ========================================
  // SECTION 6: LOCATIONS
  // ========================================

  test('LOC-01 - Locations List', async ({ page }) => {
    await page.goto(`${OLD_UI_URL}/maintenance/locations/list`);
    await waitForPageLoad(page);

    const analysis = await capturePageAnalysis(
      page,
      'locations',
      '01-locations-list',
      'Gestione Locazioni - Lista con gerarchia'
    );
    analysisData.push(analysis);
  });

  test('LOC-02 - Location Detail', async ({ page }) => {
    await page.goto(`${OLD_UI_URL}/maintenance/locations/list`);
    await waitForPageLoad(page);

    const firstLoc = await page.$('table tbody tr:first-child a');
    if (firstLoc) {
      await firstLoc.click();
      await waitForPageLoad(page);

      const analysis = await capturePageAnalysis(
        page,
        'locations',
        '02-location-detail',
        'Dettaglio Locazione - Info + giacenze + capacità'
      );
      analysisData.push(analysis);
    }
  });

  test('LOC-03 - Location Capacity Config', async ({ page }) => {
    await page.goto(`${OLD_UI_URL}/maintenance/locations/capacity`);
    await waitForPageLoad(page);

    const analysis = await capturePageAnalysis(
      page,
      'locations',
      '03-location-capacity',
      'Configurazione Capacità Locazione'
    );
    analysisData.push(analysis);
  });

  // ========================================
  // SECTION 7: USERS & SECURITY
  // ========================================

  test('USERS-01 - Users List', async ({ page }) => {
    await page.goto(`${OLD_UI_URL}/maintenance/users/list`);
    await waitForPageLoad(page);

    const analysis = await capturePageAnalysis(
      page,
      'users',
      '01-users-list',
      'Gestione Utenti - Lista con permessi'
    );
    analysisData.push(analysis);
  });

  test('USERS-02 - User Detail', async ({ page }) => {
    await page.goto(`${OLD_UI_URL}/maintenance/users/list`);
    await waitForPageLoad(page);

    const firstUser = await page.$('table tbody tr:first-child a');
    if (firstUser) {
      await firstUser.click();
      await waitForPageLoad(page);

      const analysis = await capturePageAnalysis(
        page,
        'users',
        '02-user-detail',
        'Dettaglio Utente - Form + attività'
      );
      analysisData.push(analysis);
    }
  });

  test('USERS-03 - Groups Management', async ({ page }) => {
    await page.goto(`${OLD_UI_URL}/maintenance/groups/list`);
    await waitForPageLoad(page);

    const analysis = await capturePageAnalysis(
      page,
      'users',
      '03-groups-list',
      'Gestione Gruppi Utenti'
    );
    analysisData.push(analysis);
  });

  test('USERS-04 - Permissions Matrix', async ({ page }) => {
    await page.goto(`${OLD_UI_URL}/maintenance/permissions`);
    await waitForPageLoad(page);

    const analysis = await capturePageAnalysis(
      page,
      'users',
      '04-permissions-matrix',
      'Matrice Permessi - Gruppo/Utente/Funzionalità'
    );
    analysisData.push(analysis);
  });

  // ========================================
  // SECTION 8: CONFIGURATION
  // ========================================

  test('CFG-01 - Warehouses Config', async ({ page }) => {
    await page.goto(`${OLD_UI_URL}/config/warehouses`);
    await waitForPageLoad(page);

    const analysis = await capturePageAnalysis(
      page,
      'config',
      '01-warehouses',
      'Configurazione Magazzini'
    );
    analysisData.push(analysis);
  });

  test('CFG-02 - Areas/Zones Config', async ({ page }) => {
    await page.goto(`${OLD_UI_URL}/config/areas`);
    await waitForPageLoad(page);

    const analysis = await capturePageAnalysis(
      page,
      'config',
      '02-areas-zones',
      'Configurazione Aree e Zone'
    );
    analysisData.push(analysis);
  });

  test('CFG-03 - Slotting Rules', async ({ page }) => {
    await page.goto(`${OLD_UI_URL}/config/slotting-rules`);
    await waitForPageLoad(page);

    const analysis = await capturePageAnalysis(
      page,
      'config',
      '03-slotting-rules',
      'Regole Stoccaggio - ABC, Zone preferenziali'
    );
    analysisData.push(analysis);
  });

  test('CFG-04 - Printers Config', async ({ page }) => {
    await page.goto(`${OLD_UI_URL}/config/printers`);
    await waitForPageLoad(page);

    const analysis = await capturePageAnalysis(
      page,
      'config',
      '04-printers',
      'Configurazione Stampanti ZPL'
    );
    analysisData.push(analysis);
  });

  test('CFG-05 - Label Templates', async ({ page }) => {
    await page.goto(`${OLD_UI_URL}/config/labels`);
    await waitForPageLoad(page);

    const analysis = await capturePageAnalysis(
      page,
      'config',
      '05-label-templates',
      'Template Etichette - Designer ZPL'
    );
    analysisData.push(analysis);
  });

  // ========================================
  // SECTION 9: AUTOMATION
  // ========================================

  test('AUTO-01 - PLC Management', async ({ page }) => {
    await page.goto(`${OLD_UI_URL}/automation/plc`);
    await waitForPageLoad(page);

    const analysis = await capturePageAnalysis(
      page,
      'automation',
      '01-plc-management',
      'Gestione PLC - Monitoring e comandi'
    );
    analysisData.push(analysis);
  });

  test('AUTO-02 - Synoptic View', async ({ page }) => {
    await page.goto(`${OLD_UI_URL}/automation/synoptic`);
    await waitForPageLoad(page);

    const analysis = await capturePageAnalysis(
      page,
      'automation',
      '02-synoptic',
      'Sinottico Impianto - Dashboard grafica real-time'
    );
    analysisData.push(analysis);
  });

  test('AUTO-03 - Machines List', async ({ page }) => {
    await page.goto(`${OLD_UI_URL}/automation/machines`);
    await waitForPageLoad(page);

    const analysis = await capturePageAnalysis(
      page,
      'automation',
      '03-machines-list',
      'Gestione Macchine/Traslo - Lista con stato'
    );
    analysisData.push(analysis);
  });

  test('AUTO-04 - Pick-to-Light Workstation', async ({ page }) => {
    await page.goto(`${OLD_UI_URL}/automation/ptl`);
    await waitForPageLoad(page);

    const analysis = await capturePageAnalysis(
      page,
      'automation',
      '04-pick-to-light',
      'Pick-to-Light Workstation - Compartimenti'
    );
    analysisData.push(analysis);
  });

  test('AUTO-05 - Alarms', async ({ page }) => {
    await page.goto(`${OLD_UI_URL}/automation/alarms`);
    await waitForPageLoad(page);

    const analysis = await capturePageAnalysis(
      page,
      'automation',
      '05-alarms',
      'Gestione Allarmi Macchine'
    );
    analysisData.push(analysis);
  });

  // ========================================
  // SECTION 10: MONITORING
  // ========================================

  test('MON-01 - Main Dashboard', async ({ page }) => {
    await page.goto(`${OLD_UI_URL}/dashboard/main`);
    await waitForPageLoad(page);

    const analysis = await capturePageAnalysis(
      page,
      'monitoring',
      '01-dashboard-main',
      'Dashboard Principale - KPI real-time'
    );
    analysisData.push(analysis);

    // Extract KPI cards
    const kpis = await page.$$eval('.kpi-card, .stat-card', cards =>
      cards.map(card => ({
        title: card.querySelector('.title, h3')?.textContent?.trim(),
        value: card.querySelector('.value, .number')?.textContent?.trim(),
      }))
    );
    analysis.kpis = kpis;
  });

  test('MON-02 - Performance Dashboard', async ({ page }) => {
    await page.goto(`${OLD_UI_URL}/dashboard/performance`);
    await waitForPageLoad(page);

    const analysis = await capturePageAnalysis(
      page,
      'monitoring',
      '02-dashboard-performance',
      'Dashboard Performance - Metriche operative'
    );
    analysisData.push(analysis);
  });

  test('MON-03 - Alarms Dashboard', async ({ page }) => {
    await page.goto(`${OLD_UI_URL}/dashboard/alarms`);
    await waitForPageLoad(page);

    const analysis = await capturePageAnalysis(
      page,
      'monitoring',
      '03-dashboard-alarms',
      'Dashboard Allarmi - Real-time alerts'
    );
    analysisData.push(analysis);
  });

  // ========================================
  // SECTION 11: REPORTS
  // ========================================

  test('RPT-01 - Reports Center', async ({ page }) => {
    await page.goto(`${OLD_UI_URL}/reports/center`);
    await waitForPageLoad(page);

    const analysis = await capturePageAnalysis(
      page,
      'reports',
      '01-reports-center',
      'Centro Reportistica - Lista report predefiniti'
    );
    analysisData.push(analysis);
  });

  test('RPT-02 - Report Builder', async ({ page }) => {
    await page.goto(`${OLD_UI_URL}/reports/builder`);
    await waitForPageLoad(page);

    const analysis = await capturePageAnalysis(
      page,
      'reports',
      '02-report-builder',
      'Report Builder Personalizzato - Query designer'
    );
    analysisData.push(analysis);
  });

  // ========================================
  // GENERATE FINAL REPORT
  // ========================================

  test.afterAll(async () => {
    console.log('\n📊 Generating analysis report...');

    const report = generateMarkdownReport(analysisData);
    fs.writeFileSync('./OLD_UI_ANALYSIS_REPORT.md', report);

    console.log('✅ Analysis complete!');
    console.log(`   - Screenshots: ${analysisData.length}`);
    console.log(`   - Report: ./OLD_UI_ANALYSIS_REPORT.md`);
  });
});

// ========================================
// REPORT GENERATOR
// ========================================

function generateMarkdownReport(data) {
  const now = new Date().toISOString();

  let report = `# Old EjLog UI - Analysis Report

**Generated**: ${now}
**Total Pages Analyzed**: ${data.length}
**Screenshot Location**: ${SCREENSHOT_DIR}

---

## Summary by Category

`;

  // Group by category
  const byCategory = data.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  Object.entries(byCategory).forEach(([category, pages]) => {
    report += `### ${category.toUpperCase()} (${pages.length} pages)\n\n`;

    pages.forEach(page => {
      report += `#### ${page.name}\n`;
      report += `**Description**: ${page.description}\n\n`;
      report += `**Screenshot**: [${page.screenshot}](${page.screenshot})\n\n`;

      if (page.structure) {
        report += `**Structure**:\n`;
        report += `- Tables: ${page.structure.tables}\n`;
        report += `- Forms: ${page.structure.forms}\n`;
        report += `- Buttons: ${page.structure.buttons.length}\n`;
        report += `- Inputs: ${page.structure.inputs.length}\n`;
        report += `- Selects: ${page.structure.selects.length}\n`;

        if (page.structure.buttons.length > 0) {
          report += `\n**Buttons**:\n`;
          page.structure.buttons.slice(0, 10).forEach(btn => {
            report += `- "${btn.text}" (${btn.type})\n`;
          });
        }

        if (page.structure.inputs.length > 0) {
          report += `\n**Form Fields**:\n`;
          page.structure.inputs.slice(0, 10).forEach(input => {
            const req = input.required ? ' (required)' : '';
            report += `- ${input.name || input.placeholder} (${input.type})${req}\n`;
          });
        }
      }

      if (page.tableColumns && page.tableColumns.length > 0) {
        report += `\n**Table Columns**: ${page.tableColumns.join(', ')}\n`;
      }

      if (page.tabs && page.tabs.length > 0) {
        report += `\n**Tabs**: ${page.tabs.join(', ')}\n`;
      }

      if (page.kpis && page.kpis.length > 0) {
        report += `\n**KPIs**:\n`;
        page.kpis.forEach(kpi => {
          report += `- ${kpi.title}: ${kpi.value}\n`;
        });
      }

      report += `\n---\n\n`;
    });
  });

  report += `## Next Steps

1. Review all screenshots in \`${SCREENSHOT_DIR}\`
2. Compare with React webapp implementation
3. Identify missing features (GAP_ANALYSIS.md)
4. Prioritize implementation (MIGRATION_MATRIX.md)
5. Create detailed migration plan (MIGRATION_PLAN_DETAILED.md)

---

**Document auto-generated by Playwright analysis script**
`;

  return report;
}
