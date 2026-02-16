
/**
 * Warehouses routes (Magazzini)
 */

import express from 'express';
import { getPool, sql } from '../db-config.js';

const router = express.Router();

const PARAM_SEPARATOR = '\u015b';
const MANUAL_WAREHOUSE_TYPE_ID = 2;
const STATUS_ENABLED_ID = 1;
const STATUS_DISABLED_ID = 2;
const LOCATION_VANO_ID = 1;
const LOCATION_MANUAL_ID = 4;
const CAMPATA_STOCCAGGIO_ID = 1;
const UDC_BARCODE_PREFIX = '#';
const LOCATION_BARCODE_PREFIX = '@';

const tableExists = async (pool, tableName) => {
  const result = await pool.request().query(`
    SELECT OBJECT_ID('${tableName}', 'U') AS TableExists
  `);
  return Boolean(result.recordset[0]?.TableExists);
};

const getColumns = async (pool, tableName) => {
  const result = await pool.request().query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = '${tableName}'
  `);
  return new Set(result.recordset.map((row) => row.COLUMN_NAME));
};

const resolveAreaTable = async (pool) => {
  const result = await pool.request().query(`
    SELECT TABLE_NAME
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_TYPE = 'BASE TABLE'
      AND TABLE_NAME IN ('Aree', 'Area')
    ORDER BY CASE WHEN TABLE_NAME = 'Aree' THEN 0 ELSE 1 END
  `);
  return result.recordset[0]?.TABLE_NAME || null;
};

const buildParamsString = (pairs) =>
  pairs.map(([key, value]) => `${key}=${value ?? ''}`).join(PARAM_SEPARATOR);

const createCampataParams = (row, magazzinoDescrizione) => {
  const zExt = Number(row.z) === 0 ? 'DX' : 'SX';
  return buildParamsString([
    ['${mag}', magazzinoDescrizione],
    ['${c}', row.idCorridoio],
    ['${x}', row.x],
    ['${y}', row.y],
    ['${zExt}', zExt],
    ['${z}', Number(row.z ?? 0) + 1],
  ]);
};

const createCanaleParams = (row, magazzinoDescrizione) => {
  const zExt = Number(row.z) === 0 ? 'DX' : 'SX';
  return buildParamsString([
    ['${mag}', magazzinoDescrizione],
    ['${c}', row.idCorridoio],
    ['${x}', row.x],
    ['${y}', row.y],
    ['${zExt}', zExt],
    ['${z}', Number(row.z ?? 0) + 1],
  ]);
};

const createLocazioneParams = (row, magazzinoDescrizione) => {
  const zExt = Number(row.z) === 0 ? 'DX' : 'SX';
  const wValue = Number(row.w ?? 0);
  const offsetProfonditaMm = Number(row.offsetProfonditaMm ?? 0);
  const profonditaCanaleMm = row.profonditaCanaleMm !== null && row.profonditaCanaleMm !== undefined
    ? Number(row.profonditaCanaleMm)
    : null;
  const offsetProfonditaPlc = profonditaCanaleMm !== null
    ? profonditaCanaleMm - offsetProfonditaMm
    : 0;

  return buildParamsString([
    ['${mag}', magazzinoDescrizione],
    ['${c}', row.idCorridoio],
    ['${x}', row.x],
    ['${y}', row.y],
    ['${zExt}', zExt],
    ['${z}', Number(row.z ?? 0) + 1],
    ['${w}', wValue],
    ['${offset}', offsetProfonditaPlc],
    ['${wExt}', wValue === 1 ? 'Dietro' : 'Davanti'],
    ['${offsetLargPlc}', '$getOffsetLarghezzaPlc'],
  ]);
};

const getNextId = async (request, tableName) => {
  const result = await request.query(`SELECT ISNULL(MAX(id), 0) + 1 AS nextId FROM ${tableName}`);
  return result.recordset[0]?.nextId ?? 1;
};

const getNextCounterValue = async (transaction, counterId, fallbackTable) => {
  const counterResult = await transaction.request()
    .input('counterId', sql.NVarChar(50), counterId)
    .query(`
      SELECT valoreCorrente, step
      FROM Contatori
      WHERE id = @counterId
    `);

  if (counterResult.recordset.length > 0) {
    const current = Number(counterResult.recordset[0]?.valoreCorrente ?? 0);
    const step = Number(counterResult.recordset[0]?.step ?? 1) || 1;
    const nextValue = current + step;

    await transaction.request()
      .input('counterId', sql.NVarChar(50), counterId)
      .input('nextValue', sql.Int, nextValue)
      .query('UPDATE Contatori SET valoreCorrente = @nextValue WHERE id = @counterId');

    return nextValue;
  }

  return getNextId(transaction.request(), fallbackTable);
};

const getMaxId = async (request, tableName) => {
  const result = await request.query(`SELECT TOP 1 id FROM ${tableName} ORDER BY id DESC`);
  return result.recordset[0]?.id ?? null;
};

const loadWarehouseTypes = async (pool) => {
  if (await tableExists(pool, 'TipoMagazzino')) {
    const result = await pool.request().query(`
      SELECT id, descrizione
      FROM TipoMagazzino
      ORDER BY id
    `);
    return result.recordset.map((row) => ({
      id: row.id,
      description: row.descrizione ?? `Tipo ${row.id}`,
    }));
  }

  return [
    { id: 1, description: 'Magazzino Automatico' },
    { id: 2, description: 'Magazzino Manuale' },
    { id: 3, description: 'Magazzino Vertimag' },
    { id: 4, description: 'Magazzino Eurot' },
    { id: 5, description: 'Magazzino Steeltower' },
    { id: 10, description: 'Magazzino PTL' },
  ];
};

const loadWarehouseStatuses = async (pool) => {
  if (await tableExists(pool, 'StatoMagazzino')) {
    const result = await pool.request().query(`
      SELECT id, descrizione
      FROM StatoMagazzino
      ORDER BY id
    `);
    return result.recordset.map((row) => ({
      id: row.id,
      description: row.descrizione ?? `Stato ${row.id}`,
    }));
  }

  return [
    { id: STATUS_ENABLED_ID, description: 'Abilitato' },
    { id: STATUS_DISABLED_ID, description: 'Disabilitato' },
  ];
};
router.get('/', async (req, res) => {
  try {
    const pool = await getPool();

    if (!await tableExists(pool, 'Magazzini')) {
      return res.json({ success: true, data: [] });
    }

    const areaTable = await resolveAreaTable(pool);
    const columns = await getColumns(pool, 'Magazzini');
    const hasRecordDeleted = columns.has('recordCancellato');

    const whereConditions = [];
    const request = pool.request();

    if (hasRecordDeleted) {
      whereConditions.push('M.recordCancellato = 0');
    }

    if (req.query.search) {
      whereConditions.push('(M.descrizione LIKE @search OR CAST(M.id AS VARCHAR(20)) LIKE @search OR M.barcode LIKE @search)');
      request.input('search', sql.NVarChar(100), `%${req.query.search}%`);
    }

    if (req.query.typeId) {
      whereConditions.push('M.idTipoMagazzino = @typeId');
      request.input('typeId', sql.Int, parseInt(req.query.typeId, 10));
    }

    if (req.query.areaId) {
      whereConditions.push('M.idArea = @areaId');
      request.input('areaId', sql.Int, parseInt(req.query.areaId, 10));
    }

    if (req.query.statusId) {
      whereConditions.push('M.idStatoMagazzino = @statusId');
      request.input('statusId', sql.Int, parseInt(req.query.statusId, 10));
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    const areaJoin = areaTable ? `LEFT JOIN ${areaTable} A ON M.idArea = A.id` : '';

    const query = `
      SELECT
        M.id,
        M.descrizione,
        M.idTipoMagazzino,
        TM.descrizione AS tipoDescrizione,
        M.idStatoMagazzino,
        SM.descrizione AS statoDescrizione,
        M.idArea,
        ${areaTable ? 'A.descrizione AS areaDescrizione,' : 'NULL AS areaDescrizione,'}
        M.barcode,
        M.formatoDescrizioneCampate,
        M.formatoDescrizioneCanali,
        M.formatoDescrizioneLocazioni
      FROM Magazzini M
      LEFT JOIN TipoMagazzino TM ON M.idTipoMagazzino = TM.id
      LEFT JOIN StatoMagazzino SM ON M.idStatoMagazzino = SM.id
      ${areaJoin}
      ${whereClause}
      ORDER BY M.id
    `;

    const result = await request.query(query);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error('[Warehouses] Error fetching warehouses:', error.message);
    res.json({ success: true, data: [] });
  }
});

router.get('/types', async (_req, res) => {
  try {
    const pool = await getPool();
    const data = await loadWarehouseTypes(pool);
    res.json({ success: true, data });
  } catch (error) {
    console.error('[Warehouses] Error fetching types:', error.message);
    res.status(500).json({ success: false, error: 'Error fetching types', details: error.message });
  }
});

router.get('/statuses', async (_req, res) => {
  try {
    const pool = await getPool();
    const data = await loadWarehouseStatuses(pool);
    res.json({ success: true, data });
  } catch (error) {
    console.error('[Warehouses] Error fetching statuses:', error.message);
    res.status(500).json({ success: false, error: 'Error fetching statuses', details: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const pool = await getPool();

    if (!await tableExists(pool, 'Magazzini')) {
      return res.status(404).json({ success: false, error: 'Warehouses table not found' });
    }

    const areaTable = await resolveAreaTable(pool);
    const areaJoin = areaTable ? `LEFT JOIN ${areaTable} A ON M.idArea = A.id` : '';

    const result = await pool.request()
      .input('id', sql.Int, parseInt(req.params.id, 10))
      .query(`
        SELECT
          M.id,
          M.descrizione,
          M.idTipoMagazzino,
          TM.descrizione AS tipoDescrizione,
          M.idStatoMagazzino,
          SM.descrizione AS statoDescrizione,
          M.idArea,
          ${areaTable ? 'A.descrizione AS areaDescrizione,' : 'NULL AS areaDescrizione,'}
          M.barcode,
          M.formatoDescrizioneCampate,
          M.formatoDescrizioneCanali,
          M.formatoDescrizioneLocazioni
        FROM Magazzini M
        LEFT JOIN TipoMagazzino TM ON M.idTipoMagazzino = TM.id
        LEFT JOIN StatoMagazzino SM ON M.idStatoMagazzino = SM.id
        ${areaJoin}
        WHERE M.id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, error: 'Warehouse not found' });
    }

    res.json({ success: true, data: result.recordset[0] });
  } catch (error) {
    console.error('[Warehouses] Error fetching warehouse:', error.message);
    res.status(500).json({ success: false, error: 'Error fetching warehouse', details: error.message });
  }
});
router.post('/', async (req, res) => {
  try {
    const pool = await getPool();

    if (!await tableExists(pool, 'Magazzini')) {
      return res.status(404).json({ success: false, error: 'Warehouses table not found' });
    }

    const description = req.body?.description ?? req.body?.descrizione;
    if (!description) {
      return res.status(400).json({ success: false, error: 'Description is required' });
    }

    const typeId = parseInt(req.body?.typeId ?? req.body?.idTipoMagazzino ?? MANUAL_WAREHOUSE_TYPE_ID, 10);
    const statusId = parseInt(req.body?.statusId ?? req.body?.idStatoMagazzino ?? STATUS_ENABLED_ID, 10);

    let areaId = req.body?.areaId ?? req.body?.idArea ?? null;
    if (!areaId) {
      const areaTable = await resolveAreaTable(pool);
      if (areaTable) {
        const areaResult = await pool.request().query(`SELECT TOP 1 id FROM ${areaTable} ORDER BY id`);
        areaId = areaResult.recordset[0]?.id ?? null;
      }
    }

    if (!areaId) {
      return res.status(400).json({ success: false, error: 'Area is required' });
    }

    const identityResult = await pool.request().query(`
      SELECT COLUMNPROPERTY(OBJECT_ID('Magazzini'), 'id', 'IsIdentity') AS IsIdentity
    `);
    const isIdentity = identityResult.recordset[0]?.IsIdentity === 1;

    let newId = req.body?.id ? parseInt(req.body.id, 10) : null;
    if (!isIdentity && !newId) {
      newId = await getNextId(pool.request(), 'Magazzini');
    }

    const insertFields = [];
    const insertValues = [];
    const insertRequest = pool.request();

    if (!isIdentity) {
      insertFields.push('id');
      insertValues.push('@id');
      insertRequest.input('id', sql.Int, newId);
    }

    insertFields.push('descrizione', 'idTipoMagazzino', 'idStatoMagazzino', 'idArea');
    insertValues.push('@descrizione', '@idTipoMagazzino', '@idStatoMagazzino', '@idArea');

    insertRequest
      .input('descrizione', sql.NVarChar(250), description)
      .input('idTipoMagazzino', sql.Int, typeId)
      .input('idStatoMagazzino', sql.Int, statusId)
      .input('idArea', sql.Int, parseInt(areaId, 10));

    if (req.body?.barcode) {
      insertFields.push('barcode');
      insertValues.push('@barcode');
      insertRequest.input('barcode', sql.NVarChar(100), req.body.barcode);
    }

    if (req.body?.formatoDescrizioneCampate) {
      insertFields.push('formatoDescrizioneCampate');
      insertValues.push('@formatoCampate');
      insertRequest.input('formatoCampate', sql.NVarChar(250), req.body.formatoDescrizioneCampate);
    }

    if (req.body?.formatoDescrizioneCanali) {
      insertFields.push('formatoDescrizioneCanali');
      insertValues.push('@formatoCanali');
      insertRequest.input('formatoCanali', sql.NVarChar(250), req.body.formatoDescrizioneCanali);
    }

    if (req.body?.formatoDescrizioneLocazioni) {
      insertFields.push('formatoDescrizioneLocazioni');
      insertValues.push('@formatoLocazioni');
      insertRequest.input('formatoLocazioni', sql.NVarChar(250), req.body.formatoDescrizioneLocazioni);
    }

    const result = await insertRequest.query(`
      INSERT INTO Magazzini (${insertFields.join(', ')})
      OUTPUT INSERTED.id
      VALUES (${insertValues.join(', ')})
    `);

    const insertedId = result.recordset[0]?.id ?? newId;
    res.status(201).json({ success: true, data: { id: insertedId } });
  } catch (error) {
    console.error('[Warehouses] Error creating warehouse:', error.message);
    res.status(500).json({ success: false, error: 'Error creating warehouse', details: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;

    const existing = await pool.request()
      .input('id', sql.Int, parseInt(id, 10))
      .query('SELECT id, idTipoMagazzino FROM Magazzini WHERE id = @id');

    if (existing.recordset.length === 0) {
      return res.status(404).json({ success: false, error: 'Warehouse not found' });
    }

    if (existing.recordset[0].idTipoMagazzino !== MANUAL_WAREHOUSE_TYPE_ID) {
      return res.status(400).json({ success: false, error: 'Only manual warehouses can be edited' });
    }

    const updates = [];
    const updateRequest = pool.request().input('id', sql.Int, parseInt(id, 10));

    if (req.body?.description ?? req.body?.descrizione) {
      updates.push('descrizione = @descrizione');
      updateRequest.input('descrizione', sql.NVarChar(250), req.body?.description ?? req.body?.descrizione);
    }

    if (req.body?.statusId ?? req.body?.idStatoMagazzino) {
      updates.push('idStatoMagazzino = @idStatoMagazzino');
      updateRequest.input('idStatoMagazzino', sql.Int, parseInt(req.body?.statusId ?? req.body?.idStatoMagazzino, 10));
    }

    if (req.body?.areaId ?? req.body?.idArea) {
      updates.push('idArea = @idArea');
      updateRequest.input('idArea', sql.Int, parseInt(req.body?.areaId ?? req.body?.idArea, 10));
    }

    if (req.body?.barcode !== undefined) {
      updates.push('barcode = @barcode');
      updateRequest.input('barcode', sql.NVarChar(100), req.body.barcode);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    await updateRequest.query(`
      UPDATE Magazzini
      SET ${updates.join(', ')}
      WHERE id = @id
    `);

    res.json({ success: true, data: { id: parseInt(id, 10) } });
  } catch (error) {
    console.error('[Warehouses] Error updating warehouse:', error.message);
    res.status(500).json({ success: false, error: 'Error updating warehouse', details: error.message });
  }
});
router.delete('/:id', async (req, res) => {
  const transaction = new sql.Transaction(await getPool());
  try {
    const { id } = req.params;

    await transaction.begin();
    const request = transaction.request();

    const existing = await request
      .input('id', sql.Int, parseInt(id, 10))
      .query('SELECT id, idTipoMagazzino FROM Magazzini WHERE id = @id');

    if (existing.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ success: false, error: 'Warehouse not found' });
    }

    if (existing.recordset[0].idTipoMagazzino !== MANUAL_WAREHOUSE_TYPE_ID) {
      await transaction.rollback();
      return res.status(400).json({ success: false, error: 'Only manual warehouses can be deleted' });
    }

    const udcStats = await request
      .input('idMagazzino', sql.Int, parseInt(id, 10))
      .query(`
        SELECT COUNT(*) AS udcCount, SUM(numProdotti) AS totalProducts
        FROM Udc
        WHERE idMagazzino = @idMagazzino
      `);

    const udcCount = Number(udcStats.recordset[0]?.udcCount ?? 0);
    const totalProducts = Number(udcStats.recordset[0]?.totalProducts ?? 0);

    if (udcCount > 0 && totalProducts > 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'Warehouse contains UDC with products',
      });
    }

    await request.query(`
      UPDATE Canali
      SET idLocazionePrimoPrelievo = NULL, idLocazionePrimoDeposito = NULL
      WHERE idMagazzino = @idMagazzino
    `);

    await request.query(`
      DELETE FROM UdcSupporti
      WHERE idUdc IN (SELECT id FROM Udc WHERE idMagazzino = @idMagazzino)
    `);

    await request.query(`
      DELETE FROM Udc
      WHERE idMagazzino = @idMagazzino
    `);

    await request.query('DELETE FROM Locazioni WHERE idMagazzino = @idMagazzino');
    await request.query('DELETE FROM Canali WHERE idMagazzino = @idMagazzino');
    await request.query('DELETE FROM Campate WHERE idMagazzino = @idMagazzino');
    await request.query('DELETE FROM Corridoi WHERE idMagazzino = @idMagazzino');
    await request.query('DELETE FROM Magazzini WHERE id = @idMagazzino');

    await transaction.commit();
    res.json({ success: true });
  } catch (error) {
    await transaction.rollback();
    console.error('[Warehouses] Error deleting warehouse:', error.message);
    res.status(500).json({ success: false, error: 'Error deleting warehouse', details: error.message });
  }
});

