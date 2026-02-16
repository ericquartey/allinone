import { test, expect } from '@playwright/test';

test.describe('Test Login Superuser', () => {
  test('Login con superuser e verifica redirect', async ({ page }) => {
    console.log('🚀 Starting test: Login con superuser');

    // Vai alla pagina di login
    await page.goto('http://localhost:3000');
    console.log('📍 Navigated to:', page.url());

    // Aspetta che la pagina sia caricata
    await page.waitForLoadState('networkidle');
    console.log('✅ Page loaded');

    // Cerca il form di login
    const usernameInput = page.locator('input[name="username"], input[type="text"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    const loginButton = page.locator('button[type="submit"]').first();

    console.log('🔍 Checking if login form is visible...');
    await expect(usernameInput).toBeVisible({ timeout: 10000 });
    await expect(passwordInput).toBeVisible({ timeout: 10000 });
    await expect(loginButton).toBeVisible({ timeout: 10000 });
    console.log('✅ Login form is visible');

    // Compila form con credenziali superuser
    await usernameInput.fill('superuser');
    await passwordInput.fill('promag31');
    console.log('✅ Filled credentials: superuser / promag31');

    // Screenshot prima del login
    await page.screenshot({ path: 'tests/screenshots/before-login.png' });
    console.log('📸 Screenshot saved: before-login.png');

    // Click login
    console.log('🔐 Clicking login button...');
    await loginButton.click();

    // Aspetta redirect o cambio pagina
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    console.log('📍 URL dopo login:', currentUrl);

    // Screenshot dopo il login
    await page.screenshot({ path: 'tests/screenshots/after-login.png' });
    console.log('📸 Screenshot saved: after-login.png');

    // Verifica che non siamo più sulla pagina di login
    const isStillOnLogin = currentUrl.includes('login');

    if (isStillOnLogin) {
      console.log('❌ FAIL: Ancora sulla pagina di login!');
      console.log('📍 Current URL:', currentUrl);

      // Cerca messaggi di errore
      const errorMessages = await page.locator('[class*="error"], [class*="alert"]').allTextContents();
      if (errorMessages.length > 0) {
        console.log('⚠️  Error messages found:', errorMessages);
      }
    } else {
      console.log('✅ SUCCESS: Login effettuato, redirect completato!');
      console.log('📍 New URL:', currentUrl);
    }

    expect(isStillOnLogin).toBe(false);
  });
});
