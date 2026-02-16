/**
 * Mock API Server for E2E Testing
 * Emulates EjLog backend REST API responses
 * Port: 8080
 */

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Mock Data Generators
const generateItems = (count = 50) => {
  const categories = ['MATERIA PRIMA', 'SEMILAVORATO', 'PRODOTTO FINITO', 'ACCESSORIO'];
  const statuses = ['ATTIVO', 'INATTIVO', 'IN_TRANSITO'];

  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    code: `ITEM-${String(i + 1).padStart(4, '0')}`,
    description: `Articolo Test ${i + 1}`,
    category: categories[i % categories.length],
    status: statuses[i % statuses.length],
    quantity: Math.floor(Math.random() * 1000),
    minStock: Math.floor(Math.random() * 100),
    maxStock: Math.floor(Math.random() * 500) + 500,
    unit: 'PZ',
    weight: (Math.random() * 50).toFixed(2),
    volume: (Math.random() * 100).toFixed(2),
    price: (Math.random() * 500).toFixed(2),
    createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  }));
};

const generateLists = (count = 30) => {
  const types = ['PICKING', 'RIFORNIMENTO', 'INVENTARIO', 'TRASFERIMENTO'];
  const statuses = ['IN_CORSO', 'COMPLETATA', 'ANNULLATA', 'PIANIFICATA'];

  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    code: `LIST-${String(i + 1).padStart(4, '0')}`,
    type: types[i % types.length],
    status: statuses[i % statuses.length],
    priority: Math.floor(Math.random() * 5) + 1,
    itemCount: Math.floor(Math.random() * 50) + 1,
    completedItems: Math.floor(Math.random() * 50),
    assignedTo: `Operatore ${i % 5 + 1}`,
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: Math.random() > 0.5 ? new Date().toISOString() : null
  }));
};

const generateStock = (count = 100) => {
  const zones = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const statuses = ['DISPONIBILE', 'RISERVATO', 'IN_TRANSITO', 'BLOCCATO'];

  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    itemCode: `ITEM-${String((i % 50) + 1).padStart(4, '0')}`,
    location: `${zones[i % zones.length]}-${String(Math.floor(i / 6) + 1).padStart(3, '0')}`,
    zone: zones[i % zones.length],
    quantity: Math.floor(Math.random() * 500) + 1,
    status: statuses[i % statuses.length],
    lot: `LOT-${String(i + 1).padStart(5, '0')}`,
    expiry: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    lastMovement: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
  }));
};

const generateMovements = (count = 200) => {
  const types = ['ENTRATA', 'USCITA', 'TRASFERIMENTO', 'RETTIFICA'];
  const reasons = ['ACQUISTO', 'VENDITA', 'PRODUZIONE', 'SCARTO', 'INVENTARIO'];

  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    itemCode: `ITEM-${String((i % 50) + 1).padStart(4, '0')}`,
    type: types[i % types.length],
    reason: reasons[i % reasons.length],
    quantity: Math.floor(Math.random() * 100) + 1,
    fromLocation: i % 2 === 0 ? `A1-${String(i + 1).padStart(3, '0')}` : null,
    toLocation: i % 2 === 1 ? `B2-${String(i + 1).padStart(3, '0')}` : null,
    user: `user${(i % 10) + 1}`,
    timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    notes: Math.random() > 0.7 ? `Note movimento ${i + 1}` : null
  }));
};

// Mock data storage
let ITEMS = generateItems();
let LISTS = generateLists();
let STOCK = generateStock();
let MOVEMENTS = generateMovements();

// ==============================================================================
// API ENDPOINTS - /EjLogHostVertimag/*
// ==============================================================================

// Health check
app.get('/EjLogHostVertimag/test', (req, res) => {
  res.json({ status: 'OK', message: 'Mock API Server is running', timestamp: new Date().toISOString() });
});

// Items endpoints
app.get('/EjLogHostVertimag/Items', (req, res) => {
  const { category, status, search, page = 1, limit = 50 } = req.query;
  let filtered = [...ITEMS];

  if (category) filtered = filtered.filter(item => item.category === category);
  if (status) filtered = filtered.filter(item => item.status === status);
  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(item =>
      item.code.toLowerCase().includes(searchLower) ||
      item.description.toLowerCase().includes(searchLower)
    );
  }

  const start = (page - 1) * limit;
  const end = start + parseInt(limit);
  const paginated = filtered.slice(start, end);

  res.json({
    data: paginated,
    total: filtered.length,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(filtered.length / limit)
  });
});

app.get('/EjLogHostVertimag/Items/:id', (req, res) => {
  const item = ITEMS.find(i => i.id === parseInt(req.params.id));
  if (item) {
    res.json(item);
  } else {
    res.status(404).json({ error: 'Item not found' });
  }
});

