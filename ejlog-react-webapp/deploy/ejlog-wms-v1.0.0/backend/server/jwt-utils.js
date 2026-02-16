/**
 * JWT Utilities
 *
 * Gestisce la generazione, verifica e validazione dei JWT token
 * per l'autenticazione degli utenti EjLog
 */

import jwt from 'jsonwebtoken';

// Secret key per firma JWT (da spostare in variabile d'ambiente in produzione)
const JWT_SECRET = process.env.JWT_SECRET || 'ejlog-super-secret-key-2025-minimum-32-characters-long-for-production';

// Durata del token (8 ore)
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

// Durata del refresh token (7 giorni)
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// Secret per refresh token (diverso dal token principale per sicurezza)
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'ejlog-refresh-secret-key-2025-different-from-access-token-secret';

/**
 * Genera un JWT token per un utente
 *
 * @param {Object} user - Dati utente da includere nel token
 * @param {number} user.id - ID utente
 * @param {string} user.username - Username
 * @param {number} user.groupId - ID gruppo utente
 * @param {string} user.groupName - Nome gruppo
 * @param {number} user.groupLevel - Livello privilegi (0 = superuser)
 * @returns {string} JWT token firmato
 */
export function generateToken(user) {
  const payload = {
    id: user.id,
    username: user.username,
    groupId: user.groupId,
    groupName: user.groupName,
    groupLevel: user.groupLevel,
    languageId: user.languageId,
    isSuperuser: user.groupLevel === 0
  };

  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'ejlog-api',
    audience: 'ejlog-frontend'
  });

  return token;
}

/**
 * Verifica e decodifica un JWT token
 *
 * @param {string} token - JWT token da verificare
 * @returns {Object} Payload decodificato se valido
 * @throws {Error} Se il token è invalido o scaduto
 */
export function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'ejlog-api',
      audience: 'ejlog-frontend'
    });
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token scaduto');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Token non valido');
    } else {
      throw error;
    }
  }
}

/**
 * Decodifica un JWT token senza verificarne la firma
 * Utile per debug o per leggere i dati senza validazione
 *
 * @param {string} token - JWT token da decodificare
 * @returns {Object|null} Payload decodificato o null se errore
 */
export function decodeToken(token) {
  try {
    return jwt.decode(token);
  } catch (error) {
    console.error('Errore decodifica token:', error);
    return null;
  }
}

/**
 * Estrae il token JWT dall'header Authorization
 *
 * @param {string} authHeader - Header Authorization (formato: "Bearer <token>")
 * @returns {string|null} Token estratto o null se non presente
 */
export function extractTokenFromHeader(authHeader) {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1];
  }

  return null;
}

/**
 * Calcola la data di scadenza del token in secondi
 *
 * @returns {number} Secondi fino alla scadenza (default: 8h = 28800s)
 */
export function getTokenExpirationSeconds() {
  // Parse JWT_EXPIRES_IN (formato: "8h", "24h", "7d")
  const match = JWT_EXPIRES_IN.match(/^(\d+)([hd])$/);

  if (!match) {
    return 28800; // Default 8 ore
  }

  const value = parseInt(match[1]);
  const unit = match[2];

  if (unit === 'h') {
    return value * 3600; // ore -> secondi
  } else if (unit === 'd') {
    return value * 86400; // giorni -> secondi
  }

  return 28800;
}

/**
 * Genera un refresh token per un utente
 *
 * @param {Object} user - Dati utente da includere nel refresh token
 * @param {number} user.id - ID utente
 * @param {string} user.username - Username
 * @returns {string} Refresh token firmato
 */
export function generateRefreshToken(user) {
  const payload = {
    id: user.id,
    username: user.username,
    type: 'refresh' // Identificatore tipo token
  };

  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
    issuer: 'ejlog-api',
    audience: 'ejlog-webapp'
  });

  return refreshToken;
}

/**
 * Verifica e decodifica un refresh token
 *
 * @param {string} refreshToken - Refresh token da verificare
 * @returns {Object} Payload decodificato se valido
 * @throws {Error} Se il refresh token è invalido o scaduto
 */
export function verifyRefreshToken(refreshToken) {
  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET, {
      issuer: 'ejlog-api',
      audience: 'ejlog-webapp'
    });

    // Verifica che sia effettivamente un refresh token
    if (decoded.type !== 'refresh') {
      throw new Error('Token non è un refresh token');
    }

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token scaduto');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Refresh token non valido');
    } else {
      throw error;
    }
  }
}

/**
 * Verifica se un token è prossimo alla scadenza
 *
 * @param {string} token - JWT token da verificare
 * @param {number} thresholdMinutes - Minuti prima della scadenza (default: 30)
 * @returns {boolean} true se il token scade tra meno di thresholdMinutes
 */
export function isTokenExpiringSoon(token, thresholdMinutes = 30) {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      return false;
    }

    const expirationTime = decoded.exp * 1000; // Converti in millisecondi
    const currentTime = Date.now();
    const thresholdMs = thresholdMinutes * 60 * 1000;

    return (expirationTime - currentTime) < thresholdMs;
  } catch (error) {
    console.error('Errore verifica scadenza token:', error);
    return false;
  }
}

export default {
  generateToken,
  verifyToken,
  decodeToken,
  extractTokenFromHeader,
  getTokenExpirationSeconds,
  generateRefreshToken,
  verifyRefreshToken,
  isTokenExpiringSoon
};
