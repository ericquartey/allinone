/**
 * EjLog Adapter Routes - Replica completa dell'adapter .NET
 * Tutte le API dell'adapter integrate nel backend Node.js
 */

import express from 'express';
import { getRepository } from '../adapter/repository.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const repo = getRepository();

// Setup multer per gestione immagini
const IMAGES_DIR = path.join(__dirname, '..', 'adapter', 'Images');
if (!existsSync(IMAGES_DIR)) {
  mkdirSync(IMAGES_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, IMAGES_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage });

// ============================================
// VERSION
// ============================================

router.get('/version', (req, res) => {
  res.send('2.3.12.4-node-integrated');
});

// ============================================
// ITEMS API
// ============================================

// GET /api/items - Get all items
router.get('/items', (req, res) => {
  const items = repo.getItems();
  res.json(items);
});

// GET /api/items/:id - Get item by ID
router.get('/items/:id', (req, res) => {
  const item = repo.getItemById(req.params.id);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }
  res.json(item);
});

// GET /api/items/bar-code/:code - Get item by barcode
router.get('/items/bar-code/:code', (req, res) => {
  const item = repo.getItemByCode(req.params.code);
  if (!item) {
    // Default: ritorna il primo item (come .NET adapter)
    const firstItem = repo.getItems()[0];
    return res.json(firstItem || {});
  }
  res.json(item);
});

// POST /api/items/:id/pick - Pick item
router.post('/items/:id/pick', (req, res) => {
  const {
    quantity,
    destinationGroupId,
    machineId,
    reasonId,
    reasonNotes,
    compartmentId,
    lot,
    serialNumber,
    userName,
    orderId,
  } = req.body;

  const operation = repo.addOperation(
    req.params.id,
    quantity || 0,
    destinationGroupId,
    'Pick'
  );

  if (!operation) {
    return res.status(400).json({ error: 'Cannot create pick operation' });
  }

  console.log(`[ADAPTER] Pick request for item ${req.params.id}, qty: ${quantity}`);
  res.json({ success: true, operation });
});

// POST /api/items/:id/put - Put item
router.post('/items/:id/put', (req, res) => {
  const {
    quantity,
    destinationGroupId,
    machineId,
    reasonId,
    reasonNotes,
    compartmentId,
    lot,
    serialNumber,
    userName,
    orderId,
  } = req.body;

  const operation = repo.addOperation(
    req.params.id,
    quantity || 0,
    destinationGroupId,
    'Put'
  );

  if (!operation) {
    return res.status(400).json({ error: 'Cannot create put operation' });
  }

  console.log(`[ADAPTER] Put request for item ${req.params.id}, qty: ${quantity}`);
  res.json({ success: true, operation });
});

// POST /api/items/:id/check - Check item
router.post('/items/:id/check', (req, res) => {
  const { destinationGroupId, machineId, compartmentId, lot, serialNumber, userName } = req.body;

  const operation = repo.addOperation(
    req.params.id,
    0,
    destinationGroupId,
    'Check'
  );

  if (!operation) {
    return res.status(400).json({ error: 'Cannot create check operation' });
  }

  console.log(`[ADAPTER] Check request for item ${req.params.id}`);
  res.json({ success: true, operation });
});

// GET /api/items/:id/is-handled-by-lot
router.get('/items/:id/is-handled-by-lot', (req, res) => {
  console.log(`[ADAPTER] Check if item ${req.params.id} is handled by lot`);
  res.json(true);
});

// GET /api/items/:id/is-handled-by-serial-number
router.get('/items/:id/is-handled-by-serial-number', (req, res) => {
  console.log(`[ADAPTER] Check if item ${req.params.id} is handled by serial number`);
  res.json(true);
});

// GET /api/items/:id/is-handled-by-expire-date
router.get('/items/:id/is-handled-by-expire-date', (req, res) => {
  console.log(`[ADAPTER] Check if item ${req.params.id} is handled by expire date`);
  res.json(true);
});

// PUT /api/items/:itemId/average-weight
router.put('/items/:itemId/average-weight', (req, res) => {
  const { weight } = req.body;
  const item = repo.updateItem(req.params.itemId, { averageWeight: weight });

  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }

  console.log(`[ADAPTER] Updated weight for item ${req.params.itemId} to ${weight}`);
  res.json({ success: true, item });
});

// POST /api/items/print-item
router.post('/items/print-item', (req, res) => {
  const { id, printName, itemCode } = req.body;
  console.log(`[ADAPTER] Print item ${id}, printName: ${printName}, itemCode: ${itemCode}`);
  res.json({ success: true });
});

