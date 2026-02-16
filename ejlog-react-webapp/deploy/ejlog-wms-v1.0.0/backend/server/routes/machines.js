/**
 * Routes per gestione macchine
 * Connessione diretta a tabella Macchine
 *
 * SCHEMA REALE DATABASE:
 * Tabella Macchine: id, descrizioneBOS, activo
 */

import express from 'express';
import { sql, getPool } from '../db-config.js';

const router = express.Router();

/**
 * GET /api/machines
 * Ottiene tutte le macchine attive ordinate per id
 * NOTA: Restituisce array vuoto se la tabella non esiste
 */
router.get('/', async (req, res) => {
  try {
    const pool = await getPool();

    // Check if table exists first
    const tableCheck = await pool.request().query(`
      SELECT OBJECT_ID('Macchine', 'U') AS TableExists
    `);

    if (!tableCheck.recordset[0].TableExists) {
      // Table doesn't exist, return empty array
      console.warn('[Machines] Tabella Macchine non esiste nel database');
      return res.json({
        success: true,
        data: []
      });
    }

    // Check table structure to see what columns exist
    const columnsCheck = await pool.request().query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'Macchine'
    `);

    const columns = columnsCheck.recordset.map(r => r.COLUMN_NAME);
    console.log('[Machines] Colonne disponibili:', columns);

    // If required columns don't exist, return empty array
    if (!columns.includes('id')) {
      console.warn('[Machines] Colonne richieste (id, descrizioneBOS, activo) non trovate. Disponibili:', columns);
      return res.json({
        success: true,
        data: []
      });
    }

    // Build dynamic query based on available columns
    let query = 'SELECT id';

    if (columns.includes('descrizioneBOS')) {
      query += ', descrizioneBOS AS description';
    } else if (columns.includes('descrizione')) {
      query += ', descrizione AS description';
    } else if (columns.includes('nome')) {
      query += ', nome AS description';
    } else {
      query += ', CAST(id AS VARCHAR) AS description';
    }

    if (columns.includes('activo')) {
      query += ', CAST(activo AS bit) AS active FROM Macchine WHERE activo = 1';
    } else if (columns.includes('attivo')) {
      query += ', CAST(attivo AS bit) AS active FROM Macchine WHERE attivo = 1';
    } else if (columns.includes('enabled')) {
      query += ', CAST(enabled AS bit) AS active FROM Macchine WHERE enabled = 1';
    } else {
      query += ', CAST(1 AS bit) AS active FROM Macchine';
    }

    query += ' ORDER BY id';

    console.log('[Machines] Query dinamica:', query);
    const result = await pool.request().query(query);

    res.json({
      success: true,
      data: result.recordset
    });

  } catch (error) {
    console.error('⚠️  Errore recupero macchine:', error.message);
    res.json({
      success: true,
      data: [] // Return empty array on error to avoid breaking the UI
    });
  }
});

/**
 * GET /api/machines/:id
 * Ottiene dettagli di una singola macchina
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();

    // Check if table exists
    const tableCheck = await pool.request().query(`
      SELECT OBJECT_ID('Macchine', 'U') AS TableExists
    `);

    if (!tableCheck.recordset[0].TableExists) {
      return res.status(404).json({
        success: false,
        error: 'Tabella Macchine non esiste'
      });
    }

    // Check available columns
    const columnsCheck = await pool.request().query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'Macchine'
    `);

    const columns = columnsCheck.recordset.map(r => r.COLUMN_NAME);

    // Build dynamic query
    let query = 'SELECT id';

    if (columns.includes('descrizioneBOS')) {
      query += ', descrizioneBOS AS description';
    } else if (columns.includes('descrizione')) {
      query += ', descrizione AS description';
    } else if (columns.includes('nome')) {
      query += ', nome AS description';
    } else {
      query += ', CAST(id AS VARCHAR) AS description';
    }

    if (columns.includes('activo')) {
      query += ', CAST(activo AS bit) AS active';
    } else if (columns.includes('attivo')) {
      query += ', CAST(attivo AS bit) AS active';
    } else if (columns.includes('enabled')) {
      query += ', CAST(enabled AS bit) AS active';
    } else {
      query += ', CAST(1 AS bit) AS active';
    }

    query += ' FROM Macchine WHERE id = @id';

    const result = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Macchina non trovata'
      });
    }

    res.json({
      success: true,
      data: result.recordset[0]
    });

  } catch (error) {
    console.error('⚠️  Errore recupero macchina:', error.message);
    res.status(500).json({
      success: false,
      error: 'Errore durante il recupero della macchina',
      details: error.message
    });
  }
});

export default router;
