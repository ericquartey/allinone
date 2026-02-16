// ============================================================================
// EJLOG WMS - Audit Log API Routes
// Sistema di audit completo per tracciamento azioni utente
// ============================================================================

import express from 'express';
import sql from 'mssql';
import { getPool } from '../db-config.js';

const router = express.Router();

/**
 * Ensure AuditLog table exists
 */
async function ensureAuditLogTable() {
  try {
    const pool = await getPool();

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='AuditLog' AND xtype='U')
      BEGIN
        CREATE TABLE AuditLog (
          id INT IDENTITY(1,1) PRIMARY KEY,
          timestamp DATETIME DEFAULT GETDATE() NOT NULL,
          userId NVARCHAR(100),
          username NVARCHAR(100),
          action NVARCHAR(100) NOT NULL,
          entity NVARCHAR(100) NOT NULL,
          entityId NVARCHAR(100),
          description NVARCHAR(MAX),
          ipAddress NVARCHAR(50),
          userAgent NVARCHAR(MAX),
          previousValue NVARCHAR(MAX),
          newValue NVARCHAR(MAX),
          status NVARCHAR(20) DEFAULT 'success',
          errorMessage NVARCHAR(MAX),
          duration INT,
          sessionId NVARCHAR(100),
          severity NVARCHAR(20) DEFAULT 'info'
        )

        CREATE INDEX IX_AuditLog_Timestamp ON AuditLog(timestamp DESC)
        CREATE INDEX IX_AuditLog_UserId ON AuditLog(userId)
        CREATE INDEX IX_AuditLog_Action ON AuditLog(action)
        CREATE INDEX IX_AuditLog_Entity ON AuditLog(entity)
      END
    `);

    console.log('✅ AuditLog table ready');
  } catch (error) {
    console.error('Errore creazione tabella AuditLog:', error);
    throw error;
  }
}

// Initialize table
ensureAuditLogTable();

/**
 * Helper function to log audit entries
 * @param {Object} entry - Audit log entry
 */
export async function logAudit(entry) {
  try {
    const pool = await getPool();

    await pool.request()
      .input('userId', sql.NVarChar, entry.userId || null)
      .input('username', sql.NVarChar, entry.username || null)
      .input('action', sql.NVarChar, entry.action)
      .input('entity', sql.NVarChar, entry.entity)
      .input('entityId', sql.NVarChar, entry.entityId || null)
      .input('description', sql.NVarChar, entry.description || null)
      .input('ipAddress', sql.NVarChar, entry.ipAddress || null)
      .input('userAgent', sql.NVarChar, entry.userAgent || null)
      .input('previousValue', sql.NVarChar, entry.previousValue ? JSON.stringify(entry.previousValue) : null)
      .input('newValue', sql.NVarChar, entry.newValue ? JSON.stringify(entry.newValue) : null)
      .input('status', sql.NVarChar, entry.status || 'success')
      .input('errorMessage', sql.NVarChar, entry.errorMessage || null)
      .input('duration', sql.Int, entry.duration || null)
      .input('sessionId', sql.NVarChar, entry.sessionId || null)
      .input('severity', sql.NVarChar, entry.severity || 'info')
      .query(`
        INSERT INTO AuditLog (
          userId, username, action, entity, entityId, description,
          ipAddress, userAgent, previousValue, newValue, status,
          errorMessage, duration, sessionId, severity
        )
        VALUES (
          @userId, @username, @action, @entity, @entityId, @description,
          @ipAddress, @userAgent, @previousValue, @newValue, @status,
          @errorMessage, @duration, @sessionId, @severity
        )
      `);

    return true;
  } catch (error) {
    console.error('Errore logging audit:', error);
    return false;
  }
}

/**
 * GET /api/audit
 * Recupera log audit con filtri e paginazione
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 50,
      userId = '',
      action = '',
      entity = '',
      severity = '',
      status = '',
      startDate = '',
      endDate = '',
      search = '',
      sortBy = 'timestamp',
      sortOrder = 'DESC',
    } = req.query;

    const pool = await getPool();

    let whereConditions = [];
    const request = pool.request();

    if (userId) {
      whereConditions.push(`userId = @userId`);
      request.input('userId', sql.NVarChar, userId);
    }

    if (action) {
      whereConditions.push(`action = @action`);
      request.input('action', sql.NVarChar, action);
    }

    if (entity) {
      whereConditions.push(`entity = @entity`);
      request.input('entity', sql.NVarChar, entity);
    }

    if (severity) {
      whereConditions.push(`severity = @severity`);
      request.input('severity', sql.NVarChar, severity);
    }

    if (status) {
      whereConditions.push(`status = @status`);
      request.input('status', sql.NVarChar, status);
    }

    if (startDate) {
      whereConditions.push(`timestamp >= @startDate`);
      request.input('startDate', sql.DateTime, new Date(startDate));
    }

    if (endDate) {
      whereConditions.push(`timestamp <= @endDate`);
      request.input('endDate', sql.DateTime, new Date(endDate));
    }

    if (search) {
      whereConditions.push(`(username LIKE @search OR description LIKE @search OR entityId LIKE @search)`);
      request.input('search', sql.NVarChar, `%${search}%`);
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Get total count
    const countResult = await request.query(`
      SELECT COUNT(*) as total FROM AuditLog ${whereClause}
    `);
    const total = countResult.recordset[0].total;

    // Get paginated logs
    const offset = (page - 1) * pageSize;
    const validSortBy = ['timestamp', 'userId', 'username', 'action', 'entity', 'severity', 'status'].includes(sortBy)
      ? sortBy
      : 'timestamp';
    const validSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const result = await pool.request()
      .input('userId', sql.NVarChar, userId || '')
      .input('action', sql.NVarChar, action || '')
      .input('entity', sql.NVarChar, entity || '')
      .input('severity', sql.NVarChar, severity || '')
      .input('status', sql.NVarChar, status || '')
      .input('search', sql.NVarChar, search ? `%${search}%` : '')
      .input('startDate', sql.DateTime, startDate ? new Date(startDate) : null)
      .input('endDate', sql.DateTime, endDate ? new Date(endDate) : null)
      .input('offset', sql.Int, offset)
      .input('pageSize', sql.Int, parseInt(pageSize))
      .query(`
        SELECT *
        FROM AuditLog
        ${whereClause}
        ORDER BY ${validSortBy} ${validSortOrder}
        OFFSET @offset ROWS
        FETCH NEXT @pageSize ROWS ONLY
      `);

    const logs = result.recordset.map(log => ({
      ...log,
      previousValue: log.previousValue ? JSON.parse(log.previousValue) : null,
      newValue: log.newValue ? JSON.parse(log.newValue) : null,
    }));

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Errore recupero audit log:', error);
    res.status(500).json({
      success: false,
      error: 'Errore recupero audit log',
      details: error.message,
    });
  }
});

/**
 * GET /api/audit/:id
 * Recupera singolo log audit
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();

    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM AuditLog WHERE id = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Audit log not found',
      });
    }

    const log = {
      ...result.recordset[0],
      previousValue: result.recordset[0].previousValue ? JSON.parse(result.recordset[0].previousValue) : null,
      newValue: result.recordset[0].newValue ? JSON.parse(result.recordset[0].newValue) : null,
    };

    res.json({
      success: true,
      data: log,
    });
  } catch (error) {
    console.error('Errore recupero audit log:', error);
    res.status(500).json({
      success: false,
      error: 'Errore recupero audit log',
      details: error.message,
    });
  }
});

/**
 * POST /api/audit
 * Crea nuovo log audit (manual logging)
 */
router.post('/', async (req, res) => {
  try {
    const entry = {
      ...req.body,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      timestamp: new Date(),
    };

    const success = await logAudit(entry);

    if (success) {
      res.status(201).json({
        success: true,
        message: 'Audit log created successfully',
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to create audit log',
      });
    }
  } catch (error) {
    console.error('Errore creazione audit log:', error);
    res.status(500).json({
      success: false,
      error: 'Errore creazione audit log',
      details: error.message,
    });
  }
});

/**
 * GET /api/audit/stats/summary
 * Recupera statistiche audit
 */
router.get('/stats/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const pool = await getPool();

    let dateFilter = '';
    const request = pool.request();

    if (startDate && endDate) {
      dateFilter = 'WHERE timestamp >= @startDate AND timestamp <= @endDate';
      request.input('startDate', sql.DateTime, new Date(startDate));
      request.input('endDate', sql.DateTime, new Date(endDate));
    }

    const result = await request.query(`
      SELECT
        COUNT(*) as totalLogs,
        COUNT(DISTINCT userId) as uniqueUsers,
        COUNT(DISTINCT action) as uniqueActions,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successCount,
        SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as errorCount,
        SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as criticalCount,
        SUM(CASE WHEN severity = 'warning' THEN 1 ELSE 0 END) as warningCount,
        AVG(duration) as avgDuration
      FROM AuditLog
      ${dateFilter}
    `);

    const actionsResult = await request.query(`
      SELECT action, COUNT(*) as count
      FROM AuditLog
      ${dateFilter}
      GROUP BY action
      ORDER BY count DESC
    `);

    const entitiesResult = await request.query(`
      SELECT entity, COUNT(*) as count
      FROM AuditLog
      ${dateFilter}
      GROUP BY entity
      ORDER BY count DESC
    `);

    res.json({
      success: true,
      data: {
        summary: result.recordset[0],
        topActions: actionsResult.recordset.slice(0, 10),
        topEntities: entitiesResult.recordset.slice(0, 10),
      },
    });
  } catch (error) {
    console.error('Errore recupero statistiche audit:', error);
    res.status(500).json({
      success: false,
      error: 'Errore recupero statistiche audit',
      details: error.message,
    });
  }
});

/**
 * DELETE /api/audit/cleanup
 * Elimina log audit più vecchi di X giorni (maintenance)
 */
router.delete('/cleanup', async (req, res) => {
  try {
    const { days = 90 } = req.query;
    const pool = await getPool();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

    const result = await pool.request()
      .input('cutoffDate', sql.DateTime, cutoffDate)
      .query('DELETE FROM AuditLog WHERE timestamp < @cutoffDate');

    res.json({
      success: true,
      message: `Deleted ${result.rowsAffected[0]} audit logs older than ${days} days`,
      deletedCount: result.rowsAffected[0],
    });
  } catch (error) {
    console.error('Errore cleanup audit log:', error);
    res.status(500).json({
      success: false,
      error: 'Errore cleanup audit log',
      details: error.message,
    });
  }
});

export default router;
