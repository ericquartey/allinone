/**
 * Routes per gestione regole barcode
 * Supporta parsing, validazione e import/export
 *
 * TABELLA DATABASE (creata automaticamente):
 * BarcodeRules: id, name, pattern, format, active, priority, extractors
 */

import express from 'express';
import { sql, getPool } from '../db-config.js';

const router = express.Router();

/**
 * Crea la tabella BarcodeRules se non esiste
 */
async function ensureBarcodeRulesTable() {
  try {
    const pool = await getPool();

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='BarcodeRules' AND xtype='U')
      BEGIN
        CREATE TABLE BarcodeRules (
          id INT PRIMARY KEY IDENTITY(1,1),
          name NVARCHAR(100) NOT NULL,
          pattern NVARCHAR(500) NOT NULL,
          format NVARCHAR(50) NOT NULL,
          active BIT NOT NULL DEFAULT 1,
          priority INT NOT NULL DEFAULT 0,
          extractors NVARCHAR(MAX), -- JSON string
          description NVARCHAR(500),
          createdDate DATETIME2 NOT NULL DEFAULT GETDATE(),
          modifiedDate DATETIME2,
          INDEX idx_active (active),
          INDEX idx_priority (priority DESC)
        );

        -- Insert default rules
        INSERT INTO BarcodeRules (name, pattern, format, description, priority, extractors) VALUES
        ('EAN-13', '^[0-9]{13}$', 'EAN13', 'Barcode EAN-13 standard (13 cifre)', 100, '{"itemCode": "full"}'),
        ('EAN-8', '^[0-9]{8}$', 'EAN8', 'Barcode EAN-8 standard (8 cifre)', 90, '{"itemCode": "full"}'),
        ('Code 128', '^[A-Z0-9]{1,48}$', 'CODE128', 'Barcode Code 128 alfanumerico', 80, '{"itemCode": "full"}'),
        ('SSCC', '^00[0-9]{18}$', 'SSCC', 'Serial Shipping Container Code (20 cifre)', 70, '{"sscc": "full"}'),
        ('GS1-128 con lotto', '\\(01\\)([0-9]{14})\\(10\\)([A-Z0-9]+)', 'GS1', 'GS1-128 con GTIN e lotto', 110, '{"itemCode": 1, "lot": 2}');

        PRINT 'Tabella BarcodeRules creata con regole default';
      END
    `);

  } catch (error) {
    console.error('Errore creazione tabella BarcodeRules:', error);
  }
}

// Inizializza tabella all'avvio
ensureBarcodeRulesTable();

/**
 * GET /api/barcodes/rules
 * Lista tutte le regole barcode
 */
router.get('/rules', async (req, res) => {
  try {
    const { activeOnly = false } = req.query;
    const pool = await getPool();

    let query = `
      SELECT
        id,
        name,
        pattern,
        format,
        active,
        priority,
        extractors,
        description,
        createdDate,
        modifiedDate
      FROM BarcodeRules
    `;

    if (activeOnly === 'true') {
      query += ' WHERE active = 1';
    }

    query += ' ORDER BY priority DESC, name';

    const result = await pool.request().query(query);

    // Parse extractors JSON
    const rules = result.recordset.map(rule => ({
      ...rule,
      extractors: rule.extractors ? JSON.parse(rule.extractors) : null
    }));

    res.json(rules);

  } catch (error) {
    console.error('Errore recupero regole barcode:', error);
    res.status(500).json({
      error: 'Errore durante il recupero delle regole barcode',
      details: error.message
    });
  }
});

/**
 * GET /api/barcodes/rules/:id
 * Dettaglio regola barcode
 */
router.get('/rules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();

    const result = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query(`
        SELECT
          id,
          name,
          pattern,
          format,
          active,
          priority,
          extractors,
          description,
          createdDate,
          modifiedDate
        FROM BarcodeRules
        WHERE id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Regola non trovata' });
    }

    const rule = result.recordset[0];
    rule.extractors = rule.extractors ? JSON.parse(rule.extractors) : null;

    res.json(rule);

  } catch (error) {
    console.error('Errore recupero regola:', error);
    res.status(500).json({
      error: 'Errore durante il recupero della regola',
      details: error.message
    });
  }
});

