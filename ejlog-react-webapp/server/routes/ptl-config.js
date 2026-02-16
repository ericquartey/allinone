/**
 * PTL Configuration Routes
 * Manages all PTL system configuration parameters
 * Based on legacy Java ConfigPTLMethods implementation
 */

import express from 'express';
import { getPool } from '../db-config.js';

const router = express.Router();

/**
 * Default PTL configuration values
 * Migrated from Java ConfigPTLMethods constants
 */
const DEFAULT_CONFIG = {
  // Core Settings
  enabled: true,
  systemType: 1, // 1=AblePick, 2=Future extensibility
  warehouseId: null,

  // Location Settings
  locations: {
    pre: null,  // Pre-PTL staging location
    post: null, // Post-PTL output location
  },

  // Container Management
  container: {
    types: [],  // Array of container type IDs
    recycleEnabled: true, // true=reuse, false=always new
    autoEmpty: false, // Auto-empty on box opening
  },

  // Workflow Settings
  workflow: {
    pickReasons: [], // Array of pick reason IDs
    boxOpeningRequired: true,
    sumQuantities: false, // Sum qty in same compartment
  },

  // Barcode Settings
  barcode: {
    locationPrefix: '@',
    discharge: '#TMP0000000000',
    commands: {
      openBox: '$APERTURACOLLO',
      saturate: '$SATURAZIONECOLLO',
    },
  },

  // Reporting Settings
  reports: {
    containerLabel: true,
    packingList: true,
  },

  // Hardware Settings
  hardware: {
    defaultColor: 'green',
    defaultBlinkMode: 'blink',
    timeout: 5000, // Message timeout in ms
    retries: 3,
  },

  // Maintenance Settings
  maintenance: {
    cleanupInterval: 86400000, // 24 hours in ms
    udcRetentionDays: 30,
  },

  // UI Messages
  messages: {
    openBox: 'Apertura collo in corso...',
    closeBox: 'Chiusura collo completata',
  },
};

/**
 * GET /api/ptl-config
 * Get full PTL configuration
 */
router.get('/', async (req, res) => {
  try {
    const pool = await getPool();

    // Check if PTLConfig table exists, create if not
    await pool.request().query(`
      IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'PTLConfig')
      BEGIN
        CREATE TABLE PTLConfig (
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

    // Get all config values
    const result = await pool.request().query(`
      SELECT configKey, configValue, valueType
      FROM PTLConfig
      ORDER BY category, configKey
    `);

    // Build config object from database
    let config = { ...DEFAULT_CONFIG };

    if (result.recordset.length > 0) {
      result.recordset.forEach(row => {
        const keys = row.configKey.split('.');
        let obj = config;

        for (let i = 0; i < keys.length - 1; i++) {
          if (!obj[keys[i]]) obj[keys[i]] = {};
          obj = obj[keys[i]];
        }

        const lastKey = keys[keys.length - 1];
        obj[lastKey] = parseConfigValue(row.configValue, row.valueType);
      });
    }

    res.json({
      success: true,
      config: config,
    });

  } catch (error) {
    console.error('Error in GET /api/ptl-config:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero configurazione PTL',
      details: error.message,
    });
  }
});

/**
 * PUT /api/ptl-config
 * Update PTL configuration
 *
 * Body: Full or partial config object
 */
router.put('/', async (req, res) => {
  try {
    const updates = req.body;

    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Configurazione non valida',
      });
    }

    const pool = await getPool();

    // Flatten config object to key-value pairs
    const flatConfig = flattenConfig(updates);

    // Update or insert each config value
    for (const [key, value] of Object.entries(flatConfig)) {
      const { strValue, valueType } = serializeConfigValue(value);

      await pool.request()
        .input('configKey', key)
        .input('configValue', strValue)
        .input('valueType', valueType)
        .query(`
          IF EXISTS (SELECT 1 FROM PTLConfig WHERE configKey = @configKey)
            UPDATE PTLConfig
            SET configValue = @configValue, valueType = @valueType, updatedAt = GETDATE()
            WHERE configKey = @configKey
          ELSE
            INSERT INTO PTLConfig (configKey, configValue, valueType)
            VALUES (@configKey, @configValue, @valueType)
        `);
    }

    res.json({
      success: true,
      message: 'Configurazione aggiornata con successo',
      updatedKeys: Object.keys(flatConfig),
    });

  } catch (error) {
    console.error('Error in PUT /api/ptl-config:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nell\'aggiornamento configurazione',
      details: error.message,
    });
  }
});

/**
 * GET /api/ptl-config/:category
 * Get configuration for specific category
 *
 * Categories: core, locations, container, workflow, barcode, reports, hardware, maintenance, messages
 */
router.get('/:category', async (req, res) => {
  try {
    const { category } = req.params;

    const validCategories = ['core', 'locations', 'container', 'workflow', 'barcode', 'reports', 'hardware', 'maintenance', 'messages'];

    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        error: `Categoria non valida. Categorie disponibili: ${validCategories.join(', ')}`,
      });
    }

    const pool = await getPool();

    const result = await pool.request()
      .input('prefix', `${category}.%`)
      .query(`
        SELECT configKey, configValue, valueType, description
        FROM PTLConfig
        WHERE configKey LIKE @prefix OR configKey = @category
        ORDER BY configKey
      `);

    // Build category config
    const categoryConfig = {};
    result.recordset.forEach(row => {
      const key = row.configKey.replace(`${category}.`, '');
      categoryConfig[key] = parseConfigValue(row.configValue, row.valueType);
    });

    res.json({
      success: true,
      category,
      config: categoryConfig,
    });

  } catch (error) {
    console.error(`Error in GET /api/ptl-config/${req.params.category}:`, error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero configurazione categoria',
      details: error.message,
    });
  }
});

/**
 * POST /api/ptl-config/reset
 * Reset PTL configuration to defaults
 */
router.post('/reset', async (req, res) => {
  try {
    const pool = await getPool();

    // Clear all existing config
    await pool.request().query('DELETE FROM PTLConfig');

    // Insert default config
    const flatConfig = flattenConfig(DEFAULT_CONFIG);

    for (const [key, value] of Object.entries(flatConfig)) {
      const { strValue, valueType } = serializeConfigValue(value);
      const category = key.split('.')[0];

      await pool.request()
        .input('configKey', key)
        .input('configValue', strValue)
        .input('valueType', valueType)
        .input('category', category)
        .query(`
          INSERT INTO PTLConfig (configKey, configValue, valueType, category)
          VALUES (@configKey, @configValue, @valueType, @category)
        `);
    }

    res.json({
      success: true,
      message: 'Configurazione ripristinata ai valori predefiniti',
      config: DEFAULT_CONFIG,
    });

  } catch (error) {
    console.error('Error in POST /api/ptl-config/reset:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel ripristino configurazione',
      details: error.message,
    });
  }
});

/**
 * GET /api/ptl-config/export
 * Export PTL configuration as JSON
 */
router.get('/export/json', async (req, res) => {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT configKey, configValue, valueType, description, category
      FROM PTLConfig
      ORDER BY category, configKey
    `);

    const config = {};
    result.recordset.forEach(row => {
      const keys = row.configKey.split('.');
      let obj = config;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]]) obj[keys[i]] = {};
        obj = obj[keys[i]];
      }

      const lastKey = keys[keys.length - 1];
      obj[lastKey] = parseConfigValue(row.configValue, row.valueType);
    });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=ptl-config.json');
    res.json({
      exportDate: new Date().toISOString(),
      config: config,
    });

  } catch (error) {
    console.error('Error in GET /api/ptl-config/export/json:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nell\'esportazione configurazione',
      details: error.message,
    });
  }
});

