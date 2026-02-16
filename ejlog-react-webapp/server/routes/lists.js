// ============================================================================
// EJLOG WMS - Lists API Routes
// REST API for Item Lists with REAL database data
// ============================================================================

import express from 'express';
import { getPool } from '../db-config.js';
import { body, param } from 'express-validator';

const router = express.Router();

// ============================================================================
// GET /api/lists - Get all lists with filters and pagination
// ============================================================================
router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    const {
      limit = 100,
      offset = 0,
      listNumber,
      listType,
      listStatus,
      orderNumber,
      search
    } = req.query;

    // Build WHERE conditions
    let whereConditions = [];
    if (listNumber) {
      whereConditions.push(`L.numLista = '${listNumber}'`);
    }
    if (listType) {
      whereConditions.push(`L.idTipoLista = ${parseInt(listType)}`);
    }
    if (orderNumber) {
      whereConditions.push(`L.rifLista LIKE '%${orderNumber}%'`);
    }
    if (search) {
      whereConditions.push(`(L.numLista LIKE '%${search}%' OR L.descrizione LIKE '%${search}%' OR L.rifLista LIKE '%${search}%')`);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    // Main query - join Liste with ListeAreaDetails, Aree, and LocazioniPTL for real data
    const query = `
      SELECT
        L.id,
        L.numLista,
        L.rifLista,
        L.descrizione,
        L.idTipoLista,
        L.idStatoControlloEvadibilita,
        L.utente,
        L.dataCreazione,
        L.dataModifica,
        L.dataLancio,
        L.dataInizioEvasione,
        L.dataFineEvasione,
        L.terminata,
        L.numeroRighe,
        L.numeroRigheTerminate,
        L.numeroRigheNonEvadibili,
        L.idCausaleMovimento,
        L.barcode,
        LAD.sequenzaLancio,
        LAD.priorita,
        LAD.idArea,
        LAD.idGruppoDestinazione,
        A.descrizione AS nomeArea,
        PTL.gateway,
        PTL.node,
        PTL.port
      FROM Liste L
      LEFT JOIN ListeAreaDetails LAD ON L.id = LAD.idLista
      LEFT JOIN Aree A ON LAD.idArea = A.id
      LEFT JOIN LocazioniPTL PTL ON L.id = PTL.idListaPTL
      ${whereClause}
      ORDER BY L.id DESC
      OFFSET ${parseInt(offset)} ROWS
      FETCH NEXT ${parseInt(limit)} ROWS ONLY
    `;

    const result = await pool.request().query(query);

    // Transform to frontend format (compatible with listsService.ts interface)
    const lists = result.recordset.map(row => {
      // Build PTL location string from gateway and node (e.g., "PTL G1N1")
      let locazionePTL = null;
      if (row.gateway && row.node) {
        locazionePTL = `PTL G${row.gateway}N${row.node}`;
      }

      return {
        listHeader: {
          id: row.id, // IMPORTANT: Include database numeric ID
          listNumber: row.numLista || '',
          listDescription: row.descrizione || '',
          listType: row.idTipoLista || 0,
          listStatus: mapDatabaseStatusToAPI(row.idStatoControlloEvadibilita, row.terminata),
          cause: row.idCausaleMovimento ?? null,
          orderNumber: row.rifLista || row.numLista,
          priority: row.priorita ?? 0, // Use real priority from database (0 = default)
          sequenzaLancio: row.sequenzaLancio,
          idArea: row.idArea || null, // Area ID
          idGruppoDestinazione: row.idGruppoDestinazione || null, // Destination group ID
          nomeArea: row.nomeArea || null, // Real area name from Aree table
          locazionePTL: locazionePTL, // Real PTL location from LocazioniPTL table (e.g., "PTL G1N1")
          utente: row.utente || null,
          dataCreazione: row.dataCreazione || null,
          dataModifica: row.dataModifica || null,
          dataLancio: row.dataLancio || null,
          dataInizioEvasione: row.dataInizioEvasione || null,
          dataFineEvasione: row.dataFineEvasione || null,
          numeroRighe: row.numeroRighe ?? 0,
          numeroRigheTerminate: row.numeroRigheTerminate ?? 0,
          numeroRigheNonEvadibili: row.numeroRigheNonEvadibili ?? 0,
          barcode: row.barcode || null,
          idCausaleMovimento: row.idCausaleMovimento ?? null,
          terminata: row.terminata ? 1 : 0
        },
        listRows: [] // Will be populated if needed
      };
    });

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM Liste L ${whereClause}`;
    const countResult = await pool.request().query(countQuery);
    const total = countResult.recordset[0].total;

    res.json({
      result: 'OK',
      exported: lists,
      recordNumber: total,
      total: total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error('[/api/lists] Error:', error);
    res.status(500).json({
      result: 'ERROR',
      message: error.message,
      error: error.toString()
    });
  }
});

// ============================================================================
// GET /api/lists/destination-groups - Get destination groups
// ============================================================================
router.get('/destination-groups', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT id, descrizione
      FROM GruppiDestinazioni
      ORDER BY descrizione
    `);

    res.json({
      result: 'OK',
      data: result.recordset
    });
  } catch (error) {
    console.error('[/api/lists/destination-groups] Error:', error);
    res.status(500).json({
      result: 'ERROR',
      message: error.message
    });
  }
});

