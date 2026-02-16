/**
 * WebSocket Server for Real-Time Updates
 *
 * Fornisce aggiornamenti in tempo reale per:
 * - Liste (cambio stato, nuove liste, eliminazioni)
 * - UDC (aggiornamenti cassetti)
 * - Stock (variazioni giacenze)
 * - Eventi (nuovi log)
 *
 * NUOVO: Usa sistema di notifiche basato su trigger SQL per sincronizzazione
 * bidirezionale istantanea tra EjLog Java e React frontend.
 */

import { WebSocketServer } from 'ws';
import { getPool } from './db-config.js';
import {
  initNotificationSystem,
  registerNotificationHandler,
  startNotificationPolling,
  stopNotificationPolling,
  startAutomaticCleanup,
  stopAutomaticCleanup,
  getNotificationPollerStats
} from './notification-poller.js';

let wss = null;
let clients = new Set();
let dbPollingInterval = null;
let lastListsState = new Map(); // Mappa: numLista -> { statoLista, tipoLista }
let useNotificationSystem = true; // Flag per usare nuovo sistema

/**
 * Inizializza il WebSocket server
 * @param {http.Server} httpServer - Server HTTP su cui attaccare WebSocket
 */
export function initWebSocketServer(httpServer) {
  wss = new WebSocketServer({
    server: httpServer,
    path: '/ws',
    clientTracking: true
  });

  console.log('🔌 WebSocket server inizializzato su /ws');

  wss.on('connection', (ws, req) => {
    const clientIp = req.socket.remoteAddress;
    console.log(`✅ Nuovo client WebSocket connesso da ${clientIp}`);

    clients.add(ws);

    // Invia messaggio di benvenuto
    ws.send(JSON.stringify({
      type: 'connection',
      message: 'Connesso al server WebSocket EjLog',
      timestamp: new Date().toISOString()
    }));

    // Gestisci messaggi in arrivo dal client
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        handleClientMessage(ws, data);
      } catch (error) {
        console.error('❌ Errore parsing messaggio WebSocket:', error.message);
      }
    });

    // Gestisci disconnessione
    ws.on('close', () => {
      console.log(`❌ Client WebSocket disconnesso da ${clientIp}`);
      clients.delete(ws);
    });

    // Gestisci errori
    ws.on('error', (error) => {
      console.error('❌ Errore WebSocket:', error.message);
      clients.delete(ws);
    });

    // Heartbeat per mantenere la connessione viva
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });
  });

  // Heartbeat per rilevare connessioni morte
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        console.log('💀 Chiudo connessione WebSocket morta');
        return ws.terminate();
      }

      ws.isAlive = false;
      ws.ping();
    });
  }, 30000); // ogni 30 secondi

  // Cleanup heartbeat quando il server si ferma
  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  // Avvia il polling del database per rilevare cambiamenti
  startDatabasePolling();
}

/**
 * Gestisce i messaggi ricevuti dai client
 */
function handleClientMessage(ws, data) {
  console.log('📨 Messaggio ricevuto:', data);

  switch (data.type) {
    case 'subscribe':
      // Il client si iscrive a un canale specifico
      if (!ws.subscriptions) {
        ws.subscriptions = new Set();
      }
      ws.subscriptions.add(data.channel);
      console.log(`📡 Client iscritto al canale: ${data.channel}`);
      break;

    case 'unsubscribe':
      if (ws.subscriptions) {
        ws.subscriptions.delete(data.channel);
        console.log(`📴 Client disiscritto dal canale: ${data.channel}`);
      }
      break;

    case 'ping':
      ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
      break;

    default:
      console.log(`⚠️  Tipo messaggio sconosciuto: ${data.type}`);
  }
}

/**
 * Handler per notifiche dalla tabella Liste
 * Chiamato quando il trigger SQL rileva modifiche da EjLog Java
 */
function handleListNotification(notification) {
  const { eventType, data, timestamp } = notification;

  console.log(`[WebSocket] 🔔 Notifica ${eventType} per lista ${data?.numLista || 'N/A'}`);

  // Converti eventType in tipo messaggio WebSocket
  let wsMessageType;
  switch (eventType) {
    case 'insert':
      wsMessageType = 'list_created';
      break;
    case 'update':
      wsMessageType = 'list_updated';
      break;
    case 'delete':
      wsMessageType = 'list_deleted';
      break;
    default:
      wsMessageType = 'list_changed';
  }

  // Invia ai client WebSocket
  broadcastToChannel('lists', {
    type: 'lists_update',
    changes: [{
      type: wsMessageType,
      data: data,
      timestamp: timestamp
    }],
    timestamp: new Date().toISOString(),
    source: 'ejlog_trigger' // Indica che proviene da EjLog Java
  });
}

/**
 * Avvia il polling del database per rilevare cambiamenti
 */
