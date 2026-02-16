/**
 * Locations Controller
 *
 * Business logic per gestione Ubicazioni magazzino (Tabella: Locazioni)
 * Schema reale database SQL Server - EjLog WMS
 */

import { getPool, sql } from '../db-config.js';
import { NotFoundError, ConflictError } from '../middleware/error-handler.js';

export const getLocations = async (req, res) => {
  const pool = await getPool();
  const { search, tipoLocazione, automatizzata, abilitata } = req.query;
  const { limit, offset } = req.pagination;

  const request = pool.request();
  let whereConditions = [];

  // Filtro ricerca per barcode o descrizione
  if (search) {
    whereConditions.push('(barcode LIKE @search OR descrizione LIKE @search)');
    request.input('search', sql.NVarChar, `%${search}%`);
  }

  // Filtro per tipo locazione
  if (tipoLocazione) {
    whereConditions.push('idTipoLocazione = @tipoLocazione');
    request.input('tipoLocazione', sql.Int, parseInt(tipoLocazione));
  }

  // Filtro per automatizzata
  if (automatizzata !== undefined) {
    whereConditions.push('automatizzata = @automatizzata');
    request.input('automatizzata', sql.Int, automatizzata === 'true' ? 1 : 0);
  }

  // Filtro per abilitata
  if (abilitata !== undefined) {
    whereConditions.push('abilitata = @abilitata');
    request.input('abilitata', sql.Bit, abilitata === 'true' ? 1 : 0);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
  request.input('offset', sql.Int, offset);
  request.input('limit', sql.Int, limit);

  const result = await request.query(`
    SELECT
      id,
      barcode,
      descrizione AS description,
      idTipoLocazione AS locationType,
      idMagazzino AS warehouseId,
      idCorridoio AS aisleId,
      idCampata AS bayId,
      numUdc AS currentUdcCount,
      maxUdc AS maxUdcCapacity,
      CAST(abilitata AS bit) AS enabled,
      CAST(abilitataIn AS bit) AS enabledIn,
      CAST(abilitataOut AS bit) AS enabledOut,
      CAST(abilitataPicking AS bit) AS enabledPicking,
      CAST(automatizzata AS bit) AS automated,
      altezzaFisicaMm AS heightMm,
      larghezzaMm AS widthMm,
      profonditaMm AS depthMm,
      stato AS status,
      dataUltimoIngresso AS lastEntryDate,
      dataUltimaUscita AS lastExitDate
    FROM Locazioni
    ${whereClause}
    ORDER BY barcode
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  `);

  const countRequest = pool.request();
  if (search) countRequest.input('search', sql.NVarChar, `%${search}%`);
  if (tipoLocazione) countRequest.input('tipoLocazione', sql.Int, parseInt(tipoLocazione));
  if (automatizzata !== undefined) countRequest.input('automatizzata', sql.Int, automatizzata === 'true' ? 1 : 0);
  if (abilitata !== undefined) countRequest.input('abilitata', sql.Bit, abilitata === 'true' ? 1 : 0);

  const countResult = await countRequest.query(`
    SELECT COUNT(*) as total FROM Locazioni ${whereClause}
  `);
  const total = countResult.recordset[0].total;

  res.json({
    success: true,
    data: result.recordset,
    pagination: { total, limit, offset, hasMore: (offset + limit) < total }
  });
};

export const getLocationById = async (req, res) => {
  const pool = await getPool();
  const { id } = req.params;

  const result = await pool.request().input('id', sql.Int, id).query(`
    SELECT
      id,
      barcode,
      descrizione AS description,
      idTipoLocazione AS locationType,
      idMagazzino AS warehouseId,
      idCorridoio AS aisleId,
      idCampata AS bayId,
      idCanale AS channelId,
      idArea AS areaId,
      numUdc AS currentUdcCount,
      maxUdc AS maxUdcCapacity,
      CAST(abilitata AS bit) AS enabled,
      CAST(abilitataIn AS bit) AS enabledIn,
      CAST(abilitataOut AS bit) AS enabledOut,
      CAST(abilitataPicking AS bit) AS enabledPicking,
      CAST(abilitataRefilling AS bit) AS enabledRefilling,
      CAST(automatizzata AS bit) AS automated,
      altezzaFisicaMm AS heightMm,
      larghezzaMm AS widthMm,
      profonditaMm AS depthMm,
      x, y, z,
      stato AS status,
      destinazionePlc AS plcDestination,
      dataUltimoIngresso AS lastEntryDate,
      dataUltimaUscita AS lastExitDate,
      pctRiempimento AS fillPercentage
    FROM Locazioni
    WHERE id = @id
  `);

  if (result.recordset.length === 0) throw new NotFoundError('Locazione');

  res.json({ success: true, data: result.recordset[0] });
};

/**
 * GET /api/locations/:id/udcs
 * Ottiene le UDC presenti in una locazione
 */
export const getLocationUdcs = async (req, res) => {
  const pool = await getPool();
  const { id } = req.params;

  const result = await pool.request()
    .input('locationId', sql.Int, id)
    .query(`
      SELECT
        u.id,
        u.barcode,
        u.dataIngresso AS entryDate,
        COUNT(up.id) AS productCount
      FROM Udc u
      LEFT JOIN UdcProdotti up ON u.id = up.idUdc
      WHERE u.idLocazione = @locationId
      GROUP BY u.id, u.barcode, u.dataIngresso
      ORDER BY u.dataIngresso DESC
    `);

  res.json({
    success: true,
    data: result.recordset
  });
};
