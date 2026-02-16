// ============================================================================
// EJLOG WMS - Standalone Frontend Check
// Direct Playwright script (not using config)
// ============================================================================

const { chromium } = require('@playwright/test');

(async () => {
  console.log('🚀 Starting frontend check...\n');

  const browser = await chromium.launch({
    headless: false, // Visible browser
    slowMo: 500, // Slow down for visibility
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });

  const page = await context.newPage();

  try {
    console.log('🌐 Opening http://localhost:3002...');

    const response = await page.goto('http://localhost:3002', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    console.log('✅ Response Status:', response.status());
    console.log('📍 Current URL:', page.url());

    // Get page title
    const title = await page.title();
    console.log('📄 Page Title:', title);

    // Check for React root
    const rootCount = await page.locator('#root').count();
    console.log('⚛️  React Root (#root):', rootCount > 0 ? 'FOUND' : 'NOT FOUND');

    // Get body content
    const bodyText = await page.locator('body').textContent();
    console.log('\n📝 Body Content (first 500 chars):');
    console.log('─'.repeat(80));
    console.log(bodyText?.substring(0, 500));
    console.log('─'.repeat(80));

    // Check for login form elements
    const forms = await page.locator('form').count();
    const inputs = await page.locator('input').count();
    const buttons = await page.locator('button').count();

    console.log('\n📋 Page Elements:');
    console.log(`  Forms: ${forms}`);
    console.log(`  Inputs: ${inputs}`);
    console.log(`  Buttons: ${buttons}`);

    // Check for specific input types
    const textInputs = await page.locator('input[type="text"]').count();
    const passwordInputs = await page.locator('input[type="password"]').count();

    console.log(`  Text Inputs: ${textInputs}`);
    console.log(`  Password Inputs: ${passwordInputs}`);

    // Take screenshot
    await page.screenshot({
      path: 'frontend-check-standalone.png',
      fullPage: true,
    });
    console.log('\n📸 Screenshot saved: frontend-check-standalone.png');

    // Save HTML
    const html = await page.content();
    require('fs').writeFileSync('frontend-check-standalone.html', html);
    console.log('💾 HTML saved: frontend-check-standalone.html');

    // Capture console messages
    page.on('console', msg => {
      const type = msg.type();
      if (type === 'error' || type === 'warning') {
        console.log(`\n🔴 Console ${type.toUpperCase()}:`, msg.text());
      }
    });

    // Wait 10 seconds for visual inspection
    console.log('\n⏱️  Keeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);

    console.log('\n✅ Frontend check complete!');
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);

    // Try to take screenshot on error
    try {
      await page.screenshot({
        path: 'frontend-check-error.png',
        fullPage: true,
      });
      console.log('📸 Error screenshot saved: frontend-check-error.png');
    } catch (e) {
      console.error('Could not save error screenshot:', e.message);
    }
  } finally {
    await browser.close();
    console.log('\n👋 Browser closed');
  }
})();
