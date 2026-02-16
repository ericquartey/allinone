import { test } from '@playwright/test';

test('Debug products page - capture console', async ({ page }) => {
  // Cattura tutti i messaggi della console
  page.on('console', msg => {
    console.log(`[BROWSER ${msg.type()}]:`, msg.text());
  });

  // Cattura errori JavaScript
  page.on('pageerror', err => {
    console.log(`[BROWSER ERROR]:`, err.message);
  });

  // Naviga alla pagina
  console.log('🔍 Navigating to /products...');
  await page.goto('http://localhost:3005/products');

  // Aspetta che la pagina si carichi completamente
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(5000); // 5 secondi per dare tempo al codice di eseguire

  console.log('✅ Page loaded - check console output above for errors');
});
