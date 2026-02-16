/**
 * Test di Debug - Login Superuser
 * Test semplificato per diagnosticare problemi di login
 */

import { test, expect } from '@playwright/test';

test.describe('Debug Login Page', () => {
  test('Verifica che la pagina di login si carichi', async ({ page }) => {
    console.log('🔍 Navigazione a http://localhost:3001/login');

    await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle' });

    // Screenshot della pagina
    await page.screenshot({ path: 'test-results/login-page-loaded.png' });

    console.log('📸 Screenshot salvato: login-page-loaded.png');
    console.log('📄 URL corrente:', page.url());
    console.log('📝 Titolo pagina:', await page.title());

    // Verifica presenza elementi form
    const usernameInput = page.locator('input[name="username"]');
    const passwordInput = page.locator('input[name="password"]');
    const submitButton = page.locator('button[type="submit"]');

    await expect(usernameInput).toBeVisible({ timeout: 5000 });
    await expect(passwordInput).toBeVisible({ timeout: 5000 });
    await expect(submitButton).toBeVisible({ timeout: 5000 });

    console.log('✅ Form di login visibile e caricato correttamente');
  });

  test('Test login con superuser - Step by step', async ({ page }) => {
    const password = `promag${(31 - new Date().getDate()).toString().padStart(2, '0')}`;

    console.log('🔐 Inizio test login');
    console.log('👤 Username: superuser');
    console.log('🔑 Password calcolata:', password);

    // 1. Vai alla pagina di login
    console.log('\n📍 Step 1: Navigazione a /login');
    await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // 2. Compila username
    console.log('📍 Step 2: Compilazione username');
    const usernameInput = page.locator('input[name="username"]');
    await usernameInput.fill('superuser');
    const usernameValue = await usernameInput.inputValue();
    console.log('  ✓ Username inserito:', usernameValue);

    // 3. Compila password
    console.log('📍 Step 3: Compilazione password');
    const passwordInput = page.locator('input[name="password"]');
    await passwordInput.fill(password);
    const passwordValue = await passwordInput.inputValue();
    console.log('  ✓ Password inserita (length):', passwordValue.length);

    // Screenshot prima del submit
    await page.screenshot({ path: 'test-results/before-submit.png' });
    console.log('📸 Screenshot: before-submit.png');

    // 4. Intercetta la richiesta di login
    console.log('📍 Step 4: Intercettazione richieste network');

    const loginRequest = page.waitForRequest(request => {
      const isLoginRequest = request.url().includes('/auth/login');
      if (isLoginRequest) {
        console.log('📤 Richiesta login intercettata:', {
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
        });
      }
      return isLoginRequest;
    });

    const loginResponse = page.waitForResponse(response => {
      const isLoginResponse = response.url().includes('/auth/login');
      if (isLoginResponse) {
        console.log('📥 Risposta login ricevuta:', {
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
        });
      }
      return isLoginResponse;
    });

    // 5. Click sul pulsante submit
    console.log('📍 Step 5: Click su pulsante login');
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // 6. Attendi richiesta e risposta
    try {
      const req = await loginRequest;
      console.log('  ✓ Richiesta inviata');

      const res = await loginResponse;
      console.log('  ✓ Risposta ricevuta');

      const responseBody = await res.json();
      console.log('📦 Response body:', JSON.stringify(responseBody, null, 2));

      // Screenshot dopo il submit
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-results/after-submit.png' });
      console.log('📸 Screenshot: after-submit.png');

      // Verifica risposta
      expect(responseBody.success).toBe(true);
      console.log('✅ Login API riuscito!');

      // Verifica reindirizzamento o errore nella UI
      console.log('📍 Step 6: Verifica UI dopo login');

      // Attendi un po' per vedere cosa succede
      await page.waitForTimeout(3000);

      const currentUrl = page.url();
      console.log('📄 URL dopo login:', currentUrl);

      // Cerca eventuali errori visualizzati
      const errorElement = page.locator('.bg-red-50, .error, [role="alert"]');
      const errorCount = await errorElement.count();

      if (errorCount > 0) {
        const errorText = await errorElement.first().textContent();
        console.log('❌ Errore visualizzato:', errorText);
        await page.screenshot({ path: 'test-results/error-displayed.png' });
      } else {
        console.log('✅ Nessun errore visualizzato');
      }

      // Verifica se siamo stati reindirizzati
      if (currentUrl.includes('/login')) {
        console.log('⚠️  Ancora sulla pagina di login - Login fallito nella UI');
      } else {
        console.log('✅ Reindirizzamento riuscito a:', currentUrl);
      }

    } catch (err) {
      console.error('❌ Errore durante l\'attesa della risposta:', err.message);
      await page.screenshot({ path: 'test-results/error-timeout.png' });
      throw err;
    }
  });

  test('Test API diretta - Verifica endpoint', async ({ request }) => {
    const password = `promag${(31 - new Date().getDate()).toString().padStart(2, '0')}`;

    console.log('🧪 Test API diretta');
    console.log('🔗 Endpoint: http://localhost:3001/api/auth/login');
    console.log('📦 Payload:', { username: 'superuser', password });

    const response = await request.post('http://localhost:3001/api/auth/login', {
      data: {
        username: 'superuser',
        password: password
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Status:', response.status());
    console.log('📋 Headers:', response.headers());

    const body = await response.json();
    console.log('📦 Body:', JSON.stringify(body, null, 2));

    expect(response.status()).toBe(200);
    expect(body.success).toBe(true);

    console.log('✅ API endpoint funziona correttamente!');
  });
});
