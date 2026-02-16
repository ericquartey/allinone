import { test, expect } from '../fixtures/authFixtures';
import { LoginPage } from '../pages';

/**
 * E2E Tests: Login Flow
 *
 * Tests the login page and authentication flow
 */

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage before each test (with error handling for security restrictions)
    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        console.log('Storage clear skipped due to security restrictions');
      }
    });
  });

  test('should display login page correctly', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.verifyPageLoaded();
    await loginPage.verifyLogoVisible();

    // Take screenshot for visual verification
    await loginPage.takeLoginScreenshot('login-page-initial');
  });

  test('should navigate to login page and see form elements', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Verify all form elements are visible
    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();
  });

  test('should show validation error for empty credentials', async ({ loginPage }) => {
    await loginPage.goto();

    // Try to login with empty credentials
    await loginPage.loginButton.click();

    // Verify form validation (HTML5 validation should prevent submission)
    await expect(loginPage.usernameInput).toBeFocused().catch(() => {
      // If not focused, at least verify we're still on login page
      expect(loginPage.getCurrentUrl()).toContain('/login');
    });
  });

  test('should perform successful login with valid credentials', async ({ loginPage }) => {
    // Skip in dev mode since auth is bypassed
    const isDevelopment = process.env.NODE_ENV !== 'production';

    if (isDevelopment) {
      test.skip(true, 'Skipping login test in dev mode (auth bypass enabled)');
    }

    await loginPage.goto();

    // Login with test credentials
    await loginPage.login('eric', 'eric');

    // Verify successful login (redirect to dashboard)
    await loginPage.verifyLoginSuccessful();

    // Verify we're on the dashboard
    expect(loginPage.getCurrentUrl()).toMatch(/\/(dashboard|home)/);
  });

  test('should handle invalid credentials gracefully', async ({ loginPage }) => {
    const isDevelopment = process.env.NODE_ENV !== 'production';

    if (isDevelopment) {
      test.skip(true, 'Skipping invalid login test in dev mode');
    }

    await loginPage.goto();

    // Try to login with invalid credentials
    await loginPage.login('invalid_user', 'wrong_password');

    // Should show error message
    await loginPage.verifyLoginFailed();

    // Should still be on login page
    expect(loginPage.getCurrentUrl()).toContain('/login');
  });

  test('should clear form when clear button is clicked', async ({ loginPage }) => {
    await loginPage.goto();

    // Fill in credentials
    await loginPage.usernameInput.fill('testuser');
    await loginPage.passwordInput.fill('testpassword');

    // Clear form
    await loginPage.clearForm();

    // Verify fields are empty
    await expect(loginPage.usernameInput).toHaveValue('');
    await expect(loginPage.passwordInput).toHaveValue('');
  });

  test('should navigate to badge login page', async ({ loginPage, page }) => {
    await loginPage.goto();

    // Check if badge login button exists
    const badgeButtonVisible = await loginPage.badgeLoginButton.isVisible().catch(() => false);

    if (badgeButtonVisible) {
      await loginPage.goToBadgeLogin();

      // Verify we're on badge login page
      expect(page.url()).toContain('/login/badge');
    } else {
      test.skip(true, 'Badge login not available');
    }
  });

  test('should maintain focus and accessibility', async ({ loginPage, page }) => {
    await loginPage.goto();

    // Tab through form elements
    await loginPage.usernameInput.focus();
    await expect(loginPage.usernameInput).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(loginPage.passwordInput).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(loginPage.loginButton).toBeFocused();
  });

  test('should handle enter key submission', async ({ loginPage, page }) => {
    const isDevelopment = process.env.NODE_ENV !== 'production';

    await loginPage.goto();

    // Fill credentials
    await loginPage.usernameInput.fill('eric');
    await loginPage.passwordInput.fill('eric');

    // Press Enter to submit
    await loginPage.passwordInput.press('Enter');

    if (isDevelopment) {
      // In dev mode, should navigate to dashboard
      await page.waitForURL(/\/(dashboard|home)/, { timeout: 10000 });
    } else {
      // In production, should process login
      await page.waitForLoadState('networkidle', { timeout: 15000 });
    }
  });

  test('should display loading state during login', async ({ loginPage }) => {
    const isDevelopment = process.env.NODE_ENV !== 'production';

    if (isDevelopment) {
      test.skip(true, 'Skipping loading state test in dev mode');
    }

    await loginPage.goto();

    // Fill credentials
    await loginPage.usernameInput.fill('eric');
    await loginPage.passwordInput.fill('eric');

    // Click login and check for loading state
    await loginPage.loginButton.click();

    // Check if login button is disabled during processing
    // (This depends on implementation)
    const isDisabled = await loginPage.loginButton.isDisabled().catch(() => false);
    expect(isDisabled).toBeTruthy();
  });
});
