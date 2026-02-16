// VERIFY LOCATIONS NOW - Test completo pagina locations con nuova finestra browser
import { chromium } from '@playwright/test';

(async () => {
  console.log('\n🔍 VERIFY LOCATIONS NOW - Test completo con browser fresco\n');

  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized', '--disable-http-cache', '--disable-cache']
  });

  const context = await browser.newContext({
    viewport: null,
    ignoreHTTPSErrors: true
  });

  const page = await context.newPage();

  // Disable cache completely
  await page.route('**/*', route => {
    route.continue({
      headers: {
        ...route.request().headers(),
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  });

  // Monitor ALL API requests
  const apiRequests = [];
  page.on('request', request => {
    const url = request.url();
    apiRequests.push({
      method: request.method(),
      url: url
    });
    console.log(`📡 REQUEST: ${request.method()} ${url}`);
  });

  page.on('response', async response => {
    const url = response.url();
    const status = response.status();

    if (url.includes('machine') || url.includes('EjLogHostVertimag')) {
      console.log(`📥 RESPONSE: ${status} ${url}`);

      if (status === 200) {
        try {
          const data = await response.json();
          if (Array.isArray(data)) {
            console.log(`   ✅ Array con ${data.length} elementi`);
            if (data.length > 0) {
              console.log(`   🔹 Primo: ${JSON.stringify(data[0]).substring(0, 100)}`);
            }
          } else {
            console.log(`   ✅ Oggetto singolo: ${JSON.stringify(data).substring(0, 100)}`);
          }
        } catch (e) {
          console.log(`   ⚠️  Non JSON`);
        }
      } else {
        console.log(`   ❌ ERRORE ${status}`);
      }
    }
  });

  // Capture console
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`🔴 CONSOLE ERROR: ${msg.text()}`);
    }
  });

  // Capture errors
  const errors = [];
  page.on('pageerror', error => {
    errors.push(error.message);
    console.log(`❌ JS ERROR: ${error.message}`);
  });

  try {
    console.log('📍 Navigazione a http://localhost:3005/locations (HARD RELOAD)\n');

    await page.goto('http://localhost:3005/locations', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    console.log('⏳ Attesa 12 secondi per caricamento completo...\n');
    await page.waitForTimeout(12000);

    // Check page content
    const h1Text = await page.locator('h1').first().textContent().catch(() => '');
    const hasErrorText = await page.locator('text=/errore/i').isVisible().catch(() => false);

    // Count elements
    const statCards = await page.locator('.border-l-4, [data-testid="stat-card"]').count();
    const machineCards = await page.locator('[data-testid="machine-card"], .machine-card, .border').count();

    // Check for error messages
    const errorMessage = await page.locator('.text-red-600, .text-red-500, [class*="error"]').allTextContents();

    console.log('═══════════════════════════════════════════════════');
    console.log('📊 RISULTATI VERIFY LOCATIONS:');
    console.log('═══════════════════════════════════════════════════');
    console.log(`   H1: "${h1Text}"`);
    console.log(`   📊 Stat cards: ${statCards}`);
    console.log(`   🏭 Machine/Border cards: ${machineCards}`);
    console.log(`   🔗 Richieste totali: ${apiRequests.length}`);
    console.log(`   ❌ Errori JS: ${errors.length}`);
    console.log(`   ⚠️  Testo errore visibile: ${hasErrorText ? 'SÌ' : 'NO'}`);
    if (errorMessage.length > 0) {
      console.log(`   📝 Messaggi errore: ${errorMessage.join(' | ')}`);
    }
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

    // Screenshot
    await page.screenshot({ path: 'VERIFY-LOCATIONS-NOW.png', fullPage: true });
    console.log('📸 Screenshot: VERIFY-LOCATIONS-NOW.png\n');

    // Analyze results
    const hasBackendRequest = machineRequests.some(r =>
      r.url.includes('/api/EjLogHostVertimag/machines') ||
      r.url.includes('EjLogHostVertimag/api/machines')
    );

    if (!hasErrorText && errors.length === 0) {
      if (machineRequests.length > 0 && (machineCards > 0 || statCards > 0)) {
        console.log('');
        console.log('╔═══════════════════════════════════════════════════╗');
        console.log('║                                                   ║');
        console.log('║   ✅✅✅ LOCATIONS PAGE FUNZIONA! ✅✅✅        ║');
        console.log('║                                                   ║');
        console.log('╚═══════════════════════════════════════════════════╝');
        console.log('');
        console.log(`  ✅ Pagina caricata senza errori`);
        console.log(`  ✅ ${statCards} stat cards`);
        console.log(`  ✅ ${machineCards} cards visualizzate`);
        console.log(`  ✅ ${machineRequests.length} chiamate backend`);
        console.log('');
      } else if (machineRequests.length > 0) {
        console.log('⚠️  Backend chiamato MA nessun elemento visualizzato');
        console.log(`   Requests: ${machineRequests.length}, Cards: ${machineCards}, Stats: ${statCards}\n`);
      } else {
        console.log('❌ NESSUNA chiamata API al backend');
        console.log('   Il routing o l\'API non funziona\n');
      }
    } else {
      console.log('❌ PROBLEMI RILEVATI:\n');
      if (hasErrorText) console.log('   - Errore visibile nella UI');
      if (errors.length > 0) {
        console.log(`   - ${errors.length} errori JavaScript:`);
        errors.forEach(err => console.log(`     • ${err.substring(0, 120)}`));
      }
      console.log('');
    }

    console.log('🌐 Browser rimane aperto per 10 MINUTI');
    console.log('   Ispeziona manualmente la pagina locations\n');

    await page.waitForTimeout(600000);

  } catch (error) {
    console.error(`\n❌ ERRORE CRITICO: ${error.message}\n`);
    console.error(error.stack);
    await page.screenshot({ path: 'VERIFY-LOCATIONS-CRASH.png' }).catch(() => {});
  } finally {
    await browser.close();
    console.log('✅ Test completato\n');
  }
})();
