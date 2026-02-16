/**
 * Routes per gestione gruppi utenti
 * Connessione diretta a tabella GruppiUtenti
 *
 * SCHEMA REALE DATABASE:
 * Tabella GruppiUtenti: id, nome, descrizione, livelloPrivilegi
 */

import express from 'express';
import { sql, getPool } from '../db-config.js';

const router = express.Router();

/**
 * GET /api/user-groups
 * Ottiene tutti i gruppi utenti ordinati per nome
 */
router.get('/', async (req, res) => {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT
        id,
        nome AS name,
        descrizione AS description,
        livelloPrivilegi AS level
      FROM GruppiUtenti
      ORDER BY nome
    `);

    res.json(result.recordset);

  } catch (error) {
    console.error('Errore recupero gruppi utenti:', error);
    res.status(500).json({
      error: 'Errore durante il recupero dei gruppi utenti',
      details: error.message
    });
  }
});

/**
 * GET /api/user-groups/:id
 * Ottiene dettagli di un singolo gruppo
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();

    const result = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query(`
        SELECT
          id,
          nome AS name,
          descrizione AS description,
          livelloPrivilegi AS level
        FROM GruppiUtenti
        WHERE id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Gruppo non trovato' });
    }

    res.json(result.recordset[0]);

  } catch (error) {
    console.error('Errore recupero gruppo:', error);
    res.status(500).json({
      error: 'Errore durante il recupero del gruppo',
      details: error.message
    });
  }
});

/**
 * POST /api/user-groups
 * Crea nuovo gruppo utenti
 * Body: { name, level, description? }
 */
router.post('/', async (req, res) => {
  try {
    const { name, level, description = null } = req.body;

    // Validazione
    if (!name || level === undefined) {
      return res.status(400).json({
        error: 'Campi obbligatori mancanti: name, level'
      });
    }

    const pool = await getPool();

    // Verifica se nome già esistente
    const checkResult = await pool.request()
      .input('name', sql.NVarChar, name)
      .query('SELECT id FROM GruppiUtenti WHERE nome = @name');

    if (checkResult.recordset.length > 0) {
      return res.status(409).json({ error: 'Nome gruppo già esistente' });
    }

    // Inserimento
    const insertResult = await pool.request()
      .input('nome', sql.NVarChar, name)
      .input('livelloPrivilegi', sql.Int, parseInt(level))
      .input('descrizione', sql.NVarChar, description)
      .query(`
        INSERT INTO GruppiUtenti (nome, livelloPrivilegi, descrizione)
        OUTPUT INSERTED.id
        VALUES (@nome, @livelloPrivilegi, @descrizione)
      `);

    const newId = insertResult.recordset[0].id;

    // Recupera il gruppo appena creato
    const groupResult = await pool.request()
      .input('id', sql.Int, newId)
      .query(`
        SELECT
          id,
          nome AS name,
          descrizione AS description,
          livelloPrivilegi AS level
        FROM GruppiUtenti
        WHERE id = @id
      `);

    res.status(201).json(groupResult.recordset[0]);

  } catch (error) {
    console.error('Errore creazione gruppo:', error);
    res.status(500).json({
      error: 'Errore durante la creazione del gruppo',
      details: error.message
    });
  }
});

/**
 * PUT /api/user-groups/:id
 * Aggiorna gruppo esistente
 * Body: { name?, level?, description? }
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, level, description } = req.body;

    const pool = await getPool();

    // Verifica esistenza gruppo
    const checkResult = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query('SELECT id FROM GruppiUtenti WHERE id = @id');

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Gruppo non trovato' });
    }

    // Verifica nome duplicato (escluso il gruppo corrente)
    if (name) {
      const duplicateCheck = await pool.request()
        .input('name', sql.NVarChar, name)
        .input('id', sql.Int, parseInt(id))
        .query('SELECT id FROM GruppiUtenti WHERE nome = @name AND id != @id');

      if (duplicateCheck.recordset.length > 0) {
        return res.status(409).json({ error: 'Nome gruppo già esistente' });
      }
    }

    // Update
    const request = pool.request().input('id', sql.Int, parseInt(id));
    const updates = [];

    if (name !== undefined) {
      request.input('nome', sql.NVarChar, name);
      updates.push('nome = @nome');
    }
    if (level !== undefined) {
      request.input('livelloPrivilegi', sql.Int, parseInt(level));
      updates.push('livelloPrivilegi = @livelloPrivilegi');
    }
    if (description !== undefined) {
      request.input('descrizione', sql.NVarChar, description);
      updates.push('descrizione = @descrizione');
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nessun campo da aggiornare' });
    }

    await request.query(`
      UPDATE GruppiUtenti
      SET ${updates.join(', ')}
      WHERE id = @id
    `);

    // Recupera il gruppo aggiornato
    const groupResult = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query(`
        SELECT
          id,
          nome AS name,
          descrizione AS description,
          livelloPrivilegi AS level
        FROM GruppiUtenti
        WHERE id = @id
      `);

    res.json(groupResult.recordset[0]);

  } catch (error) {
    console.error('Errore aggiornamento gruppo:', error);
    res.status(500).json({
      error: 'Errore durante l\'aggiornamento del gruppo',
      details: error.message
    });
  }
});

/**
 * DELETE /api/user-groups/:id
 * Elimina gruppo utenti
 * NOTA: Verifica prima che non ci siano utenti associati
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();

    // Verifica esistenza gruppo
    const checkResult = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query('SELECT id FROM GruppiUtenti WHERE id = @id');

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Gruppo non trovato' });
    }

    // Verifica che non ci siano utenti associati a questo gruppo
    const usersCheck = await pool.request()
      .input('groupId', sql.Int, parseInt(id))
      .query('SELECT COUNT(*) as count FROM Utenti WHERE idGruppo = @groupId');

    const userCount = usersCheck.recordset[0].count;

    if (userCount > 0) {
      return res.status(409).json({
        error: 'Impossibile eliminare il gruppo',
        details: `Ci sono ${userCount} utenti associati a questo gruppo`
      });
    }

    // Elimina
    await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query('DELETE FROM GruppiUtenti WHERE id = @id');

    res.json({ message: 'Gruppo eliminato con successo' });

  } catch (error) {
    console.error('Errore eliminazione gruppo:', error);
    res.status(500).json({
      error: 'Errore durante l\'eliminazione del gruppo',
      details: error.message
    });
  }
});

export default router;
