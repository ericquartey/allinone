/**
 * Compartments Routes
 * Complete CRUD endpoints per scomparti
 */

import express from 'express';
import { asyncHandler } from '../middleware/error-handler.js';
import { validate, validateId } from '../middleware/validator.js';
import {
  createCompartmentValidator,
  updateCompartmentValidator
} from '../validators/compartment.validator.js';
import {
  getCompartmentsByLoadingUnit,
  getCompartmentById,
  createCompartment,
  updateCompartment,
  deleteCompartment
} from '../controllers/compartments.controller.js';

const router = express.Router();

// Routes per scomparti di un UDC specifico
router.get('/loading-units/:id/compartments',
  validateId('id'),
  asyncHandler(getCompartmentsByLoadingUnit)
);

router.post('/loading-units/:id/compartments',
  validateId('id'),
  createCompartmentValidator,
  validate,
  asyncHandler(createCompartment)
);

// Routes per singolo scomparto
router.get('/:id',
  validateId('id'),
  asyncHandler(getCompartmentById)
);

router.put('/:id',
  validateId('id'),
  updateCompartmentValidator,
  validate,
  asyncHandler(updateCompartment)
);

router.delete('/:id',
  validateId('id'),
  asyncHandler(deleteCompartment)
);

export default router;
