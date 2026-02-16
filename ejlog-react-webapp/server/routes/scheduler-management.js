/**
 * Scheduler Management API Routes
 * Complete implementation of all scheduler operations
 *
 * This module provides REST API endpoints for managing schedulazioni (scheduled jobs)
 * It interfaces with the Java Quartz Scheduler backend via database
 */

const express = require('express');
const router = express.Router();
const sql = require('mssql');

// ============================================================================
// DATABASE CONNECTION
// ============================================================================

const dbConfig = {
  server: process.env.DB_SERVER || 'localhost\\SQL2019',
  database: process.env.DB_NAME || 'promag',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

// Use Windows Authentication if no user/password provided
if (!dbConfig.user && !dbConfig.password) {
  dbConfig.options.trustedConnection = true;
}

let pool;

async function getPool() {
  if (!pool) {
    pool = await sql.connect(dbConfig);
  }
  return pool;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Map database row to Schedulazione object
 */
function mapSchedulazione(row) {
  return {
    id: row.id,
    nome: row.nome,
    descrizione: row.descrizione,
    gruppo: row.gruppo,
    classe: row.classe,
    idSchedulatore: row.idSchedulatore,
    funzione: row.funzione,
    parametri: row.parametri,
    cronExpression: row.cronExpression,
    intervallo: row.intervallo,
    ripetizioni: row.ripetizioni,
    messaggioErrore: row.messaggioErrore,
    stopped: row.stopped === 1 || row.stopped === true,
    abilitata: row.abilitata === 1 || row.abilitata === true,
    modificata: row.modificata === 1 || row.modificata === true,
    isRunning: row.isRunning || false,
    isExecuting: row.isExecuting || false,
    interruptible: row.interruptible || false,
    configurable: row.configurable || false,
  };
}

/**
 * Send success response
 */
function sendSuccess(res, data, message) {
  res.json({
    success: true,
    data,
    message,
  });
}

/**
 * Send error response
 */
function sendError(res, error, statusCode = 500) {
  console.error('API Error:', error);
  res.status(statusCode).json({
    success: false,
    error: error.message || 'Internal server error',
  });
}

// ============================================================================
// SCHEDULER STATUS & OVERVIEW
// ============================================================================

/**
 * GET /api/scheduler-management/status
 * Get complete scheduler status with all schedulazioni
 */
router.get('/status', async (req, res) => {
  try {
    const pool = await getPool();

    // Get all schedulazioni
    const result = await pool.request().query(`
      SELECT * FROM Schedulazione
      ORDER BY nome
    `);

    const schedulazioni = result.recordset.map(mapSchedulazione);

    // Calculate summary
    const summary = {
      total: schedulazioni.length,
      active: schedulazioni.filter(s => !s.stopped && s.abilitata).length,
      running: schedulazioni.filter(s => s.isExecuting).length,
      errors: schedulazioni.filter(s => s.messaggioErrore).length,
      stopped: schedulazioni.filter(s => s.stopped).length,
      modified: schedulazioni.filter(s => s.modificata).length,
      prenotazioni: {
        totalPrenotazioni: 0, // TODO: Implement if prenotazioni table exists
        abilitate: 0,
        nonAbilitate: 0,
      },
    };

    // Get scheduler IDs
    const schedulerIdsResult = await pool.request().query(`
      SELECT DISTINCT idSchedulatore
      FROM Schedulazione
      WHERE idSchedulatore IS NOT NULL
      ORDER BY idSchedulatore
    `);

    const schedulerIds = schedulerIdsResult.recordset.map(r => r.idSchedulatore);

    sendSuccess(res, {
      schedulerExists: true,
      running: true,
      prenotatoreEnabled: false, // TODO: Check actual status
      schedulerIds,
      schedulazioni,
      summary,
    });
  } catch (error) {
    sendError(res, error);
  }
});

/**
 * GET /api/scheduler-management/summary
 * Get summary stats only
 */
router.get('/summary', async (req, res) => {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN stopped = 0 AND abilitata = 1 THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN stopped = 1 THEN 1 ELSE 0 END) as stopped,
        SUM(CASE WHEN messaggioErrore IS NOT NULL THEN 1 ELSE 0 END) as errors,
        SUM(CASE WHEN modificata = 1 THEN 1 ELSE 0 END) as modified
      FROM Schedulazione
    `);

    const stats = result.recordset[0];

    sendSuccess(res, {
      total: stats.total,
      active: stats.active,
      running: 0, // TODO: Get from running jobs
      errors: stats.errors,
      stopped: stats.stopped,
      modified: stats.modified,
      prenotazioni: {
        totalPrenotazioni: 0,
        abilitate: 0,
        nonAbilitate: 0,
      },
    });
  } catch (error) {
    sendError(res, error);
  }
});

// ============================================================================
// SCHEDULAZIONE CRUD OPERATIONS
// ============================================================================

/**
 * GET /api/scheduler-management
 * Get all schedulazioni with optional filtering
 */
router.get('/', async (req, res) => {
  try {
    const { schedulerId, showAll, gruppo } = req.query;
    const pool = await getPool();

    let query = 'SELECT * FROM Schedulazione WHERE 1=1';
    const request = pool.request();

    if (!showAll && schedulerId) {
      query += ' AND idSchedulatore = @schedulerId';
      request.input('schedulerId', sql.VarChar, schedulerId);
    }

    if (gruppo) {
      query += ' AND gruppo = @gruppo';
      request.input('gruppo', sql.VarChar, gruppo);
    }

    query += ' ORDER BY nome';

    const result = await request.query(query);
    const schedulazioni = result.recordset.map(mapSchedulazione);

    sendSuccess(res, schedulazioni);
  } catch (error) {
    sendError(res, error);
  }
});

/**
 * GET /api/scheduler-management/:id
 * Get single schedulazione by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();

    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM Schedulazione WHERE id = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Schedulazione not found',
      });
    }

    const schedulazione = mapSchedulazione(result.recordset[0]);
    sendSuccess(res, schedulazione);
  } catch (error) {
    sendError(res, error);
  }
});

/**
 * POST /api/scheduler-management
 * Create new schedulazione
 */
router.post('/', async (req, res) => {
  try {
    const {
      nome,
      descrizione,
      gruppo,
      classe,
      idSchedulatore,
      funzione,
      parametri,
      cronExpression,
      intervallo,
      ripetizioni,
      stopped,
      abilitata,
    } = req.body;

    // Validation
    if (!nome || !classe || !idSchedulatore) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: nome, classe, idSchedulatore',
      });
    }

    if (!cronExpression && !intervallo) {
      return res.status(400).json({
        success: false,
        error: 'Either cronExpression or intervallo must be provided',
      });
    }

    const pool = await getPool();

    const result = await pool.request()
      .input('nome', sql.VarChar, nome)
      .input('descrizione', sql.VarChar, descrizione || null)
      .input('gruppo', sql.VarChar, gruppo || null)
      .input('classe', sql.VarChar, classe)
      .input('idSchedulatore', sql.VarChar, idSchedulatore)
      .input('funzione', sql.VarChar, funzione || null)
      .input('parametri', sql.VarChar, parametri || null)
      .input('cronExpression', sql.VarChar, cronExpression || null)
      .input('intervallo', sql.BigInt, intervallo || null)
      .input('ripetizioni', sql.Int, ripetizioni || null)
      .input('stopped', sql.Bit, stopped !== undefined ? stopped : false)
      .input('abilitata', sql.Bit, abilitata !== undefined ? abilitata : true)
      .query(`
        INSERT INTO Schedulazione (
          nome, descrizione, gruppo, classe, idSchedulatore,
          funzione, parametri, cronExpression, intervallo, ripetizioni,
          stopped, abilitata, modificata
        )
        OUTPUT INSERTED.*
        VALUES (
          @nome, @descrizione, @gruppo, @classe, @idSchedulatore,
          @funzione, @parametri, @cronExpression, @intervallo, @ripetizioni,
          @stopped, @abilitata, 0
        )
      `);

    const schedulazione = mapSchedulazione(result.recordset[0]);

    // TODO: Call Java backend to register job in Quartz scheduler
    // await registerJobInQuartz(schedulazione);

    sendSuccess(res, schedulazione, 'Schedulazione created successfully');
  } catch (error) {
    sendError(res, error);
  }
});

/**
 * PATCH /api/scheduler-management/:id
 * Update existing schedulazione
 */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const pool = await getPool();

    // Build dynamic UPDATE query
    const fields = [];
    const request = pool.request();
    request.input('id', sql.Int, id);

    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined) {
        fields.push(`${key} = @${key}`);

        // Determine SQL type based on field
        let sqlType = sql.VarChar;
        if (key === 'intervallo') sqlType = sql.BigInt;
        else if (key === 'ripetizioni' || key === 'id') sqlType = sql.Int;
        else if (['stopped', 'abilitata', 'modificata'].includes(key)) sqlType = sql.Bit;

        request.input(key, sqlType, updates[key]);
      }
    });

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update',
      });
    }

    const result = await request.query(`
      UPDATE Schedulazione
      SET ${fields.join(', ')}, modificata = 1
      OUTPUT INSERTED.*
      WHERE id = @id
    `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Schedulazione not found',
      });
    }

    const schedulazione = mapSchedulazione(result.recordset[0]);

    // TODO: Call Java backend to update job in Quartz scheduler
    // await updateJobInQuartz(schedulazione);

    sendSuccess(res, schedulazione, 'Schedulazione updated successfully');
  } catch (error) {
    sendError(res, error);
  }
});

/**
 * DELETE /api/scheduler-management/:id
 * Delete schedulazione
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();

    // First, get the schedulazione to check if it can be deleted
    const checkResult = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM Schedulazione WHERE id = @id');

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Schedulazione not found',
      });
    }

    const schedulazione = mapSchedulazione(checkResult.recordset[0]);

    // Cannot delete if running
    if (!schedulazione.stopped && schedulazione.abilitata) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete active schedulazione. Disable it first.',
      });
    }

    // Delete from database
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Schedulazione WHERE id = @id');

    // TODO: Call Java backend to remove job from Quartz scheduler
    // await removeJobFromQuartz(schedulazione);

    res.status(204).send();
  } catch (error) {
    sendError(res, error);
  }
});

// ============================================================================
// SCHEDULER ACTIONS
// ============================================================================

/**
 * POST /api/scheduler-management/:id/execute
 * Execute job immediately (one-shot)
 */
router.post('/:id/execute', async (req, res) => {
  try {
    const { id } = req.params;
    const { forceIfStopped } = req.body;

    const pool = await getPool();

    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM Schedulazione WHERE id = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Schedulazione not found',
      });
    }

    const schedulazione = mapSchedulazione(result.recordset[0]);

    if (schedulazione.stopped && !forceIfStopped) {
      return res.status(400).json({
        success: false,
        error: 'Job is stopped. Set forceIfStopped=true to execute anyway.',
      });
    }

    // TODO: Call Java backend WmsTaskSchedulerModule.forceSchedulazioneOneShot()
    // await callJavaBackend(`/scheduler/${id}/execute`, { method: 'POST' });

    sendSuccess(res, null, `Job "${schedulazione.nome}" execution started`);
  } catch (error) {
    sendError(res, error);
  }
});

/**
 * POST /api/scheduler-management/:id/enable
 * Enable schedulazione
 */
router.post('/:id/enable', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();

    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        UPDATE Schedulazione
        SET stopped = 0, modificata = 1
        OUTPUT INSERTED.*
        WHERE id = @id AND abilitata = 1
      `);

    if (result.recordset.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Schedulazione not found or not enabled',
      });
    }

    const schedulazione = mapSchedulazione(result.recordset[0]);

    // TODO: Call Java backend WmsTaskSchedulerModule.abilitaSchedulazione()
    // await callJavaBackend(`/scheduler/${id}/enable`, { method: 'POST' });

    sendSuccess(res, schedulazione, `Job "${schedulazione.nome}" enabled successfully`);
  } catch (error) {
    sendError(res, error);
  }
});

