/**
 * Routes per gestione report personalizzati
 * Supporta query builder, salvataggio, esecuzione e export multi-formato
 *
 * TABELLA DATABASE (creata automaticamente):
 * CustomReports: id, name, description, category, sqlQuery, filters, columns,
 *                createdBy, createdDate, modifiedDate, shared, favorite
 */

import express from 'express';
import { sql, getPool } from '../db-config.js';

const router = express.Router();

/**
 * Crea la tabella CustomReports se non esiste
 */
async function ensureCustomReportsTable() {
  try {
    const pool = await getPool();

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='CustomReports' AND xtype='U')
      BEGIN
        CREATE TABLE CustomReports (
          id INT PRIMARY KEY IDENTITY(1,1),
          name NVARCHAR(200) NOT NULL,
          description NVARCHAR(1000),
          category NVARCHAR(100), -- Es: 'Operazioni', 'Inventario', 'Utenti', 'Picking'

          -- Query e Configurazione
          sqlQuery NVARCHAR(MAX), -- Query SQL parametrica
          filters NVARCHAR(MAX), -- JSON: array di filtri disponibili
          columns NVARCHAR(MAX), -- JSON: configurazione colonne
          groupBy NVARCHAR(500), -- Campi di raggruppamento
          orderBy NVARCHAR(500), -- Ordinamento

          -- Metadata
          createdBy NVARCHAR(50),
          createdDate DATETIME2 NOT NULL DEFAULT GETDATE(),
          modifiedDate DATETIME2,
          lastExecuted DATETIME2,
          executionCount INT DEFAULT 0,

          -- Flags
          shared BIT NOT NULL DEFAULT 0, -- Visibile a tutti gli utenti
          favorite BIT NOT NULL DEFAULT 0, -- Report preferito
          active BIT NOT NULL DEFAULT 1,

          INDEX idx_category (category),
          INDEX idx_createdBy (createdBy),
          INDEX idx_shared (shared),
          INDEX idx_favorite (favorite)
        );

        -- Insert report di esempio
        INSERT INTO CustomReports (name, description, category, sqlQuery, columns, shared) VALUES
        (
          'Operazioni Oggi',
          'Tutte le operazioni create oggi',
          'Operazioni',
          'SELECT TOP 1000 id, description, orderNumber, priority, status, assignedTo, createdDate FROM Operations WHERE CAST(createdDate AS DATE) = CAST(GETDATE() AS DATE) ORDER BY createdDate DESC',
          '[{"field":"id","label":"ID","type":"number"},{"field":"description","label":"Descrizione","type":"string"},{"field":"orderNumber","label":"N. Ordine","type":"string"},{"field":"priority","label":"Priorità","type":"string"},{"field":"status","label":"Stato","type":"string"},{"field":"assignedTo","label":"Assegnato A","type":"string"},{"field":"createdDate","label":"Data Creazione","type":"datetime"}]',
          1
        ),
        (
          'Items per Cassetto',
          'Raggruppamento items per cassetto',
          'Inventario',
          'SELECT drawer, COUNT(*) as totalItems, SUM(CAST(quantity AS INT)) as totalQuantity FROM Items WHERE drawer IS NOT NULL GROUP BY drawer ORDER BY totalItems DESC',
          '[{"field":"drawer","label":"Cassetto","type":"string"},{"field":"totalItems","label":"Numero Items","type":"number"},{"field":"totalQuantity","label":"Quantità Totale","type":"number"}]',
          1
        ),
        (
          'Login Ultimi 7 Giorni',
          'Statistiche accessi ultimi 7 giorni',
          'Utenti',
          'SELECT CAST(attemptTimestamp AS DATE) as date, COUNT(*) as totalAttempts, SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successCount, SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failedCount FROM StoricoLogin WHERE attemptTimestamp >= DATEADD(DAY, -7, GETDATE()) GROUP BY CAST(attemptTimestamp AS DATE) ORDER BY date DESC',
          '[{"field":"date","label":"Data","type":"date"},{"field":"totalAttempts","label":"Tentativi Totali","type":"number"},{"field":"successCount","label":"Successi","type":"number"},{"field":"failedCount","label":"Falliti","type":"number"}]',
          1
        );

        PRINT 'Tabella CustomReports creata con report di esempio';
      END
    `);

  } catch (error) {
    console.error('Errore creazione tabella CustomReports:', error);
  }
}

// Inizializza tabella all'avvio
ensureCustomReportsTable();

/**
 * GET /api/reports
 * Lista tutti i report (con filtri opzionali)
 */
router.get('/', async (req, res) => {
  try {
    const { category, shared, favorite, createdBy } = req.query;
    const pool = await getPool();

    let query = `
      SELECT
        id,
        name,
        description,
        category,
        sqlQuery,
        filters,
        columns,
        groupBy,
        orderBy,
        createdBy,
        createdDate,
        modifiedDate,
        lastExecuted,
        executionCount,
        shared,
        favorite,
        active
      FROM CustomReports
      WHERE active = 1
    `;

    const params = [];

    if (category) {
      query += ' AND category = @category';
      params.push({ name: 'category', type: sql.NVarChar, value: category });
    }
    if (shared === 'true') {
      query += ' AND shared = 1';
    }
    if (favorite === 'true') {
      query += ' AND favorite = 1';
    }
    if (createdBy) {
      query += ' AND createdBy = @createdBy';
      params.push({ name: 'createdBy', type: sql.NVarChar, value: createdBy });
    }

    query += ' ORDER BY favorite DESC, category, name';

    const request = pool.request();
    params.forEach(p => request.input(p.name, p.type, p.value));

    const result = await request.query(query);

    // Parse JSON fields
    const reports = result.recordset.map(report => ({
      ...report,
      filters: report.filters ? JSON.parse(report.filters) : null,
      columns: report.columns ? JSON.parse(report.columns) : null,
    }));

    res.json(reports);

  } catch (error) {
    console.error('Errore recupero report:', error);
    res.status(500).json({
      error: 'Errore durante il recupero dei report',
      details: error.message
    });
  }
});

/**
 * GET /api/reports/categories
 * Lista tutte le categorie disponibili
 */
router.get('/categories', async (req, res) => {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT DISTINCT category, COUNT(*) as reportCount
      FROM CustomReports
      WHERE active = 1 AND category IS NOT NULL
      GROUP BY category
      ORDER BY category
    `);

    res.json(result.recordset);

  } catch (error) {
    console.error('Errore recupero categorie:', error);
    res.status(500).json({
      error: 'Errore durante il recupero delle categorie',
      details: error.message
    });
  }
});

