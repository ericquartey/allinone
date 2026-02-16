// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Lists Management Page - Con Autenticazione', () => {
  test('should login and view lists-management page', async ({ page }) => {
    console.log('1. Navigating to login page...');

    // First go to login
    await page.goto('http://localhost:3011/login', { waitUntil: 'networkidle', timeout: 30000 });

    console.log('2. Waiting for login form...');

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Try to find username field (assuming standard login form)
    const usernameField = page.locator('input[name="username"], input[type="text"], input[placeholder*="user" i], input[placeholder*="nome" i]').first();
    const passwordField = page.locator('input[name="password"], input[type="password"]').first();

    // Check if fields exist
    const usernameCount = await usernameField.count();
    const passwordCount = await passwordField.count();

    console.log(`Found username fields: ${usernameCount}, password fields: ${passwordCount}`);

    if (usernameCount > 0 && passwordCount > 0) {
      console.log('3. Filling login form...');

      // Fill in login form (use default credentials)
      await usernameField.fill('admin');
      await passwordField.fill('admin');

      // Find and click login button
      const loginButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Accedi")').first();
      await loginButton.click();

      console.log('4. Waiting for login to complete...');

      // Wait for navigation after login
      await page.waitForTimeout(3000);
    } else {
      console.log('3. Skipping login (no form found, might have session)...');
    }

    console.log('5. Navigating to lists-management page...');

    // Now navigate to lists-management
    await page.goto('http://localhost:3011/lists-management', { waitUntil: 'networkidle', timeout: 30000 });

    console.log('6. Waiting for page content...');

    // Wait for React to render
    await page.waitForTimeout(3000);

    // Check for title
    const title = await page.locator('text=Gestione Liste Magazzino').count();
    console.log(`Found page title instances: ${title}`);

    // Check for any content
    const h4Elements = await page.locator('h4').count();
    console.log(`Found h4 elements: ${h4Elements}`);

    if (h4Elements > 0) {
      const h4Texts = await page.locator('h4').allTextContents();
      console.log('H4 texts:', h4Texts);
    }

    // Take screenshot
    console.log('7. Taking screenshot...');
    await page.screenshot({
      path: 'tests/screenshots/lists-management-authenticated.png',
      fullPage: true
    });

    console.log('Screenshot saved successfully!');

    // Check that we're not on login page
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    expect(currentUrl).toContain('lists-management');
  });
});
