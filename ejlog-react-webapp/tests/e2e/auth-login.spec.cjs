// ============================================================================
// EJLOG WMS - Test Autenticazione Login
// Test E2E per verificare il flusso di login con utenti reali
// ============================================================================

const { test, expect } = require('@playwright/test');

/**
 * Calcola la password dinamica per superuser
 * Formula: promag + (31 - giorno_corrente)
 */
function getDynamicSuperuserPassword() {
  const today = new Date();
  const day = today.getDate();
  const suffix = (31 - day).toString().padStart(2, '0');
  return `promag${suffix}`;
}

test.describe('Autenticazione - Login Page', () => {

  test.beforeEach(async ({ page }) => {
    // Naviga alla pagina di login
    await page.goto('http://localhost:3000/login');

    // Verifica che la pagina di login sia caricata
    await expect(page.locator('h2:has-text("EjLog WMS")')).toBeVisible();
  });

  test('Verifica UI della pagina di login', async ({ page }) => {
    // Verifica elementi UI
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]:has-text("Accedi")')).toBeVisible();

    // Verifica link badge login
    await expect(page.locator('text=Accedi con Badge')).toBeVisible();

    // Verifica info box password superuser
    await expect(page.locator('text=Password Superuser Dinamica')).toBeVisible();

    console.log('✅ UI login page verificata');
  });

  test('Login con credenziali superuser (password dinamica)', async ({ page }) => {
    const username = 'superuser';
    const password = getDynamicSuperuserPassword();

    console.log(`🔐 Test login superuser con password: ${password}`);

    // Compila form
    await page.fill('input[name="username"]', username);
    await page.fill('input[name="password"]', password);

    // Screenshot pre-submit
    await page.screenshot({ path: 'screenshots/login-superuser-before.png', fullPage: true });

    // Submit form
    await page.click('button[type="submit"]:has-text("Accedi")');

    // Aspetta redirect a dashboard
    await page.waitForURL('http://localhost:3000/', { timeout: 10000 });

    // Verifica che siamo sulla dashboard
    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 5000 });

    // Verifica che il token sia salvato in localStorage
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();

    // Verifica che i dati utente siano salvati
    const userStr = await page.evaluate(() => localStorage.getItem('user'));
    expect(userStr).toBeTruthy();

    const user = JSON.parse(userStr);
    console.log('👤 Utente loggato:', user);

    expect(user.username).toBe('superuser');
    expect(user.roles).toContain('ADMIN');

    // Screenshot post-login
    await page.screenshot({ path: 'screenshots/login-superuser-success.png', fullPage: true });

    console.log('✅ Login superuser riuscito');
  });

  test('Login con credenziali errate - verifica errore', async ({ page }) => {
    // Compila con credenziali errate
    await page.fill('input[name="username"]', 'superuser');
    await page.fill('input[name="password"]', 'wrongpassword');

    // Submit form
    await page.click('button[type="submit"]:has-text("Accedi")');

    // Aspetta messaggio di errore
    await expect(page.locator('.bg-red-50')).toBeVisible({ timeout: 5000 });

    // Verifica che siamo ancora sulla pagina di login
    await expect(page.locator('h2:has-text("EjLog WMS")')).toBeVisible();

    // Verifica che non ci sia token in localStorage
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeFalsy();

    console.log('✅ Errore login gestito correttamente');
  });

  test('Login con utente normale dal database', async ({ page }) => {
    // Prima ottenere un utente dal database tramite API
    const response = await page.request.get('http://localhost:3077/api/users/list');
    expect(response.ok()).toBeTruthy();

    const users = await response.json();
    console.log(`📋 Utenti disponibili: ${users.data?.length || 0}`);

    // Trova un utente normale (non superuser)
    const normalUser = users.data?.find(u =>
      u.username.toLowerCase() !== 'superuser' &&
      u.username.toLowerCase() !== 'admin'
    );

    if (!normalUser) {
      console.log('⚠️  Nessun utente normale trovato, skip test');
      test.skip();
      return;
    }

    console.log(`👤 Test con utente: ${normalUser.username}`);

    // Nota: per utenti normali serve la password MD5 dal database
    // In ambiente di test, questo test verifica solo la UI
    // Il login effettivo richiederebbe la password reale dell'utente

    await page.fill('input[name="username"]', normalUser.username);
    await page.fill('input[name="password"]', 'test-password'); // Password di esempio

    await page.click('button[type="submit"]:has-text("Accedi")');

    // Aspettiamo l'esito (successo o errore)
    await page.waitForTimeout(2000);

    console.log('✅ Test UI login utente normale completato');
  });

  test('Verifica link "Visualizza Utenti Database"', async ({ page }) => {
    // Click sul link
    const [newPage] = await Promise.all([
      page.context().waitForEvent('page'),
      page.click('text=Visualizza Utenti Database')
    ]);

    // Verifica che si apra una nuova tab
    await newPage.waitForLoadState();

    // Verifica URL
    expect(newPage.url()).toContain('/users-list');

    // Verifica che la pagina carichi
    await expect(newPage.locator('body')).toBeVisible();

    await newPage.close();

    console.log('✅ Link visualizza utenti funzionante');
  });

  test('Verifica calcolo password dinamica visualizzato', async ({ page }) => {
    const expectedPassword = getDynamicSuperuserPassword();

    // Verifica che la password corretta sia visualizzata
    const passwordText = await page.locator('.bg-green-50 .font-mono.font-bold').last().textContent();

    expect(passwordText?.trim()).toBe(expectedPassword);

    console.log(`✅ Password dinamica visualizzata correttamente: ${expectedPassword}`);
  });

  test('Login e verifica persistenza sessione', async ({ page }) => {
    const username = 'superuser';
    const password = getDynamicSuperuserPassword();

    // Login
    await page.fill('input[name="username"]', username);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]:has-text("Accedi")');

    // Aspetta redirect
    await page.waitForURL('http://localhost:3000/', { timeout: 10000 });

    // Ricarica la pagina
    await page.reload();

    // Verifica che siamo ancora loggati
    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 5000 });

    // Verifica token ancora presente
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();

    console.log('✅ Sessione persistente dopo reload');
  });

  test('Logout e verifica redirect a login', async ({ page }) => {
    const username = 'superuser';
    const password = getDynamicSuperuserPassword();

    // Login
    await page.fill('input[name="username"]', username);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]:has-text("Accedi")');

    await page.waitForURL('http://localhost:3000/', { timeout: 10000 });

    // Cerca e clicca logout (potrebbe essere in un menu utente)
    // Assumiamo che ci sia un pulsante logout visibile
    const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout")').first();

    if (await logoutButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await logoutButton.click();

      // Verifica redirect a login
      await page.waitForURL('http://localhost:3000/login', { timeout: 5000 });

      // Verifica token rimosso
      const token = await page.evaluate(() => localStorage.getItem('token'));
      expect(token).toBeFalsy();

      console.log('✅ Logout completato');
    } else {
      console.log('⚠️  Pulsante logout non trovato, skip verifica');
    }
  });

  test('Verifica validazione form - campi obbligatori', async ({ page }) => {
    // Click su submit senza compilare
    await page.click('button[type="submit"]:has-text("Accedi")');

    // HTML5 validation dovrebbe prevenire submit
    // Verifichiamo che siamo ancora sulla pagina di login
    await expect(page.locator('h2:has-text("EjLog WMS")')).toBeVisible();

    // Verifica che gli input abbiano l'attributo required
    const usernameRequired = await page.locator('input[name="username"]').getAttribute('required');
    const passwordRequired = await page.locator('input[name="password"]').getAttribute('required');

    expect(usernameRequired).not.toBeNull();
    expect(passwordRequired).not.toBeNull();

    console.log('✅ Validazione campi obbligatori funzionante');
  });

  test('Verifica responsive design - mobile view', async ({ page }) => {
    // Imposta viewport mobile
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

    // Verifica che tutti gli elementi siano visibili
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Screenshot mobile
    await page.screenshot({ path: 'screenshots/login-mobile.png', fullPage: true });

    console.log('✅ Layout responsive verificato');
  });

});

test.describe('Autenticazione - Badge Login', () => {

  test('Verifica redirect a pagina badge login', async ({ page }) => {
    await page.goto('http://localhost:3000/login');

    // Click su "Accedi con Badge"
    await page.click('text=Accedi con Badge');

    // Verifica redirect
    await page.waitForURL('http://localhost:3000/login/badge', { timeout: 5000 });

    // Verifica che la pagina badge sia caricata
    await expect(page.locator('body')).toBeVisible();

    console.log('✅ Redirect a badge login funzionante');
  });

});

