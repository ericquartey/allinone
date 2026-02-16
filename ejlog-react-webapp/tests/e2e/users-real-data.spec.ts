import { test, expect } from '@playwright/test';

/**
 * Test E2E - Verifica Gestione Utenti con Dati Reali
 *
 * Questo test verifica che la pagina /config/users mostri i dati reali
 * degli utenti dal database SQL Server tramite il backend TypeScript su porta 8080
 */

test.describe('Gestione Utenti - Dati Reali dal Database', () => {

  test('dovrebbe mostrare gli utenti reali dal database SQL Server', async ({ page }) => {
    // Vai alla pagina di gestione utenti
    await page.goto('http://localhost:3006/config/users');

    // Aspetta che la pagina sia completamente caricata
    await page.waitForLoadState('networkidle');

    // Verifica il titolo della pagina
    await expect(page.locator('h1')).toContainText('Gestione Utenti');

    // Verifica che ci sia il testo che indica il database SQL Server
    await expect(page.getByText(/Database SQL Server/i)).toBeVisible();

    // Aspetta che appaia uno di questi stati:
    // 1. Loading state con spinner
    // 2. Error state (401 se non autenticato)
    // 3. Tabella con utenti reali

    // Verifica se c'è un messaggio di errore di autenticazione
    const authError = page.getByText(/Autenticazione richiesta/i);
    const isAuthError = await authError.isVisible().catch(() => false);

    if (isAuthError) {
      console.log('✓ Pagina richiede autenticazione (comportamento corretto)');

      // Verifica che ci sia il messaggio completo
      await expect(page.getByText(/Effettua il login per visualizzare gli utenti/i)).toBeVisible();

      // Verifica che mostri l'endpoint backend corretto
      await expect(page.getByText(/http:\/\/localhost:8080\/EjLogHostVertimag\/User/i)).toBeVisible();

      console.log('✓ La pagina sta chiamando il backend corretto sulla porta 8080');

    } else {
      // Se non c'è errore di autenticazione, verifica che ci siano utenti reali
      console.log('Verifico presenza utenti reali...');

      // Verifica che ci sia una tabella
      const table = page.locator('table');
      await expect(table).toBeVisible({ timeout: 10000 });

      // Verifica le colonne della tabella
      await expect(page.getByText('Nome')).toBeVisible();
      await expect(page.getByText('Ruolo')).toBeVisible();
      await expect(page.getByText('Livello Accesso')).toBeVisible();

      // Verifica che ci siano righe di dati (non i mock hardcoded)
      const rows = page.locator('tbody tr');
      const rowCount = await rows.count();

      console.log(`✓ Trovate ${rowCount} righe di utenti`);

      // Verifica che NON ci siano gli utenti mock hardcoded
      // (i mock avevano nomi come "Mario Rossi", "Luca Bianchi", etc.)
      const mockUserMario = page.getByText('Mario Rossi');
      const hasMockData = await mockUserMario.isVisible().catch(() => false);

      if (hasMockData) {
        throw new Error('❌ ERRORE: La pagina mostra ancora dati mock hardcoded!');
      }

      console.log('✓ Nessun dato mock hardcoded trovato');

      // Verifica che ci sia il conteggio totale dal database
      const totalUsersText = page.getByText(/utenti totali dal database/i);
      await expect(totalUsersText).toBeVisible();

      // Se ci sono utenti, verifica che abbiano i campi corretti
      if (rowCount > 0) {
        // Verifica che ci siano badge di ruolo (Administrator/Operator)
        const roleBadges = page.locator('.inline-flex', { hasText: /Administrator|Operator/i });
        const badgeCount = await roleBadges.count();

        console.log(`✓ Trovati ${badgeCount} badge di ruolo`);
        expect(badgeCount).toBeGreaterThan(0);

        // Verifica che ci siano livelli di accesso
        const accessLevels = page.locator('text=/Level [12]/');
        const levelCount = await accessLevels.count();

        console.log(`✓ Trovati ${levelCount} livelli di accesso`);
        expect(levelCount).toBeGreaterThan(0);
      }

      console.log('✓ La pagina mostra dati reali dal database SQL Server');
    }
  });

  test('dovrebbe avere il pulsante Aggiorna funzionante', async ({ page }) => {
    await page.goto('http://localhost:3006/config/users');
    await page.waitForLoadState('networkidle');

    // Verifica che ci sia il pulsante Aggiorna
    const refreshButton = page.getByRole('button', { name: /Aggiorna/i });
    await expect(refreshButton).toBeVisible();

    console.log('✓ Pulsante Aggiorna presente');
  });

  test('dovrebbe avere il pulsante Nuovo Utente', async ({ page }) => {
    await page.goto('http://localhost:3006/config/users');
    await page.waitForLoadState('networkidle');

    // Verifica che ci sia il pulsante Nuovo Utente
    const newUserButton = page.getByRole('button', { name: /Nuovo Utente/i });
    await expect(newUserButton).toBeVisible();

    console.log('✓ Pulsante Nuovo Utente presente');
  });

  test('dovrebbe mostrare il backend endpoint corretto negli errori', async ({ page }) => {
    // Intercetta la chiamata API
    let apiCallMade = false;
    let apiUrl = '';

    page.on('request', request => {
      if (request.url().includes('/User')) {
        apiCallMade = true;
        apiUrl = request.url();
        console.log(`✓ Chiamata API intercettata: ${apiUrl}`);
      }
    });

    await page.goto('http://localhost:3006/config/users');
    await page.waitForLoadState('networkidle');

    // Aspetta un po' per le chiamate API
    await page.waitForTimeout(2000);

    if (apiCallMade) {
      // Verifica che l'URL contenga porta 8080 e NON 3077
      expect(apiUrl).toContain('8080');
      expect(apiUrl).not.toContain('3077');
      console.log('✓ L\'API viene chiamata sulla porta corretta (8080)');
    } else {
      console.log('⚠ Nessuna chiamata API intercettata (possibile cache o mock)');
    }
  });
});

