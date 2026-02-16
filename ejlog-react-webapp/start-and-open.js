/**
 * Script per avviare Vite e aprire il browser con Playwright
 */
import { spawn } from 'child_process';
import { chromium } from '@playwright/test';
import { platform } from 'os';

const PORT = 8080;
const URL = `http://localhost:${PORT}`;

console.log('🚀 Avvio Vite dev server...\n');

// Avvia Vite
const isWindows = platform() === 'win32';
const viteCmd = isWindows ? 'npx.cmd' : 'npx';
const viteProcess = spawn(viteCmd, ['vite', '--port', PORT.toString()], {
  stdio: 'inherit',
  shell: isWindows
});

viteProcess.on('error', (error) => {
  console.error('❌ Errore avvio Vite:', error);
  process.exit(1);
});

// Attendi che Vite sia pronto
console.log('⏳ Attendo che Vite sia pronto...\n');

async function waitForServer(url, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return true;
      }
    } catch (error) {
      // Server non ancora pronto
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
    process.stdout.write('.');
  }
  return false;
}

// Aspetta che il server sia pronto e apri il browser
setTimeout(async () => {
  console.log('\n\n🔍 Verifico disponibilità server...\n');

  const isReady = await waitForServer(URL);

  if (!isReady) {
    console.error('\n❌ Server non disponibile dopo 30 secondi');
    viteProcess.kill();
    process.exit(1);
  }

  console.log('\n✅ Server pronto!\n');
  console.log('🌐 Apertura browser con Playwright...\n');

  try {
    const browser = await chromium.launch({
      headless: false,
      args: ['--start-maximized']
    });

    const context = await browser.newContext({
      viewport: null
    });

    const page = await context.newPage();

    console.log(`📍 Navigazione a ${URL}...\n`);
    await page.goto(URL, { waitUntil: 'networkidle' });

    console.log('✅ Pagina caricata!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Browser aperto con successo!');
    console.log('📍 URL:', URL);
    console.log('🔧 Premi Ctrl+C per fermare il server');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Mantieni il browser aperto
    // Non chiudere automaticamente

  } catch (error) {
    console.error('\n❌ Errore apertura browser:', error);
    viteProcess.kill();
    process.exit(1);
  }
}, 3000);

// Gestione chiusura
process.on('SIGINT', () => {
  console.log('\n\n🛑 Chiusura server...');
  viteProcess.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  viteProcess.kill();
  process.exit(0);
});
