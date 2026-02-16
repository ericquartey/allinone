// ============================================================================
// EJLOG WMS - Operations API Routes
// REST API for Mission Operations with REAL database data
// ============================================================================

import express from 'express';
import { getPool } from '../db-config.js';
import { body, param, query, validationResult } from 'express-validator';

const router = express.Router();

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation errors',
      details: errors.array()
    });
  }
  next();
};

// ============================================================================
// GET /api/operations - Lista operazioni con filtri
// ============================================================================
router.get('/', [
  query('machineId').optional().isInt().toInt(),
  query('status').optional().isInt().toInt(),
  query('itemListId').optional().isInt().toInt(),
  query('fromDate').optional().isISO8601(),
  query('toDate').optional().isISO8601(),
  query('limit').optional().isInt({ min: 1, max: 1000 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
  handleValidationErrors
], async (req, res) => {
  try {
    const pool = await getPool();
    const {
      machineId,
      status,
      itemListId,
      fromDate,
      toDate,
      limit = 100,
      offset = 0
    } = req.query;

    console.log('[GET /api/operations] Filters:', { machineId, status, itemListId, fromDate, toDate });

    // Build WHERE conditions for RigheLista
    let whereConditions = ['(RL.recordCancellato = 0 OR RL.recordCancellato IS NULL)'];

    if (itemListId) {
      whereConditions.push(`RL.idLista = ${parseInt(itemListId)}`);
    }
    if (fromDate) {
      whereConditions.push(`RL.dataCreazione >= '${fromDate}'`);
    }
    if (toDate) {
      whereConditions.push(`RL.dataCreazione <= '${toDate}'`);
    }

    const whereClause = 'WHERE ' + whereConditions.join(' AND ');

    // Query principale usando RigheLista (righe delle liste/operazioni)
    const query = `
      SELECT
        RL.id,
        RL.idLista,
        RL.numRigaLista,
        RL.idProdotto,
        RL.codice,
        RL.descrizione,
        RL.idUdc,
        RL.barcode,
        RL.lotto,
        RL.matricola,
        RL.qtaRichiesta,
        RL.qtaMovimentata,
        RL.qtaPrenotata,
        RL.dataCreazione,
        RL.dataInizioEvasioneRiga,
        RL.dataFineEvasioneRiga,
        RL.terminata,
        RL.nonEvadibile,
        RL.infoOperatore,
        L.numLista AS numeroLista,
        L.rifLista AS descrizioneLista,
        L.idTipoLista,
        U.barcode AS barcodeUDC
      FROM RigheLista RL
      LEFT JOIN Liste L ON RL.idLista = L.id
      LEFT JOIN UDC U ON RL.idUdc = U.id
      ${whereClause}
      ORDER BY RL.dataCreazione DESC, RL.numRigaLista ASC
      OFFSET ${parseInt(offset)} ROWS
      FETCH NEXT ${parseInt(limit)} ROWS ONLY
    `;

    const result = await pool.request().query(query);

    // Count totale
    const countQuery = `SELECT COUNT(*) as total FROM RigheLista RL ${whereClause}`;
    const countResult = await pool.request().query(countQuery);
    const total = countResult.recordset[0].total;

    // Trasforma risultati in formato frontend
    const operations = result.recordset.map(row => ({
      id: row.id,
      listId: row.idLista,
      listNumber: row.numeroLista,
      listDescription: row.descrizioneLista,
      rowNumber: row.numRigaLista,
      machineId: null, // Non disponibile in RigheLista
      machineCode: null,
      machineDescription: null,
      bayNumber: null,
      itemId: row.idProdotto,
      itemCode: row.codice,
      itemDescription: row.descrizione,
      loadingUnitId: row.idUdc,
      loadingUnitBarcode: row.barcodeUDC || row.barcode,
      lot: row.lotto,
      serialNumber: row.matricola,
      location: null, // Ubicazione non disponibile in RigheLista
      type: row.idTipoLista || 1, // Tipo lista
      status: row.terminata ? 2 : (row.nonEvadibile ? 3 : 0), // 0=pending, 2=completed, 3=unfulfillable
      quantity: row.qtaRichiesta || 0,
      processedQuantity: row.qtaMovimentata || 0,
      reservedQuantity: row.qtaPrenotata || 0,
      priority: 1, // Non disponibile in RigheLista
      createdAt: row.dataCreazione,
      startedAt: row.dataInizioEvasioneRiga,
      completedAt: row.dataFineEvasioneRiga,
      userName: row.infoOperatore,
      notes: null,
      completed: row.terminata,
      unfulfillable: row.nonEvadibile
    }));

    res.json({
      success: true,
      data: operations,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error('[GET /api/operations] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero delle operazioni',
      message: error.message
    });
  }
});

// ============================================================================
// GET /api/operations/:id - Dettaglio operazione
// ============================================================================
router.get('/:id', [
  param('id').isInt().toInt(),
  handleValidationErrors
], async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;

    console.log(`[GET /api/operations/${id}] Getting operation details`);

    const query = `
      SELECT
        LO.*,
        L.numLista AS numeroLista,
        L.descrizione AS descrizioneLista,
        A.codice AS codiceArticolo,
        A.descrizione AS descrizioneArticolo,
        U.barcode AS barcodeUDC,
        M.codice AS codiceMacchina,
        M.descrizione AS descrizioneMacchina
      FROM LogOperazioni LO
      LEFT JOIN Liste L ON LO.idLista = L.id
      LEFT JOIN Articoli A ON LO.idArticolo = A.id
      LEFT JOIN UDC U ON LO.idUDC = U.id
      LEFT JOIN Macchine M ON LO.idMacchina = M.id
      WHERE LO.id = @id
    `;

    const result = await pool.request()
      .input('id', parseInt(id))
      .query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Operazione ${id} non trovata`
      });
    }

    const row = result.recordset[0];
    const operation = {
      id: row.id,
      listId: row.idLista,
      listNumber: row.numeroLista,
      listDescription: row.descrizioneLista,
      machineId: row.idMacchina,
      machineCode: row.codiceMacchina,
      machineDescription: row.descrizioneMacchina,
      bayNumber: row.idBaia,
      itemId: row.idArticolo,
      itemCode: row.codiceArticolo,
      itemDescription: row.descrizioneArticolo,
      loadingUnitId: row.idUDC,
      loadingUnitBarcode: row.barcodeUDC,
      type: row.tipoOperazione,
      status: row.stato,
      quantity: row.quantita || 0,
      processedQuantity: row.quantitaProcessata || 0,
      priority: row.priorita || 0,
      createdAt: row.dataCreazione,
      startedAt: row.dataInizio,
      completedAt: row.dataFine,
      userName: row.utente,
      notes: row.note
    };

    res.json({
      success: true,
      data: operation
    });

  } catch (error) {
    console.error(`[GET /api/operations/${req.params.id}] Error:`, error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero dettaglio operazione',
      message: error.message
    });
  }
});

// ============================================================================
// GET /api/operations/:id/aggregate - Operazione aggregata
// ============================================================================
router.get('/:id/aggregate', [
  param('id').isInt().toInt(),
  handleValidationErrors
], async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;

    console.log(`[GET /api/operations/${id}/aggregate] Getting aggregated operation`);

    // Operazione principale
    const operationQuery = `
      SELECT
        LO.*,
        L.numLista AS numeroLista,
        A.codice AS codiceArticolo,
        U.barcode AS barcodeUDC,
        M.codice AS codiceMacchina
      FROM LogOperazioni LO
      LEFT JOIN Liste L ON LO.idLista = L.id
      LEFT JOIN Articoli A ON LO.idArticolo = A.id
      LEFT JOIN UDC U ON LO.idUDC = U.id
      LEFT JOIN Macchine M ON LO.idMacchina = M.id
      WHERE LO.id = @id
    `;

    const operationResult = await pool.request()
      .input('id', parseInt(id))
      .query(operationQuery);

    if (operationResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Operazione ${id} non trovata`
      });
    }

    const operation = operationResult.recordset[0];

    // Operazioni correlate (stessa lista e macchina)
    const relatedQuery = `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN stato = 0 THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN stato = 1 THEN 1 ELSE 0 END) as inProgress,
        SUM(CASE WHEN stato = 2 THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN stato = 3 THEN 1 ELSE 0 END) as suspended
      FROM LogOperazioni
      WHERE idLista = @idLista AND idMacchina = @idMacchina
    `;

    const relatedResult = await pool.request()
      .input('idLista', operation.idLista)
      .input('idMacchina', operation.idMacchina)
      .query(relatedQuery);

    const stats = relatedResult.recordset[0];

    res.json({
      success: true,
      data: {
        operation: {
          id: operation.id,
          listId: operation.idLista,
          listNumber: operation.numeroLista,
          machineId: operation.idMacchina,
          machineCode: operation.codiceMacchina,
          type: operation.tipoOperazione,
          status: operation.stato,
          quantity: operation.quantita || 0,
          processedQuantity: operation.quantitaProcessata || 0
        },
        aggregatedStats: {
          totalOperations: stats.total,
          pendingOperations: stats.pending,
          inProgressOperations: stats.inProgress,
          completedOperations: stats.completed,
          suspendedOperations: stats.suspended
        }
      }
    });

  } catch (error) {
    console.error(`[GET /api/operations/${req.params.id}/aggregate] Error:`, error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero operazione aggregata',
      message: error.message
    });
  }
});

