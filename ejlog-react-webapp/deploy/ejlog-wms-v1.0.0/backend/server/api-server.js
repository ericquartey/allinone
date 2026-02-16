/**
 * EjLog API Server (HTTP)
 *
 * Restituisce tutte le API REST con Swagger UI e integra lo Scheduler/Prenotatore.
 * Questa versione usa smartAuth (auth opzionale in dev) e monta tutte le route
 * note del progetto.
 */

import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { getPool, closePool } from './db-config.js';
import { initWebSocketServer, stopWebSocketServer, getWebSocketStats } from './websocket-server.js';

// Middleware
import { errorHandler, notFoundHandler, requestLogger } from './middleware/error-handler.js';
import { rateLimiter } from './middleware/rate-limiter.js';
import { auditLogger } from './middleware/audit-logger.js';
import { smartAuth } from './middleware/production-auth.js';

// Routes
import authRoutes from './routes/auth-enhanced.js';
import authRefreshRoutes from './routes/auth-refresh.js';
import usersRoutes from './routes/users.js';
import groupsRoutes from './routes/groups.js';
import loginHistoryRoutes from './routes/login-history.js';
import barcodeRulesRoutes from './routes/barcode-rules.js';
import customReportsRoutes from './routes/custom-reports.js';
import dashboardConfigRoutes from './routes/dashboard-config.js';
import userManagementRoutes from './routes/user-management.js';
import auditLogRoutes from './routes/audit-log.js';
import dataExportImportRoutes from './routes/data-export-import.js';
import reportSchedulerRoutes from './routes/report-scheduler.js';
import notificationsRoutes from './routes/notifications.js';
import userStatsRoutes from './routes/user-stats.js';
import loadingUnitsRoutes from './routes/loading-units-new.js';
import loadingUnitsLegacyRoutes from './routes/loading-units.js';
import compartmentsRoutes from './routes/compartments.js';
import itemsRoutes from './routes/items.js';
import itemListsRoutes from './routes/item-lists.js';
import locationsRoutes from './routes/locations.js';
import udcRoutes from './routes/udc.js';
import stockRoutes from './routes/stock.js';
import stockMovementsRoutes from './routes/stock-movements.js';
import eventsRoutes from './routes/events.js';
import listsRoutes from './routes/lists.js';
import listsSafeRoutes from './routes/lists-safe.js';
import operationsRoutes from './routes/operations.js';
import missionsRoutes from './routes/missions.js';
import analyticsRoutes from './routes/analytics.js';
import barcodeScannerRoutes from './routes/barcode-scanner.js';
import ptlRoutes from './routes/ptl.js';
import ptlConfigRoutes from './routes/ptl-config.js';
import schedulerConfigRoutes from './routes/scheduler-config.js';
import schedulerStatusRoutes from './routes/scheduler-status.js';
import schedulerLogicsRoutes from './routes/scheduler-logics.js';
import destinationGroupsRoutes from './routes/destination-groups.js';
import machinesRoutes from './routes/machines.js';

// Scheduler
import SchedulerService from './scheduler/scheduler.service.js';
import { initSchedulerRoutes, setSchedulerService } from './routes/scheduler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3077;
const API_PREFIX = '/api';

// ============================================
// SWAGGER CONFIGURATION
// ============================================

const swaggerDocument = YAML.load(path.join(__dirname, 'swagger', 'swagger.yaml'));

const swaggerOptions = {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #1976d2; }
  `,
  customSiteTitle: 'EjLog WMS API Documentation',
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

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3004',
    'http://localhost:5173',
    'http://localhost:8080'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);
app.use(rateLimiter);
app.use(auditLogger);

// ============================================
// SWAGGER UI
// ============================================

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions));
app.get('/', (_req, res) => res.redirect('/api-docs'));
app.get('/swagger-ui.html', (_req, res) => res.redirect('/api-docs'));

// ============================================
// HEALTH CHECKS
// ============================================

app.get('/health', async (_req, res) => {
  try {
    const pool = await getPool();
    await pool.request().query('SELECT 1 AS test');
    res.json({ success: true, status: 'healthy', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({ success: false, status: 'unhealthy', error: error.message });
  }
});

app.get('/websocket/stats', (_req, res) => {
  const stats = getWebSocketStats();
  res.json({ success: true, websocket: stats, timestamp: new Date().toISOString() });
});

// ============================================
// API ROUTES
// ============================================

app.use(API_PREFIX, smartAuth);

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/auth`, authRefreshRoutes);
app.use(`${API_PREFIX}/users`, usersRoutes);
app.use(`${API_PREFIX}/user-groups`, groupsRoutes);
app.use(`${API_PREFIX}/login-history`, loginHistoryRoutes);
app.use(`${API_PREFIX}/barcodes`, barcodeRulesRoutes);
app.use(`${API_PREFIX}/reports`, customReportsRoutes);
app.use(`${API_PREFIX}/dashboard`, dashboardConfigRoutes);
app.use(`${API_PREFIX}/users`, userManagementRoutes);
app.use(`${API_PREFIX}/audit`, auditLogRoutes);
app.use(`${API_PREFIX}/data-export-import`, dataExportImportRoutes);
app.use(`${API_PREFIX}/report-scheduler`, reportSchedulerRoutes);
app.use(`${API_PREFIX}/notifications`, notificationsRoutes);
app.use(`${API_PREFIX}/user-stats`, userStatsRoutes);

