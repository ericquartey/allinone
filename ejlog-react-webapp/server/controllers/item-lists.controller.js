/**
 * Item Lists Controller
 *
 * Business logic per gestione Liste (Picking, Spedizione, ecc.)
 * Schema reale database SQL Server - EjLog WMS
 * Tabelle: Liste, RigheLista, StatoLista, StatoRiga
 */

import { getPool, sql } from '../db-config.js';
import { NotFoundError, ConflictError } from '../middleware/error-handler.js';

/**
 * GET /api/item-lists
 * Ottiene tutte le liste con filtri
 */
export const getItemLists = async (req, res) => {
  const pool = await getPool();
  const { search, tipoLista, terminata, esportata } = req.query;
  const { limit, offset } = req.pagination;

  const request = pool.request();
  let whereConditions = [];

  // Filtro ricerca per numero lista o riferimento
  if (search) {
    whereConditions.push('(numLista LIKE @search OR rifLista LIKE @search OR barcode LIKE @search)');
    request.input('search', sql.NVarChar, `%${search}%`);
  }

  // Filtro per tipo lista
  if (tipoLista) {
    whereConditions.push('idTipoLista = @tipoLista');
    request.input('tipoLista', sql.Int, parseInt(tipoLista));
  }

  // Filtro per lista terminata
  if (terminata !== undefined) {
    whereConditions.push('terminata = @terminata');
    request.input('terminata', sql.Bit, terminata === 'true' ? 1 : 0);
  }

  // Filtro per lista esportata
  if (esportata !== undefined) {
    whereConditions.push('esportata = @esportata');
    request.input('esportata', sql.Bit, esportata === 'true' ? 1 : 0);
  }

  // Escludi liste cancellate
  whereConditions.push('(recordCancellato = 0 OR recordCancellato IS NULL)');

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
  request.input('offset', sql.Int, offset);
  request.input('limit', sql.Int, limit);

  const result = await request.query(`
    SELECT
      l.id,
      l.numLista AS listNumber,
      l.rifLista AS listReference,
      l.barcode,
      l.idTipoLista AS listType,
      COALESCE(lad.listAreaStatusId, l.idStatoControlloEvadibilita) AS listStatusId,
      l.dataCreazione AS createdAt,
      l.dataLancio AS launchedAt,
      l.dataPrevistaEvasione AS expectedCompletionDate,
      l.dataInizioEvasione AS startedAt,
      l.dataFineEvasione AS completedAt,
      l.dataEsportazione AS exportedAt,
      CAST(l.terminata AS bit) AS completed,
      CAST(l.esportata AS bit) AS exported,
      CAST(l.listaNonEvadibile AS bit) AS unfulfillable,
      l.numeroRighe AS totalRows,
      l.numeroRigheTerminate AS completedRows,
      l.numeroRigheIniziate AS startedRows,
      l.numeroRigheNonEvadibili AS unfulfillableRows,
      l.numeroPrenotazioniConfermate AS confirmedReservations,
      l.utente AS createdBy,
      l.destinatario AS recipient,
      l.fornitore AS supplier
    FROM Liste l
    OUTER APPLY (
      SELECT TOP 1 lad.idStatoLista AS listAreaStatusId
      FROM ListeAreaDetails lad
      WHERE lad.idLista = l.id
      ORDER BY lad.idArea
    ) lad
    ${whereClause}
    ORDER BY l.dataCreazione DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  `);

  const countRequest = pool.request();
  if (search) countRequest.input('search', sql.NVarChar, `%${search}%`);
  if (tipoLista) countRequest.input('tipoLista', sql.Int, parseInt(tipoLista));
  if (terminata !== undefined) countRequest.input('terminata', sql.Bit, terminata === 'true' ? 1 : 0);
  if (esportata !== undefined) countRequest.input('esportata', sql.Bit, esportata === 'true' ? 1 : 0);

  const countResult = await countRequest.query(`
    SELECT COUNT(*) as total FROM Liste l ${whereClause}
  `);
  const total = countResult.recordset[0].total;

  res.json({
    success: true,
    data: result.recordset,
    pagination: { total, limit, offset, hasMore: (offset + limit) < total }
  });
};

/**
 * GET /api/item-lists/:id
 * Ottiene una lista specifica con dettagli completi
 */