async function startDatabasePolling() {
  // Prova a inizializzare il sistema di notifiche real-time
  if (useNotificationSystem) {
    const systemReady = await initNotificationSystem();

    if (systemReady) {
      console.log('🚀 Usando sistema di notifiche real-time (trigger SQL)');

      // Registra handler per notifiche tabella Liste
      registerNotificationHandler('Liste', handleListNotification);

      // Avvia polling notifiche (200ms = latenza max 200ms)
      startNotificationPolling(200);

      // Avvia cleanup automatico ogni ora
      startAutomaticCleanup(1, 24);

      console.log('✅ Sistema notifiche real-time attivo (latenza max: 200ms)');
      return;
    } else {
      console.warn('⚠️  Sistema notifiche non disponibile, uso polling legacy');
      useNotificationSystem = false;
    }
  }

  // Fallback: usa vecchio sistema di polling (2 secondi)
  dbPollingInterval = setInterval(async () => {
    await checkListsChanges();
  }, 2000);

  console.log('🔄 Database polling legacy avviato (intervallo: 2s)');
}

/**
 * Controlla se ci sono stati cambiamenti nelle liste
 */
async function checkListsChanges() {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT id, numLista, idStatoControlloEvadibilita, idTipoLista, dataCreazione, dataModifica, terminata
      FROM Liste
      ORDER BY dataModifica DESC
    `);

    const currentLists = result.recordset;
    let hasChanges = false;
    const changes = [];

    // Controlla ogni lista per vedere se è cambiata
    for (const list of currentLists) {
      const key = list.numLista;
      const lastState = lastListsState.get(key);

      if (!lastState) {
        // Nuova lista creata
        changes.push({
          type: 'list_created',
          data: list
        });
        hasChanges = true;
      } else if (
        lastState.idStatoControlloEvadibilita !== list.idStatoControlloEvadibilita ||
        lastState.idTipoLista !== list.idTipoLista ||
        lastState.terminata !== list.terminata
      ) {
        // Lista modificata (cambio stato o tipo o terminazione)
        changes.push({
          type: 'list_updated',
          data: list,
          previousState: lastState
        });
        hasChanges = true;
      }

      // Aggiorna lo stato corrente
      lastListsState.set(key, {
        idStatoControlloEvadibilita: list.idStatoControlloEvadibilita,
        idTipoLista: list.idTipoLista,
        terminata: list.terminata,
        dataModifica: list.dataModifica
      });
    }

    // Controlla liste eliminate
    const currentListNumbers = new Set(currentLists.map(l => l.numLista));
    for (const [numLista, state] of lastListsState.entries()) {
      if (!currentListNumbers.has(numLista)) {
        changes.push({
          type: 'list_deleted',
          data: { numLista }
        });
        lastListsState.delete(numLista);
        hasChanges = true;
      }
    }

    // Se ci sono cambiamenti, invia notifiche ai client
    if (hasChanges && changes.length > 0) {
      console.log(`🔔 Rilevati ${changes.length} cambiamenti nelle liste`);
      broadcastToChannel('lists', {
        type: 'lists_update',
        changes: changes,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('❌ Errore nel polling database:', error.message);
  }
}

/**
 * Invia un messaggio a tutti i client iscritti a un canale specifico
 */
function broadcastToChannel(channel, message) {
  let sentCount = 0;

  clients.forEach((client) => {
    // Invia solo ai client iscritti al canale (o a tutti se non ci sono iscrizioni)
    if (
      client.readyState === 1 && // WebSocket.OPEN
      (!client.subscriptions || client.subscriptions.has(channel) || client.subscriptions.size === 0)
    ) {
      try {
        client.send(JSON.stringify(message));
        sentCount++;
      } catch (error) {
        console.error('❌ Errore invio messaggio WebSocket:', error.message);
      }
    }
  });

  console.log(`📤 Messaggio inviato a ${sentCount} client sul canale '${channel}'`);
}

/**
 * Invia un messaggio a tutti i client connessi
 */
export function broadcast(message) {
  broadcastToChannel('global', message);
}

/**
 * Ferma il WebSocket server e il polling del database
 */
export function stopWebSocketServer() {
  // Ferma sistema di notifiche real-time
  if (useNotificationSystem) {
    stopNotificationPolling();
    stopAutomaticCleanup();
    console.log('🛑 Sistema notifiche real-time fermato');
  }

  // Ferma polling legacy se attivo
  if (dbPollingInterval) {
    clearInterval(dbPollingInterval);
    dbPollingInterval = null;
    console.log('🛑 Database polling legacy fermato');
  }

  if (wss) {
    wss.clients.forEach((client) => {
      client.close();
    });
    wss.close(() => {
      console.log('🛑 WebSocket server chiuso');
    });
  }

  clients.clear();
  lastListsState.clear();
}

/**
 * Ottieni statistiche sui client connessi
 */
export function getWebSocketStats() {
  const baseStats = {
    connectedClients: clients.size,
    totalListsTracked: lastListsState.size,
    pollingActive: dbPollingInterval !== null,
    notificationSystemActive: useNotificationSystem
  };

  // Aggiungi stats del notification poller se attivo
  if (useNotificationSystem) {
    const pollerStats = getNotificationPollerStats();
    return {
      ...baseStats,
      notificationPoller: pollerStats
    };
  }

  return baseStats;
}

export default {
  initWebSocketServer,
  broadcast,
  stopWebSocketServer,
  getWebSocketStats
};
