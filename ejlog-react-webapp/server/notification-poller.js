/**
 * Real-Time Notification Poller
 *
 * Monitora la tabella DatabaseNotifications per rilevare modifiche
 * istantanee provenienti da EjLog Java tramite trigger SQL.
 *
 * Polling a 200ms garantisce latenza massima di 200ms per aggiornamenti real-time.
 */

import sql from 'mssql';
import { getPool } from './db-config.js';

let pollingInterval = null;
let isPolling = false;
let notificationHandlers = new Map();
let stats = {
  totalNotifications: 0,
  processedNotifications: 0,
  errors: 0,
  lastPollTime: null,
  averagePollDuration: 0,
  pollCount: 0
};

/**
 * Registra un handler per un tipo di evento
 * @param {string} tableName - Nome tabella da monitorare
 * @param {Function} handler - Callback per gestire notifiche: (notification) => void
 */
export function registerNotificationHandler(tableName, handler) {
  if (!notificationHandlers.has(tableName)) {
    notificationHandlers.set(tableName, []);
  }
  notificationHandlers.get(tableName).push(handler);
  console.log(`[NotificationPoller] Handler registrato per tabella: ${tableName}`);
}

/**
 * Rimuove tutti gli handler per una tabella
 * @param {string} tableName - Nome tabella
 */
export function unregisterNotificationHandler(tableName) {
  notificationHandlers.delete(tableName);
  console.log(`[NotificationPoller] Handler rimossi per tabella: ${tableName}`);
}

/**
 * Elabora una singola notifica
 * @param {Object} notification - Notifica dal database
 */
async function processNotification(notification) {
  try {
    const { id, eventType, tableName, recordId, eventData, createdAt } = notification;

    // Parse JSON data
    let parsedData = null;
    if (eventData) {
      try {
        parsedData = JSON.parse(eventData);
      } catch (e) {
        console.error(`[NotificationPoller] Errore parsing JSON per notifica ${id}:`, e.message);
      }
    }

    // Prepara payload notifica
    const payload = {
      id,
      eventType: eventType.toLowerCase(),
      tableName,
      recordId,
      data: parsedData,
      timestamp: createdAt
    };

    // Chiama handlers registrati per questa tabella
    const handlers = notificationHandlers.get(tableName) || [];
    if (handlers.length === 0) {
      console.warn(`[NotificationPoller] Nessun handler per tabella ${tableName}`);
    }

    for (const handler of handlers) {
      try {
        await handler(payload);
      } catch (error) {
        console.error(`[NotificationPoller] Errore handler per ${tableName}:`, error.message);
        stats.errors++;
      }
    }

    stats.processedNotifications++;

    // Marca notifica come processata
    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, id)
      .input('processedAt', sql.DateTime2, new Date())
      .query(`
        UPDATE DatabaseNotifications
        SET processed = 1, processedAt = @processedAt
        WHERE id = @id
      `);

  } catch (error) {
    console.error('[NotificationPoller] Errore processamento notifica:', error.message);
    stats.errors++;
  }
}

/**
 * Esegue un ciclo di polling per notifiche non processate
 */
async function pollNotifications() {
  if (isPolling) {
    // Evita sovrapposizioni se il poll precedente non è finito
    return;
  }

  isPolling = true;
  const startTime = Date.now();

  try {
    const pool = await getPool();

    // Leggi batch di notifiche non processate (max 50 per ciclo)
    const result = await pool.request().query(`
      SELECT TOP 50
        id,
        eventType,
        tableName,
        recordId,
        eventData,
        createdAt
      FROM DatabaseNotifications WITH (NOLOCK)
      WHERE processed = 0
      ORDER BY createdAt ASC
    `);

    const notifications = result.recordset;

    if (notifications.length > 0) {
      console.log(`[NotificationPoller] 📬 Trovate ${notifications.length} notifiche da processare`);
      stats.totalNotifications += notifications.length;

      // Processa notifiche in parallelo
      await Promise.all(notifications.map(n => processNotification(n)));

      console.log(`[NotificationPoller] ✅ Processate ${notifications.length} notifiche`);
    }

    // Aggiorna statistiche
    const duration = Date.now() - startTime;
    stats.lastPollTime = new Date();
    stats.pollCount++;
    stats.averagePollDuration = (stats.averagePollDuration * (stats.pollCount - 1) + duration) / stats.pollCount;

    // Log periodico ogni 100 cicli
    if (stats.pollCount % 100 === 0) {
      console.log(`[NotificationPoller] 📊 Stats: ${stats.processedNotifications} processate, ` +
        `${stats.errors} errori, avg poll: ${stats.averagePollDuration.toFixed(2)}ms`);
    }

  } catch (error) {
    console.error('[NotificationPoller] ❌ Errore polling:', error.message);
    stats.errors++;
  } finally {
    isPolling = false;
  }
}

