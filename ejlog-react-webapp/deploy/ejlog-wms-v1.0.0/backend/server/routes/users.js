/**
 * Routes per gestione utenti
 * Connessione diretta a tabella Utenti + GruppiUtenti
 *
 * SCHEMA REALE DATABASE:
 * Tabella Utenti: id, utente, password, idGruppo, idLinguaDefault, barcode, ...
 * Tabella GruppiUtenti: id, nome, descrizione, livelloPrivilegi
 */

import express from 'express';
import crypto from 'crypto';
import { sql, getPool } from '../db-config.js';

const router = express.Router();

/**
 * Crea hash MD5 per password (compatibile con database esistente)
 */
const hashPassword = (password) => {
  return crypto.createHash('md5').update(password).digest('hex');
};

/**
 * GET /api/users
 * Lista tutti gli utenti (per compatibilità con frontend)
 * Questo endpoint è usato dal frontend per la pagina utenti
 */
router.get('/', async (req, res) => {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT
        u.id,
        u.utente AS username,
        u.nome AS firstName,
        u.cognome AS lastName,
        u.idGruppo AS groupId,
        u.idLinguaDefault AS languageId,
        u.barcode,
        g.nome AS groupName,
        g.livelloPrivilegi AS groupLevel
      FROM Utenti u
      LEFT JOIN GruppiUtenti g ON u.idGruppo = g.id
      ORDER BY u.utente
    `);

    res.json(result.recordset);

  } catch (error) {
    console.error('Errore recupero utenti:', error);
    res.status(500).json({
      error: 'Errore durante il recupero degli utenti',
      details: error.message
    });
  }
});

/**
 * GET /api/users/search
 * Cerca utenti con filtri opzionali
 * Query params: username, groupId, limit, offset
 */
router.get('/search', async (req, res) => {
  try {
    const { username, groupId, limit = 20, offset = 0 } = req.query;

    const pool = await getPool();
    const request = pool.request();

    // Query con JOIN per ottenere anche il nome del gruppo
    let query = `
      SELECT
        u.id,
        u.utente AS username,
        u.nome AS firstName,
        u.cognome AS lastName,
        u.idGruppo AS groupId,
        u.idLinguaDefault AS languageId,
        u.barcode,
        g.nome AS groupName,
        g.livelloPrivilegi AS groupLevel
      FROM Utenti u
      LEFT JOIN GruppiUtenti g ON u.idGruppo = g.id
      WHERE 1=1
    `;

    // Filtro per username (LIKE case-insensitive)
    if (username) {
      query += ` AND u.utente LIKE @username`;
      request.input('username', sql.NVarChar, `%${username}%`);
    }

    // Filtro per gruppo
    if (groupId) {
      query += ` AND u.idGruppo = @groupId`;
      request.input('groupId', sql.Int, parseInt(groupId));
    }

    // Ordinamento e paginazione
    query += `
      ORDER BY u.utente
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;

    request.input('offset', sql.Int, parseInt(offset));
    request.input('limit', sql.Int, parseInt(limit));

    const result = await request.query(query);

    // Conta totale per paginazione
    let countQuery = `SELECT COUNT(*) as total FROM Utenti u WHERE 1=1`;
    const countRequest = pool.request();

    if (username) {
      countQuery += ` AND u.utente LIKE @username`;
      countRequest.input('username', sql.NVarChar, `%${username}%`);
    }
    if (groupId) {
      countQuery += ` AND u.idGruppo = @groupId`;
      countRequest.input('groupId', sql.Int, parseInt(groupId));
    }

    const countResult = await countRequest.query(countQuery);
    const total = countResult.recordset[0].total;

    res.json({
      data: result.recordset,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < total
      }
    });

  } catch (error) {
    console.error('Errore ricerca utenti:', error);
    res.status(500).json({
      error: 'Errore durante la ricerca degli utenti',
      details: error.message
    });
  }
});

/**
 * GET /api/users/:id
 * Ottiene dettagli di un singolo utente
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();

    const result = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query(`
        SELECT
          u.id,
          u.utente AS username,
          u.nome AS firstName,
          u.cognome AS lastName,
          u.idGruppo AS groupId,
          u.idLinguaDefault AS languageId,
          u.barcode,
          g.nome AS groupName,
          g.livelloPrivilegi AS groupLevel
        FROM Utenti u
        LEFT JOIN GruppiUtenti g ON u.idGruppo = g.id
        WHERE u.id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }

    res.json(result.recordset[0]);

  } catch (error) {
    console.error('Errore recupero utente:', error);
    res.status(500).json({
      error: 'Errore durante il recupero dell\'utente',
      details: error.message
    });
  }
});

/**
 * POST /api/users
 * Crea nuovo utente
 * Body: { username, password, groupId, languageId?, barcode? }
 */
