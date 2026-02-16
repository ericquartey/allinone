// ============================================================================
// EJLOG WMS - Missions API Routes
// REST API for Mission Management (MissioniTraslo, Buffer, Log)
// ============================================================================

import express from 'express';
import { getPool } from '../db-config.js';
import { body, param, query, validationResult } from 'express-validator';

const router = express.Router();

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation errors',
      details: errors.array()
    });
  }
  next();
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Map mission state code to description
 */
const getMissionStateDescription = (stato) => {
  const states = {
    0: 'In preparazione',
    1: 'Inviata al PLC',
    2: 'In esecuzione',
    3: 'Completata',
    4: 'Abortita',
    5: 'In attesa'
  };
  return states[stato] || 'Sconosciuto';
};

/**
 * Map mission type code to description
 */
const getMissionTypeDescription = (tipoMissione) => {
  const types = {
    'PR': 'Prelievo',
    'DE': 'Deposito',
    'TR': 'Trasferimento'
  };
  return types[tipoMissione] || tipoMissione;
};

// ============================================================================
// GET /api/missions - Current active missions
// ============================================================================
router.get('/', [
  query('stato').optional().isInt().toInt(),
  query('tipoMissione').optional().isString(),
  query('idMovimentatore').optional().isInt().toInt(),
  query('idUdc').optional().isInt().toInt(),
  query('fromDate').optional().isISO8601(),
  query('toDate').optional().isISO8601(),
  query('limit').optional().isInt({ min: 1, max: 500 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
  handleValidationErrors
], async (req, res) => {
  try {
    const pool = await getPool();
    const {
      stato,
      tipoMissione,
      idMovimentatore,
      idUdc,
      fromDate,
      toDate,
      limit = 50,
      offset = 0
    } = req.query;

    console.log('[GET /api/missions] Filters:', {
      stato, tipoMissione, idMovimentatore, idUdc, fromDate, toDate
    });

    // Build WHERE conditions
    let whereConditions = ['1=1'];
    const params = {};

    if (stato !== undefined) {
      whereConditions.push('M.stato = @stato');
      params.stato = parseInt(stato);
    }

    if (tipoMissione) {
      whereConditions.push('M.tipoMissione = @tipoMissione');
      params.tipoMissione = tipoMissione;
    }

    if (idMovimentatore) {
      whereConditions.push('M.idMovimentatore = @idMovimentatore');
      params.idMovimentatore = parseInt(idMovimentatore);
    }

    if (idUdc) {
      whereConditions.push('M.idUdc = @idUdc');
      params.idUdc = parseInt(idUdc);
    }

    if (fromDate) {
      whereConditions.push('M.dataIngresso >= @fromDate');
      params.fromDate = new Date(fromDate);
    }

    if (toDate) {
      whereConditions.push('M.dataIngresso <= @toDate');
      params.toDate = new Date(toDate);
    }

    const whereClause = 'WHERE ' + whereConditions.join(' AND ');

    // Main query
    const query = `
      SELECT
        M.idMovimentatore,
        M.idMissione,
        M.numeroMissionePLC,
        M.idLocazionePrelievo,
        M.idLocazioneDeposito,
        M.idCampataPrelievo,
        M.idCampataDeposito,
        M.idUdc,
        M.tipoMissione,
        M.stato,
        M.dataIngresso,
        M.dataFine,
        M.abortita,
        M.fineManuale,
        M.idPrenotazione,
        M.informazioni,
        M.informazioniParams,
        M.allarmiMissione,
        M.causaleMissione,
        M.causaleMissioneParams,
        LP.descrizione AS locazionePrelievoDesc,
        LD.descrizione AS locazioneDepositoDesc,
        U.numeroUdc,
        U.descrizione AS udcDescrizione,
        U.barcode AS udcBarcode,
        DATEDIFF(SECOND, M.dataIngresso, GETDATE()) AS secondiInEsecuzione,
        DATEDIFF(SECOND, M.dataIngresso, M.dataFine) AS durataSecondi
      FROM MissioniTraslo M
      LEFT JOIN Locazioni LP ON M.idLocazionePrelievo = LP.id
      LEFT JOIN Locazioni LD ON M.idLocazioneDeposito = LD.id
      LEFT JOIN Campate CP ON M.idCampataPrelievo = CP.id
      LEFT JOIN Campate CD ON M.idCampataDeposito = CD.id
      LEFT JOIN Udc U ON M.idUdc = U.id
      ${whereClause}
      ORDER BY M.dataIngresso DESC, M.idMissione ASC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;

    const request = pool.request();
    request.input('offset', offset);
    request.input('limit', limit);

    Object.keys(params).forEach(key => {
      request.input(key, params[key]);
    });

    const result = await request.query(query);

    // Count total
    const countQuery = `SELECT COUNT(*) as total FROM MissioniTraslo M ${whereClause}`;
    const countRequest = pool.request();
    Object.keys(params).forEach(key => {
      countRequest.input(key, params[key]);
    });
    const countResult = await countRequest.query(countQuery);
    const total = countResult.recordset[0].total;

    // Transform results
    const missions = result.recordset.map(row => ({
      idMovimentatore: row.idMovimentatore,
      idMissione: row.idMissione,
      numeroMissionePLC: row.numeroMissionePLC,
      tipoMissione: row.tipoMissione,
      tipoMissioneDescrizione: getMissionTypeDescription(row.tipoMissione),
      stato: row.stato,
      statoDescrizione: getMissionStateDescription(row.stato),

      // UDC info
      udc: row.idUdc ? {
        id: row.idUdc,
        numeroUdc: row.numeroUdc,
        descrizione: row.udcDescrizione,
        barcode: row.udcBarcode
      } : null,

      // Location info (codice field not available in Locazioni table)
      locazionePrelievo: row.idLocazionePrelievo ? {
        id: row.idLocazionePrelievo,
        descrizione: row.locazionePrelievoDesc
      } : null,

      locazioneDeposito: row.idLocazioneDeposito ? {
        id: row.idLocazioneDeposito,
        descrizione: row.locazioneDepositoDesc
      } : null,

      // Campate info (only IDs available)
      campataPrelievo: row.idCampataPrelievo ? {
        id: row.idCampataPrelievo
      } : null,

      campataDeposito: row.idCampataDeposito ? {
        id: row.idCampataDeposito
      } : null,

      // Timing
      dataIngresso: row.dataIngresso,
      dataFine: row.dataFine,
      secondiInEsecuzione: row.secondiInEsecuzione,
      durataSecondi: row.durataSecondi,

      // Flags
      abortita: row.abortita,
      fineManuale: row.fineManuale,

      // Additional info
      idPrenotazione: row.idPrenotazione,
      informazioni: row.informazioni,
      informazioniParams: row.informazioniParams,
      allarmiMissione: row.allarmiMissione,
      causaleMissione: row.causaleMissione,
      causaleMissioneParams: row.causaleMissioneParams
    }));

    res.json({
      success: true,
      data: {
        missions,
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[GET /api/missions] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero delle missioni',
      message: error.message
    });
  }
});

// ============================================================================
// GET /api/missions/stats - Mission statistics
// ============================================================================
router.get('/stats', async (req, res) => {
  try {
    const pool = await getPool();
    const {
      fromDate = new Date(Date.now() - 30*24*60*60*1000).toISOString(),
      toDate = new Date().toISOString()
    } = req.query;

    console.log('[GET /api/missions/stats] Getting mission statistics');

    const statsQuery = `
      SELECT
        COUNT(*) as totalMissions,
        SUM(CASE WHEN stato = 0 THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN stato = 1 THEN 1 ELSE 0 END) as inProgress,
        SUM(CASE WHEN stato = 2 THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN abortita = 1 THEN 1 ELSE 0 END) as aborted,
        AVG(DATEDIFF(SECOND, dataIngresso, ISNULL(dataFine, GETDATE()))) as avgDurationSeconds,
        COUNT(DISTINCT tipoMissione) as missionTypes
      FROM MissioniTraslo
      WHERE dataIngresso BETWEEN @fromDate AND @toDate
    `;

    const result = await pool.request()
      .input('fromDate', new Date(fromDate))
      .input('toDate', new Date(toDate))
      .query(statsQuery);

    const stats = result.recordset[0];

    res.json({
      success: true,
      data: {
        periodo: {
          da: fromDate,
          a: toDate
        },
        totali: {
          missioni: stats.totalMissions || 0,
          inAttesa: stats.pending || 0,
          inEsecuzione: stats.inProgress || 0,
          completate: stats.completed || 0,
          abortite: stats.aborted || 0,
          tipiMissione: stats.missionTypes || 0
        },
        tempi: {
          durataMedioSecondi: Math.round(stats.avgDurationSeconds || 0),
          durataMedioMinuti: Math.round((stats.avgDurationSeconds || 0) / 60)
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[GET /api/missions/stats] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero statistiche missioni',
      message: error.message
    });
  }
});

// ============================================================================
// GET /api/missions/active - Active missions
// ============================================================================
router.get('/active', [
  query('limit').optional().isInt({ min: 1, max: 1000 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
  handleValidationErrors
], async (req, res) => {
  try {
    const pool = await getPool();
    const {
      limit = 50,
      offset = 0
    } = req.query;

    console.log('[GET /api/missions/active] Getting active missions');

    const query = `
      SELECT
        M.idMovimentatore,
        M.idMissione,
        M.numeroMissionePLC,
        M.idCampataPrelievo,
        M.idCampataDeposito,
        M.idLocazionePrelievo,
        M.idLocazioneDeposito,
        M.idUdc,
        M.tipoMissione,
        M.stato,
        M.dataIngresso,
        M.dataFine,
        M.abortita,
        M.fineManuale,
        M.idPrenotazione,
        M.informazioni,
        M.allarmiMissione,
        LP.descrizione AS locazionePrelievoDesc,
        LD.descrizione AS locazioneDepositoDesc,
        U.numeroUdc,
        DATEDIFF(SECOND, M.dataIngresso, GETDATE()) AS secondiInEsecuzione
      FROM MissioniTraslo M
      LEFT JOIN Locazioni LP ON M.idLocazionePrelievo = LP.id
      LEFT JOIN Locazioni LD ON M.idLocazioneDeposito = LD.id
      LEFT JOIN Udc U ON M.idUdc = U.id
      WHERE M.stato IN (0, 1)
      ORDER BY M.dataIngresso DESC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;

    const result = await pool.request()
      .input('limit', parseInt(limit))
      .input('offset', parseInt(offset))
      .query(query);

    const countResult = await pool.request()
      .query('SELECT COUNT(*) as total FROM MissioniTraslo WHERE stato IN (0, 1)');

    const missions = result.recordset.map(row => ({
      idMovimentatore: row.idMovimentatore,
      idMissione: row.idMissione,
      numeroMissionePLC: row.numeroMissionePLC,
      tipoMissione: row.tipoMissione,
      tipoMissioneDescrizione: getMissionTypeDescription(row.tipoMissione),
      stato: row.stato,
      statoDescrizione: getMissionStateDescription(row.stato),
      dataIngresso: row.dataIngresso,
      secondiInEsecuzione: row.secondiInEsecuzione,
      udc: row.idUdc ? {
        id: row.idUdc,
        numeroUdc: row.numeroUdc
      } : null,
      locazionePrelievo: row.idLocazionePrelievo ? {
        id: row.idLocazionePrelievo,
        descrizione: row.locazionePrelievoDesc
      } : null,
      locazioneDeposito: row.idLocazioneDeposito ? {
        id: row.idLocazioneDeposito,
        descrizione: row.locazioneDepositoDesc
      } : null,
      campataPrelievo: row.idCampataPrelievo ? {
        id: row.idCampataPrelievo
      } : null,
      campataDeposito: row.idCampataDeposito ? {
        id: row.idCampataDeposito
      } : null,
      abortita: row.abortita,
      fineManuale: row.fineManuale,
      allarmiMissione: row.allarmiMissione
    }));

    res.json({
      success: true,
      data: missions,
      total: countResult.recordset[0].total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[GET /api/missions/active] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero missioni attive',
      message: error.message
    });
  }
});

// ============================================================================
// GET /api/missions/completed - Completed missions
// ============================================================================
router.get('/completed', [
  query('limit').optional().isInt({ min: 1, max: 1000 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
  handleValidationErrors
], async (req, res) => {
  try {
    const pool = await getPool();
    const {
      limit = 50,
      offset = 0
    } = req.query;

    console.log('[GET /api/missions/completed] Getting completed missions');

    const query = `
      SELECT
        M.idMovimentatore,
        M.idMissione,
        M.numeroMissionePLC,
        M.idCampataPrelievo,
        M.idCampataDeposito,
        M.idLocazionePrelievo,
        M.idLocazioneDeposito,
        M.idUdc,
        M.tipoMissione,
        M.stato,
        M.dataIngresso,
        M.dataFine,
        M.abortita,
        M.fineManuale,
        M.idPrenotazione,
        M.informazioni,
        M.allarmiMissione,
        LP.descrizione AS locazionePrelievoDesc,
        LD.descrizione AS locazioneDepositoDesc,
        U.numeroUdc,
        DATEDIFF(SECOND, M.dataIngresso, M.dataFine) AS durataSecondi
      FROM MissioniTraslo M
      LEFT JOIN Locazioni LP ON M.idLocazionePrelievo = LP.id
      LEFT JOIN Locazioni LD ON M.idLocazioneDeposito = LD.id
      LEFT JOIN Udc U ON M.idUdc = U.id
      WHERE M.stato = 2 AND M.dataFine IS NOT NULL
      ORDER BY M.dataFine DESC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;

    const result = await pool.request()
      .input('limit', parseInt(limit))
      .input('offset', parseInt(offset))
      .query(query);

    const countResult = await pool.request()
      .query('SELECT COUNT(*) as total FROM MissioniTraslo WHERE stato = 2 AND dataFine IS NOT NULL');

    const missions = result.recordset.map(row => ({
      idMovimentatore: row.idMovimentatore,
      idMissione: row.idMissione,
      numeroMissionePLC: row.numeroMissionePLC,
      tipoMissione: row.tipoMissione,
      tipoMissioneDescrizione: getMissionTypeDescription(row.tipoMissione),
      stato: row.stato,
      statoDescrizione: getMissionStateDescription(row.stato),
      dataIngresso: row.dataIngresso,
      dataFine: row.dataFine,
      durataSecondi: row.durataSecondi,
      durataMinuti: Math.round(row.durataSecondi / 60),
      udc: row.idUdc ? {
        id: row.idUdc,
        numeroUdc: row.numeroUdc
      } : null,
      locazionePrelievo: row.idLocazionePrelievo ? {
        id: row.idLocazionePrelievo,
        descrizione: row.locazionePrelievoDesc
      } : null,
      locazioneDeposito: row.idLocazioneDeposito ? {
        id: row.idLocazioneDeposito,
        descrizione: row.locazioneDepositoDesc
      } : null,
      campataPrelievo: row.idCampataPrelievo ? {
        id: row.idCampataPrelievo
      } : null,
      campataDeposito: row.idCampataDeposito ? {
        id: row.idCampataDeposito
      } : null,
      abortita: row.abortita,
      fineManuale: row.fineManuale,
      allarmiMissione: row.allarmiMissione
    }));

    res.json({
      success: true,
      data: missions,
      total: countResult.recordset[0].total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[GET /api/missions/completed] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero missioni completate',
      message: error.message
    });
  }
});

// ============================================================================
// GET /api/missions/by-type/:type - Missions by type
// ============================================================================
router.get('/by-type/:type', [
  param('type').notEmpty().trim(),
  query('limit').optional().isInt({ min: 1, max: 1000 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
  handleValidationErrors
], async (req, res) => {
  try {
    const pool = await getPool();
    const { type } = req.params;
    const {
      limit = 50,
      offset = 0
    } = req.query;

    console.log(`[GET /api/missions/by-type/${type}] Getting missions by type`);

    const query = `
      SELECT
        M.idMovimentatore,
        M.idMissione,
        M.numeroMissionePLC,
        M.idCampataPrelievo,
        M.idCampataDeposito,
        M.idLocazionePrelievo,
        M.idLocazioneDeposito,
        M.idUdc,
        M.tipoMissione,
        M.stato,
        M.dataIngresso,
        M.dataFine,
        M.abortita,
        M.fineManuale,
        M.idPrenotazione,
        M.informazioni,
        M.allarmiMissione,
        LP.descrizione AS locazionePrelievoDesc,
        LD.descrizione AS locazioneDepositoDesc,
        U.numeroUdc,
        DATEDIFF(SECOND, M.dataIngresso, ISNULL(M.dataFine, GETDATE())) AS durataSecondi
      FROM MissioniTraslo M
      LEFT JOIN Locazioni LP ON M.idLocazionePrelievo = LP.id
      LEFT JOIN Locazioni LD ON M.idLocazioneDeposito = LD.id
      LEFT JOIN Udc U ON M.idUdc = U.id
      WHERE M.tipoMissione = @type
      ORDER BY M.dataIngresso DESC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;

    const result = await pool.request()
      .input('type', type)
      .input('limit', parseInt(limit))
      .input('offset', parseInt(offset))
      .query(query);

    const countResult = await pool.request()
      .input('type', type)
      .query('SELECT COUNT(*) as total FROM MissioniTraslo WHERE tipoMissione = @type');

    const missions = result.recordset.map(row => ({
      idMovimentatore: row.idMovimentatore,
      idMissione: row.idMissione,
      numeroMissionePLC: row.numeroMissionePLC,
      tipoMissione: row.tipoMissione,
      tipoMissioneDescrizione: getMissionTypeDescription(row.tipoMissione),
      stato: row.stato,
      statoDescrizione: getMissionStateDescription(row.stato),
      dataIngresso: row.dataIngresso,
      dataFine: row.dataFine,
      durataSecondi: row.durataSecondi,
      udc: row.idUdc ? {
        id: row.idUdc,
        numeroUdc: row.numeroUdc
      } : null,
      locazionePrelievo: row.idLocazionePrelievo ? {
        id: row.idLocazionePrelievo,
        descrizione: row.locazionePrelievoDesc
      } : null,
      locazioneDeposito: row.idLocazioneDeposito ? {
        id: row.idLocazioneDeposito,
        descrizione: row.locazioneDepositoDesc
      } : null,
      campataPrelievo: row.idCampataPrelievo ? {
        id: row.idCampataPrelievo
      } : null,
      campataDeposito: row.idCampataDeposito ? {
        id: row.idCampataDeposito
      } : null,
      abortita: row.abortita,
      fineManuale: row.fineManuale,
      allarmiMissione: row.allarmiMissione
    }));

    res.json({
      success: true,
      data: missions,
      tipo: type,
      tipoDescrizione: getMissionTypeDescription(type),
      total: countResult.recordset[0].total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`[GET /api/missions/by-type/${req.params.type}] Error:`, error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero missioni per tipo',
      message: error.message
    });
  }
});

// ============================================================================
// GET /api/missions/:id - Mission details
// ============================================================================
router.get('/:id', [
  param('id').isInt().toInt(),
  handleValidationErrors
], async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;

    console.log(`[GET /api/missions/${id}] Getting mission details`);

    const query = `
      SELECT
        M.*,
        LP.codice AS locazionePrelievo,
        LP.descrizione AS locazionePrelievoDesc,
        LD.codice AS locazioneDeposito,
        LD.descrizione AS locazioneDepositoDesc,
        U.numeroUdc,
        U.descrizione AS udcDescrizione,
        U.barcode AS udcBarcode,
        U.peso AS udcPeso,
        U.altezza AS udcAltezza,
        DATEDIFF(SECOND, M.dataIngresso, GETDATE()) AS secondiInEsecuzione
      FROM MissioniTraslo M
      LEFT JOIN Locazioni LP ON M.idLocazionePrelievo = LP.id
      LEFT JOIN Locazioni LD ON M.idLocazioneDeposito = LD.id
      LEFT JOIN Campate CP ON M.idCampataPrelievo = CP.id
      LEFT JOIN Campate CD ON M.idCampataDeposito = CD.id
      LEFT JOIN Udc U ON M.idUdc = U.id
      WHERE M.idMissione = @id
    `;

    const result = await pool.request()
      .input('id', parseInt(id))
      .query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Missione non trovata'
      });
    }

    const row = result.recordset[0];

    const mission = {
      idMovimentatore: row.idMovimentatore,
      idMissione: row.idMissione,
      numeroMissionePLC: row.numeroMissionePLC,
      tipoMissione: row.tipoMissione,
      tipoMissioneDescrizione: getMissionTypeDescription(row.tipoMissione),
      stato: row.stato,
      statoDescrizione: getMissionStateDescription(row.stato),

      udc: row.idUdc ? {
        id: row.idUdc,
        numeroUdc: row.numeroUdc,
        descrizione: row.udcDescrizione,
        barcode: row.udcBarcode,
        peso: row.udcPeso,
        altezza: row.udcAltezza
      } : null,

      locazionePrelievo: row.idLocazionePrelievo ? {
        id: row.idLocazionePrelievo,
        codice: row.locazionePrelievo,
        descrizione: row.locazionePrelievoDesc
      } : null,

      locazioneDeposito: row.idLocazioneDeposito ? {
        id: row.idLocazioneDeposito,
        codice: row.locazioneDeposito,
        descrizione: row.locazioneDepositoDesc
      } : null,

      campataPrelievo: row.idCampataPrelievo ? {
        id: row.idCampataPrelievo,
        codice: row.campataPrelievo
      } : null,

      campataDeposito: row.idCampataDeposito ? {
        id: row.idCampataDeposito,
        codice: row.campataDeposito
      } : null,

      dataIngresso: row.dataIngresso,
      dataFine: row.dataFine,
      secondiInEsecuzione: row.secondiInEsecuzione,

      abortita: row.abortita,
      fineManuale: row.fineManuale,

      idPrenotazione: row.idPrenotazione,
      informazioni: row.informazioni,
      informazioniParams: row.informazioniParams,
      allarmiMissione: row.allarmiMissione,
      causaleMissione: row.causaleMissione,
      causaleMissioneParams: row.causaleMissioneParams,

      // All other fields from the record
      ...Object.keys(row).reduce((acc, key) => {
        if (!acc[key]) acc[key] = row[key];
        return acc;
      }, {})
    };

    res.json({
      success: true,
      data: mission,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`[GET /api/missions/${req.params.id}] Error:`, error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero del dettaglio missione',
      message: error.message
    });
  }
});

