/**
 * Routes per gestione storico accessi (Login History)
 * Traccia tutti i tentativi di login (riusciti e falliti)
 *
 * TABELLA DATABASE (creata automaticamente se non esiste):
 * StoricoLogin: id, username, attemptTimestamp, ipAddress, success, failureReason, userAgent
 */

import express from 'express';
import { sql, getPool } from '../db-config.js';

const router = express.Router();

/**
 * Crea la tabella StoricoLogin se non esiste
 */
async function ensureLoginHistoryTable() {
  try {
    const pool = await getPool();

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='StoricoLogin' AND xtype='U')
      BEGIN
        CREATE TABLE StoricoLogin (
          id INT PRIMARY KEY IDENTITY(1,1),
          username NVARCHAR(50) NOT NULL,
          attemptTimestamp DATETIME2 NOT NULL DEFAULT GETDATE(),
          ipAddress NVARCHAR(50),
          success BIT NOT NULL,
          failureReason NVARCHAR(255),
          userAgent NVARCHAR(500),
          INDEX idx_username (username),
          INDEX idx_timestamp (attemptTimestamp DESC),
          INDEX idx_success (success)
        );
        PRINT 'Tabella StoricoLogin creata con successo';
      END
    `);

  } catch (error) {
    console.error('Errore creazione tabella StoricoLogin:', error);
  }
}

// Inizializza tabella all'avvio
ensureLoginHistoryTable();

/**
 * GET /api/login-history
 * Ottiene lo storico login con filtri opzionali
 * Query params: username, dateFrom, dateTo, successOnly, failedOnly, limit, offset
 */
router.get('/', async (req, res) => {
  try {
    const {
      username,
      dateFrom,
      dateTo,
      successOnly,
      failedOnly,
      limit = 50,
      offset = 0
    } = req.query;

    const pool = await getPool();
    const request = pool.request();

    let query = `
      SELECT
        id,
        username,
        attemptTimestamp,
        ipAddress,
        success,
        failureReason,
        userAgent
      FROM StoricoLogin
      WHERE 1=1
    `;

    // Filtro per username
    if (username) {
      query += ` AND username LIKE @username`;
      request.input('username', sql.NVarChar, `%${username}%`);
    }

    // Filtro per data inizio
    if (dateFrom) {
      query += ` AND attemptTimestamp >= @dateFrom`;
      request.input('dateFrom', sql.DateTime2, new Date(dateFrom));
    }

    // Filtro per data fine
    if (dateTo) {
      query += ` AND attemptTimestamp <= @dateTo`;
      request.input('dateTo', sql.DateTime2, new Date(dateTo));
    }

    // Filtro solo successi
    if (successOnly === 'true') {
      query += ` AND success = 1`;
    }

    // Filtro solo fallimenti
    if (failedOnly === 'true') {
      query += ` AND success = 0`;
    }

    // Ordinamento e paginazione
    query += `
      ORDER BY attemptTimestamp DESC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;

    request.input('offset', sql.Int, parseInt(offset));
    request.input('limit', sql.Int, parseInt(limit));

    const result = await request.query(query);

    // Conta totale
    let countQuery = `SELECT COUNT(*) as total FROM StoricoLogin WHERE 1=1`;
    const countRequest = pool.request();

    if (username) {
      countQuery += ` AND username LIKE @username`;
      countRequest.input('username', sql.NVarChar, `%${username}%`);
    }
    if (dateFrom) {
      countQuery += ` AND attemptTimestamp >= @dateFrom`;
      countRequest.input('dateFrom', sql.DateTime2, new Date(dateFrom));
    }
    if (dateTo) {
      countQuery += ` AND attemptTimestamp <= @dateTo`;
      countRequest.input('dateTo', sql.DateTime2, new Date(dateTo));
    }
    if (successOnly === 'true') {
      countQuery += ` AND success = 1`;
    }
    if (failedOnly === 'true') {
      countQuery += ` AND success = 0`;
    }

    const countResult = await countRequest.query(countQuery);
    const total = countResult.recordset[0].total;

    res.json({
      data: result.recordset,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < total
      }
    });

  } catch (error) {
    console.error('Errore recupero storico login:', error);
    res.status(500).json({
      error: 'Errore durante il recupero dello storico login',
      details: error.message
    });
  }
});

