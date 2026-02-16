// ============================================================================
// Quick Pages Check - Direct Navigation Test (No Login Required)
// Tests all 14 pages can be navigated to and render without critical errors
// ============================================================================

import { test, expect } from '@playwright/test';

const PAGES = [
  '/picking',
  '/refilling',
  '/config/printers',
  '/config/users',
  '/alarms',
];

test.describe('Quick Pages Check - New Routes', () => {
  for (const path of PAGES) {
    test(`Page ${path} - Should render`, async ({ page }) => {
      const errors = [];

      page.on('pageerror', (error) => {
        // Ignore common fetch errors from offline backend
        if (!error.message.includes('fetch') &&
            !error.message.includes('NetworkError') &&
            !error.message.includes('Failed to fetch')) {
          errors.push(error.message);
        }
      });

      console.log(`Testing ${path}...`);
      await page.goto(`http://localhost:3002${path}`, { waitUntil: 'domcontentloaded', timeout: 10000 });

      // Wait for any content to render
      await page.waitForTimeout(2000);

      // Check for critical render errors
      console.log(`  Errors: ${errors.length}`);
      if (errors.length > 0) {
        console.log(`  ${errors.join('\n  ')}`);
      }

      // Main assertion: page should not have critical JavaScript errors
      expect(errors, `${path} has critical errors`).toHaveLength(0);

      console.log(`✓ ${path} - OK\n`);
    });
  }
});
