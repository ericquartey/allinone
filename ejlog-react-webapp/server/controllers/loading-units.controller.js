/**
 * Loading Units Controller
 *
 * Business logic per gestione UDC (Unità Di Carico / Cassetti)
 */

import { getPool, sql } from '../db-config.js';
import { NotFoundError, DatabaseError, ConflictError } from '../middleware/error-handler.js';

/**
 * GET /api/loading-units
 * Lista UDC con filtri e paginazione
 */
export const getLoadingUnits = async (req, res) => {
  const pool = await getPool();
  const { barcode, warehouseId, locationId, isBlocked } = req.query;
  const { limit, offset } = req.pagination;

  const request = pool.request();
  let whereConditions = ['recordCancellato = 0'];

  // Filtri opzionali
  if (barcode) {
    whereConditions.push('barcode LIKE @barcode');
    request.input('barcode', sql.NVarChar, `%${barcode}%`);
  }

  if (warehouseId) {
    whereConditions.push('idMagazzino = @warehouseId');
    request.input('warehouseId', sql.Int, parseInt(warehouseId));
  }

  if (locationId) {
    whereConditions.push('idLocazione = @locationId');
    request.input('locationId', sql.Int, parseInt(locationId));
  }

  if (isBlocked !== undefined) {
    whereConditions.push('bloccataManualmente = @isBlocked');
    request.input('isBlocked', sql.Bit, isBlocked === 'true' ? 1 : 0);
  }

  const whereClause = whereConditions.join(' AND ');

  // Query principale
  request.input('offset', sql.Int, offset);
  request.input('limit', sql.Int, limit);

  const result = await request.query(`
    SELECT
      id,
      barcode,
      descrizione AS description,
      numeroUdc AS code,
      larghezza AS width,
      profondita AS depth,
      altezza AS height,
      numSupporti AS compartmentCount,
      CASE WHEN bloccataManualmente = 1 THEN 1 ELSE 0 END AS isBlockedFromEjlog,
      idLocazione AS locationId,
      idMagazzino AS warehouseId,
      numProdotti AS productsCount,
      pctRiempimento AS fillPercentage
    FROM UDC
    WHERE ${whereClause}
    ORDER BY id DESC
    OFFSET @offset ROWS
    FETCH NEXT @limit ROWS ONLY
  `);

  // Count totale
  const countRequest = pool.request();
  if (barcode) countRequest.input('barcode', sql.NVarChar, `%${barcode}%`);
  if (warehouseId) countRequest.input('warehouseId', sql.Int, parseInt(warehouseId));
  if (locationId) countRequest.input('locationId', sql.Int, parseInt(locationId));
  if (isBlocked !== undefined) countRequest.input('isBlocked', sql.Bit, isBlocked === 'true' ? 1 : 0);

  const countResult = await countRequest.query(`
    SELECT COUNT(*) as total FROM UDC WHERE ${whereClause}
  `);

  const total = countResult.recordset[0].total;

  res.json({
    success: true,
    data: result.recordset,
    pagination: {
      total,
      limit,
      offset,
      hasMore: (offset + limit) < total
    }
  });
};

/**
 * GET /api/loading-units/:id
 * Dettaglio singolo UDC
 */
