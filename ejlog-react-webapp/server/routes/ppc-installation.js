/**
 * PPC Installation Module - Backend Routes
 * API endpoints per tutte le 47 pagine Installation
 * Replica funzionalità del modulo Installation WPF/XAML
 */

import express from 'express';

const router = express.Router();

// ============================================================================
// IP MANAGER SETTINGS
// ============================================================================

// GET /api/settings/ip-manager
router.get('/ip-manager', async (req, res) => {
  try {
    // TODO: Integrare con database reale quando disponibile
    const settings = {
      bay1: {
        remoteIO: '192.168.1.100',
        alphanumericBar: '192.168.1.101',
        laser: '192.168.1.102',
        weightingScale: '192.168.1.103',
      },
      bay2: {
        remoteIO: '192.168.1.110',
        alphanumericBar: '192.168.1.111',
        laser: '192.168.1.112',
        weightingScale: '192.168.1.113',
      },
      bay3: {
        remoteIO: '192.168.1.120',
        alphanumericBar: '192.168.1.121',
        laser: '192.168.1.122',
        weightingScale: '192.168.1.123',
      },
      machineInverter: '192.168.1.200',
    };

    res.json(settings);
  } catch (error) {
    console.error('[PPC Installation] Error getting IP manager settings:', error);
    res.status(500).json({ error: 'Failed to get IP manager settings' });
  }
});

// PUT /api/settings/ip-manager
router.put('/ip-manager', async (req, res) => {
  try {
    const { bay1, bay2, bay3, machineInverter } = req.body;

    // TODO: Salvare nel database reale
    console.log('[PPC Installation] Saving IP manager settings:', {
      bay1,
      bay2,
      bay3,
      machineInverter,
    });

    res.json({ success: true, message: 'IP manager settings saved successfully' });
  } catch (error) {
    console.error('[PPC Installation] Error saving IP manager settings:', error);
    res.status(500).json({ error: 'Failed to save IP manager settings' });
  }
});

// ============================================================================
// DEVICES
// ============================================================================

// GET /api/installation/devices
router.get('/devices', async (req, res) => {
  try {
    const devices = [
      { id: 1, name: 'Alphanumeric Bar 1', type: 'alphanumeric', status: 'active', ip: '192.168.1.101' },
      { id: 2, name: 'Alphanumeric Bar 2', type: 'alphanumeric', status: 'active', ip: '192.168.1.111' },
      { id: 3, name: 'Barcode Reader 1', type: 'barcode', status: 'active', ip: '192.168.1.50' },
      { id: 4, name: 'Laser Pointer 1', type: 'laser', status: 'active', ip: '192.168.1.102' },
      { id: 5, name: 'Laser Pointer 2', type: 'laser', status: 'active', ip: '192.168.1.112' },
      { id: 6, name: 'Weighting Scale 1', type: 'scale', status: 'active', ip: '192.168.1.103' },
      { id: 7, name: 'Card Reader 1', type: 'card', status: 'inactive', ip: '192.168.1.60' },
      { id: 8, name: 'Token Reader 1', type: 'token', status: 'warning', ip: '192.168.1.61' },
    ];

    res.json(devices);
  } catch (error) {
    console.error('[PPC Installation] Error getting devices:', error);
    res.status(500).json({ error: 'Failed to get devices' });
  }
});

// ============================================================================
// BAY DEVICE IO
// ============================================================================

// GET /api/installation/bay-device-io/:bayNumber
router.get('/bay-device-io/:bayNumber', async (req, res) => {
  try {
    const { bayNumber } = req.params;

    const config = {
      bayNumber: parseInt(bayNumber),
      inputs: {
        drawerPresence: { address: `I${bayNumber}.0`, description: 'Drawer presence sensor' },
        doorOpen: { address: `I${bayNumber}.1`, description: 'Door open sensor' },
        emergencyStop: { address: `I${bayNumber}.2`, description: 'Emergency stop button' },
        heightSensor: { address: `I${bayNumber}.3`, description: 'Height detection sensor' },
      },
      outputs: {
        greenLight: { address: `Q${bayNumber}.0`, description: 'Green status light' },
        redLight: { address: `Q${bayNumber}.1`, description: 'Red status light' },
        buzzer: { address: `Q${bayNumber}.2`, description: 'Buzzer alarm' },
        lockSolenoid: { address: `Q${bayNumber}.3`, description: 'Door lock solenoid' },
      },
    };

    res.json(config);
  } catch (error) {
    console.error('[PPC Installation] Error getting bay device IO:', error);
    res.status(500).json({ error: 'Failed to get bay device IO' });
  }
});

