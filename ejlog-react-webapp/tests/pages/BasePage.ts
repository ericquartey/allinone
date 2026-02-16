import { Page, Locator, expect } from '@playwright/test';

/**
 * BasePage - Base class for all Page Object Models
 *
 * Provides common functionality for all pages:
 * - Navigation
 * - Waiting utilities
 * - Common element interactions
 * - Screenshot helpers
 */
export class BasePage {
  readonly page: Page;
  readonly url: string;

  constructor(page: Page, url: string = '/') {
    this.page = page;
    this.url = url;
  }

  /**
   * Navigate to the page
   */
  async goto(options?: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' }): Promise<void> {
    await this.page.goto(this.url, {
      waitUntil: options?.waitUntil || 'domcontentloaded',
      timeout: 30000,
    });
  }

  /**
   * Wait for page to be fully loaded
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle', { timeout: 30000 });
  }

  /**
   * Wait for a specific element to be visible
   */
  async waitForElement(selector: string, timeout: number = 10000): Promise<Locator> {
    const element = this.page.locator(selector);
    await element.waitFor({ state: 'visible', timeout });
    return element;
  }

  /**
   * Wait for API response
   */
  async waitForApiResponse(urlPattern: string | RegExp, timeout: number = 15000): Promise<void> {
    await this.page.waitForResponse(
      (response) => {
        const url = response.url();
        const matches = typeof urlPattern === 'string'
          ? url.includes(urlPattern)
          : urlPattern.test(url);
        return matches && response.status() === 200;
      },
      { timeout }
    );
  }

  /**
   * Click element with retry and wait
   */
  async clickElement(selector: string, options?: { timeout?: number; force?: boolean }): Promise<void> {
    const element = this.page.locator(selector);
    await element.waitFor({ state: 'visible', timeout: options?.timeout || 10000 });
    await element.click({ force: options?.force, timeout: options?.timeout || 10000 });
  }

  /**
   * Fill input field
   */
  async fillInput(selector: string, value: string, options?: { clear?: boolean }): Promise<void> {
    const input = this.page.locator(selector);
    await input.waitFor({ state: 'visible', timeout: 10000 });

    if (options?.clear) {
      await input.clear();
    }

    await input.fill(value);
  }

  /**
   * Select dropdown option
   */
  async selectOption(selector: string, value: string | { label: string } | { value: string }): Promise<void> {
    const select = this.page.locator(selector);
    await select.waitFor({ state: 'visible', timeout: 10000 });
    await select.selectOption(value);
  }

  /**
   * Get element text
   */
  async getElementText(selector: string): Promise<string> {
    const element = this.page.locator(selector);
    await element.waitFor({ state: 'visible', timeout: 10000 });
    return await element.textContent() || '';
  }

  /**
   * Check if element is visible
   */
  async isElementVisible(selector: string, timeout: number = 5000): Promise<boolean> {
    try {
      await this.page.locator(selector).waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Take screenshot with custom name
   */
  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({
      path: `test-results/screenshots/${name}.png`,
      fullPage: true,
    });
  }

  /**
   * Wait for toast notification
   */
  async waitForToast(message?: string, timeout: number = 5000): Promise<void> {
    const toastSelector = '[role="status"], [role="alert"], .toast, .notification';
    const toast = this.page.locator(toastSelector);

    await toast.waitFor({ state: 'visible', timeout });

    if (message) {
      await expect(toast).toContainText(message, { timeout });
    }
  }

  /**
   * Wait for loading spinner to disappear
   */
  async waitForLoadingToFinish(timeout: number = 15000): Promise<void> {
    const loadingSelectors = [
      '.loading',
      '.spinner',
      '[data-testid="loading"]',
      '[aria-busy="true"]',
      '.animate-spin',
    ];

    for (const selector of loadingSelectors) {
      try {
        await this.page.locator(selector).waitFor({ state: 'hidden', timeout: 1000 });
      } catch {
        // Ignore if selector doesn't exist
      }
    }
  }

  /**
   * Scroll to element
   */
  async scrollToElement(selector: string): Promise<void> {
    const element = this.page.locator(selector);
    await element.scrollIntoViewIfNeeded();
  }

  /**
   * Get current URL
   */
  getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * Verify page URL
   */
  async verifyUrl(expectedUrl: string): Promise<void> {
    await expect(this.page).toHaveURL(expectedUrl, { timeout: 5000 });
  }

  /**
   * Verify page title
   */
  async verifyTitle(expectedTitle: string | RegExp): Promise<void> {
    await expect(this.page).toHaveTitle(expectedTitle, { timeout: 5000 });
  }

  /**
   * Wait for navigation to complete
   */
  async waitForNavigation(options?: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' }): Promise<void> {
    await this.page.waitForLoadState(options?.waitUntil || 'domcontentloaded', { timeout: 30000 });
  }

  /**
   * Reload page
   */
  async reload(): Promise<void> {
    await this.page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
  }

  /**
   * Go back in browser history
   */
  async goBack(): Promise<void> {
    await this.page.goBack({ waitUntil: 'domcontentloaded', timeout: 30000 });
  }

  /**
   * Press keyboard key
   */
  async pressKey(key: string): Promise<void> {
    await this.page.keyboard.press(key);
  }

  /**
   * Wait for network to be idle
   */
  async waitForNetworkIdle(timeout: number = 10000): Promise<void> {
    await this.page.waitForLoadState('networkidle', { timeout });
  }
}
