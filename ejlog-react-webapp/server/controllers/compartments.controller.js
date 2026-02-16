/**
 * Compartments Controller
 *
 * Business logic per gestione Scomparti UDC
 */

import { getPool, sql } from '../db-config.js';
import { NotFoundError, ConflictError } from '../middleware/error-handler.js';

/**
 * GET /api/loading-units/:id/compartments
 * Lista scomparti per un UDC specifico
 */
export const getCompartmentsByLoadingUnit = async (req, res) => {
  const pool = await getPool();
  const { id } = req.params;

  // Verifica esistenza UDC
  const udcCheck = await pool.request()
    .input('id', sql.Int, id)
    .query('SELECT id FROM UDC WHERE id = @id AND recordCancellato = 0');

  if (udcCheck.recordset.length === 0) {
    throw new NotFoundError('UDC');
  }

  // Recupera scomparti (adatta query alla struttura reale del DB)
  const result = await pool.request()
    .input('loadingUnitId', sql.Int, id)
    .query(`
      SELECT
        id,
        id_supporto AS loadingUnitId,
        numero_scomparto AS compartmentNumber,
        posizione AS position,
        larghezza AS width,
        profondita AS depth,
        altezza AS height,
        percentuale_riempimento AS fillPercentage,
        CASE WHEN bloccato = 1 THEN 1 ELSE 0 END AS isBlocked
      FROM Scomparti
      WHERE id_supporto = @loadingUnitId
      ORDER BY numero_scomparto
    `);

  res.json({
    success: true,
    data: result.recordset
  });
};

/**
 * GET /api/compartments/:id
 * Dettaglio singolo scomparto
 */
