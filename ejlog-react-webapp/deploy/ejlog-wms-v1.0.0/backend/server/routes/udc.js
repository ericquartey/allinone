/**
 * Routes per UDC (Unità Di Carico)
 * Endpoint per recuperare dati reali dal database promag
 */

import express from 'express';
import { getPool } from '../db-config.js';

const router = express.Router();

/**
 * GET /api/udc
 * Lista UDC con filtri
 */
router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    const { limit = 50, offset = 0, search } = req.query;

    let query = `
      SELECT
        id,
        numeroUdc,
        barcode,
        descrizione,
        numProdotti,
        numSupporti,
        idLocazione,
        idMagazzino,
        bloccataManualmente,
        bloccataPerCriterio,
        prenotataInteramentePicking,
        numeroPrenotazioniTotali,
        dataCreazione,
        dataModificaContenuto,
        dataUltimaMovimentazione,
        peso,
        altezza,
        larghezza,
        profondita
      FROM Udc
      WHERE recordCancellato = 0
    `;

    if (search) {
      query += ` AND (numeroUdc LIKE @search OR barcode LIKE @search OR descrizione LIKE @search)`;
    }

    query += ` ORDER BY id OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;

    const request = pool.request()
      .input('limit', parseInt(limit))
      .input('offset', parseInt(offset));

    if (search) {
      request.input('search', `%${search}%`);
    }

    const result = await request.query(query);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM Udc WHERE recordCancellato = 0';
    if (search) {
      countQuery += ` AND (numeroUdc LIKE @search OR barcode LIKE @search OR descrizione LIKE @search)`;
    }

    const countRequest = pool.request();
    if (search) {
      countRequest.input('search', `%${search}%`);
    }
    const countResult = await countRequest.query(countQuery);
    const totalCount = countResult.recordset[0].total;

    res.json({
      data: result.recordset,
      total: totalCount,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error('Error fetching UDC:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/udc/:id
 * Dettaglio UDC con cassetti e prodotti
 */
router.get('/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;

    // UDC header
    const udcResult = await pool.request()
      .input('id', id)
      .query(`
        SELECT * FROM Udc WHERE id = @id AND recordCancellato = 0
      `);

    if (udcResult.recordset.length === 0) {
      return res.status(404).json({ error: 'UDC not found' });
    }

    const udc = udcResult.recordset[0];

    // Cassetti
    const supportiResult = await pool.request()
      .input('idUdc', id)
      .query(`
        SELECT * FROM UdcSupporti
        WHERE idUdc = @idUdc AND recordCancellato = 0
        ORDER BY progressivo
      `);

    // Prodotti
    const prodottiResult = await pool.request()
      .input('idUdc', id)
      .query(`
        SELECT * FROM UdcProdotti
        WHERE idUdc = @idUdc AND recordCancellato = 0
      `);

    res.json({
      udc,
      supporti: supportiResult.recordset,
      prodotti: prodottiResult.recordset,
    });
  } catch (error) {
    console.error('Error fetching UDC detail:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/udc/:id/compartments
 * Lista cassetti di una UDC
 */
router.get('/:id/compartments', async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;

    const result = await pool.request()
      .input('idUdc', id)
      .query(`
        SELECT
          s.*,
          a.codice as articleCode,
          a.descrizione as articleDescription
        FROM UdcSupporti s
        LEFT JOIN Articoli a ON s.idArticoloOmogeneo = a.id
        WHERE s.idUdc = @idUdc AND s.recordCancellato = 0
        ORDER BY s.progressivo
      `);

    res.json({
      data: result.recordset,
      total: result.recordset.length,
    });
  } catch (error) {
    console.error('Error fetching compartments:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/udc/:id/move
 * Muove una UDC verso una nuova ubicazione
 * Crea una missione in MissioniTrasloBuffer
 */
router.post('/:id/move', async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;
    const {
      idLocazioneDestinazione,
      priorita = 5,
      causale = 'Movimento manuale'
    } = req.body;

    console.log(`[POST /api/udc/${id}/move] Moving UDC to location:`, idLocazioneDestinazione);

    // Validate UDC exists
    const udcResult = await pool.request()
      .input('id', id)
      .query(`
        SELECT
          id,
          numeroUdc,
          idLocazione,
          idStato,
          idClasseAltezza
        FROM Udc
        WHERE id = @id AND recordCancellato = 0
      `);

    if (udcResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'UDC non trovata'
      });
    }

    const udc = udcResult.recordset[0];

    // Check if UDC is already in movement
    if (udc.idStato === 3) {
      return res.status(400).json({
        success: false,
        error: 'UDC già in movimento'
      });
    }

    // Check if UDC has current location
    if (!udc.idLocazione) {
      return res.status(400).json({
        success: false,
        error: 'UDC non ha una ubicazione corrente'
      });
    }

    // Validate destination location
    const locResult = await pool.request()
      .input('idLoc', idLocazioneDestinazione)
      .query(`
        SELECT
          id,
          codice,
          bloccata,
          maxUdc,
          idClasseAltezza,
          (SELECT COUNT(*) FROM Udc WHERE idLocazione = Locazioni.id AND recordCancellato = 0) as numUdc
        FROM Locazioni
        WHERE id = @idLoc AND recordCancellato = 0
      `);

    if (locResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Ubicazione destinazione non trovata'
      });
    }

    const location = locResult.recordset[0];

    // Check if location is blocked
    if (location.bloccata) {
      return res.status(400).json({
        success: false,
        error: 'Ubicazione destinazione è bloccata'
      });
    }

    // Check if location is full
    if (location.numUdc >= location.maxUdc) {
      return res.status(400).json({
        success: false,
        error: 'Ubicazione destinazione è piena'
      });
    }

    // Check height class compatibility (if both are defined)
    if (udc.idClasseAltezza && location.idClasseAltezza) {
      if (udc.idClasseAltezza !== location.idClasseAltezza) {
        return res.status(400).json({
          success: false,
          error: 'Classe altezza UDC incompatibile con ubicazione destinazione'
        });
      }
    }

    // Check if there's already an active mission for this UDC
    const existingMissionResult = await pool.request()
      .input('idUdc', id)
      .query(`
        SELECT idMissione
        FROM MissioniTraslo
        WHERE idUdc = @idUdc AND stato IN (0, 1, 2, 5)
      `);

    if (existingMissionResult.recordset.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Esiste già una missione attiva per questa UDC'
      });
    }

    // Create mission in buffer
    const insertResult = await pool.request()
      .input('idUdc', id)
      .input('idLocazionePrelievo', udc.idLocazione)
      .input('idLocazioneDeposito', idLocazioneDestinazione)
      .input('tipoMissione', 'TR')
      .input('priorita', priorita)
      .input('causale', causale)
      .query(`
        INSERT INTO MissioniTrasloBuffer (
          idUdc,
          idLocazionePrelievo,
          idLocazioneDeposito,
          tipoMissione,
          priorita,
          causaleMissione,
          dataInserimento
        )
        OUTPUT INSERTED.id
        VALUES (
          @idUdc,
          @idLocazionePrelievo,
          @idLocazioneDeposito,
          @tipoMissione,
          @priorita,
          @causale,
          GETDATE()
        )
      `);

    const idBuffer = insertResult.recordset[0].id;

    // Update UDC state to "In movimento" (3)
    await pool.request()
      .input('idUdc', id)
      .query(`
        UPDATE Udc
        SET idStato = 3
        WHERE id = @idUdc
      `);

    res.status(201).json({
      success: true,
      data: {
        idBuffer: idBuffer,
        numeroUdc: udc.numeroUdc,
        locazionePartenza: udc.idLocazione,
        locazioneDestinazione: idLocazioneDestinazione,
        message: 'Missione creata con successo'
      }
    });

  } catch (error) {
    console.error(`[POST /api/udc/${req.params.id}/move] Error:`, error);
    res.status(500).json({
      success: false,
      error: 'Errore nello spostamento UDC',
      message: error.message
    });
  }
});

/**
 * POST /api/udc/:id/items
 * Aggiungi prodotto a UDC
 */
router.post('/:id/items', async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;
    const {
      idArticolo,
      quantita,
      lotto,
      matricola,
      scadenza
    } = req.body;

    console.log(`[POST /api/udc/${id}/items] Adding item:`, { idArticolo, quantita });

    // Validate UDC exists
    const udcResult = await pool.request()
      .input('id', id)
      .query('SELECT id, numeroUdc FROM Udc WHERE id = @id AND recordCancellato = 0');

    if (udcResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'UDC non trovata'
      });
    }

    // Validate article exists
    const artResult = await pool.request()
      .input('idArticolo', idArticolo)
      .query('SELECT id, codice, descrizione FROM Articoli WHERE id = @idArticolo AND recordCancellato = 0');

    if (artResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Articolo non trovato'
      });
    }

    const article = artResult.recordset[0];

    // Check if product already exists in UDC with same lot
    let existingProduct = null;
    if (lotto) {
      const existingResult = await pool.request()
        .input('idUdc', id)
        .input('idArticolo', idArticolo)
        .input('lotto', lotto)
        .query(`
          SELECT id, quantita
          FROM Prodotto
          WHERE idUdc = @idUdc
            AND idArticolo = @idArticolo
            AND lotto = @lotto
            AND recordCancellato = 0
        `);

      if (existingResult.recordset.length > 0) {
        existingProduct = existingResult.recordset[0];
      }
    }

    let idProdotto;

    if (existingProduct) {
      // Update existing product quantity
      const newQty = parseFloat(existingProduct.quantita) + parseFloat(quantita);

      await pool.request()
        .input('id', existingProduct.id)
        .input('quantita', newQty)
        .query(`
          UPDATE Prodotto
          SET quantita = @quantita,
              dataModifica = GETDATE()
          WHERE id = @id
        `);

      idProdotto = existingProduct.id;

    } else {
      // Insert new product
      const insertResult = await pool.request()
        .input('idArticolo', idArticolo)
        .input('idUdc', id)
        .input('quantita', quantita)
        .input('lotto', lotto || null)
        .input('matricola', matricola || null)
        .input('scadenza', scadenza || null)
        .query(`
          INSERT INTO Prodotto (
            idArticolo,
            idUdc,
            quantita,
            lotto,
            matricola,
            scadenza,
            dataCreazione,
            dataModifica
          )
          OUTPUT INSERTED.id
          VALUES (
            @idArticolo,
            @idUdc,
            @quantita,
            @lotto,
            @matricola,
            @scadenza,
            GETDATE(),
            GETDATE()
          )
        `);

      idProdotto = insertResult.recordset[0].id;
    }

    res.status(201).json({
      success: true,
      data: {
        idProdotto: idProdotto,
        action: existingProduct ? 'updated' : 'created',
        message: existingProduct
          ? 'Quantità prodotto aggiornata'
          : 'Prodotto aggiunto all\'UDC'
      }
    });

  } catch (error) {
    console.error(`[POST /api/udc/${req.params.id}/items] Error:`, error);
    res.status(500).json({
      success: false,
      error: 'Errore nell\'aggiunta del prodotto',
      message: error.message
    });
  }
});

/**
 * DELETE /api/udc/:udcId/items/:itemId
 * Rimuovi prodotto da UDC
 */
router.delete('/:udcId/items/:itemId', async (req, res) => {
  try {
    const pool = await getPool();
    const { udcId, itemId } = req.params;

    console.log(`[DELETE /api/udc/${udcId}/items/${itemId}] Removing item`);

    // Validate product exists and belongs to UDC
    const prodResult = await pool.request()
      .input('id', itemId)
      .input('idUdc', udcId)
      .query(`
        SELECT id, quantita, idArticolo
        FROM Prodotto
        WHERE id = @id AND idUdc = @idUdc AND recordCancellato = 0
      `);

    if (prodResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Prodotto non trovato nell\'UDC'
      });
    }

    // Check if product has reservations
    const reservResult = await pool.request()
      .input('idProdotto', itemId)
      .query(`
        SELECT COUNT(*) as count
        FROM Prenotazione
        WHERE idProdotto = @idProdotto AND evasa = 0
      `);

    if (reservResult.recordset[0].count > 0) {
      return res.status(400).json({
        success: false,
        error: 'Impossibile rimuovere prodotto con prenotazioni attive'
      });
    }

    // Soft delete product
    await pool.request()
      .input('id', itemId)
      .query(`
        UPDATE Prodotto
        SET recordCancellato = 1,
            dataCancellazione = GETDATE()
        WHERE id = @id
      `);

    res.json({
      success: true,
      data: {
        message: 'Prodotto rimosso dall\'UDC'
      }
    });

  } catch (error) {
    console.error(`[DELETE /api/udc/${req.params.udcId}/items/${req.params.itemId}] Error:`, error);
    res.status(500).json({
      success: false,
      error: 'Errore nella rimozione del prodotto',
      message: error.message
    });
  }
});

/**
 * POST /api/udc/:id/sort
 * Ordina i prodotti nell'UDC per FIFO o LIFO
 */
router.post('/:id/sort', async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;
    const { strategy = 'FIFO' } = req.body; // FIFO or LIFO

    console.log(`[POST /api/udc/${id}/sort] Sorting products by:`, strategy);

    // Validate UDC exists
    const udcResult = await pool.request()
      .input('id', id)
      .query('SELECT id, numeroUdc FROM Udc WHERE id = @id AND recordCancellato = 0');

    if (udcResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'UDC non trovata'
      });
    }

    // Get products sorted
    const orderBy = strategy === 'FIFO'
      ? 'P.scadenza ASC, P.dataCreazione ASC'
      : 'P.scadenza DESC, P.dataCreazione DESC';

    const prodResult = await pool.request()
      .input('idUdc', id)
      .query(`
        SELECT
          P.id,
          P.idArticolo,
          A.codice as articoloCodice,
          A.descrizione as articoloDescrizione,
          P.quantita,
          P.lotto,
          P.scadenza,
          P.dataCreazione
        FROM Prodotto P
        INNER JOIN Articoli A ON P.idArticolo = A.id
        WHERE P.idUdc = @idUdc AND P.recordCancellato = 0
        ORDER BY ${orderBy}
      `);

    res.json({
      success: true,
      data: {
        strategy: strategy,
        products: prodResult.recordset,
        total: prodResult.recordset.length
      }
    });

  } catch (error) {
    console.error(`[POST /api/udc/${req.params.id}/sort] Error:`, error);
    res.status(500).json({
      success: false,
      error: 'Errore nell\'ordinamento prodotti',
      message: error.message
    });
  }
});

export default router;