router.post('/:id/associate-area', async (req, res) => {
  const transaction = new sql.Transaction(await getPool());
  try {
    const { id } = req.params;
    const areaId = req.body?.areaId ?? req.body?.idArea ?? null;

    await transaction.begin();
    const request = transaction.request()
      .input('idMagazzino', sql.Int, parseInt(id, 10))
      .input('idArea', sql.Int, areaId !== null ? parseInt(areaId, 10) : null);

    await request.query('UPDATE Magazzini SET idArea = @idArea WHERE id = @idMagazzino');
    await request.query('UPDATE Corridoi SET idArea = @idArea WHERE idMagazzino = @idMagazzino');
    await request.query('UPDATE Campate SET idArea = @idArea WHERE idMagazzino = @idMagazzino');
    await request.query('UPDATE Canali SET idArea = @idArea WHERE idMagazzino = @idMagazzino');
    await request.query('UPDATE Locazioni SET idArea = @idArea WHERE idMagazzino = @idMagazzino');
    await request.query('UPDATE Udc SET idArea = @idArea WHERE idMagazzino = @idMagazzino');

    await transaction.commit();
    res.json({ success: true });
  } catch (error) {
    await transaction.rollback();
    console.error('[Warehouses] Error associating area:', error.message);
    res.status(500).json({ success: false, error: 'Error associating area', details: error.message });
  }
});

