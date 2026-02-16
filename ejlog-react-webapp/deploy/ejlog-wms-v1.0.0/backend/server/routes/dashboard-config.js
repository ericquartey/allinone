// ============================================================================
// EJLOG WMS - Dashboard Configuration API Routes
// Gestione configurazioni dashboard personalizzate per utente
// ============================================================================

import express from 'express';
import sql from 'mssql';
import { getPool } from '../db-config.js';

const router = express.Router();

/**
 * Ensure DashboardConfigurations table exists
 */
async function ensureDashboardConfigTable() {
  try {
    const pool = await getPool();

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='DashboardConfigurations' AND xtype='U')
      BEGIN
        CREATE TABLE DashboardConfigurations (
          id INT IDENTITY(1,1) PRIMARY KEY,
          userId NVARCHAR(100) NOT NULL,
          layouts NVARCHAR(MAX) NOT NULL,
          widgets NVARCHAR(MAX) NOT NULL,
          createdDate DATETIME DEFAULT GETDATE(),
          modifiedDate DATETIME DEFAULT GETDATE(),
          UNIQUE (userId)
        )
      END
    `);

    console.log('✅ DashboardConfigurations table ready');
  } catch (error) {
    console.error('Errore creazione tabella DashboardConfigurations:', error);
    throw error;
  }
}

// Initialize table
ensureDashboardConfigTable();

/**
 * GET /api/dashboard/config/:userId
 * Recupera configurazione dashboard per utente
 */
router.get('/config/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const pool = await getPool();

    const result = await pool.request()
      .input('userId', sql.NVarChar, userId)
      .query('SELECT * FROM DashboardConfigurations WHERE userId = @userId');

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No dashboard configuration found for this user',
      });
    }

    const config = result.recordset[0];

    // Parse JSON strings back to objects
    const dashboardConfig = {
      userId: config.userId,
      layouts: JSON.parse(config.layouts),
      widgets: JSON.parse(config.widgets),
      createdDate: config.createdDate,
      modifiedDate: config.modifiedDate,
    };

    res.json(dashboardConfig);
  } catch (error) {
    console.error('Errore recupero configurazione dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Errore recupero configurazione dashboard',
      details: error.message,
    });
  }
});

/**
 * PUT /api/dashboard/config/:userId
 * Salva/Aggiorna configurazione dashboard per utente
 */
router.put('/config/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { layouts, widgets } = req.body;

    if (!layouts || !widgets) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: layouts, widgets',
      });
    }

    const pool = await getPool();

    // Convert objects to JSON strings
    const layoutsJson = typeof layouts === 'string' ? layouts : JSON.stringify(layouts);
    const widgetsJson = typeof widgets === 'string' ? widgets : JSON.stringify(widgets);

    // Check if config already exists
    const existing = await pool.request()
      .input('userId', sql.NVarChar, userId)
      .query('SELECT id FROM DashboardConfigurations WHERE userId = @userId');

    if (existing.recordset.length > 0) {
      // Update existing configuration
      await pool.request()
        .input('userId', sql.NVarChar, userId)
        .input('layouts', sql.NVarChar, layoutsJson)
        .input('widgets', sql.NVarChar, widgetsJson)
        .query(`
          UPDATE DashboardConfigurations
          SET layouts = @layouts,
              widgets = @widgets,
              modifiedDate = GETDATE()
          WHERE userId = @userId
        `);

      res.json({
        success: true,
        message: 'Dashboard configuration updated successfully',
      });
    } else {
      // Insert new configuration
      await pool.request()
        .input('userId', sql.NVarChar, userId)
        .input('layouts', sql.NVarChar, layoutsJson)
        .input('widgets', sql.NVarChar, widgetsJson)
        .query(`
          INSERT INTO DashboardConfigurations (userId, layouts, widgets)
          VALUES (@userId, @layouts, @widgets)
        `);

      res.json({
        success: true,
        message: 'Dashboard configuration created successfully',
      });
    }
  } catch (error) {
    console.error('Errore salvataggio configurazione dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Errore salvataggio configurazione dashboard',
      details: error.message,
    });
  }
});

/**
 * DELETE /api/dashboard/config/:userId
 * Elimina configurazione dashboard (reset to default)
 */
router.delete('/config/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const pool = await getPool();

    await pool.request()
      .input('userId', sql.NVarChar, userId)
      .query('DELETE FROM DashboardConfigurations WHERE userId = @userId');

    res.json({
      success: true,
      message: 'Dashboard configuration deleted successfully',
    });
  } catch (error) {
    console.error('Errore eliminazione configurazione dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Errore eliminazione configurazione dashboard',
      details: error.message,
    });
  }
});

export default router;
