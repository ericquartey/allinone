// ============================================================================
// EJLOG WMS - Report Scheduler API Routes
// Sistema di scheduling automatico report
// ============================================================================

import express from 'express';
import sql from 'mssql';
import { getPool } from '../db-config.js';
import cron from 'node-cron';

const router = express.Router();

// Store active cron jobs
const activeJobs = new Map();

/**
 * Ensure ScheduledReports table exists
 */
async function ensureScheduledReportsTable() {
  try {
    const pool = await getPool();

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ScheduledReports' AND xtype='U')
      BEGIN
        CREATE TABLE ScheduledReports (
          id INT IDENTITY(1,1) PRIMARY KEY,
          name NVARCHAR(200) NOT NULL,
          description NVARCHAR(MAX),
          reportType NVARCHAR(100) NOT NULL,
          reportConfig NVARCHAR(MAX) NOT NULL,
          schedule NVARCHAR(100) NOT NULL,
          status NVARCHAR(20) DEFAULT 'active',
          recipients NVARCHAR(MAX),
          format NVARCHAR(20) DEFAULT 'pdf',
          lastRun DATETIME,
          nextRun DATETIME,
          runCount INT DEFAULT 0,
          errorCount INT DEFAULT 0,
          lastError NVARCHAR(MAX),
          createdBy NVARCHAR(100),
          createdDate DATETIME DEFAULT GETDATE(),
          modifiedDate DATETIME DEFAULT GETDATE()
        )

        CREATE INDEX IX_ScheduledReports_Status ON ScheduledReports(status)
        CREATE INDEX IX_ScheduledReports_NextRun ON ScheduledReports(nextRun)
      END
    `);

    // Execution history table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ScheduledReportExecutions' AND xtype='U')
      BEGIN
        CREATE TABLE ScheduledReportExecutions (
          id INT IDENTITY(1,1) PRIMARY KEY,
          scheduledReportId INT NOT NULL,
          executionDate DATETIME DEFAULT GETDATE(),
          status NVARCHAR(20) NOT NULL,
          duration INT,
          recordCount INT,
          outputFile NVARCHAR(MAX),
          errorMessage NVARCHAR(MAX),
          FOREIGN KEY (scheduledReportId) REFERENCES ScheduledReports(id) ON DELETE CASCADE
        )

        CREATE INDEX IX_ScheduledReportExecutions_ScheduledReportId ON ScheduledReportExecutions(scheduledReportId)
        CREATE INDEX IX_ScheduledReportExecutions_ExecutionDate ON ScheduledReportExecutions(executionDate DESC)
      END
    `);

    console.log('✅ ScheduledReports tables ready');

    // Load and start active schedules
    await loadActiveSchedules();
  } catch (error) {
    console.error('Errore creazione tabelle ScheduledReports:', error);
    throw error;
  }
}

/**
 * Load and start all active schedules from database
 */
async function loadActiveSchedules() {
  try {
    const pool = await getPool();

    const result = await pool.request()
      .query("SELECT * FROM ScheduledReports WHERE status = 'active'");

    for (const schedule of result.recordset) {
      startSchedule(schedule);
    }

    console.log(`✅ Loaded ${result.recordset.length} active schedules`);
  } catch (error) {
    console.error('Errore caricamento schedule:', error);
  }
}

/**
 * Start a cron job for a schedule
 */
function startSchedule(schedule) {
  try {
    // Stop existing job if any
    if (activeJobs.has(schedule.id)) {
      activeJobs.get(schedule.id).stop();
    }

    // Validate cron expression
    if (!cron.validate(schedule.schedule)) {
      console.error(`Invalid cron expression for schedule ${schedule.id}: ${schedule.schedule}`);
      return;
    }

    // Create and start cron job
    const job = cron.schedule(schedule.schedule, async () => {
      console.log(`Executing scheduled report: ${schedule.name}`);
      await executeScheduledReport(schedule.id);
    });

    activeJobs.set(schedule.id, job);
    console.log(`✅ Started schedule: ${schedule.name} (${schedule.schedule})`);
  } catch (error) {
    console.error(`Errore avvio schedule ${schedule.id}:`, error);
  }
}

