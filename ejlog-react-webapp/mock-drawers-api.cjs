// mock-drawers-api.js
// Temporary mock API server for /api/loading-units endpoint
// Run with: node mock-drawers-api.js

const express = require('express');
const app = express();
const PORT = 8077;

app.use(express.json());

// Mock data
const mockDrawers = [
  {
    id: 1,
    code: "CASS001",
    barcode: "BC001",
    locationCode: "A-01-01",
    warehouseId: 1,
    warehouseName: "Magazzino Principale",
    heightClass: "A",
    compartmentCount: 12,
    emptyCompartmentCount: 5,
    isBlocked: false,
    hasReservations: true,
    lastUpdate: "2025-11-28T10:00:00Z"
  },
  {
    id: 2,
    code: "CASS002",
    barcode: "BC002",
    locationCode: "A-01-02",
    warehouseId: 1,
    warehouseName: "Magazzino Principale",
    heightClass: "B",
    compartmentCount: 8,
    emptyCompartmentCount: 8,
    isBlocked: false,
    hasReservations: false,
    lastUpdate: "2025-11-28T09:30:00Z"
  },
  {
    id: 3,
    code: "CASS003",
    barcode: "BC003",
    locationCode: "B-02-01",
    warehouseId: 2,
    warehouseName: "Magazzino Secondario",
    heightClass: "A",
    compartmentCount: 16,
    emptyCompartmentCount: 0,
    isBlocked: true,
    hasReservations: true,
    lastUpdate: "2025-11-28T08:15:00Z"
  },
  {
    id: 4,
    code: "CASS004",
    barcode: "BC004",
    locationCode: "B-02-02",
    warehouseId: 2,
    warehouseName: "Magazzino Secondario",
    heightClass: "C",
    compartmentCount: 20,
    emptyCompartmentCount: 10,
    isBlocked: false,
    hasReservations: false,
    lastUpdate: "2025-11-28T07:45:00Z"
  },
  {
    id: 5,
    code: "CASS005",
    barcode: "BC005",
    locationCode: "A-03-01",
    warehouseId: 1,
    warehouseName: "Magazzino Principale",
    heightClass: "B",
    compartmentCount: 10,
    emptyCompartmentCount: 3,
    isBlocked: false,
    hasReservations: true,
    lastUpdate: "2025-11-28T11:20:00Z"
  }
];

const mockCompartments = {
  1: [ // CASS001
    { id: 101, barcode: "COMP001-1", xPosition: 0, yPosition: 0, width: 200, depth: 300, fillPercentage: 75, products: [{ articleCode: "ART001", quantity: 50 }] },
    { id: 102, barcode: "COMP001-2", xPosition: 200, yPosition: 0, width: 200, depth: 300, fillPercentage: 50, products: [{ articleCode: "ART002", quantity: 30 }] },
    { id: 103, barcode: "COMP001-3", xPosition: 400, yPosition: 0, width: 200, depth: 300, fillPercentage: 0, products: [] }
  ],
  2: [ // CASS002 - empty
    { id: 201, barcode: "COMP002-1", xPosition: 0, yPosition: 0, width: 250, depth: 350, fillPercentage: 0, products: [] },
    { id: 202, barcode: "COMP002-2", xPosition: 250, yPosition: 0, width: 250, depth: 350, fillPercentage: 0, products: [] }
  ],
  3: [ // CASS003 - full
    { id: 301, barcode: "COMP003-1", xPosition: 0, yPosition: 0, width: 180, depth: 280, fillPercentage: 100, products: [{ articleCode: "ART003", quantity: 100 }] },
    { id: 302, barcode: "COMP003-2", xPosition: 180, yPosition: 0, width: 180, depth: 280, fillPercentage: 100, products: [{ articleCode: "ART004", quantity: 75 }] },
    { id: 303, barcode: "COMP003-3", xPosition: 360, yPosition: 0, width: 180, depth: 280, fillPercentage: 100, products: [{ articleCode: "ART005", quantity: 120 }] }
  ]
};

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// GET /api/loading-units
app.get('/api/loading-units', (req, res) => {
  const { search, warehouseId, locationCode, heightClass, fillFilter, isBlocked, hasReservations } = req.query;

  let filtered = [...mockDrawers];

  if (search) {
    filtered = filtered.filter(d => d.code.toLowerCase().includes(search.toLowerCase()));
  }

  if (warehouseId) {
    filtered = filtered.filter(d => d.warehouseId === parseInt(warehouseId));
  }

  if (locationCode) {
    filtered = filtered.filter(d => d.locationCode && d.locationCode.toLowerCase().includes(locationCode.toLowerCase()));
  }

  if (heightClass) {
    filtered = filtered.filter(d => d.heightClass === heightClass);
  }

  if (isBlocked !== undefined) {
    const blocked = isBlocked === 'true';
    filtered = filtered.filter(d => d.isBlocked === blocked);
  }

  if (hasReservations !== undefined) {
    const reservations = hasReservations === 'true';
    filtered = filtered.filter(d => d.hasReservations === reservations);
  }

  console.log(`  → Returning ${filtered.length} loading units`);
  res.json({ items: filtered, totalCount: filtered.length });
});

// GET /api/loading-units/:id
app.get('/api/loading-units/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const drawer = mockDrawers.find(d => d.id === id);

  if (!drawer) {
    return res.status(404).json({ error: 'Loading unit not found' });
  }

  console.log(`  → Returning loading unit ${drawer.code}`);
  res.json(drawer);
});

// GET /api/loading-units/:id/compartments
app.get('/api/loading-units/:id/compartments', (req, res) => {
  const id = parseInt(req.params.id);
  const compartments = mockCompartments[id] || [];

  console.log(`  → Returning ${compartments.length} compartments for loading unit ${id}`);
  res.json({ items: compartments, totalCount: compartments.length });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Mock Drawers API Server running on http://localhost:${PORT}`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  GET  /api/loading-units`);
  console.log(`  GET  /api/loading-units/:id`);
  console.log(`  GET  /api/loading-units/:id/compartments`);
  console.log(`\nMock data: ${mockDrawers.length} loading units with compartments\n`);
  console.log(`Press Ctrl+C to stop\n`);
});
