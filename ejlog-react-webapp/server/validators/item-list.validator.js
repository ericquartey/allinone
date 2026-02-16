/**
 * Item List Validators
 *
 * Regole di validazione per operazioni CRUD su Liste
 */

import { body } from 'express-validator';

const LIST_TYPES = ['PICKING', 'SHIPPING', 'RECEIVING', 'INVENTORY'];
const LIST_STATUSES = ['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED'];

/**
 * Validazione per creazione nuova lista
 */
export const createItemListValidator = [
  body('code')
    .trim()
    .notEmpty().withMessage('Codice lista obbligatorio')
    .isLength({ min: 1, max: 50 }).withMessage('Codice max 50 caratteri'),

  body('type')
    .notEmpty().withMessage('Tipo lista obbligatorio')
    .isIn(LIST_TYPES).withMessage(`Tipo deve essere uno tra: ${LIST_TYPES.join(', ')}`),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Descrizione max 255 caratteri')
];

/**
 * Validazione per aggiornamento lista
 */
export const updateItemListValidator = [
  body('code')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('Codice max 50 caratteri'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Descrizione max 255 caratteri'),

  body('status')
    .optional()
    .isIn(LIST_STATUSES).withMessage(`Status deve essere uno tra: ${LIST_STATUSES.join(', ')}`)
];

/**
 * Validazione per aggiungere item a lista
 */
export const addItemToListValidator = [
  body('itemId')
    .notEmpty().withMessage('ID articolo obbligatorio')
    .isInt({ min: 1 }).withMessage('ID articolo non valido'),

  body('quantity')
    .notEmpty().withMessage('Quantità obbligatoria')
    .isFloat({ min: 0.01 }).withMessage('Quantità deve essere > 0'),

  body('locationId')
    .optional()
    .isInt({ min: 1 }).withMessage('ID ubicazione non valido')
];
