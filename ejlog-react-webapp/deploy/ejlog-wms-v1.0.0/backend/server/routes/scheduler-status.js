/**
 * Scheduler Status Routes - REAL DATA
 * Query real database tables: Schedulazione, Prenotazioni, Liste
 * Replica Java WmsTaskSchedulerModule and WmsPrenotatoreModule monitoring
 */

import express from 'express';
import { getPool } from '../db-config.js';

const router = express.Router();

/**
 * GET /api/scheduler-status
 * Get real-time scheduler status from database
 * Replicates WmsTaskSchedulerModule.getRunningJobs() and status checks
 */
router.get('/', async (req, res) => {
  try {
    const pool = await getPool();

    // Check if Schedulazioni table exists
    const tableCheck = await pool.request().query(`
      SELECT COUNT(*) as tableExists
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_NAME = 'Schedulazioni'
    `);

    if (tableCheck.recordset[0].tableExists === 0) {
      return res.json({
        success: true,
        schedulerExists: false,
        running: false,
        message: 'Tabella Schedulazioni non trovata - Scheduler non configurato',
      });
    }

    // Get all schedulazioni (like WmsTaskSchedulerModule status check thread)
    const schedulazioniResult = await pool.request().query(`
      SELECT
        id,
        gruppo,
        nome,
        classe,
        abilitata,
        stopped,
        intervallo,
        cronExpression,
        parametri,
        messaggioErrore,
        tentativiInErrore,
        maxTentativiInErrore,
        dataUltimaEsecuzione,
        dataProssimaEsecuzione,
        idSchedulatore,
        durataUltimaEsecuzione,
        gruppoEsecuzione
      FROM Schedulazioni
      ORDER BY gruppo, nome
    `);

    const schedulazioni = schedulazioniResult.recordset;

    // Count active schedulazioni
    const activeCount = schedulazioni.filter(s => s.abilitata && !s.stopped).length;
    const runningCount = schedulazioni.filter(s =>
      s.abilitata &&
      !s.stopped &&
      s.messaggioErrore === null
    ).length;
    const errorCount = schedulazioni.filter(s => s.messaggioErrore !== null).length;

    // Check if prenotatore is enabled (search for reservation-related schedulazioni)
    const prenotatoreEnabled = schedulazioni.some(s =>
      s.nome && s.nome.toLowerCase().includes('prenota')
    );

    // Get prenotazioni statistics
    const prenotazioniStats = await pool.request().query(`
      SELECT
        COUNT(*) as totalPrenotazioni,
        SUM(CASE WHEN abilitata = 1 THEN 1 ELSE 0 END) as abilitate,
        SUM(CASE WHEN abilitata = 0 THEN 1 ELSE 0 END) as nonAbilitate
      FROM Prenotazioni
      WHERE dataInserimento >= DATEADD(day, -1, GETDATE())
    `);

    const stats = prenotazioniStats.recordset[0] || {
      totalPrenotazioni: 0,
      abilitate: 0,
      nonAbilitate: 0
    };

    res.json({
      success: true,
      schedulerExists: true,
      running: runningCount > 0,
      prenotatoreEnabled,
      schedulazioni: schedulazioni.map(s => ({
        id: s.id,
        group: s.gruppo,
        name: s.nome,
        className: s.classe,
        enabled: s.abilitata,
        stopped: s.stopped,
        interval: s.intervallo,
        cronExpression: s.cronExpression,
        params: s.parametri,
        error: s.messaggioErrore,
        errorRetries: s.tentativiInErrore,
        maxRetries: s.maxTentativiInErrore,
        lastExecution: s.dataUltimaEsecuzione,
        nextExecution: s.dataProssimaEsecuzione,
        schedulerId: s.idSchedulatore,
        lastDuration: s.durataUltimaEsecuzione,
        executionGroup: s.gruppoEsecuzione,
      })),
      summary: {
        total: schedulazioni.length,
        active: activeCount,
        running: runningCount,
        errors: errorCount,
        prenotazioni: stats,
      },
    });

  } catch (error) {
    console.error('[Scheduler Status] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante il recupero dello stato scheduler',
      error: error.message,
    });
  }
});

/**
 * GET /api/scheduler-status/prenotazioni
 * Get reservation statistics by list type
 * Replicates ListActivator monitoring
 */
router.get('/prenotazioni', async (req, res) => {
  try {
    const pool = await getPool();

    // Get prenotazioni grouped by list type
    const result = await pool.request().query(`
      SELECT
        tl.id as idTipoLista,
        tl.descrizione as tipoListaDescrizione,
        COUNT(p.id) as totalPrenotazioni,
        SUM(CASE WHEN p.abilitata = 1 THEN 1 ELSE 0 END) as abilitate,
        SUM(CASE WHEN p.abilitata = 0 THEN 1 ELSE 0 END) as nonAbilitate,
        SUM(CASE WHEN sl.id = 2 THEN 1 ELSE 0 END) as inEsecuzione, -- IN_ESECUZIONE
        SUM(CASE WHEN sr.id = 1 THEN 1 ELSE 0 END) as attive -- ATTIVA
      FROM Prenotazioni p
      JOIN Liste l ON p.idLista = l.id
      JOIN TipoLista tl ON l.idTipoLista = tl.id
      LEFT JOIN StatoLista sl ON p.idStatoControlloEvadibilita = sl.id
      LEFT JOIN StatoRiga sr ON p.idStatoRiga = sr.id
      WHERE p.dataInserimento >= DATEADD(day, -7, GETDATE())
      GROUP BY tl.id, tl.descrizione
      ORDER BY tl.id
    `);

    res.json({
      success: true,
      data: result.recordset.map(r => ({
        listTypeId: r.idTipoLista,
        listType: r.tipoListaDescrizione,
        total: r.totalPrenotazioni,
        enabled: r.abilitate,
        disabled: r.nonAbilitate,
        executing: r.inEsecuzione,
        active: r.attive,
      })),
    });

  } catch (error) {
    console.error('[Scheduler Prenotazioni] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante il recupero delle prenotazioni',
      error: error.message,
    });
  }
});

