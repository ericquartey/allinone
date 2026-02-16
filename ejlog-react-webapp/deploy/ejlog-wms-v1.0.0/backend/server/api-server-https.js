/**
 * EjLog API Server HTTPS with JWT Authentication
 *
 * Server REST API HTTPS con:
 * - Autenticazione JWT obbligatoria su tutti gli endpoint protetti
 * - Certificati SSL self-signed per sviluppo
 * - Documentazione OpenAPI 3.0 / Swagger UI
 * - Validazione input con express-validator
 * - Error handling centralizzato
 * - CRUD completo per tutte le entità WMS
 *
 * Porta: 3079 (HTTPS)
 * Swagger UI: https://localhost:3079/api-docs
 * Health Check: https://localhost:3079/health
 *
 * @module api-server-https
 */

import https from 'https';
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getPool, closePool } from './db-config.js';
import { initWebSocketServer, stopWebSocketServer, getWebSocketStats } from './websocket-server.js';

// JWT Authentication Middleware
import {
  authenticateJWT,
  requireSuperuser,
  requireMinLevel
} from './middleware/jwt-auth.js';

// Other Middleware
import {
  errorHandler,
  notFoundHandler,
  requestLogger
} from './middleware/error-handler.js';
import { rateLimiter } from './middleware/rate-limiter.js';
import { auditLogger } from './middleware/audit-logger.js';

// Routes
import authRoutes from './routes/auth-enhanced.js';
import authRefreshRoutes from './routes/auth-refresh.js';
import usersRoutes from './routes/users.js';
import groupsRoutes from './routes/groups.js';
import loadingUnitsRoutes from './routes/loading-units-new.js';
import loadingUnitsLegacyRoutes from './routes/loading-units.js';
import compartmentsRoutes from './routes/compartments.js';
import itemsRoutes from './routes/items.js';
import itemListsRoutes from './routes/item-lists.js';
import locationsRoutes from './routes/locations.js';
import udcRoutes from './routes/udc.js';
import stockRoutes from './routes/stock.js';
import eventsRoutes from './routes/events.js';
import listsRoutes from './routes/lists.js';
import operationsRoutes from './routes/operations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.HTTPS_PORT || 3079;

// ============================================
// SSL CERTIFICATES
// ============================================

const certDir = path.join(__dirname, 'certs');
const keyPath = path.join(certDir, 'server.key');
const certPath = path.join(certDir, 'server.cert');

if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
  console.error('\n❌ SSL certificates not found!');
  console.error(`   Expected locations:`);
  console.error(`   - Private Key: ${keyPath}`);
  console.error(`   - Certificate: ${certPath}`);
  console.error('\n📝 Generate certificates by running:');
  console.error('   node server/generate-ssl-certs.js\n');
  process.exit(1);
}

const httpsOptions = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath)
};

console.log('🔐 SSL certificates loaded successfully');

// ============================================
// SWAGGER CONFIGURATION
// ============================================

const swaggerDocument = YAML.load(path.join(__dirname, 'swagger', 'swagger.yaml'));

// Update Swagger base URL for HTTPS
if (swaggerDocument.servers) {
  swaggerDocument.servers = [
    {
      url: `https://localhost:${PORT}`,
      description: 'HTTPS Development Server (JWT Authentication Required)'
    }
  ];
}

