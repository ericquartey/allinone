// ============================================================================
// EJLOG WMS - AI Context Service
// Raccolta contesto dal database per AI responses
// ============================================================================

import { getPool } from '../../db-config.js';

/**
 * AI Context Service - Raccoglie dati dal database per fornire contesto all'AI
 */
class AIContextService {
  constructor() {
    this.pool = null;
  }

  /**
   * Inizializza connessione database
   */
  async init() {
    this.pool = await getPool();
    console.log('[AI Context] ✅ Service initialized');
  }

  /**
   * Costruisce contesto completo per AI
   * @param {Object} options - { userId, page, entityId, entityType }
   * @returns {Promise<Object>} - Contesto completo
   */
  async buildContext(options = {}) {
    const { userId, page, entityId, entityType } = options;

    console.log(`[AI Context] Building context for user: ${userId}, page: ${page}`);

    const context = {
      user: await this.getUserContext(userId),
      page: page || 'unknown',
      timestamp: new Date().toISOString(),
      systemState: await this.getSystemState(),
      primaryMachine: await this.getPrimaryMachine(),
    };

    // Aggiungi contesto specifico basato su entityType
    if (entityType === 'machine' && entityId) {
      context.machine = await this.getMachineContext(entityId);
    } else if (entityType === 'drawer' && entityId) {
      context.drawer = await this.getDrawerContext(entityId);
    } else if (entityType === 'list' && entityId) {
      context.operation = await this.getOperationContext(entityId);
    }

    if (page && page.includes('/operations/lists')) {
      context.listsOverview = await this.getListsOverview();
      context.udcOverview = await this.getUdcOverview();
    }

    return context;
  }

  /**
   * Ottieni contesto utente
   */
  async getUserContext(userId) {
    if (!userId) return null;

    try {
      const result = await this.pool.request()
        .input('userId', userId)
        .query(`
          SELECT TOP 1
            NomeUtente as userName,
            LivelloUtente as userLevel,
            Email as email
          FROM Utenti
          WHERE NomeUtente = @userId
        `);

      return result.recordset[0] || null;
    } catch (error) {
      console.error('[AI Context] Error fetching user context:', error);
      return null;
    }
  }

  /**
   * Ottieni contesto macchina
   */
  async getMachineContext(machineId) {
    try {
      // Dettagli macchina
      const machineResult = await this.pool.request()
        .input('machineId', machineId)
        .query(`
          SELECT
            CodMacchina as machineId,
            DesMacchina as description,
            StatoMacchina as status,
            TipoMacchina as type
          FROM MacchineEjLog
          WHERE CodMacchina = @machineId
        `);

      if (machineResult.recordset.length === 0) {
        return null;
      }

      const machine = machineResult.recordset[0];

      // Allarmi attivi sulla macchina
      const alarmsResult = await this.pool.request()
        .input('machineId', machineId)
        .query(`
          SELECT TOP 10
            CodiceAllarme as alarmCode,
            DescrizioneAllarme as description,
            DataOra as timestamp,
            Gravita as severity
          FROM AllarmiMacchine
          WHERE CodMacchina = @machineId
            AND StatoAllarme = 'ATTIVO'
          ORDER BY DataOra DESC
        `);

      machine.alarms = alarmsResult.recordset;

      // Compartimenti gestiti
      const compartmentsResult = await this.pool.request()
        .input('machineId', machineId)
        .query(`
          SELECT
            COUNT(*) as totalCompartments,
            SUM(CASE WHEN StatoCompartimento = 'LIBERO' THEN 1 ELSE 0 END) as freeCompartments,
            SUM(CASE WHEN StatoCompartimento = 'OCCUPATO' THEN 1 ELSE 0 END) as occupiedCompartments
          FROM Compartimenti
          WHERE CodMacchina = @machineId
        `);

      machine.compartments = compartmentsResult.recordset[0];

      // Ultima operazione
      const lastOperationResult = await this.pool.request()
        .input('machineId', machineId)
        .query(`
          SELECT TOP 1
            TipoOperazione as operationType,
            DataOra as timestamp,
            StatoOperazione as status
          FROM OperazioniMacchine
          WHERE CodMacchina = @machineId
          ORDER BY DataOra DESC
        `);

      machine.lastOperation = lastOperationResult.recordset[0] || null;

      return machine;

    } catch (error) {
      console.error('[AI Context] Error fetching machine context:', error);
      return null;
    }
  }

