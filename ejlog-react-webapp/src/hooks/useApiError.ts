// ============================================================================
// EJLOG WMS - useApiError Hook
// Hook React per gestione centralizzata errori API
// ============================================================================

import { useCallback, useEffect, useState } from 'react';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { SerializedError } from '@reduxjs/toolkit';
import {
  normalizeError,
  getErrorMessage,
  shouldLogout,
  isRetryableError,
  logApiError,
  type NormalizedError,
  type ErrorType,
} from '../utils/apiIntegration';
import { useNavigate } from 'react-router-dom';

/**
 * Opzioni per useApiError hook
 */
export interface UseApiErrorOptions {
  /** Endpoint name per logging */
  endpoint?: string;
  /** Callback personalizzata su errore */
  onError?: (error: NormalizedError) => void;
  /** Auto-logout su errori di autenticazione */
  autoLogout?: boolean;
  /** Auto-log degli errori in console */
  autoLog?: boolean;
  /** Mostra toast notification su errore */
  showNotification?: boolean;
  /** Context addizionale per logging */
  context?: Record<string, unknown>;
}

/**
 * Risultato del hook useApiError
 */
export interface UseApiErrorResult {
  /** Errore normalizzato corrente */
  error: NormalizedError | null;
  /** Messaggio user-friendly */
  message: string;
  /** Tipo di errore */
  type: ErrorType | null;
  /** Se l'errore è retryable */
  isRetryable: boolean;
  /** Se richiede logout */
  requiresLogout: boolean;
  /** Resetta lo stato errore */
  clearError: () => void;
  /** Gestisce manualmente un errore */
  handleError: (error: FetchBaseQueryError | SerializedError | undefined) => void;
}

/**
 * Hook per gestione centralizzata errori API con logging e notifications
 *
 * @example
 * ```tsx
 * const { data, error: apiError, isLoading } = useGetListsQuery();
 * const { error, message, clearError } = useApiError(apiError, {
 *   endpoint: 'getLists',
 *   showNotification: true,
 * });
 *
 * if (error) {
 *   return <ErrorMessage message={message} onDismiss={clearError} />;
 * }
 * ```
 */
export function useApiError(
  apiError: FetchBaseQueryError | SerializedError | undefined,
  options: UseApiErrorOptions = {}
): UseApiErrorResult {
  const {
    endpoint = 'unknown',
    onError,
    autoLogout = true,
    autoLog = true,
    showNotification = false,
    context,
  } = options;

  const navigate = useNavigate();
  const [error, setError] = useState<NormalizedError | null>(null);

  // Callback per gestire errori
  const handleError = useCallback(
    (err: FetchBaseQueryError | SerializedError | undefined) => {
      if (!err) {
        setError(null);
        return;
      }

      const normalized = normalizeError(err);
      setError(normalized);

      // Auto-log
      if (autoLog) {
        logApiError(endpoint, err, context);
      }

      // Callback personalizzata
      if (onError) {
        onError(normalized);
      }

      // Auto-logout se richiesto
      // IMPORTANT: Non redirect se siamo su rotte pubbliche
      const currentPath = window.location.pathname;
      const isEmbeddedPpcDrawer =
        currentPath.startsWith('/ppc/operator/drawer-preview') &&
        window.location.search.includes('embedded=ppc');
      const isPublicRoute =
        isEmbeddedPpcDrawer ||
        currentPath === '/dashboard-advanced' ||
        currentPath.startsWith('/login');

      if (autoLogout && shouldLogout(err) && !isPublicRoute) {
        console.warn('[useApiError] Authentication error detected. Logging out...');
        // TODO: Dispatch logout action
        // dispatch(logout());
        navigate('/login');
      } else if (isPublicRoute) {
        console.log('[useApiError] Skipping auto-logout on public route:', currentPath);
      }

      // Notifica toast (se richiesta)
      if (showNotification) {
        // TODO: Integrazione con sistema di notifiche
        console.warn('[useApiError] Notification:', normalized.message);
      }
    },
    [endpoint, onError, autoLogout, autoLog, showNotification, context, navigate]
  );

  // Clear error callback
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Effect per processare l'errore quando cambia
  useEffect(() => {
    handleError(apiError);
  }, [apiError, handleError]);

  return {
    error,
    message: error?.message || '',
    type: error?.type || null,
    isRetryable: error ? isRetryableError(apiError) : false,
    requiresLogout: error ? shouldLogout(apiError) : false,
    clearError,
    handleError,
  };
}

/**
 * Hook semplificato che restituisce solo il messaggio
 */
export function useApiErrorMessage(
  apiError: FetchBaseQueryError | SerializedError | undefined,
  endpoint?: string
): string {
  const { message } = useApiError(apiError, { endpoint, autoLog: true });
  return message;
}

/**
 * Hook per tracciare lo stato di retry delle API calls
 */
export interface UseApiRetryResult {
  /** Numero tentativi correnti */
  attempts: number;
  /** Esegui retry manualmente */
  retry: () => void;
  /** Reset dei tentativi */
  reset: () => void;
  /** Se ha raggiunto il massimo tentativi */
  maxReached: boolean;
}

export function useApiRetry(
  refetch: () => void,
  maxAttempts: number = 3
): UseApiRetryResult {
  const [attempts, setAttempts] = useState(0);

  const retry = useCallback(() => {
    if (attempts < maxAttempts) {
      setAttempts((prev) => prev + 1);
      refetch();
    }
  }, [attempts, maxAttempts, refetch]);

  const reset = useCallback(() => {
    setAttempts(0);
  }, []);

  return {
    attempts,
    retry,
    reset,
    maxReached: attempts >= maxAttempts,
  };
}

/**
 * Hook per debounce di chiamate API
 */
export function useApiDebounce<T>(value: T, delayMs: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delayMs]);

  return debouncedValue;
}

/**
 * Hook per polling automatico con controllo
 */
export interface UseApiPollingOptions {
  /** Intervallo polling in ms */
  intervalMs: number;
  /** Se il polling è attivo */
  enabled?: boolean;
  /** Callback su ogni poll */
  onPoll?: () => void;
}

export function useApiPolling(
  refetch: () => void,
  options: UseApiPollingOptions
): { isPolling: boolean; start: () => void; stop: () => void } {
  const { intervalMs, enabled = true, onPoll } = options;
  const [isPolling, setIsPolling] = useState(enabled);

  useEffect(() => {
    if (!isPolling) return;

    const interval = setInterval(() => {
      refetch();
      onPoll?.();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isPolling, intervalMs, refetch, onPoll]);

  const start = useCallback(() => setIsPolling(true), []);
  const stop = useCallback(() => setIsPolling(false), []);

  return { isPolling, start, stop };
}

/**
 * Hook per gestire ottimistic updates con rollback su errore
 */
export function useOptimisticUpdate<T>(
  initialValue: T
): {
  value: T;
  optimisticUpdate: (newValue: T) => void;
  confirmUpdate: (confirmedValue: T) => void;
  rollback: () => void;
} {
  const [value, setValue] = useState<T>(initialValue);
  const [previousValue, setPreviousValue] = useState<T>(initialValue);

  const optimisticUpdate = useCallback((newValue: T) => {
    setPreviousValue(value);
    setValue(newValue);
  }, [value]);

  const confirmUpdate = useCallback((confirmedValue: T) => {
    setValue(confirmedValue);
    setPreviousValue(confirmedValue);
  }, []);

  const rollback = useCallback(() => {
    setValue(previousValue);
  }, [previousValue]);

  return {
    value,
    optimisticUpdate,
    confirmUpdate,
    rollback,
  };
}