router.post('/:id/enable', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, parseInt(req.params.id, 10))
      .input('statusId', sql.Int, STATUS_ENABLED_ID)
      .query('UPDATE Magazzini SET idStatoMagazzino = @statusId WHERE id = @id');
    res.json({ success: true });
  } catch (error) {
    console.error('[Warehouses] Error enabling warehouse:', error.message);
    res.status(500).json({ success: false, error: 'Error enabling warehouse', details: error.message });
  }
});

router.post('/:id/disable', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, parseInt(req.params.id, 10))
      .input('statusId', sql.Int, STATUS_DISABLED_ID)
      .query('UPDATE Magazzini SET idStatoMagazzino = @statusId WHERE id = @id');
    res.json({ success: true });
  } catch (error) {
    console.error('[Warehouses] Error disabling warehouse:', error.message);
    res.status(500).json({ success: false, error: 'Error disabling warehouse', details: error.message });
  }
});
router.post('/:id/format-descriptions', async (req, res) => {
  const transaction = new sql.Transaction(await getPool());
  try {
    const { id } = req.params;
    const formatoCampate = req.body?.formatoDescrizioneCampate ?? null;
    const formatoCanali = req.body?.formatoDescrizioneCanali ?? null;
    const formatoLocazioni = req.body?.formatoDescrizioneLocazioni ?? null;

    await transaction.begin();
    const request = transaction.request();

    const magResult = await request
      .input('id', sql.Int, parseInt(id, 10))
      .query('SELECT id, descrizione FROM Magazzini WHERE id = @id');

    if (magResult.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ success: false, error: 'Warehouse not found' });
    }

    const magazzinoDescrizione = magResult.recordset[0].descrizione ?? `${id}`;

    const updates = [];
    if (formatoCampate !== null) {
      updates.push('formatoDescrizioneCampate = @formatoCampate');
      request.input('formatoCampate', sql.NVarChar(250), formatoCampate);
    }
    if (formatoCanali !== null) {
      updates.push('formatoDescrizioneCanali = @formatoCanali');
      request.input('formatoCanali', sql.NVarChar(250), formatoCanali);
    }
    if (formatoLocazioni !== null) {
      updates.push('formatoDescrizioneLocazioni = @formatoLocazioni');
      request.input('formatoLocazioni', sql.NVarChar(250), formatoLocazioni);
    }

    if (updates.length > 0) {
      await request.query(`
        UPDATE Magazzini
        SET ${updates.join(', ')}
        WHERE id = @id
      `);
    }

    if (formatoCampate !== null) {
      const campate = await request
        .input('idMagazzino', sql.Int, parseInt(id, 10))
        .query(`
          SELECT id, x, y, z, idCorridoio, idTipoCampata
          FROM Campate
          WHERE idMagazzino = @idMagazzino
        `);

      for (const row of campate.recordset) {
        if (row.idTipoCampata !== CAMPATA_STOCCAGGIO_ID) {
          continue;
        }
        const params = createCampataParams(row, magazzinoDescrizione);
        await transaction.request()
          .input('id', sql.Int, row.id)
          .input('descrizione', sql.NVarChar(250), formatoCampate)
          .input('params', sql.NVarChar(sql.MAX), params)
          .query(`
            UPDATE Campate
            SET descrizione = @descrizione, descrizioneParams = @params
            WHERE id = @id
          `);
      }
    }

    if (formatoCanali !== null) {
      const canali = await request
        .input('idMagazzino', sql.Int, parseInt(id, 10))
        .query(`
          SELECT id, x, y, z, idCorridoio, idTipoCampata
          FROM Canali
          WHERE idMagazzino = @idMagazzino
        `);

      for (const row of canali.recordset) {
        if (row.idTipoCampata !== CAMPATA_STOCCAGGIO_ID) {
          continue;
        }
        const params = createCanaleParams(row, magazzinoDescrizione);
        await transaction.request()
          .input('id', sql.Int, row.id)
          .input('descrizione', sql.NVarChar(250), formatoCanali)
          .input('params', sql.NVarChar(sql.MAX), params)
          .query(`
            UPDATE Canali
            SET descrizione = @descrizione, descrizioneParams = @params
            WHERE id = @id
          `);
      }
    }

    if (formatoLocazioni !== null) {
      const locazioni = await request
        .input('idMagazzino', sql.Int, parseInt(id, 10))
        .query(`
          SELECT
            id,
            x,
            y,
            z,
            w,
            idCorridoio,
            idTipoLocazione,
            offsetProfonditaMm,
            offsetLarghezzaMm,
            profonditaMm,
            auxInt09 AS profonditaCanaleMm,
            larghezzaMm
          FROM Locazioni
          WHERE idMagazzino = @idMagazzino
        `);

      for (const row of locazioni.recordset) {
        if (row.idTipoLocazione !== LOCATION_VANO_ID) {
          continue;
        }
        const params = createLocazioneParams(row, magazzinoDescrizione);
        await transaction.request()
          .input('id', sql.Int, row.id)
          .input('descrizione', sql.NVarChar(250), formatoLocazioni)
          .input('params', sql.NVarChar(sql.MAX), params)
          .query(`
            UPDATE Locazioni
            SET descrizione = @descrizione, descrizioneParams = @params
            WHERE id = @id
          `);
      }
    }

    await transaction.commit();
    res.json({ success: true });
  } catch (error) {
    await transaction.rollback();
    console.error('[Warehouses] Error formatting descriptions:', error.message);
    res.status(500).json({ success: false, error: 'Error formatting descriptions', details: error.message });
  }
});