// ============================================================================
// GET /api/missions/queue - Mission queue (buffer)
// ============================================================================
router.get('/queue/list', [
  query('limit').optional().isInt({ min: 1, max: 500 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
  handleValidationErrors
], async (req, res) => {
  try {
    const pool = await getPool();
    const { limit = 100, offset = 0 } = req.query;

    console.log('[GET /api/missions/queue] Getting mission queue');

    const query = `
      SELECT
        B.*,
        LP.codice AS locazionePrelievo,
        LD.codice AS locazioneDeposito,
        U.numeroUdc,
        U.descrizione AS udcDescrizione,
        U.barcode AS udcBarcode
      FROM MissioniTrasloBuffer B
      LEFT JOIN Locazioni LP ON B.idLocazionePrelievo = LP.id
      LEFT JOIN Locazioni LD ON B.idLocazioneDeposito = LD.id
      LEFT JOIN Udc U ON B.idUdc = U.id
      ORDER BY B.dataInserimento ASC, B.id ASC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;

    const result = await pool.request()
      .input('offset', offset)
      .input('limit', limit)
      .query(query);

    // Count total
    const countResult = await pool.request().query(
      'SELECT COUNT(*) as total FROM MissioniTrasloBuffer'
    );
    const total = countResult.recordset[0].total;

    const queueMissions = result.recordset.map(row => ({
      idBuffer: row.id || row.idBuffer,
      idUdc: row.idUdc,
      udc: row.idUdc ? {
        numeroUdc: row.numeroUdc,
        descrizione: row.udcDescrizione,
        barcode: row.udcBarcode
      } : null,
      idLocazionePrelievo: row.idLocazionePrelievo,
      locazionePrelievo: row.locazionePrelievo,
      idLocazioneDeposito: row.idLocazioneDeposito,
      locazioneDeposito: row.locazioneDeposito,
      tipoMissione: row.tipoMissione,
      tipoMissioneDescrizione: getMissionTypeDescription(row.tipoMissione),
      dataInserimento: row.dataInserimento,
      idOperatore: row.idOperatore,
      causaleMissione: row.causaleMissione,
      informazioni: row.informazioni
    }));

    res.json({
      success: true,
      data: queueMissions,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[GET /api/missions/queue] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero della coda missioni',
      message: error.message
    });
  }
});

// ============================================================================
// GET /api/missions/history - Mission history (LogMissioni)
// ============================================================================
router.get('/history/list', [
  query('fromDate').optional().isISO8601(),
  query('toDate').optional().isISO8601(),
  query('esitoMissione').optional().isString(),
  query('tipoMissione').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 1000 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
  handleValidationErrors
], async (req, res) => {
  try {
    const pool = await getPool();
    const {
      fromDate,
      toDate,
      esitoMissione,
      tipoMissione,
      limit = 100,
      offset = 0
    } = req.query;

    console.log('[GET /api/missions/history] Filters:', {
      fromDate, toDate, esitoMissione, tipoMissione
    });

    // Build WHERE conditions
    let whereConditions = ['1=1'];
    const params = {};

    if (fromDate) {
      whereConditions.push('L.dataIngresso >= @fromDate');
      params.fromDate = new Date(fromDate);
    }

    if (toDate) {
      whereConditions.push('L.dataIngresso <= @toDate');
      params.toDate = new Date(toDate);
    }

    if (esitoMissione) {
      whereConditions.push('L.esitoMissione = @esitoMissione');
      params.esitoMissione = esitoMissione;
    }

    if (tipoMissione) {
      whereConditions.push('L.tipoMissione = @tipoMissione');
      params.tipoMissione = tipoMissione;
    }

    const whereClause = 'WHERE ' + whereConditions.join(' AND ');

    const query = `
      SELECT
        L.id,
        L.idMissione,
        L.idMovimentatore,
        L.tipoMissione,
        L.stato,
        L.dataIngresso,
        L.dataFine,
        L.durataTotaleMs,
        L.esitoMissione,
        L.causaleMissione,
        L.informazioni,
        L.allarmiMissione,
        L.idUdc,
        L.numeroUdc,
        L.idLocazionePrelievo,
        L.codiceLocazionePrelievo,
        L.idLocazioneDeposito,
        L.codiceLocazioneDeposito
      FROM LogMissioni L
      ${whereClause}
      ORDER BY L.dataIngresso DESC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;

    const request = pool.request();
    request.input('offset', offset);
    request.input('limit', limit);

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

    const history = result.recordset.map(row => ({
      id: row.id,
      idMissione: row.idMissione,
      idMovimentatore: row.idMovimentatore,
      tipoMissione: row.tipoMissione,
      tipoMissioneDescrizione: getMissionTypeDescription(row.tipoMissione),
      stato: row.stato,
      statoDescrizione: getMissionStateDescription(row.stato),
      dataIngresso: row.dataIngresso,
      dataFine: row.dataFine,
      durataTotaleMs: row.durataTotaleMs,
      durataSecondi: row.durataTotaleMs ? Math.round(row.durataTotaleMs / 1000) : null,
      esitoMissione: row.esitoMissione,
      causaleMissione: row.causaleMissione,
      informazioni: row.informazioni,
      allarmiMissione: row.allarmiMissione,

      udc: row.idUdc ? {
        id: row.idUdc,
        numeroUdc: row.numeroUdc
      } : null,

      locazionePrelievo: row.idLocazionePrelievo ? {
        id: row.idLocazionePrelievo,
        codice: row.codiceLocazionePrelievo
      } : null,

      locazioneDeposito: row.idLocazioneDeposito ? {
        id: row.idLocazioneDeposito,
        codice: row.codiceLocazioneDeposito
      } : null
    }));

    res.json({
      success: true,
      data: history,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[GET /api/missions/history] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero dello storico missioni',
      message: error.message
    });
  }
});

// ============================================================================
// GET /api/missions/statistics - Mission statistics
// ============================================================================
router.get('/statistics/summary', [
  query('fromDate').optional().isISO8601(),
  query('toDate').optional().isISO8601(),
  handleValidationErrors
], async (req, res) => {
  try {
    const pool = await getPool();
    const { fromDate, toDate } = req.query;

    // Default to last 24 hours if not specified
    const from = fromDate ? new Date(fromDate) : new Date(Date.now() - 24*60*60*1000);
    const to = toDate ? new Date(toDate) : new Date();

    console.log('[GET /api/missions/statistics] Period:', { from, to });

    const query = `
      SELECT
        COUNT(*) as totalMissions,
        SUM(CASE WHEN esitoMissione = 'COMPLETED' THEN 1 ELSE 0 END) as completedMissions,
        SUM(CASE WHEN esitoMissione = 'ABORTED' THEN 1 ELSE 0 END) as abortedMissions,
        SUM(CASE WHEN esitoMissione NOT IN ('COMPLETED', 'ABORTED') THEN 1 ELSE 0 END) as otherMissions,
        AVG(durataTotaleMs) as avgDurationMs,
        MIN(durataTotaleMs) as minDurationMs,
        MAX(durataTotaleMs) as maxDurationMs,
        SUM(CASE WHEN tipoMissione = 'PR' THEN 1 ELSE 0 END) as prelieviCount,
        SUM(CASE WHEN tipoMissione = 'DE' THEN 1 ELSE 0 END) as depositiCount,
        SUM(CASE WHEN tipoMissione = 'TR' THEN 1 ELSE 0 END) as trasferimentiCount
      FROM LogMissioni
      WHERE dataIngresso BETWEEN @from AND @to
    `;

    const result = await pool.request()
      .input('from', from)
      .input('to', to)
      .query(query);

    const stats = result.recordset[0];

    // Get current active missions
    const activeMissionsQuery = `
      SELECT COUNT(*) as activeMissions
      FROM MissioniTraslo
      WHERE stato IN (1, 2)
    `;
    const activeResult = await pool.request().query(activeMissionsQuery);

    // Get queue size
    const queueQuery = `SELECT COUNT(*) as queueSize FROM MissioniTrasloBuffer`;
    const queueResult = await pool.request().query(queueQuery);

    const statistics = {
      period: {
        from: from.toISOString(),
        to: to.toISOString()
      },
      total: {
        missions: stats.totalMissions || 0,
        completed: stats.completedMissions || 0,
        aborted: stats.abortedMissions || 0,
        other: stats.otherMissions || 0
      },
      successRate: stats.totalMissions > 0
        ? ((stats.completedMissions / stats.totalMissions) * 100).toFixed(2)
        : '0.00',
      byType: {
        prelievi: stats.prelieviCount || 0,
        depositi: stats.depositiCount || 0,
        trasferimenti: stats.trasferimentiCount || 0
      },
      duration: {
        avgMs: Math.round(stats.avgDurationMs || 0),
        avgSeconds: Math.round((stats.avgDurationMs || 0) / 1000),
        minMs: stats.minDurationMs || 0,
        minSeconds: Math.round((stats.minDurationMs || 0) / 1000),
        maxMs: stats.maxDurationMs || 0,
        maxSeconds: Math.round((stats.maxDurationMs || 0) / 1000)
      },
      current: {
        activeMissions: activeResult.recordset[0].activeMissions || 0,
        queueSize: queueResult.recordset[0].queueSize || 0
      },
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: statistics
    });

  } catch (error) {
    console.error('[GET /api/missions/statistics] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero delle statistiche',
      message: error.message
    });
  }
});