/**
 * GET /api/scheduler-status/errors
 * Get schedulazioni with errors
 * Replicates CheckSchedulerStatusJob
 */
router.get('/errors', async (req, res) => {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT
        id,
        gruppo,
        nome,
        classe,
        messaggioErrore,
        tentativiInErrore,
        maxTentativiInErrore,
        dataUltimaEsecuzione
      FROM Schedulazioni
      WHERE messaggioErrore IS NOT NULL
        AND stopped = 0
      ORDER BY dataUltimaEsecuzione DESC
    `);

    res.json({
      success: true,
      errors: result.recordset.map(s => ({
        id: s.id,
        group: s.gruppo,
        name: s.nome,
        className: s.classe,
        error: s.messaggioErrore,
        retries: s.tentativiInErrore,
        maxRetries: s.maxTentativiInErrore,
        lastExecution: s.dataUltimaEsecuzione,
      })),
    });

  } catch (error) {
    console.error('[Scheduler Errors] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante il recupero degli errori',
      error: error.message,
    });
  }
});

/**
 * POST /api/scheduler-status/enable/:id
 * Enable a schedulazione
 * Replicates WmsTaskSchedulerModule.abilitaSchedulazione()
 */
router.post('/enable/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;

    await pool.request()
      .input('id', id)
      .query(`
        UPDATE Schedulazioni
        SET abilitata = 1, stopped = 0
        WHERE id = @id
      `);

    console.log(`[Scheduler] ✅ Schedulazione ${id} abilitata`);

    res.json({
      success: true,
      message: `Schedulazione ${id} abilitata con successo`,
    });

  } catch (error) {
    console.error('[Scheduler Enable] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante l\'abilitazione',
      error: error.message,
    });
  }
});

/**
 * POST /api/scheduler-status/disable/:id
 * Disable a schedulazione
 * Replicates WmsTaskSchedulerModule.disabilitaSchedulazione()
 */
router.post('/disable/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;

    await pool.request()
      .input('id', id)
      .query(`
        UPDATE Schedulazioni
        SET abilitata = 0, stopped = 1
        WHERE id = @id
      `);

    console.log(`[Scheduler] ⛔ Schedulazione ${id} disabilitata`);

    res.json({
      success: true,
      message: `Schedulazione ${id} disabilitata con successo`,
    });

  } catch (error) {
    console.error('[Scheduler Disable] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante la disabilitazione',
      error: error.message,
    });
  }
});

/**
 * POST /api/scheduler-status/clear-error/:id
 * Clear error message for a schedulazione
 */
router.post('/clear-error/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;

    await pool.request()
      .input('id', id)
      .query(`
        UPDATE Schedulazioni
        SET messaggioErrore = NULL, tentativiInErrore = 0
        WHERE id = @id
      `);

    console.log(`[Scheduler] 🧹 Errore schedulazione ${id} pulito`);

    res.json({
      success: true,
      message: `Errore pulito con successo`,
    });

  } catch (error) {
    console.error('[Scheduler Clear Error] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante la pulizia',
      error: error.message,
    });
  }
});

/**
 * GET /api/scheduler-status/liste
 * Get lists statistics
 */
router.get('/liste', async (req, res) => {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT
        tl.id as idTipoLista,
        tl.descrizione as tipoLista,
        COUNT(l.id) as totalListe,
        SUM(CASE WHEN sl.id = 1 THEN 1 ELSE 0 END) as nuove,
        SUM(CASE WHEN sl.id = 2 THEN 1 ELSE 0 END) as inEsecuzione,
        SUM(CASE WHEN sl.id = 3 THEN 1 ELSE 0 END) as terminate,
        SUM(CASE WHEN sl.id = 4 THEN 1 ELSE 0 END) as annullate
      FROM Liste l
      JOIN TipoLista tl ON l.idTipoLista = tl.id
      LEFT JOIN StatoLista sl ON l.idStatoControlloEvadibilita = sl.id
      WHERE l.dataCreazione >= DATEADD(day, -7, GETDATE())
      GROUP BY tl.id, tl.descrizione
      ORDER BY tl.id
    `);

    res.json({
      success: true,
      data: result.recordset.map(r => ({
        listTypeId: r.idTipoLista,
        listType: r.tipoLista,
        total: r.totalListe,
        new: r.nuove,
        executing: r.inEsecuzione,
        completed: r.terminate,
        cancelled: r.annullate,
      })),
    });

  } catch (error) {
    console.error('[Scheduler Liste] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante il recupero delle liste',
      error: error.message,
    });
  }
});

export default router;
