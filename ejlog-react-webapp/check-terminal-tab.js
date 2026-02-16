import { chromium } from 'playwright';

(async () => {
  console.log('🔍 Testing Terminal tab functionality...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen for network requests
  const apiCalls = [];
  page.on('request', request => {
    const url = request.url();
    if (url.includes('/api/')) {
      apiCalls.push({ url, method: request.method() });
    }
  });

  // Listen for network responses
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/api/scheduler')) {
      const status = response.status();
      console.log(`${status >= 400 ? '❌' : '✅'} ${response.request().method()} ${url} → ${status}`);

      if (status < 400) {
        try {
          const body = await response.json();
          console.log(`   Response preview:`, JSON.stringify(body).substring(0, 200));
        } catch (e) {
          // Not JSON
        }
      }
    }
  });

  try {
    console.log('📄 Loading page...');
    await page.goto('http://localhost:3000/scheduler-settings', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait for page to be interactive
    await page.waitForTimeout(2000);

    // Check if Terminal tab exists
    const terminalTab = await page.locator('button:has-text("Terminal")').count();
    console.log(`\n${terminalTab > 0 ? '✅' : '❌'} Terminal tab ${terminalTab > 0 ? 'found' : 'NOT found'}`);

    if (terminalTab > 0) {
      // Click Terminal tab
      console.log('🖱️  Clicking Terminal tab...');
      await page.locator('button:has-text("Terminal")').click();

      // Wait for terminal to load
      await page.waitForTimeout(3000);

      // Check if terminal content exists
      const terminalLines = await page.locator('.font-mono').allTextContents();
      console.log(`\n📟 Terminal output (${terminalLines.length} lines):`);
      terminalLines.slice(-10).forEach((line, i) => {
        console.log(`   ${i + 1}. ${line}`);
      });

      // Wait for polling to occur (5 seconds + buffer)
      console.log('\n⏳ Waiting for polling cycle...');
      await page.waitForTimeout(7000);

      // Check updated terminal content
      const updatedLines = await page.locator('.font-mono').allTextContents();
      console.log(`\n📟 Updated terminal output (${updatedLines.length} lines):`);
      updatedLines.slice(-10).forEach((line, i) => {
        console.log(`   ${i + 1}. ${line}`);
      });

      // Check for expected patterns
      const hasPrenotazioni = updatedLines.some(line => line.includes('📦') || line.includes('Prenotazioni'));
      const hasFetcherProcessor = updatedLines.some(line => line.includes('⚙️') || line.includes('Fetcher') || line.includes('Processor'));
      const hasStats = updatedLines.some(line => line.includes('📊') || line.includes('Stats'));

      console.log(`\n✅ Validation:`);
      console.log(`   ${hasPrenotazioni ? '✅' : '❌'} Prenotazioni data present`);
      console.log(`   ${hasFetcherProcessor ? '✅' : '❌'} Fetcher/Processor status present`);
      console.log(`   ${hasStats ? '✅' : '❌'} Statistics present`);
    }

    // Summary of API calls
    console.log(`\n📊 API calls made (${apiCalls.length} total):`);
    const uniqueEndpoints = [...new Set(apiCalls.map(c => c.url))];
    uniqueEndpoints.forEach(url => {
      console.log(`   - ${url}`);
    });

    console.log('\n⏸️  Browser will stay open for 30 seconds...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('❌ Fatal Error:', error.message);
  } finally {
    await browser.close();
    console.log('✅ Test complete');
  }
})();