// ============================================================================
// POST /api/missions - Create new mission (manual)
// ============================================================================
router.post('/', [
  body('idUdc').isInt().toInt(),
  body('idLocazionePrelievo').optional().isInt().toInt(),
  body('idLocazioneDeposito').isInt().toInt(),
  body('tipoMissione').optional().isString().isIn(['PR', 'DE', 'TR']),
  body('causale').optional().isString(),
  handleValidationErrors
], async (req, res) => {
  try {
    const pool = await getPool();
    const {
      idUdc,
      idLocazionePrelievo,
      idLocazioneDeposito,
      tipoMissione = 'TR',
      causale
    } = req.body;

    console.log('[POST /api/missions] Creating mission:', req.body);

    // Validation: check UDC exists
    const udcCheck = await pool.request()
      .input('idUdc', idUdc)
      .query('SELECT id, numeroUdc, idLocazione FROM Udc WHERE id = @idUdc');

    if (udcCheck.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'UDC non trovata'
      });
    }

    const udc = udcCheck.recordset[0];
    const udcCurrentLocation = udc.idLocazione;

    // Use UDC current location as pickup if not specified
    const finalIdLocazionePrelievo = idLocazionePrelievo || udcCurrentLocation;

    if (!finalIdLocazionePrelievo) {
      return res.status(400).json({
        success: false,
        error: 'UDC non ha una ubicazione corrente e non è stata specificata una ubicazione di prelievo'
      });
    }

    // Validation: check destination location exists and not blocked
    const locCheck = await pool.request()
      .input('idLoc', idLocazioneDeposito)
      .query(`
        SELECT id, codice, bloccata, maxUdc,
               (SELECT COUNT(*) FROM Udc WHERE idLocazione = Locazioni.id) as numUdc,
               idClasseAltezza
        FROM Locazioni
        WHERE id = @idLoc
      `);

    if (locCheck.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Ubicazione destinazione non trovata'
      });
    }

    const location = locCheck.recordset[0];

    if (location.bloccata) {
      return res.status(400).json({
        success: false,
        error: 'Ubicazione destinazione è bloccata'
      });
    }

    if (location.numUdc >= location.maxUdc) {
      return res.status(400).json({
        success: false,
        error: 'Ubicazione destinazione è piena'
      });
    }

    // Check height class compatibility (if applicable)
    // This would require getting UDC height class and comparing
    // Simplified for now

    // Insert into buffer
    const insertQuery = `
      INSERT INTO MissioniTrasloBuffer (
        idUdc,
        idLocazionePrelievo,
        idLocazioneDeposito,
        tipoMissione,
        causaleMissione,
        dataInserimento
      )
      OUTPUT INSERTED.id
      VALUES (
        @idUdc,
        @idLocazionePrelievo,
        @idLocazioneDeposito,
        @tipoMissione,
        @causale,
        GETDATE()
      )
    `;

    const insertResult = await pool.request()
      .input('idUdc', idUdc)
      .input('idLocazionePrelievo', finalIdLocazionePrelievo)
      .input('idLocazioneDeposito', idLocazioneDeposito)
      .input('tipoMissione', tipoMissione)
      .input('causale', causale || 'Movimento manuale')
      .query(insertQuery);

    const idBuffer = insertResult.recordset[0].id;

    // Update UDC state to "In movimento" (3)
    await pool.request()
      .input('idUdc', idUdc)
      .query('UPDATE Udc SET idStato = 3 WHERE id = @idUdc');

    res.status(201).json({
      success: true,
      data: {
        idBuffer: idBuffer,
        message: 'Missione creata e inserita in coda'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[POST /api/missions] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nella creazione della missione',
      message: error.message
    });
  }
});

