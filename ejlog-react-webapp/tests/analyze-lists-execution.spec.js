// Test per analizzare e debuggare la pagina /lists/execution
const { test, expect } = require('@playwright/test');

test('Analyze Lists Execution Page', async ({ page }) => {
  // Cattura tutti gli errori
  const consoleMessages = [];
  const errors = [];
  const networkRequests = [];
  const networkResponses = [];

  // Monitor console
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push({ type: msg.type(), text });
    if (msg.type() === 'error') {
      console.log('❌ Console Error:', text);
      errors.push({ type: 'console', message: text });
    }
  });

  // Monitor page errors
  page.on('pageerror', error => {
    console.log('❌ Page Error:', error.message);
    errors.push({ type: 'page', message: error.message, stack: error.stack });
  });

  // Monitor network requests
  page.on('request', request => {
    const url = request.url();
    if (url.includes('/api/')) {
      networkRequests.push({
        url,
        method: request.method(),
        headers: request.headers()
      });
      console.log('📡 Request:', request.method(), url);
    }
  });

  // Monitor network responses
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/api/')) {
      const status = response.status();
      let body = null;
      try {
        if (response.headers()['content-type']?.includes('json')) {
          body = await response.json();
        }
      } catch (e) {
        // Ignore
      }

      networkResponses.push({ url, status, body });

      if (status >= 400) {
        console.log('⚠️ Failed Response:', status, url);
        errors.push({ type: 'network', url, status });
      } else {
        console.log('✅ Response:', status, url);
      }
    }
  });

  console.log('\n🔍 Navigating to /lists/execution...\n');

  try {
    await page.goto('http://localhost:3003/lists/execution', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
  } catch (e) {
    console.log('⚠️ Navigation error:', e.message);
  }

  // Aspetta un po'
  await page.waitForTimeout(3000);

  // Cattura screenshot
  await page.screenshot({
    path: 'test-results/lists-execution-analysis.png',
    fullPage: true
  });

  // Analizza elementi visibili
  const pageContent = await page.evaluate(() => {
    return {
      title: document.title,
      hasHeader: !!document.querySelector('h1'),
      headerText: document.querySelector('h1')?.textContent,
      hasErrorMessage: !!document.querySelector('*[class*="red"], *[class*="error"]'),
      errorText: document.querySelector('*[class*="red"] h3, *[class*="error"] h3')?.textContent,
      hasLoadingMessage: !!document.querySelector('*:has-text("Caricamento")'),
      hasEmptyMessage: !!document.querySelector('*:has-text("Nessuna lista")'),
      bodyText: document.body.innerText.substring(0, 1000)
    };
  });

  console.log('\n📄 PAGE CONTENT:');
  console.log('Title:', pageContent.title);
  console.log('Header:', pageContent.headerText);
  console.log('Has Error Message:', pageContent.hasErrorMessage);
  if (pageContent.hasErrorMessage) {
    console.log('Error Text:', pageContent.errorText);
  }
  console.log('Has Loading:', pageContent.hasLoadingMessage);
  console.log('Has Empty Message:', pageContent.hasEmptyMessage);

  console.log('\n🌐 NETWORK SUMMARY:');
  console.log('Total Requests:', networkRequests.length);
  console.log('Total Responses:', networkResponses.length);

  const failedResponses = networkResponses.filter(r => r.status >= 400);
  if (failedResponses.length > 0) {
    console.log('\n❌ FAILED REQUESTS:');
    failedResponses.forEach(r => {
      console.log(`  ${r.status} ${r.url}`);
      if (r.body) console.log(`  Body:`, r.body);
    });
  }

  const successResponses = networkResponses.filter(r => r.status >= 200 && r.status < 300);
  if (successResponses.length > 0) {
    console.log('\n✅ SUCCESSFUL REQUESTS:');
    successResponses.forEach(r => {
      console.log(`  ${r.status} ${r.url}`);
      if (r.body) console.log(`  Body:`, JSON.stringify(r.body).substring(0, 200));
    });
  }

  console.log('\n🔴 ERRORS FOUND:', errors.length);
  if (errors.length > 0) {
    errors.forEach((err, i) => {
      console.log(`\n${i + 1}. ${err.type.toUpperCase()} ERROR:`);
      console.log('  Message:', err.message);
      if (err.stack) {
        console.log('  Stack:', err.stack.substring(0, 500));
      }
    });
  }

  console.log('\n💬 CONSOLE MESSAGES (last 10):');
  consoleMessages.slice(-10).forEach(msg => {
    console.log(`  [${msg.type}]`, msg.text.substring(0, 200));
  });

  console.log('\n📋 BODY TEXT (first 500 chars):');
  console.log(pageContent.bodyText.substring(0, 500));
});
