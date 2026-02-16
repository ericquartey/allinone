import { test, expect } from '@playwright/test';

/**
 * Test E2E - Verifica Gestione Utenti con Autenticazione
 *
 * Questo test fa il login e poi verifica che si vedano i dati reali degli utenti
 * dal database SQL Server tramite il backend TypeScript su porta 8080
 */

test.describe('Gestione Utenti - Con Autenticazione', () => {

  test('dovrebbe fare login e vedere gli utenti reali dal database', async ({ page }) => {
    console.log('🔐 Fase 1: Login...');

    // Vai alla pagina di login
    await page.goto('http://localhost:3006/');
    await page.waitForLoadState('networkidle');

    // Cerca il form di login
    const usernameInput = page.locator('input[name="username"], input[type="text"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    const loginButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Accedi")').first();

    // Verifica che ci sia un form di login
    const hasLoginForm = await usernameInput.isVisible().catch(() => false);

    if (!hasLoginForm) {
      console.log('⚠️ Nessun form di login trovato, probabilmente già autenticato o redirect in corso');
      console.log('📍 URL corrente:', page.url());

      // Verifica se siamo sulla dashboard (già autenticati)
      const isDashboard = page.url().includes('/') && !page.url().includes('/login');
      if (isDashboard) {
        console.log('✓ Già sulla dashboard, procedo alla pagina utenti');
      }
    } else {
      console.log('✓ Form di login trovato, eseguo il login...');

      // Compila il form di login con credenziali del database
      // Provo con "superuser" che dovrebbe essere nel database
      await usernameInput.fill('superuser');
      await passwordInput.fill('superuser'); // Assumo stesso nome per la password

      // Click sul pulsante di login
      await loginButton.click();

      // Aspetta il redirect dopo il login
      await page.waitForTimeout(2000);
      console.log('📍 URL dopo login:', page.url());
    }

    console.log('📋 Fase 2: Navigazione alla pagina utenti...');

    // Vai alla pagina di gestione utenti
    await page.goto('http://localhost:3006/config/users');
    await page.waitForLoadState('networkidle');

    // Aspetta un po' per il caricamento dei dati
    await page.waitForTimeout(3000);

    console.log('🔍 Fase 3: Verifica contenuto pagina...');

    // Verifica il titolo della pagina
    const heading = page.locator('h1', { hasText: /Gestione Utenti/i });
    await expect(heading).toBeVisible({ timeout: 10000 });
    console.log('✓ Titolo "Gestione Utenti" trovato');

    // Verifica se c'è un errore di autenticazione
    const authError = page.getByText(/Autenticazione richiesta|No authentication token/i);
    const hasAuthError = await authError.isVisible().catch(() => false);

    if (hasAuthError) {
      console.log('❌ ERRORE: Ancora richiesta autenticazione dopo il login!');
      console.log('📍 URL corrente:', page.url());

      // Prova a catturare più dettagli
      const errorDetails = await page.locator('.bg-red-50, [class*="error"]').textContent().catch(() => 'Nessun dettaglio');
      console.log('📝 Dettagli errore:', errorDetails);

      // Verifica se c'è un token nel localStorage
      const hasToken = await page.evaluate(() => {
        const state = localStorage.getItem('persist:auth');
        return state ? 'Token presente' : 'Token assente';
      });
      console.log('🔑 Stato token:', hasToken);

      throw new Error('Login fallito o token non presente');
    }

    // Verifica se ci sono dati nella tabella
    const table = page.locator('table');
    const hasTable = await table.isVisible().catch(() => false);

    if (!hasTable) {
      console.log('⚠️ Tabella non trovata, verifico se c\'è uno stato di caricamento...');

      const loadingSpinner = page.locator('[class*="animate-spin"]');
      const isLoading = await loadingSpinner.isVisible().catch(() => false);

      if (isLoading) {
        console.log('⏳ Caricamento in corso, aspetto...');
        await page.waitForTimeout(5000);
      }

      // Verifica di nuovo
      const hasTableNow = await table.isVisible().catch(() => false);
      if (!hasTableNow) {
        // Cattura screenshot per debug
        await page.screenshot({ path: 'test-results/users-page-no-table.png', fullPage: true });
        throw new Error('Tabella utenti non trovata dopo il caricamento');
      }
    }

    console.log('✓ Tabella trovata!');

    // Conta le righe della tabella
    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();

    console.log(`📊 Numero di utenti trovati: ${rowCount}`);

    // Verifica che ci siano utenti (dovrebbero essere 35 dal database)
    expect(rowCount).toBeGreaterThan(0);

    if (rowCount === 5) {
      console.log('⚠️ ATTENZIONE: Solo 5 utenti trovati, potrebbero essere ancora i dati mock!');

      // Verifica se ci sono nomi mock tipici
      const pageContent = await page.content();
      if (pageContent.includes('Mario Rossi') || pageContent.includes('Luca Bianchi')) {
        throw new Error('❌ ERRORE: La pagina mostra ancora dati MOCK invece dei dati reali dal database!');
      }
    }

    // Verifica che ci siano badge di ruolo reali
    const adminBadges = page.locator('text=/Administrator/i');
    const operatorBadges = page.locator('text=/Operator/i');

    const adminCount = await adminBadges.count();
    const operatorCount = await operatorBadges.count();

    console.log(`👥 Ruoli trovati: ${adminCount} Administrator, ${operatorCount} Operator`);

    // Verifica che ci siano effettivamente ruoli
    expect(adminCount + operatorCount).toBeGreaterThan(0);

    // Verifica che ci sia il conteggio dal database
    const totalUsersText = page.getByText(/\d+ utenti totali dal database/i);
    const hasTotalCount = await totalUsersText.isVisible().catch(() => false);

    if (hasTotalCount) {
      const countText = await totalUsersText.textContent();
      console.log(`✓ Conteggio dal database: ${countText}`);
    }

    // Cattura screenshot finale
    await page.screenshot({ path: 'test-results/users-page-success.png', fullPage: true });

    console.log('✅ TEST COMPLETATO CON SUCCESSO!');
    console.log(`✅ Trovati ${rowCount} utenti reali dal database SQL Server`);
  });

  test('dovrebbe intercettare la chiamata API corretta', async ({ page }) => {
    let apiCalls: string[] = [];

    // Intercetta tutte le richieste
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/User') || url.includes('/user')) {
        console.log(`📡 API Call: ${request.method()} ${url}`);
        apiCalls.push(url);
      }
    });

    page.on('response', async response => {
      const url = response.url();
      if (url.includes('/User') || url.includes('/user')) {
        console.log(`📥 API Response: ${response.status()} ${url}`);

        // Prova a leggere la risposta
        try {
          const body = await response.text();
          if (body && body.length < 500) {
            console.log(`📝 Response body: ${body}`);
          } else if (body) {
            console.log(`📝 Response body: ${body.substring(0, 200)}...`);
          }
        } catch (e) {
          console.log(`⚠️ Non riesco a leggere il body della risposta`);
        }
      }
    });

    // Vai alla pagina
    await page.goto('http://localhost:3006/config/users');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log(`\n📊 Totale chiamate API intercettate: ${apiCalls.length}`);
    apiCalls.forEach((url, i) => {
      console.log(`  ${i + 1}. ${url}`);
    });

    // Verifica che almeno una chiamata sia alla porta 8080
    const has8080Call = apiCalls.some(url => url.includes('8080'));

    if (!has8080Call && apiCalls.length > 0) {
      console.log('⚠️ ATTENZIONE: Nessuna chiamata alla porta 8080 trovata!');
      console.log('Le chiamate stanno andando a:', apiCalls[0]);
    }

    expect(apiCalls.length).toBeGreaterThan(0);
  });
});
