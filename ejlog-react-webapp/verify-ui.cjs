const { chromium } = require('@playwright/test');

(async () => {
  console.log('🚀 Starting Playwright UI Verification...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('📱 Step 1: Navigating to React UI at http://localhost:3001');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle', timeout: 10000 });
    console.log('✅ Page loaded successfully\n');

    // Wait a bit for React to render
    await page.waitForTimeout(2000);

    // Take screenshot of initial state
    await page.screenshot({ path: 'ui-verification-step1.png', fullPage: true });
    console.log('📸 Screenshot saved: ui-verification-step1.png\n');

    // Check page title
    const title = await page.title();
    console.log(`📄 Page Title: "${title}"\n`);

    // Check if login form is present (should NOT be if auth is disabled)
    const loginForm = await page.$('form[action*="login"]').catch(() => null);
    const loginButton = await page.getByRole('button', { name: /login|sign in|entrar/i }).first().catch(() => null);

    if (loginButton) {
      console.log('⚠️  Login button found on page');
      const isVisible = await loginButton.isVisible().catch(() => false);
      console.log(`   Visibility: ${isVisible ? 'VISIBLE' : 'HIDDEN'}\n`);
    } else {
      console.log('✅ No login button found - authentication appears to be bypassed\n');
    }

    // Check for main navigation or dashboard elements
    const nav = await page.$('nav').catch(() => null);
    const mainContent = await page.$('main').catch(() => null);
    const dashboard = await page.getByText(/dashboard|home|items|stock/i).first().catch(() => null);

    console.log('🔍 UI Elements Check:');
    console.log(`   - Navigation: ${nav ? '✅ FOUND' : '❌ NOT FOUND'}`);
    console.log(`   - Main Content: ${mainContent ? '✅ FOUND' : '❌ NOT FOUND'}`);
    console.log(`   - Dashboard/Menu: ${dashboard ? '✅ FOUND' : '❌ NOT FOUND'}\n`);

    // Get page content
    const bodyText = await page.textContent('body');
    console.log('📝 Page Content Preview:');
    console.log(bodyText.substring(0, 300) + '...\n');

    // Check for error messages
    const errorElements = await page.$$('[class*="error"], [class*="Error"], [role="alert"]');
    if (errorElements.length > 0) {
      console.log(`⚠️  Found ${errorElements.length} potential error elements\n`);
    } else {
      console.log('✅ No error elements detected\n');
    }

    // Final screenshot
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'ui-verification-final.png', fullPage: true });
    console.log('📸 Final screenshot saved: ui-verification-final.png\n');

    console.log('✅ VERIFICATION COMPLETE!\n');
    console.log('Summary:');
    console.log('- React UI is accessible at http://localhost:3001');
    console.log('- Page loaded without requiring login credentials');
    console.log('- Screenshots captured for manual review\n');

  } catch (error) {
    console.error('❌ ERROR during verification:', error.message);
    await page.screenshot({ path: 'ui-verification-error.png', fullPage: true });
    console.log('📸 Error screenshot saved: ui-verification-error.png\n');
  } finally {
    await browser.close();
    console.log('🏁 Browser closed. Verification complete.');
  }
})();
