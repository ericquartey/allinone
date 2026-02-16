/**
 * PTL (Pick-to-Light) System Routes - Real Implementation
 * Feature C - Sistema Pick-to-Light con Backend Integration
 */

import express from 'express';
import { getPool } from '../db-config.js';

const router = express.Router();

/**
 * GET /api/ptl/devices
 * Ottieni lista dispositivi PTL
 *
 * Query params:
 * - status: filtra per stato (active, inactive, all)
 * - zone: filtra per zona
 */
router.get('/devices', async (req, res) => {
  try {
    const { status = 'all', zone } = req.query;

    const pool = await getPool();

    // Verifica esistenza tabella PTLDevices, altrimenti creala
    await pool.request().query(`
      IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'PTLDevices')
      BEGIN
        CREATE TABLE PTLDevices (
          id INT IDENTITY(1,1) PRIMARY KEY,
          deviceCode NVARCHAR(50) NOT NULL UNIQUE,
          deviceName NVARCHAR(100),
          locationId INT,
          zone NVARCHAR(50),
          status NVARCHAR(20) DEFAULT 'active',
          ipAddress NVARCHAR(50),
          lastPing DATETIME,
          createdAt DATETIME DEFAULT GETDATE(),
          updatedAt DATETIME DEFAULT GETDATE()
        )
      END
    `);

    let query = `
      SELECT
        D.id, D.deviceCode, D.deviceName, D.locationId, D.zone,
        D.status, D.ipAddress, D.lastPing, D.createdAt, D.updatedAt,
        L.CodiceUbicazione as locationCode, L.Descrizione as locationDescription
      FROM PTLDevices D
      LEFT JOIN Ubicazioni L ON D.locationId = L.id
      WHERE 1=1
    `;

    if (status !== 'all') {
      query += ` AND D.status = @status`;
    }

    if (zone) {
      query += ` AND D.zone = @zone`;
    }

    query += ` ORDER BY D.zone, D.deviceCode`;

    const request = pool.request();
    if (status !== 'all') request.input('status', status);
    if (zone) request.input('zone', zone);

    const result = await request.query(query);

    res.json({
      success: true,
      devices: result.recordset,
      count: result.recordset.length
    });

  } catch (error) {
    console.error('Error in /api/ptl/devices:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero dispositivi PTL',
      details: error.message
    });
  }
});

/**
 * GET /api/ptl/devices/:id
 * Ottieni dettagli singolo dispositivo PTL
 */
