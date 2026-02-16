/**
 * Validation Middleware
 *
 * Utilizza express-validator per validare request body, params, query
 */

import { validationResult } from 'express-validator';
import { ValidationError } from './error-handler.js';

/**
 * Middleware per processare i risultati della validazione
 * Usa insieme alle regole di validazione definite nei validators
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value
    }));

    throw new ValidationError('Errore di validazione', formattedErrors);
  }

  next();
};

/**
 * Helper per validare ID numerici nei parametri
 */
export const validateId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = parseInt(req.params[paramName]);

    if (isNaN(id) || id <= 0) {
      throw new ValidationError(`${paramName} deve essere un numero positivo valido`);
    }

    req.params[paramName] = id;
    next();
  };
};

/**
 * Helper per validare pagination params
 */
export const validatePagination = (req, res, next) => {
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;

  if (limit < 1 || limit > 1000) {
    throw new ValidationError('limit deve essere tra 1 e 1000');
  }

  if (offset < 0) {
    throw new ValidationError('offset deve essere >= 0');
  }

  req.pagination = { limit, offset };
  next();
};
