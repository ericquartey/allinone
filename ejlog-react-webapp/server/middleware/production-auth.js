/**
 * Production Authentication Middleware Configuration
 *
 * Questo file abilita l'autenticazione JWT su tutti gli endpoint API
 * in modalità production. In development, l'autenticazione è opzionale.
 *
 * @author Elio (Full-Stack Architect)
 * @date 2025-12-09
 * @version 1.0.0
 */

import { authenticateToken, optionalAuth } from './auth-middleware.js';

/**
 * Determina se siamo in modalità production
 * Basato su NODE_ENV environment variable
 */
const isProduction = () => {
  return process.env.NODE_ENV === 'production';
};

/**
 * Middleware che applica autenticazione basata sull'ambiente
 *
 * - PRODUCTION: Autenticazione obbligatoria (authenticateToken)
 * - DEVELOPMENT: Autenticazione opzionale (optionalAuth)
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export function environmentBasedAuth(req, res, next) {
  if (isProduction()) {
    // Production: autenticazione obbligatoria
    console.log(`🔒 [PRODUCTION] Autenticazione obbligatoria per: ${req.method} ${req.path}`);
    return authenticateToken(req, res, next);
  } else {
    // Development: autenticazione opzionale
    console.log(`🔓 [DEVELOPMENT] Autenticazione opzionale per: ${req.method} ${req.path}`);
    return optionalAuth(req, res, next);
  }
}

/**
 * Wrapper per forzare autenticazione indipendentemente dall'ambiente
 * Usare per endpoint particolarmente sensibili
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export function forceAuth(req, res, next) {
  console.log(`🔐 [FORCED AUTH] Autenticazione forzata per: ${req.method} ${req.path}`);
  return authenticateToken(req, res, next);
}

/**
 * Lista di endpoint pubblici che non richiedono autenticazione
 * anche in production
 */
const PUBLIC_ENDPOINTS = [
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/item-images/file',
  '/health',
  '/ready',
  '/api-docs',
  '/swagger-ui',
  '/swagger-resources',
  '/v2/api-docs'
];

/**
 * Verifica se un endpoint è pubblico
 *
 * @param {string} path - Path della richiesta
 * @returns {boolean} true se l'endpoint è pubblico
 */
export function isPublicEndpoint(path) {
  return PUBLIC_ENDPOINTS.some(publicPath =>
    path === publicPath || path.startsWith(publicPath)
  );
}

/**
 * Middleware intelligente che applica autenticazione solo agli endpoint privati
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export function smartAuth(req, res, next) {
  const path = req.path;

  // Salta autenticazione per endpoint pubblici
  if (isPublicEndpoint(path)) {
    console.log(`✅ [PUBLIC] Endpoint pubblico: ${req.method} ${path}`);
    return next();
  }

  // Applica autenticazione basata sull'ambiente
  return environmentBasedAuth(req, res, next);
}

/**
 * Configurazione consigliata per environment variables
 *
 * Development:
 *   NODE_ENV=development
 *
 * Production:
 *   NODE_ENV=production
 *   JWT_SECRET=<your-secret-key-here>
 *   JWT_REFRESH_SECRET=<your-refresh-secret-here>
 */

export default {
  environmentBasedAuth,
  forceAuth,
  smartAuth,
  isPublicEndpoint,
  isProduction
};
