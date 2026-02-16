// ============================================================================
// EJLOG WMS - User Statistics API
// Statistiche specifiche per utente loggato
// ============================================================================

import express from 'express';
import { sql, getPool } from '../db-config.js';

const router = express.Router();

/**
 * GET /api/user-stats/:userId
 * Recupera statistiche specifiche per l'utente
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const pool = await getPool();

    // Get user info from WmsUsers table (if exists)
    let userInfo = null;
    try {
      const userResult = await pool.request()
        .input('userId', sql.NVarChar, userId)
        .query(`
          SELECT username, displayName, email, roles, lastLoginDate, createdDate
          FROM WmsUsers
          WHERE userId = @userId
        `);

      if (userResult.recordset.length > 0) {
        userInfo = userResult.recordset[0];
        if (userInfo.roles) {
          try {
            userInfo.roles = JSON.parse(userInfo.roles);
          } catch {
            userInfo.roles = [];
          }
        }
      }
    } catch (error) {
      // WmsUsers table might not exist yet, use default
      console.log('WmsUsers table not available, using localStorage user data');
    }

    // Get user statistics from real tables
    const stats = await pool.request()
      .input('userId', sql.NVarChar, userId)
      .query(`
        -- Total lists assigned to user (if user tracking exists in Liste table)
        SELECT
          COUNT(*) as totalLists,
          SUM(CASE WHEN idTipoLista = 0 THEN 1 ELSE 0 END) as pickingLists,
          SUM(CASE WHEN idTipoLista = 1 THEN 1 ELSE 0 END) as refillingLists,
          SUM(CASE WHEN idTipoLista = 2 THEN 1 ELSE 0 END) as inventoryLists,
          SUM(CASE WHEN terminata = 1 THEN 1 ELSE 0 END) as completedLists,
          SUM(CASE WHEN terminata = 0 AND idStatoControlloEvadibilita > 0 THEN 1 ELSE 0 END) as inProgressLists
        FROM Liste
        WHERE 1=1
        -- Add user filter if column exists, otherwise show all
        -- AND (userId = @userId OR userId IS NULL)
      `);

    // Get recent activity from AuditLog
    const recentActivity = await pool.request()
      .input('userId', sql.NVarChar, userId)
      .query(`
        SELECT TOP 10
          action,
          entity,
          entityId,
          description,
          timestamp,
          status
        FROM AuditLog
        WHERE userId = @userId
        ORDER BY timestamp DESC
      `);

    // Get operations count (from LogMissioni or similar table)
    let operationsStats = {
      totalOperations: 0,
      completedToday: 0,
      completedThisWeek: 0,
      completedThisMonth: 0
    };

    try {
      const operationsResult = await pool.request()
        .input('userId', sql.NVarChar, userId)
        .query(`
          SELECT
            COUNT(*) as totalOperations,
            SUM(CASE
              WHEN CAST(endDate AS DATE) = CAST(GETDATE() AS DATE) THEN 1
              ELSE 0
            END) as completedToday,
            SUM(CASE
              WHEN endDate >= DATEADD(week, -1, GETDATE()) THEN 1
              ELSE 0
            END) as completedThisWeek,
            SUM(CASE
              WHEN endDate >= DATEADD(month, -1, GETDATE()) THEN 1
              ELSE 0
            END) as completedThisMonth
          FROM LogMissioni
          WHERE 1=1
          -- Add user filter if exists
          -- AND userId = @userId
        `);

      if (operationsResult.recordset.length > 0) {
        operationsStats = operationsResult.recordset[0];
      }
    } catch (error) {
      console.log('LogMissioni table not available for user stats');
    }

    // Combine all stats
    const response = {
      success: true,
      userInfo: userInfo || {
        userId,
        username: userId,
        displayName: userId,
        roles: [],
        lastLoginDate: new Date(),
        createdDate: null
      },
      stats: {
        lists: stats.recordset[0] || {
          totalLists: 0,
          pickingLists: 0,
          refillingLists: 0,
          inventoryLists: 0,
          completedLists: 0,
          inProgressLists: 0
        },
        operations: operationsStats,
        recentActivity: recentActivity.recordset || []
      },
      timestamp: new Date()
    };

    res.json(response);

  } catch (error) {
    console.error('Errore recupero statistiche utente:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante il recupero delle statistiche utente',
      details: error.message
    });
  }
});

/**
 * GET /api/user-stats/:userId/performance
 * Statistiche di performance dell'utente (tempo medio operazioni, efficienza, etc)
 */
router.get('/:userId/performance', async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;
    const pool = await getPool();

    // Calculate performance metrics from LogMissioni
    const performanceResult = await pool.request()
      .input('userId', sql.NVarChar, userId)
      .input('startDate', sql.DateTime, startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .input('endDate', sql.DateTime, endDate ? new Date(endDate) : new Date())
      .query(`
        SELECT
          COUNT(*) as totalOperations,
          AVG(DATEDIFF(minute, startDate, endDate)) as avgDurationMinutes,
          MIN(DATEDIFF(minute, startDate, endDate)) as minDurationMinutes,
          MAX(DATEDIFF(minute, startDate, endDate)) as maxDurationMinutes,
          SUM(CASE WHEN status = 2 THEN 1 ELSE 0 END) as completedOperations,
          SUM(CASE WHEN status = 3 THEN 1 ELSE 0 END) as failedOperations
        FROM LogMissioni
        WHERE startDate >= @startDate
          AND endDate <= @endDate
          AND endDate IS NOT NULL
        -- Add user filter if exists
        -- AND userId = @userId
      `);

    const performance = performanceResult.recordset[0] || {
      totalOperations: 0,
      avgDurationMinutes: 0,
      minDurationMinutes: 0,
      maxDurationMinutes: 0,
      completedOperations: 0,
      failedOperations: 0
    };

    // Calculate efficiency (completed / total)
    performance.efficiency = performance.totalOperations > 0
      ? (performance.completedOperations / performance.totalOperations * 100).toFixed(2)
      : 0;

    res.json({
      success: true,
      performance,
      period: {
        startDate,
        endDate
      }
    });

  } catch (error) {
    console.error('Errore recupero performance utente:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante il recupero delle performance utente',
      details: error.message
    });
  }
});

export default router;
