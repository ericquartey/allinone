/**
 * Locations Routes
 * Endpoints per ubicazioni (Locazioni) - CRUD + Operations
 * Schema reale database SQL Server - EjLog WMS
 */

import express from 'express';
import { getPool } from '../db-config.js';
import { asyncHandler } from '../middleware/error-handler.js';
import { validateId, validatePagination } from '../middleware/validator.js';
import {
  getLocations,
  getLocationById,
  getLocationUdcs
} from '../controllers/locations.controller.js';

const router = express.Router();

// GET /api/locations - Lista ubicazioni con filtri
router.get('/',
  validatePagination,
  asyncHandler(getLocations)
);

// GET /api/locations/:id - Dettaglio ubicazione
router.get('/:id',
  validateId('id'),
  asyncHandler(getLocationById)
);

// GET /api/locations/:id/udcs - UDC presenti in ubicazione
router.get('/:id/udcs',
  validateId('id'),
  asyncHandler(getLocationUdcs)
);

/**
 * POST /api/locations/:id/block
 * Blocca ubicazione per manutenzione o altri motivi
 */
router.post('/:id/block', async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;
    const {
      motivoBlocco = 'Bloccata manualmente',
      dataPrevistaRilascio
    } = req.body;

    console.log(`[POST /api/locations/${id}/block] Blocking location`);

    // Validate location exists
    const locResult = await pool.request()
      .input('id', id)
      .query(`
        SELECT
          id,
          codice,
          bloccata,
          (SELECT COUNT(*) FROM Udc WHERE idLocazione = Locazioni.id AND recordCancellato = 0) as numUdc
        FROM Locazioni
        WHERE id = @id AND recordCancellato = 0
      `);

    if (locResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Ubicazione non trovata'
      });
    }

    const location = locResult.recordset[0];

    if (location.bloccata) {
      return res.status(400).json({
        success: false,
        error: 'Ubicazione già bloccata'
      });
    }

    // Block location
    await pool.request()
      .input('id', id)
      .input('motivoBlocco', motivoBlocco)
      .input('dataPrevistaRilascio', dataPrevistaRilascio || null)
      .query(`
        UPDATE Locazioni
        SET
          bloccata = 1,
          motivoBlocco = @motivoBlocco,
          dataBlocco = GETDATE(),
          dataPrevistaRilascio = @dataPrevistaRilascio
        WHERE id = @id
      `);

    res.json({
      success: true,
      data: {
        codice: location.codice,
        motivoBlocco: motivoBlocco,
        dataBlocco: new Date().toISOString(),
        dataPrevistaRilascio: dataPrevistaRilascio,
        udcPresenti: location.numUdc,
        message: 'Ubicazione bloccata con successo'
      }
    });

  } catch (error) {
    console.error(`[POST /api/locations/${req.params.id}/block] Error:`, error);
    res.status(500).json({
      success: false,
      error: 'Errore nel blocco ubicazione',
      message: error.message
    });
  }
});

/**
 * POST /api/locations/:id/unblock
 * Sblocca ubicazione
 */
router.post('/:id/unblock', async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;
    const { note } = req.body;

    console.log(`[POST /api/locations/${id}/unblock] Unblocking location`);

    // Validate location exists and is blocked
    const locResult = await pool.request()
      .input('id', id)
      .query(`
        SELECT id, codice, bloccata
        FROM Locazioni
        WHERE id = @id AND recordCancellato = 0
      `);

    if (locResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Ubicazione non trovata'
      });
    }

    const location = locResult.recordset[0];

    if (!location.bloccata) {
      return res.status(400).json({
        success: false,
        error: 'Ubicazione non è bloccata'
      });
    }

    // Unblock location
    await pool.request()
      .input('id', id)
      .input('note', note || 'Sbloccata manualmente')
      .query(`
        UPDATE Locazioni
        SET
          bloccata = 0,
          motivoBlocco = NULL,
          dataBlocco = NULL,
          dataPrevistaRilascio = NULL,
          dataSblocco = GETDATE(),
          noteSblocco = @note
        WHERE id = @id
      `);

    res.json({
      success: true,
      data: {
        codice: location.codice,
        dataSblocco: new Date().toISOString(),
        note: note,
        message: 'Ubicazione sbloccata con successo'
      }
    });

  } catch (error) {
    console.error(`[POST /api/locations/${req.params.id}/unblock] Error:`, error);
    res.status(500).json({
      success: false,
      error: 'Errore nello sblocco ubicazione',
      message: error.message
    });
  }
});

/**
 * GET /api/locations/:id/movements
 * Storico movimenti ubicazione (da LogMissioni)
 */