router.post('/:id/udc-renumber', async (req, res) => {
  const transaction = new sql.Transaction(await getPool());
  try {
    const { id } = req.params;
    const startId = Number(req.body?.startId ?? req.body?.idUdcStart);
    const alternateSides = Boolean(req.body?.alternateSides ?? false);
    const bottomToTop = Boolean(req.body?.bottomToTop ?? true);
    const firstSide0 = Boolean(req.body?.firstSide0 ?? true);

    if (!Number.isFinite(startId) || startId <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid startId' });
    }

    await transaction.begin();
    const request = transaction.request();

    const udcResult = await request
      .input('idMagazzino', sql.Int, parseInt(id, 10))
      .query(`
        SELECT
          U.id,
          U.numeroUdc,
          L.idCorridoio,
          L.y,
          L.z
        FROM Udc U
        LEFT JOIN Locazioni L ON U.idLocazione = L.id
        WHERE U.idMagazzino = @idMagazzino AND U.recordCancellato = 0
      `);

    const udcs = udcResult.recordset.slice();
    udcs.sort((a, b) => {
      if ((a.idCorridoio ?? 0) !== (b.idCorridoio ?? 0)) {
        return (a.idCorridoio ?? 0) - (b.idCorridoio ?? 0);
      }

      if (alternateSides) {
        if ((a.y ?? 0) !== (b.y ?? 0)) {
          return (bottomToTop ? 1 : -1) * ((a.y ?? 0) - (b.y ?? 0));
        }
        if ((a.z ?? 0) !== (b.z ?? 0)) {
          return (firstSide0 ? 1 : -1) * ((a.z ?? 0) - (b.z ?? 0));
        }
      } else {
        if ((a.z ?? 0) !== (b.z ?? 0)) {
          return (firstSide0 ? 1 : -1) * ((a.z ?? 0) - (b.z ?? 0));
        }
        if ((a.y ?? 0) !== (b.y ?? 0)) {
          return (bottomToTop ? 1 : -1) * ((a.y ?? 0) - (b.y ?? 0));
        }
      }

      return a.id - b.id;
    });

    let current = startId;
    for (const udc of udcs) {
      await transaction.request()
        .input('id', sql.Int, udc.id)
        .input('numeroUdc', sql.NVarChar(50), `${current}`)
        .input('barcode', sql.NVarChar(100), `${UDC_BARCODE_PREFIX}${current}`)
        .query(`
          UPDATE Udc
          SET numeroUdc = @numeroUdc, barcode = @barcode
          WHERE id = @id
        `);
      current += 1;
    }

    await transaction.commit();
    res.json({ success: true, data: { startId, total: udcs.length } });
  } catch (error) {
    await transaction.rollback();
    console.error('[Warehouses] Error renumbering UDC:', error.message);
    res.status(500).json({ success: false, error: 'Error renumbering UDC', details: error.message });
  }
});

