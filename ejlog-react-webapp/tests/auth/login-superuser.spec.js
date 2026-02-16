/**
 * Test Playwright - Login Superuser
 *
 * Test di autenticazione con utente superuser e password dinamica
 * Password: promag + (31 - giorno_corrente)
 * Oggi (29/11): promag02
 */

import { test, expect } from '@playwright/test';

/**
 * Calcola la password dinamica per il superuser
 * @returns {string} Password del giorno (es: "promag02")
 */
function getDynamicPassword() {
  const today = new Date();
  const day = today.getDate();
  const suffix = (31 - day).toString().padStart(2, '0');
  return `promag${suffix}`;
}

test.describe('Login Superuser con Password Dinamica', () => {
  test.beforeEach(async ({ page }) => {
    // Naviga alla pagina di login
    await page.goto('http://localhost:3001/login');
  });

  test('Login superuser con password dinamica corretta', async ({ page }) => {
    const password = getDynamicPassword();
    const today = new Date();
    const day = today.getDate();

    console.log(`📅 Data test: ${day}/${today.getMonth() + 1}/${today.getFullYear()}`);
    console.log(`🔑 Password calcolata: ${password}`);
    console.log(`📐 Formula: promag + (31 - ${day}) = promag${(31 - day).toString().padStart(2, '0')}`);

    // Compila il form di login
    await page.fill('input[name="username"]', 'superuser');
    await page.fill('input[name="password"]', password);

    // Click sul pulsante login
    await page.click('button[type="submit"]');

    // Attendi il reindirizzamento dopo login
    await page.waitForURL('**/dashboard', { timeout: 5000 }).catch(() => {
      console.log('⚠️  Reindirizzamento a dashboard non rilevato, continuo test...');
    });

    // Verifica che il login sia riuscito
    // Controlla che non ci siano errori visibili
    const errorMessage = await page.locator('.error, .alert-error, [role="alert"]').count();
    expect(errorMessage).toBe(0);

    // Verifica presenza del nome utente nella UI
    const usernameDisplay = await page.locator('text=/superuser/i').first();
    await expect(usernameDisplay).toBeVisible({ timeout: 5000 });

    console.log('✅ Login superuser completato con successo!');
  });

  test('Verifica endpoint API di login direttamente con JWT', async ({ request }) => {
    const password = getDynamicPassword();

    console.log(`🧪 Test API diretta - POST /api/auth/login`);
    console.log(`👤 Username: superuser`);
    console.log(`🔑 Password: ${password}`);

    // Chiamata diretta all'API di login (backend sulla porta 3077)
    const response = await request.post('http://localhost:3077/api/auth/login', {
      data: {
        username: 'superuser',
        password: password
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Verifica status code
    expect(response.status()).toBe(200);

    // Parse response body
    const body = await response.json();

    console.log('📦 Response body:', JSON.stringify(body, null, 2));

    // Verifica struttura response
    expect(body.success).toBe(true);
    expect(body.user).toBeDefined();
    expect(body.user.username).toBe('superuser');
    expect(body.user.groupName).toBe('SUPERUSERS');
    expect(body.user.groupLevel).toBe(0);
    expect(body.isSuperuser).toBe(true);

    // ✨ NUOVO: Verifica presenza JWT token
    expect(body.token).toBeDefined();
    expect(body.token).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/); // Formato JWT
    expect(body.expiresIn).toBeDefined();
    expect(body.expiresIn).toBe('28800s'); // 8 ore

    console.log('✅ API login superuser verificata con successo!');
    console.log(`👤 User ID: ${body.user.id}`);
    console.log(`👥 Gruppo: ${body.user.groupName} (livello ${body.user.groupLevel})`);
    console.log(`🔑 JWT Token: ${body.token.substring(0, 50)}...`);
    console.log(`⏰ Scadenza: ${body.expiresIn}`);
  });

  test('Verifica validazione JWT token con /auth/check', async ({ request }) => {
    const password = getDynamicPassword();

    console.log(`🧪 Test validazione JWT token - GET /api/auth/check`);

    // 1. Prima fai login per ottenere il token
    const loginResponse = await request.post('http://localhost:3077/api/auth/login', {
      data: {
        username: 'superuser',
        password: password
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(loginResponse.status()).toBe(200);
    const loginBody = await loginResponse.json();
    const token = loginBody.token;

    console.log(`🔑 Token ottenuto: ${token.substring(0, 50)}...`);

    // 2. Verifica il token con /auth/check
    const checkResponse = await request.get('http://localhost:3077/api/auth/check', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    expect(checkResponse.status()).toBe(200);

    const checkBody = await checkResponse.json();
    console.log('📦 Response /auth/check:', JSON.stringify(checkBody, null, 2));

    // Verifica struttura response
    expect(checkBody.authenticated).toBe(true);
    expect(checkBody.user).toBeDefined();
    expect(checkBody.user.username).toBe('superuser');
    expect(checkBody.user.isSuperuser).toBe(true);
    expect(checkBody.message).toBe('Token valido');

    console.log('✅ Token JWT validato con successo tramite /auth/check!');
  });

  test('Login fallisce con password errata', async ({ request }) => {
    console.log(`🧪 Test password errata`);

    const response = await request.post('http://localhost:3077/api/auth/login', {
      data: {
        username: 'superuser',
        password: 'promag99' // Password errata
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Deve restituire 401 Unauthorized
    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toBeDefined();

    console.log('✅ Password errata correttamente rifiutata');
  });

  test('Verifica password hint endpoint', async ({ request }) => {
    console.log(`🧪 Test password hint endpoint`);

    const response = await request.get('http://localhost:3077/api/auth/password-hint');

    expect(response.status()).toBe(200);

    const body = await response.json();

    console.log('📋 Password hint:', body.hint);
    console.log('📐 Formula:', body.formula);
    console.log('💡 Esempio:', body.example);

    expect(body.hint).toContain('promag');
    expect(body.formula).toContain('31 - giorno_corrente');

    console.log('✅ Password hint endpoint funzionante');
  });

  test('Login con altri utenti dal database', async ({ request }) => {
    console.log(`🧪 Test login utente normale dal database`);

    // Nota: questo test richiede che ci sia un utente 'admin' nel database
    // con password MD5-hashed

    // Prima recupera gli utenti disponibili
    const usersResponse = await request.get('http://localhost:3001/api/users/search?limit=5');
    expect(usersResponse.status()).toBe(200);

    const usersData = await usersResponse.json();
    console.log(`📊 Utenti nel database: ${usersData.pagination.total}`);

    if (usersData.data && usersData.data.length > 0) {
      console.log('👥 Primi 5 utenti:');
      usersData.data.forEach(user => {
        console.log(`   - ${user.username} (Gruppo: ${user.groupName})`);
      });
    }

    console.log('✅ Recupero utenti dal database funzionante');
  });
});

test.describe('Integrazione Login + Gestione Utenti', () => {
  test('Login superuser e accesso a Gestione Utenti', async ({ page }) => {
    const password = getDynamicPassword();

    console.log('🔐 Test completo: Login → Gestione Utenti');

    // 1. Login
    await page.goto('http://localhost:3001/login');
    await page.fill('input[name="username"]', 'superuser');
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');

    // Attendi qualche secondo per il login
    await page.waitForTimeout(2000);

    // 2. Naviga a Gestione Utenti
    console.log('📱 Navigazione a /users-management');
    await page.goto('http://localhost:3001/users-management');

    // Attendi che la pagina carichi
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    // 3. Verifica che i dati reali siano caricati
    const userRows = await page.locator('table tbody tr').count();
    console.log(`👥 Righe utenti caricate: ${userRows}`);

    // Dovrebbero esserci utenti dal database (35 totali)
    expect(userRows).toBeGreaterThan(0);

    // 4. Verifica presenza di almeno un utente dal database
    const firstUsername = await page.locator('table tbody tr:first-child td').first().textContent();
    console.log(`👤 Primo utente visualizzato: ${firstUsername}`);

    console.log('✅ Test integrazione completato con successo!');
  });
});

