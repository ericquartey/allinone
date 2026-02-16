import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ERROR_TYPES,
  classifyError,
  getErrorMessage,
  isRetryableError,
  retryWithBackoff,
  handleApiError,
  useApiErrorHandler,
} from './errorHandler';

describe('errorHandler utility', () => {
  // ==============================================================================
  // classifyError Tests
  // ==============================================================================
  describe('classifyError', () => {
    it('should classify network errors when no response', () => {
      const error = { message: 'Network Error' };
      expect(classifyError(error)).toBe(ERROR_TYPES.NETWORK);
    });

    it('should classify timeout errors', () => {
      const error = { code: 'ECONNABORTED', message: 'timeout of 5000ms exceeded' };
      expect(classifyError(error)).toBe(ERROR_TYPES.TIMEOUT);
    });

    it('should classify timeout errors by message', () => {
      const error = { message: 'timeout exceeded' };
      expect(classifyError(error)).toBe(ERROR_TYPES.TIMEOUT);
    });

    it('should classify 401 as AUTH error', () => {
      const error = { response: { status: 401 } };
      expect(classifyError(error)).toBe(ERROR_TYPES.AUTH);
    });

    it('should classify 403 as AUTH error', () => {
      const error = { response: { status: 403 } };
      expect(classifyError(error)).toBe(ERROR_TYPES.AUTH);
    });

    it('should classify 400 as VALIDATION error', () => {
      const error = { response: { status: 400 } };
      expect(classifyError(error)).toBe(ERROR_TYPES.VALIDATION);
    });

    it('should classify 422 as VALIDATION error', () => {
      const error = { response: { status: 422 } };
      expect(classifyError(error)).toBe(ERROR_TYPES.VALIDATION);
    });

    it('should classify 404 as NOT_FOUND error', () => {
      const error = { response: { status: 404 } };
      expect(classifyError(error)).toBe(ERROR_TYPES.NOT_FOUND);
    });

    it('should classify 500 as SERVER error', () => {
      const error = { response: { status: 500 } };
      expect(classifyError(error)).toBe(ERROR_TYPES.SERVER);
    });

    it('should classify 502 as SERVER error', () => {
      const error = { response: { status: 502 } };
      expect(classifyError(error)).toBe(ERROR_TYPES.SERVER);
    });

    it('should classify 503 as SERVER error', () => {
      const error = { response: { status: 503 } };
      expect(classifyError(error)).toBe(ERROR_TYPES.SERVER);
    });

    it('should classify 504 as SERVER error', () => {
      const error = { response: { status: 504 } };
      expect(classifyError(error)).toBe(ERROR_TYPES.SERVER);
    });

    it('should classify unknown status codes as UNKNOWN', () => {
      const error = { response: { status: 418 } }; // I'm a teapot
      expect(classifyError(error)).toBe(ERROR_TYPES.UNKNOWN);
    });
  });

  // ==============================================================================
  // getErrorMessage Tests
  // ==============================================================================
  describe('getErrorMessage', () => {
    it('should return backend custom message if present', () => {
      const customMessage = 'Custom error from backend';
      const error = {
        response: {
          status: 400,
          data: { message: customMessage },
        },
      };
      expect(getErrorMessage(error)).toBe(customMessage);
    });

    it('should return default NETWORK message for network errors', () => {
      const error = { message: 'Network Error' };
      const message = getErrorMessage(error);
      expect(message).toContain('connettersi al server');
    });

    it('should return default AUTH message for 401', () => {
      const error = { response: { status: 401 } };
      const message = getErrorMessage(error);
      expect(message).toContain('Sessione scaduta');
    });

    it('should return default VALIDATION message for 400', () => {
      const error = { response: { status: 400 } };
      const message = getErrorMessage(error);
      expect(message).toContain('dati inseriti');
    });

    it('should return default NOT_FOUND message for 404', () => {
      const error = { response: { status: 404 } };
      const message = getErrorMessage(error);
      expect(message).toContain('non trovata');
    });

    it('should return default SERVER message for 500', () => {
      const error = { response: { status: 500 } };
      const message = getErrorMessage(error);
      expect(message).toContain('Errore del server');
    });

    it('should return default TIMEOUT message for timeout', () => {
      const error = { code: 'ECONNABORTED' };
      const message = getErrorMessage(error);
      expect(message).toContain('troppo tempo');
    });

    it('should return default UNKNOWN message for unknown errors', () => {
      const error = { response: { status: 418 } };
      const message = getErrorMessage(error);
      expect(message).toContain('imprevisto');
    });
  });

  // ==============================================================================
  // isRetryableError Tests
  // ==============================================================================
  describe('isRetryableError', () => {
    it('should return true for network errors', () => {
      const error = { message: 'Network Error' };
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for timeout errors', () => {
      const error = { code: 'ECONNABORTED' };
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for server errors (500)', () => {
      const error = { response: { status: 500 } };
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for server errors (502)', () => {
      const error = { response: { status: 502 } };
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for server errors (503)', () => {
      const error = { response: { status: 503 } };
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return false for auth errors', () => {
      const error = { response: { status: 401 } };
      expect(isRetryableError(error)).toBe(false);
    });

    it('should return false for validation errors', () => {
      const error = { response: { status: 400 } };
      expect(isRetryableError(error)).toBe(false);
    });

    it('should return false for not found errors', () => {
      const error = { response: { status: 404 } };
      expect(isRetryableError(error)).toBe(false);
    });

    it('should return false for unknown errors', () => {
      const error = { response: { status: 418 } };
      expect(isRetryableError(error)).toBe(false);
    });
  });

  // ==============================================================================
  // retryWithBackoff Tests
  // ==============================================================================
  describe('retryWithBackoff', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
      vi.useRealTimers();
    });

    it('should succeed on first attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const result = await retryWithBackoff(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const networkError = { message: 'Network Error' };
      const fn = vi
        .fn()
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce('success');

      const promise = retryWithBackoff(fn, { maxRetries: 2, baseDelay: 100 });

      // Fast-forward through retries
      await vi.advanceTimersByTimeAsync(100); // First retry delay
      await vi.advanceTimersByTimeAsync(200); // Second retry delay (exponential)

      const result = await promise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retryable errors', async () => {
      const authError = { response: { status: 401 } };
      const fn = vi.fn().mockRejectedValue(authError);

      await expect(retryWithBackoff(fn)).rejects.toEqual(authError);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should throw after max retries exhausted', async () => {
      const networkError = { message: 'Network Error' };
      const fn = vi.fn().mockRejectedValue(networkError);

      const promise = retryWithBackoff(fn, { maxRetries: 2, baseDelay: 100 });

      // Fast-forward through all retries
      await vi.advanceTimersByTimeAsync(100); // First retry
      await vi.advanceTimersByTimeAsync(200); // Second retry
      await vi.advanceTimersByTimeAsync(400); // Third attempt

      await expect(promise).rejects.toEqual(networkError);
      expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should call onRetry callback', async () => {
      const networkError = { message: 'Network Error' };
      const fn = vi.fn().mockRejectedValueOnce(networkError).mockResolvedValueOnce('success');
      const onRetry = vi.fn();

      const promise = retryWithBackoff(fn, {
        maxRetries: 1,
        baseDelay: 100,
        onRetry
      });

      await vi.advanceTimersByTimeAsync(100);
      await promise;

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(1, 1, 100, networkError);
    });

    it('should use custom shouldRetry function', async () => {
      const customError = { custom: true };
      const fn = vi.fn().mockRejectedValueOnce(customError).mockResolvedValueOnce('success');
      const shouldRetry = vi.fn().mockReturnValue(true);

      const promise = retryWithBackoff(fn, {
        maxRetries: 1,
        baseDelay: 100,
        shouldRetry,
      });

      await vi.advanceTimersByTimeAsync(100);
      await promise;

      expect(shouldRetry).toHaveBeenCalledWith(customError);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should use exponential backoff delays', async () => {
      const networkError = { message: 'Network Error' };
      const fn = vi.fn().mockRejectedValue(networkError);
      const onRetry = vi.fn();

      const promise = retryWithBackoff(fn, {
        maxRetries: 3,
        baseDelay: 1000,
        onRetry,
      });

      // Check exponential backoff: 1s, 2s, 4s
      await vi.advanceTimersByTimeAsync(1000);
      expect(onRetry).toHaveBeenNthCalledWith(1, 1, 3, 1000, networkError);

      await vi.advanceTimersByTimeAsync(2000);
      expect(onRetry).toHaveBeenNthCalledWith(2, 2, 3, 2000, networkError);

      await vi.advanceTimersByTimeAsync(4000);
      expect(onRetry).toHaveBeenNthCalledWith(3, 3, 3, 4000, networkError);

      await expect(promise).rejects.toEqual(networkError);
    });

    it('should cap backoff delay at 10 seconds', async () => {
      const networkError = { message: 'Network Error' };
      const fn = vi.fn().mockRejectedValue(networkError);
      const onRetry = vi.fn();

      const promise = retryWithBackoff(fn, {
        maxRetries: 10,
        baseDelay: 10000, // Would exceed 10s cap
        onRetry,
      });

      await vi.advanceTimersByTimeAsync(10000);
      expect(onRetry).toHaveBeenCalledWith(1, 10, 10000, networkError); // Capped at 10s

      await vi.runAllTimersAsync();
      await expect(promise).rejects.toEqual(networkError);
    });
  });

  // ==============================================================================
  // handleApiError Tests
  // ==============================================================================
  describe('handleApiError', () => {
    let consoleErrorSpy;

    beforeEach(() => {
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it('should return formatted error response', () => {
      const error = {
        response: {
          status: 400,
          data: { message: 'Validation failed' },
        },
      };

      const result = handleApiError(error);

      expect(result).toEqual({
        type: ERROR_TYPES.VALIDATION,
        message: 'Validation failed',
        originalError: error,
        status: 400,
        data: { message: 'Validation failed' },
      });
    });

    it('should show toast when requested', () => {
      const error = { response: { status: 500 } };
      const toast = { error: vi.fn() };

      handleApiError(error, { showToast: true, toast });

      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Errore del server'));
    });

    it('should not show toast by default', () => {
      const error = { response: { status: 500 } };
      const toast = { error: vi.fn() };

      handleApiError(error, { toast });

      expect(toast.error).not.toHaveBeenCalled();
    });

    it('should log to console in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = { response: { status: 500 } };
      handleApiError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[API Error]',
        expect.objectContaining({ type: ERROR_TYPES.SERVER })
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle network errors without response', () => {
      const error = { message: 'Network Error' };

      const result = handleApiError(error);

      expect(result.type).toBe(ERROR_TYPES.NETWORK);
      expect(result.status).toBeUndefined();
      expect(result.data).toBeUndefined();
    });
  });

  // ==============================================================================
  // useApiErrorHandler Tests
  // ==============================================================================
  describe('useApiErrorHandler', () => {
    it('should return object with handleError function', () => {
      const toast = { error: vi.fn() };
      const handler = useApiErrorHandler(toast);

      expect(handler).toHaveProperty('handleError');
      expect(typeof handler.handleError).toBe('function');
    });

    it('should call handleApiError with showToast true', () => {
      const toast = { error: vi.fn() };
      const handler = useApiErrorHandler(toast);

      const error = { response: { status: 500 } };
      handler.handleError(error);

      expect(toast.error).toHaveBeenCalled();
    });
  });

  // ==============================================================================
  // ERROR_TYPES constant Tests
  // ==============================================================================
  describe('ERROR_TYPES', () => {
    it('should export all error types', () => {
      expect(ERROR_TYPES).toEqual({
        NETWORK: 'network',
        AUTH: 'auth',
        VALIDATION: 'validation',
        SERVER: 'server',
        NOT_FOUND: 'not_found',
        TIMEOUT: 'timeout',
        UNKNOWN: 'unknown',
      });
    });
  });

  // ==============================================================================
  // Integration Tests
  // ==============================================================================
  describe('Integration tests', () => {
    it('should handle complete error flow', () => {
      const error = {
        response: {
          status: 401,
          data: { message: 'Token expired' },
        },
      };

      const errorType = classifyError(error);
      const errorMessage = getErrorMessage(error);
      const canRetry = isRetryableError(error);

      expect(errorType).toBe(ERROR_TYPES.AUTH);
      expect(errorMessage).toBe('Token expired');
      expect(canRetry).toBe(false);
    });

    it('should handle error flow with retry', () => {
      const error = {
        response: {
          status: 503,
        },
      };

      const errorType = classifyError(error);
      const errorMessage = getErrorMessage(error);
      const canRetry = isRetryableError(error);

      expect(errorType).toBe(ERROR_TYPES.SERVER);
      expect(errorMessage).toContain('Errore del server');
      expect(canRetry).toBe(true);
    });
  });
});
