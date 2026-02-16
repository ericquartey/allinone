/**
 * JWT Authentication Middleware
 *
 * Middleware Express per validare JWT token e proteggere endpoint REST.
 * Integrato con il sistema di autenticazione EjLog esistente.
 *
 * Features:
 * - JWT token validation con verifica firma e scadenza
 * - Estrazione claims (username, groupLevel, userId)
 * - Whitelist endpoint pubblici (login, swagger, health)
 * - Error handling con risposte JSON strutturate
 * - Logging richieste autenticate
 * - Token refresh supportato
 *
 * @module middleware/jwt-auth
 */

import { verifyToken, extractTokenFromHeader } from '../jwt-utils.js';

/**
 * Endpoint che NON richiedono autenticazione (whitelist)
 * IMPORTANTE: I path sono relativi perché il middleware è montato su `/api`
 * Quindi `/api/auth/login` diventa `/auth/login` quando arriva al middleware
 */
const PUBLIC_ENDPOINTS = [
  '/auth/login',
  '/auth/refresh',
  '/health',
  '/version',
  // Questi sono fuori da /api quindi includono il path completo
  '/api-docs',
  '/swagger',
  '/swagger-ui',
  '/swagger.json',
  '/swagger.yaml'
];

/**
 * Verifica se un endpoint è nella whitelist pubblica
 * @param {string} path - Request path
 * @returns {boolean} true se pubblico, false se richiede auth
 */
function isPublicEndpoint(path) {
  return PUBLIC_ENDPOINTS.some(endpoint =>
    path === endpoint || path.startsWith(endpoint + '/')
  );
}

/**
 * Middleware per autenticazione JWT
 *
 * Workflow:
 * 1. Controlla se endpoint è pubblico (whitelist)
 * 2. Estrae token dall'header Authorization (Bearer scheme)
 * 3. Valida token JWT (firma + scadenza)
 * 4. Estrae user claims e li aggiunge a req.user
 * 5. Permette accesso o ritorna 401/403
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export function authenticateJWT(req, res, next) {
  const requestPath = req.path || req.url;

  // Skip authentication per endpoint pubblici
  if (isPublicEndpoint(requestPath)) {
    console.log(`🔓 Public endpoint: ${req.method} ${requestPath}`);
    return next();
  }

  // Estrai token dall'header Authorization
  const authHeader = req.headers['authorization'];
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    console.warn(`❌ No token provided for: ${req.method} ${requestPath}`);
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      message: 'No authentication token provided. Please login.',
      code: 'NO_TOKEN'
    });
  }

  try {
    // Verifica e decodifica JWT token
    const decoded = verifyToken(token);

    // Aggiungi user info alla richiesta per uso downstream
    req.user = {
      id: decoded.id,
      username: decoded.username,
      groupId: decoded.groupId,
      groupName: decoded.groupName,
      groupLevel: decoded.groupLevel,
      languageId: decoded.languageId,
      isSuperuser: decoded.isSuperuser || decoded.groupLevel === 0
    };

    // Log richiesta autenticata (solo in development)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`✅ Authenticated: ${req.user.username} (${req.user.groupName}) → ${req.method} ${requestPath}`);
    }

    next();
  } catch (error) {
    // Token invalido o scaduto
    console.error(`❌ JWT validation failed: ${error.message}`);

    const isExpired = error.message.includes('scaduto') || error.message.includes('expired');

    return res.status(403).json({
      success: false,
      error: 'Invalid or expired token',
      message: isExpired
        ? 'Your session has expired. Please login again.'
        : 'Invalid authentication token. Please login again.',
      code: isExpired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN'
    });
  }
}

/**
 * Middleware per verificare che l'utente sia Superuser (groupLevel === 0)
 *
 * Da usare DOPO authenticateJWT
 * Esempio: router.delete('/admin', authenticateJWT, requireSuperuser, handler)
 *
 * @param {Object} req - Express request (deve avere req.user)
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export function requireSuperuser(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      message: 'User not authenticated',
      code: 'NOT_AUTHENTICATED'
    });
  }

  if (req.user.groupLevel !== 0 && !req.user.isSuperuser) {
    console.warn(`⚠️  Access denied: ${req.user.username} is not superuser (level: ${req.user.groupLevel})`);

    return res.status(403).json({
      success: false,
      error: 'Insufficient privileges',
      message: 'Only superusers can access this resource',
      code: 'SUPERUSER_REQUIRED',
      requiredLevel: 0,
      userLevel: req.user.groupLevel
    });
  }

  next();
}

/**
 * Middleware per verificare livello minimo privilegi
 *
 * Livelli: 0 = Superuser, 1 = Admin, 2 = User, 3+ = Guest
 * Livelli più bassi hanno più privilegi
 *
 * Da usare DOPO authenticateJWT
 * Esempio: router.post('/users', authenticateJWT, requireMinLevel(1), handler)
 *
 * @param {number} minLevel - Livello minimo richiesto (0-999)
 * @returns {Function} Express middleware
 */
export function requireMinLevel(minLevel) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'User not authenticated',
        code: 'NOT_AUTHENTICATED'
      });
    }

    // Livello 0 (superuser) ha accesso a tutto
    if (req.user.groupLevel === 0) {
      return next();
    }

    // Verifica livello privilegi (numero più basso = più privilegi)
    if (req.user.groupLevel > minLevel) {
      console.warn(
        `⚠️  Access denied: ${req.user.username} (level ${req.user.groupLevel}) ` +
        `requires level ${minLevel} or lower`
      );

      return res.status(403).json({
        success: false,
        error: 'Insufficient privileges',
        message: `This operation requires privilege level ${minLevel} or higher`,
        code: 'INSUFFICIENT_PRIVILEGES',
        requiredLevel: minLevel,
        userLevel: req.user.groupLevel
      });
    }

    next();
  };
}

/**
 * Middleware opzionale: autentica se token presente, altrimenti continua
 *
 * Utile per endpoint che possono essere usati sia da utenti autenticati che anonimi
 * Esempio: router.get('/public-data', optionalAuth, handler)
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    // Nessun token, continua senza autenticazione
    req.user = null;
    return next();
  }

  try {
    const decoded = verifyToken(token);
    req.user = {
      id: decoded.id,
      username: decoded.username,
      groupId: decoded.groupId,
      groupName: decoded.groupName,
      groupLevel: decoded.groupLevel,
      languageId: decoded.languageId,
      isSuperuser: decoded.isSuperuser || decoded.groupLevel === 0
    };

    console.log(`✅ Optional auth: ${req.user.username}`);
  } catch (error) {
    // Token invalido, continua senza autenticazione
    console.warn('⚠️  Optional auth: invalid token, continuing without authentication');
    req.user = null;
  }

  next();
}

/**
 * Aggiungi endpoint alla whitelist pubblica
 * @param {string|string[]} endpoints - Endpoint o array di endpoint da aggiungere
 */
export function addPublicEndpoints(endpoints) {
  const endpointsArray = Array.isArray(endpoints) ? endpoints : [endpoints];
  PUBLIC_ENDPOINTS.push(...endpointsArray);
  console.log(`✅ Added ${endpointsArray.length} public endpoints to whitelist`);
}

/**
 * Ottieni lista endpoint pubblici (per debugging)
 * @returns {string[]} Array di endpoint pubblici
 */
export function getPublicEndpoints() {
  return [...PUBLIC_ENDPOINTS];
}

export default {
  authenticateJWT,
  requireSuperuser,
  requireMinLevel,
  optionalAuth,
  addPublicEndpoints,
  getPublicEndpoints
};
