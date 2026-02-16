/**
 * Stock DOM Inspector
 * Genera report dettagliato della struttura HTML della pagina stock
 * per identificare selettori corretti
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Stock DOM Inspector', () => {
  test('should inspect stock page DOM structure', async ({ page }) => {
    console.log('[DOM-INSPECTOR] Navigating to /stock...');

    // Navigate to stock page
    await page.goto('/stock');
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await page.waitForTimeout(3000); // Wait for data load

    // 1. Get full HTML
    const html = await page.content();
    const htmlPath = path.join('test-results', 'stock-dom-full.html');
    fs.writeFileSync(htmlPath, html, 'utf-8');
    console.log(`[DOM-INSPECTOR] Full HTML saved to: ${htmlPath}`);

    // 2. Take screenshot
    await page.screenshot({
      path: 'test-results/stock-dom-screenshot.png',
      fullPage: true
    });
    console.log('[DOM-INSPECTOR] Screenshot saved');

    // 3. Extract headings
    const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', (elements) =>
      elements.map(el => ({
        tag: el.tagName.toLowerCase(),
        text: el.textContent?.trim(),
        classes: el.className,
        id: el.id
      }))
    );
    console.log('[DOM-INSPECTOR] Headings found:', JSON.stringify(headings, null, 2));

    // 4. Extract tables
    const tables = await page.$$eval('table', (elements) =>
      elements.map((table, index) => {
        const headers = Array.from(table.querySelectorAll('thead th')).map(
          th => th.textContent?.trim()
        );
        const rowCount = table.querySelectorAll('tbody tr').length;
        return {
          index,
          headers,
          rowCount,
          classes: table.className,
          id: table.id
        };
      })
    );
    console.log('[DOM-INSPECTOR] Tables found:', JSON.stringify(tables, null, 2));

    // 5. Extract buttons
    const buttons = await page.$$eval('button', (elements) =>
      elements.slice(0, 20).map(btn => ({ // Limit to first 20
        text: btn.textContent?.trim(),
        type: btn.getAttribute('type'),
        classes: btn.className,
        id: btn.id,
        disabled: btn.disabled
      }))
    );
    console.log('[DOM-INSPECTOR] Buttons (first 20):', JSON.stringify(buttons, null, 2));

    // 6. Extract inputs
    const inputs = await page.$$eval('input', (elements) =>
      elements.map(input => ({
        type: input.type,
        name: input.name,
        placeholder: input.placeholder,
        classes: input.className,
        id: input.id
      }))
    );
    console.log('[DOM-INSPECTOR] Inputs found:', JSON.stringify(inputs, null, 2));

    // 7. Extract selects
    const selects = await page.$$eval('select', (elements) =>
      elements.map(select => ({
        name: select.name,
        id: select.id,
        classes: select.className,
        optionCount: select.options.length
      }))
    );
    console.log('[DOM-INSPECTOR] Selects found:', JSON.stringify(selects, null, 2));

    // 8. Check for MUI components
    const muiComponents = await page.$$eval('[class*="Mui"]', (elements) =>
      Array.from(new Set(elements.map(el => {
        const classes = el.className;
        const match = classes.match(/Mui(\w+)/);
        return match ? match[0] : null;
      }).filter(Boolean))).slice(0, 20)
    );
    console.log('[DOM-INSPECTOR] MUI Components:', muiComponents);

    // 9. Create comprehensive report
    const report = {
      url: page.url(),
      timestamp: new Date().toISOString(),
      headings,
      tables,
      buttons: buttons.slice(0, 10), // Limit for readability
      inputs,
      selects,
      muiComponents,
      bodyTextLength: (await page.textContent('body'))?.length,
      stats: {
        totalHeadings: headings.length,
        totalTables: tables.length,
        totalButtons: await page.locator('button').count(),
        totalInputs: inputs.length,
        totalSelects: selects.length
      }
    };

    const reportPath = path.join('test-results', 'stock-dom-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
    console.log(`[DOM-INSPECTOR] Full report saved to: ${reportPath}`);

    // 10. Print summary
    console.log('\n=== STOCK PAGE DOM SUMMARY ===');
    console.log(`URL: ${report.url}`);
    console.log(`Headings: ${report.stats.totalHeadings}`);
    console.log(`Tables: ${report.stats.totalTables}`);
    console.log(`Buttons: ${report.stats.totalButtons}`);
    console.log(`Inputs: ${report.stats.totalInputs}`);
    console.log(`Selects: ${report.stats.totalSelects}`);
    console.log(`MUI Components: ${muiComponents.length} types`);
    console.log('===============================\n');

    // Test always passes - this is inspection only
    expect(report.url).toContain('/stock');
  });
});