export const getItemListById = async (req, res) => {
  const pool = await getPool();
  const { id } = req.params;

  const result = await pool.request().input('id', sql.Int, id).query(`
    SELECT
      l.id,
      l.version,
      l.numLista AS listNumber,
      l.rifLista AS listReference,
      l.barcode,
      l.idTipoLista AS listType,
      l.idCausaleMovimento AS movementReason,
      l.idListaRiferimento AS referenceListId,
      l.dataCreazione AS createdAt,
      l.dataModifica AS modifiedAt,
      l.dataLancio AS launchedAt,
      l.dataPrevistaEvasione AS expectedCompletionDate,
      l.dataInizioEvasione AS startedAt,
      l.dataFineEvasione AS completedAt,
      l.dataEsportazione AS exportedAt,
      l.dataCancellazione AS deletedAt,
      CAST(l.terminata AS bit) AS completed,
      CAST(l.terminataDaHost AS bit) AS completedByHost,
      CAST(l.esportata AS bit) AS exported,
      CAST(l.generazioneEsito AS bit) AS generateOutcome,
      CAST(l.impegnaMateriale AS bit) AS commitMaterial,
      CAST(l.listaNonEvadibile AS bit) AS unfulfillable,
      CAST(l.daEsportare AS bit) AS toExport,
      CAST(l.daVerificare AS bit) AS toVerify,
      CAST(l.creataDaHost AS bit) AS createdByHost,
      l.numeroRighe AS totalRows,
      l.numeroRigheTerminate AS completedRows,
      l.numeroRigheIniziate AS startedRows,
      l.numeroRigheNonEvadibili AS unfulfillableRows,
      l.numeroRigheSospese AS suspendedRows,
      l.numeroPrenotazioniConfermate AS confirmedReservations,
      l.numeroPrenotazioniResidue AS pendingReservations,
      l.utente AS createdBy,
      l.destinatario AS recipient,
      l.fornitore AS supplier,
      l.commessa AS order,
      l.gruppo AS groupCode,
      l.descrizioneGruppo AS groupDescription,
      l.nomeFile AS fileName
    FROM Liste l
    WHERE l.id = @id
  `);

  if (result.recordset.length === 0) throw new NotFoundError('Lista');

  res.json({ success: true, data: result.recordset[0] });
};

/**
 * GET /api/item-lists/:id/items
 * Ottiene le righe (items) di una lista specifica
 */
export const getItemListItems = async (req, res) => {
  const pool = await getPool();
  const { id } = req.params;
  const { limit, offset } = req.pagination;

  const request = pool.request();
  request.input('listId', sql.Int, id);
  request.input('offset', sql.Int, offset);
  request.input('limit', sql.Int, limit);

  const result = await request.query(`
    SELECT
      rl.id,
      rl.numRigaLista AS rowNumber,
      rl.codice AS itemCode,
      rl.descrizione AS description,
      rl.barcode,
      rl.idArticolo AS articleId,
      rl.idStatoRiga AS rowStatus,
      rl.qtaRichiesta AS requestedQuantity,
      rl.qtaMovimentata AS movedQuantity,
      rl.qtaPrenotata AS reservedQuantity,
      rl.lotto AS lot,
      rl.matricola AS serialNumber,
      rl.dataScadenzaMin AS expiryDateMin,
      rl.dataScadenzaMax AS expiryDateMax,
      rl.dataCreazione AS createdAt,
      rl.dataInizioEvasioneRiga AS startedAt,
      rl.dataFineEvasioneRiga AS completedAt,
      CAST(rl.nonEvadibile AS bit) AS unfulfillable,
      CAST(rl.terminata AS bit) AS completed,
      rl.numeroPrenotazioniConfermate AS confirmedReservations,
      rl.numeroPrenotazioniResidue AS pendingReservations,
      rl.sequenza AS sequence,
      rl.infoOperatore AS operatorInfo,
      a.descrizione AS articleDescription
    FROM RigheLista rl
    LEFT JOIN Articoli a ON rl.idArticolo = a.id
    WHERE rl.idLista = @listId
      AND (rl.recordCancellato = 0 OR rl.recordCancellato IS NULL)
    ORDER BY rl.sequenza, rl.numRigaLista
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  `);

  const countResult = await pool.request()
    .input('listId', sql.Int, id)
    .query(`
      SELECT COUNT(*) as total
      FROM RigheLista
      WHERE idLista = @listId
        AND (recordCancellato = 0 OR recordCancellato IS NULL)
    `);
  const total = countResult.recordset[0].total;

  res.json({
    success: true,
    data: result.recordset,
    pagination: { total, limit, offset, hasMore: (offset + limit) < total }
  });
};

/**
 * GET /api/item-lists/stats
 * Ottiene statistiche aggregate sulle liste
 */
export const getItemListsStats = async (req, res) => {
  const pool = await getPool();

  const result = await pool.request().query(`
    SELECT
      COUNT(*) AS totalLists,
      SUM(CASE WHEN terminata = 0 THEN 1 ELSE 0 END) AS activeLists,
      SUM(CASE WHEN terminata = 1 THEN 1 ELSE 0 END) AS completedLists,
      SUM(CASE WHEN esportata = 0 AND terminata = 1 THEN 1 ELSE 0 END) AS toExportLists,
      SUM(numeroRighe) AS totalRows,
      SUM(numeroRigheTerminate) AS completedRows,
      SUM(numeroRigheNonEvadibili) AS unfulfillableRows
    FROM Liste
    WHERE (recordCancellato = 0 OR recordCancellato IS NULL)
  `);

  res.json({
    success: true,
    data: result.recordset[0]
  });
};
