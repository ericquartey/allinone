/**
 * Enhanced Item Lists Controller
 *
 * Gestione completa Liste basata su analisi Swing EjLog
 * Include tutte le funzionalità: filtri avanzati, esecuzione, priorità, ecc.
 */

import { getPool, sql } from '../db-config.js';
import { NotFoundError, ConflictError, ValidationError } from '../middleware/error-handler.js';

/**
 * GET /api/lists
 * Lista liste con filtri avanzati
 */
export const getItemLists = async (req, res) => {
  const pool = await getPool();
  const {
    type,           // Tipo lista: Picking, Refilling, Inventario, Riordino
    status,         // Stato: Nuova, InEsecuzione, Completata, Annullata, InPausa
    priority,       // Priorità: Alta, Media, Bassa
    dateFrom,       // Data creazione da
    dateTo,         // Data creazione a
    operator,       // Operatore creazione/esecuzione
    destination,    // Ubicazione destinazione
    hasInevadibili, // Solo liste con righe inevadibili
    search          // Ricerca per codice o descrizione
  } = req.query;

  const { limit, offset } = req.pagination;
  const request = pool.request();
  const whereConditions = ['1=1'];

  if (type) {
    whereConditions.push('l.tipo = @type');
    request.input('type', sql.NVarChar(50), type);
  }

  if (status) {
    whereConditions.push('l.stato = @status');
    request.input('status', sql.NVarChar(50), status);
  }

  if (priority) {
    whereConditions.push('l.priorita = @priority');
    request.input('priority', sql.NVarChar(20), priority);
  }

  if (dateFrom) {
    whereConditions.push('l.dataCreazione >= @dateFrom');
    request.input('dateFrom', sql.DateTime, new Date(dateFrom));
  }

  if (dateTo) {
    whereConditions.push('l.dataCreazione <= @dateTo');
    request.input('dateTo', sql.DateTime, new Date(dateTo));
  }

  if (operator) {
    whereConditions.push('(l.idUtenteCreazione = @operator OR l.idUtenteEsecuzione = @operator)');
    request.input('operator', sql.Int, parseInt(operator));
  }

  if (destination) {
    whereConditions.push('l.idUbicazioneDestinazione = @destination');
    request.input('destination', sql.Int, parseInt(destination));
  }

  if (hasInevadibili === 'true') {
    whereConditions.push('EXISTS (SELECT 1 FROM ListeDettaglio WHERE idLista = l.id AND inevadibile = 1)');
  }

  if (search) {
    whereConditions.push('(l.codice LIKE @search OR l.descrizione LIKE @search)');
    request.input('search', sql.NVarChar(255), `%${search}%`);
  }

  const whereClause = whereConditions.join(' AND ');
  request.input('offset', sql.Int, offset);
  request.input('limit', sql.Int, limit);

  const result = await request.query(`
    SELECT
      l.id,
      l.codice AS code,
      l.descrizione AS description,
      l.tipo AS type,
      l.stato AS status,
      l.priorita AS priority,
      l.dataCreazione AS createdAt,
      l.dataInizioEsecuzione AS executionStartedAt,
      l.dataCompletamento AS completedAt,
      l.dataAnnullamento AS cancelledAt,
      l.idUtenteCreazione AS createdByUserId,
      uc.utente AS createdByUsername,
      CONCAT(uc.nome, ' ', uc.cognome) AS createdByName,
      l.idUtenteEsecuzione AS executionUserId,
      ue.utente AS executionUsername,
      CONCAT(ue.nome, ' ', ue.cognome) AS executionUserName,
      l.idUbicazioneDestinazione AS destinationId,
      ud.codice AS destinationCode,
      l.note AS notes,
      (SELECT COUNT(*) FROM ListeDettaglio WHERE idLista = l.id) AS totalRows,
      (SELECT COUNT(*) FROM ListeDettaglio WHERE idLista = l.id AND quantitaPrelevata >= quantita) AS completedRows,
      (SELECT COUNT(*) FROM ListeDettaglio WHERE idLista = l.id AND inevadibile = 1) AS inevadibiliRows,
      CASE
        WHEN (SELECT COUNT(*) FROM ListeDettaglio WHERE idLista = l.id) = 0 THEN 0
        ELSE
          CAST((SELECT COUNT(*) FROM ListeDettaglio WHERE idLista = l.id AND quantitaPrelevata >= quantita) AS FLOAT) /
          CAST((SELECT COUNT(*) FROM ListeDettaglio WHERE idLista = l.id) AS FLOAT) * 100
      END AS completionPercentage
    FROM Liste l
    LEFT JOIN Utenti uc ON l.idUtenteCreazione = uc.id
    LEFT JOIN Utenti ue ON l.idUtenteEsecuzione = ue.id
    LEFT JOIN Ubicazioni ud ON l.idUbicazioneDestinazione = ud.id
    WHERE ${whereClause}
    ORDER BY
      CASE l.priorita
        WHEN 'Alta' THEN 1
        WHEN 'Media' THEN 2
        WHEN 'Bassa' THEN 3
        ELSE 4
      END,
      l.dataCreazione DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  `);

  // Count totale
  const countRequest = pool.request();
  whereConditions.forEach((_, idx) => {
    if (request.parameters[idx]) {
      countRequest.parameters.push(request.parameters[idx]);
    }
  });

  const countResult = await pool.request().query(`SELECT COUNT(*) as total FROM Liste l WHERE ${whereClause}`);
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
 * GET /api/lists/:id
 * Dettaglio lista singola
 */
export const getItemListById = async (req, res) => {
  const pool = await getPool();
  const { id } = req.params;

  const result = await pool.request().input('id', sql.Int, id).query(`
    SELECT
      l.id,
      l.codice AS code,
      l.descrizione AS description,
      l.tipo AS type,
      l.stato AS status,
      l.priorita AS priority,
      l.dataCreazione AS createdAt,
      l.dataInizioEsecuzione AS executionStartedAt,
      l.dataCompletamento AS completedAt,
      l.dataAnnullamento AS cancelledAt,
      l.motivoAnnullamento AS cancellationReason,
      l.idUtenteCreazione AS createdByUserId,
      uc.utente AS createdByUsername,
      CONCAT(uc.nome, ' ', uc.cognome) AS createdByName,
      l.idUtenteEsecuzione AS executionUserId,
      ue.utente AS executionUsername,
      CONCAT(ue.nome, ' ', ue.cognome) AS executionUserName,
      l.idUbicazioneDestinazione AS destinationId,
      ud.codice AS destinationCode,
      ud.descrizione AS destinationDescription,
      l.note AS notes
    FROM Liste l
    LEFT JOIN Utenti uc ON l.idUtenteCreazione = uc.id
    LEFT JOIN Utenti ue ON l.idUtenteEsecuzione = ue.id
    LEFT JOIN Ubicazioni ud ON l.idUbicazioneDestinazione = ud.id
    WHERE l.id = @id
  `);

  if (result.recordset.length === 0) {
    throw new NotFoundError('Lista non trovata');
  }

  res.json({ success: true, data: result.recordset[0] });
};

/**
 * POST /api/lists
 * Creazione nuova lista
 */
export const createItemList = async (req, res) => {
  const pool = await getPool();
  const {
    code,
    description,
    type,
    priority = 'Media',
    destinationId,
    notes,
    userId // ID utente che crea la lista
  } = req.body;

  // Verifica codice univoco
  const checkResult = await pool.request()
    .input('code', sql.NVarChar(50), code)
    .query('SELECT id FROM Liste WHERE codice = @code');

  if (checkResult.recordset.length > 0) {
    throw new ConflictError('Codice lista già esistente');
  }

  const insertResult = await pool.request()
    .input('codice', sql.NVarChar(50), code)
    .input('descrizione', sql.NVarChar(255), description || null)
    .input('tipo', sql.NVarChar(50), type)
    .input('priorita', sql.NVarChar(20), priority)
    .input('stato', sql.NVarChar(50), 'Nuova')
    .input('idUtenteCreazione', sql.Int, userId)
    .input('idUbicazioneDestinazione', sql.Int, destinationId || null)
    .input('note', sql.NVarChar(sql.MAX), notes || null)
    .query(`
      INSERT INTO Liste (
        codice, descrizione, tipo, stato, priorita,
        idUtenteCreazione, idUbicazioneDestinazione, note,
        dataCreazione, daVerificare, prenotazioneIncrementale
      )
      OUTPUT INSERTED.id
      VALUES (
        @codice, @descrizione, @tipo, @stato, @priorita,
        @idUtenteCreazione, @idUbicazioneDestinazione, @note,
        GETDATE(), 0, 0
      )
    `);

  const newId = insertResult.recordset[0].id;

  // Recupera lista creata con dati completi
  const newList = await pool.request()
    .input('id', sql.Int, newId)
    .query(`
      SELECT
        l.id, l.codice AS code, l.tipo AS type, l.stato AS status,
        l.priorita AS priority, l.dataCreazione AS createdAt
      FROM Liste l WHERE l.id = @id
    `);

  res.status(201).json({
    success: true,
    data: newList.recordset[0],
    message: 'Lista creata con successo'
  });
};

/**
 * PUT /api/lists/:id
 * Modifica lista
 */
export const updateItemList = async (req, res) => {
  const pool = await getPool();
  const { id } = req.params;
  const updates = [];
  const request = pool.request().input('id', sql.Int, id);

  // Verifica esistenza lista
  const existsResult = await pool.request()
    .input('id', sql.Int, id)
    .query('SELECT id, stato FROM Liste WHERE id = @id');

  if (existsResult.recordset.length === 0) {
    throw new NotFoundError('Lista non trovata');
  }

  const currentStatus = existsResult.recordset[0].stato;

  // Controllo: non modificare liste in esecuzione o completate
  if (currentStatus === 'InEsecuzione') {
    throw new ValidationError('Impossibile modificare una lista in esecuzione');
  }

  if (req.body.code) {
    request.input('codice', sql.NVarChar(50), req.body.code);
    updates.push('codice = @codice');
  }

  if (req.body.description !== undefined) {
    request.input('descrizione', sql.NVarChar(255), req.body.description);
    updates.push('descrizione = @descrizione');
  }

  if (req.body.priority) {
    request.input('priorita', sql.NVarChar(20), req.body.priority);
    updates.push('priorita = @priorita');
  }

  if (req.body.destinationId !== undefined) {
    request.input('idUbicazioneDestinazione', sql.Int, req.body.destinationId);
    updates.push('idUbicazioneDestinazione = @idUbicazioneDestinazione');
  }

  if (req.body.notes !== undefined) {
    request.input('note', sql.NVarChar(sql.MAX), req.body.notes);
    updates.push('note = @note');
  }

  if (updates.length > 0) {
    await request.query(`UPDATE Liste SET ${updates.join(', ')} WHERE id = @id`);
  }

  // Recupera dati aggiornati
  const updated = await pool.request()
    .input('id', sql.Int, id)
    .query('SELECT id, codice AS code, stato AS status, priorita AS priority FROM Liste WHERE id = @id');

  res.json({
    success: true,
    data: updated.recordset[0],
    message: 'Lista aggiornata con successo'
  });
};

/**
 * DELETE /api/lists/:id
 * Eliminazione lista
 */
export const deleteItemList = async (req, res) => {
  const pool = await getPool();
  const { id } = req.params;

  try {
    // Verifica stato lista
    const checkResult = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT id, codice, stato FROM Liste WHERE id = @id');

    if (checkResult.recordset.length === 0) {
      throw new NotFoundError('Lista non trovata');
    }

    const lista = checkResult.recordset[0];
    const status = lista.stato;

    console.log(`[DELETE Lista] Tentativo eliminazione lista ${lista.codice} (ID: ${id}, Stato: ${status})`);

    if (status === 'InEsecuzione') {
      throw new ValidationError('Impossibile eliminare una lista in esecuzione');
    }

    // Verifica dipendenze (operazioni, missioni, prenotazioni, ecc.)
    const dependencies = [];

    // Check operazioni
    try {
      const opsCheck = await pool.request()
        .input('id', sql.Int, id)
        .query('SELECT COUNT(*) as count FROM LogOperazioni WHERE idLista = @id');

      if (opsCheck.recordset[0].count > 0) {
        dependencies.push(`${opsCheck.recordset[0].count} operazioni collegate`);
      }
    } catch (err) {
      console.warn('[DELETE Lista] Tabella LogOperazioni non accessibile:', err.message);
    }

    // Check missioni
    try {
      const missionsCheck = await pool.request()
        .input('id', sql.Int, id)
        .query('SELECT COUNT(*) as count FROM MissioniTraslo WHERE idLista = @id');

      if (missionsCheck.recordset[0].count > 0) {
        dependencies.push(`${missionsCheck.recordset[0].count} missioni collegate`);
      }
    } catch (err) {
      console.warn('[DELETE Lista] Tabella MissioniTraslo non accessibile:', err.message);
    }

    // Check prenotazioni
    try {
      const reservationsCheck = await pool.request()
        .input('id', sql.Int, id)
        .query('SELECT COUNT(*) as count FROM Prenotazioni WHERE idLista = @id');

      if (reservationsCheck.recordset[0].count > 0) {
        dependencies.push(`${reservationsCheck.recordset[0].count} prenotazioni attive`);
      }
    } catch (err) {
      console.warn('[DELETE Lista] Tabella Prenotazioni non accessibile:', err.message);
    }

    // Se ci sono dipendenze, impedisci l'eliminazione
    if (dependencies.length > 0) {
      console.warn(`[DELETE Lista] Impossibile eliminare lista ${lista.codice}: ${dependencies.join(', ')}`);
      throw new ValidationError(
        `Impossibile eliminare la lista ${lista.codice}. Ha dipendenze: ${dependencies.join(', ')}. ` +
        `Eliminare prima le dipendenze o contattare l'amministratore.`
      );
    }

    // Elimina prima i dettagli (righe)
    const deleteDetailsResult = await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM ListeDettaglio WHERE idLista = @id');

    console.log(`[DELETE Lista] Eliminate ${deleteDetailsResult.rowsAffected[0]} righe dalla lista ${lista.codice}`);

    // Poi elimina la lista
    const deleteListResult = await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Liste WHERE id = @id');

    if (deleteListResult.rowsAffected[0] === 0) {
      throw new NotFoundError('Lista non trovata o già eliminata');
    }

    console.log(`[DELETE Lista] ✅ Lista ${lista.codice} (ID: ${id}) eliminata con successo`);

    res.json({
      success: true,
      message: `Lista ${lista.codice} eliminata con successo`
    });

  } catch (error) {
    console.error(`[DELETE Lista] ❌ Errore eliminazione lista ID ${id}:`, error.message);

    // Se è un errore SQL di foreign key constraint
    if (error.number === 547) {
      throw new ValidationError(
        `Impossibile eliminare la lista. Esistono dipendenze nel database. ` +
        `Dettagli: ${error.message}`
      );
    }

    throw error;
  }
};

/**
 * DELETE /api/lists/all
 * Elimina TUTTE le liste (con opzione force per eliminare anche le dipendenze)
 * ⚠️ OPERAZIONE PERICOLOSA - Usare solo in ambiente di sviluppo/test
 */
export const deleteAllLists = async (req, res) => {
  const pool = await getPool();
  const { force = false, excludeInProgress = true } = req.query;

  try {
    console.log('[DELETE ALL] 🗑️  Avvio eliminazione TUTTE le liste');
    console.log('[DELETE ALL] Parametri:', { force, excludeInProgress });

    // Recupera tutte le liste
    let query = 'SELECT id, codice, stato FROM Liste';
    if (excludeInProgress === 'true' || excludeInProgress === true) {
      query += " WHERE stato != 'InEsecuzione'";
    }

    const listsResult = await pool.request().query(query);
    const lists = listsResult.recordset;

    console.log(`[DELETE ALL] Trovate ${lists.length} liste da eliminare`);

    const results = {
      total: lists.length,
      deleted: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };

    // Se force=true, elimina prima tutte le dipendenze
    if (force === 'true' || force === true) {
      console.log('[DELETE ALL] ⚠️  FORCE MODE: Eliminazione dipendenze...');

      // Elimina tutte le prenotazioni
      try {
        const delPrenotazioni = await pool.request().query('DELETE FROM Prenotazioni');
        console.log(`[DELETE ALL] Eliminate ${delPrenotazioni.rowsAffected[0]} prenotazioni`);
      } catch (err) {
        console.warn('[DELETE ALL] Tabella Prenotazioni non accessibile:', err.message);
      }

      // Elimina tutte le operazioni
      try {
        const delOperazioni = await pool.request().query('DELETE FROM LogOperazioni');
        console.log(`[DELETE ALL] Eliminate ${delOperazioni.rowsAffected[0]} operazioni`);
      } catch (err) {
        console.warn('[DELETE ALL] Tabella LogOperazioni non accessibile:', err.message);
      }

      // Elimina tutte le missioni
      try {
        const delMissioni = await pool.request().query('DELETE FROM MissioniTraslo');
        console.log(`[DELETE ALL] Eliminate ${delMissioni.rowsAffected[0]} missioni`);
      } catch (err) {
        console.warn('[DELETE ALL] Tabella MissioniTraslo non accessibile:', err.message);
      }
    }

    // Elimina tutte le righe delle liste
    try {
      const delDettagli = await pool.request().query('DELETE FROM ListeDettaglio');
      console.log(`[DELETE ALL] Eliminate ${delDettagli.rowsAffected[0]} righe liste`);
    } catch (err) {
      console.error('[DELETE ALL] Errore eliminazione ListeDettaglio:', err.message);
      results.errors.push(`Errore eliminazione righe: ${err.message}`);
    }

    // Elimina ogni lista
    for (const lista of lists) {
      try {
        const delResult = await pool.request()
          .input('id', sql.Int, lista.id)
          .query('DELETE FROM Liste WHERE id = @id');

        if (delResult.rowsAffected[0] > 0) {
          results.deleted++;
          console.log(`[DELETE ALL] ✅ Eliminata lista ${lista.codice} (ID: ${lista.id})`);
        } else {
          results.skipped++;
          console.warn(`[DELETE ALL] ⚠️  Lista ${lista.codice} (ID: ${lista.id}) già eliminata`);
        }
      } catch (error) {
        results.failed++;
        const errorMsg = `Lista ${lista.codice} (ID: ${lista.id}): ${error.message}`;
        results.errors.push(errorMsg);
        console.error(`[DELETE ALL] ❌ Errore: ${errorMsg}`);
      }
    }

    console.log('[DELETE ALL] 📊 Risultati:', results);

    res.json({
      success: true,
      message: `Operazione completata: ${results.deleted} liste eliminate, ${results.failed} errori, ${results.skipped} saltate`,
      data: results
    });

  } catch (error) {
    console.error('[DELETE ALL] ❌ Errore generale:', error.message);
    throw error;
  }
};

/**
 * POST /api/lists/:id/execute
 * Avvia esecuzione lista
 */
export const executeList = async (req, res) => {
  const pool = await getPool();
  const { id } = req.params;
  const { userId } = req.body; // Operatore che esegue

  // Verifica lista
  const checkResult = await pool.request()
    .input('id', sql.Int, id)
    .query('SELECT stato FROM Liste WHERE id = @id');

  if (checkResult.recordset.length === 0) {
    throw new NotFoundError('Lista non trovata');
  }

  const currentStatus = checkResult.recordset[0].stato;
  if (currentStatus === 'InEsecuzione') {
    throw new ValidationError('Lista già in esecuzione');
  }

  if (currentStatus === 'Completata') {
    throw new ValidationError('Impossibile eseguire una lista già completata');
  }

  // Avvia esecuzione
  await pool.request()
    .input('id', sql.Int, id)
    .input('userId', sql.Int, userId)
    .query(`
      UPDATE Liste
      SET
        stato = 'InEsecuzione',
        dataInizioEsecuzione = GETDATE(),
        idUtenteEsecuzione = @userId
      WHERE id = @id
    `);

  res.json({
    success: true,
    message: 'Esecuzione lista avviata',
    data: { id, status: 'InEsecuzione' }
  });
};

/**
 * POST /api/lists/:id/pause
 * Metti in pausa esecuzione lista
 */
export const pauseList = async (req, res) => {
  const pool = await getPool();
  const { id } = req.params;

  await pool.request()
    .input('id', sql.Int, id)
    .query(`UPDATE Liste SET stato = 'InPausa' WHERE id = @id AND stato = 'InEsecuzione'`);

  res.json({
    success: true,
    message: 'Lista messa in pausa'
  });
};

/**
 * POST /api/lists/:id/resume
 * Riprendi esecuzione lista
 */
export const resumeList = async (req, res) => {
  const pool = await getPool();
  const { id } = req.params;

  await pool.request()
    .input('id', sql.Int, id)
    .query(`UPDATE Liste SET stato = 'InEsecuzione' WHERE id = @id AND stato = 'InPausa'`);

  res.json({
    success: true,
    message: 'Esecuzione lista ripresa'
  });
};

/**
 * POST /api/lists/:id/complete
 * Completa lista
 */
export const completeList = async (req, res) => {
  const pool = await getPool();
  const { id } = req.params;

  // Verifica che tutte le righe siano evase o inevadibili
  const checkRows = await pool.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT COUNT(*) as total,
             COUNT(CASE WHEN quantitaPrelevata >= quantita OR inevadibile = 1 THEN 1 END) as completed
      FROM ListeDettaglio
      WHERE idLista = @id
    `);

  const { total, completed } = checkRows.recordset[0];
  if (total !== completed) {
    throw new ValidationError(`Lista non completamente evasa: ${completed}/${total} righe completate`);
  }

  await pool.request()
    .input('id', sql.Int, id)
    .query(`
      UPDATE Liste
      SET
        stato = 'Completata',
        dataCompletamento = GETDATE()
      WHERE id = @id
    `);

  res.json({
    success: true,
    message: 'Lista completata con successo'
  });
};

/**
 * POST /api/lists/:id/cancel
 * Annulla lista
 */
export const cancelList = async (req, res) => {
  const pool = await getPool();
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason) {
    throw new ValidationError('Motivo annullamento obbligatorio');
  }

  await pool.request()
    .input('id', sql.Int, id)
    .input('reason', sql.NVarChar(sql.MAX), reason)
    .query(`
      UPDATE Liste
      SET
        stato = 'Annullata',
        dataAnnullamento = GETDATE(),
        motivoAnnullamento = @reason
      WHERE id = @id
    `);

  res.json({
    success: true,
    message: 'Lista annullata'
  });
};

/**
 * POST /api/lists/:id/copy
 * Duplica lista
 */
export const copyList = async (req, res) => {
  const pool = await getPool();
  const { id } = req.params;
  const { newCode, userId } = req.body;

  // Verifica codice univoco
  const checkCode = await pool.request()
    .input('code', sql.NVarChar(50), newCode)
    .query('SELECT id FROM Liste WHERE codice = @code');

  if (checkCode.recordset.length > 0) {
    throw new ConflictError('Codice lista già esistente');
  }

  // Ottieni dati lista originale
  const original = await pool.request()
    .input('id', sql.Int, id)
    .query('SELECT * FROM Liste WHERE id = @id');

  if (original.recordset.length === 0) {
    throw new NotFoundError('Lista originale non trovata');
  }

  const orig = original.recordset[0];

  // Crea nuova lista
  const newList = await pool.request()
    .input('codice', sql.NVarChar(50), newCode)
    .input('descrizione', sql.NVarChar(255), orig.descrizione)
    .input('tipo', sql.NVarChar(50), orig.tipo)
    .input('priorita', sql.NVarChar(20), orig.priorita)
    .input('idUtenteCreazione', sql.Int, userId)
    .input('idUbicazioneDestinazione', sql.Int, orig.idUbicazioneDestinazione)
    .input('note', sql.NVarChar(sql.MAX), orig.note)
    .query(`
      INSERT INTO Liste (
        codice, descrizione, tipo, stato, priorita,
        idUtenteCreazione, idUbicazioneDestinazione, note,
        dataCreazione, daVerificare, prenotazioneIncrementale
      )
      OUTPUT INSERTED.id
      VALUES (
        @codice, @descrizione, @tipo, 'Nuova', @priorita,
        @idUtenteCreazione, @idUbicazioneDestinazione, @note,
        GETDATE(), 0, 0
      )
    `);

  const newId = newList.recordset[0].id;

  // Copia righe
  await pool.request()
    .input('oldId', sql.Int, id)
    .input('newId', sql.Int, newId)
    .query(`
      INSERT INTO ListeDettaglio (
        idLista, idArticolo, quantita, quantitaPrelevata,
        idUbicazione, lotto, note
      )
      SELECT
        @newId, idArticolo, quantita, 0,
        idUbicazione, lotto, note
      FROM ListeDettaglio
      WHERE idLista = @oldId
    `);

  res.status(201).json({
    success: true,
    data: { id: newId, code: newCode },
    message: 'Lista duplicata con successo'
  });
};

/**
 * GET /api/lists/:id/items
 * Righe lista (dettaglio)
 */
export const getItemListItems = async (req, res) => {
  const pool = await getPool();
  const { id } = req.params;

  const result = await pool.request().input('listId', sql.Int, id).query(`
    SELECT
      ld.id,
      ld.idLista AS listId,
      ld.idArticolo AS itemId,
      a.codice AS itemCode,
      a.descrizione AS itemDescription,
      ld.quantita AS quantity,
      ld.quantitaPrelevata AS pickedQuantity,
      (ld.quantita - ld.quantitaPrelevata) AS remainingQuantity,
      ld.idUbicazione AS locationId,
      u.codice AS locationCode,
      u.descrizione AS locationDescription,
      ld.lotto AS lot,
      ld.inevadibile AS isInevadibile,
      ld.motivoInevadibilita AS inevadibilitaReason,
      ld.note AS notes,
      CASE
        WHEN ld.inevadibile = 1 THEN 'Inevadibile'
        WHEN ld.quantitaPrelevata >= ld.quantita THEN 'Evasa'
        WHEN ld.quantitaPrelevata > 0 THEN 'Parziale'
        ELSE 'Nuova'
      END AS rowStatus
    FROM ListeDettaglio ld
    LEFT JOIN Articoli a ON ld.idArticolo = a.id
    LEFT JOIN Ubicazioni u ON ld.idUbicazione = u.id
    WHERE ld.idLista = @listId
    ORDER BY ld.id
  `);

  res.json({ success: true, data: result.recordset });
};

/**
 * POST /api/lists/:id/items
 * Aggiungi riga a lista
 */
export const addItemToList = async (req, res) => {
  const pool = await getPool();
  const { id: listId } = req.params;
  const { itemId, quantity, locationId, lot, notes } = req.body;

  // Verifica che lista non sia in esecuzione o completata
  const checkList = await pool.request()
    .input('id', sql.Int, listId)
    .query('SELECT stato FROM Liste WHERE id = @id');

  if (checkList.recordset.length === 0) {
    throw new NotFoundError('Lista non trovata');
  }

  const status = checkList.recordset[0].stato;
  if (status === 'InEsecuzione' || status === 'Completata') {
    throw new ValidationError('Impossibile modificare righe di lista in esecuzione o completata');
  }

  const insertResult = await pool.request()
    .input('idLista', sql.Int, listId)
    .input('idArticolo', sql.Int, itemId)
    .input('quantita', sql.Float, quantity)
    .input('idUbicazione', sql.Int, locationId || null)
    .input('lotto', sql.NVarChar(50), lot || null)
    .input('note', sql.NVarChar(sql.MAX), notes || null)
    .query(`
      INSERT INTO ListeDettaglio (
        idLista, idArticolo, quantita, quantitaPrelevata,
        idUbicazione, lotto, note, inevadibile
      )
      OUTPUT INSERTED.id
      VALUES (
        @idLista, @idArticolo, @quantita, 0,
        @idUbicazione, @lotto, @note, 0
      )
    `);

  const newId = insertResult.recordset[0].id;

  res.status(201).json({
    success: true,
    data: { id: newId },
    message: 'Riga aggiunta alla lista'
  });
};

/**
 * PUT /api/lists/:listId/items/:itemId
 * Modifica riga lista
 */
export const updateListItem = async (req, res) => {
  const pool = await getPool();
  const { listId, itemId } = req.params;
  const updates = [];
  const request = pool.request()
    .input('listId', sql.Int, listId)
    .input('itemId', sql.Int, itemId);

  if (req.body.quantity !== undefined) {
    request.input('quantita', sql.Float, req.body.quantity);
    updates.push('quantita = @quantita');
  }

  if (req.body.pickedQuantity !== undefined) {
    request.input('quantitaPrelevata', sql.Float, req.body.pickedQuantity);
    updates.push('quantitaPrelevata = @quantitaPrelevata');
  }

  if (req.body.locationId !== undefined) {
    request.input('idUbicazione', sql.Int, req.body.locationId);
    updates.push('idUbicazione = @idUbicazione');
  }

  if (req.body.lot !== undefined) {
    request.input('lotto', sql.NVarChar(50), req.body.lot);
    updates.push('lotto = @lotto');
  }

  if (req.body.notes !== undefined) {
    request.input('note', sql.NVarChar(sql.MAX), req.body.notes);
    updates.push('note = @note');
  }

  if (req.body.isInevadibile !== undefined) {
    request.input('inevadibile', sql.Bit, req.body.isInevadibile ? 1 : 0);
    updates.push('inevadibile = @inevadibile');
  }

  if (req.body.inevadibilitaReason !== undefined) {
    request.input('motivoInevadibilita', sql.NVarChar(sql.MAX), req.body.inevadibilitaReason);
    updates.push('motivoInevadibilita = @motivoInevadibilita');
  }

  if (updates.length > 0) {
    await request.query(`
      UPDATE ListeDettaglio
      SET ${updates.join(', ')}
      WHERE idLista = @listId AND id = @itemId
    `);
  }

  res.json({
    success: true,
    message: 'Riga lista aggiornata'
  });
};

/**
 * DELETE /api/lists/:listId/items/:itemId
 * Elimina riga da lista
 */
export const removeItemFromList = async (req, res) => {
  const pool = await getPool();
  const { listId, itemId } = req.params;

  await pool.request()
    .input('listId', sql.Int, listId)
    .input('itemId', sql.Int, itemId)
    .query('DELETE FROM ListeDettaglio WHERE idLista = @listId AND id = @itemId');

  res.json({
    success: true,
    message: 'Riga rimossa dalla lista'
  });
};

/**
 * GET /api/lists/:id/history
 * Storico lista
 */
export const getListHistory = async (req, res) => {
  const pool = await getPool();
  const { id } = req.params;

  // TODO: Implementare tabella ListeStorico per tracking modifiche
  // Per ora ritorniamo dati base

  const result = await pool.request().input('id', sql.Int, id).query(`
    SELECT
      l.dataCreazione AS createdAt,
      l.dataInizioEsecuzione AS executionStartedAt,
      l.dataCompletamento AS completedAt,
      l.dataAnnullamento AS cancelledAt,
      l.stato AS currentStatus
    FROM Liste l
    WHERE l.id = @id
  `);

  res.json({
    success: true,
    data: result.recordset[0] || {}
  });
};