// ============================================
// ITEM LISTS API
// ============================================

// GET /api/item-lists - Get all lists
router.get('/item-lists', (req, res) => {
  const lists = repo.getItemLists();
  res.json(lists);
});

// GET /api/item-lists/:id - Get list by ID
router.get('/item-lists/:id', (req, res) => {
  const list = repo.getItemListById(req.params.id);
  if (!list) {
    return res.status(404).json({ error: 'List not found' });
  }
  res.json(list);
});

// GET /api/item-lists/:id/num - Get list by code
router.get('/item-lists/:id/num', (req, res) => {
  const list = repo.getItemListByCode(req.params.id);
  if (!list) {
    return res.status(404).json({ error: 'List not found' });
  }
  res.json(list);
});

// GET /api/item-lists/:id/rows - Get list rows
router.get('/item-lists/:id/rows', (req, res) => {
  const rows = repo.getItemListRows(req.params.id);
  res.json(rows);
});

// POST /api/item-lists/:id/execute - Execute list
router.post('/item-lists/:id/execute', (req, res) => {
  const { areaId, itemListEvadabilityType, destinationGroupId, userName } = req.body;

  const list = repo.getItemListById(req.params.id);
  if (!list) {
    return res.status(404).json({ error: 'List not found' });
  }

  // Cambia stato a Executing
  repo.updateItemListStatus(req.params.id, 'Executing');

  // Crea operazioni per ogni riga
  const rows = repo.getItemListRows(req.params.id);
  rows.forEach(row => {
    if (row.itemId) {
      repo.addOperation(
        row.itemId,
        row.requestedQuantity,
        destinationGroupId,
        list.itemListType
      );
    }
  });

  console.log(`[ADAPTER] Executing list ${req.params.id}`);
  res.json({ success: true });
});

// POST /api/item-lists/execute-num - Execute list by code
router.post('/item-lists/execute-num', (req, res) => {
  const { numList, areaId, itemListEvadabilityType, destinationGroupId, userName } = req.body;

  const list = repo.getItemListByCode(numList);
  if (!list) {
    return res.status(404).json({ error: 'List not found' });
  }

  repo.updateItemListStatus(list.id, 'Executing');

  const rows = repo.getItemListRows(list.id);
  rows.forEach(row => {
    if (row.itemId) {
      repo.addOperation(
        row.itemId,
        row.requestedQuantity,
        destinationGroupId,
        list.itemListType
      );
    }
  });

  console.log(`[ADAPTER] Executing list by code ${numList}`);
  res.json({ success: true });
});

// POST /api/item-lists/:id/suspend - Suspend list
router.post('/item-lists/:id/suspend', (req, res) => {
  const { userName } = req.body;

  repo.updateItemListStatus(req.params.id, 'Suspended');

  console.log(`[ADAPTER] Suspending list ${req.params.id}`);
  res.json({ success: true });
});

// POST /api/item-lists/:id/terminate - Terminate list
router.post('/item-lists/:id/terminate', (req, res) => {
  const list = repo.getItemListById(req.params.id);
  if (!list) {
    return res.status(404).json({ error: 'List not found' });
  }

  repo.updateItemListStatus(req.params.id, 'Completed');
  repo.completeOperationsByListCode(list.code);

  console.log(`[ADAPTER] Terminating list ${req.params.id}`);
  res.json({ success: true });
});

// ============================================
// AREAS API
// ============================================

router.get('/areas', (req, res) => {
  const areas = repo.getAreas();
  res.json(areas);
});

router.get('/areas/:id', (req, res) => {
  const area = repo.getAreaById(req.params.id);
  if (!area) {
    return res.status(404).json({ error: 'Area not found' });
  }
  res.json(area);
});

// ============================================
// COMPARTMENTS API
// ============================================

router.get('/compartments', (req, res) => {
  const compartments = repo.getCompartments();
  res.json(compartments);
});

router.get('/compartments/:id', (req, res) => {
  const compartment = repo.getCompartmentById(req.params.id);
  if (!compartment) {
    return res.status(404).json({ error: 'Compartment not found' });
  }
  res.json(compartment);
});

// ============================================
// MACHINES API
// ============================================

router.get('/machines', (req, res) => {
  const machines = repo.getMachines();
  res.json(machines);
});

router.get('/machines/:id', (req, res) => {
  const machine = repo.getMachineById(req.params.id);
  if (!machine) {
    return res.status(404).json({ error: 'Machine not found' });
  }
  res.json(machine);
});

