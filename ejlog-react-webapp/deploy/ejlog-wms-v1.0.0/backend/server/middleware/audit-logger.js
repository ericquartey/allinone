/**
 * Audit Trail Middleware
 *
 * Registra tutte le attività degli utenti per:
 * - Security auditing
 * - Compliance (GDPR, SOX, etc.)
 * - Troubleshooting
 * - Analytics
 *
 * Log format: JSON structured logging
 * Storage: File-based (production: database o servizio centralizzato)
 *
 * @author Elio (Full-Stack Architect)
 * @date 2025-12-09
 * @version 1.0.0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directory per audit logs
const AUDIT_LOG_DIR = path.join(__dirname, '..', 'logs', 'audit');

// Crea directory se non esiste
if (!fs.existsSync(AUDIT_LOG_DIR)) {
  fs.mkdirSync(AUDIT_LOG_DIR, { recursive: true });
}

/**
 * Genera nome file log basato sulla data corrente
 * Format: audit-YYYY-MM-DD.log
 *
 * @returns {string} Nome file log
 */
function getLogFileName() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `audit-${year}-${month}-${day}.log`;
}

/**
 * Scrive entry nel log file
 *
 * @param {Object} entry - Entry da loggare
 */
function writeAuditLog(entry) {
  const logFile = path.join(AUDIT_LOG_DIR, getLogFileName());
  const logLine = JSON.stringify(entry) + '\n';

  fs.appendFile(logFile, logLine, (err) => {
    if (err) {
      console.error('❌ Errore scrittura audit log:', err);
    }
  });
}

/**
 * Estrae IP client dalla richiesta
 *
 * @param {Object} req - Express request
 * @returns {string} Client IP
 */
function getClientIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

/**
 * Sanitizza dati sensibili dai parametri
 *
 * @param {Object} data - Dati da sanitizzare
 * @returns {Object} Dati sanitizzati
 */
function sanitizeSensitiveData(data) {
  if (!data) return data;

  const sanitized = { ...data };
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'authorization'];

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***';
    }
  }

  return sanitized;
}

/**
 * Determina se una richiesta dovrebbe essere loggata
 *
 * @param {Object} req - Express request
 * @returns {boolean} true se dovrebbe essere loggata
 */
function shouldLogRequest(req) {
  // Non loggare health checks
  if (req.path === '/health' || req.path === '/ready') {
    return false;
  }

  // Non loggare richieste statiche
  if (req.path.startsWith('/static') || req.path.startsWith('/assets')) {
    return false;
  }

  // Logga sempre operazioni di modifica
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    return true;
  }

  // Logga GET solo per endpoint sensibili
  if (req.method === 'GET') {
    const sensitiveEndpoints = ['/api/users', '/api/auth', '/api/config'];
    return sensitiveEndpoints.some(endpoint => req.path.startsWith(endpoint));
  }

  return false;
}

/**
 * Middleware audit logging
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export function auditLogger(req, res, next) {
  if (!shouldLogRequest(req)) {
    return next();
  }

  const startTime = Date.now();

  // Capture response
  const originalSend = res.send;
  res.send = function (data) {
    res.send = originalSend;

    const duration = Date.now() - startTime;

    const auditEntry = {
      timestamp: new Date().toISOString(),
      requestId: req.id || generateRequestId(),
      method: req.method,
      path: req.path,
      url: req.originalUrl,
      query: sanitizeSensitiveData(req.query),
      body: sanitizeSensitiveData(req.body),
      user: req.user ? {
        id: req.user.id,
        username: req.user.username,
        groupLevel: req.user.groupLevel
      } : null,
      clientIP: getClientIP(req),
      userAgent: req.headers['user-agent'],
      statusCode: res.statusCode,
      duration: duration,
      success: res.statusCode >= 200 && res.statusCode < 400
    };

    // Scrivi log
    writeAuditLog(auditEntry);

    // Log su console in development
    if (process.env.NODE_ENV !== 'production') {
      const emoji = auditEntry.success ? '✅' : '❌';
      console.log(`${emoji} [AUDIT] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms) - User: ${auditEntry.user?.username || 'anonymous'}`);
    }

    return originalSend.call(this, data);
  };

  next();
}

/**
 * Genera request ID univoco
 *
 * @returns {string} Request ID
 */
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Logga evento personalizzato (non HTTP request)
 *
 * @param {string} event - Nome evento
 * @param {Object} data - Dati evento
 * @param {Object} user - Utente (opzionale)
 */