// ============================================================================
// PUT /api/missions/:id/abort - Abort mission
// ============================================================================
router.put('/:id/abort', [
  param('id').isInt().toInt(),
  body('motivo').optional().isString(),
  handleValidationErrors
], async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;
    const { motivo } = req.body;

    console.log(`[PUT /api/missions/${id}/abort] Aborting mission`);

    // Check mission exists and is in a state that can be aborted
    const checkQuery = `
      SELECT idMissione, stato, idUdc
      FROM MissioniTraslo
      WHERE idMissione = @id
    `;

    const checkResult = await pool.request()
      .input('id', parseInt(id))
      .query(checkQuery);

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Missione non trovata'
      });
    }

    const mission = checkResult.recordset[0];

    // Don't abort if already completed or aborted
    if (mission.stato === 3) {
      return res.status(400).json({
        success: false,
        error: 'Missione già completata, impossibile abortire'
      });
    }

    if (mission.stato === 4) {
      return res.status(400).json({
        success: false,
        error: 'Missione già abortita'
      });
    }

    // Update mission to aborted state
    const updateQuery = `
      UPDATE MissioniTraslo
      SET
        stato = 4,
        abortita = 1,
        dataFine = GETDATE(),
        informazioni = @motivo
      WHERE idMissione = @id
    `;

    await pool.request()
      .input('id', parseInt(id))
      .input('motivo', motivo || 'Abortita manualmente')
      .query(updateQuery);

    // If mission has UDC, reset its state
    if (mission.idUdc) {
      await pool.request()
        .input('idUdc', mission.idUdc)
        .query('UPDATE Udc SET idStato = 1 WHERE id = @idUdc');
    }

    res.json({
      success: true,
      data: {
        message: 'Missione abortita con successo'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`[PUT /api/missions/${req.params.id}/abort] Error:`, error);
    res.status(500).json({
      success: false,
      error: 'Errore nell\'abortire la missione',
      message: error.message
    });
  }
});

