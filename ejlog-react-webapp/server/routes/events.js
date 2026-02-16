/**
 * Routes per Eventi/Log
 * Endpoint per recuperare dati reali dalla tabella LogEventi
 */

import express from 'express';
import { getPool } from '../db-config.js';

const router = express.Router();

/**
 * GET /api/events
 * Lista eventi con filtri
 */
router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    const {
      limit = 50,
      offset = 0,
      severity,
      startDate,
      endDate,
      search
    } = req.query;

    console.log('[Events API] GET /api/events - params:', { limit, offset, severity, startDate, endDate, search });

    let whereConditions = [];

    // Severity filter
    if (severity && severity !== 'ALL') {
      whereConditions.push(`livelloEvento = '${severity}'`);
    }

    // Date range filter
    if (startDate) {
      whereConditions.push(`data >= '${startDate}'`);
    }
    if (endDate) {
      whereConditions.push(`data <= '${endDate} 23:59:59'`);
    }

    // Search filter
    if (search) {
      whereConditions.push(`(descrizione LIKE '%${search}%' OR utente LIKE '%${search}%' OR contestoEvento LIKE '%${search}%')`);
    }

    const whereClause = whereConditions.length > 0
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    const query = `
      SELECT
        id,
        data as timestamp,
        livelloEvento as severity,
        utente as username,
        descrizione as description,
        descrizione2 as details,
        contestoEvento as entityType,
        idUdc as entityId,
        idLocazione,
        idSupporto,
        idProdotto,
        idMagazzino,
        idLista,
        idRigaLista,
        idPrenotazione,
        idMissione,
        idApplicazione,
        idComputer,
        barcode,
        categoriaLog
      FROM LogEventi
      ${whereClause}
      ORDER BY id DESC
      OFFSET ${parseInt(offset)} ROWS
      FETCH NEXT ${parseInt(limit)} ROWS ONLY
    `;

    const result = await pool.request().query(query);

    // Map real data to expected EventLog format
    const events = result.recordset.map(row => {
      // Determine eventType based on description and context
      let eventType = 'SYSTEM';
      const desc = row.description?.toLowerCase() || '';

      if (desc.includes('login')) eventType = 'USER_LOGIN';
      else if (desc.includes('logout')) eventType = 'USER_LOGOUT';
      else if (desc.includes('created') || desc.includes('creato')) eventType = 'ITEM_CREATED';
      else if (desc.includes('updated') || desc.includes('modificato')) eventType = 'ITEM_UPDATED';
      else if (desc.includes('lista') && desc.includes('creata')) eventType = 'LIST_CREATED';
      else if (desc.includes('lista') && (desc.includes('completata') || desc.includes('completed'))) eventType = 'LIST_COMPLETED';
      else if (desc.includes('lista') && (desc.includes('avviata') || desc.includes('started'))) eventType = 'LIST_STARTED';
      else if (desc.includes('movement') || desc.includes('moviment')) eventType = 'MOVEMENT_CREATED';
      else if (row.severity === 'ERROR' || row.severity === 'CRITICAL') eventType = 'ERROR';
      else if (row.severity === 'WARN' || row.severity === 'WARNING') eventType = 'WARNING';

      return {
        id: row.id,
        eventType,
        severity: row.severity || 'INFO',
        timestamp: row.timestamp,
        username: row.username,
        description: row.description || '',
        details: row.details,
        entityType: row.entityType,
        entityId: row.entityId,
        // Additional fields from LogEventi
        locationId: row.idLocazione,
        supportId: row.idSupporto,
        productId: row.idProdotto,
        warehouseId: row.idMagazzino,
        listId: row.idLista,
        listRowId: row.idRigaLista,
        reservationId: row.idPrenotazione,
        missionId: row.idMissione,
        applicationId: row.idApplicazione,
        computerId: row.idComputer,
        barcode: row.barcode,
        categoryLog: row.categoriaLog
      };
    });

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM LogEventi
      ${whereClause}
    `;
    const countResult = await pool.request().query(countQuery);
    const total = countResult.recordset[0].total;

    console.log(`[Events API] Returning ${events.length} events (total: ${total})`);

    res.json({
      result: 'SUCCESS',
      exported: events,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('[Events API] Error fetching events:', error);
    res.status(500).json({
      result: 'ERROR',
      error: error.message
    });
  }
});

/**
 * GET /api/events/stats
 * Statistiche eventi
 */
router.get('/stats', async (req, res) => {
  try {
    const pool = await getPool();

    console.log('[Events API] GET /api/events/stats');

    // Total count
    const totalResult = await pool.request().query(`
      SELECT COUNT(*) as total FROM LogEventi
    `);
    const total = totalResult.recordset[0].total;

    // By severity
    const severityResult = await pool.request().query(`
      SELECT
        livelloEvento as severity,
        COUNT(*) as count
      FROM LogEventi
      GROUP BY livelloEvento
    `);

    const bySeverity = {
      INFO: 0,
      WARNING: 0,
      ERROR: 0,
      CRITICAL: 0
    };

    for (const row of severityResult.recordset) {
      const sev = row.severity || 'INFO';
      if (sev === 'WARN') {
        bySeverity.WARNING = row.count;
      } else if (bySeverity[sev] !== undefined) {
        bySeverity[sev] = row.count;
      }
    }

    // Recent events (top 10)
    const recentResult = await pool.request().query(`
      SELECT TOP 10
        id,
        data as timestamp,
        livelloEvento as severity,
        utente as username,
        descrizione as description,
        descrizione2 as details,
        contestoEvento as entityType,
        idUdc as entityId
      FROM LogEventi
      ORDER BY id DESC
    `);

    const recentEvents = recentResult.recordset.map(row => {
      let eventType = 'SYSTEM';
      const desc = row.description?.toLowerCase() || '';

      if (desc.includes('login')) eventType = 'USER_LOGIN';
      else if (desc.includes('logout')) eventType = 'USER_LOGOUT';
      else if (desc.includes('created')) eventType = 'ITEM_CREATED';
      else if (desc.includes('error')) eventType = 'ERROR';

      return {
        id: row.id,
        eventType,
        severity: row.severity || 'INFO',
        timestamp: row.timestamp,
        username: row.username,
        description: row.description,
        details: row.details,
        entityType: row.entityType,
        entityId: row.entityId
      };
    });

    // By type (approximated from description)
    const byType = {
      USER_LOGIN: 0,
      USER_LOGOUT: 0,
      ITEM_CREATED: 0,
      LIST_CREATED: 0,
      MOVEMENT_CREATED: 0,
      ERROR: 0,
      SYSTEM: 0
    };

    // Count types from recent events as sample
    for (const event of recentEvents) {
      if (byType[event.eventType] !== undefined) {
        byType[event.eventType]++;
      }
    }

    const stats = {
      total,
      bySeverity,
      byType,
      recentEvents
    };

    console.log('[Events API] Stats:', { total, bySeverity });

    res.json({
      result: 'SUCCESS',
      exported: stats
    });
  } catch (error) {
    console.error('[Events API] Error fetching stats:', error);
    res.status(500).json({
      result: 'ERROR',
      error: error.message
    });
  }
});

/**
 * GET /api/events/:id
 * Dettaglio singolo evento
 */
router.get('/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;

    console.log(`[Events API] GET /api/events/${id}`);

    const result = await pool.request().query(`
      SELECT
        id,
        data as timestamp,
        livelloEvento as severity,
        utente as username,
        descrizione as description,
        descrizione2 as details,
        contestoEvento as entityType,
        idUdc as entityId,
        idLocazione,
        idSupporto,
        idProdotto,
        idMagazzino,
        idLista,
        idRigaLista,
        idPrenotazione,
        idMissione,
        idApplicazione,
        idComputer,
        barcode,
        categoriaLog,
        gettone,
        prgGettone,
        elencoUdc,
        idSegnale,
        auxInt01, auxInt02, auxInt03, auxInt04, auxInt05, auxInt06,
        auxTesto01, auxTesto02, auxTesto03
      FROM LogEventi
      WHERE id = ${id}
    `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        result: 'ERROR',
        error: 'Event not found'
      });
    }

    const row = result.recordset[0];
    const desc = row.description?.toLowerCase() || '';
    let eventType = 'SYSTEM';

    if (desc.includes('login')) eventType = 'USER_LOGIN';
    else if (desc.includes('logout')) eventType = 'USER_LOGOUT';
    else if (desc.includes('created')) eventType = 'ITEM_CREATED';
    else if (desc.includes('error')) eventType = 'ERROR';

    const event = {
      id: row.id,
      eventType,
      severity: row.severity || 'INFO',
      timestamp: row.timestamp,
      username: row.username,
      description: row.description,
      details: row.details,
      entityType: row.entityType,
      entityId: row.entityId,
      locationId: row.idLocazione,
      supportId: row.idSupporto,
      productId: row.idProdotto,
      warehouseId: row.idMagazzino,
      listId: row.idLista,
      listRowId: row.idRigaLista,
      reservationId: row.idPrenotazione,
      missionId: row.idMissione,
      applicationId: row.idApplicazione,
      computerId: row.idComputer,
      barcode: row.barcode,
      categoryLog: row.categoriaLog,
      token: row.gettone,
      tokenProgress: row.prgGettone,
      udcList: row.elencoUdc,
      signalId: row.idSegnale,
      auxInt: {
        aux01: row.auxInt01,
        aux02: row.auxInt02,
        aux03: row.auxInt03,
        aux04: row.auxInt04,
        aux05: row.auxInt05,
        aux06: row.auxInt06
      },
      auxText: {
        aux01: row.auxTesto01,
        aux02: row.auxTesto02,
        aux03: row.auxTesto03
      }
    };

    res.json({
      result: 'SUCCESS',
      exported: event
    });
  } catch (error) {
    console.error(`[Events API] Error fetching event ${req.params.id}:`, error);
    res.status(500).json({
      result: 'ERROR',
      error: error.message
    });
  }
});

export default router;
