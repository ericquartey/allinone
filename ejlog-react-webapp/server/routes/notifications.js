/**
 * Routes per gestione notifiche real-time
 * Supporta notifiche persistenti, preferenze utente e WebSocket
 *
 * TABELLE DATABASE (create automaticamente):
 * - Notifications: notifiche persistenti con stato read/unread
 * - NotificationPreferences: preferenze utente per notifiche
 */

import express from 'express';
import { sql, getPool } from '../db-config.js';

const router = express.Router();

/**
 * Crea le tabelle per le notifiche se non esistono
 */
async function ensureNotificationTables() {
  try {
    const pool = await getPool();

    await pool.request().query(`
      -- Tabella notifiche
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Notifications' AND xtype='U')
      BEGIN
        CREATE TABLE Notifications (
          id INT PRIMARY KEY IDENTITY(1,1),
          userId NVARCHAR(50), -- NULL = notifica globale
          title NVARCHAR(200) NOT NULL,
          message NVARCHAR(1000) NOT NULL,
          type NVARCHAR(50) NOT NULL, -- 'info', 'success', 'warning', 'error'
          priority INT NOT NULL DEFAULT 1, -- 1=Bassa, 2=Media, 3=Alta, 4=Urgente
          [read] BIT NOT NULL DEFAULT 0,
          category NVARCHAR(100), -- 'operations', 'lists', 'items', 'system'
          relatedEntity NVARCHAR(100), -- 'Operation', 'List', 'Item'
          relatedId NVARCHAR(100), -- ID entità correlata
          createdDate DATETIME2 NOT NULL DEFAULT GETDATE(),
          readDate DATETIME2,
          expiresAt DATETIME2, -- NULL = non scade
          actionUrl NVARCHAR(500), -- URL azione

          INDEX idx_userId (userId),
          INDEX idx_read ([read]),
          INDEX idx_createdDate (createdDate DESC),
          INDEX idx_category (category),
          INDEX idx_priority (priority DESC)
        );

        -- Notifiche di esempio
        INSERT INTO Notifications (title, message, type, priority, category) VALUES
        ('Benvenuto in EjLog WMS', 'Sistema notifiche real-time attivo', 'info', 2, 'system'),
        ('Lista completata', 'Lista #001 completata con successo', 'success', 1, 'lists'),
        ('Attenzione: Stock basso', 'Articolo ABC123 ha giacenza critica', 'warning', 3, 'items');
      END

      -- Tabella preferenze
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='NotificationPreferences' AND xtype='U')
      BEGIN
        CREATE TABLE NotificationPreferences (
          id INT PRIMARY KEY IDENTITY(1,1),
          userId NVARCHAR(50) NOT NULL UNIQUE,
          enableSound BIT NOT NULL DEFAULT 1,
          enableDesktop BIT NOT NULL DEFAULT 1,
          enableEmail BIT NOT NULL DEFAULT 0,
          enablePush BIT NOT NULL DEFAULT 1,
          categories NVARCHAR(MAX), -- JSON categorie abilitate
          quietHoursStart TIME,
          quietHoursEnd TIME,
          createdDate DATETIME2 NOT NULL DEFAULT GETDATE(),
          modifiedDate DATETIME2
        );
      END
    `);

  } catch (error) {
    console.error('Errore creazione tabelle notifiche:', error);
  }
}

ensureNotificationTables();

/**
 * GET /api/notifications
 * Lista notifiche
 */
router.get('/', async (req, res) => {
  try {
    const { userId, unreadOnly = false, category, limit = 50, offset = 0 } = req.query;
    const pool = await getPool();
    const request = pool.request();

    let query = `
      SELECT id, userId, title, message, type, priority, [read], category,
             relatedEntity, relatedId, createdDate, readDate, expiresAt, actionUrl
      FROM Notifications WHERE 1=1
    `;

    if (userId) {
      query += ' AND (userId = @userId OR userId IS NULL)';
      request.input('userId', sql.NVarChar, userId);
    }
    if (unreadOnly === 'true') query += ' AND [read] = 0';
    if (category) {
      query += ' AND category = @category';
      request.input('category', sql.NVarChar, category);
    }

    query += ' AND (expiresAt IS NULL OR expiresAt > GETDATE())';
    query += ' ORDER BY priority DESC, createdDate DESC';
    query += ' OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY';

    request.input('limit', sql.Int, parseInt(limit));
    request.input('offset', sql.Int, parseInt(offset));

    const result = await request.query(query);

    res.json({
      notifications: result.recordset,
      total: result.recordset.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error('Errore recupero notifiche:', error);
    res.status(500).json({ error: 'Errore recupero notifiche', details: error.message });
  }
});

/**
 * GET /api/notifications/unread-count
 * Conta notifiche non lette
 */
router.get('/unread-count', async (req, res) => {
  try {
    const { userId } = req.query;
    const pool = await getPool();
    const request = pool.request();

    let query = `SELECT COUNT(*) as count FROM Notifications
                 WHERE [read] = 0 AND (expiresAt IS NULL OR expiresAt > GETDATE())`;

    if (userId) {
      query += ' AND (userId = @userId OR userId IS NULL)';
      request.input('userId', sql.NVarChar, userId);
    }

    const result = await request.query(query);
    res.json({ unreadCount: result.recordset[0].count });
  } catch (error) {
    console.error('Errore conteggio notifiche:', error);
    res.status(500).json({ error: 'Errore conteggio', details: error.message });
  }
});

/**
 * PUT /api/notifications/:id/read
 * Marca notifica come letta
 */
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();

    const result = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query('UPDATE Notifications SET [read] = 1, readDate = GETDATE() WHERE id = @id');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Notifica non trovata' });
    }

    res.json({ message: 'Notifica marcata come letta' });
  } catch (error) {
    console.error('Errore aggiornamento notifica:', error);
    res.status(500).json({ error: 'Errore aggiornamento', details: error.message });
  }
});

