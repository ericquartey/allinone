/**
 * Items Routes
 * Complete CRUD endpoints per articoli
 */

import express from 'express';
import { asyncHandler } from '../middleware/error-handler.js';
import { validate, validateId, validatePagination } from '../middleware/validator.js';
import {
  createItemValidator,
  updateItemValidator
} from '../validators/item.validator.js';
import {
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  getItemStock,
  getItemImages,
  getItemsDebug
} from '../controllers/items.controller.js';

const router = express.Router();

// Debug endpoint - must be before /:id route
router.get('/debug/count',
  asyncHandler(getItemsDebug)
);

router.get('/',
  validatePagination,
  asyncHandler(getItems)
);

router.get('/:id',
  validateId('id'),
  asyncHandler(getItemById)
);

router.post('/',
  createItemValidator,
  validate,
  asyncHandler(createItem)
);

router.put('/:id',
  validateId('id'),
  updateItemValidator,
  validate,
  asyncHandler(updateItem)
);

router.delete('/:id',
  validateId('id'),
  asyncHandler(deleteItem)
);

// Endpoint giacenze
router.get('/:id/stock',
  validateId('id'),
  asyncHandler(getItemStock)
);

// Endpoint immagini
router.get('/:id/images',
  validateId('id'),
  asyncHandler(getItemImages)
);

export default router;
