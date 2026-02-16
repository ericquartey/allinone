import { test, expect } from '@playwright/test';

test.describe('Diagnostica Servizi EjLog', () => {
  test('Verifica backend REST sulla porta 8080', async ({ request }) => {
    console.log('\n🔍 Test Backend REST - Porta 8080');
    console.log('═══════════════════════════════════════\n');

    try {
      const response = await request.get('http://localhost:8080/health', {
        timeout: 5000
      });

      console.log(`Status: ${response.status()} ${response.statusText()}`);

      if (response.ok()) {
        const data = await response.json();
        console.log('✅ Backend risponde correttamente!');
        console.log(JSON.stringify(data, null, 2));
      } else {
        console.log(`❌ Backend risponde con errore: ${response.status()}`);
      }

      expect(response.ok()).toBeTruthy();
    } catch (error) {
      console.error('❌ Impossibile raggiungere il backend:', error.message);
      throw error;
    }
  });

  test('Verifica frontend React sulla porta 3000', async ({ page }) => {
    console.log('\n🔍 Test Frontend React - Porta 3000');
    console.log('═══════════════════════════════════════\n');

    test.setTimeout(60000); // Aumenta timeout a 60 secondi

    try {
      console.log('Tentativo di connessione a http://localhost:3000...');

      const response = await page.goto('http://localhost:3000', {
        timeout: 15000,
        waitUntil: 'domcontentloaded'
      });

      console.log(`Status HTTP: ${response?.status()}`);

      if (response?.ok()) {
        console.log('✅ Frontend raggiungibile!');

        // Cattura screenshot
        await page.screenshot({
          path: 'C:\\F_WMS\\dev\\workspacesEjlog\\EjLog\\documentazioni\\ejlog-react-webapp\\frontend-live.png',
          fullPage: true
        });
        console.log('📸 Screenshot salvato: frontend-live.png');

        // Ottieni titolo pagina
        const title = await page.title();
        console.log(`📄 Titolo pagina: ${title}`);

        expect(response.ok()).toBeTruthy();
      } else {
        console.log(`❌ Frontend risponde con errore HTTP: ${response?.status()}`);
        expect.fail(`Frontend non raggiungibile - Status: ${response?.status()}`);
      }

    } catch (error) {
      console.error('❌ Errore durante connessione al frontend:');
      console.error(`   Messaggio: ${error.message}`);
      console.error('\n💡 Possibili cause:');
      console.error('   1. Il server Vite non è avviato sulla porta 3000');
      console.error('   2. npm run dev non è stato eseguito');
      console.error('   3. La porta 3000 è occupata da altro processo');
      console.error('\n🔧 Soluzioni:');
      console.error('   - Eseguire: cd C:\\F_WMS\\dev\\workspacesEjlog\\EjLog\\documentazioni\\ejlog-react-webapp');
      console.error('   - Eseguire: set PORT=3000 && npm run dev');
      console.error('   - Verificare con: netstat -ano | findstr :3000');

      throw error;
    }
  });

  test('Test completo: Backend + Frontend + API', async ({ page, request }) => {
    console.log('\n🔍 Test Integrazione Completa');
    console.log('═══════════════════════════════════════\n');

    // 1. Verifica backend
    console.log('1️⃣ Verifico backend...');
    const backendHealth = await request.get('http://localhost:8080/health');
    console.log(`   Backend: ${backendHealth.ok() ? '✅ OK' : '❌ FAIL'}`);

    // 2. Apri frontend
    console.log('2️⃣ Apro frontend...');
    const frontendResponse = await page.goto('http://localhost:3000');
    console.log(`   Frontend: ${frontendResponse?.ok() ? '✅ OK' : '❌ FAIL'}`);

    // 3. Test chiamata API dal frontend
    console.log('3️⃣ Test chiamata API...');
    const apiResponse = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/health');
        return {
          ok: res.ok,
          status: res.status,
          data: await res.json()
        };
      } catch (err) {
        return { ok: false, error: err.message };
      }
    });

    console.log(`   API Proxy: ${apiResponse.ok ? '✅ OK' : '❌ FAIL'}`);
    if (apiResponse.ok) {
      console.log('   Risposta:', JSON.stringify(apiResponse.data, null, 2));
    }

    console.log('\n═══════════════════════════════════════');
    console.log('✅ Test completato con successo!');

    expect(backendHealth.ok()).toBeTruthy();
    expect(frontendResponse?.ok()).toBeTruthy();
    expect(apiResponse.ok).toBeTruthy();
  });
});
