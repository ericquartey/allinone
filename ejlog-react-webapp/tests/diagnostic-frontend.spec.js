// ============================================================================
// EJLOG WMS - Frontend Diagnostic Test with Playwright
// Analyze the frontend server and capture issues
// ============================================================================

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.describe('Frontend Diagnostic Tests', () => {
  test('should connect to frontend server and capture page state', async ({ page }) => {
    console.log('🔍 Starting frontend diagnostic...');

    // Set longer timeout for initial load
    test.setTimeout(60000);

    // Navigate to the frontend
    console.log('📡 Connecting to http://localhost:3003...');

    try {
      const response = await page.goto('http://localhost:3003', {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });

      console.log('✅ Response status:', response.status());
      console.log('✅ Response URL:', response.url());

      // Wait a bit for any redirects or initial rendering
      await page.waitForTimeout(2000);

      // Capture current URL (in case of redirects)
      const currentUrl = page.url();
      console.log('📍 Current URL after load:', currentUrl);

      // Get page title
      const title = await page.title();
      console.log('📄 Page title:', title);

      // Check if we're on login page
      const isLoginPage = currentUrl.includes('/login');
      console.log('🔐 Is login page?', isLoginPage);

      // Capture page content
      const bodyText = await page.locator('body').textContent();
      console.log('📝 Body content length:', bodyText?.length || 0);

      // Check for React root
      const hasReactRoot = await page.locator('#root').count() > 0;
      console.log('⚛️  Has React root (#root)?', hasReactRoot);

      // Check for common error messages
      const errorTexts = [
        'Cannot GET',
        '404',
        'Error',
        'Failed to fetch',
        'Unexpected token',
        'SyntaxError'
      ];

      for (const errorText of errorTexts) {
        if (bodyText?.includes(errorText)) {
          console.log('❌ Found error text:', errorText);
        }
      }

      // Take screenshot
      const screenshotPath = path.join(__dirname, '..', 'diagnostic-screenshot.png');
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log('📸 Screenshot saved to:', screenshotPath);

      // Get HTML content
      const html = await page.content();
      const htmlPath = path.join(__dirname, '..', 'diagnostic-page.html');
      fs.writeFileSync(htmlPath, html);
      console.log('💾 HTML saved to:', htmlPath);

      // Check console errors
      const consoleMessages = [];
      page.on('console', msg => {
        const type = msg.type();
        const text = msg.text();
        consoleMessages.push({ type, text });
        if (type === 'error' || type === 'warning') {
          console.log(`🔴 Console ${type}:`, text);
        }
      });

      // Check network errors
      page.on('requestfailed', request => {
        console.log('❌ Network failed:', request.url(), request.failure()?.errorText);
      });

      // Wait for network idle
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
        console.log('⏱️  Timeout waiting for network idle (not critical)');
      });

      // Check if login form is present
      const loginForm = await page.locator('form').count();
      console.log('📋 Number of forms found:', loginForm);

      // Check for input fields
      const inputs = await page.locator('input').count();
      console.log('⌨️  Number of inputs found:', inputs);

      // Check for buttons
      const buttons = await page.locator('button').count();
      console.log('🔘 Number of buttons found:', buttons);

      // Get all visible text
      const visibleText = await page.locator('body *:visible').allTextContents();
      console.log('👁️  Visible elements count:', visibleText.length);
      console.log('📄 First 200 chars of visible text:', visibleText.join(' ').substring(0, 200));

      // Check localStorage
      const localStorage = await page.evaluate(() => {
        return Object.keys(window.localStorage).reduce((acc, key) => {
          acc[key] = window.localStorage.getItem(key)?.substring(0, 50); // Truncate for safety
          return acc;
        }, {});
      });
      console.log('💾 LocalStorage keys:', Object.keys(localStorage));

      // Diagnostic summary
      console.log('\n📊 DIAGNOSTIC SUMMARY:');
      console.log('========================');
      console.log('Server Status:', response.status() === 200 ? '✅ OK' : '❌ ERROR');
      console.log('React Root:', hasReactRoot ? '✅ Present' : '❌ Missing');
      console.log('Page Title:', title || '❌ Empty');
      console.log('Current Route:', currentUrl);
      console.log('Forms Found:', loginForm);
      console.log('Inputs Found:', inputs);
      console.log('Buttons Found:', buttons);
      console.log('========================\n');

      // If we're on login page, try to interact
      if (isLoginPage && loginForm > 0) {
        console.log('🔐 Detected login page, checking form fields...');

        // Try to find username/email field
        const usernameField = page.locator('input[type="text"], input[type="email"], input[name*="user"], input[name*="email"]').first();
        const usernameCount = await usernameField.count();
        console.log('Username field found:', usernameCount > 0 ? '✅ Yes' : '❌ No');

        // Try to find password field
        const passwordField = page.locator('input[type="password"]').first();
        const passwordCount = await passwordField.count();
        console.log('Password field found:', passwordCount > 0 ? '✅ Yes' : '❌ No');

        // Try to find submit button
        const submitButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Accedi")').first();
        const submitCount = await submitButton.count();
        console.log('Submit button found:', submitCount > 0 ? '✅ Yes' : '❌ No');
      }

      // Final assertion - page should be accessible
      expect(response.status()).toBe(200);
      expect(hasReactRoot).toBe(true);

    } catch (error) {
      console.error('❌ ERROR during diagnostic:', error.message);

      // Try to get screenshot even on error
      try {
        const errorScreenshotPath = path.join(__dirname, '..', 'diagnostic-error.png');
        await page.screenshot({ path: errorScreenshotPath, fullPage: true });
        console.log('📸 Error screenshot saved to:', errorScreenshotPath);
      } catch (screenshotError) {
        console.error('Failed to take error screenshot:', screenshotError.message);
      }

      throw error;
    }
  });

  test('should check if backend API is accessible', async ({ request }) => {
    console.log('🔍 Checking backend API at http://localhost:3077...');

    try {
      const response = await request.get('http://localhost:3077/api/health', {
        timeout: 5000
      }).catch(() => null);

      if (response) {
        console.log('✅ Backend API status:', response.status());
        const body = await response.text();
        console.log('📄 Backend response:', body.substring(0, 200));
      } else {
        console.log('❌ Backend API not accessible (this is OK for frontend-only test)');
      }
    } catch (error) {
      console.log('❌ Backend API error:', error.message);
      console.log('ℹ️  This is expected if backend is not running');
    }
  });
});