// ============================================================================
// GET /api/operations/by-params - Operazione per parametri
// ============================================================================
router.get('/by-params', [
  query('machineId').optional().isInt().toInt(),
  query('bayNumber').optional().isInt().toInt(),
  query('itemId').optional().isInt().toInt(),
  query('loadingUnitId').optional().isInt().toInt(),
  query('type').optional().isInt().toInt(),
  handleValidationErrors
], async (req, res) => {
  try {
    const pool = await getPool();
    const { machineId, bayNumber, itemId, loadingUnitId, type } = req.query;

    console.log('[GET /api/operations/by-params] Params:', { machineId, bayNumber, itemId, loadingUnitId, type });

    let whereConditions = ['LO.stato IN (0, 1)']; // Solo operazioni pending o in progress

    if (machineId) whereConditions.push(`LO.idMacchina = ${parseInt(machineId)}`);
    if (bayNumber) whereConditions.push(`LO.idBaia = ${parseInt(bayNumber)}`);
    if (itemId) whereConditions.push(`LO.idArticolo = ${parseInt(itemId)}`);
    if (loadingUnitId) whereConditions.push(`LO.idUDC = ${parseInt(loadingUnitId)}`);
    if (type !== undefined) whereConditions.push(`LO.tipoOperazione = ${parseInt(type)}`);

    const whereClause = 'WHERE ' + whereConditions.join(' AND ');

    const query = `
      SELECT TOP 1
        LO.*,
        L.numLista AS numeroLista,
        A.codice AS codiceArticolo,
        U.barcode AS barcodeUDC,
        M.codice AS codiceMacchina
      FROM LogOperazioni LO
      LEFT JOIN Liste L ON LO.idLista = L.id
      LEFT JOIN Articoli A ON LO.idArticolo = A.id
      LEFT JOIN UDC U ON LO.idUDC = U.id
      LEFT JOIN Macchine M ON LO.idMacchina = M.id
      ${whereClause}
      ORDER BY LO.priorita DESC, LO.dataCreazione ASC
    `;

    const result = await pool.request().query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Nessuna operazione trovata con i parametri specificati'
      });
    }

    const row = result.recordset[0];
    const operation = {
      id: row.id,
      listId: row.idLista,
      listNumber: row.numeroLista,
      machineId: row.idMacchina,
      machineCode: row.codiceMacchina,
      bayNumber: row.idBaia,
      itemId: row.idArticolo,
      itemCode: row.codiceArticolo,
      loadingUnitId: row.idUDC,
      loadingUnitBarcode: row.barcodeUDC,
      type: row.tipoOperazione,
      status: row.stato,
      quantity: row.quantita || 0,
      processedQuantity: row.quantitaProcessata || 0,
      priority: row.priorita || 0
    };

    res.json({
      success: true,
      data: operation
    });

  } catch (error) {
    console.error('[GET /api/operations/by-params] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nella ricerca operazione',
      message: error.message
    });
  }
});

