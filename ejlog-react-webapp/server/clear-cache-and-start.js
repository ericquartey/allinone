/**
 * Clear Module Cache and Start Servers
 *
 * This script forces Node.js to clear its module cache before starting servers.
 * Useful when route files have been modified and need to be reloaded.
 */

import { spawn } from 'child_process';
import { platform } from 'os';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                 CLEARING NODE.JS MODULE CACHE                             ║
╚═══════════════════════════════════════════════════════════════════════════╝
`);

// Force module cache clear by touching all .js files in routes and controllers
const routesDir = path.join(projectRoot, 'server', 'routes');
const controllersDir = path.join(projectRoot, 'server', 'controllers');

function touchFiles(dir) {
  if (!fs.existsSync(dir)) return;

  const files = fs.readdirSync(dir);
  files.forEach(file => {
    if (file.endsWith('.js')) {
      const filePath = path.join(dir, file);
      const now = new Date();
      fs.utimesSync(filePath, now, now);
      console.log(`✅ Touched: ${file}`);
    }
  });
}

console.log('\n📁 Touching route files...');
touchFiles(routesDir);

console.log('\n📁 Touching controller files...');
touchFiles(controllersDir);

console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                 STARTING SERVERS WITH FRESH CACHE                         ║
╚═══════════════════════════════════════════════════════════════════════════╝
`);

// Now start the servers with the nocache version
const isWindows = platform() === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

const startProcess = spawn(npmCmd, ['run', 'start:nocache'], {
  cwd: projectRoot,
  shell: isWindows,
  stdio: 'inherit'
});

startProcess.on('error', (error) => {
  console.error('❌ Failed to start servers:', error.message);
  process.exit(1);
});

startProcess.on('exit', (code) => {
  process.exit(code || 0);
});

// Cleanup on exit
process.on('SIGINT', () => {
  startProcess.kill();
  process.exit(0);
});
