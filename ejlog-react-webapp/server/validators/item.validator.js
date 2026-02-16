/**
 * Item Validators
 *
 * Regole di validazione per operazioni CRUD su Articoli
 */

import { body } from 'express-validator';

/**
 * Validazione per creazione nuovo articolo
 */
export const createItemValidator = [
  body('code')
    .trim()
    .notEmpty().withMessage('Codice articolo obbligatorio')
    .isLength({ min: 1, max: 50 }).withMessage('Codice max 50 caratteri'),

  body('description')
    .trim()
    .notEmpty().withMessage('Descrizione obbligatoria')
    .isLength({ min: 1, max: 255 }).withMessage('Descrizione max 255 caratteri'),

  body('barcode')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Barcode max 50 caratteri'),

  body('categoryId')
    .optional()
    .isInt({ min: 1 }).withMessage('ID categoria non valido'),

  body('unitOfMeasure')
    .optional()
    .trim()
    .isLength({ max: 10 }).withMessage('Unità misura max 10 caratteri'),

  body('weight')
    .optional()
    .isFloat({ min: 0 }).withMessage('Peso deve essere >= 0'),

  body('volume')
    .optional()
    .isFloat({ min: 0 }).withMessage('Volume deve essere >= 0'),

  body('price')
    .optional()
    .isFloat({ min: 0 }).withMessage('Prezzo deve essere >= 0')
];

/**
 * Validazione per aggiornamento articolo
 */
export const updateItemValidator = [
  body('code')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('Codice max 50 caratteri'),

  body('description')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 }).withMessage('Descrizione max 255 caratteri'),

  body('barcode')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Barcode max 50 caratteri'),

  body('categoryId')
    .optional()
    .isInt({ min: 1 }).withMessage('ID categoria non valido'),

  body('unitOfMeasure')
    .optional()
    .trim()
    .isLength({ max: 10 }).withMessage('Unità misura max 10 caratteri'),

  body('weight')
    .optional()
    .isFloat({ min: 0 }).withMessage('Peso deve essere >= 0'),

  body('volume')
    .optional()
    .isFloat({ min: 0 }).withMessage('Volume deve essere >= 0'),

  body('price')
    .optional()
    .isFloat({ min: 0 }).withMessage('Prezzo deve essere >= 0'),

  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive deve essere boolean')
];