// Swagger UI options
const swaggerOptions = {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #1976d2; }
    .swagger-ui .scheme-container { background: #ffc107; padding: 10px; }
  `,
  customSiteTitle: 'EjLog WMS API Documentation (HTTPS)',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'none',
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    defaultModelsExpandDepth: 2,
    defaultModelExpandDepth: 2
  }
};

// ============================================
// MIDDLEWARE
// ============================================

// CORS - permetti richieste dal frontend React (HTTPS e HTTP)
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3004',
    'http://localhost:5173',
    'http://localhost:8080',
    'https://localhost:3000',
    'https://localhost:3001',
    'https://localhost:3004',
    'https://localhost:5173',
    'https://localhost:8080'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// Rate limiting (protezione contro brute force e DDoS)
app.use(rateLimiter);

// Audit logging (tracciamento operazioni utente)
app.use(auditLogger);

// ============================================
// SWAGGER UI (Public Endpoint)
// ============================================

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions));

// Redirect root to Swagger docs
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

// Redirect /swagger-ui.html to /api-docs (compatibility)
app.get('/swagger-ui.html', (req, res) => {
  res.redirect('/api-docs');
});

// ============================================
// HEALTH CHECK ENDPOINTS (Public)
// ============================================

app.get('/health', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request().query('SELECT 1 AS test');

    res.json({
      success: true,
      status: 'healthy',
      service: 'EjLog API Server HTTPS',
      version: '1.0.0',
      protocol: 'HTTPS',
      authentication: 'JWT Required',
      timestamp: new Date().toISOString(),
      database: {
        status: 'connected',
        type: 'SQL Server',
        database: 'promag'
      },
      ssl: {
        enabled: true,
        certificates: 'Self-signed (Development Only)'
      },
      uptime: process.uptime(),
      memory: process.memoryUsage()
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: 'Database connection failed',
      details: error.message
    });
  }
});

app.get('/ready', (req, res) => {
  res.json({
    success: true,
    status: 'ready',
    protocol: 'HTTPS',
    authentication: 'JWT',
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    nodeVersion: process.version
  });
});

app.get('/websocket/stats', (req, res) => {
  const stats = getWebSocketStats();
  res.json({
    success: true,
    websocket: stats,
    timestamp: new Date().toISOString()
  });
});

// ============================================
// API ROUTES WITH JWT AUTHENTICATION
// ============================================

const API_PREFIX = '/api';

// ============================================
// JWT AUTHENTICATION MIDDLEWARE
// ============================================
// Applica JWT authentication su tutti gli endpoint /api
// Gli endpoint pubblici sono gestiti nella whitelist del middleware
app.use(API_PREFIX, authenticateJWT);

// Authentication endpoints (pubblici - gestiti dalla whitelist)
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/auth`, authRefreshRoutes);

// Users & Groups (require authentication)
app.use(`${API_PREFIX}/users`, usersRoutes);
app.use(`${API_PREFIX}/user-groups`, groupsRoutes);

// Legacy route per /EjLogHostVertimag/User (compatibilità frontend)
app.use('/EjLogHostVertimag/User', authenticateJWT, usersRoutes);

// Loading Units (UDC/Cassetti)
app.use(`${API_PREFIX}/loading-units`, loadingUnitsRoutes);

// Legacy route per compatibilità con frontend esistente
app.use('/EjLogHostVertimag/api/loading-units', authenticateJWT, loadingUnitsLegacyRoutes);

// Compartments (Scomparti)
app.use(`${API_PREFIX}/compartments`, compartmentsRoutes);

// UDC (Unità Di Carico) - Real Database Data
app.use(`${API_PREFIX}/udc`, udcRoutes);

// Items (Articoli)
app.use(`${API_PREFIX}/items`, itemsRoutes);

// Item Lists (Liste)
app.use(`${API_PREFIX}/item-lists`, itemListsRoutes);

// Locations (Ubicazioni)
app.use(`${API_PREFIX}/locations`, locationsRoutes);
app.use('/EjLogHostVertimag/Locations', authenticateJWT, locationsRoutes);

// Stock (Giacenze) - REAL DATABASE DATA
app.use('/EjLogHostVertimag/Stock', authenticateJWT, stockRoutes);

// Events (Log Eventi) - REAL DATABASE DATA
app.use(`${API_PREFIX}/events`, eventsRoutes);
app.use('/EjLogHostVertimag/Events', authenticateJWT, eventsRoutes);

// Lists (Liste) - REAL DATABASE DATA
app.use(`${API_PREFIX}/lists`, listsRoutes);
app.use('/EjLogHostVertimag/Lists', authenticateJWT, listsRoutes);

// Operations (Operazioni Missione) - REAL DATABASE DATA
app.use(`${API_PREFIX}/operations`, operationsRoutes);

// ============================================
// DEBUG ENDPOINTS (solo development, require auth)
// ============================================

if (process.env.NODE_ENV !== 'production') {
  // Applica autenticazione a tutti gli endpoint debug
  app.use('/debug/*', authenticateJWT);

  // Ispeziona struttura tabella UDC
  app.get('/debug/udc-structure', async (req, res) => {
    try {
      const pool = await getPool();

      const columnsResult = await pool.request().query(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, CHARACTER_MAXIMUM_LENGTH
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'UDC'
        ORDER BY ORDINAL_POSITION
      `);

      const sampleResult = await pool.request().query(`SELECT TOP 3 * FROM UDC`);

      res.json({
        success: true,
        tableName: 'UDC',
        columns: columnsResult.recordset,
        sampleData: sampleResult.recordset
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Ispeziona struttura tabella LogOperazioni
  app.get('/debug/logoperazioni-structure', async (req, res) => {
    try {
      const pool = await getPool();

      const columnsResult = await pool.request().query(`
        SELECT
          COLUMN_NAME,
          DATA_TYPE,
          IS_NULLABLE,
          CHARACTER_MAXIMUM_LENGTH,
          NUMERIC_PRECISION,
          NUMERIC_SCALE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'LogOperazioni'
        ORDER BY ORDINAL_POSITION
      `);

      const sampleResult = await pool.request().query(`
        SELECT TOP 3 *
        FROM LogOperazioni
        ORDER BY Id DESC
      `);

      res.json({
        success: true,
        tableName: 'LogOperazioni',
        note: 'ATTENZIONE: Questa tabella è per LOG EVENTI, NON per le missioni!',
        totalColumns: columnsResult.recordset.length,
        columns: columnsResult.recordset,
        sampleDataCount: sampleResult.recordset.length,
        sampleData: sampleResult.recordset,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err.message,
        details: err.toString()
      });
    }
  });

  // ENDPOINT CRITICO: Ispeziona struttura MissioniTraslo
  app.get('/debug/missionitraslo-structure', async (req, res) => {
    try {
      const pool = await getPool();

      const tableCheck = await pool.request().query(`
        SELECT TABLE_NAME
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_NAME = 'MissioniTraslo'
      `);

      if (tableCheck.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Tabella MissioniTraslo non trovata nel database',
          suggestion: 'Verificare il nome corretto della tabella delle missioni'
        });
      }

      const columnsResult = await pool.request().query(`
        SELECT
          COLUMN_NAME,
          DATA_TYPE,
          IS_NULLABLE,
          CHARACTER_MAXIMUM_LENGTH,
          NUMERIC_PRECISION,
          NUMERIC_SCALE,
          COLUMN_DEFAULT
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'MissioniTraslo'
        ORDER BY ORDINAL_POSITION
      `);

      let sampleResult;
      try {
        sampleResult = await pool.request().query(`SELECT TOP 5 * FROM MissioniTraslo ORDER BY id DESC`);
      } catch (e1) {
        try {
          sampleResult = await pool.request().query(`SELECT TOP 5 * FROM MissioniTraslo ORDER BY Id DESC`);
        } catch (e2) {
          sampleResult = await pool.request().query(`SELECT TOP 5 * FROM MissioniTraslo`);
        }
      }

      const foreignKeysResult = await pool.request().query(`
        SELECT
          fk.name AS FK_Name,
          OBJECT_NAME(fk.parent_object_id) AS Table_Name,
          COL_NAME(fc.parent_object_id, fc.parent_column_id) AS Column_Name,
          OBJECT_NAME(fk.referenced_object_id) AS Referenced_Table,
          COL_NAME(fc.referenced_object_id, fc.referenced_column_id) AS Referenced_Column
        FROM sys.foreign_keys AS fk
        INNER JOIN sys.foreign_key_columns AS fc
          ON fk.object_id = fc.constraint_object_id
        WHERE OBJECT_NAME(fk.parent_object_id) = 'MissioniTraslo'
      `);

      res.json({
        success: true,
        tableName: 'MissioniTraslo',
        note: 'TABELLA CORRETTA per le operazioni missioni!',
        totalColumns: columnsResult.recordset.length,
        columns: columnsResult.recordset,
        foreignKeys: foreignKeysResult.recordset,
        sampleDataCount: sampleResult.recordset.length,
        sampleData: sampleResult.recordset,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err.message,
        details: err.toString()
      });
    }
  });

  // Ispeziona MissioniTrasloBuffer
  app.get('/debug/missionitraslobuffer-structure', async (req, res) => {
    try {
      const pool = await getPool();

      const tableCheck = await pool.request().query(`
        SELECT TABLE_NAME
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_NAME = 'MissioniTrasloBuffer'
      `);

      if (tableCheck.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Tabella MissioniTrasloBuffer non trovata'
        });
      }

      const columnsResult = await pool.request().query(`
        SELECT
          COLUMN_NAME,
          DATA_TYPE,
          IS_NULLABLE,
          CHARACTER_MAXIMUM_LENGTH,
          NUMERIC_PRECISION,
          NUMERIC_SCALE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'MissioniTrasloBuffer'
        ORDER BY ORDINAL_POSITION
      `);

      const sampleResult = await pool.request().query(`
        SELECT TOP 5 *
        FROM MissioniTrasloBuffer
        ORDER BY id DESC
      `);

      res.json({
        success: true,
        tableName: 'MissioniTrasloBuffer',
        totalColumns: columnsResult.recordset.length,
        columns: columnsResult.recordset,
        sampleDataCount: sampleResult.recordset.length,
        sampleData: sampleResult.recordset,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err.message,
        details: err.toString()
      });
    }
  });

  // Ispeziona LogMissioni
  app.get('/debug/logmissioni-structure', async (req, res) => {
    try {
      const pool = await getPool();

      const tableCheck = await pool.request().query(`
        SELECT TABLE_NAME
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_NAME = 'LogMissioni'
      `);

      if (tableCheck.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Tabella LogMissioni non trovata'
        });
      }

      const columnsResult = await pool.request().query(`
        SELECT
          COLUMN_NAME,
          DATA_TYPE,
          IS_NULLABLE,
          CHARACTER_MAXIMUM_LENGTH,
          NUMERIC_PRECISION,
          NUMERIC_SCALE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'LogMissioni'
        ORDER BY ORDINAL_POSITION
      `);

      const sampleResult = await pool.request().query(`
        SELECT TOP 10 *
        FROM LogMissioni
        ORDER BY id DESC
      `);

      res.json({
        success: true,
        tableName: 'LogMissioni',
        note: 'Tabella log eventi per le missioni',
        totalColumns: columnsResult.recordset.length,
        columns: columnsResult.recordset,
        sampleDataCount: sampleResult.recordset.length,
        sampleData: sampleResult.recordset,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err.message,
        details: err.toString()
      });
    }
  });

  // Riepilogo completo tabelle missioni
  app.get('/debug/missions-overview', async (req, res) => {
    try {
      const pool = await getPool();

      const overview = await pool.request().query(`
        SELECT
          'MissioniTraslo' AS TableName,
          COUNT(*) AS RecordCount,
          MAX(id) AS MaxId
        FROM MissioniTraslo

        UNION ALL

        SELECT
          'MissioniTrasloBuffer' AS TableName,
          COUNT(*) AS RecordCount,
          MAX(id) AS MaxId
        FROM MissioniTrasloBuffer

        UNION ALL

        SELECT
          'LogMissioni' AS TableName,
          COUNT(*) AS RecordCount,
          MAX(id) AS MaxId
        FROM LogMissioni

        UNION ALL

        SELECT
          'Liste' AS TableName,
          COUNT(*) AS RecordCount,
          MAX(id) AS MaxId
        FROM Liste

        UNION ALL

        SELECT
          'Macchine' AS TableName,
          COUNT(*) AS RecordCount,
          MAX(id) AS MaxId
        FROM Macchine

        UNION ALL

        SELECT
          'Articoli' AS TableName,
          COUNT(*) AS RecordCount,
          MAX(id) AS MaxId
        FROM Articoli

        UNION ALL

        SELECT
          'UDC' AS TableName,
          COUNT(*) AS RecordCount,
          MAX(id) AS MaxId
        FROM UDC
      `);

      res.json({
        success: true,
        note: 'Panoramica completa tabelle correlate alle missioni',
        tables: overview.recordset,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err.message,
        details: err.toString()
      });
    }
  });

  // Lista tutte le tabelle del database
  app.get('/debug/tables', async (req, res) => {
    try {
      const pool = await getPool();

      const result = await pool.request().query(`
        SELECT TABLE_NAME, TABLE_TYPE
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_NAME
      `);

      res.json({
        success: true,
        database: 'promag',
        tables: result.recordset
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
}

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use(notFoundHandler);

// Global error handler (deve essere l'ultimo middleware)
app.use(errorHandler);

// ============================================
// HTTPS SERVER START/STOP
// ============================================

const server = https.createServer(httpsOptions, app);

server.listen(PORT, () => {
  console.log('\n╔═══════════════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                           ║');
  console.log('║                   EjLog WMS REST API Server (HTTPS)                       ║');
  console.log('║                   with JWT Authentication                                 ║');
  console.log('║                   + Swagger Documentation                                 ║');
  console.log('║                   + WebSocket Real-Time Updates                           ║');
  console.log('║                                                                           ║');
  console.log('╠═══════════════════════════════════════════════════════════════════════════╣');
  console.log(`║  Server:        https://localhost:${PORT}                                    ║`);
  console.log(`║  API Docs:      https://localhost:${PORT}/api-docs                           ║`);
  console.log(`║  Health Check:  https://localhost:${PORT}/health                             ║`);
  console.log(`║  WebSocket:     wss://localhost:${PORT}/ws                                   ║`);
  console.log(`║  WS Stats:      https://localhost:${PORT}/websocket/stats                    ║`);
  console.log('║                                                                           ║');
  console.log('║  Database:      SQL Server (localhost\\SQL2019)                          ║');
  console.log('║  Database Name: promag                                                    ║');
  console.log('║  Environment:   development                                               ║');
  console.log('║                                                                           ║');
  console.log('║  SECURITY FEATURES:                                                       ║');
  console.log('║    🔐 HTTPS/SSL (Self-signed certificates)                                ║');
  console.log('║    🔑 JWT Authentication (REQUIRED on all /api/* endpoints)               ║');
  console.log('║    🛡️  Rate Limiting (brute force protection)                             ║');
  console.log('║    📋 Audit Trail (user activity logging)                                 ║');
  console.log('║    🔄 Token Refresh (7-day rotation)                                      ║');
  console.log('║    🚫 Token Revocation (logout support)                                   ║');
  console.log('║                                                                           ║');
  console.log('╠═══════════════════════════════════════════════════════════════════════════╣');
  console.log('║  SSL CERTIFICATES:                                                        ║');
  console.log(`║    Private Key: ${path.basename(keyPath).padEnd(56)} ║`);
  console.log(`║    Certificate: ${path.basename(certPath).padEnd(56)} ║`);
  console.log('║    Common Name: localhost                                                 ║');
  console.log('║    Valid for:   1 year                                                    ║');
  console.log('║    ⚠️  DEVELOPMENT ONLY - Self-signed certificates                        ║');
  console.log('║                                                                           ║');
  console.log('╠═══════════════════════════════════════════════════════════════════════════╣');
  console.log('║  BROWSER SETUP:                                                           ║');
  console.log('║    1. Navigate to https://localhost:3079                                  ║');
  console.log('║    2. Click "Advanced" or "More details"                                  ║');
  console.log('║    3. Click "Proceed to localhost" or "Accept the risk"                   ║');
  console.log('║    4. Login to get JWT token                                              ║');
  console.log('║    5. Use token in Authorization header: Bearer <token>                   ║');
  console.log('║                                                                           ║');
  console.log('╠═══════════════════════════════════════════════════════════════════════════╣');
  console.log('║  AUTHENTICATION:                                                          ║');
  console.log('║    Login:  POST https://localhost:3079/api/auth/login                     ║');
  console.log('║            Body: { username, password }                                   ║');
  console.log('║            Returns: { token, expiresIn: "8h", ... }                       ║');
  console.log('║                                                                           ║');
  console.log('║    Usage:  Add header to all protected requests:                          ║');
  console.log('║            Authorization: Bearer <your-jwt-token>                         ║');
  console.log('║                                                                           ║');
  console.log('║    Public Endpoints (no auth required):                                   ║');
  console.log('║      - POST /api/auth/login                                               ║');
  console.log('║      - POST /api/auth/refresh                                             ║');
  console.log('║      - GET  /health                                                       ║');
  console.log('║      - GET  /ready                                                        ║');
  console.log('║      - GET  /api-docs (Swagger UI)                                        ║');
  console.log('║                                                                           ║');
  console.log('╠═══════════════════════════════════════════════════════════════════════════╣');
  console.log('║  AVAILABLE ENDPOINTS:                                                     ║');
  console.log('╠═══════════════════════════════════════════════════════════════════════════╣');
  console.log('║  Authentication                                                           ║');
  console.log('║    POST   /api/auth/login                 (Public)                        ║');
  console.log('║    POST   /api/auth/logout                (Authenticated)                 ║');
  console.log('║    POST   /api/auth/refresh               (Public with refresh token)     ║');
  console.log('║                                                                           ║');
  console.log('║  Users (JWT Required)                                                     ║');
  console.log('║    GET    /api/users/search                                               ║');
  console.log('║    GET    /api/users/:id                                                  ║');
  console.log('║    POST   /api/users                                                      ║');
  console.log('║    PUT    /api/users/:id                                                  ║');
  console.log('║    DELETE /api/users/:id                                                  ║');
  console.log('║                                                                           ║');
  console.log('║  User Groups (JWT Required)                                               ║');
  console.log('║    GET    /api/user-groups                                                ║');
  console.log('║    GET    /api/user-groups/:id                                            ║');
  console.log('║    POST   /api/user-groups                                                ║');
  console.log('║    PUT    /api/user-groups/:id                                            ║');
  console.log('║    DELETE /api/user-groups/:id                                            ║');
  console.log('║                                                                           ║');
  console.log('║  Loading Units (JWT Required)                                             ║');
  console.log('║    GET    /api/loading-units                                              ║');
  console.log('║    GET    /api/loading-units/:id                                          ║');
  console.log('║    POST   /api/loading-units                                              ║');
  console.log('║    PUT    /api/loading-units/:id                                          ║');
  console.log('║    DELETE /api/loading-units/:id                                          ║');
  console.log('║                                                                           ║');
  console.log('║  Compartments (JWT Required)                                              ║');
  console.log('║    GET    /api/loading-units/:id/compartments                             ║');
  console.log('║    GET    /api/compartments/:id                                           ║');
  console.log('║    POST   /api/loading-units/:id/compartments                             ║');
  console.log('║    PUT    /api/compartments/:id                                           ║');
  console.log('║    DELETE /api/compartments/:id                                           ║');
  console.log('║                                                                           ║');
  console.log('║  Items (JWT Required)                                                     ║');
  console.log('║    GET    /api/items                                                      ║');
  console.log('║    GET    /api/items/:id                                                  ║');
  console.log('║    GET    /api/items/:id/stock                                            ║');
  console.log('║    POST   /api/items                                                      ║');
  console.log('║    PUT    /api/items/:id                                                  ║');
  console.log('║    DELETE /api/items/:id                                                  ║');
  console.log('║                                                                           ║');
  console.log('║  Item Lists (JWT Required)                                                ║');
  console.log('║    GET    /api/item-lists                                                 ║');
  console.log('║    GET    /api/item-lists/:id                                             ║');
  console.log('║    GET    /api/item-lists/:id/items                                       ║');
  console.log('║    POST   /api/item-lists                                                 ║');
  console.log('║    POST   /api/item-lists/:id/items                                       ║');
  console.log('║    PUT    /api/item-lists/:id                                             ║');
  console.log('║    DELETE /api/item-lists/:id                                             ║');
  console.log('║    DELETE /api/item-lists/:listId/items/:itemId                           ║');
  console.log('║                                                                           ║');
  console.log('║  Locations (JWT Required)                                                 ║');
  console.log('║    GET    /api/locations                                                  ║');
  console.log('║    GET    /api/locations/:id                                              ║');
  console.log('║    POST   /api/locations                                                  ║');
  console.log('║    PUT    /api/locations/:id                                              ║');
  console.log('║    DELETE /api/locations/:id                                              ║');
  console.log('║                                                                           ║');
  console.log('║  Operations (JWT Required)                                                ║');
  console.log('║    GET    /api/operations                                                 ║');
  console.log('║    GET    /api/operations/:id                                             ║');
  console.log('║    GET    /api/operations/:id/aggregate                                   ║');
  console.log('║    GET    /api/operations/by-params                                       ║');
  console.log('║    GET    /api/operations/reasons                                         ║');
  console.log('║    GET    /api/operations/available-orders                                ║');
  console.log('║    GET    /api/operations/extra-combo                                     ║');
  console.log('║    POST   /api/operations                                                 ║');
  console.log('║    POST   /api/operations/:id/execute                                     ║');
  console.log('║    POST   /api/operations/:id/complete                                    ║');
  console.log('║    POST   /api/operations/:id/suspend                                     ║');
  console.log('║    POST   /api/operations/send-id                                         ║');
  console.log('║    DELETE /api/operations/:id                                             ║');
  console.log('║                                                                           ║');
  console.log('║  DEBUG Endpoints (Development only, JWT Required)                         ║');
  console.log('║    GET    /debug/tables                                                   ║');
  console.log('║    GET    /debug/udc-structure                                            ║');
  console.log('║    GET    /debug/logoperazioni-structure                                  ║');
  console.log('║    GET    /debug/missionitraslo-structure                                 ║');
  console.log('║    GET    /debug/missionitraslobuffer-structure                           ║');
  console.log('║    GET    /debug/logmissioni-structure                                    ║');
  console.log('║    GET    /debug/missions-overview                                        ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════╝\n');

  // Inizializza WebSocket server
  initWebSocketServer(server);
});

// Graceful shutdown
const shutdown = async () => {
  console.log('\n🛑 Arresto server HTTPS in corso...');

  server.close(async () => {
    console.log('✅ Server HTTPS chiuso');

    // Ferma WebSocket server
    stopWebSocketServer();

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
  console.error('Promise:', promise);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  shutdown();
});

export default app;

