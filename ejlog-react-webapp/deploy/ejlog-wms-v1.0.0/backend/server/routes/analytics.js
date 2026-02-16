/**
 * Analytics Routes - Advanced Picking Analytics & Reporting
 * Feature E - Real implementation with SQL Server queries
 */

import express from 'express';
import { getPool } from '../db-config.js';

const router = express.Router();

/**
 * GET /api/analytics/picking
 * Ottieni statistiche picking per un range di date
 *
 * Query params:
 * - from: data inizio (YYYY-MM-DD)
 * - to: data fine (YYYY-MM-DD)
 * - groupBy: 'day' | 'week' | 'month' (default: 'day')
 */
router.get('/picking', async (req, res) => {
  try {
    const { from, to, groupBy = 'day' } = req.query;

    // Validazione date
    if (!from || !to) {
      return res.status(400).json({
        success: false,
        error: 'Parametri from e to obbligatori (formato YYYY-MM-DD)'
      });
    }

    const pool = await getPool();

    // Query KPI principali
    const kpiQuery = `
      SELECT
        COUNT(*) as totalPicks,
        AVG(CASE
          WHEN DataOraInizio IS NOT NULL AND DataOraFine IS NOT NULL
          THEN DATEDIFF(SECOND, DataOraInizio, DataOraFine)
          ELSE NULL
        END) as avgPickTimeSeconds,
        SUM(CASE WHEN Stato = 'completata' THEN 1 ELSE 0 END) as completedPicks,
        SUM(CASE WHEN Stato = 'annullata' THEN 1 ELSE 0 END) as cancelledPicks,
        SUM(CASE WHEN Stato = 'in corso' THEN 1 ELSE 0 END) as inProgressPicks,
        COUNT(DISTINCT IdOperatore) as uniqueOperators,
        SUM(Quantita) as totalQuantity
      FROM MissioniTraslo
      WHERE CAST(DataOraInizio AS DATE) BETWEEN @from AND @to
    `;

    const kpiResult = await pool.request()
      .input('from', from)
      .input('to', to)
      .query(kpiQuery);

    const kpi = kpiResult.recordset[0];

    // Calcola accuracy (picks completate / totali)
    const accuracy = kpi.totalPicks > 0
      ? ((kpi.completedPicks / kpi.totalPicks) * 100).toFixed(2)
      : 0;

    // Calcola efficiency (tempo medio rispetto a target di 60s)
    const targetPickTime = 60; // secondi
    const efficiency = kpi.avgPickTimeSeconds
      ? Math.min(100, ((targetPickTime / kpi.avgPickTimeSeconds) * 100)).toFixed(2)
      : 0;

    // Calcola lines per hour (media)
    const linesPerHour = kpi.avgPickTimeSeconds
      ? Math.round(3600 / kpi.avgPickTimeSeconds)
      : 0;

    // Query trend per grafici (raggruppati per giorno/settimana/mese)
    let dateGrouping;
    switch (groupBy) {
      case 'week':
        dateGrouping = "DATEPART(YEAR, DataOraInizio), DATEPART(WEEK, DataOraInizio)";
        break;
      case 'month':
        dateGrouping = "DATEPART(YEAR, DataOraInizio), DATEPART(MONTH, DataOraInizio)";
        break;
      default: // day
        dateGrouping = "CAST(DataOraInizio AS DATE)";
    }

    const trendQuery = `
      SELECT
        ${dateGrouping} as period,
        CAST(DataOraInizio AS DATE) as date,
        COUNT(*) as picks,
        AVG(CASE
          WHEN DataOraInizio IS NOT NULL AND DataOraFine IS NOT NULL
          THEN DATEDIFF(SECOND, DataOraInizio, DataOraFine)
          ELSE NULL
        END) as avgTime,
        SUM(CASE WHEN Stato = 'completata' THEN 1 ELSE 0 END) as completed,
        SUM(Quantita) as quantity
      FROM MissioniTraslo
      WHERE CAST(DataOraInizio AS DATE) BETWEEN @from AND @to
      GROUP BY ${dateGrouping}, CAST(DataOraInizio AS DATE)
      ORDER BY date ASC
    `;

    const trendResult = await pool.request()
      .input('from', from)
      .input('to', to)
      .query(trendQuery);

    // Query performance per operatore
    const operatorQuery = `
      SELECT TOP 10
        IdOperatore as operatorId,
        U.username as operatorName,
        COUNT(*) as totalPicks,
        AVG(CASE
          WHEN DataOraInizio IS NOT NULL AND DataOraFine IS NOT NULL
          THEN DATEDIFF(SECOND, DataOraInizio, DataOraFine)
          ELSE NULL
        END) as avgTime,
        SUM(CASE WHEN Stato = 'completata' THEN 1 ELSE 0 END) as completed,
        (SUM(CASE WHEN Stato = 'completata' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) as accuracy
      FROM MissioniTraslo M
      LEFT JOIN Users U ON M.IdOperatore = U.id
      WHERE CAST(M.DataOraInizio AS DATE) BETWEEN @from AND @to
        AND M.IdOperatore IS NOT NULL
      GROUP BY IdOperatore, U.username
      ORDER BY totalPicks DESC
    `;

    const operatorResult = await pool.request()
      .input('from', from)
      .input('to', to)
      .query(operatorQuery);

    // Query errori più frequenti (se disponibili)
    const errorsQuery = `
      SELECT TOP 5
        MotivoAnnullamento as errorReason,
        COUNT(*) as count
      FROM MissioniTraslo
      WHERE CAST(DataOraInizio AS DATE) BETWEEN @from AND @to
        AND Stato = 'annullata'
        AND MotivoAnnullamento IS NOT NULL
      GROUP BY MotivoAnnullamento
      ORDER BY count DESC
    `;

    const errorsResult = await pool.request()
      .input('from', from)
      .input('to', to)
      .query(errorsQuery);

    // Risposta completa
    res.json({
      success: true,
      dateRange: { from, to },
      kpi: {
        avgPickTime: kpi.avgPickTimeSeconds ? Math.round(kpi.avgPickTimeSeconds) + 's' : 'N/A',
        avgPickTimeSeconds: kpi.avgPickTimeSeconds ? Math.round(kpi.avgPickTimeSeconds) : null,
        accuracy: accuracy + '%',
        accuracyValue: parseFloat(accuracy),
        linesPerHour: linesPerHour,
        efficiency: efficiency + '%',
        efficiencyValue: parseFloat(efficiency),
        totalPicks: kpi.totalPicks,
        completedPicks: kpi.completedPicks,
        cancelledPicks: kpi.cancelledPicks,
        inProgressPicks: kpi.inProgressPicks,
        uniqueOperators: kpi.uniqueOperators,
        totalQuantity: kpi.totalQuantity
      },
      trend: trendResult.recordset.map(row => ({
        date: row.date,
        picks: row.picks,
        avgTime: row.avgTime ? Math.round(row.avgTime) : null,
        completed: row.completed,
        quantity: row.quantity,
        accuracy: row.picks > 0 ? ((row.completed / row.picks) * 100).toFixed(1) : 0
      })),
      operators: operatorResult.recordset.map(row => ({
        operatorId: row.operatorId,
        operatorName: row.operatorName || 'Unknown',
        totalPicks: row.totalPicks,
        avgTime: row.avgTime ? Math.round(row.avgTime) : null,
        completed: row.completed,
        accuracy: row.accuracy ? parseFloat(row.accuracy).toFixed(1) : 0
      })),
      errors: errorsResult.recordset,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in /api/analytics/picking:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero analytics',
      details: error.message
    });
  }
});

