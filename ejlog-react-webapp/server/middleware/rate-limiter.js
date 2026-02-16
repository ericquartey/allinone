/**
 * Rate Limiting Middleware
 *
 * Implementa rate limiting per proteggere contro:
 * - Brute force attacks
 * - DDoS attacks
 * - API abuse
 *
 * Utilizza algoritmo token bucket con storage in-memory
 * (Production: usare Redis per supporto multi-instance)
 *
 * @author Elio (Full-Stack Architect)
 * @date 2025-12-09
 * @version 1.0.0
 */

/**
 * Storage in-memory per rate limiting
 * Key format: "ip:endpoint" o "user:endpoint"
 * Value: { tokens: number, lastRefill: timestamp }
 */
const rateLimitStore = new Map();

/**
 * Configurazione rate limits per endpoint
 */
const RATE_LIMITS = {
  // Login endpoint: 50 tentativi per 15 minuti (aumentato per test automatici)
  '/api/auth/login': {
    maxRequests: 50,
    windowMs: 15 * 60 * 1000, // 15 minuti
    message: 'Troppi tentativi di login. Riprova tra 15 minuti.'
  },

  // Refresh token: 10 richieste per minuto
  '/api/auth/refresh': {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minuto
    message: 'Troppe richieste di refresh. Riprova tra 1 minuto.'
  },

  // API generiche: 100 richieste per minuto
  '/api/*': {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minuto
    message: 'Limite di richieste superato. Riprova tra 1 minuto.'
  }
};

/**
 * Estrae IP client dalla richiesta
 *
 * @param {Object} req - Express request
 * @returns {string} Client IP address
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
 * Trova la configurazione rate limit per un endpoint
 *
 * @param {string} path - Request path
 * @returns {Object|null} Rate limit config o null
 */
function getRateLimitConfig(path) {
  // Exact match
  if (RATE_LIMITS[path]) {
    return RATE_LIMITS[path];
  }

  // Wildcard match
  for (const [pattern, config] of Object.entries(RATE_LIMITS)) {
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      if (path.startsWith(prefix)) {
        return config;
      }
    }
  }

  return null;
}

/**
 * Verifica se la richiesta è entro i limiti
 *
 * @param {string} key - Chiave identificativa (IP + endpoint)
 * @param {Object} config - Configurazione rate limit
 * @returns {Object} { allowed: boolean, remaining: number, resetTime: number }
 */
function checkRateLimit(key, config) {
  const now = Date.now();
  let bucket = rateLimitStore.get(key);

  // Inizializza nuovo bucket
  if (!bucket) {
    bucket = {
      tokens: config.maxRequests - 1, // Consuma 1 token
      lastRefill: now,
      resetTime: now + config.windowMs
    };
    rateLimitStore.set(key, bucket);

    return {
      allowed: true,
      remaining: bucket.tokens,
      resetTime: bucket.resetTime
    };
  }

  // Refill tokens se la finestra è scaduta
  if (now >= bucket.resetTime) {
    bucket.tokens = config.maxRequests - 1;
    bucket.lastRefill = now;
    bucket.resetTime = now + config.windowMs;
    rateLimitStore.set(key, bucket);

    return {
      allowed: true,
      remaining: bucket.tokens,
      resetTime: bucket.resetTime
    };
  }

  // Verifica tokens disponibili
  if (bucket.tokens > 0) {
    bucket.tokens--;
    rateLimitStore.set(key, bucket);

    return {
      allowed: true,
      remaining: bucket.tokens,
      resetTime: bucket.resetTime
    };
  }

  // Rate limit exceeded
  return {
    allowed: false,
    remaining: 0,
    resetTime: bucket.resetTime
  };
}

/**
 * Middleware rate limiting globale
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export function rateLimiter(req, res, next) {
  const config = getRateLimitConfig(req.path);

  // Nessun rate limit configurato per questo endpoint
  if (!config) {
    return next();
  }

  const clientIP = getClientIP(req);
  const key = `${clientIP}:${req.path}`;

  const result = checkRateLimit(key, config);

  // Aggiungi headers di rate limiting
  res.setHeader('X-RateLimit-Limit', config.maxRequests);
  res.setHeader('X-RateLimit-Remaining', result.remaining);
  res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000));

  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);

    console.warn(`🚫 Rate limit exceeded for ${clientIP} on ${req.path}`);

    res.setHeader('Retry-After', retryAfter);
    return res.status(429).json({
      success: false,
      error: 'Too Many Requests',
      message: config.message,
      retryAfter: retryAfter
    });
  }

  console.log(`✅ Rate limit OK: ${clientIP} → ${req.path} (${result.remaining} remaining)`);
  next();
}

/**
 * Crea rate limiter specifico per un endpoint
 *
 * @param {Object} options - { maxRequests, windowMs, message }
 * @returns {Function} Express middleware
 */
export function createRateLimiter(options) {
  const config = {
    maxRequests: options.maxRequests || 100,
    windowMs: options.windowMs || 60000,
    message: options.message || 'Rate limit exceeded'
  };

  return function (req, res, next) {
    const clientIP = getClientIP(req);
    const key = `${clientIP}:${req.path}`;

    const result = checkRateLimit(key, config);

    res.setHeader('X-RateLimit-Limit', config.maxRequests);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000));

    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
      res.setHeader('Retry-After', retryAfter);

      return res.status(429).json({
        success: false,
        error: 'Too Many Requests',
        message: config.message,
        retryAfter: retryAfter
      });
    }

    next();
  };
}

/**
 * Cleanup periodico della rate limit store
 * Rimuove entries scadute per liberare memoria
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  let removed = 0;

  for (const [key, bucket] of rateLimitStore.entries()) {
    if (now >= bucket.resetTime + 60000) { // 1 minuto dopo reset
      rateLimitStore.delete(key);
      removed++;
    }
  }

  if (removed > 0) {
    console.log(`🧹 Rate limiter cleanup: rimossi ${removed} entries`);
  }
}

// Cleanup ogni 5 minuti
setInterval(cleanupExpiredEntries, 5 * 60 * 1000);

/**
 * Ottieni statistiche rate limiting (per monitoring)
 *
 * @returns {Object} Statistiche
 */
export function getRateLimitStats() {
  return {
    totalEntries: rateLimitStore.size,
    endpoints: Array.from(rateLimitStore.keys()).map(key => {
      const [ip, endpoint] = key.split(':');
      const bucket = rateLimitStore.get(key);
      return {
        ip,
        endpoint,
        remaining: bucket.tokens,
        resetTime: new Date(bucket.resetTime).toISOString()
      };
    })
  };
}

export default {
  rateLimiter,
  createRateLimiter,
  getRateLimitStats,
  RATE_LIMITS
};