router.get('/:id/movements', async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;
    const {
      fromDate,
      toDate,
      limit = 100,
      offset = 0
    } = req.query;

    console.log(`[GET /api/locations/${id}/movements] Getting movement history`);

    // Validate location exists
    const locResult = await pool.request()
      .input('id', id)
      .query('SELECT id, descrizione FROM Locazioni WHERE id = @id');

    if (locResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Ubicazione non trovata'
      });
    }

    const location = locResult.recordset[0];

    // Build WHERE conditions
    const whereConditions = ['(L.idLocazionePrelievo = @id OR L.idLocazioneDeposito = @id)'];
    const params = { id: parseInt(id) };

    // Note: LogMissioni table doesn't have dataIngresso column
    // Date filtering temporarily removed until correct column name is identified

    const whereClause = 'WHERE ' + whereConditions.join(' AND ');

    // Get movements
    const query = `
      SELECT
        L.id,
        L.idMissione,
        L.tipoMissione,
        L.stato,
        L.esitoMissione,
        L.dataFine,
        L.durataTotaleMs,
        L.numeroUdc,
        L.idLocazionePrelievo,
        L.codiceLocazionePrelievo,
        L.idLocazioneDeposito,
        L.codiceLocazioneDeposito,
        CASE
          WHEN L.idLocazionePrelievo = @id THEN 'USCITA'
          WHEN L.idLocazioneDeposito = @id THEN 'INGRESSO'
          ELSE 'TRANSITO'
        END as tipoMovimento
      FROM LogMissioni L
      ${whereClause}
      ORDER BY L.id DESC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;

    const request = pool.request();
    request.input('offset', parseInt(offset));
    request.input('limit', parseInt(limit));

    Object.keys(params).forEach(key => {
      request.input(key, params[key]);
    });

    const result = await request.query(query);

    // Count total
    const countQuery = `SELECT COUNT(*) as total FROM LogMissioni L ${whereClause}`;
    const countRequest = pool.request();
    Object.keys(params).forEach(key => {
      countRequest.input(key, params[key]);
    });
    const countResult = await countRequest.query(countQuery);
    const total = countResult.recordset[0].total;

    res.json({
      success: true,
      data: {
        ubicazione: {
          id: location.id,
          descrizione: location.descrizione
        },
        movements: result.recordset,
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    console.error(`[GET /api/locations/${req.params.id}/movements] Error:`, error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero storico movimenti',
      message: error.message
    });
  }
});

/**
 * GET /api/locations/:id/statistics
 * Statistiche ubicazione (utilizzo, rotazione, etc.)
 */
router.get('/:id/statistics', async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;
    const {
      fromDate = new Date(Date.now() - 30*24*60*60*1000).toISOString(),
      toDate = new Date().toISOString()
    } = req.query;

    console.log(`[GET /api/locations/${id}/statistics] Getting statistics`);

    // Validate location exists
    const locResult = await pool.request()
      .input('id', id)
      .query(`
        SELECT
          id,
          descrizione,
          maxUdc,
          (SELECT COUNT(*) FROM Udc WHERE idLocazione = Locazioni.id) as numUdc
        FROM Locazioni
        WHERE id = @id
      `);

    if (locResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Ubicazione non trovata'
      });
    }

    const location = locResult.recordset[0];

    // Get movement statistics
    const statsResult = await pool.request()
      .input('id', id)
      .query(`
        SELECT
          COUNT(*) as totalMovimenti,
          SUM(CASE WHEN idLocazionePrelievo = @id THEN 1 ELSE 0 END) as uscite,
          SUM(CASE WHEN idLocazioneDeposito = @id THEN 1 ELSE 0 END) as ingressi,
          AVG(durataTotaleMs) as durataMedioMs
        FROM LogMissioni
        WHERE (idLocazionePrelievo = @id OR idLocazioneDeposito = @id)
      `);

    const stats = statsResult.recordset[0];

    // Get last movement date
    const lastMovementResult = await pool.request()
      .input('id', id)
      .query(`
        SELECT TOP 1 dataFine
        FROM LogMissioni
        WHERE idLocazionePrelievo = @id OR idLocazioneDeposito = @id
        ORDER BY id DESC
      `);

    const lastMovement = lastMovementResult.recordset.length > 0
      ? lastMovementResult.recordset[0].dataFine
      : null;

    res.json({
      success: true,
      data: {
        ubicazione: {
          id: location.id,
          descrizione: location.descrizione,
          capacita: location.maxUdc,
          occupazione: location.numUdc,
          percentualeOccupazione: location.maxUdc > 0
            ? ((location.numUdc / location.maxUdc) * 100).toFixed(2)
            : 0
        },
        periodo: {
          da: fromDate,
          a: toDate
        },
        movimenti: {
          totali: stats.totalMovimenti || 0,
          ingressi: stats.ingressi || 0,
          uscite: stats.uscite || 0,
          durataMedioSecondi: stats.durataMedioMs ? Math.round(stats.durataMedioMs / 1000) : 0
        },
        ultimoMovimento: lastMovement
      }
    });

  } catch (error) {
    console.error(`[GET /api/locations/${req.params.id}/statistics] Error:`, error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero statistiche',
      message: error.message
    });
  }
});

export default router;
