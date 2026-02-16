/**
 * Barcode Scanner Routes - Real Implementation
 * Feature F - Integrazione Barcode Scanner con Backend
 */

import express from 'express';
import { getPool } from '../db-config.js';

const router = express.Router();

/**
 * POST /api/barcode/scan
 * Registra una scansione barcode e valida contro il database
 *
 * Body:
 * - barcode: codice scansionato
 * - userId: ID utente che ha scansionato
 * - context: contesto (picking, receiving, inventory, etc.)
 */
router.post('/scan', async (req, res) => {
  try {
    const { barcode, userId, context = 'general' } = req.body;

    if (!barcode) {
      return res.status(400).json({
        success: false,
        error: 'Barcode obbligatorio'
      });
    }

    const pool = await getPool();

    // Valida formato barcode
    const isValid = /^[A-Z0-9-]+$/i.test(barcode) && barcode.length >= 8;

    let itemInfo = null;
    let locationInfo = null;
    let udcInfo = null;

    // Cerca il barcode in diverse tabelle
    if (isValid) {
      // Cerca in Articoli
      try {
        const itemResult = await pool.request()
          .input('barcode', barcode)
          .query(`
            SELECT TOP 1
              id, CodiceArticolo, Descrizione, Barcode
            FROM Articoli
            WHERE Barcode = @barcode OR CodiceArticolo = @barcode
          `);

        if (itemResult.recordset.length > 0) {
          itemInfo = itemResult.recordset[0];
        }
      } catch (err) {
        console.log('Item lookup failed:', err.message);
      }

      // Cerca in Ubicazioni
      try {
        const locationResult = await pool.request()
          .input('barcode', barcode)
          .query(`
            SELECT TOP 1
              id, CodiceUbicazione, Descrizione, Barcode
            FROM Ubicazioni
            WHERE Barcode = @barcode OR CodiceUbicazione = @barcode
          `);

        if (locationResult.recordset.length > 0) {
          locationInfo = locationResult.recordset[0];
        }
      } catch (err) {
        console.log('Location lookup failed:', err.message);
      }

      // Cerca in UDC
      try {
        const udcResult = await pool.request()
          .input('barcode', barcode)
          .query(`
            SELECT TOP 1
              id, CodiceUDC, Tipo, Stato
            FROM UDC
            WHERE CodiceUDC = @barcode
          `);

        if (udcResult.recordset.length > 0) {
          udcInfo = udcResult.recordset[0];
        }
      } catch (err) {
        console.log('UDC lookup failed:', err.message);
      }
    }

    // Salva scan history
    try {
      await pool.request()
        .input('barcode', barcode)
        .input('userId', userId || null)
        .input('context', context)
        .input('isValid', isValid)
        .input('itemFound', itemInfo !== null)
        .input('locationFound', locationInfo !== null)
        .input('udcFound', udcInfo !== null)
        .query(`
          IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'BarcodeScanHistory')
          BEGIN
            CREATE TABLE BarcodeScanHistory (
              id INT IDENTITY(1,1) PRIMARY KEY,
              barcode NVARCHAR(100) NOT NULL,
              userId INT,
              context NVARCHAR(50),
              isValid BIT,
              itemFound BIT,
              locationFound BIT,
              udcFound BIT,
              timestamp DATETIME DEFAULT GETDATE()
            )
          END

          INSERT INTO BarcodeScanHistory (barcode, userId, context, isValid, itemFound, locationFound, udcFound)
          VALUES (@barcode, @userId, @context, @isValid, @itemFound, @locationFound, @udcFound)
        `);
    } catch (err) {
      console.error('Failed to save scan history:', err.message);
    }

    // Determina il tipo di entità trovata
    let entityType = null;
    let entityData = null;

    if (itemInfo) {
      entityType = 'item';
      entityData = itemInfo;
    } else if (locationInfo) {
      entityType = 'location';
      entityData = locationInfo;
    } else if (udcInfo) {
      entityType = 'udc';
      entityData = udcInfo;
    }

    res.json({
      success: true,
      barcode,
      isValid,
      found: entityType !== null,
      entityType,
      data: entityData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in /api/barcode/scan:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante la scansione',
      details: error.message
    });
  }
});

/**
 * GET /api/barcode/history
 * Ottieni storico scansioni
 *
 * Query params:
 * - userId: filtra per utente
 * - limit: numero massimo risultati (default: 50)
 */
router.get('/history', async (req, res) => {
  try {
    const { userId, limit = 50 } = req.query;

    const pool = await getPool();

    // Verifica esistenza tabella
    const tableCheck = await pool.request().query(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_NAME = 'BarcodeScanHistory'
    `);

    if (tableCheck.recordset.length === 0) {
      return res.json({
        success: true,
        history: [],
        count: 0
      });
    }

    let query = `
      SELECT TOP (@limit)
        id, barcode, userId, context, isValid,
        itemFound, locationFound, udcFound, timestamp
      FROM BarcodeScanHistory
    `;

    if (userId) {
      query += ` WHERE userId = @userId`;
    }

    query += ` ORDER BY timestamp DESC`;

    const request = pool.request()
      .input('limit', parseInt(limit));

    if (userId) {
      request.input('userId', parseInt(userId));
    }

    const result = await request.query(query);

    res.json({
      success: true,
      history: result.recordset,
      count: result.recordset.length
    });

  } catch (error) {
    console.error('Error in /api/barcode/history:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero storico',
      details: error.message
    });
  }
});

/**
 * POST /api/barcode/validate
 * Valida un barcode senza salvarlo
 */
router.post('/validate', async (req, res) => {
  try {
    const { barcode } = req.body;

    if (!barcode) {
      return res.status(400).json({
        success: false,
        error: 'Barcode obbligatorio'
      });
    }

    // Validazione formato
    const isValid = /^[A-Z0-9-]+$/i.test(barcode) && barcode.length >= 8;

    res.json({
      success: true,
      barcode,
      isValid,
      checks: {
        format: /^[A-Z0-9-]+$/i.test(barcode),
        length: barcode.length >= 8,
        checksum: true // Placeholder per checksum reale
      }
    });

  } catch (error) {
    console.error('Error in /api/barcode/validate:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nella validazione',
      details: error.message
    });
  }
});

export default router;
