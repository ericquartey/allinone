import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = [];
  const consoleMessages = [];

  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`Console Error: ${msg.text()}`);
      consoleMessages.push(msg.text());
    }
  });

  // Capture page errors
  page.on('pageerror', error => {
    errors.push(`Page Error: ${error.message}\n${error.stack}`);
  });

  // Capture failed requests
  page.on('requestfailed', request => {
    errors.push(`Failed Request: ${request.method()} ${request.url()} - ${request.failure().errorText}`);
  });

  // Capture HTTP errors (404, 500, etc.)
  page.on('response', response => {
    if (response.status() >= 400) {
      errors.push(`HTTP ${response.status()}: ${response.url()}`);
    }
  });

  try {
    console.log('Loading http://localhost:3003/drawers/management...');
    await page.goto('http://localhost:3003/drawers/management', {
      waitUntil: 'domcontentloaded',  // Don't wait for networkidle
      timeout: 15000
    });
    console.log('Page loaded successfully!');

    // Wait a bit for React to render and API calls to complete
    await page.waitForTimeout(5000);

    console.log('\n========================================');
    console.log('ERRORS DETECTED:');
    console.log('========================================\n');

    if (errors.length === 0) {
      console.log('✓ No errors detected!');
    } else {
      errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}\n`);
      });
    }

    console.log(`\nTotal errors: ${errors.length}`);

  } catch (error) {
    console.error('Failed to load page:', error.message);
  } finally {
    await browser.close();
  }
})();
