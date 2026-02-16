/**
 * Dashboard DOM Structure Inspector
 *
 * This test inspects the actual DOM structure of the Dashboard page
 * to identify correct selectors for writing robust E2E tests.
 *
 * Run with: npx playwright test tests/e2e/dashboard-dom-inspector.spec.ts --headed
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Dashboard DOM Inspector', () => {
  test('inspect dashboard page structure', async ({ page }) => {
    console.log('🔍 Inspecting Dashboard page DOM structure...\n');

    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Let React fully render

    // Take full page screenshot
    const screenshotPath = path.join(__dirname, '../../test-results/dashboard-dom-structure.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Screenshot saved: ${screenshotPath}\n`);

    // Extract page structure
    const structure = await page.evaluate(() => {
      const result: any = {
        headings: [],
        buttons: [],
        links: [],
        cards: [],
        stats: [],
        lists: [],
        inputs: [],
        muiComponents: [],
        dataTestIds: []
      };

      // Find all headings
      document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(el => {
        result.headings.push({
          tag: el.tagName.toLowerCase(),
          text: el.textContent?.trim().substring(0, 100),
          classes: el.className,
          hasNavLink: el.closest('a') !== null
        });
      });

      // Find all buttons
      document.querySelectorAll('button').forEach(el => {
        result.buttons.push({
          text: el.textContent?.trim(),
          classes: el.className,
          type: el.getAttribute('type'),
          ariaLabel: el.getAttribute('aria-label'),
          hasIcon: el.querySelector('svg') !== null
        });
      });

      // Find all navigation links
      document.querySelectorAll('a').forEach(el => {
        const href = el.getAttribute('href');
        if (href && (href.startsWith('/') || href.includes('localhost'))) {
          result.links.push({
            text: el.textContent?.trim().substring(0, 50),
            href: href,
            classes: el.className,
            hasIcon: el.querySelector('svg') !== null
          });
        }
      });

      // Find MUI Cards
      document.querySelectorAll('[class*="MuiCard"], [class*="Card"]').forEach(el => {
        result.cards.push({
          text: el.textContent?.trim().substring(0, 100),
          classes: el.className,
          hasButton: el.querySelector('button') !== null,
          hasLink: el.querySelector('a') !== null
        });
      });

      // Find statistics/metrics displays
      document.querySelectorAll('[class*="stat"], [class*="metric"], [class*="count"]').forEach(el => {
        result.stats.push({
          text: el.textContent?.trim(),
          classes: el.className,
          value: el.querySelector('[class*="value"], [class*="number"]')?.textContent?.trim()
        });
      });

      // Find lists (ul, ol)
      document.querySelectorAll('ul, ol').forEach(el => {
        const items = el.querySelectorAll('li');
        if (items.length > 0) {
          result.lists.push({
            type: el.tagName.toLowerCase(),
            itemCount: items.length,
            firstItemText: items[0]?.textContent?.trim().substring(0, 50),
            classes: el.className
          });
        }
      });

      // Find inputs
      document.querySelectorAll('input').forEach(el => {
        result.inputs.push({
          type: el.getAttribute('type'),
          placeholder: el.getAttribute('placeholder'),
          name: el.getAttribute('name'),
          classes: el.className
        });
      });

      // Find common MUI components
      const muiSelectors = [
        'MuiPaper',
        'MuiGrid',
        'MuiBox',
        'MuiTypography',
        'MuiDivider',
        'MuiList',
        'MuiListItem',
        'MuiAvatar',
        'MuiBadge',
        'MuiChip'
      ];

      muiSelectors.forEach(selector => {
        const count = document.querySelectorAll(`[class*="${selector}"]`).length;
        if (count > 0) {
          result.muiComponents.push({ component: selector, count });
        }
      });

      // Find data-testid attributes
      document.querySelectorAll('[data-testid]').forEach(el => {
        result.dataTestIds.push({
          testId: el.getAttribute('data-testid'),
          tag: el.tagName.toLowerCase(),
          text: el.textContent?.trim().substring(0, 50)
        });
      });

      return result;
    });

    // Print structure
    console.log('📋 DASHBOARD PAGE STRUCTURE:\n');

    console.log(`Headings (${structure.headings.length}):`);
    structure.headings.forEach((h: any, i: number) => {
      console.log(`  ${i + 1}. <${h.tag}> "${h.text}" ${h.hasNavLink ? '(inside link)' : ''}`);
    });

    console.log(`\nButtons (${structure.buttons.length}):`);
    structure.buttons.slice(0, 15).forEach((b: any, i: number) => {
      console.log(`  ${i + 1}. "${b.text}" ${b.hasIcon ? '(with icon)' : ''} - ${b.classes.split(' ')[0]}`);
    });

    console.log(`\nNavigation Links (${structure.links.length}):`);
    structure.links.slice(0, 15).forEach((l: any, i: number) => {
      console.log(`  ${i + 1}. "${l.text}" → ${l.href}`);
    });

    console.log(`\nCards (${structure.cards.length}):`);
    structure.cards.slice(0, 10).forEach((c: any, i: number) => {
      console.log(`  ${i + 1}. "${c.text.substring(0, 60)}..." - ${c.classes.split(' ')[0]}`);
    });

    console.log(`\nStatistics (${structure.stats.length}):`);
    structure.stats.forEach((s: any, i: number) => {
      console.log(`  ${i + 1}. "${s.text}" (value: ${s.value})`);
    });

    console.log(`\nLists (${structure.lists.length}):`);
    structure.lists.forEach((l: any, i: number) => {
      console.log(`  ${i + 1}. <${l.type}> with ${l.itemCount} items - first: "${l.firstItemText}"`);
    });

    console.log(`\nMUI Components:`);
    structure.muiComponents.forEach((c: any) => {
      console.log(`  - ${c.component}: ${c.count} instances`);
    });

    if (structure.dataTestIds.length > 0) {
      console.log(`\nData Test IDs (${structure.dataTestIds.length}):`);
      structure.dataTestIds.forEach((t: any) => {
        console.log(`  - data-testid="${t.testId}" on <${t.tag}> "${t.text}"`);
      });
    }

    // Save structure to JSON file
    const jsonPath = path.join(__dirname, '../../test-results/dashboard-dom-structure.json');
    fs.writeFileSync(jsonPath, JSON.stringify(structure, null, 2));
    console.log(`\n💾 Structure saved to: ${jsonPath}`);

    // Save full HTML
    const html = await page.content();
    const htmlPath = path.join(__dirname, '../../test-results/dashboard-full.html');
    fs.writeFileSync(htmlPath, html);
    console.log(`📄 Full HTML saved to: ${htmlPath}`);

    console.log('\n✅ Dashboard DOM inspection complete!');
  });
});
