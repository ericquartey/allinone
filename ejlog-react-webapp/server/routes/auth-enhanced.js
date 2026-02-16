/**
 * Route di Autenticazione Migliorata con JWT
 *
 * Caratteristiche:
 * - JWT token generation per sessioni stateless
 * - Superuser hardcoded per sviluppo (username: superuser, password: promag31)
 * - Password dinamica superuser per produzione (promag + (31 - giorno))
 * - MD5 hash per utenti normali
 * - Validazione input robusta
 * - Logging completo delle operazioni
 *
 * @author Agent Swaggy (Swaggy Routing Architect)
 * @date 2025-12-04
 * @version 2.0.0
 */

import express from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { getPool } from '../db-config.js';
import { generateRefreshToken } from '../jwt-utils.js';
import {
  DEV_SUPERUSER_PASSWORD,
  matchesHardcodedSuperuser,
  getHardcodedSuperuser,
  logHardcodedSuperuserUsage,
  isDevelopmentEnvironment
} from '../config/dev-superuser.js';

const router = express.Router();

// ============================================
// CONFIGURAZIONE JWT
// ============================================

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production-use-long-random-string';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

// Verifica configurazione JWT
if (JWT_SECRET === 'change-me-in-production-use-long-random-string') {
  console.warn('⚠️  WARNING: Using default JWT_SECRET. Set JWT_SECRET environment variable in production!');
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Calcola la password dinamica per superuser (produzione)
 * Formula: promag + (31 - giorno_corrente)
 *
 * @returns {string} Password del giorno (es: "promag27" se oggi è il 4)
 */
function getDynamicPassword() {
  const today = new Date();
  const day = today.getDate();
  const suffix = (31 - day);  // NO padding, numero naturale
  return `promag${suffix}`;
}

/**
 * Calcola hash MD5 di una stringa
 *
 * @param {string} text - Testo da hashare
 * @returns {string} Hash MD5 in formato esadecimale
 */
function md5Hash(text) {
  return crypto.createHash('md5').update(text).digest('hex');
}

/**
 * Genera JWT token per un utente autenticato
 *
 * @param {Object} user - Dati utente
 * @returns {string} JWT token
 */
function generateJWT(user) {
  const payload = {
    userId: user.id,
    username: user.username,
    groupId: user.groupId,
    groupLevel: user.groupLevel,
    isHardcoded: user.isHardcoded || false
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'ejlog-api',
    audience: 'ejlog-frontend'
  });
}

/**
 * Estrae indirizzo IP client (con supporto proxy)
 *
 * @param {Object} req - Express request object
 * @returns {string} IP address
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
 * Valida formato username
 *
 * @param {string} username - Username da validare
 * @returns {Object} { valid: boolean, error: string }
 */
function validateUsername(username) {
  if (!username) {
    return { valid: false, error: 'Username obbligatorio' };
  }

  if (typeof username !== 'string') {
    return { valid: false, error: 'Username deve essere una stringa' };
  }

  if (username.length < 3) {
    return { valid: false, error: 'Username troppo corto (minimo 3 caratteri)' };
  }

  if (username.length > 50) {
    return { valid: false, error: 'Username troppo lungo (massimo 50 caratteri)' };
  }

  // Pattern: lettere, numeri, underscore, trattino, punto, spazio
  const usernamePattern = /^[a-zA-Z0-9_.\- ]+$/;
  if (!usernamePattern.test(username)) {
    return { valid: false, error: 'Username contiene caratteri non validi' };
  }

  return { valid: true };
}

/**
 * Valida formato password
 *
 * @param {string} password - Password da validare
 * @returns {Object} { valid: boolean, error: string }
 */
function validatePassword(password) {
  if (!password) {
    return { valid: false, error: 'Password obbligatoria' };
  }

  if (typeof password !== 'string') {
    return { valid: false, error: 'Password deve essere una stringa' };
  }

  if (password.length < 6) {
    return { valid: false, error: 'Password troppo corta (minimo 6 caratteri)' };
  }

  if (password.length > 100) {
    return { valid: false, error: 'Password troppo lunga (massimo 100 caratteri)' };
  }

  return { valid: true };
}

// ============================================
// ENDPOINT: POST /api/auth/login
// ============================================

/**
 * POST /api/auth/login
 *
 * Autentica un utente e restituisce JWT token.
 *
 * Priorità autenticazione:
 * 1. Superuser hardcoded (DEV only): superuser / promag31
 * 2. Superuser dinamico (PROD): superuser / promag + (31 - giorno)
 * 3. Utenti normali: username / MD5(password)
 *
 * Request Body:
 * {
 *   "username": "superuser",
 *   "password": "promag31"
 * }
 *
 * Response Success (200):
 * {
 *   "success": true,
 *   "user": {
 *     "id": 999999,
 *     "username": "superuser",
 *     "groupId": 0,
 *     "groupName": "SUPERUSERS",
 *     "groupLevel": 0,
 *     "languageId": 1,
 *     "barcode": "DEV-SU-2025"
 *   },
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "expiresIn": "8h",
 *   "message": "Login effettuato con successo",
 *   "isSuperuser": true,
 *   "isHardcoded": true
 * }
 *
 * Response Error (400):
 * {
 *   "success": false,
 *   "error": "Username e password obbligatori"
 * }
 *
 * Response Error (401):
 * {
 *   "success": false,
 *   "error": "Username o password non validi"
 * }
 */
