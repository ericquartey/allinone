/**
 * PrenotatoreBase - Classe base per tutti i prenotatori
 * Replica PrenotatoreListaDefault.java
 */

import sql from 'mssql';

class PrenotatoreBase {
  constructor(config) {
    this.config = config;
    this.prenotatoriRiga = [];
  }

  /**
   * Tipo lista gestito (override nelle sottoclassi)
   * @returns {number}
   */
  getIdTipoLista() {
    throw new Error('getIdTipoLista() must be implemented in subclass');
  }

  /**
   * Accetta la lista? (override se necessario)
   * @param {Object} lista
   * @returns {boolean}
   */
  acceptLista(lista) {
    return true;
  }

  /**
   * Aggiunge un prenotatore di riga
   * @param {Object} prenotatoreRiga
   */
  addPrenotatoreRiga(prenotatoreRiga) {
    this.prenotatoriRiga.push(prenotatoreRiga);
  }

  /**
   * Trova il prenotatore di riga appropriato
   * @param {Object} riga
   * @returns {Object}
   */
  getPrenotatoreRiga(riga) {
    for (const prenotatore of this.prenotatoriRiga) {
      if (prenotatore.acceptRigaLista(riga)) {
        return prenotatore;
      }
    }
    throw new Error(`Nessun prenotatore di riga compatibile trovato per la riga ${riga.id}`);
  }

  /**
   * Carica lista completa con righe, prenotazioni, articoli
   * @param {Object} dbPool
   * @param {number} idLista
   * @param {Array} listIdRighe - Array di ID righe da processare (vuoto = tutte)
   * @returns {Object}
   */
  async populateLista(dbPool, idLista, listIdRighe = []) {
    const request = dbPool.request();
    request.input('idLista', sql.Int, idLista);

    let whereRighe = '';
    if (listIdRighe.length > 0) {
      whereRighe = `AND lr.id IN (${listIdRighe.join(',')})`;
    }

    const query = `
      SELECT
        l.id AS listaId,
        l.numLista,
        l.idTipoLista,
        l.idStatoControlloEvadibilita AS idStatoLista,
        CAST(0 AS int) AS priorita,
        l.prenotazioneIncrementale,
        l.listaNonEvadibile AS listaNonEvadibile,
        l.dataCreazione AS listaDataCreazione,

        lr.id AS rigaId,
        lr.numRigaLista AS numeroRiga,
        lr.sequenza AS rigaSequenza,
        lr.idProdotto,
        lr.idArticolo,
        lr.qtaRichiesta AS quantitaRichiesta,
        lr.qtaPrenotata,
        lr.qtaMovimentata AS qtaEvasa,
        lr.nonEvadibile AS rigaNonEvadibile,
        lr.idStatoRiga AS statoRiga,
        CAST(NULL AS int) AS idUbicazioneOrigine,
        CAST(NULL AS int) AS idUbicazioneDestinazione,
        lr.lotto,
        lr.matricola,

        p.id AS prenotazioneId,
        p.qtaPrenotata AS prenotazioneQta,
        p.idUdc,
        p.idSupporto,
        p.idLocazioneDestinazione AS prenotazioneUbicazione,
        p.dataInserimento AS prenotazioneDataCreazione,

        COALESCE(a.codice, lr.codice) AS prodottoCodice,
        COALESCE(a.descrizione, lr.descrizione) AS prodottoDescrizione,
        prod.qtaDisponibile AS prodottoQtaDisponibile,
        prod.qtaPrenotataOut AS prodottoQtaPrenotataOut

      FROM Liste l
        LEFT JOIN RigheLista lr ON l.id = lr.idLista AND lr.recordCancellato = 0 ${whereRighe}
        LEFT JOIN Prenotazioni p ON lr.id = p.idRigaLista
        LEFT JOIN Articoli a ON lr.idArticolo = a.id
        LEFT JOIN (
          SELECT
            idArticolo,
            SUM(qta) AS qtaDisponibile,
            SUM(ISNULL(qtaPrenotataOut, 0)) AS qtaPrenotataOut
          FROM UdcProdotti
          WHERE recordCancellato = 0
          GROUP BY idArticolo
        ) prod ON lr.idArticolo = prod.idArticolo
      WHERE l.id = @idLista
        AND l.recordCancellato = 0
      ORDER BY lr.numRigaLista, p.id
    `;

    const result = await request.query(query);

    // Ricostruisci struttura gerarchica
    const lista = {
      id: null,
      righe: new Map(),
      prenotazioniPersistenti: []
    };

    for (const row of result.recordset) {
      // Dati lista (prima riga)
      if (lista.id === null) {
        lista.id = row.listaId;
        lista.numLista = row.numLista;
        lista.idTipoLista = row.idTipoLista;
        lista.idStatoLista = row.idStatoLista;
        lista.priorita = row.priorita;
        lista.prenotazioneIncrementale = row.prenotazioneIncrementale;
        lista.nonEvadibile = row.listaNonEvadibile;
        lista.dataCreazione = row.listaDataCreazione;
      }

      // Dati riga
      if (row.rigaId && !lista.righe.has(row.rigaId)) {
        lista.righe.set(row.rigaId, {
          id: row.rigaId,
          idLista: row.listaId,
          idTipoLista: row.idTipoLista,
          idStatoLista: row.idStatoLista,
          prioritaLista: row.priorita,
          listaNonEvadibile: row.listaNonEvadibile,
          numeroRiga: row.numeroRiga,
          sequenzaRiga: row.rigaSequenza,
          idProdotto: row.idProdotto,
          idArticolo: row.idArticolo,
          quantitaRichiesta: parseFloat(row.quantitaRichiesta ?? 0),
          qtaPrenotata: parseFloat(row.qtaPrenotata ?? 0),
          qtaEvasa: parseFloat(row.qtaEvasa ?? 0),
          nonEvadibile: row.rigaNonEvadibile,
          statoRiga: row.statoRiga,
          idUbicazioneOrigine: row.idUbicazioneOrigine,
          idUbicazioneDestinazione: row.idUbicazioneDestinazione,
          lotto: row.lotto,
          matricola: row.matricola,
          prodotto: {
            codice: row.prodottoCodice,
            descrizione: row.prodottoDescrizione,
            qtaDisponibile: parseFloat(row.prodottoQtaDisponibile || 0),
            qtaPrenotataOut: parseFloat(row.prodottoQtaPrenotataOut || 0)
          },
          prenotazioni: []
        });
      }

      // Dati prenotazione
      if (row.prenotazioneId) {
        const riga = lista.righe.get(row.rigaId);
        const prenotazione = {
          id: row.prenotazioneId,
          idRigaLista: row.rigaId,
          quantita: parseFloat(row.prenotazioneQta ?? 0),
          idUdc: row.idUdc,
          idSupporto: row.idSupporto,
          idUbicazione: row.prenotazioneUbicazione,
          dataCreazione: row.prenotazioneDataCreazione,
          persistita: true
        };

        riga.prenotazioni.push(prenotazione);
        lista.prenotazioniPersistenti.push(prenotazione);
      }
    }

    // Converti Map in Array
    lista.righe = Array.from(lista.righe.values());

    return lista;
  }