/**
 * GET /api/analytics/summary
 * Ottieni riepilogo statistiche real-time (ultimi 7 giorni)
 */
router.get('/summary', async (req, res) => {
  try {
    const pool = await getPool();

    // Ultimi 7 giorni
    const summaryQuery = `
      DECLARE @SevenDaysAgo DATE = DATEADD(DAY, -7, GETDATE());

      SELECT
        COUNT(*) as totalPicks,
        AVG(CASE
          WHEN DataOraInizio IS NOT NULL AND DataOraFine IS NOT NULL
          THEN DATEDIFF(SECOND, DataOraInizio, DataOraFine)
          ELSE NULL
        END) as avgPickTime,
        SUM(CASE WHEN Stato = 'completata' THEN 1 ELSE 0 END) as completed,
        SUM(Quantita) as totalQuantity
      FROM MissioniTraslo
      WHERE CAST(DataOraInizio AS DATE) >= @SevenDaysAgo
    `;

    const result = await pool.request().query(summaryQuery);
    const data = result.recordset[0];

    const accuracy = data.totalPicks > 0
      ? ((data.completed / data.totalPicks) * 100).toFixed(1)
      : 0;

    res.json({
      success: true,
      period: 'last_7_days',
      summary: {
        totalPicks: data.totalPicks,
        avgPickTime: data.avgPickTime ? Math.round(data.avgPickTime) + 's' : 'N/A',
        accuracy: accuracy + '%',
        totalQuantity: data.totalQuantity
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in /api/analytics/summary:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero summary',
      details: error.message
    });
  }
});

/**
 * GET /api/analytics/export/excel
 * Endpoint per preparare dati export Excel
 * (il client userà questi dati con XLSX per generare il file)
 */
router.get('/export/excel', async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        error: 'Parametri from e to obbligatori'
      });
    }

    const pool = await getPool();

    // Query dettagliata per export
    const exportQuery = `
      SELECT
        M.id,
        M.DataOraInizio as startTime,
        M.DataOraFine as endTime,
        DATEDIFF(SECOND, M.DataOraInizio, M.DataOraFine) as durationSeconds,
        M.IdOperatore as operatorId,
        U.username as operatorName,
        M.Stato as status,
        M.Quantita as quantity,
        M.CodiceArticolo as itemCode,
        A.Descrizione as itemDescription,
        M.UbicazionePartenza as fromLocation,
        M.UbicazioneArrivo as toLocation,
        M.MotivoAnnullamento as cancelReason
      FROM MissioniTraslo M
      LEFT JOIN Users U ON M.IdOperatore = U.id
      LEFT JOIN Articoli A ON M.CodiceArticolo = A.CodiceArticolo
      WHERE CAST(M.DataOraInizio AS DATE) BETWEEN @from AND @to
      ORDER BY M.DataOraInizio DESC
    `;

    const result = await pool.request()
      .input('from', from)
      .input('to', to)
      .query(exportQuery);

    res.json({
      success: true,
      dateRange: { from, to },
      data: result.recordset,
      count: result.recordset.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in /api/analytics/export/excel:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel preparare dati export',
      details: error.message
    });
  }
});

export default router;
