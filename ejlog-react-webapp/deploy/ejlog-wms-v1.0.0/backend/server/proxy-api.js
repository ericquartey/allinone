/**
 * Server API Proxy per EjLog
 *
 * Fornisce endpoint REST che si connettono direttamente al database SQL Server
 * e servono dati reali al frontend React.
 *
 * Porta: 3002
 * Database: promag su localhost\SQL2019
 */

import express from 'express';
import cors from 'cors';
import { getPool, closePool } from './db-config.js';

// Import routes
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import groupsRoutes from './routes/groups.js';
import loadingUnitsRoutes from './routes/loading-units.js';
import itemListsRoutes from './routes/item-lists-enhanced.js';
import menuRoutes from './routes/menu.js';
import notificationsRoutes from './routes/notifications.js';
import stockRoutes from './routes/stock.js';
import itemsRoutes from './routes/items.js';

const app = express();
const PORT = process.env.PORT || 3077;

// ============================================
// MIDDLEWARE
// ============================================

// CORS - permetti richieste dal frontend React
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3000', 'http://localhost:3004'],
  credentials: true
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'EjLog Proxy API',
    timestamp: new Date().toISOString(),
    database: 'SQL Server - promag'
  });
});

app.get('/ready', (req, res) => {
  res.json({
    status: 'ready',
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage()
  });
});

// DEBUG: Inspect database structure
app.get('/debug/udc-structure', async (req, res) => {
  try {
    const pool = await getPool();

    // Get column names for UDC table
    const columnsResult = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, CHARACTER_MAXIMUM_LENGTH
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'UDC'
      ORDER BY ORDINAL_POSITION
    `);

    // Get sample data
    let sampleData = [];
    try {
      const sampleResult = await pool.request().query(`SELECT TOP 3 * FROM UDC`);
      sampleData = sampleResult.recordset;
    } catch (err) {
      sampleData = [{ error: err.message }];
    }

    res.json({
      tableName: 'UDC',
      columns: columnsResult.recordset,
      sampleData
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// API ROUTES
// ============================================

// Endpoint autenticazione (login/logout)
app.use('/api/auth', authRoutes);

// Endpoint gestione utenti
app.use('/api/users', usersRoutes);

// Endpoint gestione gruppi utenti
app.use('/api/user-groups', groupsRoutes);

// Endpoint menu dinamico
app.use('/api/menu', menuRoutes);

// Endpoint gestione liste (lists/picking/refilling)
app.use('/api/lists', itemListsRoutes);

// Endpoint notifiche (badge contatori, alert)
app.use('/api/notifications', notificationsRoutes);

// Endpoint gestione articoli (items/products)
// NOTA: Reindirizzato a /EjLogHostVertimag/Stock che contiene i dati reali da UDC
app.use('/api/items', stockRoutes);

// Endpoint gestione UDC/cassetti (loading units)
// Frontend calls: /api/EjLogHostVertimag/api/loading-units
// Vite proxy rewrites to: /EjLogHostVertimag/api/loading-units
app.use('/EjLogHostVertimag/api/loading-units', loadingUnitsRoutes);

// Endpoint gestione giacenze (stock/inventory)
// Frontend calls: /api/EjLogHostVertimag/Stock
app.use('/EjLogHostVertimag/Stock', stockRoutes);

// Endpoint legacy per utenti (compatibilità con frontend esistente)
// Frontend chiama: /EjLogHostVertimag/User
// Mappiamo a /api/users
app.use('/EjLogHostVertimag/User', usersRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint non trovato',
    path: req.path,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Errore server:', err);

  res.status(err.status || 500).json({
    error: err.message || 'Errore interno del server',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================
// SERVER START/STOP
// ============================================

const server = app.listen(PORT, () => {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║  🚀 EjLog Proxy API Server                                ║');
  console.log('╠═══════════════════════════════════════════════════════════╣');
  console.log(`║  📡 Server in ascolto su: http://localhost:${PORT}        ║`);
  console.log('║  💾 Database: SQL Server (localhost\\SQL2019 - promag)    ║');
  console.log('║  🔧 Ambiente: development                                 ║');
  console.log('╠═══════════════════════════════════════════════════════════╣');
  console.log('║  Endpoint disponibili:                                    ║');
  console.log('║  • GET    /health                                         ║');
  console.log('║  • POST   /api/auth/login                                 ║');
  console.log('║  • POST   /api/auth/logout                                ║');
  console.log('║  • GET    /api/auth/password-hint                         ║');
  console.log('║  • GET    /api/users/search                               ║');
  console.log('║  • GET    /api/users/:id                                  ║');
  console.log('║  • POST   /api/users                                      ║');
  console.log('║  • PUT    /api/users/:id                                  ║');
  console.log('║  • PUT    /api/users/:id/password                         ║');
  console.log('║  • DELETE /api/users/:id                                  ║');
  console.log('║  • GET    /api/user-groups                                ║');
  console.log('║  • GET    /api/user-groups/:id                            ║');
  console.log('║  • GET    /EjLogHostVertimag/api/loading-units            ║');
  console.log('║  • GET    /EjLogHostVertimag/api/loading-units/:id        ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
});

// Graceful shutdown
const shutdown = async () => {
  console.log('\n🛑 Arresto server in corso...');

  server.close(async () => {
    console.log('✅ Server HTTP chiuso');

    // Chiudi connessioni database
    await closePool();

    console.log('👋 Arrivederci!\n');
    process.exit(0);
  });

  // Forza chiusura dopo 10 secondi
  setTimeout(() => {
    console.error('⚠️  Timeout raggiunto, chiusura forzata');
    process.exit(1);
  }, 10000);
};

// Cattura segnali di terminazione
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Cattura errori non gestiti
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  shutdown();
});

export default app;

