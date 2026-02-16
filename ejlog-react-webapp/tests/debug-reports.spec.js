/**
 * DEBUG TEST - Reports Page
 */

import { test, expect } from '@playwright/test';

test('DEBUG - Check what is actually on the reports page', async ({ page }) => {
  // Set auth
  await page.goto('http://localhost:3001/');

  await page.evaluate(() => {
    const mockUser = { username: 'operatore1', role: 'Operatore' };
    const mockToken = 'mock-jwt-token';

    localStorage.setItem('ejlog_auth_token', mockToken);
    localStorage.setItem('ejlog_user', JSON.stringify(mockUser));
    localStorage.setItem('ejlog-auth-storage', JSON.stringify({
      state: { user: mockUser, token: mockToken, isAuthenticated: true }
    }));
  });

  // Navigate to reports
  await page.goto('http://localhost:3001/reports');
  await page.waitForTimeout(3000);

  // Get all h1 elements
  const h1Elements = await page.locator('h1').allTextContents();
  console.log('H1 elements:', h1Elements);

  // Get all text on page
  const pageText = await page.locator('body').textContent();
  console.log('Page text (first 500 chars):', pageText?.substring(0, 500));

  // Get current URL
  const url = page.url();
  console.log('Current URL:', url);

  // Check localStorage
  const storage = await page.evaluate(() => {
    return {
      authToken: localStorage.getItem('ejlog_auth_token'),
      authStorage: localStorage.getItem('ejlog-auth-storage'),
      user: localStorage.getItem('ejlog_user')
    };
  });
  console.log('LocalStorage:', JSON.stringify(storage, null, 2));

  // Take a screenshot
  await page.screenshot({ path: 'test-results/debug-reports.png', fullPage: true });

  // This test always passes - it's just for debugging
  expect(true).toBe(true);
});
