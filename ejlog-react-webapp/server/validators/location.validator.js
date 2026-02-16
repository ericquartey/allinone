/**
 * Location Validators
 *
 * Regole di validazione per operazioni CRUD su Ubicazioni
 */

import { body } from 'express-validator';

const LOCATION_TYPES = ['RACK', 'FLOOR', 'BUFFER', 'PICKING'];

/**
 * Validazione per creazione nuova ubicazione
 */
export const createLocationValidator = [
  body('code')
    .trim()
    .notEmpty().withMessage('Codice ubicazione obbligatorio')
    .isLength({ min: 1, max: 50 }).withMessage('Codice max 50 caratteri'),

  body('type')
    .notEmpty().withMessage('Tipo ubicazione obbligatorio')
    .isIn(LOCATION_TYPES).withMessage(`Tipo deve essere uno tra: ${LOCATION_TYPES.join(', ')}`),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Descrizione max 255 caratteri'),

  body('aisle')
    .optional()
    .trim()
    .isLength({ max: 10 }).withMessage('Corridoio max 10 caratteri'),

  body('bay')
    .optional()
    .trim()
    .isLength({ max: 10 }).withMessage('Campata max 10 caratteri'),

  body('level')
    .optional()
    .trim()
    .isLength({ max: 10 }).withMessage('Livello max 10 caratteri'),

  body('position')
    .optional()
    .trim()
    .isLength({ max: 10 }).withMessage('Posizione max 10 caratteri'),

  body('capacity')
    .optional()
    .isFloat({ min: 0 }).withMessage('Capacità deve essere >= 0'),

  body('warehouseId')
    .optional()
    .isInt({ min: 1 }).withMessage('ID magazzino non valido')
];

/**
 * Validazione per aggiornamento ubicazione
 */
export const updateLocationValidator = [
  body('code')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('Codice max 50 caratteri'),

  body('type')
    .optional()
    .isIn(LOCATION_TYPES).withMessage(`Tipo deve essere uno tra: ${LOCATION_TYPES.join(', ')}`),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Descrizione max 255 caratteri'),

  body('aisle')
    .optional()
    .trim()
    .isLength({ max: 10 }).withMessage('Corridoio max 10 caratteri'),

  body('bay')
    .optional()
    .trim()
    .isLength({ max: 10 }).withMessage('Campata max 10 caratteri'),

  body('level')
    .optional()
    .trim()
    .isLength({ max: 10 }).withMessage('Livello max 10 caratteri'),

  body('position')
    .optional()
    .trim()
    .isLength({ max: 10 }).withMessage('Posizione max 10 caratteri'),

  body('capacity')
    .optional()
    .isFloat({ min: 0 }).withMessage('Capacità deve essere >= 0'),

  body('isBlocked')
    .optional()
    .isBoolean().withMessage('isBlocked deve essere boolean')
];