/**
 * POST /api/ptl-config/import
 * Import PTL configuration from JSON
 *
 * Body: { config: {...} }
 */
router.post('/import', async (req, res) => {
  try {
    const { config } = req.body;

    if (!config || typeof config !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Configurazione da importare non valida',
      });
    }

    const pool = await getPool();

    // Validate config structure
    const flatConfig = flattenConfig(config);

    // Clear existing config
    await pool.request().query('DELETE FROM PTLConfig');

    // Insert imported config
    for (const [key, value] of Object.entries(flatConfig)) {
      const { strValue, valueType } = serializeConfigValue(value);
      const category = key.split('.')[0];

      await pool.request()
        .input('configKey', key)
        .input('configValue', strValue)
        .input('valueType', valueType)
        .input('category', category)
        .query(`
          INSERT INTO PTLConfig (configKey, configValue, valueType, category)
          VALUES (@configKey, @configValue, @valueType, @category)
        `);
    }

    res.json({
      success: true,
      message: 'Configurazione importata con successo',
      importedKeys: Object.keys(flatConfig).length,
    });

  } catch (error) {
    console.error('Error in POST /api/ptl-config/import:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nell\'importazione configurazione',
      details: error.message,
    });
  }
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Flatten nested config object to dot-notation keys
 * Example: { workflow: { boxOpeningRequired: true } } → { 'workflow.boxOpeningRequired': true }
 */
function flattenConfig(obj, prefix = '') {
  const flattened = {};

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(flattened, flattenConfig(value, fullKey));
    } else {
      flattened[fullKey] = value;
    }
  }

  return flattened;
}

/**
 * Serialize config value to string for database storage
 */
function serializeConfigValue(value) {
  if (value === null || value === undefined) {
    return { strValue: null, valueType: 'null' };
  }

  if (typeof value === 'boolean') {
    return { strValue: value ? '1' : '0', valueType: 'boolean' };
  }

  if (typeof value === 'number') {
    return { strValue: String(value), valueType: 'number' };
  }

  if (Array.isArray(value)) {
    return { strValue: JSON.stringify(value), valueType: 'array' };
  }

  // String
  return { strValue: String(value), valueType: 'string' };
}

/**
 * Parse config value from database string
 */
function parseConfigValue(strValue, valueType) {
  if (strValue === null || valueType === 'null') {
    return null;
  }

  switch (valueType) {
    case 'boolean':
      return strValue === '1' || strValue === 'true';

    case 'number':
      return Number(strValue);

    case 'array':
      try {
        return JSON.parse(strValue);
      } catch (e) {
        return [];
      }

    case 'string':
    default:
      return strValue;
  }
}

export default router;
