/**
 * Production-Ready Item Lists Controller
 * Adattato allo schema database esistente
 */

import { getPool, sql } from '../db-config.js';

/**
 * GET /api/lists
 * Lista liste con schema produzione
 */
export const getItemLists = async (req, res) => {
  try {
    const pool = await getPool();
    const { search, limit = 10, offset = 0 } = req.query;
    
    const request = pool.request();
    const whereConditions = ['l.recordCancellato = 0'];
    
    if (search) {
      whereConditions.push('(l.numLista LIKE @search OR l.descrizione LIKE @search)');
      request.input('search', sql.NVarChar(255), `%${search}%`);
    }
    
    const whereClause = whereConditions.join(' AND ');
    request.input('offset', sql.Int, parseInt(offset));
    request.input('limit', sql.Int, parseInt(limit));
    
    const result = await request.query(`
      SELECT
        l.id,
        l.numLista AS code,
        l.descrizione AS description,
        CASE l.idTipoLista
          WHEN 1 THEN 'Picking'
          WHEN 2 THEN 'Refilling'
          WHEN 3 THEN 'Inventario'
          ELSE 'Altro'
        END AS type,
        CASE
          WHEN l.terminata = 1 THEN 'Completata'
          WHEN l.dataInizioEvasione IS NOT NULL AND l.dataFineEvasione IS NULL THEN 'InEsecuzione'
          ELSE 'Nuova'
        END AS status,
        COALESCE(l.auxTesto01, 'Media') AS priority,
        l.dataCreazione AS createdAt,
        l.dataInizioEvasione AS startedAt,
        l.dataFineEvasione AS completedAt,
        l.utente AS createdBy,
        l.numeroRighe AS totalRows,
        l.numeroRigheTerminate AS completedRows,
        l.numeroRigheNonEvadibili AS unavailableRows,
        CASE
          WHEN l.numeroRighe = 0 THEN 0
          ELSE CAST(l.numeroRigheTerminate AS FLOAT) / CAST(l.numeroRighe AS FLOAT) * 100
        END AS completionPercentage
      FROM Liste l
      WHERE ${whereClause}
      ORDER BY l.dataCreazione DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);
    
    const countResult = await pool.request().query(`
      SELECT COUNT(*) as total FROM Liste l WHERE ${whereClause}
    `);
    
    res.json({
      success: true,
      data: result.recordset,
      pagination: {
        total: countResult.recordset[0].total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Errore getItemLists:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/lists/:id
 * Dettaglio singola lista
 */
export const getItemListById = async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;
    
    const result = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query(`
        SELECT
          l.id,
          l.numLista AS code,
          l.descrizione AS description,
          CASE l.idTipoLista
            WHEN 1 THEN 'Picking'
            WHEN 2 THEN 'Refilling'
            WHEN 3 THEN 'Inventario'
            ELSE 'Altro'
          END AS type,
          CASE
            WHEN l.terminata = 1 THEN 'Completata'
            WHEN l.dataInizioEvasione IS NOT NULL AND l.dataFineEvasione IS NULL THEN 'InEsecuzione'
            ELSE 'Nuova'
          END AS status,
          l.*
        FROM Liste l
        WHERE l.id = @id AND l.recordCancellato = 0
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Lista non trovata' });
    }
    
    res.json({
      success: true,
      data: result.recordset[0]
    });
  } catch (error) {
    console.error('Errore getItemListById:', error);
    res.status(500).json({ error: error.message });
  }
};

// Stub per gli altri endpoint
export const createItemList = async (req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
};

export const updateItemList = async (req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
};

export const deleteItemList = async (req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
};

export const executeList = async (req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
};

export const pauseList = async (req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
};

export const resumeList = async (req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
};

export const completeList = async (req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
};

export const cancelList = async (req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
};

export const copyList = async (req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
};

export const getItemListItems = async (req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
};

export const addItemToList = async (req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
};

export const updateListItem = async (req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
};

export const removeItemFromList = async (req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
};

export const getListHistory = async (req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
};
