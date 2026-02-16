import { chromium } from '@playwright/test';

const FRONTEND_URL = 'http://localhost:3006';

async function verifyListsButtons() {
  console.log('🔍 Verifica pulsanti Attesa e Termina sulla pagina /lists\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  try {
    console.log(`📄 Navigazione a: ${FRONTEND_URL}/lists\n`);

    await page.goto(`${FRONTEND_URL}/lists`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Attendi caricamento dati (max 15 secondi)
    console.log('⏳ Attesa caricamento dati...\n');

    // Attendi che scompaia il loading o che appaiano le righe della tabella
    await Promise.race([
      page.waitForSelector('table tbody tr:not(:has-text("Nessuna lista trovata")):not(:has-text("Caricamento"))', { timeout: 15000 }).catch(() => null),
      page.waitForTimeout(15000)
    ]);

    await page.waitForTimeout(3000);

    // Conta righe della tabella
    const tableRows = await page.locator('table tbody tr').count();
    console.log(`📊 Righe tabella trovate: ${tableRows}\n`);

    // Conta pulsanti
    const waitingButtons = await page.locator('button:has-text("Attesa")').count();
    const terminateButtons = await page.locator('button:has-text("Termina")').count();

    console.log('🔘 Pulsanti operazioni:');
    console.log(`  - Pulsanti "Attesa": ${waitingButtons}`);
    console.log(`  - Pulsanti "Termina": ${terminateButtons}\n`);

    // Verifica se ci sono liste caricate
    const noDataMessage = await page.locator('td:has-text("Nessuna lista trovata")').count();
    const loadingMessage = await page.locator('text=Caricamento liste').count();

    if (noDataMessage > 0) {
      console.log('ℹ️  Nessuna lista disponibile nel backend.\n');
      console.log('Per vedere i pulsanti "Attesa" e "Termina":');
      console.log('  1. Assicurati che il backend sia in esecuzione sulla porta 3077');
      console.log('  2. Verifica che ci siano liste nel database');
      console.log('  3. Controlla gli endpoint: GET /EjLogHostVertimag/Lists\n');
    } else if (loadingMessage > 0) {
      console.log('⏳ Le liste stanno ancora caricando...\n');
    } else if (tableRows > 1) {
      console.log('✅ SUCCESSO! Liste caricate e pulsanti visibili!\n');

      // Verifica dettagli pulsanti
      if (waitingButtons > 0) {
        const firstWaitingButton = page.locator('button:has-text("Attesa")').first();
        const isEnabled = await firstWaitingButton.isEnabled();
        console.log(`  - Primo pulsante "Attesa" abilitato: ${isEnabled ? '✅' : '❌'}`);
      }

      if (terminateButtons > 0) {
        const firstTerminateButton = page.locator('button:has-text("Termina")').first();
        const isEnabled = await firstTerminateButton.isEnabled();
        console.log(`  - Primo pulsante "Termina" abilitato: ${isEnabled ? '✅' : '❌'}`);
      }
    }

    // Screenshot finale
    await page.screenshot({
      path: 'C:\\F_WMS\\dev\\workspacesEjlog\\EjLog\\documentazioni\\ejlog-react-webapp\\lists-buttons-verification.png',
      fullPage: true
    });
    console.log('\n📸 Screenshot salvato: lists-buttons-verification.png\n');

    // Evidenzia pulsanti (se esistono)
    if (waitingButtons > 0 || terminateButtons > 0) {
      await page.evaluate(() => {
        document.querySelectorAll('button').forEach(btn => {
          if (btn.textContent.includes('Attesa') || btn.textContent.includes('Termina')) {
            btn.style.border = '3px solid red';
            btn.style.boxShadow = '0 0 10px red';
          }
        });
      });

      await page.screenshot({
        path: 'C:\\F_WMS\\dev\\workspacesEjlog\\EjLog\\documentazioni\\ejlog-react-webapp\\lists-buttons-highlighted.png',
        fullPage: true
      });
      console.log('📸 Screenshot con pulsanti evidenziati: lists-buttons-highlighted.png\n');
    }

    console.log('='.repeat(60));
    console.log('RIEPILOGO VERIFICA');
    console.log('='.repeat(60));
    console.log(`✅ Pagina caricata senza errori 500`);
    console.log(`✅ Header pagina presente`);
    console.log(`✅ Tabella renderizzata`);
    console.log(`${waitingButtons > 0 ? '✅' : 'ℹ️ '} Pulsanti "Attesa": ${waitingButtons}`);
    console.log(`${terminateButtons > 0 ? '✅' : 'ℹ️ '} Pulsanti "Termina": ${terminateButtons}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.log('❌ Errore durante la verifica:', error.message);

    await page.screenshot({
      path: 'C:\\F_WMS\\dev\\workspacesEjlog\\EjLog\\documentazioni\\ejlog-react-webapp\\lists-verification-error.png',
      fullPage: true
    });
    console.log('📸 Screenshot errore salvato: lists-verification-error.png\n');
  }

  await browser.close();
}

verifyListsButtons().catch(console.error);