app.use(`${API_PREFIX}/loading-units`, loadingUnitsRoutes);
app.use('/EjLogHostVertimag/api/loading-units', loadingUnitsLegacyRoutes);

app.use(`${API_PREFIX}/compartments`, compartmentsRoutes);
app.use(`${API_PREFIX}/udc`, udcRoutes);
app.use(`${API_PREFIX}/items`, itemsRoutes);
app.use('/EjLogHostVertimag/Items', itemsRoutes);
app.use(`${API_PREFIX}/item-lists`, itemListsRoutes);
app.use(`${API_PREFIX}/locations`, locationsRoutes);
app.use('/EjLogHostVertimag/Locations', locationsRoutes);
app.use(`${API_PREFIX}/stock`, stockRoutes);
app.use('/EjLogHostVertimag/Stock', stockRoutes);
app.use(`${API_PREFIX}/stock-movements`, stockMovementsRoutes);
app.use(`${API_PREFIX}/events`, eventsRoutes);
app.use('/EjLogHostVertimag/Events', eventsRoutes);
app.use(`${API_PREFIX}/lists`, listsRoutes);
app.use('/EjLogHostVertimag/Lists', listsRoutes);
app.use(`${API_PREFIX}/lists-safe`, listsSafeRoutes);
app.use(`${API_PREFIX}/operations`, operationsRoutes);
app.use(`${API_PREFIX}/missions`, missionsRoutes);
app.use(`${API_PREFIX}/analytics`, analyticsRoutes);
app.use(`${API_PREFIX}/barcode`, barcodeScannerRoutes);
app.use(`${API_PREFIX}/ptl`, ptlRoutes);
app.use(`${API_PREFIX}/ptl-config`, ptlConfigRoutes);
app.use(`${API_PREFIX}/scheduler-config`, schedulerConfigRoutes);
app.use(`${API_PREFIX}/scheduler-status`, schedulerStatusRoutes);
app.use(`${API_PREFIX}/scheduler-logics`, schedulerLogicsRoutes);
app.use(`${API_PREFIX}/destination-groups`, destinationGroupsRoutes);
app.use(`${API_PREFIX}/machines`, machinesRoutes);

// ============================================
// SCHEDULER SERVICE
// ============================================

const schedulerConfigData = JSON.parse(readFileSync(new URL('./config/scheduler-config.json', import.meta.url)));
const schedulerConfig = schedulerConfigData.scheduler;
let schedulerService = null;

const schedulerRouter = initSchedulerRoutes();
app.use(`${API_PREFIX}/scheduler`, schedulerRouter);

(async () => {
  try {
    const pool = await getPool();
    schedulerService = new SchedulerService(schedulerConfig, pool);
    setSchedulerService(schedulerService);
    console.log('[SchedulerService] Created successfully');

    // Initialize coordinator and start scheduler based on leadership
    await schedulerService.init();
    console.log('[SchedulerService] Coordinator initialized and leader election completed');

    console.log('[SchedulerService] Routes registered at /api/scheduler/*');
  } catch (error) {
    console.error('[SchedulerService] Initialization error:', error);
    console.error('[SchedulerService] Scheduler will not be available');
  }
})();

// ============================================
// DEBUG (development)
// ============================================

if (process.env.NODE_ENV !== 'production') {
  app.get('/debug/tables', async (_req, res) => {
    try {
      const pool = await getPool();
      const result = await pool.request().query(`
        SELECT TABLE_NAME, TABLE_TYPE
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_NAME
      `);
      res.json({ success: true, database: 'promag', tables: result.recordset });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
}

// ============================================
// ERROR HANDLING
// ============================================

app.use(notFoundHandler);
app.use(errorHandler);

// ============================================
// SERVER START
// ============================================

const server = app.listen(PORT, () => {
  const bannerLine = '='.repeat(70);
  console.log('\n' + bannerLine);
  console.log('  EjLog WMS REST API Server');
  console.log(bannerLine);
  console.log(`  Server:        http://localhost:${PORT}`);
  console.log(`  API Docs:      http://localhost:${PORT}/api-docs`);
  console.log(`  Health Check:  http://localhost:${PORT}/health`);
  console.log(`  WebSocket:     ws://localhost:${PORT}/ws`);
  console.log(`  Database:      SQL Server (localhost\\SQL2019) - promag`);
  console.log(`  Environment:   ${process.env.NODE_ENV || 'development'}`);
  console.log(bannerLine);
  console.log('  Scheduler endpoints: /api/scheduler/*');
  console.log(bannerLine);

  initWebSocketServer(server);
});

// Graceful shutdown
const shutdown = async () => {
  console.log('\n[SERVER] Shutdown in progress...');

  server.close(async () => {
    console.log('[SERVER] HTTP server closed');

    if (schedulerService) {
      try {
        await schedulerService.shutdown();
        console.log('[SERVER] Scheduler service shutdown completed');
      } catch (error) {
        console.error('[SERVER] Error during scheduler shutdown:', error);
      }
    }

    stopWebSocketServer();
    await closePool();

    console.log('[SERVER] Goodbye!\n');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('[SERVER] Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

process.on('unhandledRejection', (reason, promise) => {
  console.error('[SERVER] Unhandled Rejection:', reason);
  console.error('Promise:', promise);
});

process.on('uncaughtException', (error) => {
  console.error('[SERVER] Uncaught Exception:', error);
  shutdown();
});

export default app;


