// LOCATIONS SUCCESS TEST - Test definitivo con server fresco su porta 3006
import { chromium } from '@playwright/test';

(async () => {
  console.log('\n🎯 LOCATIONS SUCCESS TEST - Server fresco su porta 3006\n');

  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized']
  });

  const context = await browser.newContext({
    viewport: null,
    ignoreHTTPSErrors: true
  });

  const page = await context.newPage();

  // Monitor API requests
  const apiRequests = [];
  page.on('request', request => {
    const url = request.url();
    if (url.includes('machine') || url.includes('EjLogHostVertimag')) {
      apiRequests.push({
        method: request.method(),
        url: url
      });
      console.log(`📡 API REQUEST: ${request.method()} ${url}`);
    }
  });

  page.on('response', async response => {
    const url = response.url();
    const status = response.status();

    if (url.includes('machine') || url.includes('EjLogHostVertimag')) {
      console.log(`📥 API RESPONSE: ${status} ${url}`);

      if (status === 200) {
        try {
          const data = await response.json();
          if (Array.isArray(data)) {
            console.log(`   ✅ Array con ${data.length} elementi`);
            if (data.length > 0) {
              console.log(`   🏭 Primo elemento: ID=${data[0].id}, code="${data[0].code || 'N/A'}"`);
            }
          } else {
            console.log(`   ✅ Oggetto singolo`);
          }
        } catch (e) {
          console.log(`   ⚠️  Non JSON`);
        }
      } else {
        console.log(`   ❌ ERRORE ${status}`);
      }
    }
  });

  // Capture errors
  const errors = [];
  page.on('pageerror', error => {
    errors.push(error.message);
    console.log(`❌ JS ERROR: ${error.message}`);
  });

  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('Failed to load resource')) {
      console.log(`🔴 CONSOLE: ${msg.text().substring(0, 120)}`);
    }
  });

  try {
    console.log('📍 Navigazione a http://localhost:3006/locations\n');

    await page.goto('http://localhost:3006/locations', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    console.log('⏳ Attesa 12 secondi per caricamento completo...\n');
    await page.waitForTimeout(12000);

    // Check page content
    const h1Text = await page.locator('h1').first().textContent().catch(() => '');
    const hasErrorText = await page.locator('text=/errore/i').isVisible().catch(() => false);

    // Count elements
    const statCards = await page.locator('.border-l-4, [data-testid="stat-card"]').count().catch(() => 0);
    const machineCards = await page.locator('[data-testid="machine-card"], .machine-card, .border').count().catch(() => 0);

    console.log('═══════════════════════════════════════════════════');
    console.log('📊 RISULTATI LOCATIONS PAGE:');
    console.log('═══════════════════════════════════════════════════');
    console.log(`   H1: "${h1Text}"`);
    console.log(`   📊 Stat cards: ${statCards}`);
    console.log(`   🏭 Machine/Border cards: ${machineCards}`);
    console.log(`   🔗 Richieste totali: ${apiRequests.length}`);
    console.log(`   ❌ Errori JS: ${errors.length}`);
    console.log(`   ⚠️  Testo errore visibile: ${hasErrorText ? 'SÌ' : 'NO'}`);
    console.log('═══════════════════════════════════════════════════\n');

    // Filter machine-related requests
    const machineRequests = apiRequests.filter(r =>
      r.url.includes('machine') || r.url.includes('EjLogHostVertimag')
    );

    if (machineRequests.length > 0) {
      console.log('📡 RICHIESTE MACHINES/API:');
      machineRequests.forEach((req, idx) => {
        console.log(`   ${idx + 1}. ${req.method} ${req.url}`);
      });
      console.log('');
    }

    // Check for correct endpoint path (without double /api/api/)
    const correctEndpoint = machineRequests.some(r =>
      r.url.includes('/api/EjLogHostVertimag/machines') &&
      !r.url.includes('/api/api/EjLogHostVertimag/machines')
    );

    const doubleApiError = machineRequests.some(r =>
      r.url.includes('/api/api/EjLogHostVertimag/machines')
    );

    // Screenshot
    await page.screenshot({ path: 'LOCATIONS-SUCCESS-TEST.png', fullPage: true });
    console.log('📸 Screenshot: LOCATIONS-SUCCESS-TEST.png\n');

    // Final verdict
    if (!hasErrorText && errors.length === 0) {
      if (correctEndpoint && !doubleApiError && machineRequests.length > 0) {
        console.log('');
        console.log('╔═════════════════════════════════════════════════════════╗');
        console.log('║                                                         ║');
        console.log('║   ✅✅✅ LOCATIONS PAGE COMPLETAMENTE FUNZIONANTE! ✅✅✅  ║');
        console.log('║                                                         ║');
        console.log('╚═════════════════════════════════════════════════════════╝');
        console.log('');
        console.log(`  ✅ Endpoint CORRETTO: /api/EjLogHostVertimag/machines`);
        console.log(`  ✅ Nessun doppio /api/api/ rilevato`);
        console.log(`  ✅ ${statCards} stat cards visualizzate`);
        console.log(`  ✅ ${machineCards} cards visualizzate`);
        console.log(`  ✅ ${machineRequests.length} chiamate backend`);
        console.log(`  ✅ Zero errori JavaScript`);
        console.log('');
      } else if (doubleApiError) {
        console.log('❌ PROBLEMA: Ancora presente il doppio /api/api/');
        console.log('   Il browser sta ancora usando codice cached vecchio\n');
      } else if (machineRequests.length > 0 && (machineCards > 0 || statCards > 0)) {
        console.log('⚠️  Endpoint chiamato MA potrebbe esserci un problema di rendering\n');
      } else {
        console.log('❌ NESSUNA chiamata API al backend\n');
      }
    } else {
      console.log('❌ PROBLEMI RILEVATI:\n');
      if (hasErrorText) console.log('   - Errore visibile nella UI');
      if (errors.length > 0) {
        console.log(`   - ${errors.length} errori JavaScript:`);
        errors.forEach(err => console.log(`     • ${err.substring(0, 100)}`));
      }
      console.log('');
    }

    console.log('🌐 Browser rimane aperto per 10 MINUTI');
    console.log('   Ispeziona manualmente la pagina locations\n');

    await page.waitForTimeout(600000);

  } catch (error) {
    console.error(`\n❌ ERRORE CRITICO: ${error.message}\n`);
    console.error(error.stack);
    await page.screenshot({ path: 'LOCATIONS-SUCCESS-CRASH.png' }).catch(() => {});
  } finally {
    await browser.close();
    console.log('✅ Test completato\n');
  }
})();
