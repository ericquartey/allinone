// ============================================================================
// EJLOG WMS - Data Export/Import API Routes
// Sistema di import/export massivo dati
// ============================================================================

import express from 'express';
import sql from 'mssql';
import { getPool } from '../db-config.js';
import XLSX from 'xlsx';
import { Parser } from 'json2csv';

const router = express.Router();

/**
 * Ensure ExportImportJobs table exists
 */
async function ensureExportImportJobsTable() {
  try {
    const pool = await getPool();

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ExportImportJobs' AND xtype='U')
      BEGIN
        CREATE TABLE ExportImportJobs (
          id INT IDENTITY(1,1) PRIMARY KEY,
          jobType NVARCHAR(20) NOT NULL,
          entity NVARCHAR(100) NOT NULL,
          format NVARCHAR(20) NOT NULL,
          status NVARCHAR(20) DEFAULT 'pending',
          totalRecords INT DEFAULT 0,
          processedRecords INT DEFAULT 0,
          successRecords INT DEFAULT 0,
          errorRecords INT DEFAULT 0,
          errors NVARCHAR(MAX),
          userId NVARCHAR(100),
          username NVARCHAR(100),
          fileName NVARCHAR(255),
          fileSize INT,
          downloadUrl NVARCHAR(MAX),
          startTime DATETIME,
          endTime DATETIME,
          createdDate DATETIME DEFAULT GETDATE()
        )

        CREATE INDEX IX_ExportImportJobs_Status ON ExportImportJobs(status)
        CREATE INDEX IX_ExportImportJobs_UserId ON ExportImportJobs(userId)
      END
    `);

    console.log('✅ ExportImportJobs table ready');
  } catch (error) {
    console.error('Errore creazione tabella ExportImportJobs:', error);
    throw error;
  }
}

// Initialize table
ensureExportImportJobsTable();

/**
 * POST /api/data-export-import/export
 * Esporta dati da una tabella
 */
router.post('/export', async (req, res) => {
  try {
    const {
      entity,
      format = 'xlsx',
      filters = {},
      columns = [],
      userId,
      username,
    } = req.body;

    if (!entity) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: entity',
      });
    }

    const pool = await getPool();

    // Create job record
    const jobResult = await pool.request()
      .input('jobType', sql.NVarChar, 'export')
      .input('entity', sql.NVarChar, entity)
      .input('format', sql.NVarChar, format)
      .input('userId', sql.NVarChar, userId || null)
      .input('username', sql.NVarChar, username || null)
      .input('startTime', sql.DateTime, new Date())
      .query(`
        INSERT INTO ExportImportJobs (jobType, entity, format, userId, username, status, startTime)
        OUTPUT INSERTED.id
        VALUES (@jobType, @entity, @format, @userId, @username, 'processing', @startTime)
      `);

    const jobId = jobResult.recordset[0].id;

    // Build query based on entity and filters
    let query = '';
    let whereConditions = [];

    // Determine table and columns
    const entityTableMap = {
      users: 'WmsUsers',
      items: 'Items',
      locations: 'Locations',
      operations: 'Operations',
      stock: 'Stock',
    };

    const tableName = entityTableMap[entity];
    if (!tableName) {
      throw new Error(`Unknown entity: ${entity}`);
    }

    // Build WHERE clause from filters
    const request = pool.request();
    Object.entries(filters).forEach(([key, value], index) => {
      whereConditions.push(`${key} = @filter${index}`);
      request.input(`filter${index}`, sql.NVarChar, value);
    });

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    const selectColumns = columns.length > 0 ? columns.join(', ') : '*';
    query = `SELECT ${selectColumns} FROM ${tableName} ${whereClause}`;

    // Execute query
    const result = await request.query(query);
    const data = result.recordset;

    // Generate file based on format
    let fileContent;
    let fileName;
    let mimeType;

    if (format === 'xlsx' || format === 'xls') {
      // Excel export
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, entity);
      fileContent = XLSX.write(wb, { type: 'buffer', bookType: format });
      fileName = `${entity}_export_${Date.now()}.${format}`;
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else if (format === 'csv') {
      // CSV export
      const parser = new Parser();
      fileContent = parser.parse(data);
      fileName = `${entity}_export_${Date.now()}.csv`;
      mimeType = 'text/csv';
    } else if (format === 'json') {
      // JSON export
      fileContent = JSON.stringify(data, null, 2);
      fileName = `${entity}_export_${Date.now()}.json`;
      mimeType = 'application/json';
    } else {
      throw new Error(`Unsupported format: ${format}`);
    }

    // Update job record
    await pool.request()
      .input('jobId', sql.Int, jobId)
      .input('status', sql.NVarChar, 'completed')
      .input('totalRecords', sql.Int, data.length)
      .input('successRecords', sql.Int, data.length)
      .input('fileName', sql.NVarChar, fileName)
      .input('fileSize', sql.Int, Buffer.byteLength(fileContent))
      .input('endTime', sql.DateTime, new Date())
      .query(`
        UPDATE ExportImportJobs
        SET status = @status,
            totalRecords = @totalRecords,
            processedRecords = @totalRecords,
            successRecords = @successRecords,
            fileName = @fileName,
            fileSize = @fileSize,
            endTime = @endTime
        WHERE id = @jobId
      `);

    // Send file
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', mimeType);
    res.send(fileContent);
  } catch (error) {
    console.error('Errore export dati:', error);
    res.status(500).json({
      success: false,
      error: 'Errore export dati',
      details: error.message,
    });
  }
});

/**
 * POST /api/data-export-import/import
 * Importa dati da file
 */
router.post('/import', async (req, res) => {
  try {
    const {
      entity,
      data,
      format,
      mode = 'insert', // insert, update, upsert
      mapping = {},
      userId,
      username,
    } = req.body;

    if (!entity || !data) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: entity, data',
      });
    }

    const pool = await getPool();

    // Create job record
    const jobResult = await pool.request()
      .input('jobType', sql.NVarChar, 'import')
      .input('entity', sql.NVarChar, entity)
      .input('format', sql.NVarChar, format || 'json')
      .input('userId', sql.NVarChar, userId || null)
      .input('username', sql.NVarChar, username || null)
      .input('totalRecords', sql.Int, data.length)
      .input('startTime', sql.DateTime, new Date())
      .query(`
        INSERT INTO ExportImportJobs (
          jobType, entity, format, userId, username, status, totalRecords, startTime
        )
        OUTPUT INSERTED.id
        VALUES (@jobType, @entity, @format, @userId, @username, 'processing', @totalRecords, @startTime)
      `);

    const jobId = jobResult.recordset[0].id;

    // Process import
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    const entityTableMap = {
      users: 'WmsUsers',
      items: 'Items',
      locations: 'Locations',
      operations: 'Operations',
      stock: 'Stock',
    };

    const tableName = entityTableMap[entity];
    if (!tableName) {
      throw new Error(`Unknown entity: ${entity}`);
    }

    for (let i = 0; i < data.length; i++) {
      try {
        const record = data[i];

        // Apply mapping if provided
        const mappedRecord = {};
        if (Object.keys(mapping).length > 0) {
          Object.entries(mapping).forEach(([sourceField, targetField]) => {
            if (record[sourceField] !== undefined) {
              mappedRecord[targetField] = record[sourceField];
            }
          });
        } else {
          Object.assign(mappedRecord, record);
        }

        // Build insert/update query
        const columns = Object.keys(mappedRecord);
        const values = Object.values(mappedRecord);

        if (mode === 'insert') {
          const placeholders = columns.map((_, idx) => `@val${idx}`).join(', ');
          const request = pool.request();

          columns.forEach((col, idx) => {
            request.input(`val${idx}`, values[idx]);
          });

          await request.query(`
            INSERT INTO ${tableName} (${columns.join(', ')})
            VALUES (${placeholders})
          `);
        } else if (mode === 'update') {
          // Requires an ID field
          if (!mappedRecord.id) {
            throw new Error('Update mode requires an id field');
          }

          const setClauses = columns
            .filter(col => col !== 'id')
            .map((col, idx) => `${col} = @val${idx}`)
            .join(', ');

          const request = pool.request().input('id', sql.Int, mappedRecord.id);

          columns.forEach((col, idx) => {
            if (col !== 'id') {
              request.input(`val${idx}`, values[idx]);
            }
          });

          await request.query(`
            UPDATE ${tableName}
            SET ${setClauses}
            WHERE id = @id
          `);
        } else if (mode === 'upsert') {
          // Try update first, then insert if not exists
          // Implementation depends on specific table structure
          // Simplified version here
          throw new Error('Upsert mode not yet implemented');
        }

        successCount++;
      } catch (error) {
        errorCount++;
        errors.push({
          row: i + 1,
          error: error.message,
          data: data[i],
        });
      }

      // Update progress
      await pool.request()
        .input('jobId', sql.Int, jobId)
        .input('processedRecords', sql.Int, i + 1)
        .query(`
          UPDATE ExportImportJobs
          SET processedRecords = @processedRecords
          WHERE id = @jobId
        `);
    }

    // Update final job status
    await pool.request()
      .input('jobId', sql.Int, jobId)
      .input('status', sql.NVarChar, errorCount === 0 ? 'completed' : 'completed_with_errors')
      .input('successRecords', sql.Int, successCount)
      .input('errorRecords', sql.Int, errorCount)
      .input('errors', sql.NVarChar, JSON.stringify(errors))
      .input('endTime', sql.DateTime, new Date())
      .query(`
        UPDATE ExportImportJobs
        SET status = @status,
            successRecords = @successRecords,
            errorRecords = @errorRecords,
            errors = @errors,
            endTime = @endTime
        WHERE id = @jobId
      `);

    res.json({
      success: true,
      message: 'Import completed',
      jobId,
      results: {
        total: data.length,
        success: successCount,
        errors: errorCount,
        errorDetails: errors,
      },
    });
  } catch (error) {
    console.error('Errore import dati:', error);
    res.status(500).json({
      success: false,
      error: 'Errore import dati',
      details: error.message,
    });
  }
});

/**
 * GET /api/data-export-import/jobs
 * Recupera lista job export/import
 */
router.get('/jobs', async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 50,
      jobType = '',
      status = '',
      userId = '',
    } = req.query;

    const pool = await getPool();

    let whereConditions = [];
    const request = pool.request();

    if (jobType) {
      whereConditions.push(`jobType = @jobType`);
      request.input('jobType', sql.NVarChar, jobType);
    }

    if (status) {
      whereConditions.push(`status = @status`);
      request.input('status', sql.NVarChar, status);
    }

    if (userId) {
      whereConditions.push(`userId = @userId`);
      request.input('userId', sql.NVarChar, userId);
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Get total count
    const countResult = await request.query(`
      SELECT COUNT(*) as total FROM ExportImportJobs ${whereClause}
    `);
    const total = countResult.recordset[0].total;

    // Get paginated jobs
    const offset = (page - 1) * pageSize;

    const result = await pool.request()
      .input('jobType', sql.NVarChar, jobType || '')
      .input('status', sql.NVarChar, status || '')
      .input('userId', sql.NVarChar, userId || '')
      .input('offset', sql.Int, offset)
      .input('pageSize', sql.Int, parseInt(pageSize))
      .query(`
        SELECT *
        FROM ExportImportJobs
        ${whereClause}
        ORDER BY createdDate DESC
        OFFSET @offset ROWS
        FETCH NEXT @pageSize ROWS ONLY
      `);

    res.json({
      success: true,
      data: result.recordset.map(job => ({
        ...job,
        errors: job.errors ? JSON.parse(job.errors) : null,
      })),
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Errore recupero job:', error);
    res.status(500).json({
      success: false,
      error: 'Errore recupero job',
      details: error.message,
    });
  }
});

/**
 * GET /api/data-export-import/jobs/:id
 * Recupera dettagli job specifico
 */
router.get('/jobs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();

    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM ExportImportJobs WHERE id = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    const job = {
      ...result.recordset[0],
      errors: result.recordset[0].errors ? JSON.parse(result.recordset[0].errors) : null,
    };

    res.json({
      success: true,
      data: job,
    });
  } catch (error) {
    console.error('Errore recupero job:', error);
    res.status(500).json({
      success: false,
      error: 'Errore recupero job',
      details: error.message,
    });
  }
});

/**
 * GET /api/data-export-import/templates/:entity
 * Recupera template per import (struttura dati attesa)
 */
router.get('/templates/:entity', async (req, res) => {
  try {
    const { entity } = req.params;
    const { format = 'xlsx' } = req.query;

    // Define templates for each entity
    const templates = {
      users: [
        {
          username: 'user1',
          email: 'user1@example.com',
          fullName: 'User One',
          role: 'operator',
          department: 'Warehouse',
          phoneNumber: '+1234567890',
        },
      ],
      items: [
        {
          code: 'ITEM001',
          description: 'Sample Item',
          category: 'Category A',
          unit: 'PCS',
          weight: 1.5,
          barcode: '1234567890123',
        },
      ],
      locations: [
        {
          code: 'A-01-01',
          description: 'Location A-01-01',
          area: 'A',
          zone: '01',
          type: 'picking',
          capacity: 100,
        },
      ],
    };

    const template = templates[entity];
    if (!template) {
      return res.status(404).json({
        success: false,
        error: `No template found for entity: ${entity}`,
      });
    }

    // Generate file based on format
    let fileContent;
    let fileName;
    let mimeType;

    if (format === 'xlsx' || format === 'xls') {
      const ws = XLSX.utils.json_to_sheet(template);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, entity);
      fileContent = XLSX.write(wb, { type: 'buffer', bookType: format });
      fileName = `${entity}_template.${format}`;
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else if (format === 'csv') {
      const parser = new Parser();
      fileContent = parser.parse(template);
      fileName = `${entity}_template.csv`;
      mimeType = 'text/csv';
    } else if (format === 'json') {
      fileContent = JSON.stringify(template, null, 2);
      fileName = `${entity}_template.json`;
      mimeType = 'application/json';
    } else {
      throw new Error(`Unsupported format: ${format}`);
    }

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', mimeType);
    res.send(fileContent);
  } catch (error) {
    console.error('Errore generazione template:', error);
    res.status(500).json({
      success: false,
      error: 'Errore generazione template',
      details: error.message,
    });
  }
});

export default router;
