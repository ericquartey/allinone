import { test } from '@playwright/test';

/**
 * Test E2E - Verifica lo stato di autenticazione
 *
 * Questo test va sulla pagina degli utenti e cattura lo stato dell'auth
 */

test('dovrebbe catturare lo stato di autenticazione', async ({ page }) => {
  // Vai alla pagina degli utenti
  await page.goto('http://localhost:3006/config/users');
  await page.waitForLoadState('networkidle');

  // Aspetta un po' per il caricamento
  await page.waitForTimeout(3000);

  // Cattura lo stato dal localStorage
  const authState = await page.evaluate(() => {
    const persistAuth = localStorage.getItem('persist:auth');
    const persistRoot = localStorage.getItem('persist:root');

    return {
      persistAuth: persistAuth ? JSON.parse(persistAuth) : null,
      persistRoot: persistRoot ? JSON.parse(persistRoot) : null,
      allKeys: Object.keys(localStorage),
    };
  });

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📦 LOCAL STORAGE AUTH STATE');
  console.log('═══════════════════════════════════════════════════════');
  console.log('All localStorage keys:', authState.allKeys);
  console.log('\npersist:auth:', JSON.stringify(authState.persistAuth, null, 2));
  console.log('\npersist:root:', JSON.stringify(authState.persistRoot, null, 2));
  console.log('═══════════════════════════════════════════════════════\n');

  // Cattura screenshot
  await page.screenshot({
    path: 'test-results/auth-state-page.png',
    fullPage: true
  });
});
