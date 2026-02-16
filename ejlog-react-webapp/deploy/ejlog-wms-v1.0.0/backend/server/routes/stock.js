/**
 * Stock (Giacenze) Routes
 * Gestione giacenze e movimenti di magazzino
 */

import express from 'express';
import { getPool } from '../db-config.js';

const router = express.Router();

/**
 * GET /api/EjLogHostVertimag/Stock
 * Get stock/inventory data with filters
 */
router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    const { limit = 50, offset = 0, itemCode, lot, trayId } = req.query;

    console.log('[API] GET /Stock - Parametri:', { limit, offset, itemCode, lot, trayId });

    // IMPORTANT: Cerca prima di capire quale tabella contiene le giacenze
    // Possibili nomi: Giacenze, Stock, Inventario, GiacenzeMagazzino
    let result = null;
    let tableName = null;

    // Try 1: Tabella "Giacenze"
    try {
      const query = `
        SELECT
          id,
          idArticolo AS itemId,
          codiceArticolo AS itemCode,
          descrizioneArticolo AS itemDescription,
          quantita AS quantity,
          quantitaPrenotata AS reservedQuantity,
          quantitaDisponibile AS availableQuantity,
          lotto AS lot,
          numeroSeriale AS serialNumber,
          idLocazione AS locationId,
          codiceLocazione AS locationCode,
          idUDC AS loadingUnitId,
          dataInserimento AS insertDate,
          dataUltimaModifica AS lastModifiedDate
        FROM Giacenze
        WHERE recordCancellato = 0
        ${itemCode ? `AND codiceArticolo LIKE '%${itemCode}%'` : ''}
        ${lot ? `AND lotto LIKE '%${lot}%'` : ''}
        ${trayId ? `AND idLocazione = ${trayId}` : ''}
        ORDER BY id DESC
        OFFSET ${offset} ROWS
        FETCH NEXT ${limit} ROWS ONLY
      `;

      result = await pool.request().query(query);
      tableName = 'Giacenze';
      console.log(`[API] Tabella trovata: ${tableName}, ${result.recordset.length} records`);
    } catch (err1) {
      console.log(`[API] Tabella 'Giacenze' non trovata:`, err1.message);

      // Try 2: Tabella "Stock"
      try {
        result = await pool.request().query(`
          SELECT
            id,
            article_id AS itemId,
            article_code AS itemCode,
            description AS itemDescription,
            quantity,
            reserved_quantity AS reservedQuantity,
            lot,
            location_id AS locationId
          FROM Stock
          WHERE deleted = 0
          ${itemCode ? `AND article_code LIKE '%${itemCode}%'` : ''}
          ORDER BY id DESC
          OFFSET ${offset} ROWS
          FETCH NEXT ${limit} ROWS ONLY
        `);
        tableName = 'Stock';
        console.log(`[API] Tabella trovata: ${tableName}`);
      } catch (err2) {
        console.log(`[API] Tabella 'Stock' non trovata:`, err2.message);

        // Try 3: Usa dati da UdcProdotti (prodotti reali negli UDC)
        console.log('[API] Carico giacenze da UdcProdotti...');

        result = await pool.request().query(`
          SELECT
            UP.id,
            UP.idArticolo AS itemId,
            A.codice AS itemCode,
            A.descrizione AS itemDescription,
            UP.qta AS quantity,
            0 AS reservedQuantity,
            UP.qta AS availableQuantity,
            UP.lotto AS lot,
            UP.matricola AS serialNumber,
            U.idLocazione AS locationId,
            CAST(U.idLocazione AS VARCHAR) AS locationCode,
            UP.idUdc AS loadingUnitId,
            UP.dataCreazione AS insertDate,
            UP.dataModifica AS lastModifiedDate,
            UP.dataScadenza AS expiryDate
          FROM UdcProdotti UP
          LEFT JOIN Udc U ON UP.idUdc = U.id
          LEFT JOIN Articoli A ON UP.idArticolo = A.id
          WHERE UP.recordCancellato = 0
          ${itemCode ? `AND A.codice LIKE '%${itemCode}%'` : ''}
          ${lot ? `AND UP.lotto LIKE '%${lot}%'` : ''}
          ORDER BY UP.id DESC
          OFFSET ${offset} ROWS
          FETCH NEXT ${limit} ROWS ONLY
        `);
        tableName = 'UdcProdotti';
        console.log(`[API] Caricati ${result.recordset.length} prodotti da UdcProdotti`);
      }
    }

    // Count total for pagination
    const countQuery = tableName === 'UdcProdotti'
      ? `SELECT COUNT(*) AS total FROM UdcProdotti WHERE recordCancellato = 0`
      : tableName === 'Giacenze'
      ? `SELECT COUNT(*) AS total FROM Giacenze WHERE recordCancellato = 0`
      : `SELECT COUNT(*) AS total FROM Stock WHERE deleted = 0`;

    const countResult = await pool.request().query(countQuery);
    const totalCount = countResult.recordset[0].total;

    console.log(`[API] Totale records: ${totalCount}`);

    // Formato compatibile con il frontend (PaginatedResponse)
    const limitNum = parseInt(limit);
    const offsetNum = parseInt(offset);
    const currentPage = Math.floor(offsetNum / limitNum) + 1;
    const totalPages = Math.ceil(totalCount / limitNum);

    // Map backend format to match Java API format expected by api-legacy.ts
    const mappedStock = result.recordset.map(s => ({
      item: s.itemCode,
      description: s.itemDescription,
      lot: s.lot,
      serialNumber: s.serialNumber,
      expiryDate: s.expiryDate || null,
      qty: s.quantity || s.availableQuantity || 0,
      warehouseId: s.warehouseId || 1,
      LU: s.loadingUnitId
    }));

    // Return format compatible with Java backend (api-legacy.ts expects this)
    res.json({
      result: 'OK',                  // Java API format
      recordNumber: totalCount,      // Java API format
      exportedItems: mappedStock,    // Java API format
      stock: result.recordset,       // Raw data (backward compatibility)
      data: result.recordset,        // Backward compatibility
      total: totalCount,             // Total items
      totalCount,                    // Backward compatibility
      totalPages,                    // Total pages
      page: currentPage,             // Current page number
      pageSize: limitNum,            // Items per page
      limit: limitNum,               // Backward compatibility
      offset: offsetNum,             // Backward compatibility
      source: tableName              // Info tabella usata
    });

  } catch (err) {
    console.error('[API] Error fetching stock:', err);
    res.status(500).json({
      error: 'Errore nel recupero delle giacenze',
      message: err.message,
      details: err.stack
    });
  }
});