router.put('/machines/:id/status', (req, res) => {
  const { status } = req.body;
  const machine = repo.updateMachineStatus(req.params.id, status);

  if (!machine) {
    return res.status(404).json({ error: 'Machine not found' });
  }

  res.json({ success: true, machine });
});

// ============================================
// LOADING UNITS (UDC) API
// ============================================

router.get('/loading-units', (req, res) => {
  const units = repo.getLoadingUnits();
  res.json(units);
});

router.get('/loading-units/:id', (req, res) => {
  const unit = repo.getLoadingUnitById(req.params.id);
  if (!unit) {
    return res.status(404).json({ error: 'Loading unit not found' });
  }
  res.json(unit);
});

router.post('/loading-units', (req, res) => {
  const unit = repo.addLoadingUnit(req.body);
  res.status(201).json(unit);
});

// ============================================
// USERS API
// ============================================

router.get('/users', (req, res) => {
  const users = repo.getUsers().map(u => ({
    name: u.name,
    accessLevel: u.accessLevel,
    // Non esporre password
  }));
  res.json(users);
});

router.post('/users/authenticate', (req, res) => {
  const { name, password } = req.body;
  const user = repo.authenticateUser(name, password);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  res.json({
    success: true,
    user: {
      name: user.name,
      accessLevel: user.accessLevel,
      token: user.token,
    },
  });
});

router.post('/users/authenticate-token', (req, res) => {
  const { token } = req.body;
  const user = repo.getUserByToken(token);

  if (!user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  res.json({
    success: true,
    user: {
      name: user.name,
      accessLevel: user.accessLevel,
    },
  });
});

// ============================================
// BARCODES API
// ============================================

router.get('/barcodes/rules', (req, res) => {
  const rules = repo.getBarcodeRules();
  res.json(rules);
});

router.get('/barcodes/rules/:id', (req, res) => {
  const rule = repo.getBarcodeRuleById(req.params.id);
  if (!rule) {
    return res.status(404).json({ error: 'Rule not found' });
  }
  res.json(rule);
});

// ============================================
// PRINTERS API
// ============================================

router.get('/printers', (req, res) => {
  const printers = repo.getPrinters();
  res.json(printers);
});

router.get('/printers/:id', (req, res) => {
  const printer = repo.getPrinterById(req.params.id);
  if (!printer) {
    return res.status(404).json({ error: 'Printer not found' });
  }
  res.json(printer);
});

// ============================================
// IMAGES API
// ============================================

router.post('/images/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  res.json({
    success: true,
    filename: req.file.filename,
    path: `/api/adapter/images/${req.file.filename}`,
  });
});

router.get('/images/:filename', (req, res) => {
  const filePath = path.join(IMAGES_DIR, req.params.filename);
  if (!existsSync(filePath)) {
    return res.status(404).json({ error: 'Image not found' });
  }
  res.sendFile(filePath);
});

// ============================================
// PUT TO LIGHT API
// ============================================

router.get('/put-to-light', (req, res) => {
  const data = repo.getPutToLightData();
  res.json(data);
});

router.post('/put-to-light', (req, res) => {
  const data = repo.addPutToLightData(req.body);
  res.json({ success: true, data });
});

// ============================================
// PRODUCTS API
// ============================================

router.get('/products', (req, res) => {
  const products = repo.getProducts();
  res.json(products);
});

router.get('/products/:id', (req, res) => {
  const product = repo.getProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(product);
});

// ============================================
// MISSION OPERATIONS API
// ============================================

router.get('/mission-operations', (req, res) => {
  const operations = repo.getMissionOperations();
  res.json(operations);
});

router.put('/mission-operations/:id/status', (req, res) => {
  const { status } = req.body;
  const operation = repo.updateOperationStatus(req.params.id, status);

  if (!operation) {
    return res.status(404).json({ error: 'Operation not found' });
  }

  res.json({ success: true, operation });
});

// ============================================
// DESTINATION GROUPS API
// ============================================

router.get('/destination-groups', (req, res) => {
  const groups = repo.getDestinationGroups();
  res.json(groups);
});

router.get('/destination-groups/:id', (req, res) => {
  const group = repo.getDestinationGroupById(req.params.id);
  if (!group) {
    return res.status(404).json({ error: 'Destination group not found' });
  }
  res.json(group);
});

// ============================================
// DEBUG API
// ============================================

router.get('/debug/database', (req, res) => {
  res.json(repo.db);
});

router.post('/debug/reset', (req, res) => {
  repo.db = repo.getEmptyDatabase();
  repo.saveDatabase();
  res.json({ success: true, message: 'Database reset' });
});

export default router;
