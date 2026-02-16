// @ts-check
import { test, expect } from '@playwright/test';

test('Debug auto-login behavior', async ({ page }) => {
  const consoleLogs = [];

  // Listen to console messages
  page.on('console', msg => {
    const text = msg.text();
    console.log(`[BROWSER ${msg.type()}]`, text);
    consoleLogs.push(text);
  });

  // Navigate to home page and CLEAR localStorage first
  console.log('Navigating to http://localhost:3003 and clearing localStorage');
  await page.goto('http://localhost:3003/');

  // Clear localStorage to force fresh auto-login (with error handling for security restrictions)
  await page.evaluate(() => {
    try {
      localStorage.clear();
      console.log('[TEST] localStorage cleared');
    } catch (e) {
      console.log('[TEST] Storage clear skipped due to security restrictions');
    }
  });

  // Reload to trigger auto-login
  console.log('Reloading page to trigger auto-login...');
  await page.reload();

  // Wait a bit for React to initialize
  await page.waitForTimeout(2000);

  // Check localStorage
  const token = await page.evaluate(() => localStorage.getItem('token'));
  const user = await page.evaluate(() => localStorage.getItem('user'));

  console.log('Token in localStorage:', token);
  console.log('User in localStorage:', user);

  // Check current URL
  const currentUrl = page.url();
  console.log('Current URL:', currentUrl);

  // Check if we're on login page
  const isLoginPage = currentUrl.includes('/login');
  console.log('Is on login page:', isLoginPage);

  // Take a screenshot
  await page.screenshot({ path: 'test-results/debug-autologin.png', fullPage: true });

  // Check if login form is visible
  const loginFormVisible = await page.locator('form').count() > 0;
  console.log('Login form visible:', loginFormVisible);

  // Check Redux state
  const reduxState = await page.evaluate(() => {
    // @ts-ignore
    return window.__REDUX_DEVTOOLS_EXTENSION__ ? 'Redux DevTools available' : 'No Redux DevTools';
  });
  console.log('Redux state:', reduxState);

  // Check if AUTO-LOGIN logs were present
  const authLogs = consoleLogs.filter(log => log.includes('[AUTO-LOGIN]'));
  console.log('\nAUTO-LOGIN logs found:', authLogs.length);
  authLogs.forEach(log => console.log('  -', log));
});