// ============================================================================
// DELETE /api/missions/queue/:id - Delete mission from queue
// ============================================================================
router.delete('/queue/:id', [
  param('id').isInt().toInt(),
  handleValidationErrors
], async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;

    console.log(`[DELETE /api/missions/queue/${id}] Deleting queued mission`);

    // Get mission info before deleting (to reset UDC state)
    const getQuery = `SELECT idUdc FROM MissioniTrasloBuffer WHERE id = @id`;
    const getResult = await pool.request()
      .input('id', parseInt(id))
      .query(getQuery);

    if (getResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Missione in coda non trovata'
      });
    }

    const idUdc = getResult.recordset[0].idUdc;

    // Delete from buffer
    const deleteQuery = `DELETE FROM MissioniTrasloBuffer WHERE id = @id`;
    await pool.request()
      .input('id', parseInt(id))
      .query(deleteQuery);

    // Reset UDC state if exists
    if (idUdc) {
      await pool.request()
        .input('idUdc', idUdc)
        .query('UPDATE Udc SET idStato = 1 WHERE id = @idUdc');
    }

    res.json({
      success: true,
      data: {
        message: 'Missione rimossa dalla coda'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`[DELETE /api/missions/queue/${req.params.id}] Error:`, error);
    res.status(500).json({
      success: false,
      error: 'Errore nella rimozione della missione dalla coda',
      message: error.message
    });
  }
});

export default router;
