/**
 * SchedulerService - Servizio principale Prenotatore/Scheduler
 * Replica WmsPrenotatoreModule.java con Fetcher e Processor
 * Integrato con SchedulerCoordinator per gestione Java/Node
 */

import { EventEmitter } from 'events';
import PriorityQueue from './queue/PriorityQueue.js';
import PrenotatoreRegistry from './prenotatori/PrenotatoreRegistry.js';
import SchedulerCoordinator from './coordinator/SchedulerCoordinator.js';
import DistributedLockManager from './coordinator/DistributedLockManager.js';

class SchedulerService extends EventEmitter {
  constructor(config, dbPool) {
    super();
    this.config = config;
    this.db = dbPool;
    this.queue = new PriorityQueue();
    this.registry = new PrenotatoreRegistry(config.prenotatori || {});

    // Coordinator e Lock Manager
    this.coordinator = new SchedulerCoordinator(dbPool, config.coordinator || {});
    this.lockManager = new DistributedLockManager(dbPool, config.locks || {});

    // Setup event listeners for coordinator
    this.coordinator.on('became-leader', () => this.onBecameLeader());
    this.coordinator.on('lost-leader', () => this.onLostLeader());

    // Stati Fetcher e Processor
    this.fetcherRunning = false;
    this.processorRunning = false;
    this.fetcherInterval = null;
    this.processorWorkers = [];
    this.processorShouldStop = false;

    // Client connessi (simulazione NetServer)
    this.connectedClients = [];

    // Statistiche
    this.stats = {
      listsFetched: 0,
      listsProcessed: 0,
      listsFailed: 0,
      prenotazioniCreated: 0,
      lastFetchTime: null,
      lastProcessTime: null,
      startTime: new Date()
    };

    console.log('[SchedulerService] Initialized');
    console.log('[SchedulerService] Registry:', this.registry.getStats());
    console.log('[SchedulerService] Coordinator mode:', config.coordinator?.mode || 'AUTO');
  }

  /**
   * COORDINATOR EVENT HANDLERS
   */
  async onBecameLeader() {
    console.log('[SchedulerService] 🎯 Became leader - starting processing');
    this.emit('became-leader');

    // Auto-start fetcher e processor se configurato
    if (this.config.autoStart !== false) {
      await this.startFetcher();
      await this.startProcessor();
    }
  }

  async onLostLeader() {
    console.log('[SchedulerService] ⏸️  Lost leadership - pausing processing');
    this.emit('lost-leader');

    this.pauseFetcher();
    this.pauseProcessor();
  }

  /**
   * INITIALIZATION
   */
  async init() {
    console.log('[SchedulerService] Initializing coordinator...');
    await this.coordinator.start();

    const isLeader = this.coordinator.canProcessLists();
    console.log('[SchedulerService] Initialized - Is Leader:', isLeader);

    // Se già leader, avvia processing
    if (isLeader && this.config.autoStart !== false) {
      await this.startFetcher();
      await this.startProcessor();
    }
  }

  /**
   * Calcola la priorita della lista in base al tipo
   * 1 = Picking (alta), 2 = Refilling (media), 3+ = Inventario/altro (bassa)
   */
  calculatePriority(lista) {
    if (lista.idTipoLista === 1) return 100;
    if (lista.idTipoLista === 2) return 50;
    return 10;
  }

  /**
   * FETCHER - Raccolta liste da database
   */
  async startFetcher() {
    // Check leadership
    if (!this.coordinator.canProcessLists()) {
      console.warn('[Fetcher] ⚠️  Cannot start - not leader');
      return;
    }

    if (this.fetcherRunning) {
      console.log('[Fetcher] Already running');
      return;
    }

    this.fetcherRunning = true;
    this.emit('fetcher:started');
    console.log('[Fetcher] Started - interval:', this.config.fetcher.intervalMs, 'ms');

    // Esegui primo ciclo immediatamente
    await this.fetchListsCycle();

    // Poi continua con intervallo
    this.fetcherInterval = setInterval(
      () => this.fetchListsCycle(),
      this.config.fetcher.intervalMs
    );
  }