  /**
   * Gestione prenotazione non incrementale
   * Cancella tutte le prenotazioni esistenti se richiesto
   */
  async gestionePrenotazioneListaNonIncrementale(dbPool, idLista, listIdRighe = []) {
    const request = dbPool.request();
    request.input('idLista', sql.Int, idLista);

    let whereRighe = '';
    if (listIdRighe.length > 0) {
      whereRighe = `AND lr.id IN (${listIdRighe.join(',')})`;
    }

    const deleteQuery = `
      DELETE FROM Prenotazioni
      WHERE idRigaLista IN (
        SELECT lr.id
        FROM RigheLista lr
        WHERE lr.idLista = @idLista
          AND lr.recordCancellato = 0
          ${whereRighe}
      )
    `;

    await request.query(deleteQuery);
    console.log(`[PrenotatoreBase] Prenotazioni esistenti cancellate per lista ${idLista}`);
  }

  /**
   * METODO PRINCIPALE: Prenota lista
   * @param {Object} lista
   * @param {Object} dbPool
   * @returns {Object} result con { prenotazioniCreated, nonEvadibile, errors }
   */
  async prenotaLista(lista, dbPool) {
    const result = {
      prenotazioniCreated: 0,
      nonEvadibile: false,
      errors: [],
      righeProcessate: 0,
      righeNonEvadibili: 0
    };

    try {
      console.log(`[${this.constructor.name}] Prenotazione lista ${lista.numLista} (ID: ${lista.id})`);

      // 1. Gestione prenotazione non incrementale
      if (!lista.prenotazioneIncrementale) {
        await this.gestionePrenotazioneListaNonIncrementale(dbPool, lista.id);
      }

      // 2. Populate lista completa
      const listaCompleta = await this.populateLista(dbPool, lista.id);

      // 3. Itera sulle righe e prenota
      for (const riga of listaCompleta.righe) {
        try {
          // Calcola quantità rimanente da prenotare
          const qtaRimanente = riga.quantitaRichiesta - riga.qtaPrenotata;

          if (qtaRimanente <= 0) {
            console.log(`  [Riga ${riga.numeroRiga}] Già completamente prenotata`);
            continue;
          }

          console.log(`  [Riga ${riga.numeroRiga}] Richiesta: ${riga.quantitaRichiesta}, Prenotata: ${riga.qtaPrenotata}, Rimanente: ${qtaRimanente}`);

          // Trova prenotatore riga appropriato
          const prenotatoreRiga = this.getPrenotatoreRiga(riga);

          // Esegui prenotazione riga
          const rigaResult = await prenotatoreRiga.prenotaRiga(riga, qtaRimanente, dbPool);

          result.prenotazioniCreated += rigaResult.prenotazioniCreated;
          result.righeProcessate++;

          if (rigaResult.nonEvadibile) {
            result.righeNonEvadibili++;
            result.nonEvadibile = true;

            // Segna riga come non evadibile
            await this.marcaRigaNonEvadibile(dbPool, riga.id, rigaResult.motivazione, rigaResult.qtaMancante);
          } else {
            // Rimuovi flag non evadibile se presente
            await this.rimuoviRigaNonEvadibile(dbPool, riga.id);
          }

        } catch (error) {
          console.error(`  [Riga ${riga.numeroRiga}] Errore:`, error.message);
          result.errors.push({
            rigaId: riga.id,
            numeroRiga: riga.numeroRiga,
            error: error.message
          });
        }
      }

      // 4. Aggiorna stato lista
      await this.aggiornaStatoLista(dbPool, lista.id, result.nonEvadibile);

      console.log(`[${this.constructor.name}] ✅ Lista ${lista.numLista} completata - ${result.prenotazioniCreated} prenotazioni create`);

      return result;

    } catch (error) {
      console.error(`[${this.constructor.name}] ❌ Errore prenotazione lista:`, error);
      throw error;
    }
  }

