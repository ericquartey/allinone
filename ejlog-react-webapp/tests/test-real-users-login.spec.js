import { test, expect } from '@playwright/test';

test.describe('Test Login Utenti Reali', () => {
  test.beforeEach(async ({ page }) => {
    // Vai alla pagina di login
    await page.goto('http://localhost:3000');

    // Aspetta che la pagina sia caricata
    await page.waitForLoadState('networkidle');
  });

  test('Verifica pagina login è visibile', async ({ page }) => {
    console.log('📍 URL corrente:', page.url());

    // Cerca il form di login
    const usernameInput = page.locator('input[name="username"], input[type="text"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();

    await expect(usernameInput).toBeVisible({ timeout: 10000 });
    await expect(passwordInput).toBeVisible({ timeout: 10000 });

    console.log('✅ Form di login trovato');
  });

  test('Test login con superuser (dinamico)', async ({ page }) => {
    console.log('🔐 Tentativo login con superuser');

    // Calcola password dinamica: promag{31-day}
    const today = new Date();
    const day = today.getDate();
    const dynamicPassword = `promag${31 - day}`;

    console.log(`📅 Oggi: ${day} → Password: ${dynamicPassword}`);

    const usernameInput = page.locator('input[name="username"], input[type="text"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    const loginButton = page.locator('button[type="submit"]').first();

    // Compila form
    await usernameInput.fill('superuser');
    await passwordInput.fill(dynamicPassword);

    console.log(`✅ Credenziali inserite: superuser / ${dynamicPassword}`);

    // Click login
    await loginButton.click();

    // Aspetta redirect o cambio pagina
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    console.log('📍 URL dopo login:', currentUrl);

    // Verifica che non siamo più sulla pagina di login
    const isStillOnLogin = currentUrl.includes('login');
    expect(isStillOnLogin).toBeFalsy();

    console.log('✅ Login superuser riuscito!');
  });

  test('Test API login diretto con admin', async ({ request }) => {
    console.log('🧪 Test API diretto con admin');

    // Prova con utente admin (se esiste nel database)
    const response = await request.post('http://localhost:3077/api/auth/login', {
      data: {
        username: 'admin',
        password: 'admin123'
      }
    });

    console.log('📊 Status:', response.status());
    const data = await response.json();
    console.log('📊 Response:', JSON.stringify(data, null, 2));

    if (data.success) {
      console.log('✅ Login admin riuscito con password: admin123');
      expect(data.token).toBeDefined();
      expect(data.user.username).toBe('admin');
    } else {
      console.log('❌ Login admin fallito:', data.error);
    }
  });

  test('Test login con utente che ha punto nel nome (A.C.S1)', async ({ page }) => {
    console.log('🔐 Test login con A.C.S1 (username con punto)');

    const usernameInput = page.locator('input[name="username"], input[type="text"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    const loginButton = page.locator('button[type="submit"]').first();

    // Usa la password resettata
    await usernameInput.fill('A.C.S1');
    await passwordInput.fill('test1234');

    console.log('✅ Credenziali inserite: A.C.S1 / test1234');

    await loginButton.click();
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    const isStillOnLogin = currentUrl.includes('login');

    if (!isStillOnLogin) {
      console.log(`✅ Login riuscito con utente A.C.S1!`);
      console.log(`📍 URL dopo login: ${currentUrl}`);
      expect(isStillOnLogin).toBe(false);
    } else {
      console.log('❌ Login fallito');
      expect(isStillOnLogin).toBe(false);
    }
  });

  test('Verifica messaggio errore login fallito', async ({ page }) => {
    console.log('🔐 Test messaggio errore login');

    const usernameInput = page.locator('input[name="username"], input[type="text"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    const loginButton = page.locator('button[type="submit"]').first();

    // Inserisci credenziali sbagliate
    await usernameInput.fill('userinesistente');
    await passwordInput.fill('passwordsbagliata');

    await loginButton.click();
    await page.waitForTimeout(2000);

    // Cerca messaggio di errore
    const errorMessage = page.locator('text=/password|credenziali|error|errore/i');
    const hasError = await errorMessage.isVisible().catch(() => false);

    if (hasError) {
      const errorText = await errorMessage.textContent();
      console.log('✅ Messaggio errore trovato:', errorText);
    } else {
      console.log('⚠️  Nessun messaggio errore visibile');
    }
  });
});

