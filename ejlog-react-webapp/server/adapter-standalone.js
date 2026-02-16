/**
 * EjLog Adapter Standalone Server - Porta 10001
 *
 * Server dedicato per l'adapter integrato Node.js
 * Espone tutte le API dell'adapter sulla porta 10001 per dispositivi PPC esterni
 * Nota: la porta 10000 e' riservata all'adapter .NET esterno (MAS).
 */

import express from 'express';
import cors from 'cors';
import { networkInterfaces } from 'os';
import { getPool } from './db-config.js';

// Import route SQL reali
import itemsRoutes from './routes/items.js';
import listsRoutes from './routes/lists.js';
import locationsRoutes from './routes/locations.js';
import stockRoutes from './routes/stock.js';

const app = express();
const PORT = Number(process.env.ADAPTER_PORT) || 10001;

// ============================================
// GET LOCAL IP ADDRESS
// ============================================

function getLocalIPAddress() {
  const nets = networkInterfaces();
  const results = [];

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4;
      if (net.family === familyV4Value && !net.internal) {
        results.push({
          name: name,
          address: net.address,
          netmask: net.netmask,
          mac: net.mac
        });
      }
    }
  }

  // Preferisci Ethernet/Wi-Fi rispetto ad altre interfacce
  const preferred = results.find(net =>
    net.name.toLowerCase().includes('ethernet') ||
    net.name.toLowerCase().includes('wi-fi') ||
    net.name.toLowerCase().includes('wlan')
  );

  return preferred || results[0] || { address: 'localhost', name: 'unknown' };
}

const localNetwork = getLocalIPAddress();
const LOCAL_IP = localNetwork.address;
const NETWORK_NAME = localNetwork.name;

// ============================================
// MIDDLEWARE
// ============================================

// CORS permissivo per dispositivi esterni
app.use(cors({
  origin: '*', // Permetti tutti gli origin per dispositivi PPC
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`[ADAPTER] ${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ============================================
// HEALTH CHECK
// ============================================

const buildHealthPayload = () => ({
  success: true,
  status: 'healthy',
  service: 'EjLog Adapter Standalone',
  port: PORT,
  network: {
    localIP: LOCAL_IP,
    networkName: NETWORK_NAME,
    externalURL: `http://${LOCAL_IP}:${PORT}`,
    localURL: `http://localhost:${PORT}`
  },
  timestamp: new Date().toISOString(),
  uptime: process.uptime()
});

app.get('/health', (req, res) => {
  res.json(buildHealthPayload());
});

// MAS-style health endpoints for PPC compatibility
app.get('/health/live', (_req, res) => {
  res.type('text/plain').send('Healthy');
});

app.get('/health/ready', (_req, res) => {
  res.type('text/plain').send('Healthy');
});


// Endpoint dedicato per ottenere info di rete
app.get('/api/network-info', (req, res) => {
  res.json({
    success: true,
    network: {
      localIP: LOCAL_IP,
      networkName: NETWORK_NAME,
      port: PORT,
      externalURL: `http://${LOCAL_IP}:${PORT}`,
      localURL: `http://localhost:${PORT}`,
      allInterfaces: Object.entries(networkInterfaces()).map(([name, nets]) => ({
        name,
        addresses: nets.filter(net => {
          const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4;
          return net.family === familyV4Value;
        }).map(net => ({
          address: net.address,
          internal: net.internal,
          netmask: net.netmask
        }))
      }))
    }
  });
});

app.get('/api/version', (req, res) => {
  res.send('2.3.12.4-node-standalone');
});

// ============================================
// ADAPTER ROUTES
// ============================================

// ============================================
// SQL DATABASE CONNECTION
// ============================================

let dbPool;
(async () => {
  try {
    dbPool = await getPool();
    console.log('[ADAPTER] ✅ Connesso al database SQL Server - promag');
  } catch (error) {
    console.error('[ADAPTER] ❌ Errore connessione database:', error.message);
  }
})();

// ============================================
// MOUNT SQL ROUTES
// ============================================

// Items - dati reali da SQL
app.use('/api/items', itemsRoutes);
app.use('/items', itemsRoutes);

