import { test, expect } from '@playwright/test';

test('Login come superuser e screenshot dashboard', async ({ page }) => {
  // Vai alla pagina di login
  await page.goto('http://localhost:3004/login');

  // Aspetta che la pagina sia caricata
  await page.waitForLoadState('networkidle');

  // Screenshot della pagina di login
  await page.screenshot({
    path: 'screenshots/01-login-page.png',
    fullPage: true
  });

  console.log('📸 Screenshot login page salvato');

  // Compila il form di login
  await page.fill('input[name="username"]', 'superuser');
  await page.fill('input[name="password"]', 'promag27');

  // Screenshot del form compilato
  await page.screenshot({
    path: 'screenshots/02-login-filled.png',
    fullPage: true
  });

  console.log('📸 Screenshot form compilato salvato');

  // Click sul bottone di login
  await page.click('button[type="submit"]');

  // Aspetta il redirect al dashboard
  await page.waitForURL('**/dashboard', { timeout: 10000 });

  // Aspetta che il dashboard sia caricato
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000); // Aspetta animazioni

  // Screenshot del dashboard
  await page.screenshot({
    path: 'screenshots/03-dashboard-full.png',
    fullPage: true
  });

  console.log('📸 Screenshot dashboard completo salvato');

  // Screenshot solo del banner hero
  const heroBanner = await page.locator('.dashboard-banner, [class*="hero"], [class*="banner"]').first();
  if (await heroBanner.isVisible()) {
    await heroBanner.screenshot({
      path: 'screenshots/04-dashboard-hero-banner.png'
    });
    console.log('📸 Screenshot hero banner salvato');
  }

  // Verifica che l'utente sia loggato
  const usernameText = await page.textContent('body');
  expect(usernameText).toContain('superuser');

  console.log('✅ Test completato! Screenshots salvati in screenshots/');
  console.log('✅ Login verificato con successo');
});
