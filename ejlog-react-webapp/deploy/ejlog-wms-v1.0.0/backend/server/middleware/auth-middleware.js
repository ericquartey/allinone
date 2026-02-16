/**
 * Authentication Middleware
 *
 * Middleware Express per validare JWT token nelle richieste protette
 */

import { verifyToken, extractTokenFromHeader } from '../jwt-utils.js';

/**
 * Middleware per autenticazione JWT
 *
 * Verifica che la richiesta contenga un token JWT valido nell'header Authorization.
 * Se valido, aggiunge i dati utente a req.user
 *
 * Header formato: Authorization: Bearer <token>
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Token di autenticazione mancante',
      message: 'Accesso negato. Effettua il login.'
    });
  }

  try {
    // Verifica e decodifica il token
    const decoded = verifyToken(token);

    // Aggiungi i dati utente alla richiesta
    req.user = {
      id: decoded.id,
      username: decoded.username,
      groupId: decoded.groupId,
      groupName: decoded.groupName,
      groupLevel: decoded.groupLevel,
      isSuperuser: decoded.isSuperuser
    };

    // Log per debug (rimuovere in produzione)
    console.log(`🔓 Autenticazione riuscita - User: ${req.user.username} (ID: ${req.user.id})`);

    next();
  } catch (error) {
    console.error('❌ Errore validazione token:', error.message);

    return res.status(403).json({
      success: false,
      error: 'Token non valido o scaduto',
      message: error.message
    });
  }
}

/**
 * Middleware per verificare che l'utente sia superuser
 *
 * Deve essere usato DOPO authenticateToken
 *
 * @param {Object} req - Express request (deve avere req.user)
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export function requireSuperuser(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Utente non autenticato'
    });
  }

  if (!req.user.isSuperuser || req.user.groupLevel !== 0) {
    console.warn(`⚠️  Accesso negato - User: ${req.user.username} non è superuser`);

    return res.status(403).json({
      success: false,
      error: 'Accesso negato',
      message: 'Solo i superuser possono accedere a questa risorsa'
    });
  }

  console.log(`✅ Accesso superuser consentito - User: ${req.user.username}`);
  next();
}

/**
 * Middleware per verificare livello privilegi minimo
 *
 * Deve essere usato DOPO authenticateToken
 *
 * @param {number} minLevel - Livello minimo richiesto (0 = superuser, maggiore = meno privilegi)
 * @returns {Function} Middleware Express
 */
export function requireMinLevel(minLevel) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Utente non autenticato'
      });
    }

    // Livello 0 (superuser) ha accesso a tutto
    // Livelli più bassi hanno più privilegi
    if (req.user.groupLevel > minLevel) {
      console.warn(
        `⚠️  Accesso negato - User: ${req.user.username} (livello ${req.user.groupLevel}) ` +
        `richiede livello ${minLevel} o inferiore`
      );

      return res.status(403).json({
        success: false,
        error: 'Privilegi insufficienti',
        message: `Richiesto livello ${minLevel}, utente ha livello ${req.user.groupLevel}`
      });
    }

    next();
  };
}

/**
 * Middleware opzionale: autentica se token presente, altrimenti continua
 *
 * Utile per endpoint che possono essere usati sia da utenti autenticati che anonimi
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
      isSuperuser: decoded.isSuperuser
    };

    console.log(`🔓 Autenticazione opzionale - User: ${req.user.username}`);
  } catch (error) {
    // Token invalido, continua senza autenticazione
    console.warn('⚠️  Token opzionale invalido, continuo senza auth');
    req.user = null;
  }

  next();
}

export default {
  authenticateToken,
  requireSuperuser,
  requireMinLevel,
  optionalAuth
};