// ============================================================================
// CELLS
// ============================================================================

// GET /api/installation/cells
router.get('/cells', async (req, res) => {
  try {
    const cells = [];

    // Genera dati per celle (esempio: 100 celle)
    for (let i = 1; i <= 100; i++) {
      cells.push({
        id: i,
        column: Math.floor((i - 1) / 10) + 1,
        row: ((i - 1) % 10) + 1,
        height: 300 + (i % 3) * 50, // Varia tra 300, 350, 400
        width: 400,
        depth: 600,
        enabled: true,
        hasPanel: i % 5 !== 0, // Ogni 5 celle non ha pannello
        sideControl: i % 3 === 0, // Ogni 3 celle ha controllo laterale
      });
    }

    res.json(cells);
  } catch (error) {
    console.error('[PPC Installation] Error getting cells:', error);
    res.status(500).json({ error: 'Failed to get cells' });
  }
});

// GET /api/installation/cells/heights
router.get('/cells/heights', async (req, res) => {
  try {
    const heights = [
      { id: 1, level: 1, height: 300, tolerance: 5 },
      { id: 2, level: 2, height: 350, tolerance: 5 },
      { id: 3, level: 3, height: 400, tolerance: 5 },
      { id: 4, level: 4, height: 450, tolerance: 5 },
      { id: 5, level: 5, height: 500, tolerance: 5 },
    ];

    res.json(heights);
  } catch (error) {
    console.error('[PPC Installation] Error getting cell heights:', error);
    res.status(500).json({ error: 'Failed to get cell heights' });
  }
});

// ============================================================================
// ELEVATOR CALIBRATION
// ============================================================================

// GET /api/installation/calibration/vertical-offset
router.get('/calibration/vertical-offset', async (req, res) => {
  try {
    const calibration = {
      currentPosition: 1250.5,
      targetPosition: 1250.0,
      offset: 0.5,
      tolerance: 2.0,
      status: 'calibrated',
      lastCalibration: new Date().toISOString(),
    };

    res.json(calibration);
  } catch (error) {
    console.error('[PPC Installation] Error getting vertical offset:', error);
    res.status(500).json({ error: 'Failed to get vertical offset calibration' });
  }
});

// POST /api/installation/calibration/vertical-offset
router.post('/calibration/vertical-offset', async (req, res) => {
  try {
    const { targetPosition } = req.body;

    console.log('[PPC Installation] Starting vertical offset calibration:', targetPosition);

    // Simula calibrazione
    setTimeout(() => {
      console.log('[PPC Installation] Vertical offset calibration completed');
    }, 2000);

    res.json({ success: true, message: 'Calibration started' });
  } catch (error) {
    console.error('[PPC Installation] Error starting calibration:', error);
    res.status(500).json({ error: 'Failed to start calibration' });
  }
});

// GET /api/installation/calibration/horizontal-offset
router.get('/calibration/horizontal-offset', async (req, res) => {
  try {
    const calibration = {
      currentPosition: 500.2,
      targetPosition: 500.0,
      offset: 0.2,
      tolerance: 1.0,
      status: 'calibrated',
      lastCalibration: new Date().toISOString(),
    };

    res.json(calibration);
  } catch (error) {
    console.error('[PPC Installation] Error getting horizontal offset:', error);
    res.status(500).json({ error: 'Failed to get horizontal offset calibration' });
  }
});

// GET /api/installation/calibration/weight
router.get('/calibration/weight', async (req, res) => {
  try {
    const calibration = {
      currentWeight: 125.3,
      expectedWeight: 125.0,
      deviation: 0.3,
      maxDeviation: 1.0,
      status: 'ok',
      samples: [125.1, 125.4, 125.2, 125.5, 125.3],
    };

    res.json(calibration);
  } catch (error) {
    console.error('[PPC Installation] Error getting weight calibration:', error);
    res.status(500).json({ error: 'Failed to get weight calibration' });
  }
});

// ============================================================================
// TRAJECTORIES
// ============================================================================

// GET /api/installation/trajectories/:type
router.get('/trajectories/:type', async (req, res) => {
  try {
    const { type } = req.params;

    const trajectories = {
      name: type,
      points: [
        { id: 1, x: 0, y: 0, z: 0, velocity: 100, acceleration: 50 },
        { id: 2, x: 500, y: 0, z: 0, velocity: 200, acceleration: 100 },
        { id: 3, x: 500, y: 300, z: 0, velocity: 150, acceleration: 75 },
        { id: 4, x: 500, y: 300, z: 600, velocity: 100, acceleration: 50 },
        { id: 5, x: 0, y: 300, z: 600, velocity: 200, acceleration: 100 },
        { id: 6, x: 0, y: 0, z: 600, velocity: 150, acceleration: 75 },
      ],
    };

    res.json(trajectories);
  } catch (error) {
    console.error('[PPC Installation] Error getting trajectories:', error);
    res.status(500).json({ error: 'Failed to get trajectories' });
  }
});

