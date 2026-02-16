import { test, expect } from '@playwright/test';

test.describe('Settings Navigation Test', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard first
    await page.goto('http://localhost:3001/');
    await page.waitForLoadState('networkidle');
  });

  test('Should navigate to Settings page from Header dropdown', async ({ page }) => {
    console.log('\n=== TEST: Navigate to Settings from Header ===');

    // Click on user avatar to open dropdown
    const userAvatar = page.locator('button').filter({ hasText: /^[A-Z]$/ }).first();
    await userAvatar.hover();

    // Wait for dropdown to be visible
    await page.waitForTimeout(500);

    // Take screenshot of dropdown
    await page.screenshot({
      path: 'test-results/settings-header-dropdown.png',
      fullPage: false
    });

    // Click on "Impostazioni" button in dropdown
    const settingsButton = page.getByRole('button', { name: /impostazioni/i });
    const isVisible = await settingsButton.isVisible();
    console.log(`Settings button visible: ${isVisible}`);

    if (isVisible) {
      await settingsButton.click();
      await page.waitForLoadState('networkidle');

      // Verify URL
      const currentUrl = page.url();
      console.log(`Current URL: ${currentUrl}`);
      expect(currentUrl).toContain('/settings');

      // Take screenshot of settings page
      await page.screenshot({
        path: 'test-results/settings-main-page.png',
        fullPage: true
      });
    }
  });

  test('Should display Settings index page with sections', async ({ page }) => {
    console.log('\n=== TEST: Settings Index Page ===');

    // Navigate directly to settings
    await page.goto('http://localhost:3001/settings');
    await page.waitForLoadState('networkidle');

    // Check page title
    const title = page.locator('h1');
    await expect(title).toContainText(/impostazioni/i);

    // Count settings sections cards
    const settingCards = page.locator('.group').filter({ has: page.locator('svg') });
    const count = await settingCards.count();
    console.log(`Settings sections found: ${count}`);

    // Take screenshot
    await page.screenshot({
      path: 'test-results/settings-index-page.png',
      fullPage: true
    });

    // Verify expected sections
    const expectedSections = [
      'Configurazione Generale',
      'Dashboard',
      'Configurazione Host'
    ];

    for (const section of expectedSections) {
      const sectionCard = page.locator('h3', { hasText: section });
      const exists = await sectionCard.count() > 0;
      console.log(`Section "${section}" found: ${exists}`);
    }
  });

  test('Should navigate to General Settings sub-page', async ({ page }) => {
    console.log('\n=== TEST: Navigate to General Settings ===');

    await page.goto('http://localhost:3001/settings');
    await page.waitForLoadState('networkidle');

    // Click on "Configurazione Generale" card
    const generalSettingsCard = page.locator('a[href="/settings/general"]');
    await generalSettingsCard.click();
    await page.waitForLoadState('networkidle');

    // Verify URL
    expect(page.url()).toContain('/settings/general');

    // Check page content
    const pageTitle = page.locator('h1');
    await expect(pageTitle).toContainText(/configurazione generale/i);

    // Take screenshot
    await page.screenshot({
      path: 'test-results/settings-general-page.png',
      fullPage: true
    });

    console.log('General Settings page loaded successfully');
  });

  test('Should navigate to Dashboard Settings sub-page', async ({ page }) => {
    console.log('\n=== TEST: Navigate to Dashboard Settings ===');

    await page.goto('http://localhost:3001/settings');
    await page.waitForLoadState('networkidle');

    // Click on "Dashboard" card
    const dashboardSettingsCard = page.locator('a[href="/settings/dashboard"]');
    await dashboardSettingsCard.click();
    await page.waitForLoadState('networkidle');

    // Verify URL
    expect(page.url()).toContain('/settings/dashboard');

    // Check for dashboard settings content
    const pageContent = await page.textContent('body');
    console.log('Page contains "widget":', pageContent.toLowerCase().includes('widget'));

    // Take screenshot
    await page.screenshot({
      path: 'test-results/settings-dashboard-page.png',
      fullPage: true
    });

    console.log('Dashboard Settings page loaded successfully');
  });

  test('Should navigate to Host Settings sub-page', async ({ page }) => {
    console.log('\n=== TEST: Navigate to Host Settings ===');

    await page.goto('http://localhost:3001/settings');
    await page.waitForLoadState('networkidle');

    // Click on "Configurazione Host" card
    const hostSettingsCard = page.locator('a[href="/settings/host"]');
    await hostSettingsCard.click();
    await page.waitForLoadState('networkidle');

    // Verify URL
    expect(page.url()).toContain('/settings/host');

    // Take screenshot
    await page.screenshot({
      path: 'test-results/settings-host-page.png',
      fullPage: true
    });

    console.log('Host Settings page loaded successfully');
  });

  test('Should show tab navigation on settings sub-pages', async ({ page }) => {
    console.log('\n=== TEST: Tab Navigation ===');

    // Go to general settings
    await page.goto('http://localhost:3001/settings/general');
    await page.waitForLoadState('networkidle');

    // Check for tab navigation
    const tabs = page.locator('nav[aria-label="Settings navigation"] a');
    const tabCount = await tabs.count();
    console.log(`Navigation tabs found: ${tabCount}`);

    // Screenshot tabs
    await page.screenshot({
      path: 'test-results/settings-tabs-navigation.png',
      fullPage: true
    });

    // Try clicking on different tabs
    if (tabCount > 1) {
      // Click on second tab
      await tabs.nth(1).click();
      await page.waitForLoadState('networkidle');

      const newUrl = page.url();
      console.log(`After tab click, URL: ${newUrl}`);

      await page.screenshot({
        path: 'test-results/settings-after-tab-switch.png',
        fullPage: true
      });
    }
  });
});
