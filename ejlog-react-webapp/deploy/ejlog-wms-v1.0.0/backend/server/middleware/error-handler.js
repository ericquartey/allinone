/**
 * Centralized Error Handling Middleware
 *
 * Gestisce tutti gli errori dell'applicazione in modo centralizzato
 * fornendo risposte consistenti al client.
 */

/**
 * Custom Application Error
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error types comuni
 */
export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} non trovato`, 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message, details = null) {
    super(message, 409, details);
    this.name = 'ConflictError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Non autorizzato') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Accesso negato') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

export class DatabaseError extends AppError {
  constructor(message, originalError = null) {
    super(message, 500, originalError?.message);
    this.name = 'DatabaseError';
    this.originalError = originalError;
  }
}

/**
 * Async handler wrapper
 * Elimina la necessità di try-catch in ogni route handler
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Error handler middleware
 * Deve essere l'ultimo middleware dell'app
 */
export const errorHandler = (err, req, res, next) => {
  // Log dell'errore (in produzione usare un logger strutturato)
  console.error('Error Handler:', {
    name: err.name,
    message: err.message,
    statusCode: err.statusCode,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });

  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Errore interno del server';
  let details = err.details || null;

  // Handle specific error types
  if (err.name === 'ValidationError' && err.errors) {
    // Mongoose validation errors or similar
    statusCode = 400;
    message = 'Errore di validazione';
    details = Object.values(err.errors).map(e => e.message);
  }

  if (err.code === 'EREQUEST' || err.code?.startsWith('E')) {
    // SQL Server errors
    statusCode = 500;
    message = 'Errore database';
    details = process.env.NODE_ENV === 'development' ? err.message : null;
  }

  // Response format consistente
  const response = {
    success: false,
    error: message,
    ...(details && { details }),
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      name: err.name
    })
  };

  res.status(statusCode).json(response);
};

/**
 * 404 Not Found handler
 * Gestisce le route non trovate
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint non trovato',
    path: req.path,
    method: req.method
  });
};

/**
 * Request logger middleware
 */
export const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Log quando la risposta è completata
  res.on('finish', () => {
    const duration = Date.now() - start;
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });

  next();
};