// PUT /api/installation/trajectories/:type
router.put('/trajectories/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { points } = req.body;

    console.log(`[PPC Installation] Saving ${type} trajectory:`, points);

    res.json({ success: true, message: 'Trajectory saved successfully' });
  } catch (error) {
    console.error('[PPC Installation] Error saving trajectory:', error);
    res.status(500).json({ error: 'Failed to save trajectory' });
  }
});

// ============================================================================
// SENSORS
// ============================================================================

// GET /api/installation/sensors
router.get('/sensors', async (req, res) => {
  try {
    const sensors = [
      { id: 1, name: 'Vertical Bottom Sensor', type: 'limit', status: 'active', address: 'I1.0' },
      { id: 2, name: 'Vertical Top Sensor', type: 'limit', status: 'active', address: 'I1.1' },
      { id: 3, name: 'Horizontal Left Sensor', type: 'limit', status: 'active', address: 'I1.2' },
      { id: 4, name: 'Horizontal Right Sensor', type: 'limit', status: 'active', address: 'I1.3' },
      { id: 5, name: 'Fork Extended Sensor', type: 'proximity', status: 'active', address: 'I1.4' },
      { id: 6, name: 'Fork Retracted Sensor', type: 'proximity', status: 'active', address: 'I1.5' },
      { id: 7, name: 'Drawer Presence Sensor Bay 1', type: 'proximity', status: 'active', address: 'I2.0' },
      { id: 8, name: 'Drawer Presence Sensor Bay 2', type: 'proximity', status: 'active', address: 'I2.1' },
      { id: 9, name: 'Drawer Presence Sensor Bay 3', type: 'proximity', status: 'active', address: 'I2.2' },
      { id: 10, name: 'Emergency Stop', type: 'safety', status: 'error', address: 'I0.0' },
    ];

    res.json(sensors);
  } catch (error) {
    console.error('[PPC Installation] Error getting sensors:', error);
    res.status(500).json({ error: 'Failed to get sensors' });
  }
});

// GET /api/installation/sensors/status
router.get('/sensors/status', async (req, res) => {
  try {
    const status = {
      verticalAxisSensors: {
        bottom: true,
        top: false,
        encoder: 12450,
      },
      horizontalAxisSensors: {
        left: false,
        right: true,
        encoder: 5620,
      },
      baysSensors: {
        bay1DrawerPresence: true,
        bay2DrawerPresence: false,
        bay3DrawerPresence: true,
      },
      otherSensors: {
        emergencyStop: false,
        doorOpen: false,
        forkExtended: true,
      },
    };

    res.json(status);
  } catch (error) {
    console.error('[PPC Installation] Error getting sensors status:', error);
    res.status(500).json({ error: 'Failed to get sensors status' });
  }
});

// ============================================================================
// PARAMETERS
// ============================================================================

// GET /api/installation/parameters
router.get('/parameters', async (req, res) => {
  try {
    const parameters = {
      machine: {
        name: 'VW-2024-001',
        serialNumber: 'SN123456789',
        barcode: 'BC-VW-2024-001',
        manufacturingDate: '2024-01-15',
      },
      movements: {
        verticalSpeed: 250, // mm/s
        horizontalSpeed: 300, // mm/s
        forkSpeed: 150, // mm/s
        acceleration: 100, // mm/s²
        deceleration: 150, // mm/s²
      },
      safety: {
        maxLoad: 500, // kg
        warningLoad: 450, // kg
        emergencyStopDelay: 50, // ms
        doorOpenTimeout: 30000, // ms
      },
      communication: {
        plcIp: '192.168.1.10',
        plcPort: 502,
        timeout: 5000, // ms
        retries: 3,
      },
    };

    res.json(parameters);
  } catch (error) {
    console.error('[PPC Installation] Error getting parameters:', error);
    res.status(500).json({ error: 'Failed to get parameters' });
  }
});

// PUT /api/installation/parameters
router.put('/parameters', async (req, res) => {
  try {
    const parameters = req.body;

    console.log('[PPC Installation] Saving parameters:', parameters);

    res.json({ success: true, message: 'Parameters saved successfully' });
  } catch (error) {
    console.error('[PPC Installation] Error saving parameters:', error);
    res.status(500).json({ error: 'Failed to save parameters' });
  }
});