/**
 * POST /api/barcodes/rules
 * Crea nuova regola barcode
 */
router.post('/rules', async (req, res) => {
  try {
    const {
      name,
      pattern,
      format,
      active = true,
      priority = 0,
      extractors = null,
      description = null
    } = req.body;

    if (!name || !pattern || !format) {
      return res.status(400).json({
        error: 'Campi obbligatori mancanti: name, pattern, format'
      });
    }

    const pool = await getPool();

    // Verifica nome duplicato
    const checkResult = await pool.request()
      .input('name', sql.NVarChar, name)
      .query('SELECT id FROM BarcodeRules WHERE name = @name');

    if (checkResult.recordset.length > 0) {
      return res.status(409).json({ error: 'Nome regola già esistente' });
    }

    // Inserimento
    const extractorsJson = extractors ? JSON.stringify(extractors) : null;

    const insertResult = await pool.request()
      .input('name', sql.NVarChar, name)
      .input('pattern', sql.NVarChar, pattern)
      .input('format', sql.NVarChar, format)
      .input('active', sql.Bit, active)
      .input('priority', sql.Int, parseInt(priority))
      .input('extractors', sql.NVarChar, extractorsJson)
      .input('description', sql.NVarChar, description)
      .query(`
        INSERT INTO BarcodeRules (name, pattern, format, active, priority, extractors, description)
        OUTPUT INSERTED.id
        VALUES (@name, @pattern, @format, @active, @priority, @extractors, @description)
      `);

    const newId = insertResult.recordset[0].id;

    // Recupera la regola appena creata
    const ruleResult = await pool.request()
      .input('id', sql.Int, newId)
      .query('SELECT * FROM BarcodeRules WHERE id = @id');

    const rule = ruleResult.recordset[0];
    rule.extractors = rule.extractors ? JSON.parse(rule.extractors) : null;

    res.status(201).json(rule);

  } catch (error) {
    console.error('Errore creazione regola:', error);
    res.status(500).json({
      error: 'Errore durante la creazione della regola',
      details: error.message
    });
  }
});

/**
 * PUT /api/barcodes/rules/:id
 * Aggiorna regola esistente
 */
router.put('/rules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, pattern, format, active, priority, extractors, description } = req.body;

    const pool = await getPool();

    // Verifica esistenza
    const checkResult = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query('SELECT id FROM BarcodeRules WHERE id = @id');

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Regola non trovata' });
    }

    // Update
    const request = pool.request().input('id', sql.Int, parseInt(id));
    const updates = ['modifiedDate = GETDATE()'];

    if (name !== undefined) {
      request.input('name', sql.NVarChar, name);
      updates.push('name = @name');
    }
    if (pattern !== undefined) {
      request.input('pattern', sql.NVarChar, pattern);
      updates.push('pattern = @pattern');
    }
    if (format !== undefined) {
      request.input('format', sql.NVarChar, format);
      updates.push('format = @format');
    }
    if (active !== undefined) {
      request.input('active', sql.Bit, active);
      updates.push('active = @active');
    }
    if (priority !== undefined) {
      request.input('priority', sql.Int, parseInt(priority));
      updates.push('priority = @priority');
    }
    if (extractors !== undefined) {
      const extractorsJson = extractors ? JSON.stringify(extractors) : null;
      request.input('extractors', sql.NVarChar, extractorsJson);
      updates.push('extractors = @extractors');
    }
    if (description !== undefined) {
      request.input('description', sql.NVarChar, description);
      updates.push('description = @description');
    }

    if (updates.length === 1) {
      return res.status(400).json({ error: 'Nessun campo da aggiornare' });
    }

    await request.query(`
      UPDATE BarcodeRules
      SET ${updates.join(', ')}
      WHERE id = @id
    `);

    // Recupera regola aggiornata
    const ruleResult = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query('SELECT * FROM BarcodeRules WHERE id = @id');

    const rule = ruleResult.recordset[0];
    rule.extractors = rule.extractors ? JSON.parse(rule.extractors) : null;

    res.json(rule);

  } catch (error) {
    console.error('Errore aggiornamento regola:', error);
    res.status(500).json({
      error: 'Errore durante l\'aggiornamento della regola',
      details: error.message
    });
  }
});