  /**
   * Ottieni contesto cassetto/UDC
   */
  async getDrawerContext(codiceUDC) {
    try {
      // Dettagli UDC
      const udcResult = await this.pool.request()
        .input('codiceUDC', codiceUDC)
        .query(`
          SELECT
            CodiceUDC as codiceUDC,
            DescrizioneUDC as description,
            StatoUDC as status,
            CodMacchina as machineId,
            PosizioneCorrente as currentPosition
          FROM UDC
          WHERE CodiceUDC = @codiceUDC
        `);

      if (udcResult.recordset.length === 0) {
        return null;
      }

      const drawer = udcResult.recordset[0];

      // Compartimenti dell'UDC
      const compartmentsResult = await this.pool.request()
        .input('codiceUDC', codiceUDC)
        .query(`
          SELECT
            COUNT(*) as compartmentCount,
            SUM(CASE WHEN StatoCompartimento = 'LIBERO' THEN 1 ELSE 0 END) as freeCompartments,
            AVG(CAST(PercentualeRiempimento as FLOAT)) as avgFillPercentage
          FROM Compartimenti
          WHERE CodiceUDC = @codiceUDC
        `);

      const compartmentData = compartmentsResult.recordset[0];
      drawer.compartmentCount = compartmentData.compartmentCount;
      drawer.freeCompartments = compartmentData.freeCompartments;
      drawer.fillPercentage = Math.round(compartmentData.avgFillPercentage || 0);

      // Articoli contenuti
      const itemsResult = await this.pool.request()
        .input('codiceUDC', codiceUDC)
        .query(`
          SELECT TOP 5
            a.CodiceArticolo as itemCode,
            a.DescrizioneArticolo as description,
            sc.Quantita as quantity
          FROM StockCompartimenti sc
          JOIN Articoli a ON sc.CodiceArticolo = a.CodiceArticolo
          WHERE sc.CodiceUDC = @codiceUDC
          ORDER BY sc.Quantita DESC
        `);

      drawer.items = itemsResult.recordset;

      return drawer;

    } catch (error) {
      console.error('[AI Context] Error fetching drawer context:', error);
      return null;
    }
  }

  /**
   * Ottieni contesto operazione/lista
   */
  async getOperationContext(listId) {
    try {
      // Dettagli lista
      const listResult = await this.pool.request()
        .input('listId', listId)
        .query(`
          SELECT
            IdLista as listId,
            TipoLista as type,
            StatoLista as status,
            DataCreazione as createdAt,
            UtenteCreazione as createdBy,
            ProgressoPercentuale as progress
          FROM Liste
          WHERE IdLista = @listId
        `);

      if (listResult.recordset.length === 0) {
        return null;
      }

      const operation = listResult.recordset[0];

      // Righe lista
      const itemsResult = await this.pool.request()
        .input('listId', listId)
        .query(`
          SELECT
            COUNT(*) as totalItems,
            SUM(CASE WHEN StatoRiga = 'COMPLETATO' THEN 1 ELSE 0 END) as completedItems,
            SUM(CASE WHEN StatoRiga = 'IN_CORSO' THEN 1 ELSE 0 END) as inProgressItems
          FROM RigheListe
          WHERE IdLista = @listId
        `);

      const itemsData = itemsResult.recordset[0];
      operation.totalItems = itemsData.totalItems;
      operation.completedItems = itemsData.completedItems;
      operation.inProgressItems = itemsData.inProgressItems;

      // Macchine coinvolte
      const machinesResult = await this.pool.request()
        .input('listId', listId)
        .query(`
          SELECT DISTINCT
            m.CodMacchina as machineId,
            m.DesMacchina as description
          FROM Missioni mis
          JOIN MacchineEjLog m ON mis.CodMacchina = m.CodMacchina
          WHERE mis.IdLista = @listId
        `);

      operation.machines = machinesResult.recordset;

      return operation;

    } catch (error) {
      console.error('[AI Context] Error fetching operation context:', error);
      return null;
    }
  }

