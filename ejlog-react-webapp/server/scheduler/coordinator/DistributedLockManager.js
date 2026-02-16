/**
 * DistributedLockManager - Gestisce lock distribuiti su DB
 *
 * Evita che Java e Node processino la stessa lista contemporaneamente.
 * Usa SQL Server Application Locks (sp_getapplock / sp_releaseapplock)
 */

export default class DistributedLockManager {
  constructor(dbPool, config = {}) {
    this.db = dbPool;
    this.config = {
      lockTimeoutMs: config.lockTimeoutMs || 5000, // 5s timeout per acquisire lock
      lockScope: config.lockScope || 'Session', // Session | Transaction
      ...config
    };

    this.activeLocks = new Map(); // lockName -> { connection, acquiredAt }

    console.log('[DistributedLockManager] Initialized');
  }

  /**
   * Acquisisce un lock su una lista
   *
   * @param {number} listaId - ID della lista
   * @param {string} owner - Identificativo del proprietario (es: 'node-12345', 'java-main')
   * @returns {Promise<boolean>} true se lock acquisito
   */
  async acquireLock(listaId, owner) {
    const lockName = `Lista_${listaId}`;

    try {
      // Usa sp_getapplock di SQL Server
      // LockMode: Exclusive
      // LockOwner: Session (default) o Transaction
      // LockTimeout: millisecondi
      // Return values:
      //   0 = lock granted immediately
      //   1 = lock granted after waiting
      //   -1 = timeout
      //   -2 = canceled
      //   -3 = deadlock victim
      //   -999 = parameter/other error

      const result = await this.db.request()
        .input('Resource', lockName)
        .input('LockMode', 'Exclusive')
        .input('LockOwner', this.config.lockScope)
        .input('LockTimeout', this.config.lockTimeoutMs)
        .input('DbPrincipal', 'public')
        .query(`
          DECLARE @result INT
          EXEC @result = sp_getapplock
            @Resource = @Resource,
            @LockMode = @LockMode,
            @LockOwner = @LockOwner,
            @LockTimeout = @LockTimeout,
            @DbPrincipal = @DbPrincipal
          SELECT @result as lockResult
        `);

      const lockResult = result.recordset[0].lockResult;

      if (lockResult >= 0) {
        // Lock acquisito
        this.activeLocks.set(lockName, {
          listaId,
          owner,
          acquiredAt: new Date(),
          lockResult
        });

        console.log(`[DistributedLockManager] ✅ Lock acquired: ${lockName} by ${owner}`);
        return true;
      } else {
        // Lock non acquisito
        console.log(`[DistributedLockManager] ❌ Failed to acquire lock: ${lockName} (result: ${lockResult})`);
        return false;
      }

    } catch (error) {
      console.error(`[DistributedLockManager] Error acquiring lock ${lockName}:`, error.message);
      return false;
    }
  }

  /**
   * Rilascia un lock su una lista
   *
   * @param {number} listaId - ID della lista
   * @returns {Promise<boolean>} true se lock rilasciato
   */
  async releaseLock(listaId) {
    const lockName = `Lista_${listaId}`;

    try {
      if (!this.activeLocks.has(lockName)) {
        console.warn(`[DistributedLockManager] ⚠️  No active lock found for ${lockName}`);
        return true; // Non è un errore, semplicemente non c'è lock
      }

      const result = await this.db.request()
        .input('Resource', lockName)
        .input('LockOwner', this.config.lockScope)
        .input('DbPrincipal', 'public')
        .query(`
          DECLARE @result INT
          EXEC @result = sp_releaseapplock
            @Resource = @Resource,
            @LockOwner = @LockOwner,
            @DbPrincipal = @DbPrincipal
          SELECT @result as releaseResult
        `);

      const releaseResult = result.recordset[0].releaseResult;

      if (releaseResult >= 0) {
        this.activeLocks.delete(lockName);
        console.log(`[DistributedLockManager] ✅ Lock released: ${lockName}`);
        return true;
      } else {
        console.warn(`[DistributedLockManager] ⚠️  Failed to release lock: ${lockName} (result: ${releaseResult})`);
        return false;
      }

    } catch (error) {
      console.error(`[DistributedLockManager] Error releasing lock ${lockName}:`, error.message);
      return false;
    }
  }