/**
 * DELETE /api/barcodes/rules/:id
 * Elimina regola barcode
 */
router.delete('/rules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();

    // Verifica esistenza
    const checkResult = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query('SELECT id FROM BarcodeRules WHERE id = @id');

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Regola non trovata' });
    }

    // Elimina
    await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query('DELETE FROM BarcodeRules WHERE id = @id');

    res.json({ message: 'Regola eliminata con successo' });

  } catch (error) {
    console.error('Errore eliminazione regola:', error);
    res.status(500).json({
      error: 'Errore durante l\'eliminazione della regola',
      details: error.message
    });
  }
});

/**
 * POST /api/barcodes/parse
 * Analizza e parsea un barcode usando le regole definite
 */
router.post('/parse', async (req, res) => {
  try {
    const { barcode } = req.body;

    if (!barcode) {
      return res.status(400).json({ error: 'Barcode obbligatorio' });
    }

    const pool = await getPool();

    // Recupera tutte le regole attive ordinate per priorità
    const result = await pool.request()
      .query('SELECT * FROM BarcodeRules WHERE active = 1 ORDER BY priority DESC');

    const rules = result.recordset.map(rule => ({
      ...rule,
      extractors: rule.extractors ? JSON.parse(rule.extractors) : null
    }));

    // Trova prima regola che matcha
    let matchedRule = null;
    let extractedData = {};

    for (const rule of rules) {
      const regex = new RegExp(rule.pattern);
      const match = barcode.match(regex);

      if (match) {
        matchedRule = rule;

        // Estrai dati secondo gli extractors
        if (rule.extractors) {
          for (const [field, extractor] of Object.entries(rule.extractors)) {
            if (extractor === 'full') {
              extractedData[field] = barcode;
            } else if (typeof extractor === 'number') {
              extractedData[field] = match[extractor];
            }
          }
        }

        break;
      }
    }

    if (!matchedRule) {
      return res.json({
        success: false,
        message: 'Nessuna regola trovata per questo barcode',
        barcode,
        extractedData: null,
        matchedRule: null
      });
    }

    res.json({
      success: true,
      message: `Barcode riconosciuto come ${matchedRule.format}`,
      barcode,
      extractedData,
      matchedRule: {
        id: matchedRule.id,
        name: matchedRule.name,
        format: matchedRule.format
      }
    });

  } catch (error) {
    console.error('Errore parsing barcode:', error);
    res.status(500).json({
      error: 'Errore durante il parsing del barcode',
      details: error.message
    });
  }
});

/**
 * POST /api/barcodes/validate
 * Valida un barcode contro una regola specifica
 */
router.post('/validate', async (req, res) => {
  try {
    const { barcode, ruleId } = req.body;

    if (!barcode || !ruleId) {
      return res.status(400).json({ error: 'Barcode e ruleId obbligatori' });
    }

    const pool = await getPool();

    const result = await pool.request()
      .input('id', sql.Int, parseInt(ruleId))
      .query('SELECT * FROM BarcodeRules WHERE id = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Regola non trovata' });
    }

    const rule = result.recordset[0];
    const regex = new RegExp(rule.pattern);
    const isValid = regex.test(barcode);

    res.json({
      valid: isValid,
      barcode,
      rule: {
        id: rule.id,
        name: rule.name,
        pattern: rule.pattern,
        format: rule.format
      }
    });

  } catch (error) {
    console.error('Errore validazione barcode:', error);
    res.status(500).json({
      error: 'Errore durante la validazione',
      details: error.message
    });
  }
});

export default router;