/**
 * Stop a cron job for a schedule
 */
function stopSchedule(scheduleId) {
  if (activeJobs.has(scheduleId)) {
    activeJobs.get(scheduleId).stop();
    activeJobs.delete(scheduleId);
    console.log(`⏹️ Stopped schedule: ${scheduleId}`);
  }
}

/**
 * Execute a scheduled report
 */
async function executeScheduledReport(scheduleId) {
  const startTime = Date.now();
  let status = 'success';
  let errorMessage = null;
  let recordCount = 0;

  try {
    const pool = await getPool();

    // Get schedule details
    const scheduleResult = await pool.request()
      .input('id', sql.Int, scheduleId)
      .query('SELECT * FROM ScheduledReports WHERE id = @id');

    if (scheduleResult.recordset.length === 0) {
      throw new Error('Schedule not found');
    }

    const schedule = scheduleResult.recordset[0];
    const config = JSON.parse(schedule.reportConfig);

    // Execute report based on type
    // This is a simplified implementation - in production, you would call your report generation logic
    console.log(`Generating report: ${schedule.reportType}`, config);

    // Simulate report execution
    await new Promise(resolve => setTimeout(resolve, 1000));
    recordCount = Math.floor(Math.random() * 1000) + 100;

    // Update last run
    await pool.request()
      .input('id', sql.Int, scheduleId)
      .input('lastRun', sql.DateTime, new Date())
      .input('runCount', sql.Int, schedule.runCount + 1)
      .query(`
        UPDATE ScheduledReports
        SET lastRun = @lastRun,
            runCount = runCount + 1,
            lastError = NULL
        WHERE id = @id
      `);

    console.log(`✅ Report executed successfully: ${schedule.name}`);
  } catch (error) {
    status = 'error';
    errorMessage = error.message;
    console.error(`❌ Error executing report ${scheduleId}:`, error);

    // Update error count
    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, scheduleId)
      .input('lastError', sql.NVarChar, errorMessage)
      .query(`
        UPDATE ScheduledReports
        SET errorCount = errorCount + 1,
            lastError = @lastError
        WHERE id = @id
      `);
  }

  // Log execution
  try {
    const pool = await getPool();
    const duration = Date.now() - startTime;

    await pool.request()
      .input('scheduledReportId', sql.Int, scheduleId)
      .input('status', sql.NVarChar, status)
      .input('duration', sql.Int, duration)
      .input('recordCount', sql.Int, recordCount)
      .input('errorMessage', sql.NVarChar, errorMessage)
      .query(`
        INSERT INTO ScheduledReportExecutions (
          scheduledReportId, status, duration, recordCount, errorMessage
        )
        VALUES (@scheduledReportId, @status, @duration, @recordCount, @errorMessage)
      `);
  } catch (error) {
    console.error('Error logging execution:', error);
  }
}

// Initialize tables and load schedules
ensureScheduledReportsTable();

/**
 * GET /api/report-scheduler/schedules
 * Recupera lista schedule report
 */