export const getCompartmentById = async (req, res) => {
  const pool = await getPool();
  const { id } = req.params;

  const result = await pool.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT
        id,
        id_supporto AS loadingUnitId,
        numero_scomparto AS compartmentNumber,
        posizione AS position,
        larghezza AS width,
        profondita AS depth,
        altezza AS height,
        percentuale_riempimento AS fillPercentage,
        CASE WHEN bloccato = 1 THEN 1 ELSE 0 END AS isBlocked
      FROM Scomparti
      WHERE id = @id
    `);

  if (result.recordset.length === 0) {
    throw new NotFoundError('Scomparto');
  }

  res.json({
    success: true,
    data: result.recordset[0]
  });
};

/**
 * POST /api/loading-units/:id/compartments
 * Crea nuovo scomparto per un UDC
 */
export const createCompartment = async (req, res) => {
  const pool = await getPool();
  const { id: loadingUnitId } = req.params;
  const {
    compartmentNumber,
    position,
    width,
    depth,
    height,
    fillPercentage = 0,
    isBlocked = false
  } = req.body;

  // Verifica esistenza UDC
  const udcCheck = await pool.request()
    .input('id', sql.Int, loadingUnitId)
    .query('SELECT id FROM UDC WHERE id = @id AND recordCancellato = 0');

  if (udcCheck.recordset.length === 0) {
    throw new NotFoundError('UDC');
  }

  // Verifica numero scomparto duplicato per questo UDC
  const duplicateCheck = await pool.request()
    .input('loadingUnitId', sql.Int, loadingUnitId)
    .input('compartmentNumber', sql.Int, compartmentNumber)
    .query(`
      SELECT id FROM Scomparti
      WHERE id_supporto = @loadingUnitId AND numero_scomparto = @compartmentNumber
    `);

  if (duplicateCheck.recordset.length > 0) {
    throw new ConflictError('Numero scomparto già esistente per questo UDC');
  }

  // Inserimento
  const insertRequest = pool.request()
    .input('id_supporto', sql.Int, loadingUnitId)
    .input('numero_scomparto', sql.Int, compartmentNumber)
    .input('posizione', sql.Int, position)
    .input('larghezza', sql.Float, width || null)
    .input('profondita', sql.Float, depth || null)
    .input('altezza', sql.Float, height || null)
    .input('percentuale_riempimento', sql.Float, fillPercentage)
    .input('bloccato', sql.Bit, isBlocked ? 1 : 0);

  const insertResult = await insertRequest.query(`
    INSERT INTO Scomparti (
      id_supporto, numero_scomparto, posizione, larghezza, profondita,
      altezza, percentuale_riempimento, bloccato
    )
    OUTPUT INSERTED.id
    VALUES (
      @id_supporto, @numero_scomparto, @posizione, @larghezza, @profondita,
      @altezza, @percentuale_riempimento, @bloccato
    )
  `);

  const newId = insertResult.recordset[0].id;

  // Recupera scomparto appena creato
  const newCompartment = await pool.request()
    .input('id', sql.Int, newId)
    .query(`
      SELECT
        id, id_supporto AS loadingUnitId, numero_scomparto AS compartmentNumber,
        posizione AS position, larghezza AS width, profondita AS depth,
        altezza AS height, percentuale_riempimento AS fillPercentage,
        CASE WHEN bloccato = 1 THEN 1 ELSE 0 END AS isBlocked
      FROM Scomparti
      WHERE id = @id
    `);

  res.status(201).json({
    success: true,
    data: newCompartment.recordset[0]
  });
};

/**
 * PUT /api/compartments/:id
 * Aggiorna scomparto esistente
 */
export const updateCompartment = async (req, res) => {
  const pool = await getPool();
  const { id } = req.params;
  const {
    compartmentNumber,
    position,
    width,
    depth,
    height,
    fillPercentage,
    isBlocked
  } = req.body;

  // Verifica esistenza
  const checkResult = await pool.request()
    .input('id', sql.Int, id)
    .query('SELECT id_supporto FROM Scomparti WHERE id = @id');

  if (checkResult.recordset.length === 0) {
    throw new NotFoundError('Scomparto');
  }

  const loadingUnitId = checkResult.recordset[0].id_supporto;

  // Se cambia numero scomparto, verifica duplicati
  if (compartmentNumber !== undefined) {
    const duplicateCheck = await pool.request()
      .input('loadingUnitId', sql.Int, loadingUnitId)
      .input('compartmentNumber', sql.Int, compartmentNumber)
      .input('id', sql.Int, id)
      .query(`
        SELECT id FROM Scomparti
        WHERE id_supporto = @loadingUnitId
          AND numero_scomparto = @compartmentNumber
          AND id != @id
      `);

    if (duplicateCheck.recordset.length > 0) {
      throw new ConflictError('Numero scomparto già esistente per questo UDC');
    }
  }

  // Costruisci UPDATE dinamico
  const request = pool.request().input('id', sql.Int, id);
  const updates = [];

  if (compartmentNumber !== undefined) {
    request.input('numero_scomparto', sql.Int, compartmentNumber);
    updates.push('numero_scomparto = @numero_scomparto');
  }
  if (position !== undefined) {
    request.input('posizione', sql.Int, position);
    updates.push('posizione = @posizione');
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
  if (fillPercentage !== undefined) {
    request.input('percentuale_riempimento', sql.Float, fillPercentage);
    updates.push('percentuale_riempimento = @percentuale_riempimento');
  }
  if (isBlocked !== undefined) {
    request.input('bloccato', sql.Bit, isBlocked ? 1 : 0);
    updates.push('bloccato = @bloccato');
  }

  if (updates.length > 0) {
    await request.query(`
      UPDATE Scomparti
      SET ${updates.join(', ')}
      WHERE id = @id
    `);
  }

  // Recupera scomparto aggiornato
  const updated = await pool.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT
        id, id_supporto AS loadingUnitId, numero_scomparto AS compartmentNumber,
        posizione AS position, larghezza AS width, profondita AS depth,
        altezza AS height, percentuale_riempimento AS fillPercentage,
        CASE WHEN bloccato = 1 THEN 1 ELSE 0 END AS isBlocked
      FROM Scomparti
      WHERE id = @id
    `);

  res.json({
    success: true,
    data: updated.recordset[0]
  });
};

/**
 * DELETE /api/compartments/:id
 * Elimina scomparto
 */
export const deleteCompartment = async (req, res) => {
  const pool = await getPool();
  const { id } = req.params;

  // Verifica esistenza
  const checkResult = await pool.request()
    .input('id', sql.Int, id)
    .query('SELECT id FROM Scomparti WHERE id = @id');

  if (checkResult.recordset.length === 0) {
    throw new NotFoundError('Scomparto');
  }

  // Elimina
  await pool.request()
    .input('id', sql.Int, id)
    .query('DELETE FROM Scomparti WHERE id = @id');

  res.json({
    success: true,
    message: 'Scomparto eliminato con successo'
  });
};
