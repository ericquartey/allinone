/**
 * Route per Token Refresh e Logout
 *
 * Caratteristiche:
 * - POST /refresh - Rinnova access token usando refresh token
 * - POST /logout - Invalida refresh token (revocation)
 * - Gestione sicura refresh tokens con revocation list
 *
 * @author Elio (Full-Stack Architect)
 * @date 2025-12-09
 * @version 1.0.0
 */

import express from 'express';
import { getPool } from '../db-config.js';
import {
  generateToken,
  generateRefreshToken,
  verifyRefreshToken
} from '../jwt-utils.js';

const router = express.Router();

// In-memory revocation list per refresh tokens (production: usare Redis)
const revokedRefreshTokens = new Set();

// ============================================
// ENDPOINT: POST /api/auth/refresh
// ============================================

/**
 * POST /api/auth/refresh
 *
 * Rinnova l'access token usando un refresh token valido
 *
 * Request Body:
 * {
 *   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 *
 * Response Success (200):
 * {
 *   "success": true,
 *   "token": "new_access_token_here",
 *   "refreshToken": "new_refresh_token_here",  // Token rotation
 *   "expiresIn": "8h",
 *   "message": "Token rinnovato con successo"
 * }
 *
 * Response Error (401):
 * {
 *   "success": false,
 *   "error": "Refresh token non valido o scaduto"
 * }
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token obbligatorio'
      });
    }

    // Verifica se il refresh token è stato revocato
    if (revokedRefreshTokens.has(refreshToken)) {
      console.warn(`🚫 Tentativo di usare refresh token revocato`);
      return res.status(401).json({
        success: false,
        error: 'Refresh token revocato. Effettua nuovamente il login.'
      });
    }

    // Verifica e decodifica il refresh token
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      console.error(`❌ Refresh token non valido:`, error.message);
      return res.status(401).json({
        success: false,
        error: error.message || 'Refresh token non valido'
      });
    }

    // Recupera i dati completi dell'utente dal database
    const pool = await getPool();
    const userQuery = `
      SELECT
        U.id,
        U.utente AS username,
        U.idGruppoUtente AS groupId,
        GU.descrizione AS groupName,
        GU.livello AS groupLevel,
        U.idLingua AS languageId
      FROM Utente U
      LEFT JOIN GruppoUtente GU ON U.idGruppoUtente = GU.id
      WHERE U.id = @userId
        AND (U.recordCancellato = 0 OR U.recordCancellato IS NULL)
    `;

    const result = await pool.request()
      .input('userId', decoded.id)
      .query(userQuery);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato o disattivato'
      });
    }

    const user = result.recordset[0];

    // ============================================
    // TOKEN ROTATION: Genera nuovi token
    // ============================================

    // Revoca il vecchio refresh token (usa solo una volta)
    revokedRefreshTokens.add(refreshToken);

    // Genera nuovo access token
    const newAccessToken = generateToken(user);

    // Genera nuovo refresh token (rotation)
    const newRefreshToken = generateRefreshToken(user);

    console.log(`🔄 Token rinnovato per utente: ${user.username}`);

    res.json({
      success: true,
      token: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: '8h',
      message: 'Token rinnovato con successo',
      user: {
        id: user.id,
        username: user.username,
        groupId: user.groupId,
        groupName: user.groupName,
        groupLevel: user.groupLevel
      }
    });

  } catch (error) {
    console.error('❌ Errore refresh token:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno durante il refresh del token'
    });
  }
});

// ============================================
// ENDPOINT: POST /api/auth/logout
// ============================================

/**
 * POST /api/auth/logout
 *
 * Invalida il refresh token corrente (logout completo)
 *
 * Request Body:
 * {
 *   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 *
 * Response Success (200):
 * {
 *   "success": true,
 *   "message": "Logout effettuato con successo"
 * }
 *
 * Response Error (400):
 * {
 *   "success": false,
 *   "error": "Refresh token obbligatorio"
 * }
 */
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      // Logout senza refresh token è comunque valido (cleanup solo client-side)
      return res.json({
        success: true,
        message: 'Logout completato (solo client-side)'
      });
    }

    // Aggiungi il refresh token alla revocation list
    revokedRefreshTokens.add(refreshToken);

    // In production, salvare anche in database o Redis per persistenza
    // await saveRevokedTokenToDatabase(refreshToken);

    console.log(`👋 Logout effettuato - Refresh token revocato`);

    res.json({
      success: true,
      message: 'Logout effettuato con successo'
    });

  } catch (error) {
    console.error('❌ Errore logout:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante il logout'
    });
  }
});

// ============================================
// ENDPOINT: GET /api/auth/revoked-count (DEBUG)
// ============================================

/**
 * GET /api/auth/revoked-count
 *
 * Restituisce il numero di refresh token revocati (solo per debug)
 */
router.get('/revoked-count', (req, res) => {
  res.json({
    success: true,
    count: revokedRefreshTokens.size,
    message: `Ci sono ${revokedRefreshTokens.size} refresh tokens revocati`
  });
});

// ============================================
// CLEANUP: Rimuovi token scaduti dalla revocation list
// ============================================

/**
 * Cleanup periodico dei token scaduti dalla revocation list
 * Esegue ogni 1 ora
 */
setInterval(() => {
  const before = revokedRefreshTokens.size;

  // In production, implementare cleanup basato su expiration time
  // Per ora, limitiamo semplicemente la dimensione massima
  const MAX_REVOKED_TOKENS = 10000;

  if (revokedRefreshTokens.size > MAX_REVOKED_TOKENS) {
    // Rimuovi i primi N token (FIFO)
    const tokensToRemove = Array.from(revokedRefreshTokens).slice(0, revokedRefreshTokens.size - MAX_REVOKED_TOKENS);
    tokensToRemove.forEach(token => revokedRefreshTokens.delete(token));

    console.log(`🧹 Cleanup revocation list: rimossi ${before - revokedRefreshTokens.size} token`);
  }
}, 60 * 60 * 1000); // Ogni ora

export default router;
