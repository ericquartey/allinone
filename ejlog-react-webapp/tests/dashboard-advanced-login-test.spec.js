import { test, expect } from '@playwright/test';

test.describe('Dashboard Advanced - Login Issue Diagnostic', () => {
  test('Should access dashboard-advanced WITHOUT login', async ({ page }) => {
    console.log('\n=== TEST: Dashboard Advanced Public Access ===');

    // Navigate directly to dashboard-advanced
    await page.goto('http://localhost:3001/dashboard-advanced');
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({
      path: 'test-results/dashboard-advanced-initial.png',
      fullPage: true
    });

    // Check current URL
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    // Check if redirected to login
    if (currentUrl.includes('/login')) {
      console.log('ERROR: Redirected to login page!');

      // Screenshot login page
      await page.screenshot({
        path: 'test-results/dashboard-advanced-redirected-to-login.png',
        fullPage: true
      });

      // Check page content
      const pageContent = await page.textContent('body');
      console.log('Login page content includes "superuser":', pageContent.includes('superuser'));
      console.log('Login page content includes "Accedi":', pageContent.includes('Accedi'));
    } else {
      console.log('SUCCESS: No redirect, on dashboard-advanced page');

      // Check for dashboard content
      const hasHeader = await page.locator('h1:has-text("EjLog WMS")').count() > 0;
      const hasDashboardTitle = await page.locator('h1:has-text("Dashboard Avanzata")').count() > 0;

      console.log(`Has EjLog header: ${hasHeader}`);
      console.log(`Has Dashboard title: ${hasDashboardTitle}`);

      // Screenshot success
      await page.screenshot({
        path: 'test-results/dashboard-advanced-success.png',
        fullPage: true
      });
    }

    // Verify URL should NOT contain /login
    expect(currentUrl).not.toContain('/login');
  });

  test('Should check App.tsx routing configuration', async ({ page }) => {
    console.log('\n=== TEST: Verify Public Route ===');

    // Check if route is truly public by accessing without cookies
    await page.context().clearCookies();
    await page.goto('http://localhost:3001/dashboard-advanced');
    await page.waitForTimeout(2000);

    const url = page.url();
    console.log(`URL after clear cookies: ${url}`);

    await page.screenshot({
      path: 'test-results/dashboard-advanced-no-cookies.png',
      fullPage: true
    });

    expect(url).toContain('/dashboard-advanced');
  });

  test('Should login and then access dashboard-advanced', async ({ page }) => {
    console.log('\n=== TEST: Login then Dashboard Advanced ===');

    // First go to login
    await page.goto('http://localhost:3001/login');
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: 'test-results/login-page-before-login.png',
      fullPage: true
    });

    // Try to login as superuser
    const usernameField = page.locator('input[type="text"], input[name="username"]').first();
    const passwordField = page.locator('input[type="password"], input[name="password"]').first();

    if (await usernameField.count() > 0) {
      await usernameField.fill('superuser');
      await passwordField.fill('superuser');

      // Click login button
      const loginButton = page.getByRole('button', { name: /accedi|login|entra/i });
      await loginButton.click();
      await page.waitForTimeout(2000);

      console.log(`After login URL: ${page.url()}`);
    }

    // Now navigate to dashboard-advanced
    await page.goto('http://localhost:3001/dashboard-advanced');
    await page.waitForTimeout(2000);

    const finalUrl = page.url();
    console.log(`Dashboard Advanced URL after login: ${finalUrl}`);

    await page.screenshot({
      path: 'test-results/dashboard-advanced-after-login.png',
      fullPage: true
    });

    expect(finalUrl).toContain('/dashboard-advanced');
  });

  test('Should check ProtectedRoute component behavior', async ({ page }) => {
    console.log('\n=== TEST: Check Dev Mode Authentication Bypass ===');

    // Check console for dev mode messages
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push(msg.text());
    });

    await page.goto('http://localhost:3001/dashboard-advanced');
    await page.waitForTimeout(2000);

    console.log('\nConsole messages:');
    consoleMessages.forEach(msg => {
      if (msg.includes('DEV MODE') || msg.includes('Authentication')) {
        console.log(`  - ${msg}`);
      }
    });

    const url = page.url();
    console.log(`\nFinal URL: ${url}`);

    await page.screenshot({
      path: 'test-results/dashboard-advanced-console-check.png',
      fullPage: true
    });
  });
});