// ============================================================================
// GET /api/lists/ptl/container-types - Get PTL container types
// ============================================================================
router.get('/ptl/container-types', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT id, descrizione
      FROM TipoContenitore
      ORDER BY descrizione
    `);

    res.json({
      result: 'OK',
      data: result.recordset
    });
  } catch (error) {
    console.error('[/api/lists/ptl/container-types] Error:', error);
    res.status(500).json({
      result: 'ERROR',
      message: error.message
    });
  }
});

// ============================================================================
// POST /api/lists/priority - Update priority for list area details
// ============================================================================
router.post('/priority', express.json(), async (req, res) => {
  try {
    const { listIds, priority } = req.body;
    const parsedIds = Array.isArray(listIds)
      ? listIds.map(Number).filter(Number.isFinite)
      : [];

    if (parsedIds.length === 0 || !Number.isFinite(Number(priority))) {
      return res.status(400).json({
        result: 'ERROR',
        message: 'listIds e priority sono obbligatori'
      });
    }

    const pool = await getPool();
    const request = pool.request();
    const inParams = parsedIds.map((id, index) => {
      const key = `id${index}`;
      request.input(key, id);
      return `@${key}`;
    }).join(',');

    request.input('priority', Number(priority));
    const updateQuery = `
      UPDATE ListeAreaDetails
      SET priorita = @priority
      WHERE idLista IN (${inParams})
    `;

    await request.query(updateQuery);

    res.json({
      result: 'OK',
      message: 'Priorita aggiornata'
    });
  } catch (error) {
    console.error('[/api/lists/priority] Error:', error);
    res.status(500).json({
      result: 'ERROR',
      message: error.message
    });
  }
});

// ============================================================================
// POST /api/lists/destination - Update destination group for list area details
// ============================================================================
router.post('/destination', express.json(), async (req, res) => {
  try {
    const { listIds, destinationGroupId } = req.body;
    const parsedIds = Array.isArray(listIds)
      ? listIds.map(Number).filter(Number.isFinite)
      : [];

    if (parsedIds.length === 0 || !Number.isFinite(Number(destinationGroupId))) {
      return res.status(400).json({
        result: 'ERROR',
        message: 'listIds e destinationGroupId sono obbligatori'
      });
    }

    const pool = await getPool();
    const request = pool.request();
    const inParams = parsedIds.map((id, index) => {
      const key = `id${index}`;
      request.input(key, id);
      return `@${key}`;
    }).join(',');

    request.input('destinationGroupId', Number(destinationGroupId));
    const updateQuery = `
      UPDATE ListeAreaDetails
      SET idGruppoDestinazione = @destinationGroupId
      WHERE idLista IN (${inParams})
    `;

    await request.query(updateQuery);

    res.json({
      result: 'OK',
      message: 'Destinazione aggiornata'
    });
  } catch (error) {
    console.error('[/api/lists/destination] Error:', error);
    res.status(500).json({
      result: 'ERROR',
      message: error.message
    });
  }
});

// ============================================================================
// POST /api/lists/sequence - Advance or delay list sequence
// ============================================================================
router.post('/sequence', express.json(), async (req, res) => {
  try {
    const { listIds, direction } = req.body;
    const parsedIds = Array.isArray(listIds)
      ? listIds.map(Number).filter(Number.isFinite)
      : [];

    if (parsedIds.length === 0 || (direction !== 'up' && direction !== 'down')) {
      return res.status(400).json({
        result: 'ERROR',
        message: 'listIds e direction (up|down) sono obbligatori'
      });
    }

    const pool = await getPool();
    const request = pool.request();
    const inParams = parsedIds.map((id, index) => {
      const key = `id${index}`;
      request.input(key, id);
      return `@${key}`;
    }).join(',');

    const updateQuery = direction === 'up'
      ? `
        UPDATE ListeAreaDetails
        SET sequenzaLancio = CASE WHEN sequenzaLancio > 1 THEN sequenzaLancio - 1 ELSE 1 END
        WHERE idLista IN (${inParams})
      `
      : `
        UPDATE ListeAreaDetails
        SET sequenzaLancio = sequenzaLancio + 1
        WHERE idLista IN (${inParams})
      `;

    await request.query(updateQuery);

    res.json({
      result: 'OK',
      message: 'Sequenza aggiornata'
    });
  } catch (error) {
    console.error('[/api/lists/sequence] Error:', error);
    res.status(500).json({
      result: 'ERROR',
      message: error.message
    });
  }
});

// ============================================================================
// POST /api/lists/reactivate-rows - Reactivate suspended rows
// ============================================================================
router.post('/reactivate-rows', express.json(), async (req, res) => {
  try {
    const { listIds } = req.body;
    const parsedIds = Array.isArray(listIds)
      ? listIds.map(Number).filter(Number.isFinite)
      : [];

    if (parsedIds.length === 0) {
      return res.status(400).json({
        result: 'ERROR',
        message: 'listIds sono obbligatori'
      });
    }

    const pool = await getPool();
    const request = pool.request();
    const inParams = parsedIds.map((id, index) => {
      const key = `id${index}`;
      request.input(key, id);
      return `@${key}`;
    }).join(',');

    const statusQuery = `
      SELECT
        (SELECT TOP 1 id FROM StatoRiga WHERE descrizione = 'Attiva') AS attivaId,
        (SELECT TOP 1 id FROM StatoRiga WHERE descrizione = 'Sospesa') AS sospesaId
    `;
    const statusResult = await pool.request().query(statusQuery);
    const attivaId = statusResult.recordset[0]?.attivaId;
    const sospesaId = statusResult.recordset[0]?.sospesaId;

    if (!attivaId || !sospesaId) {
      return res.status(500).json({
        result: 'ERROR',
        message: 'Stati riga non trovati'
      });
    }

    request.input('attivaId', attivaId);
    request.input('sospesaId', sospesaId);
    const updateQuery = `
      UPDATE RigheLista
      SET idStatoRiga = @attivaId, terminata = 0
      WHERE idLista IN (${inParams})
        AND idStatoRiga = @sospesaId
    `;

    await request.query(updateQuery);

    res.json({
      result: 'OK',
      message: 'Righe riattivate'
    });
  } catch (error) {
    console.error('[/api/lists/reactivate-rows] Error:', error);
    res.status(500).json({
      result: 'ERROR',
      message: error.message
    });
  }
});

// ============================================================================
// POST /api/lists/:id/revive - Revive terminated list
// ============================================================================
router.post('/:id/revive', async (req, res) => {
  try {
    const pool = await getPool();
    const listId = parseInt(req.params.id);

    const statusQuery = `
      SELECT
        (SELECT TOP 1 id FROM StatoRiga WHERE descrizione = 'Attiva') AS attivaId
    `;
    const statusResult = await pool.request().query(statusQuery);
    const attivaId = statusResult.recordset[0]?.attivaId;

    if (!attivaId) {
      return res.status(500).json({
        result: 'ERROR',
        message: 'Stato riga attiva non trovato'
      });
    }

    const transaction = pool.transaction();
    await transaction.begin();
    const request = transaction.request();
    request.input('listId', listId);
    request.input('attivaId', attivaId);

    await request.query(`
      UPDATE RigheLista
      SET terminata = 0,
          idStatoRiga = @attivaId
      WHERE idLista = @listId
        AND qtaMovimentata < qtaRichiesta
    `);

    await request.query(`
      UPDATE Liste
      SET terminata = 0,
          dataFineEvasione = NULL,
          esportata = 0,
          idStatoControlloEvadibilita = 1,
          dataModifica = GETDATE()
      WHERE id = @listId
    `);

    await request.query(`
      UPDATE ListeAreaDetails
      SET idStatoLista = 1
      WHERE idLista = @listId
    `);

    await transaction.commit();

    res.json({
      result: 'OK',
      message: `Lista ${listId} riesumata`
    });
  } catch (error) {
    console.error(`[/api/lists/${req.params.id}/revive] Error:`, error);
    res.status(500).json({
      result: 'ERROR',
      message: error.message
    });
  }
});

// ============================================================================
// POST /api/lists/ptl/enable - Enable PTL
// ============================================================================
router.post('/ptl/enable', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request().query(`
      UPDATE Config
      SET valore = '1',
          dataUltimaModifica = GETDATE(),
          valorePrecedente = valore
      WHERE sezione = 'PTL' AND sottosezione = 'CFG' AND chiave = 'ENABLED'
    `);

    res.json({ result: 'OK', message: 'PTL abilitato' });
  } catch (error) {
    console.error('[/api/lists/ptl/enable] Error:', error);
    res.status(500).json({ result: 'ERROR', message: error.message });
  }
});

// ============================================================================
// POST /api/lists/ptl/disable - Disable PTL
// ============================================================================
router.post('/ptl/disable', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request().query(`
      UPDATE Config
      SET valore = '0',
          dataUltimaModifica = GETDATE(),
          valorePrecedente = valore
      WHERE sezione = 'PTL' AND sottosezione = 'CFG' AND chiave = 'ENABLED'
    `);

    res.json({ result: 'OK', message: 'PTL disabilitato' });
  } catch (error) {
    console.error('[/api/lists/ptl/disable] Error:', error);
    res.status(500).json({ result: 'ERROR', message: error.message });
  }
});

// ============================================================================
// POST /api/lists/ptl/reset - Reset PTL for selected lists
// ============================================================================
router.post('/ptl/reset', express.json(), async (req, res) => {
  try {
    const { listIds } = req.body;
    const parsedIds = Array.isArray(listIds)
      ? listIds.map(Number).filter(Number.isFinite)
      : [];

    if (parsedIds.length === 0) {
      return res.status(400).json({
        result: 'ERROR',
        message: 'listIds sono obbligatori'
      });
    }

    const pool = await getPool();
    const request = pool.request();
    const inParams = parsedIds.map((id, index) => {
      const key = `id${index}`;
      request.input(key, id);
      return `@${key}`;
    }).join(',');

    await request.query(`
      UPDATE ListePTL
      SET barcodePTL = NULL,
          destinazionePTL = NULL
      WHERE idLista IN (${inParams})
    `);

    res.json({ result: 'OK', message: 'PTL resettato per le liste selezionate' });
  } catch (error) {
    console.error('[/api/lists/ptl/reset] Error:', error);
    res.status(500).json({ result: 'ERROR', message: error.message });
  }
});

// ============================================================================
// POST /api/lists/ptl/resend - Resend PTL for selected lists
// ============================================================================
router.post('/ptl/resend', express.json(), async (req, res) => {
  try {
    const { listIds } = req.body;
    const parsedIds = Array.isArray(listIds)
      ? listIds.map(Number).filter(Number.isFinite)
      : [];

    if (parsedIds.length === 0) {
      return res.status(400).json({
        result: 'ERROR',
        message: 'listIds sono obbligatori'
      });
    }

    const pool = await getPool();
    const request = pool.request();
    const inParams = parsedIds.map((id, index) => {
      const key = `id${index}`;
      request.input(key, id);
      return `@${key}`;
    }).join(',');

    await request.query(`
      UPDATE ListePTL
      SET barcodePTL = barcodePTL
      WHERE idLista IN (${inParams})
    `);

    res.json({ result: 'OK', message: 'PTL reinviato (trigger aggiornamento)' });
  } catch (error) {
    console.error('[/api/lists/ptl/resend] Error:', error);
    res.status(500).json({ result: 'ERROR', message: error.message });
  }
});

// ============================================================================
// POST /api/lists/ptl/container-type - Set PTL container type
// ============================================================================
router.post('/ptl/container-type', express.json(), async (req, res) => {
  try {
    const { listIds, containerTypeId } = req.body;
    const parsedIds = Array.isArray(listIds)
      ? listIds.map(Number).filter(Number.isFinite)
      : [];

    if (parsedIds.length === 0 || !Number.isFinite(Number(containerTypeId))) {
      return res.status(400).json({
        result: 'ERROR',
        message: 'listIds e containerTypeId sono obbligatori'
      });
    }

    const pool = await getPool();
    const request = pool.request();
    const inParams = parsedIds.map((id, index) => {
      const key = `id${index}`;
      request.input(key, id);
      return `@${key}`;
    }).join(',');

    request.input('containerTypeId', Number(containerTypeId));
    await request.query(`
      UPDATE ListePTL
      SET idTipoContenitorePTL = @containerTypeId
      WHERE idLista IN (${inParams})
    `);

    res.json({ result: 'OK', message: 'Tipo contenitore PTL aggiornato' });
  } catch (error) {
    console.error('[/api/lists/ptl/container-type] Error:', error);
    res.status(500).json({ result: 'ERROR', message: error.message });
  }
});

// ============================================================================
// POST /api/lists/merge - Merge lists (accorpa)
// ============================================================================
router.post('/merge', express.json(), async (req, res) => {
  try {
    const { listIds } = req.body;
    const parsedIds = Array.isArray(listIds)
      ? listIds.map(Number).filter(Number.isFinite)
      : [];

    if (parsedIds.length < 2) {
      return res.status(400).json({
        result: 'ERROR',
        message: 'Selezionare almeno due liste'
      });
    }

    const pool = await getPool();
    const transaction = pool.transaction();
    await transaction.begin();
    const request = transaction.request();
    const inParams = parsedIds.map((id, index) => {
      const key = `id${index}`;
      request.input(key, id);
      return `@${key}`;
    }).join(',');

    const listsResult = await request.query(`
      SELECT id, idTipoLista, terminata
      FROM Liste
      WHERE id IN (${inParams})
    `);

    const lists = listsResult.recordset;
    if (lists.length !== parsedIds.length) {
      await transaction.rollback();
      return res.status(404).json({
        result: 'ERROR',
        message: 'Una o piu liste non trovate'
      });
    }

    const baseType = lists[0].idTipoLista;
    const hasDifferentType = lists.some(l => l.idTipoLista !== baseType);
    const hasTerminated = lists.some(l => l.terminata);

    if (hasDifferentType || hasTerminated) {
      await transaction.rollback();
      return res.status(400).json({
        result: 'ERROR',
        message: 'Le liste devono avere lo stesso tipo e non essere terminate'
      });
    }

    const detailsResult = await request.query(`
      SELECT idLista, idArea, idGruppoDestinazione, priorita
      FROM ListeAreaDetails
      WHERE idLista IN (${inParams})
    `);

    const details = detailsResult.recordset;
    const uniqueAreas = Array.from(new Set(details.map(d => d.idArea)));
    const groupIds = Array.from(new Set(details.map(d => d.idGruppoDestinazione).filter(v => v !== null)));
    if (groupIds.length > 1) {
      await transaction.rollback();
      return res.status(400).json({
        result: 'ERROR',
        message: 'Gruppo destinazione non omogeneo per le liste selezionate'
      });
    }

    const minPriority = details.length > 0
      ? Math.min(...details.map(d => d.priorita ?? 999999))
      : 1;
    const destinationGroupId = groupIds.length > 0 ? groupIds[0] : null;

    const maxIdResult = await request.query('SELECT ISNULL(MAX(id), 0) as maxId FROM Liste');
    const newId = maxIdResult.recordset[0].maxId + 1;
    const newListNumber = `GRP-${newId}`;

    await request.query(`
      INSERT INTO Liste (
        id,
        numLista,
        descrizione,
        idTipoLista,
        idStatoControlloEvadibilita,
        dataCreazione,
        dataModifica,
        terminata,
        daVerificare,
        prenotazioneIncrementale
      )
      VALUES (
        ${newId},
        '${newListNumber}',
        '${newListNumber}',
        ${baseType},
        1,
        GETDATE(),
        GETDATE(),
        0,
        0,
        0
      )
    `);

    for (const areaId of uniqueAreas) {
      const insertAreaQuery = `
        INSERT INTO ListeAreaDetails (
          idLista,
          idArea,
          idStatoLista,
          idGruppoDestinazione,
          priorita,
          sequenzaLancio
        )
        VALUES (
          @newListId,
          @areaId,
          1,
          @destinationGroupId,
          @priority,
          1
        )
      `;
      const areaRequest = transaction.request();
      areaRequest
        .input('newListId', newId)
        .input('areaId', areaId)
        .input('destinationGroupId', destinationGroupId)
        .input('priority', minPriority);
      await areaRequest.query(insertAreaQuery);
    }

    await request.query(`
      UPDATE RigheLista
      SET idLista = ${newId}
      WHERE idLista IN (${inParams})
    `);

    await request.query(`
      DELETE FROM Prenotazioni
      WHERE idLista IN (${inParams})
    `);

    await request.query(`
      DELETE FROM RigheListaInevadibili
      WHERE idLista IN (${inParams})
    `);

    await request.query(`
      DELETE FROM ListeAreaDetails
      WHERE idLista IN (${inParams})
    `);

    await request.query(`
      DELETE FROM Liste
      WHERE id IN (${inParams})
    `);

    await transaction.commit();

    res.json({
      result: 'OK',
      message: 'Liste accorpate con successo',
      data: {
        newListId: newId,
        newListNumber
      }
    });
  } catch (error) {
    console.error('[/api/lists/merge] Error:', error);
    res.status(500).json({
      result: 'ERROR',
      message: error.message
    });
  }
});

// ============================================================================
// POST /api/lists/:id/unprocessable - Mark list as unprocessable
// ============================================================================
router.post('/:id/unprocessable', async (req, res) => {
  try {
    const pool = await getPool();
    const listId = parseInt(req.params.id);

    const updateQuery = `
      UPDATE Liste
      SET listaNonEvadibile = 1,
          dataModifica = GETDATE()
      WHERE id = @id
    `;

    const result = await pool.request()
      .input('id', listId)
      .query(updateQuery);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        result: 'ERROR',
        message: `Lista con ID ${listId} non trovata`
      });
    }

    res.json({
      result: 'OK',
      message: `Lista ${listId} marcata come non evadibile`
    });
  } catch (error) {
    console.error(`[/api/lists/${req.params.id}/unprocessable] Error:`, error);
    res.status(500).json({
      result: 'ERROR',
      message: error.message
    });
  }
});

// ============================================================================
// POST /api/lists/:id/save-as-template - Save list as template
// ============================================================================
router.post('/:id/save-as-template', async (req, res) => {
  try {
    const pool = await getPool();
    const listId = parseInt(req.params.id);

    const listResult = await pool.request()
      .input('listId', listId)
      .query(`
        SELECT id, descrizione, idTipoLista, idCausaleMovimento
        FROM Liste
        WHERE id = @listId
      `);

    if (listResult.recordset.length === 0) {
      return res.status(404).json({
        result: 'ERROR',
        message: `Lista con ID ${listId} non trovata`
      });
    }

    const list = listResult.recordset[0];
    if (![1, 2].includes(list.idTipoLista)) {
      return res.status(400).json({
        result: 'ERROR',
        message: 'Tipo lista non supportato per il modello'
      });
    }

    const rowsResult = await pool.request()
      .input('listId', listId)
      .query(`
        SELECT idArticolo, lotto, qtaRichiesta, infoEtichetta, flagStampaEtichette, layoutEtichetta
        FROM RigheLista
        WHERE idLista = @listId
      `);

    const maxIdResult = await pool.request()
      .query('SELECT ISNULL(MAX(id), 0) as maxId FROM ListeModelli');
    const templateId = maxIdResult.recordset[0].maxId + 1;
    const templateDescription = `${list.descrizione || 'Modello'} (${listId})`;

    await pool.request()
      .input('templateId', templateId)
      .input('description', templateDescription)
      .input('idTipoLista', list.idTipoLista)
      .input('idCausaleMovimento', list.idCausaleMovimento)
      .query(`
        INSERT INTO ListeModelli (
          id,
          descrizione,
          idTipoLista,
          generazioneEsito,
          idStatoControlloEvadibilita,
          idCausaleMovimento,
          dataCreazione,
          dataModifica,
          dataUltimoUtilizzo
        )
        VALUES (
          @templateId,
          @description,
          @idTipoLista,
          0,
          1,
          @idCausaleMovimento,
          GETDATE(),
          GETDATE(),
          NULL
        )
      `);

    for (const row of rowsResult.recordset) {
      await pool.request()
        .input('templateId', templateId)
        .input('idArticolo', row.idArticolo)
        .input('lotto', row.lotto)
        .input('qta', row.qtaRichiesta)
        .input('infoEtichetta', row.infoEtichetta)
        .input('flagStampaEtichetta', row.flagStampaEtichette)
        .input('layoutEtichetta', row.layoutEtichetta)
        .query(`
          INSERT INTO RigheListaModelli (
            idListaModello,
            idArticolo,
            lotto,
            qta,
            infoEtichetta,
            flagStampaEtichetta,
            layoutEtichetta
          )
          VALUES (
            @templateId,
            @idArticolo,
            @lotto,
            @qta,
            @infoEtichetta,
            @flagStampaEtichetta,
            @layoutEtichetta
          )
        `);
    }

    res.json({
      result: 'OK',
      message: 'Lista salvata come modello',
      data: { templateId }
    });
  } catch (error) {
    console.error(`[/api/lists/${req.params.id}/save-as-template] Error:`, error);
    res.status(500).json({
      result: 'ERROR',
      message: error.message
    });
  }
});

// ============================================================================
// GET /api/lists/:id/logs - Get log events for list
// ============================================================================
router.get('/:id/logs', async (req, res) => {
  try {
    const pool = await getPool();
    const listId = parseInt(req.params.id);

    const result = await pool.request()
      .input('listId', listId)
      .query(`
        SELECT
          id,
          data as timestamp,
          livelloEvento as severity,
          utente as username,
          descrizione as description,
          descrizione2 as details,
          contestoEvento as entityType,
          idLista,
          idRigaLista,
          idPrenotazione,
          idProdotto,
          barcode,
          categoriaLog
        FROM LogEventi
        WHERE idLista = @listId
        ORDER BY id DESC
      `);

    res.json({
      result: 'OK',
      data: result.recordset
    });
  } catch (error) {
    console.error(`[/api/lists/${req.params.id}/logs] Error:`, error);
    res.status(500).json({
      result: 'ERROR',
      message: error.message
    });
  }
});

// ============================================================================
// POST /api/lists/delete-all - DELETE ALL LISTS (DANGEROUS OPERATION)
// ============================================================================
router.post('/delete-all', express.json(), async (req, res) => {
  try {
    const pool = await getPool();
    const { force = false, excludeInProgress = true } = req.query;

    console.log(`[DELETE /api/lists/all] ELIMINA TUTTE LE LISTE - force: ${force}, excludeInProgress: ${excludeInProgress}`);

    // Get all lists
    const listsResult = await pool.request().query(`
      SELECT id, numLista, terminata, idStatoControlloEvadibilita
      FROM Liste
    `);

    const allLists = listsResult.recordset;
    let listsToDelete = allLists;

    // Exclude in-progress lists if requested
    if (excludeInProgress === 'true' || excludeInProgress === true) {
      listsToDelete = allLists.filter(l => l.idStatoControlloEvadibilita !== 2);
    }

    const results = {
      total: allLists.length,
      deleted: 0,
      failed: 0,
      skipped: allLists.length - listsToDelete.length,
      errors: []
    };

    // If force=true, delete all dependencies first
    if (force === 'true' || force === true) {
      console.log('🔥 FORCE MODE: Eliminazione dipendenze...');

      // Delete all dependencies
      try {
        await pool.request().query('DELETE FROM Prenotazioni');
        console.log('✅ Prenotazioni eliminate');
      } catch (err) {
        console.warn('⚠️ Tabella Prenotazioni non esiste o errore:', err.message);
      }

      try {
        await pool.request().query('DELETE FROM LogOperazioni');
        console.log('✅ LogOperazioni eliminate');
      } catch (err) {
        console.warn('⚠️ Tabella LogOperazioni non esiste o errore:', err.message);
      }

      try {
        await pool.request().query('DELETE FROM MissioniTraslo');
        console.log('✅ MissioniTraslo eliminate');
      } catch (err) {
        console.warn('⚠️ Tabella MissioniTraslo non esiste o errore:', err.message);
      }

      try {
        await pool.request().query('DELETE FROM RigheListaInevadibili');
        console.log('✅ RigheListaInevadibili eliminate');
      } catch (err) {
        console.warn('⚠️ Tabella RigheListaInevadibili non esiste o errore:', err.message);
      }

      try {
        await pool.request().query('DELETE FROM ListePTL');
        console.log('✅ ListePTL eliminate');
      } catch (err) {
        console.warn('⚠️ Tabella ListePTL non esiste o errore:', err.message);
      }

      try {
        await pool.request().query('DELETE FROM LocazioniPTL');
        console.log('✅ LocazioniPTL eliminate');
      } catch (err) {
        console.warn('⚠️ Tabella LocazioniPTL non esiste o errore:', err.message);
      }

      // Delete list details (RigheLista)
      try {
        await pool.request().query('DELETE FROM RigheLista');
        console.log('✅ RigheLista eliminate');
      } catch (err) {
        console.warn('⚠️ Tabella RigheLista non esiste o errore:', err.message);
      }

      // Delete list area details
      try {
        await pool.request().query('DELETE FROM ListeAreaDetails');
        console.log('✅ ListeAreaDetails eliminate');
      } catch (err) {
        console.warn('⚠️ Tabella ListeAreaDetails non esiste o errore:', err.message);
      }
    }

    // Delete each list
    for (const lista of listsToDelete) {
      try {
        await pool.request()
          .input('id', lista.id)
          .query('DELETE FROM Liste WHERE id = @id');

        results.deleted++;
        console.log(`✅ Lista ${lista.numLista} (ID: ${lista.id}) eliminata`);
      } catch (err) {
        results.failed++;
        results.errors.push({
          listId: lista.id,
          listNumber: lista.numLista,
          error: err.message
        });
        console.error(`❌ Errore eliminazione lista ${lista.numLista}:`, err.message);
      }
    }

    res.json({
      success: true,
      message: `Eliminazione completata: ${results.deleted}/${results.total} liste eliminate`,
      data: results
    });

  } catch (error) {
    console.error('[DELETE /api/lists/all] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante eliminazione liste',
      message: error.message
    });
  }
});

// ============================================================================
// GET /api/lists/:listNumber - Get single list with rows
// ============================================================================
router.get('/:listNumber', async (req, res) => {
  try {
    const pool = await getPool();
    const { listNumber } = req.params;

    // Get list header
    const headerQuery = `
      SELECT
        L.*,
        LAD.sequenzaLancio,
        LAD.priorita,
        LAD.idArea,
        LAD.idGruppoDestinazione,
        A.descrizione AS nomeArea,
        PTL.gateway,
        PTL.node,
        PTL.port
      FROM Liste L
      LEFT JOIN ListeAreaDetails LAD ON L.id = LAD.idLista
      LEFT JOIN Aree A ON LAD.idArea = A.id
      LEFT JOIN LocazioniPTL PTL ON L.id = PTL.idListaPTL
      WHERE L.numLista = @listNumber
    `;

    const headerResult = await pool.request()
      .input('listNumber', listNumber)
      .query(headerQuery);

    if (headerResult.recordset.length === 0) {
      return res.status(404).json({
        result: 'ERROR',
        message: `Lista ${listNumber} non trovata`
      });
    }

    const row = headerResult.recordset[0];

    // Get list rows
    const rowsQuery = `
      SELECT
        RL.*,
        COALESCE(A.codice, RL.codice) as codiceProdotto,
        COALESCE(A.descrizione, RL.descrizione) as descrizioneProdotto
      FROM RigheLista RL
      LEFT JOIN Articoli A ON RL.idArticolo = A.id
      WHERE RL.idLista = @listId
      ORDER BY RL.numRigaLista
    `;

    const rowsResult = await pool.request()
      .input('listId', row.id)
      .query(rowsQuery);

    const listRows = rowsResult.recordset.map(r => ({
      rowNumber: r.numRigaLista?.toString() || '',
      item: r.codiceProdotto || '',
      lineDescription: r.descrizioneProdotto || '',
      requestedQty: r.qtaRichiesta ?? 0,
      processedQty: r.qtaMovimentata ?? 0,
      lot: r.lotto || null,
      serialNumber: r.matricola || null,
      expiryDate: r.dataScadenza,
      barcodePtl: r.barcodePTL || null,
      rowSequence: r.numRigaLista,
      nonEvadibile: r.nonEvadibile ?? 0,
      rowStatusId: r.idStatoRiga ?? null
    }));

    // Build PTL location string from gateway and node (e.g., "PTL G1N1")
    let locazionePTL = null;
    if (row.gateway && row.node) {
      locazionePTL = `PTL G${row.gateway}N${row.node}`;
    }

    const list = {
      listHeader: {
        id: row.id, // Include database numeric ID
        listNumber: row.numLista || '',
        listDescription: row.descrizione || '',
        listType: row.idTipoLista || 0,
        listStatus: mapDatabaseStatusToAPI(row.idStatoControlloEvadibilita, row.terminata),
        cause: row.idCausaleMovimento ?? null,
        orderNumber: row.rifLista || row.numLista,
        priority: row.priorita ?? 0, // Use real priority from database (0 = default)
        sequenzaLancio: row.sequenzaLancio,
        idArea: row.idArea || null, // Area ID
        idGruppoDestinazione: row.idGruppoDestinazione || null, // Destination group ID
        nomeArea: row.nomeArea || null, // Real area name from Aree table
        locazionePTL: locazionePTL, // Real PTL location from LocazioniPTL table (e.g., "PTL G1N1")
        utente: row.utente || null,
        dataCreazione: row.dataCreazione || null,
        dataModifica: row.dataModifica || null,
        dataLancio: row.dataLancio || null,
        dataInizioEvasione: row.dataInizioEvasione || null,
        dataFineEvasione: row.dataFineEvasione || null,
        numeroRighe: row.numeroRighe ?? 0,
        numeroRigheTerminate: row.numeroRigheTerminate ?? 0,
        numeroRigheNonEvadibili: row.numeroRigheNonEvadibili ?? 0,
        barcode: row.barcode || null,
        idCausaleMovimento: row.idCausaleMovimento ?? null,
        terminata: row.terminata ? 1 : 0
      },
      listRows
    };

    res.json({
      result: 'OK',
      exported: [list]
    });

  } catch (error) {
    console.error(`[/api/lists/${req.params.listNumber}] Error:`, error);
    res.status(500).json({
      result: 'ERROR',
      message: error.message
    });
  }
});

// ============================================================================
// PUT /api/lists/:listNumber/waiting - Set list to WAITING state
// ============================================================================
router.put('/:listNumber/waiting', async (req, res) => {
  try {
    const pool = await getPool();
    const { listNumber } = req.params;

    console.log(`[/api/lists/${listNumber}/waiting] Setting list to WAITING state`);

    // Update list status to WAITING (idStatoControlloEvadibilita = 1)
    const updateQuery = `
      UPDATE Liste
      SET idStatoControlloEvadibilita = 1,
          dataModifica = GETDATE()
      WHERE numLista = @listNumber
    `;

    const result = await pool.request()
      .input('listNumber', listNumber)
      .query(updateQuery);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        result: 'ERROR',
        message: `Lista ${listNumber} non trovata`
      });
    }

    res.json({
      result: 'OK',
      message: `Lista ${listNumber} impostata in attesa`
    });

  } catch (error) {
    console.error(`[/api/lists/${req.params.listNumber}/waiting] Error:`, error);
    res.status(500).json({
      result: 'ERROR',
      message: error.message
    });
  }
});

// ============================================================================
// POST /api/lists/:id/terminate - Terminate list
// ============================================================================
router.post('/:id/terminate', async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;

    console.log(`[/api/lists/${id}/terminate] Terminating list`);

    // Update list as terminated
    const updateQuery = `
      UPDATE Liste
      SET terminata = 1,
          dataFineEvasione = GETDATE(),
          dataModifica = GETDATE()
      WHERE id = @id
    `;

    const result = await pool.request()
      .input('id', parseInt(id))
      .query(updateQuery);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        result: 'ERROR',
        message: `Lista con ID ${id} non trovata`
      });
    }

    await pool.request()
      .input('id', parseInt(id))
      .query(`
        UPDATE ListeAreaDetails
        SET idStatoLista = 3
        WHERE idLista = @id
      `);

    res.json({
      result: 'OK',
      message: `Lista ID ${id} terminata con successo`
    });

  } catch (error) {
    console.error(`[/api/lists/${req.params.id}/terminate] Error:`, error);
    res.status(500).json({
      result: 'ERROR',
      message: error.message
    });
  }
});

// ============================================================================
// PUT /api/lists/:id/book - Book list (Prenota)
// ============================================================================
router.put('/:id/book', async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;

    console.log(`[/api/lists/${id}/book] Booking list`);

    // Update list status to BOOKED (idStatoControlloEvadibilita = 1)
    const updateQuery = `
      UPDATE Liste
      SET idStatoControlloEvadibilita = 1,
          dataModifica = GETDATE()
      WHERE id = @id
    `;

    const result = await pool.request()
      .input('id', parseInt(id))
      .query(updateQuery);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        result: 'ERROR',
        message: `Lista con ID ${id} non trovata`
      });
    }

    res.json({
      result: 'OK',
      message: `Lista ID ${id} prenotata con successo`
    });

  } catch (error) {
    console.error(`[/api/lists/${req.params.id}/book] Error:`, error);
    res.status(500).json({
      result: 'ERROR',
      message: error.message
    });
  }
});

// ============================================================================
// PUT /api/lists/:id/execute - Execute list (Esegui)
// ============================================================================
router.put('/:id/execute', async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;

    console.log(`[/api/lists/${id}/execute] Executing list`);

    // Update list status to IN_PROGRESS (idStatoControlloEvadibilita = 2)
    const updateQuery = `
      UPDATE Liste
      SET idStatoControlloEvadibilita = 2,
          dataInizioEvasione = CASE WHEN dataInizioEvasione IS NULL THEN GETDATE() ELSE dataInizioEvasione END,
          dataModifica = GETDATE()
      WHERE id = @id
    `;

    const result = await pool.request()
      .input('id', parseInt(id))
      .query(updateQuery);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        result: 'ERROR',
        message: `Lista con ID ${id} non trovata`
      });
    }

    await pool.request()
      .input('id', parseInt(id))
      .query(`
        UPDATE ListeAreaDetails
        SET idStatoLista = 2
        WHERE idLista = @id
      `);

    res.json({
      result: 'OK',
      message: `Lista ID ${id} in esecuzione`
    });

  } catch (error) {
    console.error(`[/api/lists/${req.params.id}/execute] Error:`, error);
    res.status(500).json({
      result: 'ERROR',
      message: error.message
    });
  }
});

// ============================================================================
// POST /api/lists/:id/duplicate - Duplicate list
// ============================================================================
router.post('/:id/duplicate', async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;

    console.log(`[/api/lists/${id}/duplicate] Duplicating list`);

    // Get original list
    const getListQuery = `
      SELECT * FROM Liste WHERE id = @id
    `;

    const listResult = await pool.request()
      .input('id', parseInt(id))
      .query(getListQuery);

    if (listResult.recordset.length === 0) {
      return res.status(404).json({
        result: 'ERROR',
        message: `Lista con ID ${id} non trovata`
      });
    }

    const originalList = listResult.recordset[0];

    // Create new list with similar data
    const insertListQuery = `
      INSERT INTO Liste (
        numLista, descrizione, idTipoLista, idStatoControlloEvadibilita,
        rifLista, utente, dataCreazione, dataModifica, terminata, daVerificare, prenotazioneIncrementale
      )
      OUTPUT INSERTED.id
      VALUES (
        @numLista, @descrizione, @idTipoLista, 1,
        @rifLista, @utente, GETDATE(), GETDATE(), 0, 0, 0
      )
    `;

    const newNumLista = originalList.numLista + '_COPY_' + Date.now();

    const insertResult = await pool.request()
      .input('numLista', newNumLista)
      .input('descrizione', originalList.descrizione + ' (Copia)')
      .input('idTipoLista', originalList.idTipoLista)
      .input('rifLista', originalList.rifLista)
      .input('utente', originalList.utente)
      .query(insertListQuery);

    const newListId = insertResult.recordset[0].id;

    // Copy list rows
    const copyRowsQuery = `
      INSERT INTO RigheLista (
        idLista, numeroRiga, idProdotto, quantitaDaProcessare, lotto, matricola
      )
      SELECT
        @newListId, numeroRiga, idProdotto, quantitaDaProcessare, lotto, matricola
      FROM RigheLista
      WHERE idLista = @originalListId
    `;

    await pool.request()
      .input('newListId', newListId)
      .input('originalListId', parseInt(id))
      .query(copyRowsQuery);

    res.json({
      result: 'OK',
      message: `Lista duplicata con successo`,
      newListId: newListId,
      newListNumber: newNumLista
    });

  } catch (error) {
    console.error(`[/api/lists/${req.params.id}/duplicate] Error:`, error);
    res.status(500).json({
      result: 'ERROR',
      message: error.message
    });
  }
});

// ============================================================================
// GET /api/lists/:id/operations/warehouse - Get operations by warehouse
// ============================================================================
router.get('/:id/operations/warehouse', async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;

    console.log(`[/api/lists/${id}/operations/warehouse] Getting warehouse operations`);

    // Get warehouse operations summary
    const query = `
      SELECT
        G.codice AS magazzino,
        COUNT(DISTINCT RL.numeroRiga) AS numeroRighe,
        SUM(RL.quantitaDaProcessare) AS qtaTotale,
        SUM(RL.quantitaProcessata) AS qtaProcessata,
        CASE
          WHEN SUM(RL.quantitaDaProcessare) > 0
          THEN CAST(SUM(RL.quantitaProcessata) * 100.0 / SUM(RL.quantitaDaProcessare) AS INT)
          ELSE 0
        END AS progressoPercentuale
      FROM RigheLista RL
      LEFT JOIN Giacenze G ON RL.idProdotto = G.idProdotto
      WHERE RL.idLista = @id
      GROUP BY G.codice
      ORDER BY G.codice
    `;

    const result = await pool.request()
      .input('id', parseInt(id))
      .query(query);

    res.json({
      result: 'OK',
      data: result.recordset
    });

  } catch (error) {
    console.error(`[/api/lists/${req.params.id}/operations/warehouse] Error:`, error);
    res.status(500).json({
      result: 'ERROR',
      message: error.message
    });
  }
});

// ============================================================================
// GET /api/lists/:id/operations/area - Get operations by area
// ============================================================================
router.get('/:id/operations/area', async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;

    console.log(`[/api/lists/${id}/operations/area] Getting area operations`);

    // Get area operations summary
    const query = `
      SELECT
        A.descrizione AS area,
        LAD.priorita,
        LAD.sequenzaLancio,
        COUNT(DISTINCT RL.numeroRiga) AS numeroRighe,
        SUM(RL.quantitaDaProcessare) AS qtaTotale,
        SUM(RL.quantitaProcessata) AS qtaProcessata,
        CASE
          WHEN SUM(RL.quantitaDaProcessare) > 0
          THEN CAST(SUM(RL.quantitaProcessata) * 100.0 / SUM(RL.quantitaDaProcessare) AS INT)
          ELSE 0
        END AS progressoPercentuale
      FROM RigheLista RL
      LEFT JOIN ListeAreaDetails LAD ON RL.idLista = LAD.idLista
      LEFT JOIN Aree A ON LAD.idArea = A.id
      WHERE RL.idLista = @id
      GROUP BY A.descrizione, LAD.priorita, LAD.sequenzaLancio
      ORDER BY LAD.priorita DESC, A.descrizione
    `;

    const result = await pool.request()
      .input('id', parseInt(id))
      .query(query);

    res.json({
      result: 'OK',
      data: result.recordset
    });

  } catch (error) {
    console.error(`[/api/lists/${req.params.id}/operations/area] Error:`, error);
    res.status(500).json({
      result: 'ERROR',
      message: error.message
    });
  }
});

// ============================================================================
// GET /api/lists/:id/reservations - Get reservations for list
// ============================================================================
router.get('/:id/reservations', async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;

    console.log(`[/api/lists/${id}/reservations] Getting reservations`);

    const query = `
      SELECT
        P.id,
        P.numeroPrenotazione,
        P.quantita,
        P.lotto,
        P.matricola,
        P.dataPrenotazione,
        A.codice AS codiceProdotto,
        A.descrizione AS descrizioneProdotto,
        U.barcode AS barcodeUDC,
        L.codice AS codiceUbicazione,
        SP.descrizione AS statoPrenotazione
      FROM Prenotazioni P
      LEFT JOIN Articoli A ON P.idArticolo = A.id
      LEFT JOIN UDC U ON P.idUDC = U.id
      LEFT JOIN Locazioni L ON U.idLocazione = L.id
      LEFT JOIN StatoPrenotazione SP ON P.idStatoPrenotazione = SP.id
      WHERE P.idLista = @id
      ORDER BY P.numeroPrenotazione
    `;

    const result = await pool.request()
      .input('id', parseInt(id))
      .query(query);

    res.json({
      result: 'OK',
      data: result.recordset
    });

  } catch (error) {
    console.error(`[/api/lists/${req.params.id}/reservations] Error:`, error);
    res.status(500).json({
      result: 'ERROR',
      message: error.message
    });
  }
});

// ============================================================================
// GET /api/lists/:id/movements - Get movements for list
// ============================================================================
router.get('/:id/movements', async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;

    console.log(`[/api/lists/${id}/movements] Getting movements`);

    const query = `
      SELECT
        M.id,
        M.numeroMovimento,
        M.quantita,
        M.lotto,
        M.dataMovimento,
        A.codice AS codiceProdotto,
        A.descrizione AS descrizioneProdotto,
        LDa.codice AS daUbicazione,
        LA.codice AS aUbicazione,
        TM.descrizione AS tipoMovimento
      FROM MovimentiMagazzino M
      LEFT JOIN Articoli A ON M.idArticolo = A.id
      LEFT JOIN Locazioni LDa ON M.idLocazioneDa = LDa.id
      LEFT JOIN Locazioni LA ON M.idLocazioneA = LA.id
      LEFT JOIN TipoMovimento TM ON M.idTipoMovimento = TM.id
      WHERE M.idLista = @id
      ORDER BY M.dataMovimento DESC
    `;

    const result = await pool.request()
      .input('id', parseInt(id))
      .query(query);

    res.json({
      result: 'OK',
      data: result.recordset
    });

  } catch (error) {
    console.error(`[/api/lists/${req.params.id}/movements] Error:`, error);
    res.status(500).json({
      result: 'ERROR',
      message: error.message
    });
  }
});

// ============================================================================
// POST /api/item-lists - Create new list with explicit ID
// ============================================================================
router.post('/item-lists', express.json(), async (req, res) => {
  try {
    const pool = await getPool();

    console.log('[POST /api/item-lists] Headers:', req.headers);
    console.log('[POST /api/item-lists] Raw body:', req.body);
    console.log('[POST /api/item-lists] Body type:', typeof req.body);

    const {
      id,
      listNumber,
      description,
      tipoLista,
      stato = 1, // Default: WAITING
      priority = 1,
      areaId = 1 // Default area
    } = req.body;

    console.log('[POST /api/item-lists] Request body parsed:', JSON.stringify(req.body, null, 2));
    console.log('[POST /api/item-lists] tipoLista value:', tipoLista, 'type:', typeof tipoLista);
    console.log('[POST /api/item-lists] areaId value:', areaId, 'type:', typeof areaId);

    // Validate required fields
    if (tipoLista === undefined || tipoLista === null) {
      console.error('[POST /api/item-lists] Missing tipoLista!');
      return res.status(400).json({
        success: false,
        result: 'ERROR',
        message: 'tipoLista è un campo obbligatorio'
      });
    }

    // Generate listNumber with prefix based on type
    let numLista = listNumber;
    if (!numLista) {
      // Get max number for this list type
      const prefixMap = {
        1: 'PICK',    // Picking
        2: 'REF',     // Refilling/Stoccaggio
        3: 'INV',     // Inventario
        4: 'TRA',     // Trasferimento
        5: 'RET',     // Rettifica
        6: 'PRO',     // Produzione
      };

      const prefix = prefixMap[tipoLista] || 'LST';

      // Get max number for lists with this prefix
      const maxNumQuery = `
        SELECT TOP 1 numLista
        FROM Liste
        WHERE numLista LIKE @prefix + '%'
        ORDER BY numLista DESC
      `;

      const maxResult = await pool.request()
        .input('prefix', prefix)
        .query(maxNumQuery);

      let nextNum = 1;
      if (maxResult.recordset.length > 0) {
        const lastNum = maxResult.recordset[0].numLista;
        // Extract number from format like "PICK0001"
        const match = lastNum.match(/\d+$/);
        if (match) {
          nextNum = parseInt(match[0]) + 1;
        }
      }

      // Format: PICK0001, REF0001, etc.
      numLista = `${prefix}${String(nextNum).padStart(4, '0')}`;
    }

    // Use provided ID or generate a new one
    let finalId = id;
    if (!finalId) {
      // Get max ID from Liste table and add 1
      const maxIdQuery = 'SELECT ISNULL(MAX(id), 0) as maxId FROM Liste';
      const maxIdResult = await pool.request().query(maxIdQuery);
      finalId = maxIdResult.recordset[0].maxId + 1;
    }

    console.log(`[POST /api/item-lists] Using ID: ${finalId}, numLista: ${numLista}`);

    // Insert into Liste table with explicit ID
    const insertQuery = `
      INSERT INTO Liste (
        id,
        numLista,
        descrizione,
        idTipoLista,
        idStatoControlloEvadibilita,
        dataCreazione,
        dataModifica,
        terminata,
        daVerificare,
        prenotazioneIncrementale
      )
      VALUES (
        @id,
        @numLista,
        @descrizione,
        @idTipoLista,
        @stato,
        GETDATE(),
        GETDATE(),
        0,
        0,
        0
      )
    `;

    await pool.request()
      .input('id', finalId)
      .input('numLista', numLista)
      .input('descrizione', description || numLista)
      .input('idTipoLista', tipoLista)
      .input('stato', stato)
      .query(insertQuery);

    // Insert into ListeAreaDetails if areaId provided
    if (areaId) {
      const insertAreaQuery = `
        INSERT INTO ListeAreaDetails (
          idLista,
          idArea,
          priorita,
          sequenzaLancio
        )
        VALUES (
          @idLista,
          @idArea,
          @priorita,
          1
        )
      `;

      await pool.request()
        .input('idLista', finalId)
        .input('idArea', areaId)
        .input('priorita', priority)
        .query(insertAreaQuery);
    }

    console.log(`[POST /api/item-lists] List created successfully with ID ${finalId}`);

    res.status(201).json({
      success: true,
      result: 'OK',
      message: 'Lista creata con successo',
      data: {
        id: finalId,
        listNumber: numLista,
        description: description || numLista,
        type: tipoLista,
        status: stato
      }
    });

  } catch (error) {
    console.error('[POST /api/item-lists] Error:', error);

    // Check if it's a SQL constraint error
    if (error.message && error.message.includes('NULL')) {
      res.status(500).json({
        success: false,
        result: 'ERROR',
        message: 'Errore durante la creazione',
        error: error.message,
        details: 'Verificare che tutti i campi obbligatori siano presenti'
      });
    } else {
      res.status(500).json({
        success: false,
        result: 'ERROR',
        message: 'Errore durante la creazione della lista',
        error: error.message
      });
    }
  }
});

// ============================================================================
// POST /api/item-lists/:listId/rows - Add row to list
// ============================================================================
router.post('/item-lists/:listId/rows', [
  param('listId').isInt().toInt(),
  body('itemCode').notEmpty().isString(),
  body('itemDescription').optional().isString(),
  body('requestedQuantity').isInt({ min: 1 }).toInt(),
  body('lot').optional().isString(),
  body('serialNumber').optional().isString(),
  body('expirationDate').optional().isISO8601()
], async (req, res) => {
  try {
    const pool = await getPool();
    const { listId } = req.params;
    const {
      itemCode,
      itemDescription,
      requestedQuantity,
      lot,
      serialNumber,
      expirationDate
    } = req.body;

    console.log(`[POST /api/item-lists/${listId}/rows] Adding row with itemCode: ${itemCode}`);

    // Get item ID from Prodotti/Articoli table
    const itemQuery = `
      SELECT TOP 1 id, descrizione
      FROM Prodotti
      WHERE codice = @itemCode
    `;

    const itemResult = await pool.request()
      .input('itemCode', itemCode)
      .query(itemQuery);

    if (itemResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        result: 'ERROR',
        message: `Articolo ${itemCode} non trovato`
      });
    }

    const item = itemResult.recordset[0];
    const idProdotto = item.id;

    // Get next row number for this list
    const maxRowQuery = `
      SELECT ISNULL(MAX(numRigaLista), 0) as maxRow
      FROM RigheLista
      WHERE idLista = @listId
    `;

    const maxRowResult = await pool.request()
      .input('listId', parseInt(listId))
      .query(maxRowQuery);

    const nextRowNumber = maxRowResult.recordset[0].maxRow + 1;

    // Insert row into RigheLista
    const insertRowQuery = `
      INSERT INTO RigheLista (
        idLista,
        numRigaLista,
        idProdotto,
        codice,
        descrizione,
        qtaRichiesta,
        qtaMovimentata,
        qtaPrenotata,
        lotto,
        matricola,
        dataCreazione,
        terminata,
        nonEvadibile
      )
      OUTPUT INSERTED.id
      VALUES (
        @idLista,
        @numRigaLista,
        @idProdotto,
        @codice,
        @descrizione,
        @qtaRichiesta,
        0,
        0,
        @lotto,
        @matricola,
        GETDATE(),
        0,
        0
      )
    `;

    const insertResult = await pool.request()
      .input('idLista', parseInt(listId))
      .input('numRigaLista', nextRowNumber)
      .input('idProdotto', idProdotto)
      .input('codice', itemCode)
      .input('descrizione', itemDescription || item.descrizione)
      .input('qtaRichiesta', requestedQuantity)
      .input('lotto', lot || null)
      .input('matricola', serialNumber || null)
      .query(insertRowQuery);

    const newRowId = insertResult.recordset[0].id;

    console.log(`[POST /api/item-lists/${listId}/rows] Row added successfully with ID ${newRowId}`);

    res.status(201).json({
      success: true,
      result: 'OK',
      message: 'Riga aggiunta con successo',
      data: {
        id: newRowId,
        rowNumber: nextRowNumber,
        itemCode,
        itemDescription: itemDescription || item.descrizione,
        requestedQuantity,
        lot,
        serialNumber
      }
    });

  } catch (error) {
    console.error(`[POST /api/item-lists/${req.params.listId}/rows] Error:`, error);
    res.status(500).json({
      success: false,
      result: 'ERROR',
      message: 'Errore durante l\'aggiunta della riga',
      error: error.message
    });
  }
});

// ============================================================================
// POST /api/item-lists/:id/reserve - Reserve list for operator
// ============================================================================
router.post('/:id/reserve', [
  param('id').isInt().toInt(),
  body('operatorId').notEmpty(),
  body('notes').optional().isString()
], async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;
    const { operatorId, notes } = req.body;

    console.log(`[/api/item-lists/${id}/reserve] Reserving list for operator ${operatorId}`);

    // Check if list exists
    const checkQuery = 'SELECT id, numLista, idStatoControlloEvadibilita FROM Liste WHERE id = @id';
    const checkResult = await pool.request()
      .input('id', id)
      .query(checkQuery);

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Lista con ID ${id} non trovata`
      });
    }

    const list = checkResult.recordset[0];

    // Reserve list by updating operator assignment
    const updateQuery = `
      UPDATE Liste
      SET idOperatore = @operatorId,
          dataPrenotazione = GETDATE(),
          notePrenotazione = @notes,
          dataModifica = GETDATE()
      WHERE id = @id
    `;

    await pool.request()
      .input('id', id)
      .input('operatorId', operatorId)
      .input('notes', notes || null)
      .query(updateQuery);

    res.json({
      success: true,
      message: `Lista ${list.numLista} prenotata per operatore ${operatorId}`
    });

  } catch (error) {
    console.error(`[/api/item-lists/${req.params.id}/reserve] Error:`, error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================================================
// POST /api/item-lists/:id/rereserve - Reassign list to another operator
// ============================================================================
router.post('/:id/rereserve', [
  param('id').isInt().toInt(),
  body('previousOperatorId').notEmpty(),
  body('newOperatorId').notEmpty(),
  body('reason').optional().isString(),
  body('notes').optional().isString()
], async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;
    const { previousOperatorId, newOperatorId, reason, notes } = req.body;

    console.log(`[/api/item-lists/${id}/rereserve] Reassigning from ${previousOperatorId} to ${newOperatorId}`);

    // Check if list exists and is assigned to previous operator
    const checkQuery = `
      SELECT id, numLista, idOperatore, idStatoControlloEvadibilita
      FROM Liste
      WHERE id = @id
    `;
    const checkResult = await pool.request()
      .input('id', id)
      .query(checkQuery);

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Lista con ID ${id} non trovata`
      });
    }

    const list = checkResult.recordset[0];

    // Validation: check if current operator matches
    if (list.idOperatore && list.idOperatore !== previousOperatorId) {
      return res.status(400).json({
        success: false,
        message: `Lista ${list.numLista} non è assegnata all'operatore ${previousOperatorId}`
      });
    }

    // Reassign list to new operator
    const updateQuery = `
      UPDATE Liste
      SET idOperatore = @newOperatorId,
          dataPrenotazione = GETDATE(),
          motivoRiassegnazione = @reason,
          noteRiassegnazione = @notes,
          operatorePrecedente = @previousOperatorId,
          dataModifica = GETDATE()
      WHERE id = @id
    `;

    await pool.request()
      .input('id', id)
      .input('newOperatorId', newOperatorId)
      .input('previousOperatorId', previousOperatorId)
      .input('reason', reason || null)
      .input('notes', notes || null)
      .query(updateQuery);

    res.json({
      success: true,
      message: `Lista ${list.numLista} riassegnata da ${previousOperatorId} a ${newOperatorId}`
    });

  } catch (error) {
    console.error(`[/api/item-lists/${req.params.id}/rereserve] Error:`, error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================================================
// POST /api/item-lists/:id/waiting - Set list to waiting state
// ============================================================================
router.post('/:id/waiting', [
  param('id').isInt().toInt(),
  body('reason').notEmpty().isString(),
  body('notes').optional().isString(),
  body('estimatedWaitTimeMinutes').optional().isInt()
], async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;
    const { reason, notes, estimatedWaitTimeMinutes } = req.body;

    console.log(`[/api/item-lists/${id}/waiting] Setting to waiting state`);

    // Check if list exists
    const checkQuery = 'SELECT id, numLista FROM Liste WHERE id = @id';
    const checkResult = await pool.request()
      .input('id', id)
      .query(checkQuery);

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Lista con ID ${id} non trovata`
      });
    }

    const list = checkResult.recordset[0];

    // Set list to WAITING state (idStatoControlloEvadibilita = 1)
    const updateQuery = `
      UPDATE Liste
      SET idStatoControlloEvadibilita = 1,
          motivoAttesa = @reason,
          noteAttesa = @notes,
          tempoAttesoMinuti = @estimatedTime,
          dataInizioAttesa = GETDATE(),
          dataModifica = GETDATE()
      WHERE id = @id
    `;

    await pool.request()
      .input('id', id)
      .input('reason', reason)
      .input('notes', notes || null)
      .input('estimatedTime', estimatedWaitTimeMinutes || null)
      .query(updateQuery);

    res.json({
      success: true,
      message: `Lista ${list.numLista} impostata in attesa`
    });

  } catch (error) {
    console.error(`[/api/item-lists/${req.params.id}/waiting] Error:`, error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================================================
// Helper function - Map database status to API status
// ============================================================================
function mapDatabaseStatusToAPI(idStatoControlloEvadibilita, terminata) {
  // StatoLista table has:
  // 1 = In Attesa (WAITING)
  // 2 = In Esecuzione (IN_PROGRESS)
  // 3 = Completata (COMPLETED)

  if (terminata) {
    return 3; // COMPLETED
  }

  switch (idStatoControlloEvadibilita) {
    case 1:
      return 1; // WAITING
    case 2:
      return 2; // IN_PROGRESS
    case 3:
      return 3; // COMPLETED
    default:
      return 1; // Default to WAITING
  }
}

export default router;