router.post('/', async (req, res) => {
  try {
    const { username, password, firstName, lastName, groupId, languageId = 1, barcode = null } = req.body;

    // Validazione
    if (!username || !password || groupId === undefined) {
      return res.status(400).json({
        error: 'Campi obbligatori mancanti: username, password, groupId'
      });
    }

    const pool = await getPool();

    // Verifica se username già esistente
    const checkResult = await pool.request()
      .input('username', sql.NVarChar, username)
      .query('SELECT id FROM Utenti WHERE utente = @username');

    if (checkResult.recordset.length > 0) {
      return res.status(409).json({ error: 'Username già esistente' });
    }

    // Hash password MD5
    const hashedPassword = hashPassword(password);

    // Inserimento
    const insertResult = await pool.request()
      .input('utente', sql.NVarChar, username)
      .input('password', sql.NVarChar, hashedPassword)
      .input('nome', sql.NVarChar, firstName || null)
      .input('cognome', sql.NVarChar, lastName || null)
      .input('idGruppo', sql.Int, parseInt(groupId))
      .input('idLinguaDefault', sql.Int, parseInt(languageId))
      .input('barcode', sql.NVarChar, barcode)
      .query(`
        INSERT INTO Utenti (utente, password, nome, cognome, idGruppo, idLinguaDefault, barcode)
        OUTPUT INSERTED.id
        VALUES (@utente, @password, @nome, @cognome, @idGruppo, @idLinguaDefault, @barcode)
      `);

    const newId = insertResult.recordset[0].id;

    // Recupera l'utente appena creato con tutti i dati
    const userResult = await pool.request()
      .input('id', sql.Int, newId)
      .query(`
        SELECT
          u.id,
          u.utente AS username,
          u.nome AS firstName,
          u.cognome AS lastName,
          u.idGruppo AS groupId,
          u.idLinguaDefault AS languageId,
          u.barcode,
          g.nome AS groupName,
          g.livelloPrivilegi AS groupLevel
        FROM Utenti u
        LEFT JOIN GruppiUtenti g ON u.idGruppo = g.id
        WHERE u.id = @id
      `);

    res.status(201).json(userResult.recordset[0]);

  } catch (error) {
    console.error('Errore creazione utente:', error);
    res.status(500).json({
      error: 'Errore durante la creazione dell\'utente',
      details: error.message
    });
  }
});

/**
 * PUT /api/users/:id
 * Aggiorna utente esistente (senza password)
 * Body: { username?, firstName?, lastName?, groupId?, languageId?, barcode? }
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, firstName, lastName, groupId, languageId, barcode } = req.body;

    const pool = await getPool();

    // Verifica esistenza utente
    const checkResult = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query('SELECT id FROM Utenti WHERE id = @id');

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }

    // Verifica username duplicato (escluso l'utente corrente)
    if (username) {
      const duplicateCheck = await pool.request()
        .input('username', sql.NVarChar, username)
        .input('id', sql.Int, parseInt(id))
        .query('SELECT id FROM Utenti WHERE utente = @username AND id != @id');

      if (duplicateCheck.recordset.length > 0) {
        return res.status(409).json({ error: 'Username già esistente' });
      }
    }

    // Update
    const request = pool.request().input('id', sql.Int, parseInt(id));
    const updates = [];

    if (username !== undefined) {
      request.input('utente', sql.NVarChar, username);
      updates.push('utente = @utente');
    }
    if (firstName !== undefined) {
      request.input('nome', sql.NVarChar, firstName);
      updates.push('nome = @nome');
    }
    if (lastName !== undefined) {
      request.input('cognome', sql.NVarChar, lastName);
      updates.push('cognome = @cognome');
    }
    if (groupId !== undefined) {
      request.input('idGruppo', sql.Int, parseInt(groupId));
      updates.push('idGruppo = @idGruppo');
    }
    if (languageId !== undefined) {
      request.input('idLinguaDefault', sql.Int, parseInt(languageId));
      updates.push('idLinguaDefault = @idLinguaDefault');
    }
    if (barcode !== undefined) {
      request.input('barcode', sql.NVarChar, barcode);
      updates.push('barcode = @barcode');
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nessun campo da aggiornare' });
    }

    await request.query(`
      UPDATE Utenti
      SET ${updates.join(', ')}
      WHERE id = @id
    `);

    // Recupera l'utente aggiornato
    const userResult = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query(`
        SELECT
          u.id,
          u.utente AS username,
          u.nome AS firstName,
          u.cognome AS lastName,
          u.idGruppo AS groupId,
          u.idLinguaDefault AS languageId,
          u.barcode,
          g.nome AS groupName,
          g.livelloPrivilegi AS groupLevel
        FROM Utenti u
        LEFT JOIN GruppiUtenti g ON u.idGruppo = g.id
        WHERE u.id = @id
      `);

    res.json(userResult.recordset[0]);

  } catch (error) {
    console.error('Errore aggiornamento utente:', error);
    res.status(500).json({
      error: 'Errore durante l\'aggiornamento dell\'utente',
      details: error.message
    });
  }
});

/**
 * PUT /api/users/:id/password
 * Aggiorna solo la password
 * Body: { password }
 */
router.put('/:id/password', async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password obbligatoria' });
    }

    const pool = await getPool();

    // Verifica esistenza utente
    const checkResult = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query('SELECT id FROM Utenti WHERE id = @id');

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }

    // Hash password MD5
    const hashedPassword = hashPassword(password);

    // Update password
    await pool.request()
      .input('id', sql.Int, parseInt(id))
      .input('password', sql.NVarChar, hashedPassword)
      .query('UPDATE Utenti SET password = @password WHERE id = @id');

    res.json({ message: 'Password aggiornata con successo' });

  } catch (error) {
    console.error('Errore aggiornamento password:', error);
    res.status(500).json({
      error: 'Errore durante l\'aggiornamento della password',
      details: error.message
    });
  }
});

/**
 * DELETE /api/users/:id
 * Elimina utente
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();

    // Verifica esistenza utente
    const checkResult = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query('SELECT id FROM Utenti WHERE id = @id');

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }

    // Elimina
    await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query('DELETE FROM Utenti WHERE id = @id');

    res.json({ message: 'Utente eliminato con successo' });

  } catch (error) {
    console.error('Errore eliminazione utente:', error);
    res.status(500).json({
      error: 'Errore durante l\'eliminazione dell\'utente',
      details: error.message
    });
  }
});

export default router;