export const getLoadingUnitById = async (req, res) => {
  const pool = await getPool();
  const { id } = req.params;

  const result = await pool.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT
        id,
        barcode,
        descrizione AS description,
        numeroUdc AS code,
        larghezza AS width,
        profondita AS depth,
        altezza AS height,
        numSupporti AS compartmentCount,
        CASE WHEN bloccataManualmente = 1 THEN 1 ELSE 0 END AS isBlockedFromEjlog,
        idLocazione AS locationId,
        idMagazzino AS warehouseId,
        numProdotti AS productsCount,
        pctRiempimento AS fillPercentage
      FROM UDC
      WHERE id = @id AND recordCancellato = 0
    `);

  if (result.recordset.length === 0) {
    throw new NotFoundError('UDC');
  }

  res.json({
    success: true,
    data: result.recordset[0]
  });
};

/**
 * POST /api/loading-units
 * Crea nuovo UDC
 */
export const createLoadingUnit = async (req, res) => {
  const pool = await getPool();
  const {
    barcode,
    description,
    code,
    width,
    depth,
    height,
    compartmentCount = 0,
    locationId,
    warehouseId
  } = req.body;

  // Verifica barcode duplicato
  const checkResult = await pool.request()
    .input('barcode', sql.NVarChar, barcode)
    .query('SELECT id FROM UDC WHERE barcode = @barcode AND recordCancellato = 0');

  if (checkResult.recordset.length > 0) {
    throw new ConflictError('Barcode già esistente');
  }

  // Inserimento
  const insertRequest = pool.request()
    .input('barcode', sql.NVarChar, barcode)
    .input('descrizione', sql.NVarChar, description || null)
    .input('numeroUdc', sql.NVarChar, code || null)
    .input('larghezza', sql.Float, width)
    .input('profondita', sql.Float, depth)
    .input('altezza', sql.Float, height)
    .input('numSupporti', sql.Int, compartmentCount)
    .input('idLocazione', sql.Int, locationId || null)
    .input('idMagazzino', sql.Int, warehouseId || null);

  const insertResult = await insertRequest.query(`
    INSERT INTO UDC (
      barcode, descrizione, numeroUdc, larghezza, profondita, altezza,
      numSupporti, idLocazione, idMagazzino, recordCancellato, bloccataManualmente,
      numProdotti, pctRiempimento
    )
    OUTPUT INSERTED.id
    VALUES (
      @barcode, @descrizione, @numeroUdc, @larghezza, @profondita, @altezza,
      @numSupporti, @idLocazione, @idMagazzino, 0, 0, 0, 0
    )
  `);

  const newId = insertResult.recordset[0].id;

  // Recupera l'UDC appena creato
  const newUdc = await pool.request()
    .input('id', sql.Int, newId)
    .query(`
      SELECT
        id, barcode, descrizione AS description, numeroUdc AS code,
        larghezza AS width, profondita AS depth, altezza AS height,
        numSupporti AS compartmentCount,
        CASE WHEN bloccataManualmente = 1 THEN 1 ELSE 0 END AS isBlockedFromEjlog,
        idLocazione AS locationId, idMagazzino AS warehouseId,
        numProdotti AS productsCount, pctRiempimento AS fillPercentage
      FROM UDC
      WHERE id = @id
    `);

  res.status(201).json({
    success: true,
    data: newUdc.recordset[0]
  });
};

/**
 * PUT /api/loading-units/:id
 * Aggiorna UDC esistente
 */
export const updateLoadingUnit = async (req, res) => {
  const pool = await getPool();
  const { id } = req.params;
  const {
    barcode,
    description,
    code,
    width,
    depth,
    height,
    isBlockedFromEjlog,
    locationId,
    warehouseId
  } = req.body;

  // Verifica esistenza
  const checkResult = await pool.request()
    .input('id', sql.Int, id)
    .query('SELECT id FROM UDC WHERE id = @id AND recordCancellato = 0');

  if (checkResult.recordset.length === 0) {
    throw new NotFoundError('UDC');
  }

  // Verifica barcode duplicato (escluso UDC corrente)
  if (barcode) {
    const duplicateCheck = await pool.request()
      .input('barcode', sql.NVarChar, barcode)
      .input('id', sql.Int, id)
      .query('SELECT id FROM UDC WHERE barcode = @barcode AND id != @id AND recordCancellato = 0');

    if (duplicateCheck.recordset.length > 0) {
      throw new ConflictError('Barcode già esistente');
    }
  }

  // Costruisci UPDATE dinamico
  const request = pool.request().input('id', sql.Int, id);
  const updates = [];

  if (barcode !== undefined) {
    request.input('barcode', sql.NVarChar, barcode);
    updates.push('barcode = @barcode');
  }
  if (description !== undefined) {
    request.input('descrizione', sql.NVarChar, description);
    updates.push('descrizione = @descrizione');
  }
  if (code !== undefined) {
    request.input('numeroUdc', sql.NVarChar, code);
    updates.push('numeroUdc = @numeroUdc');
  }
  if (width !== undefined) {
    request.input('larghezza', sql.Float, width);
    updates.push('larghezza = @larghezza');
  }
  if (depth !== undefined) {
    request.input('profondita', sql.Float, depth);
    updates.push('profondita = @profondita');
  }
  if (height !== undefined) {
    request.input('altezza', sql.Float, height);
    updates.push('altezza = @altezza');
  }
  if (isBlockedFromEjlog !== undefined) {
    request.input('bloccataManualmente', sql.Bit, isBlockedFromEjlog ? 1 : 0);
    updates.push('bloccataManualmente = @bloccataManualmente');
  }
  if (locationId !== undefined) {
    request.input('idLocazione', sql.Int, locationId);
    updates.push('idLocazione = @idLocazione');
  }
  if (warehouseId !== undefined) {
    request.input('idMagazzino', sql.Int, warehouseId);
    updates.push('idMagazzino = @idMagazzino');
  }

  if (updates.length > 0) {
    await request.query(`
      UPDATE UDC
      SET ${updates.join(', ')}
      WHERE id = @id
    `);
  }

  // Recupera UDC aggiornato
  const updated = await pool.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT
        id, barcode, descrizione AS description, numeroUdc AS code,
        larghezza AS width, profondita AS depth, altezza AS height,
        numSupporti AS compartmentCount,
        CASE WHEN bloccataManualmente = 1 THEN 1 ELSE 0 END AS isBlockedFromEjlog,
        idLocazione AS locationId, idMagazzino AS warehouseId,
        numProdotti AS productsCount, pctRiempimento AS fillPercentage
      FROM UDC
      WHERE id = @id
    `);

  res.json({
    success: true,
    data: updated.recordset[0]
  });
};

/**
 * DELETE /api/loading-units/:id
 * Elimina UDC (soft delete)
 */
export const deleteLoadingUnit = async (req, res) => {
  const pool = await getPool();
  const { id } = req.params;

  // Verifica esistenza
  const checkResult = await pool.request()
    .input('id', sql.Int, id)
    .query('SELECT id FROM UDC WHERE id = @id AND recordCancellato = 0');

  if (checkResult.recordset.length === 0) {
    throw new NotFoundError('UDC');
  }

  // Soft delete
  await pool.request()
    .input('id', sql.Int, id)
    .query('UPDATE UDC SET recordCancellato = 1 WHERE id = @id');

  res.json({
    success: true,
    message: 'UDC eliminato con successo'
  });
};
