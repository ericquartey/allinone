/**
 * Scheduler Routes - API REST per controllo Prenotatore/Scheduler
 * Replica PrenotatorePanel.java actions
 */

import express from 'express';
const router = express.Router();

// Scheduler service instance (iniettato dall'app)
let schedulerService = null;

// Log ingressi per debug routing
router.use((req, _res, next) => {
  console.log(`[SchedulerRoutes] -> ${req.method} ${req.originalUrl}`);
  next();
});

/**
 * Inizializza il router con il servizio scheduler
 */
function setSchedulerService(service) {
  schedulerService = service;
}

function initSchedulerRoutes(service) {
  if (service) {
    setSchedulerService(service);
  }
  console.log('[SchedulerRoutes] Initialized');
  return router;
}

/**
 * Middleware di verifica servizio
 */
function checkSchedulerService(req, res, next) {
  if (!schedulerService) {
    return res.status(503).json({
      success: false,
      error: 'Scheduler service not available'
    });
  }
  next();
}

// ============================================================================
// STATUS & MONITORING
// ============================================================================

/**
 * GET /api/scheduler/status
 * Ottiene lo stato completo del scheduler
 */
router.get('/status', checkSchedulerService, (req, res) => {
  try {
    const status = schedulerService.getStatus();

    res.status(200).json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[SchedulerRoutes] Error getting status:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero stato scheduler',
      message: error.message
    });
  }
});

/**
 * GET /api/scheduler/queue
 * Ottiene la coda liste in attesa
 */
router.get('/queue', checkSchedulerService, (req, res) => {
  try {
    const queue = schedulerService.getQueue();

    res.status(200).json({
      success: true,
      data: queue,
      count: queue.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[SchedulerRoutes] Error getting queue:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero coda',
      message: error.message
    });
  }
});

/**
 * GET /api/scheduler/clients
 * Ottiene i client connessi
 */
router.get('/clients', checkSchedulerService, (req, res) => {
  try {
    const clients = schedulerService.getConnectedClients();

    res.status(200).json({
      success: true,
      data: clients,
      count: clients.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[SchedulerRoutes] Error getting clients:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero client connessi',
      message: error.message
    });
  }
});

// ============================================================================
// FETCHER CONTROLS
// ============================================================================

/**
 * POST /api/scheduler/fetcher/start
 * Avvia il Fetcher
 */