router.get('/devices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();

    const result = await pool.request()
      .input('id', parseInt(id))
      .query(`
        SELECT
          D.*,
          L.CodiceUbicazione as locationCode,
          L.Descrizione as locationDescription
        FROM PTLDevices D
        LEFT JOIN Ubicazioni L ON D.locationId = L.id
        WHERE D.id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Dispositivo PTL non trovato'
      });
    }

    res.json({
      success: true,
      device: result.recordset[0]
    });

  } catch (error) {
    console.error('Error in /api/ptl/devices/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero dispositivo',
      details: error.message
    });
  }
});

/**
 * POST /api/ptl/devices
 * Crea nuovo dispositivo PTL
 *
 * Body:
 * - deviceCode: codice dispositivo (required)
 * - deviceName: nome dispositivo
 * - locationId: ID ubicazione associata
 * - zone: zona magazzino
 * - ipAddress: indirizzo IP
 */
router.post('/devices', async (req, res) => {
  try {
    const { deviceCode, deviceName, locationId, zone, ipAddress } = req.body;

    if (!deviceCode) {
      return res.status(400).json({
        success: false,
        error: 'deviceCode obbligatorio'
      });
    }

    const pool = await getPool();

    const result = await pool.request()
      .input('deviceCode', deviceCode)
      .input('deviceName', deviceName || null)
      .input('locationId', locationId || null)
      .input('zone', zone || null)
      .input('ipAddress', ipAddress || null)
      .query(`
        INSERT INTO PTLDevices (deviceCode, deviceName, locationId, zone, ipAddress, status)
        OUTPUT INSERTED.*
        VALUES (@deviceCode, @deviceName, @locationId, @zone, @ipAddress, 'active')
      `);

    res.status(201).json({
      success: true,
      device: result.recordset[0]
    });

  } catch (error) {
    console.error('Error in POST /api/ptl/devices:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nella creazione dispositivo',
      details: error.message
    });
  }
});

/**
 * POST /api/ptl/light-up
 * Accendi LED su dispositivo PTL
 *
 * Body:
 * - deviceId: ID dispositivo (required)
 * - itemId: ID articolo (optional)
 * - quantity: quantità da prelevare (required)
 * - color: colore LED (red, green, orange, blue, pink, cyan, yellow)
 * - mode: modalità (fixed, blink_2000, blink_1000, blink_500, blink_250, blink, solid, pulse)
 */
router.post('/light-up', async (req, res) => {
  try {
    const { deviceId, itemId, quantity, color = 'green', mode = 'blink' } = req.body;

    if (!deviceId || quantity === undefined) {
      return res.status(400).json({
        success: false,
        error: 'deviceId e quantity obbligatori'
      });
    }

    // Validate color (6 colors from legacy AblePick system)
    const VALID_COLORS = ['red', 'green', 'orange', 'blue', 'pink', 'cyan', 'yellow'];
    if (!VALID_COLORS.includes(color)) {
      return res.status(400).json({
        success: false,
        error: `Colore non valido. Colori disponibili: ${VALID_COLORS.join(', ')}`
      });
    }

    // Validate blink mode (5 modes from legacy AblePick system)
    const VALID_MODES = ['fixed', 'blink_2000', 'blink_1000', 'blink_500', 'blink_250', 'blink', 'solid', 'pulse'];
    if (!VALID_MODES.includes(mode)) {
      return res.status(400).json({
        success: false,
        error: `Modalità non valida. Modalità disponibili: ${VALID_MODES.join(', ')}`
      });
    }

    const pool = await getPool();

    // Verifica esistenza dispositivo
    const deviceResult = await pool.request()
      .input('deviceId', parseInt(deviceId))
      .query('SELECT * FROM PTLDevices WHERE id = @deviceId');

    if (deviceResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Dispositivo non trovato'
      });
    }

    const device = deviceResult.recordset[0];

    // Crea o verifica tabella PTLEvents
    await pool.request().query(`
      IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'PTLEvents')
      BEGIN
        CREATE TABLE PTLEvents (
          id INT IDENTITY(1,1) PRIMARY KEY,
          deviceId INT NOT NULL,
          itemId INT,
          eventType NVARCHAR(20) NOT NULL,
          quantity INT,
          color NVARCHAR(20),
          mode NVARCHAR(20),
          status NVARCHAR(20) DEFAULT 'active',
          confirmedAt DATETIME,
          createdAt DATETIME DEFAULT GETDATE()
        )
      END
    `);

    // Registra evento PTL
    const eventResult = await pool.request()
      .input('deviceId', parseInt(deviceId))
      .input('itemId', itemId || null)
      .input('eventType', 'light-up')
      .input('quantity', parseInt(quantity))
      .input('color', color)
      .input('mode', mode)
      .query(`
        INSERT INTO PTLEvents (deviceId, itemId, eventType, quantity, color, mode, status)
        OUTPUT INSERTED.*
        VALUES (@deviceId, @itemId, @eventType, @quantity, @color, @mode, 'active')
      `);

    const event = eventResult.recordset[0];

    // Simula comando hardware PTL
    console.log(`[PTL] Light-up command sent to device ${device.deviceCode}:`, {
      quantity,
      color,
      mode
    });

    res.json({
      success: true,
      event: event,
      device: {
        id: device.id,
        code: device.deviceCode,
        name: device.deviceName,
        location: device.locationCode
      },
      command: {
        type: 'light-up',
        quantity,
        color,
        mode
      }
    });

  } catch (error) {
    console.error('Error in /api/ptl/light-up:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nell\'accensione LED',
      details: error.message
    });
  }
});

/**
 * POST /api/ptl/confirm
 * Conferma prelievo PTL
 *
 * Body:
 * - eventId: ID evento PTL (required)
 * - actualQuantity: quantità effettivamente prelevata
 */
router.post('/confirm', async (req, res) => {
  try {
    const { eventId, actualQuantity } = req.body;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        error: 'eventId obbligatorio'
      });
    }

    const pool = await getPool();

    // Verifica evento
    const eventCheck = await pool.request()
      .input('eventId', parseInt(eventId))
      .query('SELECT * FROM PTLEvents WHERE id = @eventId');

    if (eventCheck.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Evento PTL non trovato'
      });
    }

    const event = eventCheck.recordset[0];

    // Aggiorna evento come confermato
    const updateResult = await pool.request()
      .input('eventId', parseInt(eventId))
      .input('actualQuantity', actualQuantity || event.quantity)
      .query(`
        UPDATE PTLEvents
        SET
          status = 'confirmed',
          quantity = @actualQuantity,
          confirmedAt = GETDATE()
        OUTPUT INSERTED.*
        WHERE id = @eventId
      `);

    // Simula spegnimento LED
    console.log(`[PTL] LED turned off for event ${eventId}`);

    res.json({
      success: true,
      event: updateResult.recordset[0],
      message: 'Prelievo confermato con successo'
    });

  } catch (error) {
    console.error('Error in /api/ptl/confirm:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nella conferma prelievo',
      details: error.message
    });
  }
});

/**
 * POST /api/ptl/cancel
 * Annulla evento PTL
 *
 * Body:
 * - eventId: ID evento PTL (required)
 * - reason: motivo annullamento
 */
router.post('/cancel', async (req, res) => {
  try {
    const { eventId, reason } = req.body;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        error: 'eventId obbligatorio'
      });
    }

    const pool = await getPool();

    const result = await pool.request()
      .input('eventId', parseInt(eventId))
      .query(`
        UPDATE PTLEvents
        SET status = 'cancelled'
        OUTPUT INSERTED.*
        WHERE id = @eventId AND status = 'active'
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Evento non trovato o già processato'
      });
    }

    // Simula spegnimento LED
    console.log(`[PTL] LED cancelled for event ${eventId}:`, reason);

    res.json({
      success: true,
      event: result.recordset[0],
      message: 'Evento PTL annullato'
    });

  } catch (error) {
    console.error('Error in /api/ptl/cancel:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nell\'annullamento evento',
      details: error.message
    });
  }
});

