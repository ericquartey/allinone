// Quick test script to check if bypass authentication works
import { chromium } from '@playwright/test';

(async () => {
  console.log('\n========================================');
  console.log('🧪 Testing authentication bypass');
  console.log('========================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  page.on('pageerror', error => {
    errors.push(`PAGE ERROR: ${error.message}`);
  });

  // Test 1: Without bypass parameter
  console.log('📌 Test 1: Navigate to /lists-management (without bypass)');
  await page.goto('http://localhost:3002/lists-management');
  await page.waitForTimeout(2000);

  const url1 = page.url();
  console.log('   URL:', url1);
  console.log('   Redirected to login:', url1.includes('/login') ? '✅ Yes (expected)' : '❌ No');

  // Test 2: With bypass parameter
  console.log('\n📌 Test 2: Navigate to /lists-management?bypass=true');
  await page.goto('http://localhost:3002/lists-management?bypass=true');
  await page.waitForTimeout(2000);

  const url2 = page.url();
  console.log('   URL:', url2);
  console.log('   Redirected to login:', url2.includes('/login') ? '❌ No! (PROBLEM!)' : '✅ Stayed on page');

  // Check page content
  const html = await page.locator('#root').innerHTML();
  const hasGestioneListe = html.includes('Gestione Liste');
  const hasSidebar = html.includes('w-64');
  const hasAzioni = html.includes('Azioni');
  const hasLoginForm = html.includes('Accedi al Sistema') || html.includes('Username');

  console.log('\n📊 Page Content:');
  console.log('   - "Gestione Liste":', hasGestioneListe ? '✅' : '❌');
  console.log('   - Sidebar (w-64):', hasSidebar ? '✅' : '❌');
  console.log('   - "Azioni" title:', hasAzioni ? '✅' : '❌');
  console.log('   - Login form:', hasLoginForm ? '❌ PRESENT (bad!)' : '✅ ABSENT (good)');

  console.log('\n📷 Taking screenshots...');
  await page.screenshot({ path: 'test-results/bypass-check-full.png', fullPage: true });
  console.log('   Saved: test-results/bypass-check-full.png');

  if (errors.length > 0) {
    console.log('\n❌ Errors found:');
    errors.forEach(err => console.log('   -', err));
  } else {
    console.log('\n✅ No JavaScript errors');
  }

  console.log('\n========================================');
  if (!url2.includes('/login') && hasGestioneListe && hasSidebar) {
    console.log('✅✅✅ BYPASS WORKS! Enhanced page is visible!');
  } else if (url2.includes('/login')) {
    console.log('❌ BYPASS FAILED - Still redirected to login');
  } else {
    console.log('⚠️ Bypass works but content is wrong');
  }
  console.log('========================================\n');

  await browser.close();
})();
