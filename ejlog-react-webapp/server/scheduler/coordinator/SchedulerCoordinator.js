/**
 * SchedulerCoordinator - Coordina Scheduler Java e Node
 *
 * Risolve i conflitti tra:
 * - WmsPrenotatoreModule (Java su EjLog)
 * - SchedulerService (Node su React WebApp)
 *
 * Strategia:
 * 1. Heartbeat table per rilevare sistema attivo
 * 2. Leader election tramite DB lock
 * 3. Fallback automatico se un sistema cade
 */

import { EventEmitter } from 'events';

export default class SchedulerCoordinator extends EventEmitter {
  constructor(dbPool, config = {}) {
    super();

    this.db = dbPool;
    this.config = {
      heartbeatIntervalMs: config.heartbeatIntervalMs || 5000, // 5s
      heartbeatTimeoutMs: config.heartbeatTimeoutMs || 15000, // 15s
      mode: config.mode || 'AUTO', // AUTO | STANDALONE | SLAVE
      instanceId: config.instanceId || `node-${process.pid}`,
      ...config
    };

    this.state = {
      isLeader: false,
      javaSchedulerActive: false,
      lastJavaHeartbeat: null,
      lastOwnHeartbeat: null
    };

    this.heartbeatInterval = null;
    this.checkInterval = null;

    console.log('[SchedulerCoordinator] Initialized');
    console.log('[SchedulerCoordinator] Mode:', this.config.mode);
    console.log('[SchedulerCoordinator] Instance ID:', this.config.instanceId);
  }

  /**
   * Avvia il coordinatore
   */
  async start() {
    console.log('[SchedulerCoordinator] Starting...');

    // Crea tabella heartbeat se non esiste
    await this.ensureHeartbeatTable();

    // Avvia heartbeat proprio
    this.startHeartbeat();

    // Avvia controllo heartbeat Java
    this.startHealthCheck();

    // Determina leadership iniziale
    await this.electLeader();

    console.log('[SchedulerCoordinator] Started - Is Leader:', this.state.isLeader);
    this.emit('started', { isLeader: this.state.isLeader });
  }

  /**
   * Ferma il coordinatore
   */
  async stop() {
    console.log('[SchedulerCoordinator] Stopping...');

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    // Rimuovi heartbeat dal DB
    await this.removeHeartbeat();

    this.state.isLeader = false;
    this.emit('stopped');
    console.log('[SchedulerCoordinator] Stopped');
  }

  /**
   * Crea tabella SchedulerHeartbeat se non esiste
   */
  async ensureHeartbeatTable() {
    try {
      await this.db.request().query(`
        IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'SchedulerHeartbeat')
        BEGIN
          CREATE TABLE SchedulerHeartbeat (
            id INT IDENTITY(1,1) PRIMARY KEY,
            instanceId NVARCHAR(100) NOT NULL UNIQUE,
            instanceType NVARCHAR(50) NOT NULL, -- 'JAVA' o 'NODE'
            hostname NVARCHAR(200),
            port INT,
            pid INT,
            isLeader BIT DEFAULT 0,
            lastHeartbeat DATETIME NOT NULL,
            version NVARCHAR(50),
            metadata NVARCHAR(MAX), -- JSON con info aggiuntive
            createdAt DATETIME DEFAULT GETDATE(),
            updatedAt DATETIME DEFAULT GETDATE()
          )

          CREATE INDEX IX_SchedulerHeartbeat_LastHeartbeat ON SchedulerHeartbeat(lastHeartbeat)
          CREATE INDEX IX_SchedulerHeartbeat_IsLeader ON SchedulerHeartbeat(isLeader)
        END
      `);
      console.log('[SchedulerCoordinator] ✅ SchedulerHeartbeat table ready');
    } catch (error) {
      console.error('[SchedulerCoordinator] ❌ Error creating heartbeat table:', error.message);
      throw error;
    }
  }

