/**
 * Item Lists Routes
 * Read-only endpoints per liste (Picking, Spedizione, ecc.)
 * Schema reale database SQL Server - EjLog WMS
 */

import express from 'express';
import { asyncHandler } from '../middleware/error-handler.js';
import { validateId, validatePagination } from '../middleware/validator.js';
import { body, param } from 'express-validator';
import { getPool } from '../db-config.js';
import {
  getItemLists,
  getItemListById,
  getItemListItems,
  getItemListsStats
} from '../controllers/item-lists.controller.js';

const router = express.Router();

// GET /api/item-lists/next-number/:type - Prossimo numero lista per tipo
router.get('/next-number/:type', async (req, res) => {
  try {
    const pool = await getPool();
    const { type } = req.params; // 0=Picking, 2=Refilling, 4=Inventario

    const typePrefix = {
      '0': 'PICK',
      '1': 'STO',
      '2': 'REF',
      '3': 'VIS',
      '4': 'INV',
      '5': 'PRO',
    };

    const prefix = typePrefix[type] || 'LST';

    // Get max ID globale (indipendente dal tipo)
    // Per PICKING: PICK + ultimo numero lista inserito (di qualsiasi tipo) + 1
    // Per REFILLING: REF + ultimo numero lista inserito (di qualsiasi tipo) + 1
    // Per INVENTARIO: INV + ultimo numero lista inserito (di qualsiasi tipo) + 1
    const query = `
      SELECT ISNULL(MAX(id), 0) AS maxId
      FROM Liste
    `;

    const result = await pool.request()
      .query(query);

    const nextId = result.recordset[0].maxId + 1;
    const nextNumber = `${prefix}${nextId}`;

    res.json({
      success: true,
      data: {
        nextId,
        nextNumber,
        prefix
      }
    });

  } catch (error) {
    console.error(`[GET /api/item-lists/next-number/${req.params.type}] Error:`, error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/item-lists/stats - Statistiche aggregate
router.get('/stats',
  asyncHandler(getItemListsStats)
);

// GET /api/item-lists - Lista liste con filtri
router.get('/',
  validatePagination,
  asyncHandler(getItemLists)
);

// GET /api/item-lists/:code/num - Dettaglio lista per numero
router.get('/:code/num', async (req, res) => {
  try {
    const pool = await getPool();
    const { code } = req.params;

    const result = await pool.request()
      .input('code', code)
      .query(`
        SELECT
          l.id,
          l.numLista AS listNumber,
          l.rifLista AS listReference,
          l.barcode,
          l.idTipoLista AS listType,
          l.idStatoControlloEvadibilita AS listStatusId,
          l.dataCreazione AS createdAt,
          l.dataLancio AS launchedAt,
          l.dataInizioEvasione AS startedAt,
          l.dataFineEvasione AS completedAt,
          CAST(l.terminata AS bit) AS completed,
          CAST(l.listaNonEvadibile AS bit) AS unfulfillable,
          l.numeroRighe AS totalRows,
          l.numeroRigheTerminate AS completedRows,
          l.numeroRigheIniziate AS startedRows,
          l.numeroRigheNonEvadibili AS unfulfillableRows,
          lad.priorita AS priority
        FROM Liste l
        LEFT JOIN ListeAreaDetails lad ON l.id = lad.idLista
        WHERE l.numLista = @code
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Lista ${code} non trovata`
      });
    }

    res.json({ success: true, data: result.recordset[0] });
  } catch (error) {
    console.error(`[GET /api/item-lists/${req.params.code}/num] Error:`, error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/item-lists/:id - Dettaglio lista
router.get('/:id',
  validateId('id'),
  asyncHandler(getItemListById)
);

// GET /api/item-lists/:id/items - Righe della lista
router.get('/:id/items',
  validateId('id'),
  validatePagination,
  asyncHandler(getItemListItems)
);

// PUT /api/item-lists/:id - Update list description/priority
router.put('/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;
    const description = req.body?.description ?? req.query?.description;
    const priority = req.body?.priority ?? req.query?.priority;

    if (description === undefined && priority === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Nessun campo da aggiornare (description, priority)'
      });
    }

    if (description !== undefined) {
      await pool.request()
        .input('id', parseInt(id))
        .input('description', description)
        .query(`
          UPDATE Liste
          SET descrizione = @description,
              rifLista = @description,
              dataModifica = GETDATE()
          WHERE id = @id
        `);
    }

    if (priority !== undefined) {
      await pool.request()
        .input('id', parseInt(id))
        .input('priority', parseInt(priority))
        .query(`
          UPDATE ListeAreaDetails
          SET priorita = @priority
          WHERE idLista = @id
        `);
    }

    res.json({
      success: true,
      message: `Lista ${id} aggiornata con successo`
    });
  } catch (error) {
    console.error(`[PUT /api/item-lists/${req.params.id}] Error:`, error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================================================
// POST /api/item-lists - Create new list
// ============================================================================
router.post('/', async (req, res) => {
  try {
    const pool = await getPool();
    // FIXED: Read from req.body instead of req.query (frontend sends data in body)
    // Support both 'description' and 'listReference' field names
    const { description, listReference, tipoLista, priority, areaId, causale, stato, destinationGroupId, machineIds } = req.body;
    const finalDescription = listReference || description || '';
    const magazziniCoinvolti = Array.isArray(machineIds) && machineIds.length > 0
      ? `;${machineIds
          .map((id) => parseInt(id, 10))
          .filter((id) => Number.isFinite(id))
          .join(';')};`
      : null;

    // Get valid stato from StatoControlloEvadibilita table (default to first available if not provided)
    let statoValue = stato !== undefined ? parseInt(stato) : null;

    if (statoValue === null || statoValue === 0) {
      // Query first valid state from StatoControlloEvadibilita
      const validStateQuery = 'SELECT TOP 1 id FROM StatoControlloEvadibilita ORDER BY id';
      const validStateResult = await pool.request().query(validStateQuery);
      statoValue = validStateResult.recordset.length > 0 ? validStateResult.recordset[0].id : 1;
    }

    console.log('[POST /api/item-lists] Creating new list:', { description: finalDescription, tipoLista, priority, areaId, causale, stato: statoValue });

    // Validate required fields
    if (tipoLista === undefined || !areaId) {
      return res.status(400).json({
        success: false,
        message: 'tipoLista e areaId sono campi obbligatori'
      });
    }

    // Generate list number based on type
    const listTypePrefix = {
      '0': 'PIC',  // Picking
      '1': 'STO',  // Stoccaggio
      '2': 'REF',  // Refill/Inventario
      '3': 'VIS',  // Visita
      '4': 'RET',  // Rettifica
      '5': 'PRO',  // Produzione
    };

    const prefix = listTypePrefix[tipoLista] || 'LST';

    // Get next available ID
    const getNextIdQuery = `SELECT ISNULL(MAX(id), 0) + 1 AS nextId FROM Liste`;
    const nextIdResult = await pool.request().query(getNextIdQuery);
    const nextId = nextIdResult.recordset[0].nextId;

    // Insert new list in Liste table with explicit ID
    const insertQuery = `
      INSERT INTO Liste (
        id, numLista, rifLista, idTipoLista, idStatoControlloEvadibilita,
        idCausaleMovimento, magazziniCoinvolti, utente, dataCreazione, dataModifica,
        terminata, daVerificare, prenotazioneIncrementale, prenotazioneDettagliata, recordCancellato
      )
      VALUES (
        @id, '', @description, @tipoLista, @stato,
        @causale, @magazziniCoinvolti, 'superuser', GETDATE(), GETDATE(),
        0, 0, 0, 0, 0
      )
    `;

    await pool.request()
      .input('id', nextId)
      .input('description', finalDescription)
      .input('tipoLista', parseInt(tipoLista))
      .input('stato', statoValue)
      .input('causale', causale ? parseInt(causale) : null)
      .input('magazziniCoinvolti', magazziniCoinvolti)
      .query(insertQuery);

    // Get the inserted list
    const selectQuery = `
      SELECT id, numLista, rifLista, idTipoLista
      FROM Liste
      WHERE id = @id
    `;

    const selectResult = await pool.request()
      .input('id', nextId)
      .query(selectQuery);
    const newList = selectResult.recordset[0];
    const listNumber = `${prefix}${newList.id}`;

    // Update numLista with generated number
    const updateQuery = `
      UPDATE Liste
      SET numLista = @numLista,
          rifLista = @rifLista
      WHERE id = @id
    `;

    await pool.request()
      .input('id', newList.id)
      .input('numLista', listNumber)
      .input('rifLista', finalDescription || listNumber)
      .query(updateQuery);

    // Use provided destination group (optional)
    const finalDestGroupId = destinationGroupId ? parseInt(destinationGroupId) : null;

    // Insert into ListeAreaDetails (area, priority, sequence)
    const statoListaValue = 1;
    const insertAreaDetailsQuery = `
      INSERT INTO ListeAreaDetails (
        idLista, idArea, idStatoLista, idGruppoDestinazione, priorita, sequenzaLancio,
        numeroPrenotazioniConfermate, numeroPrenotazioniResidue, prenotazioneBloccata
      )
      VALUES (
        @listId, @areaId, @statoLista, @destGroupId, @priority, @listId,
        0, 0, 0
      )
    `;

    await pool.request()
      .input('listId', newList.id)
      .input('areaId', parseInt(areaId))
      .input('priority', parseInt(priority) || 1)
      .input('statoLista', statoListaValue)
      .input('destGroupId', finalDestGroupId)
      .query(insertAreaDetailsQuery);

    console.log(`[POST /api/item-lists] Created list: ${listNumber} (ID: ${newList.id})`);

    res.status(201).json({
      success: true,
      data: {
        id: newList.id,
        listNumber: listNumber,
        listReference: finalDescription || listNumber,
        listType: newList.idTipoLista
      }
    });

  } catch (error) {
    console.error('[POST /api/item-lists] Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================================================
// POST /api/item-lists/:id/rows - Add row to list
// ============================================================================
router.post('/:id/rows', async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;
    const { itemCode, itemDescription, requestedQuantity, lot, serialNumber, expirationDate } = req.body;

    console.log(`[POST /api/item-lists/${id}/rows] Adding row:`, { itemCode, requestedQuantity });

    // Validate required fields
    if (!itemCode || !requestedQuantity) {
      return res.status(400).json({
        success: false,
        message: 'itemCode e requestedQuantity sono campi obbligatori'
      });
    }

    // Get complete item details from Articoli table
    const itemQuery = `
      SELECT
        id, codice, descrizione, descrizione2, um, barcode,
        peso, larghezza, altezza, profondita,
        idCategoriaArticoloGestione, idTipoGestioneLotto, idTipoGestioneMatricola,
        qtaStandard, numeroDecimali, ggScadenza, ggEquivalenzaFIFO
      FROM Articoli
      WHERE codice = @itemCode
    `;
    const itemResult = await pool.request()
      .input('itemCode', itemCode)
      .query(itemQuery);

    if (itemResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Articolo ${itemCode} non trovato`
      });
    }

    const item = itemResult.recordset[0];

    // Get list type to populate idTipoLista in RigheLista
    const listQuery = 'SELECT idTipoLista FROM Liste WHERE id = @listId';
    const listResult = await pool.request()
      .input('listId', parseInt(id))
      .query(listQuery);

    const listType = listResult.recordset.length > 0 ? listResult.recordset[0].idTipoLista : 0;

    // Insert row into RigheLista with ALL article fields
    // Calcola nuovo ID riga (tabella non ha identity)
    const nextRowIdQuery = 'SELECT ISNULL(MAX(id), 0) + 1 AS nextId FROM RigheLista';
    const nextRowIdResult = await pool.request().query(nextRowIdQuery);
    const nextRowId = nextRowIdResult.recordset[0].nextId;

    const insertQuery = `
      DECLARE @newId INT;
      INSERT INTO RigheLista (
        id, idLista, idTipoLista, idProdotto, idArticolo, codice, descrizione,
        numRigaLista, idStatoRiga, lotto, matricola,
        qtaRichiesta, qtaMovimentata, qtaPrenotata,
        dataScadenzaMin, dataScadenzaMax,
        dataCreazione, terminata, nonEvadibile,
        barcode, sequenza, recordCancellato,
        richiestaVuoti, permanente, numeroPrenotazioniConfermate, numeroPrenotazioniResidue
      )
      VALUES (
        @rowId, @listId, @listType, @itemId, @itemId, @itemCode, @itemDescription,
        @rowNumber, 1, @lot, @serialNumber,
        @quantity, 0, 0,
        @expirationDate, @expirationDate,
        GETDATE(), 0, 0,
        @barcode, @rowNumber, 0,
        0, 0, 0, 0
      );
      SET @newId = @rowId;
      SELECT @newId AS id;
    `;

    // Get next row number for this list
    const maxRowQuery = 'SELECT ISNULL(MAX(CAST(numRigaLista AS INT)), 0) + 1 AS nextRow FROM RigheLista WHERE idLista = @listId';
    const maxRowResult = await pool.request()
      .input('listId', parseInt(id))
      .query(maxRowQuery);
    const nextRowNumber = maxRowResult.recordset[0].nextRow;

    const insertResult = await pool.request()
      .input('rowId', nextRowId)
      .input('listId', parseInt(id))
      .input('listType', listType)
      .input('itemId', item.id)
      .input('itemCode', item.codice)
      .input('itemDescription', itemDescription || item.descrizione)
      .input('rowNumber', nextRowNumber.toString())
      .input('quantity', parseFloat(requestedQuantity))
      .input('lot', lot || '*')
      .input('serialNumber', serialNumber || '*')
      .input('expirationDate', expirationDate || null)
      .input('barcode', item.barcode || null)
      .query(insertQuery);

    const rowId = insertResult.recordset?.[0]?.id || null;

    await pool.request()
      .input('listId', parseInt(id))
      .query(`
        UPDATE Liste
        SET numeroRighe = (
          SELECT COUNT(*)
          FROM RigheLista
          WHERE idLista = @listId
            AND (recordCancellato = 0 OR recordCancellato IS NULL)
        ),
        dataModifica = GETDATE()
        WHERE id = @listId
      `);

    console.log(`[POST /api/item-lists/${id}/rows] Added row ID: ${rowId} for item ${item.codice}`);

    res.status(201).json({
      success: true,
      message: 'Riga aggiunta con successo',
      data: {
        id: rowId,
        rowNumber: nextRowNumber,
        listId: parseInt(id),
        itemId: item.id,
        itemCode: item.codice,
        itemDescription: itemDescription || item.descrizione,
        barcode: item.barcode,
        requestedQuantity: parseFloat(requestedQuantity),
        lot: lot || '*',
        serialNumber: serialNumber || '*',
        expirationDate: expirationDate
      }
    });

  } catch (error) {
    console.error(`[POST /api/item-lists/${req.params.id}/rows] Error:`, error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST /api/item-lists/:id/reserve - Reserve list for operator
router.post('/:id/reserve', async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;
    const { operatorId, notes } = req.body;

    if (!operatorId) {
      return res.status(400).json({
        success: false,
        message: 'operatorId è obbligatorio'
      });
    }

    const idParam = String(id);
    const checkQuery = /^\d+$/.test(idParam)
      ? 'SELECT id, numLista, utente FROM Liste WHERE id = @id'
      : 'SELECT id, numLista, utente FROM Liste WHERE numLista = @code';

    const checkRequest = pool.request();
    if (/^\d+$/.test(idParam)) {
      checkRequest.input('id', parseInt(idParam));
    } else {
      checkRequest.input('code', idParam);
    }

    const checkResult = await checkRequest.query(checkQuery);
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Lista ${id} non trovata`
      });
    }

    const list = checkResult.recordset[0];

    await pool.request()
      .input('id', list.id)
      .input('operatorId', operatorId)
      .query(`
        UPDATE Liste
        SET utente = @operatorId,
            dataModifica = GETDATE()
        WHERE id = @id
      `);

    res.json({
      success: true,
      message: `Lista ${list.numLista} prenotata per operatore ${operatorId}`
    });
  } catch (error) {
    console.error(`[POST /api/item-lists/${req.params.id}/reserve] Error:`, error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST /api/item-lists/:id/rereserve - Reassign list to another operator
router.post('/:id/rereserve', async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;
    const { previousOperatorId, newOperatorId, reason, notes } = req.body;

    if (!previousOperatorId || !newOperatorId) {
      return res.status(400).json({
        success: false,
        message: 'previousOperatorId e newOperatorId sono obbligatori'
      });
    }

    const idParam = String(id);
    const checkQuery = /^\d+$/.test(idParam)
      ? 'SELECT id, numLista, utente FROM Liste WHERE id = @id'
      : 'SELECT id, numLista, utente FROM Liste WHERE numLista = @code';

    const checkRequest = pool.request();
    if (/^\d+$/.test(idParam)) {
      checkRequest.input('id', parseInt(idParam));
    } else {
      checkRequest.input('code', idParam);
    }

    const checkResult = await checkRequest.query(checkQuery);
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Lista ${id} non trovata`
      });
    }

    const list = checkResult.recordset[0];
    if (list.utente && list.utente !== previousOperatorId) {
      return res.status(400).json({
        success: false,
        message: `Lista ${list.numLista} non è assegnata all'operatore ${previousOperatorId}`
      });
    }

    await pool.request()
      .input('id', list.id)
      .input('newOperatorId', newOperatorId)
      .query(`
        UPDATE Liste
        SET utente = @newOperatorId,
            dataModifica = GETDATE()
        WHERE id = @id
      `);

    res.json({
      success: true,
      message: `Lista ${list.numLista} riassegnata da ${previousOperatorId} a ${newOperatorId}`
    });
  } catch (error) {
    console.error(`[POST /api/item-lists/${req.params.id}/rereserve] Error:`, error);
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

  console.log(`[POST /api/item-lists/${id}/waiting] Setting list to waiting state with reason: "${reason}"`);

  // Check if list exists
  const checkQuery = 'SELECT id, numLista FROM Liste WHERE id = @id';
    const checkResult = await pool.request()
      .input('id', id)
      .query(checkQuery);

    if (checkResult.recordset.length === 0) {
      console.log(`[POST /api/item-lists/${id}/waiting] Lista non trovata`);
      return res.status(404).json({
        success: false,
        message: `Lista con ID ${id} non trovata`
      });
    }

    const list = checkResult.recordset[0];
  console.log(`[POST /api/item-lists/${id}/waiting] Found list: ${list.numLista}`);

  // Set list to WAITING state (idStatoControlloEvadibilita = 1)
  const updateQuery = `
      UPDATE Liste
      SET idStatoControlloEvadibilita = 1,
          dataModifica = GETDATE()
      WHERE id = @id
    `;

  const updateResult = await pool.request()
    .input('id', id)
    .query(updateQuery);

  await pool.request()
    .input('id', id)
    .query(`
      UPDATE ListeAreaDetails
      SET idStatoLista = 1
      WHERE idLista = @id
    `);

    console.log(`[POST /api/item-lists/${id}/waiting] Successfully updated list to waiting state. Rows affected: ${updateResult.rowsAffected[0]}`);

    res.json({
      success: true,
      message: `Lista ${list.numLista} impostata in attesa con motivazione: ${reason}`
    });

  } catch (error) {
    console.error(`[POST /api/item-lists/${req.params.id}/waiting] Error:`, error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