/**
 * Avvia il polling delle notifiche
 * @param {number} intervalMs - Intervallo polling in millisecondi (default: 200ms)
 */
export function startNotificationPolling(intervalMs = 200) {
  if (pollingInterval) {
    console.warn('[NotificationPoller] Polling già attivo');
    return;
  }

  console.log(`[NotificationPoller] 🚀 Avvio polling (intervallo: ${intervalMs}ms)`);

  // Esegui primo poll immediatamente
  pollNotifications();

  // Avvia polling periodico
  pollingInterval = setInterval(pollNotifications, intervalMs);

  console.log('[NotificationPoller] ✅ Polling avviato');
}

/**
 * Ferma il polling delle notifiche
 */
export function stopNotificationPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
    console.log('[NotificationPoller] 🛑 Polling fermato');
  }

  // Reset stato
  isPolling = false;
}

/**
 * Ottieni statistiche del poller
 */
export function getNotificationPollerStats() {
  return {
    ...stats,
    isPolling: pollingInterval !== null,
    handlersCount: Array.from(notificationHandlers.entries()).reduce((acc, [table, handlers]) => {
      acc[table] = handlers.length;
      return acc;
    }, {})
  };
}

/**
 * Esegui pulizia notifiche processate
 * @param {number} retentionHours - Ore di retention (default: 24)
 */
export async function cleanupProcessedNotifications(retentionHours = 24) {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('retentionHours', sql.Int, retentionHours)
      .execute('sp_CleanupProcessedNotifications');

    const deletedCount = result.returnValue || 0;
    console.log(`[NotificationPoller] 🧹 Eliminate ${deletedCount} notifiche processate`);

    return deletedCount;
  } catch (error) {
    console.error('[NotificationPoller] Errore pulizia notifiche:', error.message);
    return 0;
  }
}

/**
 * Inizializza il sistema di notifiche
 * Esegue lo script SQL se necessario
 */
export async function initNotificationSystem() {
  try {
    const pool = await getPool();

    // Verifica se la tabella DatabaseNotifications esiste
    const tableCheck = await pool.request().query(`
      SELECT COUNT(*) as tableExists
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_NAME = 'DatabaseNotifications'
    `);

    if (tableCheck.recordset[0].tableExists === 0) {
      console.log('[NotificationPoller] ⚠️  Tabella DatabaseNotifications non trovata');
      console.log('[NotificationPoller] 📝 Esegui lo script: server/sql/create-notification-system.sql');
      return false;
    }

    // Verifica trigger
    const triggerCheck = await pool.request().query(`
      SELECT COUNT(*) as triggerExists
      FROM sys.triggers
      WHERE name = 'trg_Liste_Changes'
    `);

    if (triggerCheck.recordset[0].triggerExists === 0) {
      console.log('[NotificationPoller] ⚠️  Trigger trg_Liste_Changes non trovato');
      console.log('[NotificationPoller] 📝 Esegui lo script: server/sql/create-notification-system.sql');
      return false;
    }

    console.log('[NotificationPoller] ✅ Sistema di notifiche inizializzato correttamente');
    return true;

  } catch (error) {
    console.error('[NotificationPoller] ❌ Errore inizializzazione:', error.message);
    return false;
  }
}

// Cleanup automatico ogni ora
let cleanupInterval = null;

export function startAutomaticCleanup(intervalHours = 1, retentionHours = 24) {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }

  cleanupInterval = setInterval(() => {
    cleanupProcessedNotifications(retentionHours);
  }, intervalHours * 60 * 60 * 1000);

  console.log(`[NotificationPoller] 🧹 Cleanup automatico attivato (ogni ${intervalHours}h, retention ${retentionHours}h)`);
}

export function stopAutomaticCleanup() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    console.log('[NotificationPoller] 🧹 Cleanup automatico disattivato');
  }
}

// Export default
export default {
  registerNotificationHandler,
  unregisterNotificationHandler,
  startNotificationPolling,
  stopNotificationPolling,
  getNotificationPollerStats,
  cleanupProcessedNotifications,
  initNotificationSystem,
  startAutomaticCleanup,
  stopAutomaticCleanup
};