// ============================================================================
// POST /api/operations/:id/execute - Esegui operazione
// ============================================================================
router.post('/:id/execute', [
  param('id').isInt().toInt(),
  body('userName').notEmpty().withMessage('userName è obbligatorio'),
  body('notes').optional().isString(),
  handleValidationErrors
], async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;
    const { userName, notes } = req.body;

    console.log(`[POST /api/operations/${id}/execute] Executing operation by ${userName}`);

    // Verifica che l'operazione esista e sia in stato valido
    const checkQuery = `SELECT stato FROM LogOperazioni WHERE id = @id`;
    const checkResult = await pool.request()
      .input('id', parseInt(id))
      .query(checkQuery);

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Operazione ${id} non trovata`
      });
    }

    const currentStatus = checkResult.recordset[0].stato;
    if (currentStatus !== 0) { // 0 = PENDING
      return res.status(400).json({
        success: false,
        error: 'Operazione non in stato valido per esecuzione'
      });
    }

    // Aggiorna stato a IN_PROGRESS (1)
    const updateQuery = `
      UPDATE LogOperazioni
      SET
        stato = 1,
        dataInizio = GETDATE(),
        utente = @userName,
        note = CASE WHEN @notes IS NOT NULL THEN @notes ELSE note END
      WHERE id = @id
    `;

    await pool.request()
      .input('id', parseInt(id))
      .input('userName', userName)
      .input('notes', notes || null)
      .query(updateQuery);

    // Log nella tabella LogMissioni
    const logQuery = `
      INSERT INTO LogMissioni (idOperazione, evento, dataEvento, utente, note)
      VALUES (@id, 'EXECUTE', GETDATE(), @userName, @notes)
    `;

    await pool.request()
      .input('id', parseInt(id))
      .input('userName', userName)
      .input('notes', notes || 'Operazione avviata')
      .query(logQuery);

    res.json({
      success: true,
      message: 'Operazione avviata con successo',
      data: { id, status: 1 }
    });

  } catch (error) {
    console.error(`[POST /api/operations/${req.params.id}/execute] Error:`, error);
    res.status(500).json({
      success: false,
      error: 'Errore nell\'esecuzione operazione',
      message: error.message
    });
  }
});

// ============================================================================
// POST /api/operations/:id/complete - Completa operazione
// ============================================================================
router.post('/:id/complete', [
  param('id').isInt().toInt(),
  body('userName').optional().isString(),
  body('processedQuantity').optional().isFloat({ min: 0 }),
  body('notes').optional().isString(),
  body('reasonId').optional().isInt().toInt(),
  handleValidationErrors
], async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;
    const { userName, processedQuantity, notes, reasonId } = req.body;

    console.log(`[POST /api/operations/${id}/complete] Completing operation`);

    // Verifica operazione
    const checkQuery = `SELECT * FROM LogOperazioni WHERE id = @id`;
    const checkResult = await pool.request()
      .input('id', parseInt(id))
      .query(checkQuery);

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Operazione ${id} non trovata`
      });
    }

    const operation = checkResult.recordset[0];

    // Aggiorna stato a COMPLETED (2)
    const updateQuery = `
      UPDATE LogOperazioni
      SET
        stato = 2,
        dataFine = GETDATE(),
        quantitaProcessata = COALESCE(@processedQuantity, quantita, 0),
        utente = COALESCE(@userName, utente),
        note = CASE WHEN @notes IS NOT NULL THEN @notes ELSE note END,
        idCausale = CASE WHEN @reasonId IS NOT NULL THEN @reasonId ELSE idCausale END
      WHERE id = @id
    `;

    await pool.request()
      .input('id', parseInt(id))
      .input('processedQuantity', processedQuantity || operation.quantita || null)
      .input('userName', userName || null)
      .input('notes', notes || null)
      .input('reasonId', reasonId || null)
      .query(updateQuery);

    // Log evento
    const logQuery = `
      INSERT INTO LogMissioni (idOperazione, evento, dataEvento, utente, note)
      VALUES (@id, 'COMPLETE', GETDATE(), @userName, @notes)
    `;

    await pool.request()
      .input('id', parseInt(id))
      .input('userName', userName || 'SYSTEM')
      .input('notes', notes || 'Operazione completata')
      .query(logQuery);

    res.json({
      success: true,
      message: 'Operazione completata con successo',
      data: { id, status: 2 }
    });

  } catch (error) {
    console.error(`[POST /api/operations/${req.params.id}/complete] Error:`, error);
    res.status(500).json({
      success: false,
      error: 'Errore nel completamento operazione',
      message: error.message
    });
  }
});