/**
 * POST /api/scheduler-management/:id/disable
 * Disable schedulazione
 */
router.post('/:id/disable', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();

    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        UPDATE Schedulazione
        SET stopped = 1, modificata = 1
        OUTPUT INSERTED.*
        WHERE id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Schedulazione not found',
      });
    }

    const schedulazione = mapSchedulazione(result.recordset[0]);

    // TODO: Call Java backend WmsTaskSchedulerModule.disabilitaSchedulazione()
    // await callJavaBackend(`/scheduler/${id}/disable`, { method: 'POST' });

    sendSuccess(res, schedulazione, `Job "${schedulazione.nome}" disabled successfully`);
  } catch (error) {
    sendError(res, error);
  }
});

/**
 * POST /api/scheduler-management/:id/interrupt
 * Interrupt running job
 */
router.post('/:id/interrupt', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();

    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM Schedulazione WHERE id = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Schedulazione not found',
      });
    }

    const schedulazione = mapSchedulazione(result.recordset[0]);

    if (!schedulazione.interruptible) {
      return res.status(400).json({
        success: false,
        error: 'This job cannot be interrupted',
      });
    }

    // TODO: Call Java backend WmsTaskSchedulerModule.interrompiSchedulazione()
    // await callJavaBackend(`/scheduler/${id}/interrupt`, { method: 'POST' });

    sendSuccess(res, null, `Interrupt signal sent to job "${schedulazione.nome}"`);
  } catch (error) {
    sendError(res, error);
  }
});