router.post('/:id/udc-terra', async (req, res) => {
  const transaction = new sql.Transaction(await getPool());
  try {
    const { id } = req.params;

    await transaction.begin();
    const request = transaction.request();

    const magResult = await request
      .input('id', sql.Int, parseInt(id, 10))
      .query(`
        SELECT id, descrizione, idArea, idTipoMagazzino
        FROM Magazzini
        WHERE id = @id
      `);

    if (magResult.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ success: false, error: 'Warehouse not found' });
    }

    const warehouse = magResult.recordset[0];

    let locTerraResult = await request
      .input('idMagazzino', sql.Int, warehouse.id)
      .input('tipoLocazione', sql.Int, LOCATION_MANUAL_ID)
      .query(`
        SELECT TOP 1 id
        FROM Locazioni
        WHERE idMagazzino = @idMagazzino AND idTipoLocazione = @tipoLocazione
      `);

    let locazioneId = locTerraResult.recordset[0]?.id ?? null;

    const classAltezzaId = await getMaxId(request, 'ClassiAltezza');
    const classPesoId = await getMaxId(request, 'ClassiPeso');
    const classLarghezzaId = await getMaxId(request, 'ClassiLarghezza');
    const classProfonditaId = await getMaxId(request, 'ClassiProfondita');

    const contenitoreResult = await request.query(`
      SELECT TOP 1
        id,
        tara,
        numeroSuddivisioniX,
        numeroSuddivisioniY,
        tipoCoordinateScomparti,
        idClasseAltezza,
        idClasseLarghezza,
        idClasseProfondita,
        idClassePeso
      FROM TipoContenitore
      ORDER BY id DESC
    `);
    const contenitore = contenitoreResult.recordset[0] ?? null;

    const udcClasseAltezzaId = contenitore?.idClasseAltezza ?? classAltezzaId;
    const udcClasseLarghezzaId = contenitore?.idClasseLarghezza ?? classLarghezzaId;
    const udcClasseProfonditaId = contenitore?.idClasseProfondita ?? classProfonditaId;
    const udcClassePesoId = contenitore?.idClassePeso ?? classPesoId;
    const tipoContenitoreId = contenitore?.id ?? null;

    if (!udcClasseAltezzaId || !udcClasseLarghezzaId || !udcClasseProfonditaId || !udcClassePesoId || !tipoContenitoreId) {
      await transaction.rollback();
      return res.status(400).json({ success: false, error: 'Missing class/container configuration' });
    }

    if (!locazioneId) {
      locazioneId = await getNextCounterValue(transaction, 'LOCAZIONI', 'Locazioni');
      await request
        .input('id', sql.Int, locazioneId)
        .input('barcode', sql.NVarChar(100), `${LOCATION_BARCODE_PREFIX}${locazioneId}`)
        .input('descrizione', sql.NVarChar(250), `Location Manual for warehouse ${warehouse.descrizione}`)
        .input('idMagazzino', sql.Int, warehouse.id)
        .input('idArea', sql.Int, warehouse.idArea)
        .input('idTipoMagazzino', sql.Int, warehouse.idTipoMagazzino)
        .input('idTipoLocazione', sql.Int, LOCATION_MANUAL_ID)
        .input('automatizzata', sql.Bit, 0)
        .input('profonditaDinamica', sql.Bit, 0)
        .input('larghezzaDinamica', sql.Bit, 0)
        .input('idClasseAltezza', sql.Int, classAltezzaId)
        .input('idClassePeso', sql.Int, classPesoId)
        .input('larghezzaMm', sql.Int, 1000000)
        .input('profonditaMm', sql.Int, 1000000)
        .input('abilitata', sql.Bit, 1)
        .input('abilitataIn', sql.Bit, 1)
        .input('abilitataOut', sql.Bit, 1)
        .input('abilitataVisione', sql.Bit, 1)
        .input('verificaNumUdc', sql.Bit, 0)
        .input('maxUdc', sql.Int, 999)
        .query(`
          INSERT INTO Locazioni (
            id,
            barcode,
            descrizione,
            idMagazzino,
            idArea,
            idTipoMagazzino,
            idTipoLocazione,
            automatizzata,
            profonditaDinamica,
            larghezzaDinamica,
            idClasseAltezza,
            idClassePeso,
            larghezzaMm,
            profonditaMm,
            abilitata,
            abilitataIn,
            abilitataOut,
            abilitataVisione,
            verificaNumUdc,
            maxUdc
          )
          VALUES (
            @id,
            @barcode,
            @descrizione,
            @idMagazzino,
            @idArea,
            @idTipoMagazzino,
            @idTipoLocazione,
            @automatizzata,
            @profonditaDinamica,
            @larghezzaDinamica,
            @idClasseAltezza,
            @idClassePeso,
            @larghezzaMm,
            @profonditaMm,
            @abilitata,
            @abilitataIn,
            @abilitataOut,
            @abilitataVisione,
            @verificaNumUdc,
            @maxUdc
          )
        `);
    }

    const udcId = await getNextCounterValue(transaction, 'UDC', 'Udc');
    const numeroUdc = `${udcId}`;
    const barcode = `${UDC_BARCODE_PREFIX}${udcId}`;

    await request
      .input('id', sql.Int, udcId)
      .input('idLocazione', sql.Int, locazioneId)
      .input('idClasseAltezza', sql.Int, udcClasseAltezzaId)
      .input('idClasseLarghezza', sql.Int, udcClasseLarghezzaId)
      .input('idClasseProfondita', sql.Int, udcClasseProfonditaId)
      .input('idClassePeso', sql.Int, udcClassePesoId)
      .input('idTipoContenitore', sql.Int, tipoContenitoreId)
      .input('barcode', sql.NVarChar(100), barcode)
      .input('numeroUdc', sql.NVarChar(50), numeroUdc)
      .input('riservataMaterialeTerra', sql.Bit, 1)
      .input('recordCancellato', sql.Bit, 0)
      .input('pesoDaAcquisire', sql.Bit, 0)
      .input('tipoContenitoreDaAcquisire', sql.Bit, 0)
      .input('altezzaDaAcquisire', sql.Bit, 0)
      .input('larghezzaDaAcquisire', sql.Bit, 0)
      .input('profonditaDaAcquisire', sql.Bit, 0)
      .input('numeroStoccaggiAMagazzino', sql.Int, 0)
      .input('anomalia', sql.Bit, 0)
      .input('fsFront', sql.Bit, 0)
      .input('fsPost', sql.Bit, 0)
      .input('fsSup', sql.Bit, 0)
      .input('fsDx', sql.Bit, 0)
      .input('fsSx', sql.Bit, 0)
      .input('fsInf', sql.Bit, 0)
      .input('altezza', sql.Int, 0)
      .input('larghezza', sql.Int, 0)
      .input('profondita', sql.Int, 0)
      .input('peso', sql.Int, contenitore?.tara ?? 0)
      .input('tara', sql.Int, contenitore?.tara ?? 0)
      .input('numeroSuddivisioniX', sql.Int, contenitore?.numeroSuddivisioniX ?? 1)
      .input('numeroSuddivisioniY', sql.Int, contenitore?.numeroSuddivisioniY ?? 1)
      .input('modoVisualizzazioneCoordScomparti', sql.Int, contenitore?.tipoCoordinateScomparti ?? 1)
      .query(`
        INSERT INTO Udc (
          id,
          idLocazione,
          idClasseAltezza,
          idClasseLarghezza,
          idClasseProfondita,
          idClassePeso,
          idTipoContenitore,
          barcode,
          numeroUdc,
          riservataMaterialeTerra,
          recordCancellato,
          pesoDaAcquisire,
          tipoContenitoreDaAcquisire,
          altezzaDaAcquisire,
          larghezzaDaAcquisire,
          profonditaDaAcquisire,
          numeroStoccaggiAMagazzino,
          anomalia,
          fsFront,
          fsPost,
          fsSup,
          fsDx,
          fsSx,
          fsInf,
          altezza,
          larghezza,
          profondita,
          peso,
          tara,
          numeroSuddivisioniX,
          numeroSuddivisioniY,
          modoVisualizzazioneCoordScomparti
        )
        VALUES (
          @id,
          @idLocazione,
          @idClasseAltezza,
          @idClasseLarghezza,
          @idClasseProfondita,
          @idClassePeso,
          @idTipoContenitore,
          @barcode,
          @numeroUdc,
          @riservataMaterialeTerra,
          @recordCancellato,
          @pesoDaAcquisire,
          @tipoContenitoreDaAcquisire,
          @altezzaDaAcquisire,
          @larghezzaDaAcquisire,
          @profonditaDaAcquisire,
          @numeroStoccaggiAMagazzino,
          @anomalia,
          @fsFront,
          @fsPost,
          @fsSup,
          @fsDx,
          @fsSx,
          @fsInf,
          @altezza,
          @larghezza,
          @profondita,
          @peso,
          @tara,
          @numeroSuddivisioniX,
          @numeroSuddivisioniY,
          @modoVisualizzazioneCoordScomparti
        )
      `);

    const supportoId = await getNextCounterValue(transaction, 'SUPPORTI', 'UdcSupporti');
    await request
      .input('idSupporto', sql.Int, supportoId)
      .input('idUdc', sql.Int, udcId)
      .input('idTipoSupporto', sql.Int, 1)
      .input('progressivo', sql.Int, 1)
      .input('recordCancellato', sql.Bit, 0)
      .input('posX', sql.Int, 0)
      .input('posY', sql.Int, 0)
      .input('dimX', sql.Int, 1000000)
      .input('dimY', sql.Int, 1000000)
      .input('pctRiempimento', sql.Int, 0)
      .input('bloccatoManualmente', sql.Bit, 0)
      .input('bloccatoPerCriterio', sql.Bit, 0)
      .query(`
        INSERT INTO UdcSupporti (
          id,
          idUdc,
          idTipoSupporto,
          progressivo,
          recordCancellato,
          posX,
          posY,
          dimX,
          dimY,
          pctRiempimento,
          bloccatoManualmente,
          bloccatoPerCriterio
        )
        VALUES (
          @idSupporto,
          @idUdc,
          @idTipoSupporto,
          @progressivo,
          @recordCancellato,
          @posX,
          @posY,
          @dimX,
          @dimY,
          @pctRiempimento,
          @bloccatoManualmente,
          @bloccatoPerCriterio
        )
      `);

    await transaction.commit();

    res.json({
      success: true,
      data: {
        udcId,
        numeroUdc,
        barcode,
        locazioneId,
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error('[Warehouses] Error creating UDC Terra:', error.message);
    res.status(500).json({ success: false, error: 'Error creating UDC Terra', details: error.message });
  }
});

export default router;