router.post('/login', async (req, res) => {
  const startTime = Date.now();

  try {
    const { username, password } = req.body;
    const clientIP = getClientIP(req);
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Validazione input
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      console.log(`❌ Login fallito - ${usernameValidation.error}: "${username}"`);
      return res.status(400).json({
        success: false,
        error: usernameValidation.error
      });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      console.log(`❌ Login fallito - ${passwordValidation.error}: ${username}`);
      return res.status(400).json({
        success: false,
        error: passwordValidation.error
      });
    }

    console.log(`\n🔐 Tentativo login: ${username} da ${clientIP}`);

    // =========================================
    // PRIORITÀ 1: SUPERUSER HARDCODED (DEV)
    // =========================================

    if (matchesHardcodedSuperuser(username, password)) {
      logHardcodedSuperuserUsage(clientIP, userAgent);

      const hardcodedUser = getHardcodedSuperuser();
      const token = generateJWT(hardcodedUser);

      const responseTime = Date.now() - startTime;
      console.log(`✅ Login hardcoded superuser riuscito (${responseTime}ms)`);

      return res.json({
        success: true,
        user: {
          id: hardcodedUser.id,
          username: hardcodedUser.username,
          groupId: hardcodedUser.groupId,
          groupName: hardcodedUser.groupName,
          groupLevel: hardcodedUser.groupLevel,
          languageId: hardcodedUser.languageId,
          barcode: hardcodedUser.barcode
        },
        token: token,
        expiresIn: JWT_EXPIRES_IN,
        message: 'Login effettuato con successo (hardcoded dev user)',
        isSuperuser: true,
        isHardcoded: true
      });
    }

    // =========================================
    // PRIORITÀ 2: SUPERUSER DINAMICO (PROD)
    // =========================================

    if (username.toLowerCase() === 'superuser') {
      const expectedPassword = getDynamicPassword();
      const today = new Date();

      console.log(`🔑 Password dinamica oggi (${today.getDate()}/${today.getMonth() + 1}): ${expectedPassword}`);

      if (password === expectedPassword) {
        // Recupera i dati del superuser dal database
        const pool = await getPool();
        const result = await pool.request()
          .input('username', username)
          .query(`
            SELECT
              u.id,
              u.utente AS username,
              u.idGruppo AS groupId,
              u.idLinguaDefault AS languageId,
              u.barcode,
              g.nome AS groupName,
              g.livelloPrivilegi AS groupLevel
            FROM Utenti u
            LEFT JOIN GruppiUtenti g ON u.idGruppo = g.id
            WHERE LOWER(u.utente) = LOWER(@username)
          `);

        if (result.recordset.length > 0) {
          const user = result.recordset[0];
          const token = generateJWT(user);

          const responseTime = Date.now() - startTime;
          console.log(`✅ Login superuser dinamico riuscito - ID: ${user.id} (${responseTime}ms)`);

          return res.json({
            success: true,
            user: {
              id: user.id,
              username: user.username,
              groupId: user.groupId,
              groupName: user.groupName,
              groupLevel: user.groupLevel,
              languageId: user.languageId,
              barcode: user.barcode
            },
            token: token,
            expiresIn: JWT_EXPIRES_IN,
            message: 'Login effettuato con successo',
            isSuperuser: true,
            isHardcoded: false
          });
        } else {
          console.log(`⚠️  Superuser non trovato nel database`);
          return res.status(401).json({
            success: false,
            error: 'Utente superuser non configurato nel database'
          });
        }
      } else {
        console.log(`❌ Password superuser errata. Attesa: ${expectedPassword}, Ricevuta: [REDACTED]`);

        // In sviluppo, fornisci hint
        if (isDevelopmentEnvironment()) {
          return res.status(401).json({
            success: false,
            error: 'Password non valida per superuser',
            hint: `Password corretta per oggi: ${expectedPassword}`,
            devNote: `In sviluppo usa sempre: superuser / ${DEV_SUPERUSER_PASSWORD}`
          });
        }

        return res.status(401).json({
          success: false,
          error: 'Password non valida'
        });
      }
    }

    // =========================================
    // PRIORITÀ 3: UTENTI NORMALI (MD5)
    // =========================================

    const passwordMD5 = md5Hash(password);

    const pool = await getPool();
    const result = await pool.request()
      .input('username', username)
      .input('passwordHash', passwordMD5)
      .query(`
        SELECT
          u.id,
          u.utente AS username,
          u.password AS passwordHash,
          u.idGruppo AS groupId,
          u.idLinguaDefault AS languageId,
          u.barcode,
          g.nome AS groupName,
          g.livelloPrivilegi AS groupLevel
        FROM Utenti u
        LEFT JOIN GruppiUtenti g ON u.idGruppo = g.id
        WHERE LOWER(u.utente) = LOWER(@username)
      `);

    if (result.recordset.length === 0) {
      console.log(`❌ Utente non trovato: ${username}`);
      return res.status(401).json({
        success: false,
        error: 'Username o password non validi'
      });
    }

    const user = result.recordset[0];

    // Verifica password MD5
    if (user.passwordHash.toLowerCase() !== passwordMD5.toLowerCase()) {
      console.log(`❌ Password errata per: ${username}`);
      return res.status(401).json({
        success: false,
        error: 'Username o password non validi'
      });
    }

    // Genera JWT token
    const token = generateJWT(user);

    const responseTime = Date.now() - startTime;
    console.log(`✅ Login riuscito - User: ${username}, ID: ${user.id}, Group: ${user.groupName} (${responseTime}ms)`);

    // Login riuscito
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        groupId: user.groupId,
        groupName: user.groupName,
        groupLevel: user.groupLevel,
        languageId: user.languageId,
        barcode: user.barcode
      },
      token: token,
      expiresIn: JWT_EXPIRES_IN,
      message: 'Login effettuato con successo',
      isSuperuser: false,
      isHardcoded: false
    });

  } catch (error) {
    console.error('❌ Errore durante il login:', error);
    res.status(500).json({
      success: false,
      error: 'Errore del server durante il login',
      details: isDevelopmentEnvironment() ? error.message : undefined
    });
  }
});