/**
 * GET /api/reports/:id
 * Dettaglio report
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();

    const result = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query('SELECT * FROM CustomReports WHERE id = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Report non trovato' });
    }

    const report = result.recordset[0];
    report.filters = report.filters ? JSON.parse(report.filters) : null;
    report.columns = report.columns ? JSON.parse(report.columns) : null;

    res.json(report);

  } catch (error) {
    console.error('Errore recupero report:', error);
    res.status(500).json({
      error: 'Errore durante il recupero del report',
      details: error.message
    });
  }
});

/**
 * POST /api/reports
 * Crea nuovo report
 */
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      sqlQuery,
      filters = null,
      columns = null,
      groupBy = null,
      orderBy = null,
      createdBy = 'system',
      shared = false,
      favorite = false,
    } = req.body;

    if (!name || !sqlQuery) {
      return res.status(400).json({
        error: 'Campi obbligatori mancanti: name, sqlQuery'
      });
    }

    const pool = await getPool();

    const filtersJson = filters ? JSON.stringify(filters) : null;
    const columnsJson = columns ? JSON.stringify(columns) : null;

    const result = await pool.request()
      .input('name', sql.NVarChar, name)
      .input('description', sql.NVarChar, description)
      .input('category', sql.NVarChar, category)
      .input('sqlQuery', sql.NVarChar, sqlQuery)
      .input('filters', sql.NVarChar, filtersJson)
      .input('columns', sql.NVarChar, columnsJson)
      .input('groupBy', sql.NVarChar, groupBy)
      .input('orderBy', sql.NVarChar, orderBy)
      .input('createdBy', sql.NVarChar, createdBy)
      .input('shared', sql.Bit, shared)
      .input('favorite', sql.Bit, favorite)
      .query(`
        INSERT INTO CustomReports
        (name, description, category, sqlQuery, filters, columns, groupBy, orderBy, createdBy, shared, favorite)
        OUTPUT INSERTED.id
        VALUES
        (@name, @description, @category, @sqlQuery, @filters, @columns, @groupBy, @orderBy, @createdBy, @shared, @favorite)
      `);

    const newId = result.recordset[0].id;

    // Recupera report creato
    const reportResult = await pool.request()
      .input('id', sql.Int, newId)
      .query('SELECT * FROM CustomReports WHERE id = @id');

    const report = reportResult.recordset[0];
    report.filters = report.filters ? JSON.parse(report.filters) : null;
    report.columns = report.columns ? JSON.parse(report.columns) : null;

    res.status(201).json(report);

  } catch (error) {
    console.error('Errore creazione report:', error);
    res.status(500).json({
      error: 'Errore durante la creazione del report',
      details: error.message
    });
  }
});