  async fetchListsCycle() {
    if (!this.fetcherRunning) return;

    try {
      const startTime = Date.now();

      // Query corretto con colonne reali della tabella Liste
      // idStatoControlloEvadibilita: 1 = NON_EVADIBILE, 2 = EVADIBILE
      // Prendiamo liste non terminate che sono state lanciate o devono essere lanciate
      const query = `
        SELECT TOP ${this.config.fetcher.batchSize}
          l.id,
          l.numLista,
          l.idTipoLista,
          l.dataCreazione,
          l.dataLancio,
          l.dataPrevistaEvasione,
          l.prenotazioneIncrementale,
          l.terminata,
          l.idStatoControlloEvadibilita
        FROM Liste l
        WHERE l.terminata = 0 -- NON terminata
          AND l.recordCancellato = 0
          AND l.dataLancio IS NOT NULL -- Lista lanciata
          AND (l.dataPrevistaEvasione IS NULL OR l.dataPrevistaEvasione <= GETDATE())
        ORDER BY l.dataCreazione ASC
      `;

      const result = await this.db.request().query(query);

      let queued = 0;

      for (const lista of result.recordset) {
        // Verifica se gia in coda
        const exists = this.queue.find(item => item.id === lista.id);

        if (!exists) {
          const priority = this.calculatePriority(lista);

          // Metadati per il processor (retry/priorita originale)
          lista.priority = priority;
          lista.retryCount = 0;

          this.queue.enqueue(lista, priority);
          queued++;

          this.stats.listsFetched++;

          this.emit('list:queued', {
            id: lista.id,
            numLista: lista.numLista,
            priority: priority,
            idTipoLista: lista.idTipoLista
          });
        }
      }

      const duration = Date.now() - startTime;
      this.stats.lastFetchTime = new Date();

      console.log(`[Fetcher] Cycle completed in ${duration}ms - Fetched: ${result.recordset.length}, Queued: ${queued}, Queue size: ${this.queue.size()}`);

      this.emit('fetcher:cycle_completed', {
        fetched: result.recordset.length,
        queued,
        queueSize: this.queue.size(),
        duration
      });

    } catch (error) {
      console.error('[Fetcher] Error:', error);
      this.emit('fetcher:error', { error: error.message });
    }
  }

  pauseFetcher() {
    if (!this.fetcherRunning) {
      console.log('[Fetcher] Not running');
      return;
    }

    clearInterval(this.fetcherInterval);
    this.fetcherInterval = null;
    this.fetcherRunning = false;

    this.emit('fetcher:paused');
    console.log('[Fetcher] Paused');
  }

  resumeFetcher() {
    if (this.fetcherRunning) {
      console.log('[Fetcher] Already running');
      return;
    }

    this.startFetcher();
    this.emit('fetcher:resumed');
  }

  async forceFetcherCycle() {
    console.log('[Fetcher] Force cycle requested');
    if (this.fetcherRunning) {
      await this.fetchListsCycle();
    } else {
      console.log('[Fetcher] Not running - cannot force cycle');
    }
  }

  /**
   * PROCESSOR - Elaborazione liste
   */
  async startProcessor() {
    // Check leadership
    if (!this.coordinator.canProcessLists()) {
      console.warn('[Processor] ⚠️  Cannot start - not leader');
      return;
    }

    if (this.processorRunning) {
      console.log('[Processor] Already running');
      return;
    }

    this.processorRunning = true;
    this.processorShouldStop = false;

    this.emit('processor:started');
    console.log(`[Processor] Started with ${this.config.processor.workers} workers`);

    // Avvia N worker threads
    this.processorWorkers = [];
    for (let i = 0; i < this.config.processor.workers; i++) {
      const worker = this.processorWorker(i);
      this.processorWorkers.push(worker);
    }
  }

  async processorWorker(workerId) {
    console.log(`[Processor Worker ${workerId}] Started`);

    while (this.processorRunning && !this.processorShouldStop) {
      let lista = null;
      let lockAcquired = false;

      try {
        lista = this.queue.dequeue();

        if (!lista) {
          // Nessuna lista in coda, attendi
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }

        // 🔒 ACQUIRE DISTRIBUTED LOCK
        const ownerId = this.config.coordinator?.instanceId || `node-${process.pid}`;
        lockAcquired = await this.lockManager.acquireLock(lista.id, ownerId);

        if (!lockAcquired) {
          console.log(`[Processor Worker ${workerId}] ⚠️  Could not acquire lock for lista ${lista.id} - skipping`);
          this.emit('list:lock_failed', {
            id: lista.id,
            numLista: lista.numLista,
            workerId
          });
          continue; // Lista già in elaborazione da altro sistema
        }

        this.emit('list:processing', {
          id: lista.id,
          numLista: lista.numLista,
          workerId
        });

        console.log(`[Processor Worker ${workerId}] Processing lista ${lista.numLista} (ID: ${lista.id})`);

        const startTime = Date.now();

        // Trova prenotatore appropriato
        const prenotatore = this.registry.findPrenotatore(lista);

        if (!prenotatore) {
          throw new Error(`No prenotatore found for idTipoLista ${lista.idTipoLista}`);
        }

        // Esegui prenotazione
        const result = await prenotatore.prenotaLista(lista, this.db);

        const duration = Date.now() - startTime;

        // Aggiorna statistiche
        this.stats.listsProcessed++;
        this.stats.prenotazioniCreated += result.prenotazioniCreated;
        this.stats.lastProcessTime = new Date();

        this.emit('list:completed', {
          id: lista.id,
          numLista: lista.numLista,
          prenotazioniCreated: result.prenotazioniCreated,
          righeProcessate: result.righeProcessate,
          righeNonEvadibili: result.righeNonEvadibili,
          nonEvadibile: result.nonEvadibile,
          duration,
          workerId
        });

        console.log(`[Processor Worker ${workerId}] Completed lista ${lista.numLista} in ${duration}ms - ${result.prenotazioniCreated} prenotazioni`);

      } catch (error) {
        this.stats.listsFailed++;

        const errorData = {
          id: lista?.id,
          numLista: lista?.numLista,
          error: error.message,
          stack: error.stack,
          workerId
        };

        this.emit('list:failed', errorData);

        console.error(`[Processor Worker ${workerId}] Error:`, error.message);

        // Retry logic (solo per errori, non per lock failure)
        if (lista && lockAcquired && this.config.processor.maxRetries > 0) {
          const currentRetry = (lista.retryCount || 0) + 1;
          const maxRetries = this.config.processor.maxRetries;
          const retryDelay = this.config.processor.retryDelayMs || 2000;

          if (currentRetry <= maxRetries) {
            lista.retryCount = currentRetry;
            const priority = typeof lista.priority === 'number'
              ? Math.max(lista.priority - currentRetry, 1)
              : this.calculatePriority(lista);

            console.log(`[Processor Worker ${workerId}] Retrying lista ${lista.numLista} in ${retryDelay}ms (attempt ${currentRetry}/${maxRetries})`);

            setTimeout(() => {
              if (!this.processorRunning || this.processorShouldStop) {
                return;
              }
              this.queue.enqueue(lista, priority);
            }, retryDelay);
          } else {
            console.error(`[Processor Worker ${workerId}] Max retries reached for lista ${lista?.numLista}, giving up`);
          }
        }

      } finally {
        // 🔓 RELEASE LOCK sempre, anche in caso di errore
        if (lockAcquired && lista) {
          await this.lockManager.releaseLock(lista.id);
        }
      }
    }

    console.log(`[Processor Worker ${workerId}] Stopped`);
  }

