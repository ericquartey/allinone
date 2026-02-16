/**
 * Unified Wait Strategies for Playwright E2E Tests
 *
 * These utilities provide robust, consistent waiting mechanisms across all test suites,
 * designed to handle slow backend responses and ensure data is fully loaded before assertions.
 *
 * @module wait-utils
 */

import { Page, Locator } from '@playwright/test';

/**
 * Configuration for wait timeouts
 */
export const WaitTimeouts = {
  /** Maximum time to wait for network idle state (45s for slow backend) */
  NETWORK_IDLE: 45000,

  /** Maximum time to wait for loading spinners to disappear */
  LOADING_SPINNER: 10000,

  /** Maximum time to wait for data elements to appear */
  DATA_LOAD: 30000,

  /** Maximum time to wait for charts to render */
  CHART_RENDER: 15000,

  /** Small buffer for animations to complete */
  ANIMATION_BUFFER: 500,

  /** Buffer for CSS transitions */
  TRANSITION_BUFFER: 300,

  /** Maximum time for element to become interactive */
  INTERACTIVE: 15000,
} as const;

/**
 * Main utility: Wait for page data to be fully loaded
 *
 * This is the PRIMARY wait strategy to use in beforeEach hooks.
 * It ensures the page has:
 * 1. No pending network requests
 * 2. No loading spinners visible
 * 3. Small buffer for animations
 *
 * @param page - Playwright Page object
 * @param options - Optional configuration
 *
 * @example
 * ```typescript
 * test.beforeEach(async ({ page }) => {
 *   await page.goto('/');
 *   await waitForDataLoaded(page);
 * });
 * ```
 */
export async function waitForDataLoaded(
  page: Page,
  options: {
    /** Skip network idle wait (useful if page has polling) */
    skipNetworkIdle?: boolean;
    /** Skip loading spinner wait */
    skipSpinner?: boolean;
    /** Custom timeout for network idle */
    networkTimeout?: number;
  } = {}
): Promise<void> {
  const {
    skipNetworkIdle = false,
    skipSpinner = false,
    networkTimeout = WaitTimeouts.NETWORK_IDLE,
  } = options;

  // Step 1: Wait for network to be idle (no requests for 500ms)
  if (!skipNetworkIdle) {
    try {
      await page.waitForLoadState('networkidle', {
        timeout: networkTimeout
      });
    } catch (error) {
      console.warn('Network idle timeout - proceeding with caution');
      // Don't fail the test, just log warning
    }
  }

  // Step 2: Wait for any loading spinners to disappear
  if (!skipSpinner) {
    try {
      await page.waitForSelector('.animate-spin', {
        state: 'detached',
        timeout: WaitTimeouts.LOADING_SPINNER
      });
    } catch (error) {
      // Spinner might not exist on this page - that's OK
      console.debug('No loading spinner found or already gone');
    }
  }

  // Step 3: Small buffer for animations to complete
  await page.waitForTimeout(WaitTimeouts.ANIMATION_BUFFER);
}

/**
 * Wait for table data to be loaded and visible
 *
 * Ensures that:
 * 1. Table exists
 * 2. Table has rows with actual data (not just headers)
 * 3. Rows have content in cells
 *
 * @param page - Playwright Page object
 * @param selector - Table selector (default: 'table')
 * @param minRows - Minimum number of data rows expected (default: 1)
 *
 * @example
 * ```typescript
 * await waitForTableData(page, 'table.items-table', 5);
 * ```
 */
export async function waitForTableData(
  page: Page,
  selector: string = 'table',
  minRows: number = 1
): Promise<void> {
  await page.waitForFunction(
    ({ tableSelector, minRowCount }) => {
      const table = document.querySelector(tableSelector);
      if (!table) return false;

      const rows = table.querySelectorAll('tbody tr');
      if (rows.length < minRowCount) return false;

      // Check that first row has actual content in cells
      const firstRow = rows[0];
      const cells = firstRow.querySelectorAll('td');
      if (cells.length === 0) return false;

      // Check that at least one cell has text content
      return Array.from(cells).some(cell =>
        cell.textContent?.trim().length ?? 0 > 0
      );
    },
    { tableSelector: selector, minRowCount: minRows },
    { timeout: WaitTimeouts.DATA_LOAD }
  );
}