// Lists - dati reali da SQL
app.use('/api/lists', listsRoutes);
app.use('/lists', listsRoutes);

// Locations - dati reali da SQL
app.use('/api/locations', locationsRoutes);
app.use('/locations', locationsRoutes);

// Stock - dati reali da SQL
app.use('/api/stock', stockRoutes);
app.use('/stock', stockRoutes);

console.log('[ADAPTER] ✅ Route SQL montate:');
console.log('[ADAPTER]   - /api/items (SQL)');
console.log('[ADAPTER]   - /api/lists (SQL)');
console.log('[ADAPTER]   - /api/locations (SQL)');
console.log('[ADAPTER]   - /api/stock (SQL)');

// ============================================
// ERROR HANDLING
// ============================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint non trovato',
    path: req.path,
    availableEndpoints: [
      'GET /health',
      'GET /api/version',
      'GET /version',
      'GET /api/items',
      'GET /items',
      'GET /api/locations',
      'GET /locations',
      'GET /api/lists',
      'GET /lists'
    ]
  });
});

app.use((err, req, res, next) => {
  console.error('[ADAPTER] Error:', err);
  res.status(500).json({
    success: false,
    error: 'Errore interno del server',
    message: err.message
  });
});

// ============================================
// START SERVER
// ============================================

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(70));
  console.log('🚀 EJLOG ADAPTER STANDALONE SERVER - STARTED');
  console.log('='.repeat(70));
  console.log(`📡 Server listening on:        http://0.0.0.0:${PORT}`);
  console.log(`🌐 Local URL:                  http://localhost:${PORT}`);
  console.log(`🔗 External URL (PPC):         http://${LOCAL_IP}:${PORT}`);
  console.log(`📶 Network Interface:          ${NETWORK_NAME}`);
  console.log(`🖧 Local IP Address:           ${LOCAL_IP}`);
  console.log(`✅ CORS:                       Enabled (all origins)`);
  console.log(`📦 Adapter:                    Node.js + SQL Server`);
  console.log(`💾 Database:                   promag (SQL Server)`);
  console.log('='.repeat(70));
  console.log('');
  console.log('📋 Available endpoints:');
  console.log(`   GET  /health                    - Server health check`);
  console.log(`   GET  /api/version               - Adapter version`);
  console.log(`   GET  /version                   - Adapter version (alias)`);
  console.log('');
  console.log('   🔹 Items API:');
  console.log(`   GET  /api/items                 - Get all items`);
  console.log(`   GET  /items                     - Get all items (alias)`);
  console.log(`   GET  /api/items/:id             - Get item by ID`);
  console.log('');
  console.log('   🔹 Locations API:');
  console.log(`   GET  /api/locations             - Get all locations`);
  console.log(`   GET  /locations                 - Get all locations (alias)`);
  console.log(`   GET  /api/locations/:id         - Get location by ID`);
  console.log('');
  console.log('   🔹 Lists API:');
  console.log(`   GET  /api/lists                 - Get all lists`);
  console.log(`   GET  /lists                     - Get all lists (alias)`);
  console.log(`   GET  /api/lists/:id             - Get list by ID`);
  console.log(`   POST /api/lists/:id/complete    - Complete list`);
  console.log('');
  console.log('   🔹 Operations API:');
  console.log(`   GET  /api/operations            - Get all operations`);
  console.log(`   POST /api/operations/:id/start  - Start operation`);
  console.log(`   POST /api/operations/:id/close  - Close operation`);
  console.log('='.repeat(70));
  console.log('');
  console.log('💡 Per accesso da PPC esterno usa:');
  console.log(`   http://${LOCAL_IP}:${PORT}/health`);
  console.log(`   http://${LOCAL_IP}:${PORT}/api/items`);
  console.log(`   http://${LOCAL_IP}:${PORT}/api/lists`);
  console.log('='.repeat(70));
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[ADAPTER] SIGTERM received, closing server...');
  server.close(() => {
    console.log('[ADAPTER] Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[ADAPTER] SIGINT received, closing server...');
  server.close(() => {
    console.log('[ADAPTER] Server closed');
    process.exit(0);
  });
});

export default app;