/**
 * PUT /api/notifications/mark-all-read
 * Marca tutte come lette
 */
router.put('/mark-all-read', async (req, res) => {
  try {
    const { userId } = req.body;
    const pool = await getPool();
    const request = pool.request();

    let query = 'UPDATE Notifications SET [read] = 1, readDate = GETDATE() WHERE [read] = 0';

    if (userId) {
      query += ' AND (userId = @userId OR userId IS NULL)';
      request.input('userId', sql.NVarChar, userId);
    }

    const result = await request.query(query);

    res.json({ message: 'Notifiche marcate come lette', count: result.rowsAffected[0] });
  } catch (error) {
    console.error('Errore aggiornamento notifiche:', error);
    res.status(500).json({ error: 'Errore aggiornamento', details: error.message });
  }
});

/**
 * GET /api/notifications/preferences/:userId
 * Recupera preferenze notifiche utente
 */
router.get('/preferences/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const pool = await getPool();

    const result = await pool.request()
      .input('userId', sql.NVarChar, userId)
      .query('SELECT * FROM NotificationPreferences WHERE userId = @userId');

    if (result.recordset.length === 0) {
      // Crea preferenze default se non esistono
      const defaultPrefs = {
        userId,
        enableSound: true,
        enableDesktop: true,
        enableEmail: false,
        enablePush: true,
        categories: JSON.stringify(['operations', 'lists', 'items', 'system']),
        quietHoursStart: null,
        quietHoursEnd: null,
      };

      await pool.request()
        .input('userId', sql.NVarChar, userId)
        .input('enableSound', sql.Bit, defaultPrefs.enableSound)
        .input('enableDesktop', sql.Bit, defaultPrefs.enableDesktop)
        .input('enableEmail', sql.Bit, defaultPrefs.enableEmail)
        .input('enablePush', sql.Bit, defaultPrefs.enablePush)
        .input('categories', sql.NVarChar, defaultPrefs.categories)
        .query(`
          INSERT INTO NotificationPreferences
          (userId, enableSound, enableDesktop, enableEmail, enablePush, categories)
          VALUES (@userId, @enableSound, @enableDesktop, @enableEmail, @enablePush, @categories)
        `);

      return res.json(defaultPrefs);
    }

    const prefs = result.recordset[0];
    // Parse JSON categories
    if (prefs.categories) {
      try {
        prefs.categories = JSON.parse(prefs.categories);
      } catch (e) {
        prefs.categories = [];
      }
    }

    res.json(prefs);
  } catch (error) {
    console.error('Errore recupero preferenze:', error);
    res.status(500).json({ error: 'Errore recupero preferenze', details: error.message });
  }
});

/**
 * PUT /api/notifications/preferences/:userId
 * Aggiorna preferenze notifiche utente
 */
router.put('/preferences/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { enableSound, enableDesktop, enableEmail, enablePush, categories, quietHoursStart, quietHoursEnd } = req.body;
    const pool = await getPool();

    // Converti categories array in JSON string
    const categoriesJson = Array.isArray(categories) ? JSON.stringify(categories) : categories;

    // Check se esistono preferenze
    const existing = await pool.request()
      .input('userId', sql.NVarChar, userId)
      .query('SELECT id FROM NotificationPreferences WHERE userId = @userId');

    if (existing.recordset.length === 0) {
      // Insert
      await pool.request()
        .input('userId', sql.NVarChar, userId)
        .input('enableSound', sql.Bit, enableSound ?? true)
        .input('enableDesktop', sql.Bit, enableDesktop ?? true)
        .input('enableEmail', sql.Bit, enableEmail ?? false)
        .input('enablePush', sql.Bit, enablePush ?? true)
        .input('categories', sql.NVarChar, categoriesJson)
        .input('quietHoursStart', sql.Time, quietHoursStart || null)
        .input('quietHoursEnd', sql.Time, quietHoursEnd || null)
        .query(`
          INSERT INTO NotificationPreferences
          (userId, enableSound, enableDesktop, enableEmail, enablePush, categories, quietHoursStart, quietHoursEnd)
          VALUES (@userId, @enableSound, @enableDesktop, @enableEmail, @enablePush, @categories, @quietHoursStart, @quietHoursEnd)
        `);
    } else {
      // Update
      await pool.request()
        .input('userId', sql.NVarChar, userId)
        .input('enableSound', sql.Bit, enableSound ?? true)
        .input('enableDesktop', sql.Bit, enableDesktop ?? true)
        .input('enableEmail', sql.Bit, enableEmail ?? false)
        .input('enablePush', sql.Bit, enablePush ?? true)
        .input('categories', sql.NVarChar, categoriesJson)
        .input('quietHoursStart', sql.Time, quietHoursStart || null)
        .input('quietHoursEnd', sql.Time, quietHoursEnd || null)
        .query(`
          UPDATE NotificationPreferences
          SET enableSound = @enableSound,
              enableDesktop = @enableDesktop,
              enableEmail = @enableEmail,
              enablePush = @enablePush,
              categories = @categories,
              quietHoursStart = @quietHoursStart,
              quietHoursEnd = @quietHoursEnd,
              modifiedDate = GETDATE()
          WHERE userId = @userId
        `);
    }

    res.json({ message: 'Preferenze aggiornate con successo' });
  } catch (error) {
    console.error('Errore aggiornamento preferenze:', error);
    res.status(500).json({ error: 'Errore aggiornamento preferenze', details: error.message });
  }
});

export default router;