// ============================================
// ENDPOINT: POST /api/auth/logout
// ============================================

/**
 * POST /api/auth/logout
 *
 * Effettua il logout dell'utente.
 * Con JWT stateless, il logout è principalmente client-side (elimina token).
 * In futuro si può implementare token blacklist.
 *
 * Header:
 *   Authorization: Bearer <token>
 *
 * Response (200):
 * {
 *   "success": true,
 *   "message": "Logout effettuato con successo"
 * }
 */
router.post('/logout', async (req, res) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log(`👋 Logout richiesto da: ${decoded.username}`);
    } catch (err) {
      // Token invalido/scaduto, ma logout comunque
      console.log('👋 Logout richiesto (token invalido)');
    }
  }

  res.json({
    success: true,
    message: 'Logout effettuato con successo'
  });
});

// ============================================
// ENDPOINT: POST /api/auth/verify
// ============================================

/**
 * POST /api/auth/verify
 *
 * Verifica validità di un JWT token
 *
 * Header:
 *   Authorization: Bearer <token>
 *
 * Response Success (200):
 * {
 *   "valid": true,
 *   "user": {
 *     "userId": 1,
 *     "username": "admin",
 *     "groupLevel": 0
 *   },
 *   "expiresAt": "2025-12-04T18:00:00Z"
 * }
 *
 * Response Error (401):
 * {
 *   "valid": false,
 *   "error": "Token invalido o scaduto"
 * }
 */
router.post('/verify', async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      valid: false,
      error: 'Token mancante'
    });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    res.json({
      valid: true,
      user: {
        userId: decoded.userId,
        username: decoded.username,
        groupId: decoded.groupId,
        groupLevel: decoded.groupLevel,
        isHardcoded: decoded.isHardcoded
      },
      expiresAt: new Date(decoded.exp * 1000).toISOString()
    });
  } catch (err) {
    console.log(`❌ Token verification failed: ${err.message}`);

    let errorMessage = 'Token invalido o scaduto';
    if (err.name === 'TokenExpiredError') {
      errorMessage = 'Token scaduto, effettua nuovamente il login';
    } else if (err.name === 'JsonWebTokenError') {
      errorMessage = 'Token invalido';
    }

    res.status(401).json({
      valid: false,
      error: errorMessage
    });
  }
});

// ============================================
// ENDPOINT: GET /api/auth/password-hint (DEV ONLY)
// ============================================

/**
 * GET /api/auth/password-hint
 *
 * Restituisce hint per password dinamica superuser (SOLO SVILUPPO)
 *
 * Response (200):
 * {
 *   "hint": "Password superuser per oggi (4/12): promag27",
 *   "formula": "promag + (31 - giorno_corrente)",
 *   "example": "31 - 4 = 27 → promag27",
 *   "hardcodedPassword": "promag31"
 * }
 */
router.get('/password-hint', (req, res) => {
  if (!isDevelopmentEnvironment()) {
    return res.status(404).json({
      error: 'Endpoint disponibile solo in sviluppo'
    });
  }

  const today = new Date();
  const day = today.getDate();
  const month = today.getMonth() + 1;
  const expectedPassword = getDynamicPassword();

  res.json({
    hint: `Password superuser per oggi (${day}/${month}): ${expectedPassword}`,
    formula: 'promag + (31 - giorno_corrente)',
    example: `31 - ${day} = ${31 - day} → promag${(31 - day).toString().padStart(2, '0')}`,
    hardcodedPassword: DEV_SUPERUSER_PASSWORD,
    note: `In sviluppo, usa sempre: superuser / ${DEV_SUPERUSER_PASSWORD}`
  });
});

// ============================================
// EXPORT
// ============================================

export default router;