// ============================================================================
// POST /api/operations/:id/suspend - Sospendi operazione
// ============================================================================
router.post('/:id/suspend', [
  param('id').isInt().toInt(),
  body('reasonId').optional().isInt().toInt(),
  body('notes').optional().isString(),
  handleValidationErrors
], async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;
    const { reasonId, notes } = req.body;

    console.log(`[POST /api/operations/${id}/suspend] Suspending operation`);

    // Verifica operazione
    const checkQuery = `SELECT stato FROM LogOperazioni WHERE id = @id`;
    const checkResult = await pool.request()
      .input('id', parseInt(id))
      .query(checkQuery);

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Operazione ${id} non trovata`
      });
    }

    // Aggiorna stato a SUSPENDED (3)
    const updateQuery = `
      UPDATE LogOperazioni
      SET
        stato = 3,
        idCausale = CASE WHEN @reasonId IS NOT NULL THEN @reasonId ELSE idCausale END,
        note = CASE WHEN @notes IS NOT NULL THEN @notes ELSE note END
      WHERE id = @id
    `;

    await pool.request()
      .input('id', parseInt(id))
      .input('reasonId', reasonId || null)
      .input('notes', notes || null)
      .query(updateQuery);

    // Log evento
    const logQuery = `
      INSERT INTO LogMissioni (idOperazione, evento, dataEvento, utente, note)
      VALUES (@id, 'SUSPEND', GETDATE(), 'SYSTEM', @notes)
    `;

    await pool.request()
      .input('id', parseInt(id))
      .input('notes', notes || 'Operazione sospesa')
      .query(logQuery);

    res.json({
      success: true,
      message: 'Operazione sospesa con successo',
      data: { id, status: 3 }
    });

  } catch (error) {
    console.error(`[POST /api/operations/${req.params.id}/suspend] Error:`, error);
    res.status(500).json({
      success: false,
      error: 'Errore nella sospensione operazione',
      message: error.message
    });
  }
});

// ============================================================================
// POST /api/operations/send-id - Invia ID operazione
// ============================================================================
router.post('/send-id', [
  body('operationId').isInt().toInt(),
  body('machineId').isInt().toInt(),
  handleValidationErrors
], async (req, res) => {
  try {
    const pool = await getPool();
    const { operationId, machineId } = req.body;

    console.log(`[POST /api/operations/send-id] Sending operation ${operationId} to machine ${machineId}`);

    // Verifica operazione
    const checkQuery = `SELECT * FROM LogOperazioni WHERE id = @operationId`;
    const checkResult = await pool.request()
      .input('operationId', parseInt(operationId))
      .query(checkQuery);

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Operazione ${operationId} non trovata`
      });
    }

    // Inserisci in buffer missioni (se tabella esiste)
    const bufferQuery = `
      IF EXISTS (SELECT * FROM sys.tables WHERE name = 'MissioniTrasloBuffer')
      BEGIN
        INSERT INTO MissioniTrasloBuffer (
          idOperazione,
          idMacchina,
          dataInvio,
          stato
        )
        VALUES (@operationId, @machineId, GETDATE(), 0)
      END
    `;

    await pool.request()
      .input('operationId', parseInt(operationId))
      .input('machineId', parseInt(machineId))
      .query(bufferQuery);

    // Log evento
    const logQuery = `
      INSERT INTO LogMissioni (idOperazione, evento, dataEvento, utente, note)
      VALUES (@operationId, 'SEND_TO_MACHINE', GETDATE(), 'SYSTEM', 'ID inviato a macchina ' + CAST(@machineId AS VARCHAR))
    `;

    await pool.request()
      .input('operationId', parseInt(operationId))
      .input('machineId', parseInt(machineId))
      .query(logQuery);

    res.json({
      success: true,
      message: 'ID operazione inviato con successo',
      data: { operationId, machineId }
    });

  } catch (error) {
    console.error('[POST /api/operations/send-id] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nell\'invio ID operazione',
      message: error.message
    });
  }
});

