/**
 * Configurazione database SQL Server
 * Database: promag su localhost\SQL2019
 */

import sql from 'mssql';

// Configurazione connessione SQL Server
const dbConfig = {
  user: 'sa',
  password: 'fergrp_2012',
  server: 'localhost\\SQL2019',
  database: 'promag',
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

// Pool di connessioni condiviso
let poolPromise;

/**
 * Ottiene il pool di connessioni SQL Server
 * @returns {Promise<sql.ConnectionPool>}
 */
export const getPool = async () => {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(dbConfig)
      .connect()
      .then(pool => {
        console.log('✅ Connesso a SQL Server - Database: promag');
        return pool;
      })
      .catch(err => {
        console.error('❌ Errore connessione SQL Server:', err);
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
    console.log('🔌 Connessione SQL Server chiusa');
  }
};

export { sql };