  pauseProcessor() {
    if (!this.processorRunning) {
      console.log('[Processor] Not running');
      return;
    }

    this.processorShouldStop = true;
    this.processorRunning = false;

    this.emit('processor:paused');
    console.log('[Processor] Paused - workers will stop after current task');
  }

  resumeProcessor() {
    if (this.processorRunning) {
      console.log('[Processor] Already running');
      return;
    }

    this.startProcessor();
    this.emit('processor:resumed');
  }

  async forceProcessorCycle() {
    console.log('[Processor] Force cycle requested');
    // Il processor gira continuamente, force cycle non ha senso
    // Ma possiamo triggherare un check immediato
    if (this.processorRunning && this.queue.size() > 0) {
      console.log('[Processor] Queue has items, workers will pick them up');
    } else {
      console.log('[Processor] Queue is empty or processor not running');
    }
  }

  /**
   * CLIENT MANAGEMENT (simulazione NetServer)
   */
  addClient(client) {
    this.connectedClients.push({
      id: client.id || `client-${Date.now()}`,
      name: client.name || 'Unknown',
      ip: client.ip || 'Unknown',
      connectedAt: new Date()
    });

    this.emit('client:connected', client);
    console.log(`[SchedulerService] Client connected: ${client.name}`);
  }

  removeClient(clientId) {
    const index = this.connectedClients.findIndex(c => c.id === clientId);
    if (index !== -1) {
      const client = this.connectedClients.splice(index, 1)[0];
      this.emit('client:disconnected', client);
      console.log(`[SchedulerService] Client disconnected: ${client.name}`);
    }
  }

  getConnectedClients() {
    return this.connectedClients;
  }

  /**
   * STATUS & STATS
   */
  getStatus() {
    return {
      active: this.fetcherRunning || this.processorRunning,
      fetcher: {
        running: this.fetcherRunning,
        intervalMs: this.config.fetcher.intervalMs,
        batchSize: this.config.fetcher.batchSize,
        lastFetch: this.stats.lastFetchTime
      },
      processor: {
        running: this.processorRunning,
        workers: this.config.processor.workers,
        queueSize: this.queue.size()
      },
      stats: {
        ...this.stats,
        uptime: Date.now() - this.stats.startTime.getTime()
      },
      clients: {
        count: this.connectedClients.length,
        connected: this.connectedClients
      },
      registry: this.registry.getStats()
    };
  }

  getQueue() {
    return this.queue.getAll();
  }

  /**
   * SHUTDOWN
   */
  async shutdown() {
    console.log('[SchedulerService] Shutting down...');

    this.pauseFetcher();
    this.pauseProcessor();

    // Attendi completamento workers
    await Promise.all(this.processorWorkers);

    // Stop coordinator and release locks
    if (this.coordinator) {
      await this.coordinator.stop();
    }

    if (this.lockManager) {
      await this.lockManager.releaseAllLocks();
    }

    this.queue.clear();
    this.connectedClients = [];

    this.emit('shutdown');
    console.log('[SchedulerService] Shutdown complete');
  }
}

export default SchedulerService;