/**
 * GET /api/EjLogHostVertimag/Stock/Movements
 * Get stock movements
 */
router.get('/Movements', async (req, res) => {
  try {
    const pool = await getPool();
    const { limit = 50, offset = 0 } = req.query;

    console.log('[API] GET /Stock/Movements');

    // Cerca tabella movimenti
    let result = null;

    try {
      result = await pool.request().query(`
        SELECT
          id,
          idArticolo AS itemId,
          quantita AS quantity,
          tipoMovimento AS movementType,
          dataMovimento AS movementDate,
          idLocazione AS locationId,
          note AS notes
        FROM MovimentiMagazzino
        WHERE recordCancellato = 0
        ORDER BY dataMovimento DESC
        OFFSET ${offset} ROWS
        FETCH NEXT ${limit} ROWS ONLY
      `);
    } catch (err) {
      // Tabella non esiste, ritorna array vuoto
      console.warn('[API] Tabella MovimentiMagazzino non trovata');
      return res.json({ items: [], totalCount: 0 });
    }

    res.json({
      items: result.recordset,
      totalCount: result.recordset.length
    });

  } catch (err) {
    console.error('[API] Error fetching stock movements:', err);
    res.status(500).json({
      error: 'Errore nel recupero dei movimenti',
      message: err.message
    });
  }
});

export default router;
