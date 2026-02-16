import { test, expect } from '@playwright/test';

/**
 * Test E2E - Login e Verifica Utenti Reali
 *
 * Questo test fa il login con le credenziali mock e poi verifica
 * che si vedano gli utenti reali dal database
 */

test.describe('Login e Gestione Utenti', () => {

  test('dovrebbe fare login e vedere gli utenti reali dal database', async ({ page }) => {
    console.log('🔐 Step 1: Navigazione e Login...');

    // Vai alla homepage
    await page.goto('http://localhost:3006/');
    await page.waitForLoadState('networkidle');

    // Aspetta che la pagina sia caricata
    await page.waitForTimeout(2000);

    // Verifica se c'è già un utente loggato (controlla se c'è il menu utente)
    const userMenu = page.getByText(/Utente|Operatore|Administrator/i).first();
    const isAlreadyLoggedIn = await userMenu.isVisible().catch(() => false);

    if (isAlreadyLoggedIn) {
      console.log('✓ Utente già loggato, procedo direttamente alla pagina utenti');
    } else {
      console.log('⚠️ Utente non loggato, cerco il form di login...');

      // Cerca il pulsante di login o il link per andare alla pagina di login
      const loginLink = page.getByRole('link', { name: /login|accedi/i });
      const hasLoginLink = await loginLink.isVisible().catch(() => false);

      if (hasLoginLink) {
        await loginLink.click();
        await page.waitForTimeout(1000);
      }

      // Cerca i campi del form di login
      const usernameField = page.locator('input[name="username"], input[type="text"], input[placeholder*="utente" i], input[placeholder*="username" i]').first();
      const passwordField = page.locator('input[name="password"], input[type="password"]').first();
      const loginButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Accedi")').first();

      const hasLoginForm = await usernameField.isVisible().catch(() => false);

      if (hasLoginForm) {
        console.log('✓ Form di login trovato, eseguo il login con admin/promag...');

        await usernameField.fill('admin');
        await passwordField.fill('promag');
        await loginButton.click();

        // Aspetta che il login sia completato
        await page.waitForTimeout(3000);

        console.log('✓ Login completato, URL corrente:', page.url());
      } else {
        console.log('⚠️ Form di login non trovato, probabilmente l\'app usa auto-login mock');
      }
    }

    console.log('\n📋 Step 2: Navigazione alla pagina utenti...');

    // Vai direttamente alla pagina utenti
    await page.goto('http://localhost:3006/config/users');
    await page.waitForLoadState('networkidle');

    // Aspetta il caricamento dei dati
    await page.waitForTimeout(5000);

    console.log('\n🔍 Step 3: Verifica contenuto pagina...');

    // Verifica il titolo
    const heading = page.locator('h1:has-text("Gestione Utenti")');
    await expect(heading).toBeVisible({ timeout: 10000 });
    console.log('✓ Titolo "Gestione Utenti" trovato');

    // Verifica se c'è ancora un errore di autenticazione
    const authError = page.getByText(/Autenticazione richiesta|No authentication token|Impossibile caricare/i);
    const hasAuthError = await authError.isVisible().catch(() => false);

    if (hasAuthError) {
      console.log('❌ ERRORE: Ancora problemi di autenticazione!');

      // Cattura lo stato del localStorage
      const authState = await page.evaluate(() => {
        const persistAuth = localStorage.getItem('persist:auth');
        const persistRoot = localStorage.getItem('persist:root');
        return {
          persistAuth: persistAuth ? JSON.parse(persistAuth) : null,
          persistRoot: persistRoot ? JSON.parse(persistRoot) : null,
        };
      });

      console.log('📦 localStorage state:', JSON.stringify(authState, null, 2));

      // Cattura screenshot per debug
      await page.screenshot({
        path: 'test-results/users-auth-error.png',
        fullPage: true
      });

      throw new Error('Login fallito o token non salvato correttamente');
    }

    console.log('✓ Nessun errore di autenticazione');

    // Verifica che ci sia una tabella con utenti
    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 10000 });
    console.log('✓ Tabella utenti trovata');

    // Conta le righe
    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();

    console.log(`\n📊 Numero di utenti trovati: ${rowCount}`);

    // Verifica che ci siano utenti (dovrebbero essere 35 dal database)
    expect(rowCount).toBeGreaterThan(0);

    if (rowCount === 5) {
      console.log('⚠️ ATTENZIONE: Solo 5 utenti - potrebbero essere ancora dati mock!');

      // Verifica se ci sono nomi mock
      const pageContent = await page.content();
      if (pageContent.includes('Mario Rossi') || pageContent.includes('Luca Bianchi')) {
        await page.screenshot({
          path: 'test-results/users-still-mock.png',
          fullPage: true
        });
        throw new Error('❌ La pagina mostra ancora dati MOCK invece dei dati reali!');
      }
    }

    // Verifica che ci siano badge di ruolo reali
    const adminBadges = page.locator('text=/Administrator/i');
    const operatorBadges = page.locator('text=/Operator/i');

    const adminCount = await adminBadges.count();
    const operatorCount = await operatorBadges.count();

    console.log(`👥 Ruoli trovati: ${adminCount} Administrator, ${operatorCount} Operator`);

    // Verifica che ci siano ruoli
    expect(adminCount + operatorCount).toBeGreaterThan(0);

    // Verifica il conteggio totale
    const totalCountText = page.getByText(/\d+ utenti totali dal database/i);
    const hasTotalCount = await totalCountText.isVisible().catch(() => false);

    if (hasTotalCount) {
      const countText = await totalCountText.textContent();
      console.log(`✓ ${countText}`);
    }

    // Cattura screenshot finale
    await page.screenshot({
      path: 'test-results/users-real-data-success.png',
      fullPage: true
    });

    console.log('\n✅ TEST COMPLETATO CON SUCCESSO!');
    console.log(`✅ Trovati ${rowCount} utenti reali dal database SQL Server`);
  });

  test('dovrebbe intercettare le chiamate API e verificare che vadano a porta 8080', async ({ page }) => {
    let apiCalls: Array<{ url: string; status: number }> = [];

    // Intercetta tutte le richieste
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/User') || url.includes('/user')) {
        console.log(`📡 API Request: ${request.method()} ${url}`);
      }
    });

    page.on('response', async response => {
      const url = response.url();
      if (url.includes('/User') || url.includes('/user')) {
        console.log(`📥 API Response: ${response.status()} ${url}`);
        apiCalls.push({ url, status: response.status() });
      }
    });

    // Vai alla pagina utenti
    await page.goto('http://localhost:3006/config/users');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log(`\n📊 Totale chiamate API intercettate: ${apiCalls.length}`);
    apiCalls.forEach((call, i) => {
      console.log(`  ${i + 1}. ${call.status} ${call.url}`);
    });

    // Verifica che ci siano chiamate API
    expect(apiCalls.length).toBeGreaterThan(0);

    // Verifica che le chiamate vadano alla porta 8080
    const has8080Call = apiCalls.some(call =>
      call.url.includes('8080') && call.url.includes('/EjLogHostVertimag/User')
    );

    if (!has8080Call) {
      console.log('⚠️ ATTENZIONE: Nessuna chiamata alla porta 8080 trovata!');
      console.log('Le chiamate stanno andando a:', apiCalls.map(c => c.url));
    }

    expect(has8080Call).toBeTruthy();
  });
});