/**
 * GET /api/login-history/stats
 * Statistiche sugli accessi
 */
router.get('/stats', async (req, res) => {
  try {
    const { username, days = 7 } = req.query;
    const pool = await getPool();
    const request = pool.request();

    let whereClause = `WHERE attemptTimestamp >= DATEADD(day, -@days, GETDATE())`;
    request.input('days', sql.Int, parseInt(days));

    if (username) {
      whereClause += ` AND username LIKE @username`;
      request.input('username', sql.NVarChar, `%${username}%`);
    }

    const statsQuery = `
      SELECT
        COUNT(*) as totalAttempts,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successfulLogins,
        SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failedLogins,
        COUNT(DISTINCT username) as uniqueUsers,
        COUNT(DISTINCT ipAddress) as uniqueIPs
      FROM StoricoLogin
      ${whereClause}
    `;

    const result = await request.query(statsQuery);

    // Top 5 utenti con più tentativi falliti
    const request2 = pool.request();
    request2.input('days', sql.Int, parseInt(days));

    const topFailedQuery = `
      SELECT TOP 5
        username,
        COUNT(*) as failedAttempts,
        MAX(attemptTimestamp) as lastFailedAttempt
      FROM StoricoLogin
      WHERE attemptTimestamp >= DATEADD(day, -@days, GETDATE())
        AND success = 0
      GROUP BY username
      ORDER BY COUNT(*) DESC
    `;

    const topFailedResult = await request2.query(topFailedQuery);

    res.json({
      stats: result.recordset[0],
      topFailedUsers: topFailedResult.recordset
    });

  } catch (error) {
    console.error('Errore recupero statistiche login:', error);
    res.status(500).json({
      error: 'Errore durante il recupero delle statistiche',
      details: error.message
    });
  }
});

/**
 * POST /api/login-history
 * Registra un nuovo tentativo di login
 * Body: { username, success, failureReason?, ipAddress?, userAgent? }
 */
router.post('/', async (req, res) => {
  try {
    const {
      username,
      success,
      failureReason = null,
      ipAddress = null,
      userAgent = null
    } = req.body;

    if (!username || success === undefined) {
      return res.status(400).json({
        error: 'Campi obbligatori mancanti: username, success'
      });
    }

    const pool = await getPool();

    const result = await pool.request()
      .input('username', sql.NVarChar, username)
      .input('success', sql.Bit, success)
      .input('failureReason', sql.NVarChar, failureReason)
      .input('ipAddress', sql.NVarChar, ipAddress)
      .input('userAgent', sql.NVarChar, userAgent)
      .query(`
        INSERT INTO StoricoLogin (username, success, failureReason, ipAddress, userAgent)
        OUTPUT INSERTED.id, INSERTED.attemptTimestamp
        VALUES (@username, @success, @failureReason, @ipAddress, @userAgent)
      `);

    res.status(201).json({
      message: 'Login attempt logged',
      id: result.recordset[0].id,
      timestamp: result.recordset[0].attemptTimestamp
    });

  } catch (error) {
    console.error('Errore registrazione login attempt:', error);
    res.status(500).json({
      error: 'Errore durante la registrazione del tentativo di login',
      details: error.message
    });
  }
});

/**
 * DELETE /api/login-history/old
 * Elimina record vecchi (data retention)
 * Query params: days (default: 90)
 */
router.delete('/old', async (req, res) => {
  try {
    const { days = 90 } = req.query;
    const pool = await getPool();

    const result = await pool.request()
      .input('days', sql.Int, parseInt(days))
      .query(`
        DELETE FROM StoricoLogin
        WHERE attemptTimestamp < DATEADD(day, -@days, GETDATE())
      `);

    res.json({
      message: `Records più vecchi di ${days} giorni eliminati`,
      rowsAffected: result.rowsAffected[0]
    });

  } catch (error) {
    console.error('Errore eliminazione record vecchi:', error);
    res.status(500).json({
      error: 'Errore durante l\'eliminazione dei record vecchi',
      details: error.message
    });
  }
});

export default router;