// ============================================================================
// GET /api/operations/reasons - Causali per tipo
// ============================================================================
router.get('/reasons', [
  query('type').notEmpty().withMessage('type è obbligatorio'),
  handleValidationErrors
], async (req, res) => {
  try {
    const pool = await getPool();
    const { type } = req.query;

    console.log(`[GET /api/operations/reasons] Getting reasons for type: ${type}`);

    const query = `
      SELECT
        id,
        codice,
        descrizione,
        tipo,
        attiva
      FROM CausaliMissione
      WHERE tipo = @type AND attiva = 1
      ORDER BY descrizione
    `;

    const result = await pool.request()
      .input('type', type)
      .query(query);

    const reasons = result.recordset.map(row => ({
      id: row.id,
      code: row.codice,
      description: row.descrizione,
      type: row.tipo,
      active: row.attiva
    }));

    res.json({
      success: true,
      data: reasons
    });

  } catch (error) {
    console.error('[GET /api/operations/reasons] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero causali',
      message: error.message
    });
  }
});

// ============================================================================
// GET /api/operations/available-orders - Ordini disponibili
// ============================================================================
router.get('/available-orders', [
  query('machineId').optional().isInt().toInt(),
  query('itemId').optional().isInt().toInt(),
  query('areaId').optional().isInt().toInt(),
  handleValidationErrors
], async (req, res) => {
  try {
    const pool = await getPool();
    const { machineId, itemId, areaId } = req.query;

    console.log('[GET /api/operations/available-orders] Filters:', { machineId, itemId, areaId });

    let whereConditions = ['L.terminata = 0', 'L.idStatoControlloEvadibilita IN (1, 2)'];

    if (machineId) whereConditions.push(`LAD.idMacchina = ${parseInt(machineId)}`);
    if (areaId) whereConditions.push(`LAD.idArea = ${parseInt(areaId)}`);

    const whereClause = 'WHERE ' + whereConditions.join(' AND ');

    const query = `
      SELECT DISTINCT
        L.id,
        L.numLista AS numeroOrdine,
        L.descrizione,
        L.rifLista AS riferimento,
        L.idTipoLista AS tipoOrdine,
        L.priorita,
        COUNT(RL.id) AS numeroRighe,
        SUM(CASE WHEN RL.quantitaProcessata >= RL.quantitaDaProcessare THEN 1 ELSE 0 END) AS righeCompletate
      FROM Liste L
      LEFT JOIN ListeAreaDetails LAD ON L.id = LAD.idLista
      LEFT JOIN RigheLista RL ON L.id = RL.idLista
      ${whereClause}
      GROUP BY L.id, L.numLista, L.descrizione, L.rifLista, L.idTipoLista, L.priorita
      ORDER BY L.priorita DESC, L.dataCreazione ASC
    `;

    const result = await pool.request().query(query);

    const orders = result.recordset.map(row => ({
      id: row.id,
      orderNumber: row.numeroOrdine,
      description: row.descrizione,
      reference: row.riferimento,
      orderType: row.tipoOrdine,
      priority: row.priorita || 0,
      totalRows: row.numeroRighe || 0,
      completedRows: row.righeCompletate || 0
    }));

    res.json({
      success: true,
      data: orders
    });

  } catch (error) {
    console.error('[GET /api/operations/available-orders] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero ordini disponibili',
      message: error.message
    });
  }
});

