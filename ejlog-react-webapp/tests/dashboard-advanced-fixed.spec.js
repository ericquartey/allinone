import { test, expect } from '@playwright/test';

test.describe('Dashboard Advanced - Fixed Route Test', () => {
  test('should display Advanced Dashboard page correctly', async ({ page }) => {
    console.log('\n=== TEST: Dashboard Advanced Page Display ===');

    // Navigate to dashboard-advanced
    await page.goto('http://localhost:3001/dashboard-advanced');
    await page.waitForTimeout(3000);

    // Take initial screenshot
    await page.screenshot({
      path: 'test-results/dashboard-advanced-fixed-initial.png',
      fullPage: true
    });

    // Verify we're on the correct page (not redirected)
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    expect(currentUrl).toContain('/dashboard-advanced');
    expect(currentUrl).not.toContain('/login');

    // Check for the main header
    const mainHeader = page.locator('h1:has-text("EjLog WMS")');
    await expect(mainHeader).toBeVisible();
    console.log('✓ Main header "EjLog WMS" found');

    // Check for dashboard title
    const dashboardTitle = page.locator('h1:has-text("Dashboard Avanzata")');
    await expect(dashboardTitle).toBeVisible();
    console.log('✓ Dashboard title "Dashboard Avanzata" found');

    // Check for "Dashboard Avanzata" subtitle
    const subtitle = page.locator('p:has-text("Dashboard Avanzata")').first();
    await expect(subtitle).toBeVisible();
    console.log('✓ Subtitle found');

    // Check for the description text
    const description = page.locator('text=Monitoraggio real-time sistema EjLog WMS');
    await expect(description).toBeVisible();
    console.log('✓ Description text found');

    // Check for the "Aggiorna" button
    const refreshButton = page.locator('button:has-text("Aggiorna")');
    await expect(refreshButton).toBeVisible();
    console.log('✓ Refresh button found');

    // Check for the "Configurazione" button
    const configButton = page.locator('button:has-text("Configurazione")');
    await expect(configButton).toBeVisible();
    console.log('✓ Configuration button found');

    // Check for empty state (since widgets are disabled)
    const emptyStateTitle = page.locator('h3:has-text("Nessun widget attivo")');
    await expect(emptyStateTitle).toBeVisible();
    console.log('✓ Empty state message found');

    // Check for settings button in empty state
    const settingsButton = page.locator('button:has-text("Vai alle Impostazioni")');
    await expect(settingsButton).toBeVisible();
    console.log('✓ Settings button in empty state found');

    // Take final screenshot
    await page.screenshot({
      path: 'test-results/dashboard-advanced-fixed-final.png',
      fullPage: true
    });

    console.log('\n✅ All checks passed! Dashboard Advanced page is working correctly.');
  });

  test('should navigate to settings when clicking configuration button', async ({ page }) => {
    console.log('\n=== TEST: Navigation to Settings ===');

    await page.goto('http://localhost:3001/dashboard-advanced');
    await page.waitForTimeout(2000);

    // Click the "Vai alle Impostazioni" button in empty state
    const settingsButton = page.locator('button:has-text("Vai alle Impostazioni")');
    await settingsButton.click();
    await page.waitForTimeout(1000);

    // Verify navigation
    const currentUrl = page.url();
    console.log(`Current URL after click: ${currentUrl}`);
    expect(currentUrl).toContain('/settings/dashboard');

    await page.screenshot({
      path: 'test-results/dashboard-advanced-navigation.png',
      fullPage: true
    });

    console.log('✅ Navigation to settings works correctly.');
  });

  test('should refresh page when clicking Aggiorna button', async ({ page }) => {
    console.log('\n=== TEST: Refresh Button ===');

    await page.goto('http://localhost:3001/dashboard-advanced');
    await page.waitForTimeout(2000);

    // Listen for page reload
    let reloaded = false;
    page.on('load', () => {
      reloaded = true;
    });

    // Click refresh button
    const refreshButton = page.locator('button:has-text("Aggiorna")');
    await refreshButton.click();
    await page.waitForTimeout(1000);

    console.log(`Page reloaded: ${reloaded}`);
    expect(reloaded).toBe(true);

    console.log('✅ Refresh button works correctly.');
  });

  test('should have correct console logs for auto-login', async ({ page }) => {
    console.log('\n=== TEST: Auto-Login Console Logs ===');

    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push(msg.text());
    });

    await page.goto('http://localhost:3001/dashboard-advanced');
    await page.waitForTimeout(2000);

    // Check for auto-login log
    const hasAutoLoginLog = consoleMessages.some(msg =>
      msg.includes('[AdvancedDashboard] Auto-login as superuser')
    );

    console.log('\nConsole messages related to dashboard:');
    consoleMessages
      .filter(msg => msg.includes('Dashboard') || msg.includes('superuser'))
      .forEach(msg => console.log(`  - ${msg}`));

    expect(hasAutoLoginLog).toBe(true);
    console.log('\n✅ Auto-login console log found.');
  });
});
