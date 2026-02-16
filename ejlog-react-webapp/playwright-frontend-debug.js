/**
 * Playwright Frontend Debug Script
 *
 * Questo script:
 * 1. Avvia i server backend e frontend
 * 2. Verifica che siano attivi
 * 3. Naviga al frontend con Playwright
 * 4. Cattura screenshot e log
 * 5. Diagnostica eventuali problemi
 */

import { chromium } from '@playwright/test';
import { spawn } from 'child_process';
import { platform } from 'os';

const isWindows = platform() === 'win32';

// Configurazione server
const servers = {
  backend: {
    name: 'Backend-SQL-3077',
    port: 3077,
    process: null,
    ready: false
  },
  frontend: {
    name: 'Frontend-Vite-3000',
    port: 3000,
    process: null,
    ready: false
  }
};

// Helper per verificare se una porta è in ascolto
async function waitForPort(port, maxRetries = 30) {
  console.log(`⏳ Attendo che la porta ${port} sia attiva...`);

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(`http://localhost:${port}`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(1000)
      });
      console.log(`✅ Porta ${port} attiva!`);
      return true;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.error(`❌ Timeout: porta ${port} non risponde dopo ${maxRetries} secondi`);
  return false;
}

// Avvia un server
function startServer(name, port, command, args, env = {}) {
  return new Promise((resolve, reject) => {
    console.log(`🚀 Avvio ${name}...`);

    const proc = spawn(command, args, {
      cwd: process.cwd(),
      env: { ...process.env, PORT: String(port), ...env },
      shell: isWindows,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    proc.stdout.on('data', (data) => {
      const message = data.toString();
      console.log(`[${name}] ${message}`);

      // Rileva quando il server è pronto
      if (message.includes('ready') || message.includes('listening') || message.includes('started')) {
        resolve(proc);
      }
    });

    proc.stderr.on('data', (data) => {
      const message = data.toString();
      if (!message.includes('ExperimentalWarning')) {
        console.error(`[${name}] ⚠️ ${message}`);
      }
    });

    proc.on('error', (error) => {
      console.error(`[${name}] ❌ Errore: ${error.message}`);
      reject(error);
    });

    proc.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        console.error(`[${name}] ❌ Terminato con codice ${code}`);
      }
    });

    // Timeout dopo 10 secondi se non riceve conferma
    setTimeout(() => resolve(proc), 10000);
  });
}

// Test frontend con Playwright
async function testFrontend() {
  console.log('\n🎭 Avvio test Playwright...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  // Cattura errori console
  const consoleMessages = [];
  const consoleErrors = [];

  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push(text);
    console.log(`[Browser Console] ${msg.type()}: ${text}`);

    if (msg.type() === 'error') {
      consoleErrors.push(text);
    }
  });

  // Cattura errori di rete
  const networkErrors = [];
  page.on('requestfailed', request => {
    const failure = `${request.url()} - ${request.failure().errorText}`;
    networkErrors.push(failure);
    console.error(`[Network Error] ${failure}`);
  });

  try {
    console.log('📡 Navigazione a http://localhost:3000...');

    // Naviga al frontend
    const response = await page.goto('http://localhost:3000', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log(`📊 Status: ${response.status()}`);

    // Aspetta che la pagina si carichi
    await page.waitForTimeout(2000);

    // Cattura screenshot
    await page.screenshot({
      path: 'screenshots/frontend-debug-full.png',
      fullPage: true
    });
    console.log('📸 Screenshot salvato: screenshots/frontend-debug-full.png');

    // Verifica elementi chiave
    const title = await page.title();
    console.log(`📄 Titolo pagina: ${title}`);

    const bodyText = await page.textContent('body');
    console.log(`📝 Lunghezza contenuto: ${bodyText.length} caratteri`);

    // Verifica se ci sono messaggi di errore visibili
    const errorElements = await page.locator('text=/error|errore/i').count();
    if (errorElements > 0) {
      console.warn(`⚠️ Trovati ${errorElements} elementi con testo "error"`);
    }

    // Report finale
    console.log('\n' + '='.repeat(80));
    console.log('📋 REPORT DIAGNOSTICO');
    console.log('='.repeat(80));
    console.log(`✅ Pagina caricata: ${response.ok()}`);
    console.log(`📊 Status Code: ${response.status()}`);
    console.log(`📄 Titolo: ${title}`);
    console.log(`🔴 Errori Console: ${consoleErrors.length}`);
    console.log(`🌐 Errori Rete: ${networkErrors.length}`);

    if (consoleErrors.length > 0) {
      console.log('\n🔴 Dettaglio Errori Console:');
      consoleErrors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err}`);
      });
    }

    if (networkErrors.length > 0) {
      console.log('\n🌐 Dettaglio Errori Rete:');
      networkErrors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err}`);
      });
    }

    console.log('='.repeat(80) + '\n');

    // Mantieni il browser aperto per 30 secondi
    console.log('⏳ Browser aperto per 30 secondi per ispezione manuale...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('❌ Errore durante il test:', error.message);
    await page.screenshot({ path: 'screenshots/frontend-debug-error.png' });
    console.log('📸 Screenshot errore salvato: screenshots/frontend-debug-error.png');
  } finally {
    await browser.close();
  }
}

// Main
async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║              Playwright Frontend Debug & Diagnostic Tool                  ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
  `);

  try {
    // Avvia Backend
    servers.backend.process = await startServer(
      servers.backend.name,
      servers.backend.port,
      'node',
      ['server/api-server.js'],
      { PORT: '3077' }
    );

    // Verifica che il backend sia attivo
    servers.backend.ready = await waitForPort(servers.backend.port);

    if (!servers.backend.ready) {
      throw new Error('Backend non si è avviato correttamente');
    }

    // Avvia Frontend
    const npmCmd = isWindows ? 'npm.cmd' : 'npm';
    servers.frontend.process = await startServer(
      servers.frontend.name,
      servers.frontend.port,
      npmCmd,
      ['run', 'dev:frontend-only'],
      { PORT: '3000' }
    );

    // Verifica che il frontend sia attivo
    servers.frontend.ready = await waitForPort(servers.frontend.port);

    if (!servers.frontend.ready) {
      throw new Error('Frontend non si è avviato correttamente');
    }

    console.log('\n✅ Tutti i server sono attivi!\n');

    // Esegui test Playwright
    await testFrontend();

  } catch (error) {
    console.error('\n❌ Errore:', error.message);
  } finally {
    // Cleanup
    console.log('\n🛑 Chiusura server...');
    if (servers.backend.process) servers.backend.process.kill();
    if (servers.frontend.process) servers.frontend.process.kill();

    process.exit(0);
  }
}

// Gestione segnali
process.on('SIGINT', () => {
  console.log('\n\n🛑 Interruzione...');
  if (servers.backend.process) servers.backend.process.kill();
  if (servers.frontend.process) servers.frontend.process.kill();
  process.exit(0);
});

main().catch(console.error);