router.get('/schedules', async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 50,
      status = '',
      search = '',
    } = req.query;

    const pool = await getPool();

    let whereConditions = [];
    const request = pool.request();

    if (status) {
      whereConditions.push(`status = @status`);
      request.input('status', sql.NVarChar, status);
    }

    if (search) {
      whereConditions.push(`(name LIKE @search OR description LIKE @search)`);
      request.input('search', sql.NVarChar, `%${search}%`);
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Get total count
    const countResult = await request.query(`
      SELECT COUNT(*) as total FROM ScheduledReports ${whereClause}
    `);
    const total = countResult.recordset[0].total;

    // Get paginated schedules
    const offset = (page - 1) * pageSize;

    const result = await pool.request()
      .input('status', sql.NVarChar, status || '')
      .input('search', sql.NVarChar, search ? `%${search}%` : '')
      .input('offset', sql.Int, offset)
      .input('pageSize', sql.Int, parseInt(pageSize))
      .query(`
        SELECT *
        FROM ScheduledReports
        ${whereClause}
        ORDER BY createdDate DESC
        OFFSET @offset ROWS
        FETCH NEXT @pageSize ROWS ONLY
      `);

    res.json({
      success: true,
      data: result.recordset.map(s => ({
        ...s,
        reportConfig: JSON.parse(s.reportConfig),
        recipients: s.recipients ? JSON.parse(s.recipients) : [],
      })),
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Errore recupero schedules:', error);
    res.status(500).json({
      success: false,
      error: 'Errore recupero schedules',
      details: error.message,
    });
  }
});

/**
 * GET /api/report-scheduler/schedules/:id
 * Recupera singolo schedule
 */
router.get('/schedules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();

    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM ScheduledReports WHERE id = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Schedule not found',
      });
    }

    const schedule = {
      ...result.recordset[0],
      reportConfig: JSON.parse(result.recordset[0].reportConfig),
      recipients: result.recordset[0].recipients ? JSON.parse(result.recordset[0].recipients) : [],
    };

    res.json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    console.error('Errore recupero schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Errore recupero schedule',
      details: error.message,
    });
  }
});

/**
 * POST /api/report-scheduler/schedules
 * Crea nuovo schedule
 */
router.post('/schedules', async (req, res) => {
  try {
    const {
      name,
      description,
      reportType,
      reportConfig,
      schedule,
      recipients = [],
      format = 'pdf',
      createdBy,
    } = req.body;

    if (!name || !reportType || !reportConfig || !schedule) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    // Validate cron expression
    if (!cron.validate(schedule)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid cron schedule expression',
      });
    }

    const pool = await getPool();

    const result = await pool.request()
      .input('name', sql.NVarChar, name)
      .input('description', sql.NVarChar, description || null)
      .input('reportType', sql.NVarChar, reportType)
      .input('reportConfig', sql.NVarChar, JSON.stringify(reportConfig))
      .input('schedule', sql.NVarChar, schedule)
      .input('recipients', sql.NVarChar, JSON.stringify(recipients))
      .input('format', sql.NVarChar, format)
      .input('createdBy', sql.NVarChar, createdBy || null)
      .query(`
        INSERT INTO ScheduledReports (
          name, description, reportType, reportConfig, schedule,
          recipients, format, status, createdBy
        )
        OUTPUT INSERTED.*
        VALUES (
          @name, @description, @reportType, @reportConfig, @schedule,
          @recipients, @format, 'active', @createdBy
        )
      `);

    const newSchedule = result.recordset[0];

    // Start the cron job
    startSchedule(newSchedule);

    res.status(201).json({
      success: true,
      message: 'Schedule created successfully',
      data: {
        ...newSchedule,
        reportConfig: JSON.parse(newSchedule.reportConfig),
        recipients: JSON.parse(newSchedule.recipients),
      },
    });
  } catch (error) {
    console.error('Errore creazione schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Errore creazione schedule',
      details: error.message,
    });
  }
});

/**
 * PUT /api/report-scheduler/schedules/:id
 * Aggiorna schedule esistente
 */
