/**
 * Stock Movements Routes
 * Read-only endpoints per movimenti di magazzino (Storico)
 * Schema reale database SQL Server - EjLog WMS
 */

import express from 'express';
import { asyncHandler } from '../middleware/error-handler.js';
import { validateId, validatePagination } from '../middleware/validator.js';
import {
  getStockMovements,
  getStockMovementById,
  getStockMovementsByItem
} from '../controllers/stock-movements.controller.js';

const router = express.Router();

// GET /api/stock-movements - Lista movimenti con filtri
router.get('/',
  validatePagination,
  asyncHandler(getStockMovements)
);

// GET /api/stock-movements/:id - Dettaglio movimento
router.get('/:id',
  validateId('id'),
  asyncHandler(getStockMovementById)
);

// GET /api/stock-movements/item/:itemId - Movimenti per articolo
router.get('/item/:itemId',
  validateId('itemId'),
  asyncHandler(getStockMovementsByItem)
);

export default router;