  /**
   * Invia heartbeat periodico
   */
  startHeartbeat() {
    this.heartbeatInterval = setInterval(
      () => this.sendHeartbeat(),
      this.config.heartbeatIntervalMs
    );

    // Primo heartbeat subito
    this.sendHeartbeat();
  }

  /**
   * Invia heartbeat al DB
   */
  async sendHeartbeat() {
    try {
      const metadata = JSON.stringify({
        mode: this.config.mode,
        scheduler: {
          running: this.state.isLeader,
          fetcher: this.state.isLeader,
          processor: this.state.isLeader
        },
        uptime: process.uptime(),
        memory: process.memoryUsage()
      });

      await this.db.request()
        .input('instanceId', this.config.instanceId)
        .input('instanceType', 'NODE')
        .input('hostname', require('os').hostname())
        .input('port', parseInt(process.env.PORT || 3077))
        .input('pid', process.pid)
        .input('isLeader', this.state.isLeader ? 1 : 0)
        .input('version', process.version)
        .input('metadata', metadata)
        .query(`
          IF EXISTS (SELECT 1 FROM SchedulerHeartbeat WHERE instanceId = @instanceId)
            UPDATE SchedulerHeartbeat
            SET lastHeartbeat = GETDATE(),
                isLeader = @isLeader,
                hostname = @hostname,
                port = @port,
                pid = @pid,
                version = @version,
                metadata = @metadata,
                updatedAt = GETDATE()
            WHERE instanceId = @instanceId
          ELSE
            INSERT INTO SchedulerHeartbeat (instanceId, instanceType, hostname, port, pid, isLeader, lastHeartbeat, version, metadata)
            VALUES (@instanceId, @instanceType, @hostname, @port, @pid, @isLeader, GETDATE(), @version, @metadata)
        `);

      this.state.lastOwnHeartbeat = new Date();

    } catch (error) {
      console.error('[SchedulerCoordinator] Error sending heartbeat:', error.message);
    }
  }

  /**
   * Rimuove heartbeat dal DB (shutdown)
   */
  async removeHeartbeat() {
    try {
      await this.db.request()
        .input('instanceId', this.config.instanceId)
        .query(`DELETE FROM SchedulerHeartbeat WHERE instanceId = @instanceId`);

      console.log('[SchedulerCoordinator] Heartbeat removed');
    } catch (error) {
      console.error('[SchedulerCoordinator] Error removing heartbeat:', error.message);
    }
  }

  /**
   * Controlla heartbeat Java periodicamente
   */
  startHealthCheck() {
    this.checkInterval = setInterval(
      () => this.checkJavaScheduler(),
      this.config.heartbeatIntervalMs
    );

    // Primo check subito
    this.checkJavaScheduler();
  }

  /**
   * Verifica se Java Scheduler è attivo
   */
  async checkJavaScheduler() {
    try {
      const result = await this.db.request().query(`
        SELECT TOP 1
          instanceId,
          lastHeartbeat,
          isLeader,
          metadata
        FROM SchedulerHeartbeat
        WHERE instanceType = 'JAVA'
        ORDER BY lastHeartbeat DESC
      `);

      const javaInstance = result.recordset[0];

      if (javaInstance) {
        const heartbeatAge = Date.now() - new Date(javaInstance.lastHeartbeat).getTime();
        const isAlive = heartbeatAge < this.config.heartbeatTimeoutMs;

        const wasActive = this.state.javaSchedulerActive;
        this.state.javaSchedulerActive = isAlive;
        this.state.lastJavaHeartbeat = new Date(javaInstance.lastHeartbeat);

        // Se Java è morto e eravamo slave, diventa leader
        if (wasActive && !isAlive) {
          console.log('[SchedulerCoordinator] ⚠️  Java Scheduler is DOWN - Taking over leadership');
          await this.electLeader();
        }

        // Se Java è vivo e eravamo leader in AUTO mode, cedi leadership
        if (!wasActive && isAlive && this.config.mode === 'AUTO' && this.state.isLeader) {
          console.log('[SchedulerCoordinator] ℹ️  Java Scheduler is UP - Stepping down as leader');
          await this.stepDown();
        }

      } else {
        // Nessun heartbeat Java trovato
        if (this.state.javaSchedulerActive) {
          console.log('[SchedulerCoordinator] ℹ️  Java Scheduler not found in heartbeat table');
          this.state.javaSchedulerActive = false;
          await this.electLeader();
        }
      }

    } catch (error) {
      console.error('[SchedulerCoordinator] Error checking Java scheduler:', error.message);
    }
  }

