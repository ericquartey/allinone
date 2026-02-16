/**
 * Configurazione database SQL Server
 * Database: promag su localhost\SQL2019
 */

import sql from 'mssql';
import { readFileSync } from 'fs';

const DEFAULT_DB_CONFIG = {
  user: 'sa',
  password: 'fergrp_2012',
  server: 'localhost\\sql2019',
  database: 'promag',
  port: null,
};

const loadFileConfig = () => {
  try {
    const raw = readFileSync(new URL('./config/server-config.json', import.meta.url), 'utf8');
    const parsed = JSON.parse(raw);
    const databaseConfig = parsed?.servers?.sqlBackend?.database || {};
    return {
      server: databaseConfig.server || DEFAULT_DB_CONFIG.server,
      database: databaseConfig.database || DEFAULT_DB_CONFIG.database,
      user: databaseConfig.user || DEFAULT_DB_CONFIG.user,
      password: databaseConfig.password || DEFAULT_DB_CONFIG.password,
      port: databaseConfig.port ?? DEFAULT_DB_CONFIG.port,
    };
  } catch (error) {
    console.error('[DB Config] Failed to load server-config.json:', error.message);
    return {
      server: DEFAULT_DB_CONFIG.server,
      database: DEFAULT_DB_CONFIG.database,
      user: DEFAULT_DB_CONFIG.user,
      password: DEFAULT_DB_CONFIG.password,
      port: DEFAULT_DB_CONFIG.port,
    };
  }
};

const resolveDbConfig = () => {
  const fileConfig = loadFileConfig();

  return {
    user: process.env.DB_USER || fileConfig.user || DEFAULT_DB_CONFIG.user,
    password: process.env.DB_PASSWORD || fileConfig.password || DEFAULT_DB_CONFIG.password,
    server: process.env.DB_SERVER || fileConfig.server,
    database: process.env.DB_NAME || fileConfig.database,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : fileConfig.port,
    options: {
      encrypt: false,
      trustServerCertificate: true,
      enableArithAbort: true
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000
    }
  };
};

// Pool di connessioni condiviso
let poolPromise;

/**
 * Ottiene il pool di connessioni SQL Server
 * @returns {Promise<sql.ConnectionPool>}
 */
export const getPool = async () => {
  if (!poolPromise) {
    const dbConfig = resolveDbConfig();
    poolPromise = new sql.ConnectionPool(dbConfig)
      .connect()
      .then(pool => {
        console.log(`Connected to SQL Server - Database: ${dbConfig.database}`);
        return pool;
      })
      .catch(err => {
        console.error('Error connecting to SQL Server:', err);
        poolPromise = null;
        throw err;
      });
  }
  return poolPromise;
};

/**
 * Chiude il pool di connessioni
 */
export const closePool = async () => {
  if (poolPromise) {
    const pool = await poolPromise;
    await pool.close();
    poolPromise = null;
    console.log('SQL Server connection closed');
  }
};

export { sql };
