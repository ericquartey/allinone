/**
 * Scheduler Configuration Routes
 * Manages all Scheduler (Prenotatore) system configuration parameters
 */

import express from 'express';
import { getPool } from '../db-config.js';

const router = express.Router();

/**
 * Default Scheduler configuration values
 */
const DEFAULT_CONFIG = {
  // Core Settings
  enabled: true,
  fetchInterval: 5000, // Polling interval in ms
  numWorkerThreads: 4, // Number of parallel workers

  // Prenotatore Settings - per tipo lista
  prenotatore: {
    picking: {
      enabled: true,
      priority: 1,
      maxLists: 10,
    },
    refilling: {
      enabled: true,
      priority: 2,
      maxLists: 5,
    },
    inventory: {
      enabled: false,
      priority: 3,
      maxLists: 3,
    },
    transfer: {
      enabled: false,
      priority: 4,
      maxLists: 2,
    },
  },

  // Performance Settings
  performance: {
    maxConcurrentReservations: 5,
    reservationTimeout: 30000, // ms
    retryAttempts: 3,
    retryDelay: 2000, // ms
  },

  // Monitoring Settings
  monitoring: {
    logLevel: 'info', // debug, info, warn, error
    enableMetrics: true,
    metricsInterval: 60000, // ms
  },
};

/**
 * GET /api/scheduler-config
 * Get full Scheduler configuration
 */
router.get('/', async (req, res) => {
  try {
    const pool = await getPool();

    // Check if SchedulerConfig table exists, create if not
    await pool.request().query(`
      IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'SchedulerConfig')
      BEGIN
        CREATE TABLE SchedulerConfig (
          id INT IDENTITY(1,1) PRIMARY KEY,
          configKey NVARCHAR(100) NOT NULL UNIQUE,
          configValue NVARCHAR(MAX),
          valueType NVARCHAR(20) DEFAULT 'string',
          description NVARCHAR(500),
          category NVARCHAR(50),
          createdAt DATETIME DEFAULT GETDATE(),
          updatedAt DATETIME DEFAULT GETDATE()
        )
      END
    `);

    // Load all config values
    const result = await pool.request().query(`
      SELECT configKey, configValue, valueType
      FROM SchedulerConfig
    `);

    // Build config object from database
    let config = { ...DEFAULT_CONFIG };

    if (result.recordset.length > 0) {
      result.recordset.forEach(row => {
        const keys = row.configKey.split('.');
        let target = config;

        // Navigate nested structure
        for (let i = 0; i < keys.length - 1; i++) {
          if (!target[keys[i]]) target[keys[i]] = {};
          target = target[keys[i]];
        }

        // Set value with correct type
        const lastKey = keys[keys.length - 1];
        const value = row.configValue;

        switch (row.valueType) {
          case 'boolean':
            target[lastKey] = value === 'true' || value === '1';
            break;
          case 'number':
            target[lastKey] = parseFloat(value);
            break;
          case 'array':
            target[lastKey] = JSON.parse(value);
            break;
          case 'object':
            target[lastKey] = JSON.parse(value);
            break;
          default:
            target[lastKey] = value;
        }
      });
    }

    res.json({
      success: true,
      config,
      source: result.recordset.length > 0 ? 'database' : 'defaults',
    });

  } catch (error) {
    console.error('[Scheduler Config] Error loading config:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante il caricamento della configurazione',
      error: error.message,
    });
  }
});

/**
 * PUT /api/scheduler-config
 * Update full Scheduler configuration
 */
router.put('/', async (req, res) => {
  try {
    const pool = await getPool();
    const config = req.body;

    console.log('[Scheduler Config] Updating configuration...');

    // Flatten config object into key-value pairs
    const flatten = (obj, prefix = '') => {
      const pairs = [];

      Object.entries(obj).forEach(([key, value]) => {
        const fullKey = prefix ? `${prefix}.${key}` : key;

        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          // Nested object - recurse
          pairs.push(...flatten(value, fullKey));
        } else {
          // Leaf value
          let valueType = 'string';
          let stringValue = String(value);

          if (typeof value === 'boolean') {
            valueType = 'boolean';
            stringValue = value ? 'true' : 'false';
          } else if (typeof value === 'number') {
            valueType = 'number';
          } else if (Array.isArray(value)) {
            valueType = 'array';
            stringValue = JSON.stringify(value);
          }

          pairs.push({ key: fullKey, value: stringValue, type: valueType });
        }
      });

      return pairs;
    };

    const configPairs = flatten(config);

    // Update or insert each config value
    for (const pair of configPairs) {
      await pool.request()
        .input('key', pair.key)
        .input('value', pair.value)
        .input('type', pair.type)
        .query(`
          IF EXISTS (SELECT 1 FROM SchedulerConfig WHERE configKey = @key)
            UPDATE SchedulerConfig
            SET configValue = @value,
                valueType = @type,
                updatedAt = GETDATE()
            WHERE configKey = @key
          ELSE
            INSERT INTO SchedulerConfig (configKey, configValue, valueType)
            VALUES (@key, @value, @type)
        `);
    }

    console.log('[Scheduler Config] ✅ Configuration updated successfully');

    res.json({
      success: true,
      message: 'Configurazione salvata con successo',
    });

  } catch (error) {
    console.error('[Scheduler Config] ❌ Error updating config:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante il salvataggio della configurazione',
      error: error.message,
    });
  }
});

/**
 * POST /api/scheduler-config/reset
 * Reset configuration to default values
 */
router.post('/reset', async (req, res) => {
  try {
    const pool = await getPool();

    console.log('[Scheduler Config] Resetting to default values...');

    // Delete all existing config
    await pool.request().query('DELETE FROM SchedulerConfig');

    console.log('[Scheduler Config] ✅ Configuration reset to defaults');

    res.json({
      success: true,
      message: 'Configurazione ripristinata ai valori predefiniti',
      config: DEFAULT_CONFIG,
    });

  } catch (error) {
    console.error('[Scheduler Config] ❌ Error resetting config:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante il ripristino della configurazione',
      error: error.message,
    });
  }
});

/**
 * GET /api/scheduler-config/export/json
 * Export configuration as JSON file
 */
router.get('/export/json', async (req, res) => {
  try {
    const pool = await getPool();

    // Load current config
    const result = await pool.request().query(`
      SELECT configKey, configValue, valueType
      FROM SchedulerConfig
    `);

    let config = { ...DEFAULT_CONFIG };

    if (result.recordset.length > 0) {
      result.recordset.forEach(row => {
        const keys = row.configKey.split('.');
        let target = config;

        for (let i = 0; i < keys.length - 1; i++) {
          if (!target[keys[i]]) target[keys[i]] = {};
          target = target[keys[i]];
        }

        const lastKey = keys[keys.length - 1];
        const value = row.configValue;

        switch (row.valueType) {
          case 'boolean':
            target[lastKey] = value === 'true' || value === '1';
            break;
          case 'number':
            target[lastKey] = parseFloat(value);
            break;
          case 'array':
            target[lastKey] = JSON.parse(value);
            break;
          case 'object':
            target[lastKey] = JSON.parse(value);
            break;
          default:
            target[lastKey] = value;
        }
      });
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="scheduler-config-${new Date().toISOString().split('T')[0]}.json"`);
    res.send(JSON.stringify(config, null, 2));

  } catch (error) {
    console.error('[Scheduler Config] Error exporting config:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante l\'esportazione',
      error: error.message,
    });
  }
});

export default router;
