/**
 * Loading Units Routes (NEW)
 * Complete CRUD endpoints con validazione
 */

import express from 'express';
import { asyncHandler } from '../middleware/error-handler.js';
import { validate, validateId, validatePagination } from '../middleware/validator.js';
import {
  createLoadingUnitValidator,
  updateLoadingUnitValidator
} from '../validators/loading-unit.validator.js';
import {
  getLoadingUnits,
  getLoadingUnitById,
  createLoadingUnit,
  updateLoadingUnit,
  deleteLoadingUnit
} from '../controllers/loading-units.controller.js';
import {
  getCompartmentsByLoadingUnit,
  createCompartment
} from '../controllers/compartments.controller.js';
import {
  createCompartmentValidator
} from '../validators/compartment.validator.js';

const router = express.Router();

/**
 * @swagger
 * /api/loading-units:
 *   get:
 *     summary: Lista UDC con filtri e paginazione
 *     tags: [Loading Units]
 *     parameters:
 *       - in: query
 *         name: barcode
 *         schema:
 *           type: string
 *       - in: query
 *         name: warehouseId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Lista UDC
 */
router.get('/',
  validatePagination,
  asyncHandler(getLoadingUnits)
);

/**
 * @swagger
 * /api/loading-units/{id}:
 *   get:
 *     summary: Dettaglio UDC
 *     tags: [Loading Units]
 */
router.get('/:id',
  validateId('id'),
  asyncHandler(getLoadingUnitById)
);

/**
 * @swagger
 * /api/loading-units:
 *   post:
 *     summary: Crea nuovo UDC
 *     tags: [Loading Units]
 */
router.post('/',
  createLoadingUnitValidator,
  validate,
  asyncHandler(createLoadingUnit)
);

/**
 * @swagger
 * /api/loading-units/{id}:
 *   put:
 *     summary: Aggiorna UDC
 *     tags: [Loading Units]
 */
router.put('/:id',
  validateId('id'),
  updateLoadingUnitValidator,
  validate,
  asyncHandler(updateLoadingUnit)
);

/**
 * @swagger
 * /api/loading-units/{id}:
 *   delete:
 *     summary: Elimina UDC
 *     tags: [Loading Units]
 */
router.delete('/:id',
  validateId('id'),
  asyncHandler(deleteLoadingUnit)
);

// Compartments nested routes
router.get('/:id/compartments',
  validateId('id'),
  asyncHandler(getCompartmentsByLoadingUnit)
);

router.post('/:id/compartments',
  validateId('id'),
  createCompartmentValidator,
  validate,
  asyncHandler(createCompartment)
);

export default router;