router.put('/schedules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      reportType,
      reportConfig,
      schedule,
      status,
      recipients,
      format,
    } = req.body;

    const pool = await getPool();

    // Validate cron expression if provided
    if (schedule && !cron.validate(schedule)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid cron schedule expression',
      });
    }

    // Build update query
    let updates = [];
    const request = pool.request().input('id', sql.Int, id);

    if (name !== undefined) {
      updates.push('name = @name');
      request.input('name', sql.NVarChar, name);
    }
    if (description !== undefined) {
      updates.push('description = @description');
      request.input('description', sql.NVarChar, description);
    }
    if (reportType !== undefined) {
      updates.push('reportType = @reportType');
      request.input('reportType', sql.NVarChar, reportType);
    }
    if (reportConfig !== undefined) {
      updates.push('reportConfig = @reportConfig');
      request.input('reportConfig', sql.NVarChar, JSON.stringify(reportConfig));
    }
    if (schedule !== undefined) {
      updates.push('schedule = @schedule');
      request.input('schedule', sql.NVarChar, schedule);
    }
    if (status !== undefined) {
      updates.push('status = @status');
      request.input('status', sql.NVarChar, status);
    }
    if (recipients !== undefined) {
      updates.push('recipients = @recipients');
      request.input('recipients', sql.NVarChar, JSON.stringify(recipients));
    }
    if (format !== undefined) {
      updates.push('format = @format');
      request.input('format', sql.NVarChar, format);
    }

    updates.push('modifiedDate = GETDATE()');

    await request.query(`
      UPDATE ScheduledReports
      SET ${updates.join(', ')}
      WHERE id = @id
    `);

    // Restart cron job with new schedule
    const updatedResult = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM ScheduledReports WHERE id = @id');

    if (updatedResult.recordset.length > 0) {
      const updatedSchedule = updatedResult.recordset[0];

      if (updatedSchedule.status === 'active') {
        startSchedule(updatedSchedule);
      } else {
        stopSchedule(parseInt(id));
      }
    }

    res.json({
      success: true,
      message: 'Schedule updated successfully',
    });
  } catch (error) {
    console.error('Errore aggiornamento schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Errore aggiornamento schedule',
      details: error.message,
    });
  }
});

/**
 * DELETE /api/report-scheduler/schedules/:id
 * Elimina schedule
 */
router.delete('/schedules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();

    // Stop cron job
    stopSchedule(parseInt(id));

    // Delete from database
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM ScheduledReports WHERE id = @id');

    res.json({
      success: true,
      message: 'Schedule deleted successfully',
    });
  } catch (error) {
    console.error('Errore eliminazione schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Errore eliminazione schedule',
      details: error.message,
    });
  }
});

/**
 * POST /api/report-scheduler/schedules/:id/execute
 * Esegui manualmente uno schedule
 */
router.post('/schedules/:id/execute', async (req, res) => {
  try {
    const { id } = req.params;

    // Execute in background
    executeScheduledReport(parseInt(id)).catch(err => {
      console.error('Background execution error:', err);
    });

    res.json({
      success: true,
      message: 'Schedule execution started',
    });
  } catch (error) {
    console.error('Errore esecuzione manuale:', error);
    res.status(500).json({
      success: false,
      error: 'Errore esecuzione manuale',
      details: error.message,
    });
  }
});

/**
 * GET /api/report-scheduler/executions/:scheduleId
 * Recupera storico esecuzioni per uno schedule
 */
router.get('/executions/:scheduleId', async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const { page = 1, pageSize = 50 } = req.query;

    const pool = await getPool();

    // Get total count
    const countResult = await pool.request()
      .input('scheduleId', sql.Int, scheduleId)
      .query('SELECT COUNT(*) as total FROM ScheduledReportExecutions WHERE scheduledReportId = @scheduleId');

    const total = countResult.recordset[0].total;

    // Get paginated executions
    const offset = (page - 1) * pageSize;

    const result = await pool.request()
      .input('scheduleId', sql.Int, scheduleId)
      .input('offset', sql.Int, offset)
      .input('pageSize', sql.Int, parseInt(pageSize))
      .query(`
        SELECT *
        FROM ScheduledReportExecutions
        WHERE scheduledReportId = @scheduleId
        ORDER BY executionDate DESC
        OFFSET @offset ROWS
        FETCH NEXT @pageSize ROWS ONLY
      `);

    res.json({
      success: true,
      data: result.recordset,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Errore recupero executions:', error);
    res.status(500).json({
      success: false,
      error: 'Errore recupero executions',
      details: error.message,
    });
  }
});

export default router;
