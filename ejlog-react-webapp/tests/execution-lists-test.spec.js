import { test, expect } from '@playwright/test';

test('Execution Lists Page - Should render correctly', async ({ page }) => {
  const errors = [];

  page.on('pageerror', (error) => {
    if (!error.message.includes('fetch') &&
        !error.message.includes('NetworkError') &&
        !error.message.includes('Failed to fetch')) {
      errors.push(error.message);
    }
  });

  console.log('Testing /lists/execution...');
  await page.goto('http://localhost:3002/lists/execution', { 
    waitUntil: 'domcontentloaded', 
    timeout: 10000 
  });

  await page.waitForTimeout(2000);

  const hasH1 = await page.locator('h1').count() > 0;
  const h1Text = hasH1 ? await page.locator('h1').first().textContent() : '';

  console.log(`  Page Title: "${h1Text}"`);
  console.log(`  Errors: ${errors.length}`);
  
  if (errors.length > 0) {
    console.log('  Critical Errors:');
    errors.forEach(err => console.log(`    - ${err}`));
  }

  expect(errors).toHaveLength(0);
  expect(hasH1).toBe(true);
  
  console.log('✓ Execution Lists Page - OK\n');
});
