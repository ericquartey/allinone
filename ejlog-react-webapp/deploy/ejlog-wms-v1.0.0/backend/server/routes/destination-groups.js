/**
 * Routes per gestione gruppi di destinazione
 * Connessione diretta a tabella GruppiDestinazione
 *
 * SCHEMA REALE DATABASE:
 * Tabella GruppiDestinazione: id, descrizione, activo
 */

import express from 'express';
import { sql, getPool } from '../db-config.js';

const router = express.Router();

/**
 * GET /api/destination-groups
 * Ottiene tutti i gruppi di destinazione attivi ordinati per id
 * NOTA: Restituisce array vuoto se la tabella non esiste
 */
router.get('/', async (req, res) => {
  try {
    const pool = await getPool();

    // Check if table exists first
    const tableCheck = await pool.request().query(`
      SELECT OBJECT_ID('GruppiDestinazione', 'U') AS TableExists
    `);

    if (!tableCheck.recordset[0].TableExists) {
      // Table doesn't exist, return empty array
      return res.json({
        success: true,
        data: []
      });
    }

    const result = await pool.request().query(`
      SELECT
        id,
        descrizione AS description,
        CAST(activo AS bit) AS active
      FROM GruppiDestinazione
      WHERE activo = 1
      ORDER BY id
    `);

    res.json({
      success: true,
      data: result.recordset
    });

  } catch (error) {
    console.error('Errore recupero gruppi destinazione:', error);
    res.json({
      success: true,
      data: [] // Return empty array on error to avoid breaking the UI
    });
  }
});

/**
 * GET /api/destination-groups/:id
 * Ottiene dettagli di un singolo gruppo
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();

    const result = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query(`
        SELECT
          id,
          descrizione AS description,
          CAST(activo AS bit) AS active
        FROM GruppiDestinazione
        WHERE id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Gruppo di destinazione non trovato'
      });
    }

    res.json({
      success: true,
      data: result.recordset[0]
    });

  } catch (error) {
    console.error('Errore recupero gruppo destinazione:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante il recupero del gruppo di destinazione',
      details: error.message
    });
  }
});

export default router;