  /**
   * Elegge il leader (determina chi deve processare liste)
   *
   * Regole:
   * - Mode STANDALONE: Node è sempre leader
   * - Mode SLAVE: Node non è mai leader
   * - Mode AUTO:
   *   - Se Java è attivo -> Java è leader
   *   - Se Java è inattivo -> Node è leader
   */
  async electLeader() {
    try {
      let shouldBeLeader = false;

      if (this.config.mode === 'STANDALONE') {
        shouldBeLeader = true;
      } else if (this.config.mode === 'SLAVE') {
        shouldBeLeader = false;
      } else { // AUTO
        // Node diventa leader se Java non è attivo
        shouldBeLeader = !this.state.javaSchedulerActive;
      }

      const wasLeader = this.state.isLeader;
      this.state.isLeader = shouldBeLeader;

      if (wasLeader !== shouldBeLeader) {
        console.log('[SchedulerCoordinator] Leadership changed:', wasLeader, '->', shouldBeLeader);

        if (shouldBeLeader) {
          this.emit('became-leader');
        } else {
          this.emit('lost-leader');
        }

        // Aggiorna heartbeat
        await this.sendHeartbeat();
      }

    } catch (error) {
      console.error('[SchedulerCoordinator] Error electing leader:', error.message);
    }
  }

  /**
   * Cedi leadership
   */
  async stepDown() {
    if (this.state.isLeader) {
      this.state.isLeader = false;
      this.emit('lost-leader');
      await this.sendHeartbeat();
      console.log('[SchedulerCoordinator] Stepped down as leader');
    }
  }

  /**
   * Ottieni stato corrente
   */
  getState() {
    return {
      ...this.state,
      mode: this.config.mode,
      instanceId: this.config.instanceId
    };
  }

  /**
   * Verifica se Node può processare liste
   */
  canProcessLists() {
    return this.state.isLeader;
  }

  /**
   * Ottieni tutte le istanze attive
   */
  async getActiveInstances() {
    try {
      const result = await this.db.request().query(`
        SELECT
          instanceId,
          instanceType,
          hostname,
          port,
          pid,
          isLeader,
          lastHeartbeat,
          version,
          metadata,
          DATEDIFF(SECOND, lastHeartbeat, GETDATE()) as secondsSinceHeartbeat
        FROM SchedulerHeartbeat
        WHERE DATEDIFF(SECOND, lastHeartbeat, GETDATE()) < ${this.config.heartbeatTimeoutMs / 1000}
        ORDER BY isLeader DESC, lastHeartbeat DESC
      `);

      return result.recordset.map(row => ({
        ...row,
        isAlive: row.secondsSinceHeartbeat < (this.config.heartbeatTimeoutMs / 1000),
        metadata: row.metadata ? JSON.parse(row.metadata) : null
      }));

    } catch (error) {
      console.error('[SchedulerCoordinator] Error getting active instances:', error.message);
      return [];
    }
  }

  /**
   * Pulisci heartbeat vecchi (housekeeping)
   */
  async cleanupOldHeartbeats() {
    try {
      const result = await this.db.request().query(`
        DELETE FROM SchedulerHeartbeat
        WHERE DATEDIFF(HOUR, lastHeartbeat, GETDATE()) > 24
      `);

      if (result.rowsAffected[0] > 0) {
        console.log(`[SchedulerCoordinator] Cleaned up ${result.rowsAffected[0]} old heartbeats`);
      }
    } catch (error) {
      console.error('[SchedulerCoordinator] Error cleaning up heartbeats:', error.message);
    }
  }
}

