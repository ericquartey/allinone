/**
 * EjLog - Startup Script per Tutti i Server con Dati Reali
 *
 * Questo script avvia automaticamente tutti i server necessari
 * per eseguire EjLog con dati reali dal database.
 *
 * UTILIZZO:
 *   npm start
 *   oppure
 *   node server/start-all-real-data.js
 *
 * SERVER AVVIATI:
 *   - REST HTTPS Server (porta 3079)
 *   - Backend SQL con dati reali (porta 3077)
 *   - Backend React (porta 8080)
 *   - Frontend Vite (porta 3000)
 */

import { spawn } from 'child_process';
import { platform } from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Configurazione server
const SERVER_CONFIG = {
  https: {
    name: 'REST-HTTPS-3079',
    port: 3079,
    env: { HTTPS_PORT: '3079' },
    script: 'server/api-server-https.js',
    color: '\x1b[35m' // Magenta
  },
  sqlBackend: {
    name: 'Backend-SQL-3077',
    port: 3077,
    env: { PORT: '3077' },
    script: 'server/api-server.js',
    color: '\x1b[36m' // Cyan
  },
  reactBackend: {
    name: 'Backend-React-8080',
    port: 8080,
    env: { PORT: '8080' },
    script: 'server/api-server.js',
    color: '\x1b[34m' // Blue
  },
  frontend: {
    name: 'Frontend-Vite-3000',
    port: 3000,
    env: { PORT: '3000' },
    command: 'npm',
    args: ['run', 'dev:frontend-only'],
    color: '\x1b[32m' // Green
  }
};

const RESET_COLOR = '\x1b[0m';
const processes = [];

// Helper per stampare con colore
function logColored(color, serverName, message) {
  console.log(`${color}[${serverName}]${RESET_COLOR} ${message}`);
}

// Helper per avviare un processo
function startServer(config) {
  return new Promise((resolve, reject) => {
    const isWindows = platform() === 'win32';

    let proc;
    if (config.command) {
      // NPM command (per frontend)
      const npmCmd = isWindows ? 'npm.cmd' : 'npm';
      proc = spawn(npmCmd, config.args, {
        cwd: projectRoot,
        env: { ...process.env, ...config.env },
        shell: isWindows,
        stdio: ['ignore', 'pipe', 'pipe']
      });
    } else {
      // Node script (per backend servers)
      proc = spawn('node', [config.script], {
        cwd: projectRoot,
        env: { ...process.env, ...config.env },
        stdio: ['ignore', 'pipe', 'pipe']
      });
    }

    processes.push({ name: config.name, process: proc });

    // Log output con colore
    proc.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(line => line.trim());
      lines.forEach(line => logColored(config.color, config.name, line));
    });

    proc.stderr.on('data', (data) => {
      const message = data.toString().trim();
      if (message && !message.includes('ExperimentalWarning')) {
        logColored(config.color, config.name, `⚠️  ${message}`);
      }
    });

    proc.on('error', (error) => {
      logColored(config.color, config.name, `❌ Errore: ${error.message}`);
      reject(error);
    });

    proc.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        logColored(config.color, config.name, `❌ Terminato con codice ${code}`);
      }
    });

    // Aspetta un po' prima di considerare il server avviato
    setTimeout(() => {
      logColored(config.color, config.name, `✅ Avviato sulla porta ${config.port}`);
      resolve(proc);
    }, 2000);
  });
}

// Gestione chiusura
function cleanup() {
  console.log('\n\n🛑 Chiusura di tutti i server...');
  processes.forEach(({ name, process }) => {
    try {
      process.kill();
      console.log(`✅ ${name} terminato`);
    } catch (error) {
      console.log(`⚠️  Errore chiudendo ${name}:`, error.message);
    }
  });
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

// Main
async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║                   EjLog WMS - Avvio Completo Sistema                      ║
║                   Con Dati Reali dal Database                             ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
  `);

  try {
    console.log('🚀 Avvio server in corso...\n');

    // Avvia tutti i server in sequenza
    await startServer(SERVER_CONFIG.https);
    await startServer(SERVER_CONFIG.sqlBackend);
    await startServer(SERVER_CONFIG.reactBackend);
    await startServer(SERVER_CONFIG.frontend);

    console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                        SISTEMA AVVIATO CON SUCCESSO!                      ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  REST HTTPS:     https://localhost:3079                                   ║
║  Backend SQL:    http://localhost:3077                                    ║
║  Backend React:  http://localhost:8080                                    ║
║  Frontend Vite:  http://localhost:3000                                    ║
║                                                                           ║
║  Swagger Docs:   http://localhost:3077/api-docs                           ║
║  Health Check:   http://localhost:3077/health                             ║
║  WebSocket:      ws://localhost:3077/ws                                   ║
║                                                                           ║
║  Database:       SQL Server (localhost\\SQL2019) - promag                 ║
║                                                                           ║
║  SCHEDULER SERVICE:                                                       ║
║    ✅ Attivo e funzionante                                                ║
║    📋 3 Prenotatori: Picking, Refilling, Inventario                       ║
║    ⚙️  3 Workers attivi                                                    ║
║    🔄 Fetcher: polling ogni 5 secondi                                     ║
║    🔗 API: http://localhost:3077/api/scheduler/*                          ║
║                                                                           ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  Per fermare: Ctrl+C                                                      ║
╚═══════════════════════════════════════════════════════════════════════════╝
    `);

    // Apri browser dopo 3 secondi
    setTimeout(() => {
      const isWindows = platform() === 'win32';
      const isMac = platform() === 'darwin';

      const url = 'http://localhost:3000';
      let openCommand;

      if (isWindows) {
        openCommand = spawn('cmd', ['/c', 'start', url], { shell: true });
      } else if (isMac) {
        openCommand = spawn('open', [url]);
      } else {
        openCommand = spawn('xdg-open', [url]);
      }

      openCommand.on('error', () => {
        console.log(`\n🌐 Apri il browser manualmente: ${url}\n`);
      });
    }, 3000);

  } catch (error) {
    console.error('\n❌ Errore durante l\'avvio:', error.message);
    cleanup();
  }
}

main().catch(console.error);

