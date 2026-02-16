/**
 * Stock Movements Controller
 *
 * Business logic per gestione movimenti di magazzino (Storico movimenti)
 * Tabella: Movimenti o MovimentiMagazzino
 * Schema reale database SQL Server - EjLog WMS
 */

import { getPool, sql } from '../db-config.js';
import { NotFoundError } from '../middleware/error-handler.js';

export const getStockMovements = async (req, res) => {
  const pool = await getPool();
  const {
    itemId,
    itemCode,
    movementType,
    fromDate,
    toDate,
    fromLocationId,
    toLocationId,
    lot,
    serialNumber,
    documentNumber,
    operatorUserName,
    search
  } = req.query;

  const { limit, offset } = req.pagination;
  const page = Math.floor(offset / limit) + 1;

  const request = pool.request();
  let whereConditions = [];

  // Filtro per codice articolo
  if (itemCode) {
    whereConditions.push('(A.codice LIKE @itemCode OR A.codiceArticolo LIKE @itemCode)');
    request.input('itemCode', sql.NVarChar, `%${itemCode}%`);
  }

  // Filtro per ID articolo
  if (itemId) {
    whereConditions.push('M.idArticolo = @itemId');
    request.input('itemId', sql.Int, parseInt(itemId));
  }

  // Filtro per range date
  if (fromDate) {
    whereConditions.push('M.dataMovimento >= @fromDate');
    request.input('fromDate', sql.DateTime, new Date(fromDate));
  }

  if (toDate) {
    whereConditions.push('M.dataMovimento <= @toDate');
    request.input('toDate', sql.DateTime, new Date(toDate));
  }

  // Filtro per lotto
  if (lot) {
    whereConditions.push('M.lotto LIKE @lot');
    request.input('lot', sql.NVarChar, `%${lot}%`);
  }

  // Filtro per numero documento
  if (documentNumber) {
    whereConditions.push('(M.numeroDocumento LIKE @doc OR M.rifDocumento LIKE @doc)');
    request.input('doc', sql.NVarChar, `%${documentNumber}%`);
  }

  // Filtro ricerca generale
  if (search) {
    whereConditions.push('(A.codice LIKE @search OR A.descrizione LIKE @search OR M.lotto LIKE @search)');
    request.input('search', sql.NVarChar, `%${search}%`);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  request.input('offset', sql.Int, offset);
  request.input('limit', sql.Int, limit);

  try {
    // Query principale per ottenere i movimenti
    const result = await request.query(`
      SELECT TOP (@limit)
        M.id,
        M.dataMovimento AS occurredAt,
        M.idArticolo AS itemId,
        A.codice AS itemCode,
        A.descrizione AS itemDescription,
        A.um AS itemUom,
        M.quantita AS quantity,
        M.lotto AS lot,
        M.numeroDocumento AS documentNumber,
        M.rifDocumento AS referenceDocument,
        M.idTipoMovimento AS movementTypeId,
        TM.descrizione AS movementTypeDescription,
        M.idLocazione AS locationId,
        L.barcode AS locationCode,
        L.descrizione AS locationDescription,
        M.idUtente AS userId,
        U.login AS operatorUserName,
        U.nome AS operatorFirstName,
        U.cognome AS operatorLastName,
        M.note AS notes
      FROM Movimenti M
      LEFT JOIN Articoli A ON M.idArticolo = A.id
      LEFT JOIN TipiMovimento TM ON M.idTipoMovimento = TM.id
      LEFT JOIN Locazioni L ON M.idLocazione = L.id
      LEFT JOIN Utenti U ON M.idUtente = U.id
      ${whereClause}
      ORDER BY M.dataMovimento DESC, M.id DESC
      OFFSET @offset ROWS
    `);

    // Query per contare il totale
    const countRequest = pool.request();
    if (itemCode) countRequest.input('itemCode', sql.NVarChar, `%${itemCode}%`);
    if (itemId) countRequest.input('itemId', sql.Int, parseInt(itemId));
    if (fromDate) countRequest.input('fromDate', sql.DateTime, new Date(fromDate));
    if (toDate) countRequest.input('toDate', sql.DateTime, new Date(toDate));
    if (lot) countRequest.input('lot', sql.NVarChar, `%${lot}%`);
    if (documentNumber) countRequest.input('doc', sql.NVarChar, `%${documentNumber}%`);
    if (search) countRequest.input('search', sql.NVarChar, `%${search}%`);

    const countResult = await countRequest.query(`
      SELECT COUNT(*) as total
      FROM Movimenti M
      LEFT JOIN Articoli A ON M.idArticolo = A.id
      ${whereClause}
    `);

    const total = countResult.recordset[0].total;

    // Trasforma i dati per il frontend
    const movements = result.recordset.map(m => {
      // Determina il tipo di movimento in formato standard
      let movementType = 'ADJUSTMENT';
      if (m.quantity > 0) {
        movementType = 'IN';
      } else if (m.quantity < 0) {
        movementType = 'OUT';
      }

      // Se abbiamo la descrizione del tipo movimento, usala per determinare il tipo
      const typeDesc = (m.movementTypeDescription || '').toLowerCase();
      if (typeDesc.includes('trasfer') || typeDesc.includes('moviment')) {
        movementType = 'TRANSFER';
      }

      return {
        id: m.id,
        occurredAt: m.occurredAt,
        movementType,
        movementTypeDescription: m.movementTypeDescription,
        itemId: m.itemId,
        itemCode: m.itemCode,
        itemDescription: m.itemDescription,
        itemUom: m.itemUom,
        quantity: m.quantity,
        lot: m.lot,
        documentNumber: m.documentNumber,
        referenceDocument: m.referenceDocument,
        locationId: m.locationId,
        locationCode: m.locationCode,
        locationDescription: m.locationDescription,
        userId: m.userId,
        operatorUserName: m.operatorUserName,
        operatorFullName: m.operatorFirstName && m.operatorLastName
          ? `${m.operatorFirstName} ${m.operatorLastName}`.trim()
          : null,
        notes: m.notes
      };
    });

    res.json({
      success: true,
      data: movements,
      pagination: {
        total,
        page,
        pageSize: limit,
        totalPages: Math.ceil(total / limit),
        hasMore: (offset + limit) < total
      }
    });

  } catch (error) {
    // Se la tabella Movimenti non esiste, prova con nomi alternativi
    if (error.message.includes('Invalid object name')) {
      console.error('⚠️ Tabella Movimenti non trovata, provo con MovimentiMagazzino...');

      // Riprova con nome tabella alternativo
      try {
        const altRequest = pool.request();
        altRequest.input('offset', sql.Int, offset);
        altRequest.input('limit', sql.Int, limit);

        const altResult = await altRequest.query(`
          SELECT TOP (@limit)
            MM.id,
            MM.data AS occurredAt,
            MM.idArticolo AS itemId,
            A.codice AS itemCode,
            A.descrizione AS itemDescription,
            MM.quantita AS quantity,
            MM.lotto AS lot,
            MM.documento AS documentNumber,
            L.barcode AS locationCode
          FROM MovimentiMagazzino MM
          LEFT JOIN Articoli A ON MM.idArticolo = A.id
          LEFT JOIN Locazioni L ON MM.idLocazione = L.id
          ORDER BY MM.data DESC
          OFFSET @offset ROWS
        `);

        return res.json({
          success: true,
          data: altResult.recordset.map(m => ({
            id: m.id,
            occurredAt: m.occurredAt,
            movementType: m.quantity > 0 ? 'IN' : 'OUT',
            itemId: m.itemId,
            itemCode: m.itemCode,
            itemDescription: m.itemDescription,
            quantity: m.quantity,
            lot: m.lot,
            documentNumber: m.documentNumber,
            locationCode: m.locationCode
          })),
          pagination: {
            total: 0,
            page,
            pageSize: limit,
            totalPages: 0,
            hasMore: false
          }
        });
      } catch (altError) {
        console.error('❌ Nessuna tabella movimenti trovata:', altError.message);
      }
    }

    throw error;
  }
};

export const getStockMovementById = async (req, res) => {
  const pool = await getPool();
  const { id } = req.params;

  const result = await pool.request()
    .input('id', sql.Int, parseInt(id))
    .query(`
      SELECT
        M.id,
        M.dataMovimento AS occurredAt,
        M.idArticolo AS itemId,
        A.codice AS itemCode,
        A.descrizione AS itemDescription,
        M.quantita AS quantity,
        M.lotto AS lot,
        M.numeroDocumento AS documentNumber,
        M.idTipoMovimento AS movementTypeId,
        TM.descrizione AS movementTypeDescription,
        M.idLocazione AS locationId,
        L.barcode AS locationCode,
        M.idUtente AS userId,
        U.login AS operatorUserName,
        M.note AS notes
      FROM Movimenti M
      LEFT JOIN Articoli A ON M.idArticolo = A.id
      LEFT JOIN TipiMovimento TM ON M.idTipoMovimento = TM.id
      LEFT JOIN Locazioni L ON M.idLocazione = L.id
      LEFT JOIN Utenti U ON M.idUtente = U.id
      WHERE M.id = @id
    `);

  if (!result.recordset || result.recordset.length === 0) {
    throw new NotFoundError('Movement not found');
  }

  const m = result.recordset[0];
  res.json({
    success: true,
    data: {
      id: m.id,
      occurredAt: m.occurredAt,
      movementType: m.quantity > 0 ? 'IN' : 'OUT',
      itemId: m.itemId,
      itemCode: m.itemCode,
      itemDescription: m.itemDescription,
      quantity: m.quantity,
      lot: m.lot,
      documentNumber: m.documentNumber,
      locationId: m.locationId,
      locationCode: m.locationCode,
      userId: m.userId,
      operatorUserName: m.operatorUserName,
      notes: m.notes
    }
  });
};

export const getStockMovementsByItem = async (req, res) => {
  const pool = await getPool();
  const { itemId } = req.params;
  const { limit = 50, offset = 0 } = req.query;

  const result = await pool.request()
    .input('itemId', sql.Int, parseInt(itemId))
    .input('offset', sql.Int, parseInt(offset))
    .input('limit', sql.Int, parseInt(limit))
    .query(`
      SELECT TOP (@limit)
        M.id,
        M.dataMovimento AS occurredAt,
        M.quantita AS quantity,
        M.lotto AS lot,
        M.numeroDocumento AS documentNumber,
        L.barcode AS locationCode,
        U.login AS operatorUserName
      FROM Movimenti M
      LEFT JOIN Locazioni L ON M.idLocazione = L.id
      LEFT JOIN Utenti U ON M.idUtente = U.id
      WHERE M.idArticolo = @itemId
      ORDER BY M.dataMovimento DESC
      OFFSET @offset ROWS
    `);

  res.json({
    success: true,
    data: result.recordset.map(m => ({
      id: m.id,
      occurredAt: m.occurredAt,
      movementType: m.quantity > 0 ? 'IN' : 'OUT',
      quantity: m.quantity,
      lot: m.lot,
      documentNumber: m.documentNumber,
      locationCode: m.locationCode,
      operatorUserName: m.operatorUserName
    }))
  });
};
