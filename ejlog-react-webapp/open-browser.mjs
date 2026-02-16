import { chromium } from '@playwright/test';

(async () => {
  console.log('🚀 Avvio browser Chromium con Playwright...');

  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized']
  });

  const context = await browser.newContext({
    viewport: null,
    baseURL: 'http://localhost:3001'
  });

  const page = await context.newPage();

  console.log('📱 Apertura http://localhost:3001...');
  await page.goto('http://localhost:3001');

  console.log('✅ Browser aperto! Premi Ctrl+C per chiudere.');
  console.log('📍 Per navigare alla pagina Settings Adapter:');
  console.log('   → http://localhost:3001/settings/adapter');

  // Mantieni il browser aperto
  await page.waitForTimeout(3600000); // 1 ora
})();
