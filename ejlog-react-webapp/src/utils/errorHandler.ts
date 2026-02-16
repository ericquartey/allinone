// ==============================================================================
// EJLOG WMS - Error Handler Utility
// Centralized error handling with retry logic and user-friendly messages
// ============================================================================

/**
 * Error types for classification
 */
export const ERROR_TYPES = {
  NETWORK: 'network',
  AUTH: 'auth',
  VALIDATION: 'validation',
  SERVER: 'server',
  NOT_FOUND: 'not_found',
  TIMEOUT: 'timeout',
  UNKNOWN: 'unknown',
};

/**
 * User-friendly error messages (Italian)
 */
const ERROR_MESSAGES = {
  [ERROR_TYPES.NETWORK]: 'Impossibile connettersi al server. Verifica la connessione Internet.',
  [ERROR_TYPES.AUTH]: 'Sessione scaduta. Effettua nuovamente l\'accesso.',
  [ERROR_TYPES.VALIDATION]: 'I dati inseriti non sono valid. Controlla e riprova.',
  [ERROR_TYPES.SERVER]: 'Errore del server. Riprova tra qualche istante.',
  [ERROR_TYPES.NOT_FOUND]: 'Risorsa non trovata.',
  [ERROR_TYPES.TIMEOUT]: 'La richiesta ha impiegato troppo tempo. Riprova.',
  [ERROR_TYPES.UNKNOWN]: 'Si è verificato un errore imprevisto.',
};

/**
 * Classify error based on status code and error object
 */
export const classifyError = (error) => {
  // Network errors (no response from server)
  if (!error.response) {
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return ERROR_TYPES.TIMEOUT;
    }
    return ERROR_TYPES.NETWORK;
  }

  // HTTP status code based classification
  const status = error.response?.status;

  switch (status) {
    case 401:
    case 403:
      return ERROR_TYPES.AUTH;
    case 400:
    case 422:
      return ERROR_TYPES.VALIDATION;
    case 404:
      return ERROR_TYPES.NOT_FOUND;
    case 500:
    case 502:
    case 503:
    case 504:
      return ERROR_TYPES.SERVER;
    default:
      return ERROR_TYPES.UNKNOWN;
  }
};

/**
 * Get user-friendly error message
 */
export const getErrorMessage = (error) => {
  // Check if error has custom message from backend
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  // Classify and return appropriate message
  const errorType = classifyError(error);
  return ERROR_MESSAGES[errorType];
};

/**
 * Check if error is retryable
 */
export const isRetryableError = (error) => {
  const errorType = classifyError(error);

  // Retry network, timeout, and some server errors
  return [
    ERROR_TYPES.NETWORK,
    ERROR_TYPES.TIMEOUT,
    ERROR_TYPES.SERVER,
  ].includes(errorType);
};

/**
 * Delay function for retry logic
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Exponential backoff calculation
 * @param {number} attempt - Current attempt number (0-based)
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {number} Delay in milliseconds
 */
const calculateBackoff = (attempt, baseDelay = 1000) => {
  // Exponential backoff: 1s, 2s, 4s, 8s, etc.
  return Math.min(baseDelay * Math.pow(2, attempt), 10000); // Max 10 seconds
};

/**
 * Retry function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retries (default: 3)
 * @param {number} options.baseDelay - Base delay in ms (default: 1000)
 * @param {Function} options.shouldRetry - Custom retry condition
 * @param {Function} options.onRetry - Callback on retry attempt
 * @returns {Promise} Result of successful execution
 */
export const retryWithBackoff = async (fn, options = {}) => {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    shouldRetry = isRetryableError,
    onRetry = null,
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Try to execute the function
      const result = await fn();
      return result;
    } catch (error) {
      lastError = error;

      // Check if we should retry
      const canRetry = attempt < maxRetries && shouldRetry(error);

      if (!canRetry) {
        throw error; // Don't retry, throw the error
      }

      // Calculate backoff delay
      const delayMs = calculateBackoff(attempt, baseDelay);

      // Log retry attempt
      console.warn(
        `API call failed (attempt ${attempt + 1}/${maxRetries + 1}). ` +
        `Retrying in ${delayMs}ms...`,
        error.message
      );

      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(attempt + 1, maxRetries, delayMs, error);
      }

      // Wait before retrying
      await delay(delayMs);
    }
  }

  // All retries exhausted, throw last error
  throw lastError;
};

/**
 * Handle API error and return formatted response
 * @param {Error} error - Error object
 * @param {Object} options - Error handling options
 * @param {boolean} options.showToast - Show toast notification (default: true)
 * @param {Function} options.toast - Toast function (if available)
 * @param {boolean} options.logToService - Log to external service (default: false)
 * @returns {Object} Formatted error response
 */
export const handleApiError = (error, options = {}) => {
  const {
    showToast = false, // Don't show toast by default, let caller decide
    toast = null,
    logToService = false,
  } = options;

  const errorType = classifyError(error);
  const errorMessage = getErrorMessage(error);

  // Create error response object
  const errorResponse = {
    type: errorType,
    message: errorMessage,
    originalError: error,
    status: error.response?.status,
    data: error.response?.data,
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('[API Error]', errorResponse);
  }

  // Show toast notification if requested
  if (showToast && toast) {
    toast.error(errorMessage);
  }

  // Log to external error tracking service
  if (logToService) {
    logErrorToService(error);
  }

  return errorResponse;
};

/**
 * Log error to external tracking service
 * (Placeholder - integrate with Sentry, LogRocket, etc.)
 */
const logErrorToService = (error) => {
  // TODO: Integrate with error tracking service
  const errorData = {
    message: error.message,
    stack: error.stack,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    response: error.response?.data,
    status: error.response?.status,
  };

  console.log('[Error Tracking Service]', errorData);

  // Example: Send to backend or third-party service
  // fetch('/api/log-error', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(errorData),
  // }).catch(console.error);
};

/**
 * Create error handler for API hooks
 * Returns an object with error state and handler function
 */
export const useApiErrorHandler = (toast) => {
  return {
    handleError: (error) => handleApiError(error, { showToast: true, toast }),
  };
};

export default {
  classifyError,
  getErrorMessage,
  isRetryableError,
  retryWithBackoff,
  handleApiError,
  useApiErrorHandler,
  ERROR_TYPES,
};
