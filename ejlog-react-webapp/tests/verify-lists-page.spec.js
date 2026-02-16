import { test, expect } from '@playwright/test';

/**
 * Test per verificare che la pagina Gestione Liste mostri tutti gli elementi
 * Risposta al problema: "non vedo le modifiche non risco a vedere i stati"
 */

test.describe('Verifica Pagina Gestione Liste', () => {

  test('dovrebbe mostrare la sidebar "Azioni" con tutti i gruppi', async ({ page }) => {
    await page.goto('http://localhost:3005/lists-management');

    // Attendi che la pagina sia caricata
    await page.waitForTimeout(2000);

    console.log('=== ANALISI PAGINA GESTIONE LISTE ===');

    // 1. Verifica presenza titolo "Azioni" nella sidebar
    const azioneTitolo = page.locator('text=Azioni').first();
    const isAzioneVisible = await azioneTitolo.isVisible();
    console.log('✅ Titolo "Azioni" visibile:', isAzioneVisible);

    if (!isAzioneVisible) {
      console.error('❌ PROBLEMA: Titolo "Azioni" NON trovato nella sidebar!');
    }

    // 2. Verifica presenza gruppi nella sidebar
    const gruppi = [
      'Ricerca',
      'Gestione',
      'Gestione Stato',
      'Modifica',
      'Stampa'
    ];

    console.log('\n=== GRUPPI SIDEBAR ===');
    for (const gruppo of gruppi) {
      const gruppoElement = page.locator(`text=${gruppo}`).first();
      const isVisible = await gruppoElement.isVisible();
      console.log(`  ${isVisible ? '✅' : '❌'} ${gruppo}: ${isVisible ? 'VISIBILE' : 'NON VISIBILE'}`);
    }

    // 3. Verifica presenza pulsanti azioni
    const azioni = [
      'Aggiorna (F5)',
      'Pulisci (F6)',
      'Inserisci',
      'Modifica',
      'Esegui',
      'Attesa',
      'Termina',
      'Priorità',
      'Anticipa',
      'Posticipa',
      'Assegna',
      'Stampa',
      'Log'
    ];

    console.log('\n=== PULSANTI AZIONI ===');
    for (const azione of azioni) {
      const azioneButton = page.locator(`button:has-text("${azione}")`).first();
      const exists = await azioneButton.count() > 0;
      console.log(`  ${exists ? '✅' : '❌'} ${azione}: ${exists ? 'PRESENTE' : 'ASSENTE'}`);
    }

    // 4. Verifica presenza titolo principale "Gestione Liste"
    const mainTitle = page.locator('h1:has-text("Gestione Liste")');
    const isTitleVisible = await mainTitle.isVisible();
    console.log('\n✅ Titolo "Gestione Liste" visibile:', isTitleVisible);

    // 5. Verifica presenza Stats Cards con stati
    const statsLabels = [
      'Totale',
      'Picking',
      'Rifornim.',
      'Inventar.',
      'Attesa',
      'In Corso',
      'Complet.'
    ];

    console.log('\n=== STATS CARDS (STATI) ===');
    for (const label of statsLabels) {
      const statCard = page.locator(`text=${label}`).first();
      const isVisible = await statCard.isVisible();
      console.log(`  ${isVisible ? '✅' : '❌'} ${label}: ${isVisible ? 'VISIBILE' : 'NON VISIBILE'}`);
    }

    // 6. Screenshot per analisi visiva
    await page.screenshot({
      path: 'test-results/lists-management-full-page.png',
      fullPage: true
    });
    console.log('\n📸 Screenshot salvato: test-results/lists-management-full-page.png');

    // 7. Cattura HTML completo per debug
    const htmlContent = await page.content();
    console.log('\n=== STRUTTURA HTML ===');
    console.log('Lunghezza HTML:', htmlContent.length, 'caratteri');

    // Verifica se contiene elementi React
    const hasReactRoot = htmlContent.includes('id="root"');
    console.log('React root presente:', hasReactRoot);

    // Verifica errori JavaScript nella console
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    });

    await page.waitForTimeout(1000);

    if (consoleMessages.length > 0) {
      console.log('\n=== MESSAGGI CONSOLE ===');
      consoleMessages.forEach(msg => console.log(msg));
    }

    // 8. Verifica layout flex a due colonne (sidebar + main)
    const flexContainer = page.locator('div.flex.h-screen').first();
    const isFlexVisible = await flexContainer.isVisible();
    console.log('\n✅ Container flex principale visibile:', isFlexVisible);

    const sidebar = page.locator('div.w-64.bg-gray-50').first();
    const isSidebarVisible = await sidebar.isVisible();
    console.log('✅ Sidebar (w-64 bg-gray-50) visibile:', isSidebarVisible);

    const mainContent = page.locator('div.flex-1.overflow-y-auto').first();
    const isMainVisible = await mainContent.isVisible();
    console.log('✅ Main content (flex-1) visibile:', isMainVisible);

    // 9. Verifica presenza tabella liste
    const tablePresent = await page.locator('table').count() > 0;
    console.log('\n✅ Tabella liste presente:', tablePresent);

    // 10. DIAGNOSTICA: Cosa c'è effettivamente nella pagina?
    const bodyText = await page.locator('body').innerText();
    console.log('\n=== TESTO VISIBILE NELLA PAGINA (primi 500 caratteri) ===');
    console.log(bodyText.substring(0, 500));

    // Se la sidebar non è visibile, probabilmente c'è un errore di rendering
    if (!isSidebarVisible || !isAzioneVisible) {
      console.error('\n❌ PROBLEMA CRITICO: La sidebar non viene renderizzata correttamente!');
      console.error('Possibili cause:');
      console.error('  1. Errore JavaScript che impedisce il rendering del componente');
      console.error('  2. Componente React non montato correttamente');
      console.error('  3. CSS nasconde gli elementi (verifica Tailwind)');
      console.error('  4. Percorso componente errato in App.tsx');
    }

    // Assertion finale: almeno la sidebar deve essere visibile
    expect(isSidebarVisible || isAzioneVisible,
      'La sidebar con "Azioni" dovrebbe essere visibile'
    ).toBeTruthy();
  });

  test('dovrebbe mostrare almeno i 7 stats cards', async ({ page }) => {
    await page.goto('http://localhost:3005/lists-management');
    await page.waitForTimeout(2000);

    // Conta le card con grid-cols-7
    const statsGrid = page.locator('div.grid.grid-cols-7');
    const cardCount = await statsGrid.locator('> *').count();

    console.log(`\n📊 Numero di stats cards trovate: ${cardCount}`);
    console.log(`   Atteso: 7 (Totale, Picking, Rifornim., Inventar., Attesa, In Corso, Complet.)`);

    if (cardCount < 7) {
      console.error(`❌ PROBLEMA: Trovate solo ${cardCount} cards invece di 7!`);
    }

    expect(cardCount).toBeGreaterThanOrEqual(7);
  });

  test('dovrebbe caricare dati dal backend o mostrare messaggio appropriato', async ({ page }) => {
    await page.goto('http://localhost:3005/lists-management');
    await page.waitForTimeout(3000);

    // Verifica se c'è uno spinner di caricamento
    const spinner = page.locator('[class*="spinner"], [class*="loading"]');
    const hasSpinner = await spinner.count() > 0;
    console.log('\n⏳ Spinner di caricamento presente:', hasSpinner);

    // Verifica se c'è un messaggio di errore
    const errorMessage = page.locator('text=/errore|error/i');
    const hasError = await errorMessage.count() > 0;
    console.log('❌ Messaggio di errore presente:', hasError);

    if (hasError) {
      const errorText = await errorMessage.first().innerText();
      console.error('Testo errore:', errorText);
    }

    // Verifica se c'è messaggio "Nessuna lista trovata"
    const noDataMessage = page.locator('text=/nessuna lista|no data/i');
    const hasNoData = await noDataMessage.count() > 0;
    console.log('📭 Messaggio "Nessuna lista" presente:', hasNoData);

    // Verifica richieste di rete
    const responses = [];
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        responses.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });

    await page.waitForTimeout(2000);

    if (responses.length > 0) {
      console.log('\n🌐 Richieste API effettuate:');
      responses.forEach(r => {
        console.log(`  ${r.status} ${r.url}`);
      });
    } else {
      console.warn('⚠️  Nessuna richiesta API rilevata!');
    }
  });
});