/**
 * GET /api/ptl/events
 * Ottieni eventi PTL
 *
 * Query params:
 * - status: filtra per stato (active, confirmed, cancelled)
 * - deviceId: filtra per dispositivo
 * - limit: numero massimo risultati (default: 100)
 */
router.get('/events', async (req, res) => {
  try {
    const { status, deviceId, limit = 100 } = req.query;

    const pool = await getPool();

    let query = `
      SELECT TOP (@limit)
        E.*,
        D.deviceCode, D.deviceName, D.zone,
        L.CodiceUbicazione as locationCode,
        A.CodiceArticolo, A.Descrizione as itemDescription
      FROM PTLEvents E
      LEFT JOIN PTLDevices D ON E.deviceId = D.id
      LEFT JOIN Ubicazioni L ON D.locationId = L.id
      LEFT JOIN Articoli A ON E.itemId = A.id
      WHERE 1=1
    `;

    if (status) {
      query += ` AND E.status = @status`;
    }

    if (deviceId) {
      query += ` AND E.deviceId = @deviceId`;
    }

    query += ` ORDER BY E.createdAt DESC`;

    const request = pool.request()
      .input('limit', parseInt(limit));

    if (status) request.input('status', status);
    if (deviceId) request.input('deviceId', parseInt(deviceId));

    const result = await request.query(query);

    res.json({
      success: true,
      events: result.recordset,
      count: result.recordset.length
    });

  } catch (error) {
    console.error('Error in /api/ptl/events:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero eventi PTL',
      details: error.message
    });
  }
});

/**
 * POST /api/ptl/ping
 * Aggiorna last ping di un dispositivo
 *
 * Body:
 * - deviceId: ID dispositivo (required)
 */
router.post('/ping', async (req, res) => {
  try {
    const { deviceId } = req.body;

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        error: 'deviceId obbligatorio'
      });
    }

    const pool = await getPool();

    const result = await pool.request()
      .input('deviceId', parseInt(deviceId))
      .query(`
        UPDATE PTLDevices
        SET lastPing = GETDATE()
        OUTPUT INSERTED.*
        WHERE id = @deviceId
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Dispositivo non trovato'
      });
    }

    res.json({
      success: true,
      device: result.recordset[0]
    });

  } catch (error) {
    console.error('Error in /api/ptl/ping:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nell\'aggiornamento ping',
      details: error.message
    });
  }
});

/**
 * GET /api/ptl/stats
 * Ottieni statistiche PTL
 */
router.get('/stats', async (req, res) => {
  try {
    const pool = await getPool();

    // Conta dispositivi per stato
    const devicesStats = await pool.request().query(`
      SELECT
        status,
        COUNT(*) as count
      FROM PTLDevices
      GROUP BY status
    `);

    // Conta eventi per stato (ultimi 7 giorni)
    const eventsStats = await pool.request().query(`
      SELECT
        status,
        COUNT(*) as count,
        SUM(quantity) as totalQuantity
      FROM PTLEvents
      WHERE createdAt >= DATEADD(day, -7, GETDATE())
      GROUP BY status
    `);

    // Media tempo conferma (in secondi)
    const avgConfirmTime = await pool.request().query(`
      SELECT
        AVG(DATEDIFF(SECOND, createdAt, confirmedAt)) as avgSeconds
      FROM PTLEvents
      WHERE status = 'confirmed'
        AND confirmedAt IS NOT NULL
        AND createdAt >= DATEADD(day, -7, GETDATE())
    `);

    res.json({
      success: true,
      stats: {
        devices: devicesStats.recordset,
        events: eventsStats.recordset,
        avgConfirmTimeSeconds: avgConfirmTime.recordset[0]?.avgSeconds || 0
      }
    });

  } catch (error) {
    console.error('Error in /api/ptl/stats:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero statistiche',
      details: error.message
    });
  }
});

export default router;