// ============================================================================
// WAREHOUSE
// ============================================================================

// GET /api/installation/warehouse
router.get('/warehouse', async (req, res) => {
  try {
    const warehouse = {
      id: 1,
      name: 'Main Warehouse',
      columns: 10,
      rows: 10,
      totalCells: 100,
      activeCells: 95,
      dimensions: {
        width: 5000, // mm
        depth: 6000, // mm
        height: 5000, // mm
      },
      zones: [
        { id: 1, name: 'Zone A', columns: '1-3', rows: '1-10', type: 'picking' },
        { id: 2, name: 'Zone B', columns: '4-7', rows: '1-10', type: 'storage' },
        { id: 3, name: 'Zone C', columns: '8-10', rows: '1-10', type: 'refill' },
      ],
    };

    res.json(warehouse);
  } catch (error) {
    console.error('[PPC Installation] Error getting warehouse:', error);
    res.status(500).json({ error: 'Failed to get warehouse' });
  }
});

// ============================================================================
// SENSITIVE ALARM
// ============================================================================

// GET /api/settings/sensitive-alarm
router.get('/sensitive-alarm', async (req, res) => {
  try {
    const settings = {
      enabled: true,
      sensitivity: 'medium', // low, medium, high
      alarmDelay: 500, // ms
      alarmDuration: 2000, // ms
      triggers: {
        drawerMissing: true,
        weightMismatch: true,
        positionError: true,
        communicationLoss: true,
      },
    };

    res.json(settings);
  } catch (error) {
    console.error('[PPC Installation] Error getting sensitive alarm:', error);
    res.status(500).json({ error: 'Failed to get sensitive alarm settings' });
  }
});

// PUT /api/settings/sensitive-alarm
router.put('/sensitive-alarm', async (req, res) => {
  try {
    const settings = req.body;

    console.log('[PPC Installation] Saving sensitive alarm settings:', settings);

    res.json({ success: true, message: 'Sensitive alarm settings saved successfully' });
  } catch (error) {
    console.error('[PPC Installation] Error saving sensitive alarm:', error);
    res.status(500).json({ error: 'Failed to save sensitive alarm settings' });
  }
});

// ============================================================================
// MACHINE INFO
// ============================================================================

// GET /api/installation/machine/barcode
router.get('/machine/barcode', async (req, res) => {
  try {
    const barcode = {
      code: 'BC-VW-2024-001',
      format: 'CODE128',
      printDate: new Date().toISOString(),
    };

    res.json(barcode);
  } catch (error) {
    console.error('[PPC Installation] Error getting machine barcode:', error);
    res.status(500).json({ error: 'Failed to get machine barcode' });
  }
});

// GET /api/installation/machine/serial-number
router.get('/machine/serial-number', async (req, res) => {
  try {
    const serialNumber = {
      number: 'SN123456789',
      manufactureDate: '2024-01-15',
      warrantyExpiry: '2027-01-15',
    };

    res.json(serialNumber);
  } catch (error) {
    console.error('[PPC Installation] Error getting serial number:', error);
    res.status(500).json({ error: 'Failed to get serial number' });
  }
});

// GET /api/installation/machine/passwords
router.get('/machine/passwords', async (req, res) => {
  try {
    // NOTA: In produzione, non restituire mai password in chiaro!
    const passwords = {
      operator: { level: 1, lastChanged: '2024-01-15' },
      technician: { level: 2, lastChanged: '2024-01-15' },
      administrator: { level: 3, lastChanged: '2024-01-15' },
    };

    res.json(passwords);
  } catch (error) {
    console.error('[PPC Installation] Error getting passwords:', error);
    res.status(500).json({ error: 'Failed to get machine passwords' });
  }
});

// ============================================================================
// ACCESSORIES
// ============================================================================

// GET /api/installation/accessories/:type
router.get('/accessories/:type', async (req, res) => {
  try {
    const { type } = req.params;

    const accessory = {
      type,
      enabled: true,
      ip: `192.168.1.${Math.floor(Math.random() * 100) + 100}`,
      port: type === 'barcode-reader' ? 9100 : 502,
      protocol: type === 'barcode-reader' ? 'TCP' : 'Modbus TCP',
      settings: {
        baudRate: 9600,
        dataBits: 8,
        stopBits: 1,
        parity: 'None',
      },
    };

    res.json(accessory);
  } catch (error) {
    console.error('[PPC Installation] Error getting accessory:', error);
    res.status(500).json({ error: 'Failed to get accessory configuration' });
  }
});

export default router;
