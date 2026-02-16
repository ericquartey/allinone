/**
 * Items Controller
 *
 * Business logic per gestione Articoli/Prodotti
 * NOTA: Questo è un template basato sulle tabelle comuni WMS.
 * Potrebbe richiedere adattamento allo schema reale del database.
 */

import { getPool, sql } from '../db-config.js';
import { getImageFileNameForItem, getImageListForItem, getImageUrlForItem } from '../utils/item-images.js';
import { NotFoundError, ConflictError } from '../middleware/error-handler.js';

// NOTA: Adattare i nomi delle tabelle e colonne allo schema reale
// Possibili nomi: Articoli, Prodotti, Items, Articles

export const getItems = async (req, res) => {
  const pool = await getPool();
  const { search, activeOnly } = req.query;
  const { limit, offset } = req.pagination;

  const request = pool.request();
  let whereConditions = [];

  // Solo se esplicitamente richiesto, filtra per attivi
  if (activeOnly === 'true') {
    whereConditions.push('recordCancellato = 0');
  }

  if (search) {
    whereConditions.push('(codice LIKE @search OR descrizione LIKE @search OR barcode LIKE @search)');
    request.input('search', sql.NVarChar, `%${search}%`);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
  request.input('offset', sql.Int, offset);
  request.input('limit', sql.Int, limit);

  const result = await request.query(`
    SELECT
      A.id,
      A.codice AS code,
      A.descrizione AS description,
      A.barcode,
      A.idCategoriaArticoloGestione AS categoryId,
      A.um AS unitOfMeasure,
      A.peso AS weight,
      A.prezzoUnitario AS price,
      CASE WHEN A.recordCancellato = 0 THEN 1 ELSE 0 END AS isActive,
      ISNULL((
        SELECT SUM(UP.qta)
        FROM UdcProdotti UP
        WHERE UP.idArticolo = A.id AND UP.recordCancellato = 0
      ), 0) AS stock,
      CASE WHEN ISNULL((
        SELECT SUM(UP.qta)
        FROM UdcProdotti UP
        WHERE UP.idArticolo = A.id AND UP.recordCancellato = 0
      ), 0) > 0 THEN 1 ELSE 0 END AS inStock
    FROM Articoli A
    ${whereClause}
    ORDER BY A.codice
    OFFSET @offset ROWS
    FETCH NEXT @limit ROWS ONLY
  `);

  const countRequest = pool.request();
  if (search) countRequest.input('search', sql.NVarChar, `%${search}%`);

  const countResult = await countRequest.query(`
    SELECT COUNT(*) as total
    FROM Articoli
    ${whereClause}
  `);
  const total = countResult.recordset[0].total;

  const itemsWithImages = result.recordset.map((item) => ({
    ...item,
    imageUrl: getImageUrlForItem(item.code),
    imageFileName: getImageFileNameForItem(item.code),
  }));

  res.json({
    success: true,
    data: itemsWithImages,
    pagination: { total, limit, offset, hasMore: (offset + limit) < total }
  });
};

export const getItemById = async (req, res) => {
  const pool = await getPool();
  const { id } = req.params;

  // Get item basic info with total stock
  const result = await pool.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT
        A.id,
        A.codice AS code,
        A.descrizione AS description,
        A.barcode,
        A.idCategoriaArticoloGestione AS categoryId,
        A.um AS unitOfMeasure,
        A.peso AS weight,
        A.prezzoUnitario AS price,
        CASE WHEN A.recordCancellato = 0 THEN 1 ELSE 0 END AS isActive,
        ISNULL((
          SELECT SUM(UP.qta)
          FROM UdcProdotti UP
          WHERE UP.idArticolo = A.id AND UP.recordCancellato = 0
        ), 0) AS stock
      FROM Articoli A
      WHERE A.id = @id
    `);

  if (result.recordset.length === 0) {
    throw new NotFoundError('Articolo');
  }

  const item = result.recordset[0];

  // Get images
  // NOTA: Tabella ImmagineArticolo non esiste nel database - commentata temporaneamente
  // const imagesResult = await pool.request()
  //   .input('itemId', sql.Int, id)
  //   .query(`
  //     SELECT
  //       id,
  //       filename,
  //       url,
  //       isPrimary,
  //       dataUpload AS uploadedAt
  //     FROM ImmagineArticolo
  //     WHERE idArticolo = @itemId
  //     ORDER BY isPrimary DESC, dataUpload DESC
  //   `);

  item.images = getImageListForItem(item.code);
  item.imageUrl = getImageUrlForItem(item.code);

  // Get stock by location with UDC count (using correct schema)
  const stockResult = await pool.request()
    .input('itemId', sql.Int, id)
    .query(`
      SELECT
        L.id AS locationId,
        L.barcode AS locationCode,
        L.descrizione AS locationDescription,
        SUM(UP.qta) AS quantity,
        COUNT(DISTINCT UP.idUdc) AS udcCount,
        COUNT(DISTINCT UP.idSupporto) AS compartmentCount
      FROM UdcProdotti UP
      INNER JOIN Udc U ON UP.idUdc = U.id
      LEFT JOIN Locazioni L ON U.idLocazione = L.id
      WHERE UP.idArticolo = @itemId AND UP.recordCancellato = 0
      GROUP BY L.id, L.barcode, L.descrizione
      HAVING SUM(UP.qta) > 0
      ORDER BY L.barcode
    `);

  item.stockByLocation = stockResult.recordset || [];

  res.json({ success: true, data: item });
};

export const createItem = async (req, res) => {
  const pool = await getPool();
  const { code, description, barcode, categoryId, unitOfMeasure, weight, volume, price } = req.body;

  const checkResult = await pool.request()
    .input('code', sql.NVarChar, code)
    .query('SELECT id FROM Articoli WHERE codice = @code');

  if (checkResult.recordset.length > 0) {
    throw new ConflictError('Codice articolo già esistente');
  }

  const insertResult = await pool.request()
    .input('codice', sql.NVarChar, code)
    .input('descrizione', sql.NVarChar, description)
    .input('barcode', sql.NVarChar, barcode || null)
    .input('idCategoriaArticoloGestione', sql.Int, categoryId || null)
    .input('um', sql.NVarChar, unitOfMeasure || null)
    .input('peso', sql.Float, weight || null)
    .input('prezzoUnitario', sql.Float, price || null)
    .query(`
      INSERT INTO Articoli (codice, descrizione, barcode, idCategoriaArticoloGestione, um, peso, prezzoUnitario, recordCancellato)
      OUTPUT INSERTED.id
      VALUES (@codice, @descrizione, @barcode, @idCategoriaArticoloGestione, @um, @peso, @prezzoUnitario, 0)
    `);

  const newId = insertResult.recordset[0].id;
  const newItem = await pool.request().input('id', sql.Int, newId)
    .query('SELECT id, codice AS code, descrizione AS description, barcode FROM Articoli WHERE id = @id');

  res.status(201).json({ success: true, data: newItem.recordset[0] });
};

export const updateItem = async (req, res) => {
  const pool = await getPool();
  const { id } = req.params;
  const updates = [];
  const request = pool.request().input('id', sql.Int, id);

  Object.entries(req.body).forEach(([key, value]) => {
    const mapping = {
      code: 'codice', description: 'descrizione', barcode: 'barcode',
      categoryId: 'idCategoriaArticoloGestione', unitOfMeasure: 'um',
      weight: 'peso', price: 'prezzoUnitario', isActive: 'recordCancellato'
    };
    if (mapping[key]) {
      // For recordCancellato, invert the isActive value (isActive=1 means recordCancellato=0)
      const mappedValue = key === 'isActive' ? (value ? 0 : 1) : value;
      request.input(mapping[key], mappedValue);
      updates.push(`${mapping[key]} = @${mapping[key]}`);
    }
  });

  if (updates.length > 0) {
    await request.query(`UPDATE Articoli SET ${updates.join(', ')} WHERE id = @id`);
  }

  const updated = await pool.request().input('id', sql.Int, id)
    .query('SELECT id, codice AS code, descrizione AS description FROM Articoli WHERE id = @id');

  res.json({ success: true, data: updated.recordset[0] });
};

export const deleteItem = async (req, res) => {
  const pool = await getPool();
  const { id } = req.params;

  await pool.request().input('id', sql.Int, id).query('UPDATE Articoli SET recordCancellato = 1 WHERE id = @id');

  res.json({ success: true, message: 'Articolo disattivato' });
};

export const getItemStock = async (req, res) => {
  const pool = await getPool();
  const { id } = req.params;

  // Get real stock data from UdcProdotti (same as stockByLocation)
  const result = await pool.request()
    .input('itemId', sql.Int, id)
    .query(`
      SELECT
        UP.idArticolo AS itemId,
        L.id AS locationId,
        L.barcode AS locationCode,
        L.descrizione AS locationDescription,
        SUM(UP.qta) AS quantity,
        SUM(UP.qtaPrenotataOut) AS reservedQuantity,
        SUM(UP.qta - UP.qtaPrenotataOut) AS availableQuantity,
        COUNT(DISTINCT UP.idUdc) AS udcCount,
        COUNT(DISTINCT UP.idSupporto) AS compartmentCount
      FROM UdcProdotti UP
      INNER JOIN Udc U ON UP.idUdc = U.id
      LEFT JOIN Locazioni L ON U.idLocazione = L.id
      WHERE UP.idArticolo = @itemId AND UP.recordCancellato = 0
      GROUP BY UP.idArticolo, L.id, L.barcode, L.descrizione
      HAVING SUM(UP.qta) > 0
      ORDER BY L.barcode
    `);

  res.json({ success: true, data: result.recordset });
};

/**
 * GET /api/items/:id/images
 * Get all images for an item
 */
export const getItemImages = async (req, res) => {
  const pool = await getPool();
  const { id } = req.params;

  const result = await pool.request()
    .input('articoloId', sql.Int, id)
    .query(`
      SELECT
        id,
        filename,
        url,
        isPrimary,
        dataUpload AS uploadedAt
      FROM ImmagineArticolo
      WHERE idArticolo = @articoloId
      ORDER BY isPrimary DESC, dataUpload DESC
    `);

  res.json({
    success: true,
    data: result.recordset
  });
};

/**
 * DEBUG: Get items count
 */
export const getItemsDebug = async (req, res) => {
  const pool = await getPool();

  const totalResult = await pool.request().query('SELECT COUNT(*) as total FROM Articoli');
  const activeResult = await pool.request().query('SELECT COUNT(*) as total FROM Articoli WHERE recordCancellato = 0');
  const deletedResult = await pool.request().query('SELECT COUNT(*) as total FROM Articoli WHERE recordCancellato = 1');

  res.json({
    success: true,
    data: {
      total: totalResult.recordset[0].total,
      active: activeResult.recordset[0].total,
      deleted: deletedResult.recordset[0].total
    }
  });
};