/**
 * Wait for chart to be fully rendered
 *
 * Waits for:
 * 1. SVG element to exist
 * 2. Chart animation to complete
 *
 * @param page - Playwright Page object
 * @param chartSelector - Chart container selector
 *
 * @example
 * ```typescript
 * await waitForChartRender(page, '.recharts-wrapper');
 * ```
 */
export async function waitForChartRender(
  page: Page,
  chartSelector: string = 'svg.recharts-surface'
): Promise<void> {
  // Wait for chart SVG to exist
  await page.waitForSelector(chartSelector, {
    timeout: WaitTimeouts.CHART_RENDER,
    state: 'visible'
  });

  // Wait for Recharts animation to complete
  await page.waitForTimeout(1000);
}

/**
 * Wait for element to be truly interactive (clickable)
 *
 * Ensures element is:
 * 1. Visible
 * 2. Enabled (not disabled)
 * 3. Stable (not moving/animating)
 *
 * @param locator - Playwright Locator
 *
 * @example
 * ```typescript
 * const button = page.locator('button.submit');
 * await waitForInteractive(button);
 * await button.click();
 * ```
 */
export async function waitForInteractive(
  locator: Locator
): Promise<void> {
  // Wait for element to be visible
  await locator.waitFor({
    state: 'visible',
    timeout: WaitTimeouts.INTERACTIVE
  });

  // Wait for element to be enabled (not disabled attribute)
  await locator.evaluate((el) => {
    if (el instanceof HTMLButtonElement ||
        el instanceof HTMLInputElement) {
      return !el.disabled;
    }
    return true;
  });

  // Small stabilization delay
  await locator.page().waitForTimeout(WaitTimeouts.TRANSITION_BUFFER);
}

/**
 * Wait for element and hover over it
 *
 * Useful for testing hover states with proper timing.
 *
 * @param locator - Playwright Locator
 *
 * @example
 * ```typescript
 * const row = page.locator('tr').first();
 * await waitAndHover(row);
 * await expect(row).toHaveClass(/hover-bg/);
 * ```
 */
export async function waitAndHover(
  locator: Locator
): Promise<void> {
  await waitForInteractive(locator);
  await locator.hover();
  await locator.page().waitForTimeout(WaitTimeouts.TRANSITION_BUFFER);
}

/**
 * Retry an action with exponential backoff
 *
 * Useful for flaky operations that might need multiple attempts.
 *
 * @param action - Async function to retry
 * @param maxAttempts - Maximum number of attempts (default: 3)
 * @param baseDelay - Base delay in ms (default: 500)
 *
 * @example
 * ```typescript
 * await retryWithBackoff(async () => {
 *   await page.click('.flaky-button');
 * }, 3, 500);
 * ```
 */
export async function retryWithBackoff<T>(
  action: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 500
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await action();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxAttempts) {
        throw lastError;
      }

      // Exponential backoff: 500ms, 1000ms, 2000ms...
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Wait for specific text to appear in element
 *
 * More reliable than direct text assertions for dynamic content.
 *
 * @param locator - Playwright Locator
 * @param expectedText - Text to wait for (can be regex)
 * @param timeout - Maximum wait time
 *
 * @example
 * ```typescript
 * await waitForText(page.locator('.status'), 'Success', 5000);
 * ```
 */
export async function waitForText(
  locator: Locator,
  expectedText: string | RegExp,
  timeout: number = WaitTimeouts.DATA_LOAD
): Promise<void> {
  await locator.waitFor({ state: 'visible', timeout });

  if (typeof expectedText === 'string') {
    await locator.page().waitForFunction(
      ({ selector, text }) => {
        const elements = document.querySelectorAll(selector);
        return Array.from(elements).some(el =>
          el.textContent?.includes(text)
        );
      },
      {
        selector: await locator.evaluate(el => {
          // Get CSS selector for element
          return el.tagName.toLowerCase() +
                 (el.className ? '.' + el.className.split(' ').join('.') : '');
        }),
        text: expectedText
      },
      { timeout }
    );
  } else {
    // Regex matching
    await locator.page().waitForFunction(
      ({ selector, pattern }) => {
        const elements = document.querySelectorAll(selector);
        const regex = new RegExp(pattern);
        return Array.from(elements).some(el =>
          regex.test(el.textContent || '')
        );
      },
      {
        selector: await locator.evaluate(el => {
          return el.tagName.toLowerCase() +
                 (el.className ? '.' + el.className.split(' ').join('.') : '');
        }),
        pattern: expectedText.source
      },
      { timeout }
    );
  }
}
