// ============================================================================
// EJLOG WMS - AI Action Executor
// Esegue azioni operative in base ai comandi AI
// ============================================================================

import { getPool } from '../../db-config.js';
import { broadcast } from '../../websocket-server.js';

/**
 * AI Action Executor - Traduce intent AI in azioni operative
 */
class AIActionExecutor {
  constructor() {
    this.pool = null;
  }

  /**
   * Inizializza connessione database
   */
  async init() {
    this.pool = await getPool();
    console.log('[AI Action Executor] ✅ Service initialized');
  }

  /**
   * Esegue un'azione basata su intent e parametri
   * @param {string} intent - Tipo di azione (FIND_ARTICLE, CLOSE_DRAWER, RETURN_TO_CELL, etc.)
   * @param {Object} params - Parametri dell'azione
   * @returns {Promise<Object>} - Risultato dell'azione
   */
  async executeAction(intent, params) {
    console.log(`[AI Action] Executing: ${intent}`, params);

    try {
      switch (intent) {
        case 'FIND_ARTICLE':
          return await this.findArticle(params);

        case 'FIND_DRAWER':
          return await this.findDrawer(params);

        case 'GET_DRAWER_STATUS':
          return await this.getDrawerStatus(params);

        case 'CLOSE_DRAWER':
          return await this.closeDrawer(params);

        case 'OPEN_DRAWER':
          return await this.openDrawer(params);

        case 'CALL_DRAWER':
          return await this.callDrawer(params);

        case 'RETURN_TO_CELL':
          return await this.returnToCell(params);

        case 'GET_MACHINE_STATUS':
          return await this.getMachineStatus(params);

        case 'GET_COMPARTMENT_INFO':
          return await this.getCompartmentInfo(params);

        case 'SEARCH_PRODUCT':
          return await this.searchProduct(params);

        case 'GET_LIST_STATUS':
          return await this.getListStatus(params);

        case 'SET_LIST_WAITING':
          return await this.setListWaiting(params);

        case 'SET_LIST_IN_PROGRESS':
          return await this.setListInProgress(params);

        case 'SET_LIST_COMPLETED':
          return await this.setListCompleted(params);

        case 'GET_LISTS_OVERVIEW':
          return await this.getListsOverview(params);

        case 'GET_ITEMS_OVERVIEW':
          return await this.getItemsOverview(params);

        case 'GET_ITEM_STOCK':
          return await this.getItemStock(params);

        case 'GET_DRAWERS_OVERVIEW':
          return await this.getDrawersOverview(params);

        case 'EXECUTE_LIST':
          return await this.executeList(params);

        case 'BOOK_LIST':
          return await this.bookList(params);

        case 'TERMINATE_LIST':
          return await this.terminateList(params);

        case 'REVIVE_LIST':
          return await this.reviveList(params);

        case 'SET_LIST_UNPROCESSABLE':
          return await this.setListUnprocessable(params);

        default:
          return {
            success: false,
            error: `Intent non riconosciuto: ${intent}`,
          };
      }
    } catch (error) {
      console.error(`[AI Action] Error executing ${intent}:`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Trova un articolo nel magazzino
   */
  async findArticle(params) {
    const { articleCode, articleDescription } = params;

    const query = `
      SELECT TOP 10
        a.CodArticolo,
        a.DesArticolo,
        c.CodiceUDC,
        c.NomeUDC,
        comp.CodMacchina,
        comp.IdCompartimento,
        comp.Contenuto,
        comp.Percentuale,
        m.DesMacchina
      FROM Articoli a
      LEFT JOIN Compartimenti comp ON a.CodArticolo = comp.Contenuto
      LEFT JOIN Cassetti c ON comp.CodiceUDC = c.CodiceUDC
      LEFT JOIN MacchineEjLog m ON comp.CodMacchina = m.CodMacchina
      WHERE
        ${articleCode ? 'a.CodArticolo LIKE @articleCode' : 'a.DesArticolo LIKE @description'}
      ORDER BY a.CodArticolo
    `;

    const result = await this.pool.request()
      .input('articleCode', `%${articleCode || ''}%`)
      .input('description', `%${articleDescription || ''}%`)
      .query(query);

    if (result.recordset.length === 0) {
      return {
        success: false,
        message: `Articolo ${articleCode || articleDescription} non trovato nel sistema`,
      };
    }

    return {
      success: true,
      message: `Trovati ${result.recordset.length} risultati per "${articleCode || articleDescription}"`,
      data: result.recordset.map(row => ({
        articleCode: row.CodArticolo,
        articleDescription: row.DesArticolo,
        drawer: row.CodiceUDC,
        drawerName: row.NomeUDC,
        machine: row.CodMacchina,
        machineDescription: row.DesMacchina,
        compartment: row.IdCompartimento,
        quantity: row.Contenuto,
        fillPercentage: row.Percentuale,
      })),
    };
  }

  /**
   * Trova informazioni su un cassetto
   */
  async findDrawer(params) {
    const { drawerCode } = params;

    const query = `
      SELECT
        c.CodiceUDC,
        c.NomeUDC,
        c.StatoUDC,
        c.CodMacchina,
        m.DesMacchina,
        COUNT(comp.IdCompartimento) as NumCompartimenti,
        AVG(comp.Percentuale) as PercentualeMedia
      FROM Cassetti c
      LEFT JOIN MacchineEjLog m ON c.CodMacchina = m.CodMacchina
      LEFT JOIN Compartimenti comp ON c.CodiceUDC = comp.CodiceUDC
      WHERE c.CodiceUDC LIKE @drawerCode
      GROUP BY c.CodiceUDC, c.NomeUDC, c.StatoUDC, c.CodMacchina, m.DesMacchina
    `;

    const result = await this.pool.request()
      .input('drawerCode', `%${drawerCode}%`)
      .query(query);

    if (result.recordset.length === 0) {
      return {
        success: false,
        message: `Cassetto ${drawerCode} non trovato`,
      };
    }

    const drawer = result.recordset[0];
    return {
      success: true,
      message: `Cassetto ${drawer.CodiceUDC} trovato`,
      data: {
        drawerCode: drawer.CodiceUDC,
        drawerName: drawer.NomeUDC,
        status: drawer.StatoUDC,
        machine: drawer.CodMacchina,
        machineDescription: drawer.DesMacchina,
        compartmentCount: drawer.NumCompartimenti,
        averageFill: Math.round(drawer.PercentualeMedia || 0),
      },
    };
  }

  /**
   * Ottiene stato di un cassetto
   */
  async getDrawerStatus(params) {
    const { drawerCode } = params;

    const query = `
      SELECT
        c.CodiceUDC,
        c.NomeUDC,
        c.StatoUDC,
        c.CodMacchina,
        comp.IdCompartimento,
        comp.Contenuto,
        comp.Percentuale,
        a.DesArticolo
      FROM Cassetti c
      LEFT JOIN Compartimenti comp ON c.CodiceUDC = comp.CodiceUDC
      LEFT JOIN Articoli a ON comp.Contenuto = a.CodArticolo
      WHERE c.CodiceUDC = @drawerCode
      ORDER BY comp.IdCompartimento
    `;

    const result = await this.pool.request()
      .input('drawerCode', drawerCode)
      .query(query);

    if (result.recordset.length === 0) {
      return {
        success: false,
        message: `Cassetto ${drawerCode} non trovato`,
      };
    }

    const compartments = result.recordset.map(row => ({
      compartmentId: row.IdCompartimento,
      content: row.Contenuto,
      articleDescription: row.DesArticolo,
      fillPercentage: row.Percentuale,
    }));

    return {
      success: true,
      message: `Stato cassetto ${drawerCode}`,
      data: {
        drawerCode: result.recordset[0].CodiceUDC,
        drawerName: result.recordset[0].NomeUDC,
        status: result.recordset[0].StatoUDC,
        machine: result.recordset[0].CodMacchina,
        compartments: compartments,
      },
    };
  }

  /**
   * Chiude un cassetto (simula comando macchina)
   */
  async closeDrawer(params) {
    const { drawerCode } = params;

    // Verifica che il cassetto esista
    const checkQuery = `
      SELECT CodiceUDC, StatoUDC, CodMacchina
      FROM Cassetti
      WHERE CodiceUDC = @drawerCode
    `;

    const checkResult = await this.pool.request()
      .input('drawerCode', drawerCode)
      .query(checkQuery);

    if (checkResult.recordset.length === 0) {
      return {
        success: false,
        message: `Cassetto ${drawerCode} non trovato`,
      };
    }

    const drawer = checkResult.recordset[0];

    // TODO: Qui andrà integrato il comando reale alla macchina
    // Per ora simulo l'azione
    console.log(`[AI Action] Chiusura cassetto ${drawerCode} su macchina ${drawer.CodMacchina}`);

    return {
      success: true,
      message: `Comando di chiusura inviato al cassetto ${drawerCode} su macchina ${drawer.CodMacchina}`,
      data: {
        drawerCode: drawer.CodiceUDC,
        machine: drawer.CodMacchina,
        action: 'CLOSE',
        status: 'SENT',
      },
      actionRequired: {
        type: 'MACHINE_COMMAND',
        command: 'CLOSE_DRAWER',
        params: {
          machine: drawer.CodMacchina,
          drawer: drawerCode,
        },
      },
    };
  }

  /**
   * Apre un cassetto
   */
  async openDrawer(params) {
    const { drawerCode } = params;

    const checkQuery = `
      SELECT CodiceUDC, StatoUDC, CodMacchina
      FROM Cassetti
      WHERE CodiceUDC = @drawerCode
    `;

    const checkResult = await this.pool.request()
      .input('drawerCode', drawerCode)
      .query(checkQuery);

    if (checkResult.recordset.length === 0) {
      return {
        success: false,
        message: `Cassetto ${drawerCode} non trovato`,
      };
    }

    const drawer = checkResult.recordset[0];

    console.log(`[AI Action] Apertura cassetto ${drawerCode} su macchina ${drawer.CodMacchina}`);

    return {
      success: true,
      message: `Comando di apertura inviato al cassetto ${drawerCode} su macchina ${drawer.CodMacchina}`,
      data: {
        drawerCode: drawer.CodiceUDC,
        machine: drawer.CodMacchina,
        action: 'OPEN',
        status: 'SENT',
      },
      actionRequired: {
        type: 'MACHINE_COMMAND',
        command: 'OPEN_DRAWER',
        params: {
          machine: drawer.CodMacchina,
          drawer: drawerCode,
        },
      },
    };
  }

  /**
   * Richiama un cassetto/UDC in baia usando l'endpoint EjLog
   */
  async callDrawer(params) {
    const { drawerId, drawerCode } = params || {};
    let resolvedId = Number(drawerId);
    let resolvedCode = drawerCode;

    if (!Number.isFinite(resolvedId)) {
      resolvedId = null;
    }

    if (!resolvedId && drawerCode) {
      const code = String(drawerCode).trim();
      const numericCode = Number(code);

      try {
        const result = await this.pool.request()
          .input('code', code)
          .input('numericCode', Number.isFinite(numericCode) ? numericCode : null)
          .query(`
            SELECT TOP 1 id, numeroUdc, barcode
            FROM UDC
            WHERE (numeroUdc = @code OR barcode = @code)
               OR (id = @numericCode)
          `);

        if (result.recordset.length > 0) {
          const row = result.recordset[0];
          resolvedId = row.id;
          resolvedCode = row.numeroUdc || row.barcode || code;
        }
      } catch (error) {
        console.warn('[AI Action] Unable to resolve drawer from UDC table:', error?.message || error);
      }
    }

    if (!resolvedId && drawerCode) {
      const numericCode = Number(drawerCode);
      if (Number.isFinite(numericCode)) {
        resolvedId = numericCode;
      }
    }

    if (!resolvedId) {
      return {
        success: false,
        message: `Cassetto ${drawerCode || drawerId} non trovato`,
      };
    }

    const baseUrl = (process.env.EJLOG_LEGACY_BASE_URL || process.env.EJLOG_BASE_URL || 'http://localhost:7077')
      .replace(/\/+$/, '');
    const url = `${baseUrl}/EjLogHostVertimag/api/loading-units/${resolvedId}/call`;

    const response = await fetch(url, { method: 'POST' });
    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Call loading unit failed: HTTP ${response.status}${errorText ? ` - ${errorText}` : ''}`);
    }

    const data = await response.json().catch(() => null);

    return {
      success: true,
      message: `Richiamo cassetto ${resolvedCode || resolvedId} inviato`,
      data: data || { drawerId: resolvedId },
    };
  }

  /**
   * Riporta un cassetto in cella
   */
  async returnToCell(params) {
    const { drawerCode } = params;

    const checkQuery = `
      SELECT CodiceUDC, StatoUDC, CodMacchina
      FROM Cassetti
      WHERE CodiceUDC = @drawerCode
    `;

    const checkResult = await this.pool.request()
      .input('drawerCode', drawerCode)
      .query(checkQuery);

    if (checkResult.recordset.length === 0) {
      return {
        success: false,
        message: `Cassetto ${drawerCode} non trovato`,
      };
    }

    const drawer = checkResult.recordset[0];

    console.log(`[AI Action] Riporto in cella cassetto ${drawerCode} su macchina ${drawer.CodMacchina}`);

    return {
      success: true,
      message: `Comando di ritorno in cella inviato per cassetto ${drawerCode} su macchina ${drawer.CodMacchina}`,
      data: {
        drawerCode: drawer.CodiceUDC,
        machine: drawer.CodMacchina,
        action: 'RETURN_TO_CELL',
        status: 'SENT',
      },
      actionRequired: {
        type: 'MACHINE_COMMAND',
        command: 'RETURN_TO_CELL',
        params: {
          machine: drawer.CodMacchina,
          drawer: drawerCode,
        },
      },
    };
  }

  /**
   * Ottiene stato di una macchina
   */
  async getMachineStatus(params) {
    const { machineId } = params;

    const query = `
      SELECT
        m.CodMacchina,
        m.DesMacchina,
        m.StatoMacchina,
        m.TipoMacchina,
        COUNT(DISTINCT c.CodiceUDC) as NumCassetti,
        COUNT(comp.IdCompartimento) as NumCompartimenti
      FROM MacchineEjLog m
      LEFT JOIN Cassetti c ON m.CodMacchina = c.CodMacchina
      LEFT JOIN Compartimenti comp ON c.CodiceUDC = comp.CodiceUDC
      WHERE m.CodMacchina LIKE @machineId
      GROUP BY m.CodMacchina, m.DesMacchina, m.StatoMacchina, m.TipoMacchina
    `;

    const result = await this.pool.request()
      .input('machineId', `%${machineId}%`)
      .query(query);

    if (result.recordset.length === 0) {
      return {
        success: false,
        message: `Macchina ${machineId} non trovata`,
      };
    }

    const machine = result.recordset[0];
    return {
      success: true,
      message: `Stato macchina ${machine.CodMacchina}`,
      data: {
        machineId: machine.CodMacchina,
        description: machine.DesMacchina,
        status: machine.StatoMacchina,
        type: machine.TipoMacchina,
        drawerCount: machine.NumCassetti,
        compartmentCount: machine.NumCompartimenti,
      },
    };
  }

  /**
   * Ottiene informazioni su un compartimento
   */
  async getCompartmentInfo(params) {
    const { drawerCode, compartmentId } = params;

    const query = `
      SELECT
        comp.IdCompartimento,
        comp.CodiceUDC,
        comp.Contenuto,
        comp.Percentuale,
        a.DesArticolo,
        c.NomeUDC,
        c.CodMacchina
      FROM Compartimenti comp
      LEFT JOIN Articoli a ON comp.Contenuto = a.CodArticolo
      LEFT JOIN Cassetti c ON comp.CodiceUDC = c.CodiceUDC
      WHERE comp.CodiceUDC = @drawerCode
        AND comp.IdCompartimento = @compartmentId
    `;

    const result = await this.pool.request()
      .input('drawerCode', drawerCode)
      .input('compartmentId', compartmentId)
      .query(query);

    if (result.recordset.length === 0) {
      return {
        success: false,
        message: `Compartimento ${compartmentId} del cassetto ${drawerCode} non trovato`,
      };
    }

    const comp = result.recordset[0];
    return {
      success: true,
      message: `Informazioni compartimento ${compartmentId}`,
      data: {
        compartmentId: comp.IdCompartimento,
        drawerCode: comp.CodiceUDC,
        drawerName: comp.NomeUDC,
        machine: comp.CodMacchina,
        content: comp.Contenuto,
        articleDescription: comp.DesArticolo,
        fillPercentage: comp.Percentuale,
      },
    };
  }

  /**
   * Cerca un prodotto
   */
  async searchProduct(params) {
    const { searchTerm } = params;

    const query = `
      SELECT TOP 20
        a.CodArticolo,
        a.DesArticolo,
        COUNT(DISTINCT comp.CodiceUDC) as NumCassetti,
        SUM(comp.Percentuale) as QuantitaTotale
      FROM Articoli a
      LEFT JOIN Compartimenti comp ON a.CodArticolo = comp.Contenuto
      WHERE a.CodArticolo LIKE @searchTerm
         OR a.DesArticolo LIKE @searchTerm
      GROUP BY a.CodArticolo, a.DesArticolo
      ORDER BY a.CodArticolo
    `;

    const result = await this.pool.request()
      .input('searchTerm', `%${searchTerm}%`)
      .query(query);

    if (result.recordset.length === 0) {
      return {
        success: false,
        message: `Nessun prodotto trovato per "${searchTerm}"`,
      };
    }

    return {
      success: true,
      message: `Trovati ${result.recordset.length} prodotti per "${searchTerm}"`,
      data: result.recordset.map(row => ({
        articleCode: row.CodArticolo,
        description: row.DesArticolo,
        drawerCount: row.NumCassetti,
        totalQuantity: row.QuantitaTotale,
      })),
    };
  }

  /**
   * Ottiene stato di una lista
   */
  async getListStatus(params) {
    const { listId } = params;

    const result = await this.pool.request()
      .input('listId', Number(listId))
      .query(`
        SELECT TOP 1
          id as listId,
          numLista as listNumber,
          idStatoControlloEvadibilita as statusId,
          terminata as isCompleted,
          dataCreazione as createdAt,
          dataInizioEvasione as startedAt,
          dataFineEvasione as completedAt
        FROM Liste
        WHERE id = @listId
      `);

    if (result.recordset.length === 0) {
      return {
        success: false,
        message: `Lista ${listId} non trovata`,
      };
    }

    const list = result.recordset[0];
    return {
      success: true,
      message: `Stato lista ${list.listNumber}`,
      data: {
        listId: list.listId,
        listNumber: list.listNumber,
        status: this.mapListStatus(list.statusId, list.isCompleted),
        createdAt: list.createdAt,
        startedAt: list.startedAt,
        completedAt: list.completedAt,
      },
    };
  }

  /**
   * Imposta lista in attesa
   */
  async setListWaiting(params) {
    return await this.applyListStatus({
      listId: params?.listId,
      listNumber: params?.listNumber,
      statusId: 1,
      areaStatusId: 1,
      terminata: false,
      setStart: false,
      setEnd: false,
      action: 'waiting',
      messageSuffix: 'impostata in attesa',
    });
  }

  /**
   * Imposta lista in esecuzione
   */
  async setListInProgress(params) {
    return await this.executeList(params);
  }

  /**
   * Imposta lista completata
   */
  async setListCompleted(params) {
    return await this.applyListStatus({
      listId: params?.listId,
      listNumber: params?.listNumber,
      statusId: 3,
      areaStatusId: 3,
      terminata: true,
      setStart: false,
      setEnd: true,
      action: 'complete',
      messageSuffix: 'completata',
    });
  }

  /**
   * Esegue una lista (stato IN_PROGRESS e aggiornamento area details)
   */
  async executeList(params) {
    return await this.applyListStatus({
      listId: params?.listId,
      listNumber: params?.listNumber,
      statusId: 2,
      areaStatusId: 2,
      terminata: false,
      setStart: true,
      setEnd: false,
      action: 'execute',
      messageSuffix: 'in esecuzione',
    });
  }

  /**
   * Prenota una lista (stato WAITING/BOOKED)
   */
  async bookList(params) {
    const { listId } = params;
    const parsedId = Number(listId);

    if (!Number.isFinite(parsedId)) {
      return {
        success: false,
        message: `ID lista non valido: ${listId}`,
      };
    }

    const updateResult = await this.pool.request()
      .input('id', parsedId)
      .query(`
        UPDATE Liste
        SET idStatoControlloEvadibilita = 1,
            dataModifica = GETDATE()
        WHERE id = @id
      `);

    if (updateResult.rowsAffected[0] === 0) {
      return {
        success: false,
        message: `Lista ${listId} non trovata`,
      };
    }

    this.emitListUpdate(parsedId, 'book');

    return {
      success: true,
      message: `Lista ${listId} prenotata`,
      data: { listId, status: 'WAITING' },
    };
  }

  /**
   * Termina una lista
   */
  async terminateList(params) {
    return await this.applyListStatus({
      listId: params?.listId,
      listNumber: params?.listNumber,
      statusId: 3,
      areaStatusId: 3,
      terminata: true,
      setStart: false,
      setEnd: true,
      action: 'terminate',
      messageSuffix: 'terminata',
    });
  }

  /**
   * Riapre una lista terminata
   */
  async reviveList(params) {
    const { listId } = params;
    const parsedId = Number(listId);

    if (!Number.isFinite(parsedId)) {
      return {
        success: false,
        message: `ID lista non valido: ${listId}`,
      };
    }

    const statusResult = await this.pool.request().query(`
      SELECT
        (SELECT TOP 1 id FROM StatoRiga WHERE descrizione = 'Attiva') AS attivaId
    `);
    const attivaId = statusResult.recordset[0]?.attivaId;

    if (!attivaId) {
      return {
        success: false,
        message: 'Stato riga attiva non trovato',
      };
    }

    const transaction = this.pool.transaction();
    await transaction.begin();
    const request = transaction.request();
    request.input('listId', parsedId);
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

    this.emitListUpdate(parsedId, 'revive');

    return {
      success: true,
      message: `Lista ${listId} riesumata`,
      data: { listId, status: 'WAITING' },
    };
  }

  /**
   * Marca una lista come non evadibile
   */
  async setListUnprocessable(params) {
    const { listId } = params;
    const parsedId = Number(listId);

    if (!Number.isFinite(parsedId)) {
      return {
        success: false,
        message: `ID lista non valido: ${listId}`,
      };
    }

    const updateResult = await this.pool.request()
      .input('id', parsedId)
      .query(`
        UPDATE Liste
        SET listaNonEvadibile = 1,
            dataModifica = GETDATE()
        WHERE id = @id
      `);

    if (updateResult.rowsAffected[0] === 0) {
      return {
        success: false,
        message: `Lista ${listId} non trovata`,
      };
    }

    this.emitListUpdate(parsedId, 'unprocessable');

    return {
      success: true,
      message: `Lista ${listId} marcata come non evadibile`,
      data: { listId, status: 'UNPROCESSABLE' },
    };
  }

  emitListUpdate(listId, action) {
    try {
      broadcast({
        channel: 'lists',
        type: 'lists_update',
        action,
        listId,
        timestamp: new Date().toISOString(),
        source: 'ai',
      });
    } catch (error) {
      console.warn('[AI Action] Unable to broadcast list update:', error?.message || error);
    }
  }

  /**
   * Ritorna un riepilogo liste recenti
   */
  async getListsOverview(params) {
    const limit = Number(params?.limit) || 20;

    const result = await this.pool.request()
      .input('limit', limit)
      .query(`
        SELECT TOP (@limit)
          id as listId,
          numLista as listNumber,
          idTipoLista as listType,
          idStatoControlloEvadibilita as statusId,
          terminata as isCompleted,
          dataCreazione as createdAt
        FROM Liste
        ORDER BY dataCreazione DESC
      `);

    return {
      success: true,
      message: `Liste recenti: ${result.recordset.length}`,
      data: result.recordset.map((row) => ({
        listId: row.listId,
        listNumber: row.listNumber,
        type: row.listType,
        status: this.mapListStatus(row.statusId, row.isCompleted),
        createdAt: row.createdAt,
      })),
    };
  }

  /**
   * Ritorna un riepilogo articoli
   */
  async getItemsOverview(params) {
    const limit = Number(params?.limit) || 50;

    const result = await this.pool.request()
      .input('limit', limit)
      .query(`
        SELECT TOP (@limit)
          a.CodArticolo,
          a.DesArticolo
        FROM Articoli a
        ORDER BY a.CodArticolo
      `);

    return {
      success: true,
      message: `Articoli trovati: ${result.recordset.length}`,
      data: result.recordset.map((row) => ({
        code: row.CodArticolo,
        description: row.DesArticolo,
      })),
    };
  }

  /**
   * Ritorna giacenza per articolo
   */
  async getItemStock(params) {
    const { itemCode, itemId } = params || {};
    const parsedId = Number(itemId);
    let resolved = null;

    if (Number.isFinite(parsedId)) {
      const check = await this.pool.request()
        .input('id', parsedId)
        .query(`
          SELECT id, codice AS code, descrizione AS description
          FROM Articoli
          WHERE id = @id
        `);
      resolved = check.recordset[0] || null;
    }

    if (!resolved && itemCode) {
      const check = await this.pool.request()
        .input('code', String(itemCode))
        .query(`
          SELECT TOP 1 id, codice AS code, descrizione AS description
          FROM Articoli
          WHERE codice = @code
        `);
      resolved = check.recordset[0] || null;
    }

    if (!resolved) {
      return {
        success: false,
        message: `Articolo ${itemCode || itemId} non trovato`,
      };
    }

    const stockResult = await this.pool.request()
      .input('itemId', resolved.id)
      .query(`
        SELECT
          UP.idArticolo AS itemId,
          L.id AS locationId,
          L.barcode AS locationCode,
          L.descrizione AS locationDescription,
          U.id AS udcId,
          U.numeroUdc AS udcNumber,
          U.barcode AS udcBarcode,
          S.id AS compartmentId,
          S.coordinate AS compartmentCode,
          S.barcode AS compartmentBarcode,
          UP.qta AS quantity,
          UP.qtaPrenotataOut AS reservedQuantity,
          (UP.qta - UP.qtaPrenotataOut) AS availableQuantity
        FROM UdcProdotti UP
        INNER JOIN Udc U ON UP.idUdc = U.id
        LEFT JOIN UdcSupporti S ON UP.idSupporto = S.id
        LEFT JOIN Locazioni L ON U.idLocazione = L.id
        WHERE UP.idArticolo = @itemId AND UP.recordCancellato = 0
        ORDER BY L.barcode, U.numeroUdc
      `);

    const rows = stockResult.recordset || [];
    const totals = rows.reduce((acc, row) => {
      acc.quantity += Number(row.quantity || 0);
      acc.reservedQuantity += Number(row.reservedQuantity || 0);
      acc.availableQuantity += Number(row.availableQuantity || 0);
      return acc;
    }, { quantity: 0, reservedQuantity: 0, availableQuantity: 0 });

    return {
      success: true,
      message: `Giacenza articolo ${resolved.code}`,
      data: {
        itemId: resolved.id,
        code: resolved.code,
        description: resolved.description,
        totals,
        details: rows,
      },
    };
  }

  /**
   * Ritorna un riepilogo cassetti/UDC
   */
  async getDrawersOverview(params) {
    const limit = Number(params?.limit) || 50;

    const result = await this.pool.request()
      .input('limit', limit)
      .query(`
        SELECT TOP (@limit)
          c.CodiceUDC,
          c.NomeUDC,
          c.StatoUDC,
          c.CodMacchina,
          COUNT(comp.IdCompartimento) as NumCompartimenti,
          AVG(comp.Percentuale) as PercentualeMedia
        FROM Cassetti c
        LEFT JOIN Compartimenti comp ON c.CodiceUDC = comp.CodiceUDC
        GROUP BY c.CodiceUDC, c.NomeUDC, c.StatoUDC, c.CodMacchina
        ORDER BY c.CodiceUDC
      `);

    return {
      success: true,
      message: `Cassetti trovati: ${result.recordset.length}`,
      data: result.recordset.map((row) => ({
        drawerCode: row.CodiceUDC,
        drawerName: row.NomeUDC,
        status: row.StatoUDC,
        machine: row.CodMacchina,
        compartmentCount: row.NumCompartimenti,
        averageFill: Math.round(row.PercentualeMedia || 0),
      })),
    };
  }

  mapListStatus(statusId, isCompleted) {
    if (isCompleted) return 'COMPLETED';
    switch (statusId) {
      case 1:
        return 'WAITING';
      case 2:
        return 'IN_PROGRESS';
      case 3:
        return 'COMPLETED';
      default:
        return 'WAITING';
    }
  }

  async resolveListId({ listId, listNumber }) {
    if (Number.isFinite(listId)) {
      const check = await this.pool.request()
        .input('id', listId)
        .query(`SELECT id FROM Liste WHERE id = @id`);
      if (check.recordset.length > 0) {
        return listId;
      }
    }

    const candidateNumber =
      listNumber !== undefined && listNumber !== null
        ? String(listNumber)
        : Number.isFinite(listId)
        ? String(listId)
        : null;

    if (candidateNumber) {
      const result = await this.pool.request()
        .input('numLista', candidateNumber)
        .query(`SELECT TOP 1 id FROM Liste WHERE numLista = @numLista`);
      return result.recordset[0]?.id || null;
    }

    return null;
  }

  async applyListStatus({
    listId,
    listNumber,
    statusId,
    areaStatusId,
    terminata,
    setStart,
    setEnd,
    action,
    messageSuffix,
  }) {
    const parsedId = Number(listId);
    const resolvedId = await this.resolveListId({
      listId: Number.isFinite(parsedId) ? parsedId : null,
      listNumber,
    });

    if (!resolvedId) {
      return {
        success: false,
        message: `Lista ${listId || listNumber} non trovata`,
      };
    }

    const updateResult = await this.pool.request()
      .input('id', resolvedId)
      .input('statusId', statusId)
      .input('terminata', terminata ? 1 : 0)
      .query(`
        UPDATE Liste
        SET idStatoControlloEvadibilita = @statusId,
            terminata = @terminata,
            dataInizioEvasione = ${setStart ? 'ISNULL(dataInizioEvasione, GETDATE())' : 'dataInizioEvasione'},
            dataFineEvasione = ${setEnd ? 'ISNULL(dataFineEvasione, GETDATE())' : 'CASE WHEN @terminata = 0 THEN NULL ELSE dataFineEvasione END'},
            dataModifica = GETDATE()
        WHERE id = @id
      `);

    if (updateResult.rowsAffected[0] === 0) {
      return {
        success: false,
        message: `Lista ${listId || listNumber} non trovata`,
      };
    }

    await this.pool.request()
      .input('id', resolvedId)
      .query(`
        UPDATE ListeAreaDetails
        SET idStatoLista = ${areaStatusId}
        WHERE idLista = @id
      `);

    if (action) {
      this.emitListUpdate(resolvedId, action);
    }

    return {
      success: true,
      message: `Lista ${listId || listNumber} ${messageSuffix || 'aggiornata'}`,
      data: { listId: resolvedId, status: statusId },
    };
  }
}

// Singleton instance
let actionExecutorInstance = null;

export async function getActionExecutor() {
  if (!actionExecutorInstance) {
    actionExecutorInstance = new AIActionExecutor();
    await actionExecutorInstance.init();
  }
  return actionExecutorInstance;
}

export default AIActionExecutor;