// ============================================================================
// GET /api/operations/extra-combo - Extra combo per operazione
// ============================================================================
router.get('/extra-combo', [
  query('operationId').isInt().toInt(),
  handleValidationErrors
], async (req, res) => {
  try {
    const pool = await getPool();
    const { operationId } = req.query;

    console.log(`[GET /api/operations/extra-combo] Getting extra combo for operation ${operationId}`);

    // Get operation details
    const operationQuery = `
      SELECT LO.*, L.numLista
      FROM LogOperazioni LO
      LEFT JOIN Liste L ON LO.idLista = L.id
      WHERE LO.id = @operationId
    `;

    const operationResult = await pool.request()
      .input('operationId', parseInt(operationId))
      .query(operationQuery);

    if (operationResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Operazione ${operationId} non trovata`
      });
    }

    const operation = operationResult.recordset[0];

    // Get related UDC/Loading Units
    const udcQuery = `
      SELECT TOP 10
        U.id,
        U.barcode,
        U.idTipoUDC,
        U.idLocazione,
        L.codice AS codiceLocazione
      FROM UDC U
      LEFT JOIN Locazioni L ON U.idLocazione = L.id
      WHERE U.idArticolo = @itemId OR U.idLocazione IN (
        SELECT idLocazione FROM UDC WHERE id = @udcId
      )
      ORDER BY U.dataCreazione DESC
    `;

    const udcResult = await pool.request()
      .input('itemId', operation.idArticolo || 0)
      .input('udcId', operation.idUDC || 0)
      .query(udcQuery);

    const extraCombo = {
      operation: {
        id: operation.id,
        listNumber: operation.numLista,
        type: operation.tipoOperazione
      },
      loadingUnits: udcResult.recordset.map(row => ({
        id: row.id,
        barcode: row.barcode,
        type: row.idTipoUDC,
        locationId: row.idLocazione,
        locationCode: row.codiceLocazione
      }))
    };

    res.json({
      success: true,
      data: extraCombo
    });

  } catch (error) {
    console.error('[GET /api/operations/extra-combo] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero extra combo',
      message: error.message
    });
  }
});

// ============================================================================
// POST /api/operations - Crea operazione
// ============================================================================
router.post('/', [
  body('listId').isInt().toInt(),
  body('machineId').isInt().toInt(),
  body('type').isInt().toInt(),
  body('itemId').optional().isInt().toInt(),
  body('loadingUnitId').optional().isInt().toInt(),
  body('bayNumber').optional().isInt().toInt(),
  body('quantity').optional().isFloat({ min: 0 }),
  body('priority').optional().isInt({ min: 0, max: 10 }).toInt(),
  body('userName').optional().isString(),
  body('notes').optional().isString(),
  handleValidationErrors
], async (req, res) => {
  try {
    const pool = await getPool();
    const {
      listId,
      machineId,
      type,
      itemId,
      loadingUnitId,
      bayNumber,
      quantity,
      priority,
      userName,
      notes
    } = req.body;

    console.log('[POST /api/operations] Creating new operation');

    const insertQuery = `
      INSERT INTO LogOperazioni (
        idLista,
        idMacchina,
        idBaia,
        idArticolo,
        idUDC,
        tipoOperazione,
        stato,
        quantita,
        quantitaProcessata,
        priorita,
        dataCreazione,
        utente,
        note
      )
      OUTPUT INSERTED.id
      VALUES (
        @listId,
        @machineId,
        @bayNumber,
        @itemId,
        @loadingUnitId,
        @type,
        0,
        @quantity,
        0,
        @priority,
        GETDATE(),
        @userName,
        @notes
      )
    `;

    const result = await pool.request()
      .input('listId', parseInt(listId))
      .input('machineId', parseInt(machineId))
      .input('bayNumber', bayNumber || null)
      .input('itemId', itemId || null)
      .input('loadingUnitId', loadingUnitId || null)
      .input('type', parseInt(type))
      .input('quantity', quantity || 0)
      .input('priority', priority || 5)
      .input('userName', userName || 'SYSTEM')
      .input('notes', notes || null)
      .query(insertQuery);

    const newId = result.recordset[0].id;

    // Log creazione
    const logQuery = `
      INSERT INTO LogMissioni (idOperazione, evento, dataEvento, utente, note)
      VALUES (@id, 'CREATE', GETDATE(), @userName, 'Operazione creata')
    `;

    await pool.request()
      .input('id', newId)
      .input('userName', userName || 'SYSTEM')
      .query(logQuery);

    res.status(201).json({
      success: true,
      message: 'Operazione creata con successo',
      data: { id: newId }
    });

  } catch (error) {
    console.error('[POST /api/operations] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nella creazione operazione',
      message: error.message
    });
  }
});

// ============================================================================
// DELETE /api/operations/:id - Elimina operazione
// ============================================================================
router.delete('/:id', [
  param('id').isInt().toInt(),
  handleValidationErrors
], async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;

    console.log(`[DELETE /api/operations/${id}] Deleting operation`);

    // Verifica che operazione esista e non sia completata
    const checkQuery = `SELECT stato FROM LogOperazioni WHERE id = @id`;
    const checkResult = await pool.request()
      .input('id', parseInt(id))
      .query(checkQuery);

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Operazione ${id} non trovata`
      });
    }

    const status = checkResult.recordset[0].stato;
    if (status === 2) { // COMPLETED
      return res.status(400).json({
        success: false,
        error: 'Impossibile eliminare operazione completata'
      });
    }

    // Elimina log correlati
    const deleteLogQuery = `DELETE FROM LogMissioni WHERE idOperazione = @id`;
    await pool.request()
      .input('id', parseInt(id))
      .query(deleteLogQuery);

    // Elimina operazione
    const deleteQuery = `DELETE FROM LogOperazioni WHERE id = @id`;
    const result = await pool.request()
      .input('id', parseInt(id))
      .query(deleteQuery);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        error: `Operazione ${id} non trovata`
      });
    }

    res.json({
      success: true,
      message: 'Operazione eliminata con successo'
    });

  } catch (error) {
    console.error(`[DELETE /api/operations/${req.params.id}] Error:`, error);
    res.status(500).json({
      success: false,
      error: 'Errore nell\'eliminazione operazione',
      message: error.message
    });
  }
});

export default router;