/**
 * PUT /api/reports/:id
 * Aggiorna report esistente
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, sqlQuery, filters, columns, groupBy, orderBy, shared, favorite } = req.body;

    const pool = await getPool();

    // Verifica esistenza
    const checkResult = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query('SELECT id FROM CustomReports WHERE id = @id');

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Report non trovato' });
    }

    // Update
    const request = pool.request().input('id', sql.Int, parseInt(id));
    const updates = ['modifiedDate = GETDATE()'];

    if (name !== undefined) {
      request.input('name', sql.NVarChar, name);
      updates.push('name = @name');
    }
    if (description !== undefined) {
      request.input('description', sql.NVarChar, description);
      updates.push('description = @description');
    }
    if (category !== undefined) {
      request.input('category', sql.NVarChar, category);
      updates.push('category = @category');
    }
    if (sqlQuery !== undefined) {
      request.input('sqlQuery', sql.NVarChar, sqlQuery);
      updates.push('sqlQuery = @sqlQuery');
    }
    if (filters !== undefined) {
      const filtersJson = filters ? JSON.stringify(filters) : null;
      request.input('filters', sql.NVarChar, filtersJson);
      updates.push('filters = @filters');
    }
    if (columns !== undefined) {
      const columnsJson = columns ? JSON.stringify(columns) : null;
      request.input('columns', sql.NVarChar, columnsJson);
      updates.push('columns = @columns');
    }
    if (groupBy !== undefined) {
      request.input('groupBy', sql.NVarChar, groupBy);
      updates.push('groupBy = @groupBy');
    }
    if (orderBy !== undefined) {
      request.input('orderBy', sql.NVarChar, orderBy);
      updates.push('orderBy = @orderBy');
    }
    if (shared !== undefined) {
      request.input('shared', sql.Bit, shared);
      updates.push('shared = @shared');
    }
    if (favorite !== undefined) {
      request.input('favorite', sql.Bit, favorite);
      updates.push('favorite = @favorite');
    }

    if (updates.length === 1) {
      return res.status(400).json({ error: 'Nessun campo da aggiornare' });
    }

    await request.query(`
      UPDATE CustomReports
      SET ${updates.join(', ')}
      WHERE id = @id
    `);

    // Recupera report aggiornato
    const reportResult = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query('SELECT * FROM CustomReports WHERE id = @id');

    const report = reportResult.recordset[0];
    report.filters = report.filters ? JSON.parse(report.filters) : null;
    report.columns = report.columns ? JSON.parse(report.columns) : null;

    res.json(report);

  } catch (error) {
    console.error('Errore aggiornamento report:', error);
    res.status(500).json({
      error: 'Errore durante l\'aggiornamento del report',
      details: error.message
    });
  }
});

/**
 * DELETE /api/reports/:id
 * Elimina report (soft delete)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();

    // Soft delete
    const result = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query('UPDATE CustomReports SET active = 0 WHERE id = @id');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Report non trovato' });
    }

    res.json({ message: 'Report eliminato con successo' });

  } catch (error) {
    console.error('Errore eliminazione report:', error);
    res.status(500).json({
      error: 'Errore durante l\'eliminazione del report',
      details: error.message
    });
  }
});

/**
 * POST /api/reports/:id/execute
 * Esegue il report e restituisce i risultati
 */
router.post('/:id/execute', async (req, res) => {
  try {
    const { id } = req.params;
    const { parameters = {} } = req.body; // Parametri per query parametriche

    const pool = await getPool();

    // Recupera report
    const reportResult = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query('SELECT * FROM CustomReports WHERE id = @id AND active = 1');

    if (reportResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Report non trovato' });
    }

    const report = reportResult.recordset[0];
    let query = report.sqlQuery;

    // Sostituisci parametri nella query (es: {{paramName}})
    Object.entries(parameters).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      query = query.replace(regex, value);
    });

    // Esegui query
    const dataResult = await pool.request().query(query);

    // Aggiorna statistiche esecuzione
    await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query(`
        UPDATE CustomReports
        SET lastExecuted = GETDATE(), executionCount = executionCount + 1
        WHERE id = @id
      `);

    res.json({
      success: true,
      report: {
        id: report.id,
        name: report.name,
        category: report.category,
      },
      columns: report.columns ? JSON.parse(report.columns) : null,
      data: dataResult.recordset,
      recordCount: dataResult.recordset.length,
      executedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Errore esecuzione report:', error);
    res.status(500).json({
      error: 'Errore durante l\'esecuzione del report',
      details: error.message,
      query: error.query || null,
    });
  }
});

/**
 * POST /api/reports/execute-custom
 * Esegue una query custom senza salvarla
 */
router.post('/execute-custom', async (req, res) => {
  try {
    const { sqlQuery, parameters = {} } = req.body;

    if (!sqlQuery) {
      return res.status(400).json({ error: 'sqlQuery obbligatorio' });
    }

    const pool = await getPool();
    let query = sqlQuery;

    // Sostituisci parametri
    Object.entries(parameters).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      query = query.replace(regex, value);
    });

    // Limita a query SELECT per sicurezza
    if (!query.trim().toUpperCase().startsWith('SELECT')) {
      return res.status(400).json({
        error: 'Solo query SELECT sono permesse per l\'esecuzione custom'
      });
    }

    const result = await pool.request().query(query);

    res.json({
      success: true,
      data: result.recordset,
      recordCount: result.recordset.length,
      executedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Errore esecuzione query custom:', error);
    res.status(500).json({
      error: 'Errore durante l\'esecuzione della query',
      details: error.message,
    });
  }
});

export default router;
