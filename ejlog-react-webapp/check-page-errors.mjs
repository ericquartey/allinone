import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const errors = [];
const warnings = [];
const networkErrors = [];

page.on('console', msg => {
  if (msg.type() === 'error') {
    errors.push('CONSOLE ERROR: ' + msg.text());
  } else if (msg.type() === 'warning') {
    warnings.push('CONSOLE WARNING: ' + msg.text());
  }
});

page.on('pageerror', error => {
  errors.push('PAGE ERROR: ' + error.message);
});

page.on('response', response => {
  if (response.status() >= 400) {
    networkErrors.push('HTTP ' + response.status() + ': ' + response.url());
  }
});

try {
  console.log('Loading http://localhost:3003/drawers/management...');
  await page.goto('http://localhost:3003/drawers/management', { 
    waitUntil: 'networkidle',
    timeout: 30000 
  });
  
  await page.waitForTimeout(3000);
  
  console.log('\n=== PAGE CHECK RESULTS ===\n');
  
  if (errors.length > 0) {
    console.log('ERRORS FOUND:');
    errors.forEach(e => console.log('  ❌', e));
  } else {
    console.log('✅ No console or page errors');
  }
  
  if (networkErrors.length > 0) {
    console.log('\nNETWORK ERRORS:');
    networkErrors.forEach(e => console.log('  🌐', e));
  } else {
    console.log('\n✅ No network errors');
  }
  
  const title = await page.title();
  console.log('\nPage Title:', title);
  
} catch (error) {
  console.error('Failed to load page:', error.message);
} finally {
  await browser.close();
}