// Lists endpoints
app.get('/EjLogHostVertimag/Lists', (req, res) => {
  const { type, status, page = 1, limit = 50 } = req.query;
  let filtered = [...LISTS];

  if (type) filtered = filtered.filter(list => list.type === type);
  if (status) filtered = filtered.filter(list => list.status === status);

  const start = (page - 1) * limit;
  const end = start + parseInt(limit);
  const paginated = filtered.slice(start, end);

  res.json({
    data: paginated,
    total: filtered.length,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(filtered.length / limit)
  });
});

app.get('/EjLogHostVertimag/Lists/:id', (req, res) => {
  const list = LISTS.find(l => l.id === parseInt(req.params.id));
  if (list) {
    res.json(list);
  } else {
    res.status(404).json({ error: 'List not found' });
  }
});

app.get('/EjLogHostVertimag/Lists/ViewList/:id', (req, res) => {
  const list = LISTS.find(l => l.id === parseInt(req.params.id));
  if (list) {
    // Include items for this list
    const items = ITEMS.slice(0, list.itemCount).map((item, i) => ({
      ...item,
      picked: i < list.completedItems,
      pickedQuantity: i < list.completedItems ? item.quantity : 0
    }));

    res.json({
      ...list,
      items
    });
  } else {
    res.status(404).json({ error: 'List not found' });
  }
});

// Stock endpoints
app.get('/EjLogHostVertimag/Stock', (req, res) => {
  const { zone, status, itemCode, page = 1, limit = 50 } = req.query;
  let filtered = [...STOCK];

  if (zone) filtered = filtered.filter(s => s.zone === zone);
  if (status) filtered = filtered.filter(s => s.status === status);
  if (itemCode) filtered = filtered.filter(s => s.itemCode === itemCode);

  const start = (page - 1) * limit;
  const end = start + parseInt(limit);
  const paginated = filtered.slice(start, end);

  res.json({
    data: paginated,
    total: filtered.length,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(filtered.length / limit)
  });
});

// Movements endpoints
app.get('/EjLogHostVertimag/Movements', (req, res) => {
  const { type, itemCode, dateFrom, dateTo, page = 1, limit = 50 } = req.query;
  let filtered = [...MOVEMENTS];

  if (type) filtered = filtered.filter(m => m.type === type);
  if (itemCode) filtered = filtered.filter(m => m.itemCode === itemCode);
  if (dateFrom) filtered = filtered.filter(m => new Date(m.timestamp) >= new Date(dateFrom));
  if (dateTo) filtered = filtered.filter(m => new Date(m.timestamp) <= new Date(dateTo));

  const start = (page - 1) * limit;
  const end = start + parseInt(limit);
  const paginated = filtered.slice(start, end);

  res.json({
    data: paginated,
    total: filtered.length,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(filtered.length / limit)
  });
});

// Products endpoint (alias for Items)
app.get('/EjLogHostVertimag/Products', (req, res) => {
  res.json({ data: ITEMS, total: ITEMS.length });
});

// User/Login endpoint
app.post('/EjLogHostVertimag/User/Login', (req, res) => {
  res.json({
    success: true,
    token: 'mock-jwt-token-' + Date.now(),
    user: {
      id: 1,
      username: req.body.username || 'testuser',
      name: 'Test User',
      role: 'ADMIN'
    }
  });
});

// Dashboard stats endpoint
app.get('/EjLogHostVertimag/dashboard/stats', (req, res) => {
  res.json({
    totalItems: ITEMS.length,
    totalStock: STOCK.reduce((sum, s) => sum + s.quantity, 0),
    activeLists: LISTS.filter(l => l.status === 'IN_CORSO').length,
    todayMovements: MOVEMENTS.filter(m =>
      new Date(m.timestamp).toDateString() === new Date().toDateString()
    ).length,
    lowStockItems: ITEMS.filter(i => i.quantity < i.minStock).length,
    pendingOrders: Math.floor(Math.random() * 50),
    efficiency: (85 + Math.random() * 10).toFixed(1)
  });
});

// Catch all for undefined endpoints
app.all('/EjLogHostVertimag/*', (req, res) => {
  console.log(`[WARN] Unhandled endpoint: ${req.method} ${req.path}`);
  res.status(404).json({
    error: 'Endpoint not found in mock server',
    path: req.path,
    method: req.method
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║                                                        ║');
  console.log('║         Mock API Server - E2E Testing                 ║');
  console.log('║         EjLog WMS REST API Emulator                   ║');
  console.log('║                                                        ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  console.log(`[✓] Server running on http://localhost:${PORT}`);
  console.log(`[✓] Base path: /EjLogHostVertimag`);
  console.log(`[✓] Test endpoint: http://localhost:${PORT}/EjLogHostVertimag/test`);
  console.log(`\n[INFO] Mock data loaded:`);
  console.log(`  - ${ITEMS.length} items`);
  console.log(`  - ${LISTS.length} lists`);
  console.log(`  - ${STOCK.length} stock records`);
  console.log(`  - ${MOVEMENTS.length} movements`);
  console.log(`\n[INFO] Ready for E2E testing!\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[INFO] Shutting down mock API server...');
  process.exit(0);
});
