/**
 * Database Configuration Routes
 * Read/write SQL Server connection settings used by db-config.js
 */

import express from 'express';
import { readFileSync, writeFileSync } from 'fs';
import { closePool, sql } from '../db-config.js';

const router = express.Router();
const CONFIG_URL = new URL('../config/server-config.json', import.meta.url);

const DEFAULT_CONFIG = {
  server: 'localhost\\SQL2019',
  database: 'promag',
  user: 'sa',
  password: '',
  port: null,
};

const readConfigFile = () => {
  const raw = readFileSync(CONFIG_URL, 'utf8');
  return JSON.parse(raw);
};

const loadDbConfig = () => {
  try {
    const config = readConfigFile();
    const databaseConfig = config?.servers?.sqlBackend?.database || {};
    return {
      server: databaseConfig.server || DEFAULT_CONFIG.server,
      database: databaseConfig.database || DEFAULT_CONFIG.database,
      user: databaseConfig.user || DEFAULT_CONFIG.user,
      password: databaseConfig.password || DEFAULT_CONFIG.password,
      port: databaseConfig.port ?? DEFAULT_CONFIG.port,
    };
  } catch (error) {
    console.error('[DB Config] Failed to load config:', error.message);
    return { ...DEFAULT_CONFIG };
  }
};

const normalizeServer = (value, host = 'localhost') => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  if (trimmed.includes('\\') || trimmed.includes(',') || trimmed.includes(':')) {
    return trimmed;
  }
  return `${host}\\${trimmed}`;
};

const buildResponse = (server, database, user, password, port) => {
  const [host, instanceName] = server.split('\\');
  return {
    server,
    database,
    user,
    port: port ?? null,
    host: instanceName ? host : null,
    instanceName: instanceName || null,
    hasPassword: Boolean(password),
  };
};

const buildSqlConfig = ({ server, database, user, password, port }) => ({
  user,
  password,
  server,
  database,
  port: port ?? undefined,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: {
    max: 1,
    min: 0,
    idleTimeoutMillis: 5000,
  },
});

/**
 * GET /api/db-config
 */
router.get('/', (_req, res) => {
  const { server, database, user, password, port } = loadDbConfig();
  res.json({
    success: true,
    config: buildResponse(server, database, user, password, port),
  });
});

/**
 * PUT /api/db-config
 * Body: { server?: string, instanceName?: string, host?: string, database?: string, user?: string, password?: string, port?: number }
 */
router.put('/', async (req, res) => {
  try {
    const { server, instanceName, host, database, user, password, port } = req.body || {};
    const resolvedServer = normalizeServer(server || instanceName, host || 'localhost');

    if (!resolvedServer) {
      return res.status(400).json({
        success: false,
        message: 'Server SQL non valido',
      });
    }

    const config = readConfigFile();
    if (!config.servers) config.servers = {};
    if (!config.servers.sqlBackend) config.servers.sqlBackend = {};
    if (!config.servers.sqlBackend.database) config.servers.sqlBackend.database = {};

    config.servers.sqlBackend.database.server = resolvedServer;
    config.servers.sqlBackend.database.database =
      database || config.servers.sqlBackend.database.database || DEFAULT_CONFIG.database;
    if (user) {
      config.servers.sqlBackend.database.user = user;
    } else if (!config.servers.sqlBackend.database.user) {
      config.servers.sqlBackend.database.user = DEFAULT_CONFIG.user;
    }
    if (password !== undefined) {
      if (String(password).length > 0) {
        config.servers.sqlBackend.database.password = password;
      }
    }
    if (port !== undefined && port !== null && String(port) !== '') {
      const numericPort = Number(port);
      config.servers.sqlBackend.database.port = Number.isFinite(numericPort) ? numericPort : null;
    }

    writeFileSync(CONFIG_URL, JSON.stringify(config, null, 2), 'utf8');

    await closePool();

    return res.json({
      success: true,
      message: 'Configurazione database aggiornata',
      config: buildResponse(
        config.servers.sqlBackend.database.server,
        config.servers.sqlBackend.database.database,
        config.servers.sqlBackend.database.user || DEFAULT_CONFIG.user,
        config.servers.sqlBackend.database.password || '',
        config.servers.sqlBackend.database.port ?? null
      ),
    });
  } catch (error) {
    console.error('[DB Config] Update error:', error);
    return res.status(500).json({
      success: false,
      message: 'Errore durante il salvataggio della configurazione',
      error: error.message,
    });
  }
});

/**
 * POST /api/db-config/test
 * Body: { server?: string, instanceName?: string, host?: string, database?: string, user?: string, password?: string, port?: number }
 */
router.post('/test', async (req, res) => {
  try {
    const { server, instanceName, host, database, user, password, port } = req.body || {};
    const current = loadDbConfig();
    const resolvedServer = normalizeServer(server || instanceName || current.server, host || 'localhost');
    const resolvedConfig = {
      server: resolvedServer,
      database: database || current.database,
      user: user || current.user,
      password: password || current.password,
      port: port ?? current.port,
    };

    const pool = await new sql.ConnectionPool(buildSqlConfig(resolvedConfig)).connect();
    await pool.request().query('SELECT 1 as ok');
    await pool.close();

    return res.json({
      success: true,
      message: 'Connessione SQL riuscita',
      config: buildResponse(
        resolvedConfig.server,
        resolvedConfig.database,
        resolvedConfig.user,
        resolvedConfig.password,
        resolvedConfig.port
      ),
    });
  } catch (error) {
    console.error('[DB Config] Test connection error:', error);
    return res.status(500).json({
      success: false,
      message: 'Connessione SQL fallita',
      error: error.message,
    });
  }
});

export default router;
