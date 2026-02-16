/**
 * Loading Unit Validators
 *
 * Regole di validazione per operazioni CRUD su UDC (Loading Units)
 */

import { body } from 'express-validator';

/**
 * Validazione per creazione nuovo UDC
 */
export const createLoadingUnitValidator = [
  body('barcode')
    .trim()
    .notEmpty().withMessage('Barcode obbligatorio')
    .isLength({ min: 1, max: 50 }).withMessage('Barcode max 50 caratteri'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Descrizione max 255 caratteri'),

  body('code')
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage('Code max 20 caratteri'),

  body('width')
    .notEmpty().withMessage('Larghezza obbligatoria')
    .isFloat({ min: 0.1 }).withMessage('Larghezza deve essere > 0'),

  body('depth')
    .notEmpty().withMessage('Profondità obbligatoria')
    .isFloat({ min: 0.1 }).withMessage('Profondità deve essere > 0'),

  body('height')
    .notEmpty().withMessage('Altezza obbligatoria')
    .isFloat({ min: 0.1 }).withMessage('Altezza deve essere > 0'),

  body('compartmentCount')
    .optional()
    .isInt({ min: 0, max: 100 }).withMessage('Numero scomparti deve essere 0-100'),

  body('locationId')
    .optional()
    .isInt({ min: 1 }).withMessage('ID ubicazione non valido'),

  body('warehouseId')
    .optional()
    .isInt({ min: 1 }).withMessage('ID magazzino non valido')
];

/**
 * Validazione per aggiornamento UDC
 */
export const updateLoadingUnitValidator = [
  body('barcode')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('Barcode max 50 caratteri'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Descrizione max 255 caratteri'),

  body('code')
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage('Code max 20 caratteri'),

  body('width')
    .optional()
    .isFloat({ min: 0.1 }).withMessage('Larghezza deve essere > 0'),

  body('depth')
    .optional()
    .isFloat({ min: 0.1 }).withMessage('Profondità deve essere > 0'),

  body('height')
    .optional()
    .isFloat({ min: 0.1 }).withMessage('Altezza deve essere > 0'),

  body('isBlockedFromEjlog')
    .optional()
    .isBoolean().withMessage('isBlockedFromEjlog deve essere boolean'),

  body('locationId')
    .optional()
    .isInt({ min: 1 }).withMessage('ID ubicazione non valido'),

  body('warehouseId')
    .optional()
    .isInt({ min: 1 }).withMessage('ID magazzino non valido')
];