export function logAuditEvent(event, data, user = null) {
  const auditEntry = {
    timestamp: new Date().toISOString(),
    type: 'event',
    event: event,
    data: sanitizeSensitiveData(data),
    user: user ? {
      id: user.id,
      username: user.username
    } : null
  };

  writeAuditLog(auditEntry);

  if (process.env.NODE_ENV !== 'production') {
    console.log(`📝 [AUDIT EVENT] ${event} - User: ${user?.username || 'system'}`);
  }
}

/**
 * Leggi audit logs per un determinato giorno
 *
 * @param {string} date - Data (formato: YYYY-MM-DD)
 * @returns {Promise<Array>} Array di audit entries
 */
export async function readAuditLogs(date) {
  const logFile = path.join(AUDIT_LOG_DIR, `audit-${date}.log`);

  return new Promise((resolve, reject) => {
    fs.readFile(logFile, 'utf8', (err, data) => {
      if (err) {
        if (err.code === 'ENOENT') {
          resolve([]); // File non esiste
        } else {
          reject(err);
        }
        return;
      }

      const lines = data.trim().split('\n');
      const entries = lines
        .filter(line => line.trim())
        .map(line => {
          try {
            return JSON.parse(line);
          } catch (e) {
            console.error('Errore parsing audit log:', e);
            return null;
          }
        })
        .filter(entry => entry !== null);

      resolve(entries);
    });
  });
}

/**
 * Ottieni statistiche audit per un periodo
 *
 * @param {string} startDate - Data inizio (YYYY-MM-DD)
 * @param {string} endDate - Data fine (YYYY-MM-DD)
 * @returns {Promise<Object>} Statistiche
 */
export async function getAuditStats(startDate, endDate) {
  // Implementation per aggregare stats da multiple log files
  // Per semplicità, questa è una versione base

  const logs = await readAuditLogs(startDate);

  const stats = {
    totalRequests: logs.length,
    successfulRequests: logs.filter(l => l.success).length,
    failedRequests: logs.filter(l => !l.success).length,
    uniqueUsers: new Set(logs.filter(l => l.user).map(l => l.user.username)).size,
    topEndpoints: {},
    methodDistribution: {}
  };

  // Calcola top endpoints
  for (const log of logs) {
    stats.topEndpoints[log.path] = (stats.topEndpoints[log.path] || 0) + 1;
    stats.methodDistribution[log.method] = (stats.methodDistribution[log.method] || 0) + 1;
  }

  return stats;
}

/**
 * Cleanup vecchi log files (retention policy)
 * Mantieni solo ultimi N giorni di logs
 *
 * @param {number} retentionDays - Giorni di retention (default: 90)
 */
export function cleanupOldLogs(retentionDays = 90) {
  fs.readdir(AUDIT_LOG_DIR, (err, files) => {
    if (err) {
      console.error('Errore lettura audit log directory:', err);
      return;
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    files.forEach(file => {
      if (!file.startsWith('audit-') || !file.endsWith('.log')) {
        return;
      }

      // Estrai data dal nome file: audit-YYYY-MM-DD.log
      const match = file.match(/audit-(\d{4}-\d{2}-\d{2})\.log/);
      if (!match) return;

      const fileDate = new Date(match[1]);
      if (fileDate < cutoffDate) {
        const filePath = path.join(AUDIT_LOG_DIR, file);
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error(`Errore eliminazione log ${file}:`, err);
          } else {
            console.log(`🗑️  Eliminato vecchio audit log: ${file}`);
          }
        });
      }
    });
  });
}

// Cleanup automatico ogni giorno
setInterval(() => cleanupOldLogs(90), 24 * 60 * 60 * 1000);

export default {
  auditLogger,
  logAuditEvent,
  readAuditLogs,
  getAuditStats,
  cleanupOldLogs
};
