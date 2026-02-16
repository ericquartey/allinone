import { test, expect } from '@playwright/test';

test('Dashboard Advanced - Quick Access Test', async ({ page }) => {
  console.log('\n=== QUICK TEST: Dashboard Advanced ===');

  // Navigate to dashboard-advanced
  await page.goto('http://localhost:3001/dashboard-advanced');
  await page.waitForTimeout(3000);

  // Take screenshot
  await page.screenshot({
    path: 'test-results/dashboard-advanced-quick.png',
    fullPage: true
  });

  // Check URL
  const url = page.url();
  console.log(`Current URL: ${url}`);

  // Check for page content
  const bodyText = await page.textContent('body');
  const hasEjLog = bodyText.includes('EjLog');
  const hasDashboard = bodyText.includes('Dashboard');

  console.log(`Page contains "EjLog": ${hasEjLog}`);
  console.log(`Page contains "Dashboard": ${hasDashboard}`);

  // Check if we're on login page
  const isLoginPage = url.includes('/login');
  console.log(`Is login page: ${isLoginPage}`);

  if (isLoginPage) {
    console.log('ERROR: Still redirected to login!');
  } else {
    console.log('SUCCESS: Dashboard advanced is accessible!');
  }

  // Verify we're on dashboard-advanced
  expect(url).toContain('/dashboard-advanced');
});
