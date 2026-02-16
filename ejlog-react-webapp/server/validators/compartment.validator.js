/**
 * Compartment Validators
 *
 * Regole di validazione per operazioni CRUD su Scomparti
 */

import { body } from 'express-validator';

/**
 * Validazione per creazione nuovo scomparto
 */
export const createCompartmentValidator = [
  body('compartmentNumber')
    .notEmpty().withMessage('Numero scomparto obbligatorio')
    .isInt({ min: 1, max: 100 }).withMessage('Numero scomparto deve essere 1-100'),

  body('position')
    .notEmpty().withMessage('Posizione obbligatoria')
    .isInt({ min: 0 }).withMessage('Posizione deve essere >= 0'),

  body('width')
    .optional()
    .isFloat({ min: 0.1 }).withMessage('Larghezza deve essere > 0'),

  body('depth')
    .optional()
    .isFloat({ min: 0.1 }).withMessage('Profondità deve essere > 0'),

  body('height')
    .optional()
    .isFloat({ min: 0.1 }).withMessage('Altezza deve essere > 0'),

  body('fillPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('Percentuale riempimento 0-100'),

  body('isBlocked')
    .optional()
    .isBoolean().withMessage('isBlocked deve essere boolean')
];

/**
 * Validazione per aggiornamento scomparto
 */
export const updateCompartmentValidator = [
  body('compartmentNumber')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Numero scomparto deve essere 1-100'),

  body('position')
    .optional()
    .isInt({ min: 0 }).withMessage('Posizione deve essere >= 0'),

  body('width')
    .optional()
    .isFloat({ min: 0.1 }).withMessage('Larghezza deve essere > 0'),

  body('depth')
    .optional()
    .isFloat({ min: 0.1 }).withMessage('Profondità deve essere > 0'),

  body('height')
    .optional()
    .isFloat({ min: 0.1 }).withMessage('Altezza deve essere > 0'),

  body('fillPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('Percentuale riempimento 0-100'),

  body('isBlocked')
    .optional()
    .isBoolean().withMessage('isBlocked deve essere boolean')
];
