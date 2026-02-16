import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * LoginPage - Page Object Model for Login Page
 *
 * Handles both standard login and badge login flows
 */
export class LoginPage extends BasePage {
  // Locators
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly badgeLoginButton: Locator;
  readonly errorMessage: Locator;
  readonly logo: Locator;

  constructor(page: Page) {
    super(page, '/login');

    // Initialize locators
    this.usernameInput = page.locator('input[name="username"], input[type="text"]').first();
    this.passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    this.loginButton = page.locator('button[type="submit"]');
    this.badgeLoginButton = page.locator('a[href*="badge"], button:has-text("Badge")').first();
    this.errorMessage = page.locator('.error, [role="alert"], .text-red-500');
    this.logo = page.locator('img[alt*="logo"], svg, .logo').first();
  }

  /**
   * Navigate to login page
   */
  async goto(): Promise<void> {
    await super.goto({ waitUntil: 'domcontentloaded' });
    await this.waitForPageLoad();
  }

  /**
   * Verify login page is loaded
   */
  async verifyPageLoaded(): Promise<void> {
    await expect(this.usernameInput).toBeVisible({ timeout: 10000 });
    await expect(this.passwordInput).toBeVisible({ timeout: 10000 });
    await expect(this.loginButton).toBeVisible({ timeout: 10000 });
  }

  /**
   * Perform login with username and password
   */
  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.usernameInput.fill(username);

    await this.passwordInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.passwordInput.fill(password);

    await this.loginButton.waitFor({ state: 'visible', timeout: 10000 });
    await this.loginButton.click();

    // Wait for navigation or error
    await Promise.race([
      this.page.waitForURL('**/dashboard', { timeout: 15000 }),
      this.errorMessage.waitFor({ state: 'visible', timeout: 15000 }),
    ]);
  }

  /**
   * Quick login (for tests that need authenticated state)
   */
  async quickLogin(username: string = 'eric', password: string = 'eric'): Promise<void> {
    await this.goto();
    await this.login(username, password);
    await this.verifyLoginSuccessful();
  }

  /**
   * Navigate to badge login
   */
  async goToBadgeLogin(): Promise<void> {
    await this.badgeLoginButton.waitFor({ state: 'visible', timeout: 10000 });
    await this.badgeLoginButton.click();
    await this.page.waitForURL('**/login/badge', { timeout: 10000 });
  }

  /**
   * Verify login was successful
   */
  async verifyLoginSuccessful(): Promise<void> {
    // Should redirect to dashboard
    await expect(this.page).toHaveURL(/\/(dashboard|home)/, { timeout: 15000 });

    // Wait for dashboard elements to load
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15000 });
  }

  /**
   * Verify login failed with error message
   */
  async verifyLoginFailed(expectedMessage?: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible({ timeout: 10000 });

    if (expectedMessage) {
      await expect(this.errorMessage).toContainText(expectedMessage);
    }
  }

  /**
   * Clear login form
   */
  async clearForm(): Promise<void> {
    await this.usernameInput.clear();
    await this.passwordInput.clear();
  }

  /**
   * Check if login button is enabled
   */
  async isLoginButtonEnabled(): Promise<boolean> {
    return await this.loginButton.isEnabled();
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string> {
    await this.errorMessage.waitFor({ state: 'visible', timeout: 5000 });
    return await this.errorMessage.textContent() || '';
  }

  /**
   * Verify logo is visible
   */
  async verifyLogoVisible(): Promise<void> {
    await expect(this.logo).toBeVisible({ timeout: 10000 });
  }

  /**
   * Take screenshot of login page
   */
  async takeLoginScreenshot(name: string = 'login-page'): Promise<void> {
    await this.takeScreenshot(name);
  }
}
