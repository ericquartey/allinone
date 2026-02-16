/**
 * PrenotatoreRigaProdotto - Prenotazione per prodotti (FIFO)
 * Replica PrenotatoreRigaPickingProdottoInteroDefault.java
 */

import sql from 'mssql';

class PrenotatoreRigaProdotto {
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Accetta la riga lista?
   * @param {Object} riga
   * @returns {boolean}
   */
  acceptRigaLista(riga) {
    // Accetta righe con idArticolo specificato
    return riga.idArticolo != null;
  }

  /**
   * Prenota la riga
   * @param {Object} riga
   * @param {number} qtaRimanente
   * @param {Object} dbPool
   * @returns {Object}
   */
  async prenotaRiga(riga, qtaRimanente, dbPool) {
    const result = {
      prenotazioniCreated: 0,
      qtaPrenotata: 0,
      qtaMancante: qtaRimanente,
      nonEvadibile: false,
      motivazione: null
    };

    try {
      console.log(`    [PrenotatoreRigaProdotto] Prenotazione ${qtaRimanente} unità di articolo ${riga.idArticolo}`);

      // Query prodotti disponibili con FIFO
      const query = `
        SELECT TOP 100
          up.id AS prodottoId,
          up.idArticolo,
          up.codice,
          up.lotto,
          up.matricola,
          up.qta AS qtaDisponibile,
          ISNULL(up.qtaPrenotataOut, 0) AS qtaPrenotataOut,
          up.qta - ISNULL(up.qtaPrenotataOut, 0) AS qtaLibera,
          up.idUdc,
          up.idSupporto,
          u.idLocazione,
          u.dataIngressoMagazzino AS dataIngresso,
          COALESCE(loc.descrizione, loc.barcode) AS ubicazioneCodice
        FROM UdcProdotti up
          INNER JOIN Udc u ON up.idUdc = u.id
          LEFT JOIN Locazioni loc ON u.idLocazione = loc.id
        WHERE up.idArticolo = @idArticolo
          AND up.recordCancellato = 0
          AND u.recordCancellato = 0
          AND up.qta > 0
          AND up.qta > ISNULL(up.qtaPrenotataOut, 0)
          AND COALESCE(loc.abilitataPicking, 1) = 1
        ORDER BY
          COALESCE(loc.id, 0) ASC,
          u.dataIngressoMagazzino ASC
      `;

      const request = dbPool.request();
      request.input('idArticolo', sql.Int, riga.idArticolo);

      const prodottiResult = await request.query(query);

      if (prodottiResult.recordset.length === 0) {
        console.log(`    ⚠️ Nessun prodotto disponibile per idArticolo ${riga.idArticolo}`);
        result.nonEvadibile = true;
        result.motivazione = 'Stock insufficiente - nessun prodotto disponibile';
        return result;
      }

      // Itera sui prodotti e crea prenotazioni
      let qtaDaPrenotare = qtaRimanente;

      for (const prodotto of prodottiResult.recordset) {
        if (qtaDaPrenotare <= 0) break;

        const qtaPrenotabileQui = Math.min(qtaDaPrenotare, prodotto.qtaLibera);

        if (qtaPrenotabileQui <= 0) continue;

        // Crea prenotazione
        const insertRequest = dbPool.request();
        insertRequest.input('idRigaLista', sql.Int, riga.id);
        insertRequest.input('idLista', sql.Int, riga.idLista);
        insertRequest.input('idTipoLista', sql.Int, riga.idTipoLista);
        insertRequest.input('idStatoLista', sql.Int, riga.idStatoLista ?? 1);
        insertRequest.input('idStatoRiga', sql.Int, riga.statoRiga ?? 1);
        insertRequest.input('listaNonEvadibile', sql.Bit, riga.listaNonEvadibile ? 1 : 0);
        insertRequest.input('rigaNonEvadibile', sql.Bit, riga.nonEvadibile ? 1 : 0);
        insertRequest.input('prioritaLista', sql.Int, riga.prioritaLista || 0);
        insertRequest.input('sequenzaLancioLista', sql.Int, 0);
        insertRequest.input('sequenzaRiga', sql.Int, riga.sequenzaRiga || 0);
        insertRequest.input('sequenzaEsecuzione', sql.Int, riga.sequenzaRiga || 0);
        insertRequest.input('qtaRigaLista', sql.Decimal(18, 3), riga.quantitaRichiesta);
        insertRequest.input('qtaPrenotata', sql.Decimal(18, 3), qtaPrenotabileQui);
        insertRequest.input('qtaMovimentata', sql.Decimal(18, 3), 0);
        insertRequest.input('idProdotto', sql.Int, prodotto.prodottoId);
        insertRequest.input('idArticolo', sql.Int, prodotto.idArticolo);
        insertRequest.input('codice', sql.NVarChar, prodotto.codice);
        insertRequest.input('lotto', sql.NVarChar, prodotto.lotto);
        insertRequest.input('matricola', sql.NVarChar, prodotto.matricola);
        insertRequest.input('idUdc', sql.Int, prodotto.idUdc);
        insertRequest.input('idSupporto', sql.Int, prodotto.idSupporto);
        insertRequest.input('idLocazioneDestinazione', sql.Int, prodotto.idLocazione);
        insertRequest.input('abilitata', sql.Bit, 1);
        insertRequest.input('statoConsolidamento', sql.Int, 0);
        insertRequest.input('version', sql.Int, 1);

        await insertRequest.query(`
          INSERT INTO Prenotazioni (
            idUdc, idSupporto, idProdotto, idArticolo, codice, lotto, matricola,
            idLista, idRigaLista, idStatoLista, idTipoLista, idStatoRiga,
            abilitata, statoConsolidamento, prioritaLista, sequenzaLancioLista,
            sequenzaRiga, listaNonEvadibile, rigaNonEvadibile, sequenzaEsecuzione,
            qtaPrenotata, qtaRigaLista, qtaMovimentata, dataInserimento,
            idLocazioneDestinazione, version
          )
          VALUES (
            @idUdc, @idSupporto, @idProdotto, @idArticolo, @codice, @lotto, @matricola,
            @idLista, @idRigaLista, @idStatoLista, @idTipoLista, @idStatoRiga,
            @abilitata, @statoConsolidamento, @prioritaLista, @sequenzaLancioLista,
            @sequenzaRiga, @listaNonEvadibile, @rigaNonEvadibile, @sequenzaEsecuzione,
            @qtaPrenotata, @qtaRigaLista, @qtaMovimentata, GETDATE(),
            @idLocazioneDestinazione, @version
          )
        `);

        await dbPool.request()
          .input('idProdotto', sql.Int, prodotto.prodottoId)
          .input('qtaPrenotata', sql.Decimal(18, 3), qtaPrenotabileQui)
          .query(`
            UPDATE UdcProdotti
            SET qtaPrenotataOut = ISNULL(qtaPrenotataOut, 0) + @qtaPrenotata
            WHERE id = @idProdotto
          `);

        result.prenotazioniCreated++;
        result.qtaPrenotata += qtaPrenotabileQui;
        qtaDaPrenotare -= qtaPrenotabileQui;

        console.log(`      ✅ Prenotati ${qtaPrenotabileQui} da UDC ${prodotto.idUdc} in ${prodotto.ubicazioneCodice}`);
      }

      // Aggiorna qtaPrenotata sulla riga
      await dbPool.request()
        .input('idRigaLista', sql.Int, riga.id)
        .input('qtaPrenotata', sql.Decimal(18, 3), riga.qtaPrenotata + result.qtaPrenotata)
        .query(`
          UPDATE RigheLista
          SET qtaPrenotata = @qtaPrenotata
          WHERE id = @idRigaLista
        `);

      result.qtaMancante = qtaDaPrenotare;

      if (qtaDaPrenotare > 0) {
        result.nonEvadibile = true;
        result.motivazione = `Stock insufficiente - mancanti ${qtaDaPrenotare} unità`;
        console.log(`    ⚠️ Riga parzialmente evadibile - mancanti ${qtaDaPrenotare}`);
      } else {
        console.log(`    ✅ Riga completamente prenotata`);
      }

      return result;

    } catch (error) {
      console.error('    ❌ Errore prenotazione riga:', error);
      throw error;
    }
  }
}

export default PrenotatoreRigaProdotto;