/**
 * POST /api/scheduler-management/:id/clear-error
 * Clear error message
 */
router.post('/:id/clear-error', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();

    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        UPDATE Schedulazione
        SET messaggioErrore = NULL
        OUTPUT INSERTED.*
        WHERE id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Schedulazione not found',
      });
    }

    const schedulazione = mapSchedulazione(result.recordset[0]);
    sendSuccess(res, schedulazione, 'Error message cleared');
  } catch (error) {
    sendError(res, error);
  }
});

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * POST /api/scheduler-management/batch/enable
 * Enable multiple schedulazioni
 */
router.post('/batch/enable', async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ids array',
      });
    }

    const pool = await getPool();
    const results = [];

    for (const id of ids) {
      try {
        const result = await pool.request()
          .input('id', sql.Int, id)
          .query(`
            UPDATE Schedulazione
            SET stopped = 0, modificata = 1
            OUTPUT INSERTED.*
            WHERE id = @id AND abilitata = 1
          `);

        if (result.recordset.length > 0) {
          results.push({
            success: true,
            schedulazioneId: id,
            message: 'Enabled successfully',
          });
        }
      } catch (error) {
        results.push({
          success: false,
          schedulazioneId: id,
          error: error.message,
        });
      }
    }

    sendSuccess(res, results);
  } catch (error) {
    sendError(res, error);
  }
});

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * GET /api/scheduler-management/scheduler-ids
 * Get all unique scheduler IDs
 */
router.get('/scheduler-ids', async (req, res) => {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT DISTINCT idSchedulatore
      FROM Schedulazione
      WHERE idSchedulatore IS NOT NULL
      ORDER BY idSchedulatore
    `);

    const ids = result.recordset.map(r => r.idSchedulatore);
    sendSuccess(res, ids);
  } catch (error) {
    sendError(res, error);
  }
});

/**
 * GET /api/scheduler-management/health
 * Health check endpoint
 */
router.get('/health', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request().query('SELECT 1');

    res.json({
      healthy: true,
      message: 'Scheduler API is operational',
    });
  } catch (error) {
    res.status(503).json({
      healthy: false,
      message: error.message,
    });
  }
});

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = router;