  /**
   * Marca una riga come non evadibile
   */
  async marcaRigaNonEvadibile(dbPool, idRigaLista, motivazione, qtaMancante) {
    const request = dbPool.request();

    // 1. Aggiorna flag su RigheLista
    await request
      .input('idRigaLista', sql.Int, idRigaLista)
      .query(`
        UPDATE RigheLista
        SET nonEvadibile = 1
        WHERE id = @idRigaLista
      `);

    // 2. Inserisci in RigheListaInevadibili (se non esiste già)
    await dbPool.request()
      .input('idRigaLista', sql.Int, idRigaLista)
      .input('motivazione', sql.NVarChar, motivazione)
      .input('qtaMancante', sql.Decimal(18, 3), qtaMancante)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM RigheListaInevadibili WHERE idRigaLista = @idRigaLista)
        BEGIN
          INSERT INTO RigheListaInevadibili (idRigaLista, idLista, prenotabile, messaggio, data)
          VALUES (
            @idRigaLista,
            (SELECT idLista FROM RigheLista WHERE id = @idRigaLista),
            'NO',
            @motivazione,
            GETDATE()
          )
        END
      `);
  }

  /**
   * Rimuovi flag non evadibile da riga
   */
  async rimuoviRigaNonEvadibile(dbPool, idRigaLista) {
    const request = dbPool.request();

    await request
      .input('idRigaLista', sql.Int, idRigaLista)
      .query(`
        UPDATE RigheLista
        SET nonEvadibile = 0
        WHERE id = @idRigaLista
      `);

    await dbPool.request()
      .input('idRigaLista', sql.Int, idRigaLista)
      .query(`
        DELETE FROM RigheListaInevadibili
        WHERE idRigaLista = @idRigaLista
      `);
  }

  /**
   * Aggiorna stato lista dopo prenotazione
   */
  async aggiornaStatoLista(dbPool, idLista, nonEvadibile) {
    const request = dbPool.request();
    request.input('idLista', sql.Int, idLista);
    request.input('nonEvadibile', sql.Bit, nonEvadibile ? 1 : 0);

    // Stato 2 = PRENOTATA, 3 = PARZIALMENTE_PRENOTATA
    const nuovoStato = nonEvadibile ? 3 : 2;

    await request
      .input('nuovoStato', sql.Int, nuovoStato)
      .query(`
        UPDATE Liste
        SET idStatoControlloEvadibilita = @nuovoStato,
            listaNonEvadibile = @nonEvadibile,
            dataModifica = GETDATE()
        WHERE id = @idLista
      `);
  }
}

export default PrenotatoreBase;