  /**
   * Acquisisce lock con retry automatico
   *
   * @param {number} listaId
   * @param {string} owner
   * @param {number} maxRetries
   * @param {number} retryDelayMs
   * @returns {Promise<boolean>}
   */
  async acquireLockWithRetry(listaId, owner, maxRetries = 3, retryDelayMs = 500) {
    for (let i = 0; i < maxRetries; i++) {
      const acquired = await this.acquireLock(listaId, owner);
      if (acquired) return true;

      if (i < maxRetries - 1) {
        console.log(`[DistributedLockManager] Retry ${i + 1}/${maxRetries} for lista ${listaId}...`);
        await new Promise(resolve => setTimeout(resolve, retryDelayMs));
      }
    }

    return false;
  }

  /**
   * Esegue una funzione con lock automatico
   *
   * @param {number} listaId
   * @param {string} owner
   * @param {Function} fn - Funzione async da eseguire
   * @returns {Promise<any>} Risultato della funzione
   */
  async withLock(listaId, owner, fn) {
    const acquired = await this.acquireLock(listaId, owner);

    if (!acquired) {
      throw new Error(`Failed to acquire lock for lista ${listaId}`);
    }

    try {
      return await fn();
    } finally {
      await this.releaseLock(listaId);
    }
  }

  /**
   * Controlla se una lista è lockkata
   *
   * @param {number} listaId
   * @returns {Promise<boolean>}
   */
  async isLocked(listaId) {
    const lockName = `Lista_${listaId}`;

    try {
      // Query sys.dm_tran_locks per verificare lock esistenti
      const result = await this.db.request()
        .input('ResourceDescription', `${lockName}%`)
        .query(`
          SELECT COUNT(*) as lockCount
          FROM sys.dm_tran_locks
          WHERE resource_type = 'APPLICATION'
            AND resource_description LIKE @ResourceDescription
        `);

      return result.recordset[0].lockCount > 0;

    } catch (error) {
      console.error(`[DistributedLockManager] Error checking lock status:`, error.message);
      return false;
    }
  }

  /**
   * Rilascia tutti i lock attivi (cleanup)
   */
  async releaseAllLocks() {
    const locks = Array.from(this.activeLocks.keys());
    console.log(`[DistributedLockManager] Releasing ${locks.length} active locks...`);

    for (const lockName of locks) {
      const lockInfo = this.activeLocks.get(lockName);
      if (lockInfo) {
        await this.releaseLock(lockInfo.listaId);
      }
    }

    console.log('[DistributedLockManager] All locks released');
  }

  /**
   * Ottieni info sui lock attivi
   */
  getActiveLocks() {
    return Array.from(this.activeLocks.entries()).map(([name, info]) => ({
      lockName: name,
      ...info,
      heldFor: Date.now() - info.acquiredAt.getTime()
    }));
  }

  /**
   * Cleanup lock vecchi (stuck locks)
   * Da chiamare periodicamente per evitare lock orfani
   */
  async cleanupStaleLocks(maxAgeMs = 60000) {
    const now = Date.now();
    const staleLocks = [];

    for (const [lockName, info] of this.activeLocks.entries()) {
      const age = now - info.acquiredAt.getTime();
      if (age > maxAgeMs) {
        staleLocks.push({ lockName, info, age });
      }
    }

    if (staleLocks.length > 0) {
      console.warn(`[DistributedLockManager] Found ${staleLocks.length} stale locks`);

      for (const { lockName, info } of staleLocks) {
        console.warn(`[DistributedLockManager] Releasing stale lock: ${lockName} (held for ${info.age}ms)`);
        await this.releaseLock(info.listaId);
      }
    }
  }
}
