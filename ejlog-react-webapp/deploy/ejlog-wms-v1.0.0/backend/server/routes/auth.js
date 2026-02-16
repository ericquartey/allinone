/**
 * Route di Autenticazione
 *
 * Gestisce il login con:
 * - Verifica credenziali contro database SQL Server
 * - Supporto password dinamica per superuser: promag + (31 - giorno_corrente)
 *   Esempio: se oggi è il 29, password = promag02 (31-29=2)
 * - Hash MD5 per confronto con password database
 */

import express from 'express';
import crypto from 'crypto';
import { getPool } from '../db-config.js';
import { generateToken, getTokenExpirationSeconds, verifyToken, extractTokenFromHeader } from '../jwt-utils.js';
import { authenticateToken } from '../middleware/auth-middleware.js';

const router = express.Router();

/**
 * Calcola la password dinamica per superuser
 * Formula: promag + (31 - giorno_corrente)
 *
 * @returns {string} Password del giorno (es: "promag02" se oggi è il 29)
 */
function getDynamicPassword() {
  const today = new Date();
  const day = today.getDate(); // Giorno del mese (1-31)
  const suffix = (31 - day).toString().padStart(2, '0'); // Padding con zero
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
 * POST /api/auth/login
 *
 * Autentica un utente verificando username e password.
 *
 * Per l'utente "superuser":
 * - Password dinamica: promag + (31 - giorno_corrente)
 * - Oggi (29/11): promag02
 * - Domani (30/11): promag01
 * - Dopodomani (31/11): promag00
 *
 * Per altri utenti:
 * - Verifica password hashata MD5 contro il database
 *
 * Body:
 * {
 *   "username": "superuser",
 *   "password": "promag02"
 * }
 *
 * Response Success (200):
 * {
 *   "success": true,
 *   "user": {
 *     "id": 123,
 *     "username": "superuser",
 *     "groupId": 0,
 *     "groupName": "SUPERUSERS",
 *     "groupLevel": 0
 *   },
 *   "token": "jwt_token_here" // TODO: implementare JWT
 * }
 *
 * Response Error (401):
 * {
 *   "success": false,
 *   "error": "Credenziali non valide"
 * }
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validazione input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username e password obbligatori'
      });
    }

    console.log(`🔐 Tentativo login: ${username}`);

    // CASO SPECIALE: superuser con password dinamica
    if (username.toLowerCase() === 'superuser') {
      const expectedPassword = getDynamicPassword();

      console.log(`🔑 Password dinamica oggi: ${expectedPassword}`);

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

          // Genera JWT token
          const token = generateToken(user);
          const expiresIn = getTokenExpirationSeconds();

          console.log(`✅ Login superuser riuscito - ID: ${user.id}`);
          console.log(`🔑 Token JWT generato - Scadenza: ${expiresIn}s`);

          return res.json({
            success: true,
            token: token,
            user: {
              id: user.id,
              username: user.username,
              groupId: user.groupId,
              groupName: user.groupName,
              groupLevel: user.groupLevel,
              languageId: user.languageId,
              barcode: user.barcode
            },
            expiresIn: `${expiresIn}s`,
            message: 'Login effettuato con successo',
            isSuperuser: true
          });
        } else {
          console.log(`⚠️  Superuser non trovato nel database`);
          return res.status(401).json({
            success: false,
            error: 'Utente superuser non configurato nel database'
          });
        }
      } else {
        console.log(`❌ Password superuser errata. Attesa: ${expectedPassword}, Ricevuta: ${password}`);
        return res.status(401).json({
          success: false,
          error: 'Password non valida per superuser',
          hint: `Password corretta per oggi: promag${(31 - new Date().getDate()).toString().padStart(2, '0')}`
        });
      }
    }

    // CASO NORMALE: utenti normali con password MD5
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

    console.log(`✅ Login riuscito - User: ${username}, ID: ${user.id}, Group: ${user.groupName}`);

    // Genera JWT token
    const token = generateToken(user);
    const expiresIn = getTokenExpirationSeconds();

    console.log(`🔑 Token JWT generato - Scadenza: ${expiresIn}s`);

    // Login riuscito
    res.json({
      success: true,
      token: token,
      user: {
        id: user.id,
        username: user.username,
        groupId: user.groupId,
        groupName: user.groupName,
        groupLevel: user.groupLevel,
        languageId: user.languageId,
        barcode: user.barcode
      },
      expiresIn: `${expiresIn}s`,
      message: 'Login effettuato con successo'
    });

  } catch (error) {
    console.error('❌ Errore durante il login:', error);
    res.status(500).json({
      success: false,
      error: 'Errore del server durante il login',
      details: error.message
    });
  }
});

/**
 * POST /api/auth/logout
 *
 * Effettua il logout dell'utente (placeholder per future implementazioni con JWT)
 */
router.post('/logout', async (req, res) => {
  // TODO: Implementare invalidazione JWT token
  console.log('👋 Logout richiesto');

  res.json({
    success: true,
    message: 'Logout effettuato con successo'
  });
});

/**
 * GET /api/auth/check
 *
 * Verifica se l'utente è autenticato verificando il JWT token
 * Richiede header: Authorization: Bearer <token>
 */
router.get('/check', authenticateToken, async (req, res) => {
  // Se arriviamo qui, il token è valido (verificato dal middleware)
  res.json({
    authenticated: true,
    user: req.user,
    message: 'Token valido'
  });
});

/**
 * GET /api/auth/password-hint
 *
 * Restituisce un hint per la password dinamica del superuser (solo per debug)
 */
router.get('/password-hint', (req, res) => {
  const today = new Date();
  const day = today.getDate();
  const expectedPassword = getDynamicPassword();

  res.json({
    hint: `Password superuser per oggi (${day}/${today.getMonth() + 1}): ${expectedPassword}`,
    formula: 'promag + (31 - giorno_corrente)',
    example: `31 - ${day} = ${31 - day} → promag${(31 - day).toString().padStart(2, '0')}`
  });
});

export default router;
