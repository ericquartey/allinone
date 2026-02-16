import { Page, expect } from '@playwright/test';

/**
 * Test Helpers for EjLog WMS
 *
 * Common utility functions for tests
 */

/**
 * Wait for API call to complete
 */
export async function waitForApiCall(
  page: Page,
  urlPattern: string | RegExp,
  timeout: number = 15000
): Promise<void> {
  await page.waitForResponse(
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
 * Wait for multiple API calls
 */
export async function waitForMultipleApiCalls(
  page: Page,
  urlPatterns: (string | RegExp)[],
  timeout: number = 15000
): Promise<void> {
  await Promise.all(
    urlPatterns.map((pattern) => waitForApiCall(page, pattern, timeout))
  );
}

/**
 * Check if backend is healthy
 */
export async function checkBackendHealth(
  page: Page,
  backendUrl: string = 'http://localhost:3077'
): Promise<boolean> {
  try {
    const response = await page.request.get(`${backendUrl}/health`, {
      timeout: 5000,
    });
    return response.ok();
  } catch {
    return false;
  }
}

/**
 * Take screenshot with timestamp
 */
export async function takeTimestampedScreenshot(
  page: Page,
  name: string
): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({
    path: `test-results/screenshots/${name}-${timestamp}.png`,
    fullPage: true,
  });
}

/**
 * Wait for element and scroll into view
 */
export async function waitAndScrollToElement(
  page: Page,
  selector: string,
  timeout: number = 10000
): Promise<void> {
  const element = page.locator(selector);
  await element.waitFor({ state: 'visible', timeout });
  await element.scrollIntoViewIfNeeded();
}

/**
 * Fill form fields
 */
export async function fillFormFields(
  page: Page,
  fields: Record<string, string>
): Promise<void> {
  for (const [selector, value] of Object.entries(fields)) {
    const input = page.locator(selector);
    await input.waitFor({ state: 'visible', timeout: 10000 });
    await input.fill(value);
  }
}

/**
 * Wait for loading to finish (multiple spinner selectors)
 */
export async function waitForLoadingToFinish(
  page: Page,
  timeout: number = 15000
): Promise<void> {
  const loadingSelectors = [
    '.loading',
    '.spinner',
    '[data-testid="loading"]',
    '[aria-busy="true"]',
    '.animate-spin',
  ];

  for (const selector of loadingSelectors) {
    try {
      await page.locator(selector).waitFor({ state: 'hidden', timeout: 2000 });
    } catch {
      // Ignore if selector doesn't exist
    }
  }
}

/**
 * Wait for toast notification
 */
export async function waitForToast(
  page: Page,
  message?: string,
  timeout: number = 5000
): Promise<void> {
  const toastSelector = '[role="status"], [role="alert"], .toast, .notification';
  const toast = page.locator(toastSelector);

  await toast.waitFor({ state: 'visible', timeout });

  if (message) {
    await expect(toast).toContainText(message, { timeout });
  }
}

/**
 * Clear local storage and session storage (with error handling for security restrictions)
 */
export async function clearStorage(page: Page): Promise<void> {
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.log('Storage clear skipped due to security restrictions');
    }
  });
}

/**
 * Set local storage item
 */
export async function setLocalStorageItem(
  page: Page,
  key: string,
  value: string
): Promise<void> {
  await page.evaluate(
    ({ key, value }) => {
      localStorage.setItem(key, value);
    },
    { key, value }
  );
}

/**
 * Get local storage item
 */
export async function getLocalStorageItem(
  page: Page,
  key: string
): Promise<string | null> {
  return await page.evaluate((key) => {
    return localStorage.getItem(key);
  }, key);
}

/**
 * Mock API response
 */
export async function mockApiResponse(
  page: Page,
  urlPattern: string | RegExp,
  responseData: any,
  statusCode: number = 200
): Promise<void> {
  await page.route(urlPattern, (route) => {
    route.fulfill({
      status: statusCode,
      contentType: 'application/json',
      body: JSON.stringify(responseData),
    });
  });
}

/**
 * Intercept and log API calls
 */
export async function interceptApiCalls(
  page: Page,
  urlPattern: string | RegExp
): Promise<void> {
  page.on('request', (request) => {
    const url = request.url();
    const matches = typeof urlPattern === 'string'
      ? url.includes(urlPattern)
      : urlPattern.test(url);

    if (matches) {
      console.log(`[API Request] ${request.method()} ${url}`);
    }
  });

  page.on('response', (response) => {
    const url = response.url();
    const matches = typeof urlPattern === 'string'
      ? url.includes(urlPattern)
      : urlPattern.test(url);

    if (matches) {
      console.log(`[API Response] ${response.status()} ${url}`);
    }
  });
}

/**
 * Wait for network to be idle
 */
export async function waitForNetworkIdle(
  page: Page,
  timeout: number = 10000
): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Retry action with exponential backoff
 */
export async function retryWithBackoff<T>(
  action: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await action();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Action failed after retries');
}

/**
 * Generate random test data
 */
export function generateTestData(prefix: string = 'test'): {
  name: string;
  email: string;
  timestamp: string;
} {
  const timestamp = Date.now();
  return {
    name: `${prefix}-${timestamp}`,
    email: `${prefix}-${timestamp}@test.com`,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Wait for element count to change
 */
export async function waitForElementCountChange(
  page: Page,
  selector: string,
  expectedCount: number,
  timeout: number = 10000
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const count = await page.locator(selector).count();
    if (count === expectedCount) {
      return;
    }
    await page.waitForTimeout(500);
  }

  throw new Error(
    `Element count did not reach ${expectedCount} within ${timeout}ms`
  );
}

/**
 * Check if element has class
 */
export async function elementHasClass(
  page: Page,
  selector: string,
  className: string
): Promise<boolean> {
  const element = page.locator(selector);
  const classes = await element.getAttribute('class');
  return classes?.includes(className) || false;
}

/**
 * Get table data as array
 */
export async function getTableData(
  page: Page,
  tableSelector: string = 'table'
): Promise<string[][]> {
  const table = page.locator(tableSelector);
  const rows = table.locator('tbody tr');
  const rowCount = await rows.count();

  const data: string[][] = [];

  for (let i = 0; i < rowCount; i++) {
    const cells = rows.nth(i).locator('td');
    const cellCount = await cells.count();
    const rowData: string[] = [];

    for (let j = 0; j < cellCount; j++) {
      const text = await cells.nth(j).textContent();
      rowData.push(text?.trim() || '');
    }

    data.push(rowData);
  }

  return data;
}