router.post('/fetcher/start', checkSchedulerService, async (req, res) => {
  try {
    await schedulerService.startFetcher();

    res.status(200).json({
      success: true,
      message: 'Fetcher avviato con successo',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[SchedulerRoutes] Error starting fetcher:', error);
    res.status(500).json({
      success: false,
      error: 'Errore avvio Fetcher',
      message: error.message
    });
  }
});

/**
 * POST /api/scheduler/fetcher/pause
 * Mette in pausa il Fetcher
 */
router.post('/fetcher/pause', checkSchedulerService, (req, res) => {
  try {
    schedulerService.pauseFetcher();

    res.status(200).json({
      success: true,
      message: 'Fetcher in pausa',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[SchedulerRoutes] Error pausing fetcher:', error);
    res.status(500).json({
      success: false,
      error: 'Errore pausa Fetcher',
      message: error.message
    });
  }
});

/**
 * POST /api/scheduler/fetcher/resume
 * Riprende il Fetcher
 */
router.post('/fetcher/resume', checkSchedulerService, (req, res) => {
  try {
    schedulerService.resumeFetcher();

    res.status(200).json({
      success: true,
      message: 'Fetcher ripreso',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[SchedulerRoutes] Error resuming fetcher:', error);
    res.status(500).json({
      success: false,
      error: 'Errore ripresa Fetcher',
      message: error.message
    });
  }
});

/**
 * POST /api/scheduler/fetcher/force-cycle
 * Forza un ciclo immediato del Fetcher
 */
router.post('/fetcher/force-cycle', checkSchedulerService, async (req, res) => {
  try {
    await schedulerService.forceFetcherCycle();

    res.status(200).json({
      success: true,
      message: 'Ciclo Fetcher forzato',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[SchedulerRoutes] Error forcing fetcher cycle:', error);
    res.status(500).json({
      success: false,
      error: 'Errore force cycle Fetcher',
      message: error.message
    });
  }
});

// ============================================================================
// PROCESSOR CONTROLS
// ============================================================================

/**
 * POST /api/scheduler/processor/start
 * Avvia il Processor
 */
router.post('/processor/start', checkSchedulerService, async (req, res) => {
  try {
    await schedulerService.startProcessor();

    res.status(200).json({
      success: true,
      message: 'Processor avviato con successo',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[SchedulerRoutes] Error starting processor:', error);
    res.status(500).json({
      success: false,
      error: 'Errore avvio Processor',
      message: error.message
    });
  }
});

/**
 * POST /api/scheduler/processor/pause
 * Mette in pausa il Processor
 */
router.post('/processor/pause', checkSchedulerService, (req, res) => {
  try {
    schedulerService.pauseProcessor();

    res.status(200).json({
      success: true,
      message: 'Processor in pausa',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[SchedulerRoutes] Error pausing processor:', error);
    res.status(500).json({
      success: false,
      error: 'Errore pausa Processor',
      message: error.message
    });
  }
});

/**
 * POST /api/scheduler/processor/resume
 * Riprende il Processor
 */
router.post('/processor/resume', checkSchedulerService, (req, res) => {
  try {
    schedulerService.resumeProcessor();

    res.status(200).json({
      success: true,
      message: 'Processor ripreso',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[SchedulerRoutes] Error resuming processor:', error);
    res.status(500).json({
      success: false,
      error: 'Errore ripresa Processor',
      message: error.message
    });
  }
});

/**
 * POST /api/scheduler/processor/force-cycle
 * Forza un ciclo immediato del Processor
 */
router.post('/processor/force-cycle', checkSchedulerService, async (req, res) => {
  try {
    await schedulerService.forceProcessorCycle();

    res.status(200).json({
      success: true,
      message: 'Ciclo Processor forzato',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[SchedulerRoutes] Error forcing processor cycle:', error);
    res.status(500).json({
      success: false,
      error: 'Errore force cycle Processor',
      message: error.message
    });
  }
});

// ============================================================================
// FORCE ALL CYCLES
// ============================================================================

/**
 * POST /api/scheduler/force-cycle
 * Forza un ciclo immediato sia di Fetcher che Processor
 */
router.post('/force-cycle', checkSchedulerService, async (req, res) => {
  try {
    await schedulerService.forceFetcherCycle();
    await schedulerService.forceProcessorCycle();

    res.status(200).json({
      success: true,
      message: 'Ciclo forzato su Fetcher e Processor',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[SchedulerRoutes] Error forcing cycle:', error);
    res.status(500).json({
      success: false,
      error: 'Errore force cycle',
      message: error.message
    });
  }
});

// ============================================================================
// COORDINATOR MONITORING & CONTROL
// ============================================================================

/**
 * GET /api/scheduler/coordinator/status
 * Ottiene lo stato del coordinatore (leadership, Java scheduler status, etc.)
 */
router.get('/coordinator/status', checkSchedulerService, async (req, res) => {
  try {
    const coordinator = schedulerService.coordinator;
    if (!coordinator) {
      return res.status(503).json({
        success: false,
        error: 'Coordinator not initialized'
      });
    }

    const state = coordinator.getState();

    res.status(200).json({
      success: true,
      data: state,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[SchedulerRoutes] Error getting coordinator status:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero stato coordinator',
      message: error.message
    });
  }
});

/**
 * GET /api/scheduler/coordinator/instances
 * Ottiene tutte le istanze attive (Java + Node) dal heartbeat table
 */
router.get('/coordinator/instances', checkSchedulerService, async (req, res) => {
  try {
    const coordinator = schedulerService.coordinator;
    if (!coordinator) {
      return res.status(503).json({
        success: false,
        error: 'Coordinator not initialized'
      });
    }

    const instances = await coordinator.getActiveInstances();

    res.status(200).json({
      success: true,
      data: instances,
      count: instances.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[SchedulerRoutes] Error getting active instances:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero istanze attive',
      message: error.message
    });
  }
});

/**
 * GET /api/scheduler/locks
 * Ottiene i lock attivi sulle liste
 */
router.get('/locks', checkSchedulerService, (req, res) => {
  try {
    const lockManager = schedulerService.lockManager;
    if (!lockManager) {
      return res.status(503).json({
        success: false,
        error: 'Lock manager not initialized'
      });
    }

    const activeLocks = lockManager.getActiveLocks();

    res.status(200).json({
      success: true,
      data: activeLocks,
      count: activeLocks.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[SchedulerRoutes] Error getting locks:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero lock attivi',
      message: error.message
    });
  }
});

/**
 * POST /api/scheduler/coordinator/cleanup-heartbeats
 * Pulizia heartbeat vecchi (housekeeping)
 */
router.post('/coordinator/cleanup-heartbeats', checkSchedulerService, async (req, res) => {
  try {
    const coordinator = schedulerService.coordinator;
    if (!coordinator) {
      return res.status(503).json({
        success: false,
        error: 'Coordinator not initialized'
      });
    }

    await coordinator.cleanupOldHeartbeats();

    res.status(200).json({
      success: true,
      message: 'Old heartbeats cleaned up successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[SchedulerRoutes] Error cleaning up heartbeats:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nella pulizia heartbeat',
      message: error.message
    });
  }
});

/**
 * POST /api/scheduler/locks/cleanup
 * Pulizia lock bloccati (stuck locks)
 */
router.post('/locks/cleanup', checkSchedulerService, async (req, res) => {
  try {
    const lockManager = schedulerService.lockManager;
    if (!lockManager) {
      return res.status(503).json({
        success: false,
        error: 'Lock manager not initialized'
      });
    }

    const maxAgeMs = req.body.maxAgeMs || 60000; // Default 60 secondi
    await lockManager.cleanupStaleLocks(maxAgeMs);

    res.status(200).json({
      success: true,
      message: 'Stale locks cleaned up successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[SchedulerRoutes] Error cleaning up locks:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nella pulizia lock',
      message: error.message
    });
  }
});

// Catch-all per debug di route non trovate nello scheduler
router.all('/*', (_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Scheduler route not found (router reached)',
  });
});

export { router, initSchedulerRoutes };
export { setSchedulerService };