  /**
   * Ottieni stato generale del sistema
   */
  async getSystemState() {
    try {
      // Stato macchine
      const machinesResult = await this.pool.request().query(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN StatoMacchina = 'ATTIVA' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN StatoMacchina = 'ERRORE' THEN 1 ELSE 0 END) as error,
          SUM(CASE WHEN StatoMacchina = 'MANUTENZIONE' THEN 1 ELSE 0 END) as maintenance
        FROM MacchineEjLog
      `);

      // Stato liste
      const listsResult = await this.pool.request().query(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN StatoLista = 'IN_ESECUZIONE' THEN 1 ELSE 0 END) as inExecution,
          SUM(CASE WHEN StatoLista = 'COMPLETATA' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN StatoLista = 'IN_ATTESA' THEN 1 ELSE 0 END) as pending
        FROM Liste
        WHERE DataCreazione >= DATEADD(day, -7, GETDATE())
      `);

      // Allarmi attivi
      const alarmsResult = await this.pool.request().query(`
        SELECT COUNT(*) as activeAlarms
        FROM AllarmiMacchine
        WHERE StatoAllarme = 'ATTIVO'
      `);

      // Compartimenti
      const compartmentsResult = await this.pool.request().query(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN StatoCompartimento = 'LIBERO' THEN 1 ELSE 0 END) as free,
          AVG(CAST(PercentualeRiempimento as FLOAT)) as avgFillPercentage
        FROM Compartimenti
      `);

      return {
        machines: machinesResult.recordset[0],
        lists: listsResult.recordset[0],
        alarms: alarmsResult.recordset[0],
        compartments: compartmentsResult.recordset[0],
        timestamp: new Date().toISOString(),
      };

    } catch (error) {
      console.error('[AI Context] Error fetching system state:', error);
      return {
        machines: { total: 0, active: 0 },
        lists: { total: 0, inExecution: 0 },
        alarms: { activeAlarms: 0 },
        compartments: { total: 0, free: 0 },
      };
    }
  }

  /**
   * Ottieni macchina principale (prima attiva o piu recente)
   */
  async getPrimaryMachine() {
    try {
      const result = await this.pool.request().query(`
        SELECT TOP 1
          CodMacchina as machineId,
          DesMacchina as description,
          StatoMacchina as status,
          TipoMacchina as type
        FROM MacchineEjLog
        ORDER BY CASE WHEN StatoMacchina = 'ATTIVA' THEN 0 ELSE 1 END, CodMacchina
      `);

      return result.recordset[0] || null;
    } catch (error) {
      console.error('[AI Context] Error fetching primary machine:', error);
      return null;
    }
  }

  /**
   * Ottieni lista ridotta delle liste per pagina touch
   */
  async getListsOverview() {
    try {
      const result = await this.pool.request().query(`
        SELECT TOP 20
          id as listId,
          numLista as listNumber,
          idTipoLista as listType,
          idStatoControlloEvadibilita as listStatusId,
          terminata as isCompleted,
          dataCreazione as createdAt,
          dataModifica as updatedAt
        FROM Liste
        ORDER BY dataCreazione DESC
      `);

      return result.recordset.map((row) => ({
        listId: row.listId,
        listNumber: row.listNumber,
        type: row.listType,
        status: this.mapListStatus(row.listStatusId, row.isCompleted),
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }));
    } catch (error) {
      console.error('[AI Context] Error fetching lists overview:', error);
      return [];
    }
  }

  /**
   * Ottieni una lista ridotta di UDC recenti
   */
  async getUdcOverview() {
    try {
      const result = await this.pool.request().query(`
        SELECT TOP 12
          CodiceUDC as codiceUDC,
          StatoUDC as status,
          CodMacchina as machineId,
          PosizioneCorrente as currentPosition
        FROM UDC
        ORDER BY CodiceUDC DESC
      `);

      return result.recordset;
    } catch (error) {
      console.error('[AI Context] Error fetching UDC overview:', error);
      return [];
    }
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

  /**
   * Log conversazione AI nel database (opzionale)
   */
  async logConversation(userId, message, response, context) {
    try {
      await this.pool.request()
        .input('userId', userId)
        .input('message', message)
        .input('response', response)
        .input('contextData', JSON.stringify(context))
        .input('timestamp', new Date())
        .query(`
          INSERT INTO AI_Conversations
          (UserId, UserMessage, AIResponse, ContextData, Timestamp)
          VALUES (@userId, @message, @response, @contextData, @timestamp)
        `);

      console.log('[AI Context] ✅ Conversation logged');
    } catch (error) {
      // Tabella potrebbe non esistere ancora - non bloccare
      console.log('[AI Context] ℹ️  Conversation logging skipped (table may not exist)');
    }
  }

  /**
   * Cerca nella knowledge base (opzionale - se tabella esiste)
   */
  async searchKnowledgeBase(query) {
    try {
      const result = await this.pool.request()
        .input('query', `%${query}%`)
        .query(`
          SELECT TOP 5
            Title,
            Content,
            Category,
            Tags
          FROM AI_KnowledgeBase
          WHERE Title LIKE @query
             OR Content LIKE @query
             OR Tags LIKE @query
          ORDER BY Priority DESC, UpdatedAt DESC
        `);

      return result.recordset;
    } catch (error) {
      console.log('[AI Context] ℹ️  Knowledge base search skipped (table may not exist)');
      return [];
    }
  }
}

// Singleton instance
let aiContextInstance = null;

export async function getAIContext() {
  if (!aiContextInstance) {
    aiContextInstance = new AIContextService();
    await aiContextInstance.init();
  }
  return aiContextInstance;
}

export default AIContextService;
