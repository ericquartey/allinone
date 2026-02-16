// ============================================================================
// EJLOG WMS - API Integration Utilities
// Utilities avanzate per integrazione backend e gestione errori
// ============================================================================

import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { SerializedError } from '@reduxjs/toolkit';

/**
 * Tipi di errore standardizzati per l'applicazione
 */
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER_ERROR = 'SERVER_ERROR',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Struttura errore normalizzata
 */
export interface NormalizedError {
  type: ErrorType;
  message: string;
  statusCode?: number;
  originalError?: unknown;
  timestamp: Date;
  requestId?: string;
}

/**
 * Interfaccia per la risposta standard del backend EjLog
 */
export interface BackendResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  timestamp?: string;
  requestId?: string;
}

/**
 * Type guard per FetchBaseQueryError
 */
export function isFetchBaseQueryError(error: unknown): error is FetchBaseQueryError {
  return typeof error === 'object' && error != null && 'status' in error;
}

/**
 * Type guard per SerializedError
 */
export function isSerializedError(error: unknown): error is SerializedError {
  return typeof error === 'object' && error != null && 'message' in error && !('status' in error);
}

/**
 * Normalizza errori RTK Query in formato uniforme
 */
export function normalizeError(error: FetchBaseQueryError | SerializedError | undefined): NormalizedError {
  const timestamp = new Date();

  if (!error) {
    return {
      type: ErrorType.UNKNOWN,
      message: 'Errore sconosciuto',
      timestamp,
    };
  }

  // Gestione FetchBaseQueryError
  if (isFetchBaseQueryError(error)) {
    const status = typeof error.status === 'number' ? error.status : 0;

    // Errori di rete
    if (error.status === 'FETCH_ERROR') {
      return {
        type: ErrorType.NETWORK,
        message: 'Impossibile connettersi al server. Verifica la connessione di rete.',
        originalError: error,
        timestamp,
      };
    }

    // Timeout
    if (error.status === 'TIMEOUT_ERROR') {
      return {
        type: ErrorType.TIMEOUT,
        message: 'La richiesta ha impiegato troppo tempo. Riprova.',
        originalError: error,
        timestamp,
      };
    }

    // Parsing error
    if (error.status === 'PARSING_ERROR') {
      return {
        type: ErrorType.SERVER_ERROR,
        message: 'Risposta del server non valida.',
        originalError: error,
        timestamp,
      };
    }

    // HTTP Status codes
    switch (status) {
      case 400:
        return {
          type: ErrorType.VALIDATION,
          message: getBackendErrorMessage(error) || 'Dati non validi. Controlla i campi inseriti.',
          statusCode: status,
          originalError: error,
          timestamp,
        };
      case 401:
        return {
          type: ErrorType.AUTHENTICATION,
          message: 'Sessione scaduta. Effettua nuovamente il login.',
          statusCode: status,
          originalError: error,
          timestamp,
        };
      case 403:
        return {
          type: ErrorType.AUTHORIZATION,
          message: 'Non hai i permessi per eseguire questa operazione.',
          statusCode: status,
          originalError: error,
          timestamp,
        };
      case 404:
        return {
          type: ErrorType.NOT_FOUND,
          message: getBackendErrorMessage(error) || 'Risorsa non trovata.',
          statusCode: status,
          originalError: error,
          timestamp,
        };
      case 409:
        return {
          type: ErrorType.VALIDATION,
          message: getBackendErrorMessage(error) || 'Conflitto con i dati esistenti.',
          statusCode: status,
          originalError: error,
          timestamp,
        };
      case 422:
        return {
          type: ErrorType.VALIDATION,
          message: getBackendErrorMessage(error) || 'I dati forniti non possono essere processati.',
          statusCode: status,
          originalError: error,
          timestamp,
        };
      case 500:
      case 502:
      case 503:
      case 504:
        return {
          type: ErrorType.SERVER_ERROR,
          message: 'Errore del server. Riprova tra qualche istante.',
          statusCode: status,
          originalError: error,
          timestamp,
        };
      default:
        return {
          type: ErrorType.UNKNOWN,
          message: getBackendErrorMessage(error) || `Errore HTTP ${status}`,
          statusCode: status,
          originalError: error,
          timestamp,
        };
    }
  }

  // Gestione SerializedError
  if (isSerializedError(error)) {
    return {
      type: ErrorType.UNKNOWN,
      message: error.message || 'Si è verificato un errore.',
      originalError: error,
      timestamp,
    };
  }

  // Fallback
  return {
    type: ErrorType.UNKNOWN,
    message: 'Si è verificato un errore imprevisto.',
    originalError: error,
    timestamp,
  };
}

/**
 * Estrae il messaggio di errore dal backend se presente
 */
function getBackendErrorMessage(error: FetchBaseQueryError): string | null {
  if (error.data && typeof error.data === 'object') {
    const data = error.data as Record<string, unknown>;

    // Formato standard EjLog Backend
    if ('error' in data && typeof data.error === 'object' && data.error !== null) {
      const errorObj = data.error as Record<string, unknown>;
      if ('message' in errorObj && typeof errorObj.message === 'string') {
        return errorObj.message;
      }
    }

    // Fallback: message diretto
    if ('message' in data && typeof data.message === 'string') {
      return data.message;
    }
  }

  return null;
}

/**
 * Formatta un messaggio user-friendly per l'errore
 */
export function getErrorMessage(error: FetchBaseQueryError | SerializedError | undefined): string {
  const normalized = normalizeError(error);
  return normalized.message;
}

/**
 * Determina se un errore richiede il logout dell'utente
 */
export function shouldLogout(error: FetchBaseQueryError | SerializedError | undefined): boolean {
  const normalized = normalizeError(error);
  return normalized.type === ErrorType.AUTHENTICATION;
}

/**
 * Determina se un errore è recuperabile con un retry
 */
export function isRetryableError(error: FetchBaseQueryError | SerializedError | undefined): boolean {
  const normalized = normalizeError(error);
  return (
    normalized.type === ErrorType.NETWORK ||
    normalized.type === ErrorType.TIMEOUT ||
    (normalized.type === ErrorType.SERVER_ERROR &&
     (normalized.statusCode === 502 || normalized.statusCode === 503 || normalized.statusCode === 504))
  );
}

/**
 * Logger centralizzato per errori API
 */
export function logApiError(
  endpoint: string,
  error: FetchBaseQueryError | SerializedError | undefined,
  context?: Record<string, unknown>
): void {
  const normalized = normalizeError(error);

  console.error('[API Error]', {
    endpoint,
    type: normalized.type,
    message: normalized.message,
    statusCode: normalized.statusCode,
    timestamp: normalized.timestamp.toISOString(),
    context,
    originalError: normalized.originalError,
  });

  // TODO: Invia log a servizio centralizzato (es. Sentry, LogRocket)
  // if (import.meta.env.PROD) {
  //   sendToErrorTracking(normalized);
  // }
}

/**
 * Retry strategy per chiamate API
 */
export interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier: number;
  retryableErrors?: ErrorType[];
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
  retryableErrors: [ErrorType.NETWORK, ErrorType.TIMEOUT, ErrorType.SERVER_ERROR],
};

/**
 * Sleep utility per retry delays
 */
export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Wrapper per retry automatico delle chiamate API
 */
export async function withRetry<T>(
  apiCall: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: unknown;
  let delay = retryConfig.delayMs;

  for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;

      // Se è l'ultimo tentativo, rilancia l'errore
      if (attempt === retryConfig.maxAttempts) {
        break;
      }

      // Verifica se l'errore è retryable
      const normalized = normalizeError(error as FetchBaseQueryError | SerializedError);
      const isRetryable = retryConfig.retryableErrors?.includes(normalized.type) ?? false;

      if (!isRetryable) {
        break;
      }

      // Log del retry
      console.warn(`[API Retry] Attempt ${attempt}/${retryConfig.maxAttempts} failed. Retrying in ${delay}ms...`, {
        error: normalized,
      });

      // Attendi prima del prossimo tentativo
      await sleep(delay);
      delay *= retryConfig.backoffMultiplier;
    }
  }

  // Rilancia l'ultimo errore
  throw lastError;
}

/**
 * Health check per verificare disponibilità backend
 */
export async function checkBackendHealth(baseUrl: string): Promise<{
  isHealthy: boolean;
  latency: number;
  error?: NormalizedError;
}> {
  const startTime = performance.now();

  try {
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const latency = performance.now() - startTime;

    if (response.ok) {
      return { isHealthy: true, latency };
    }

    return {
      isHealthy: false,
      latency,
      error: normalizeError({
        status: response.status,
        data: await response.json().catch(() => ({})),
      } as FetchBaseQueryError),
    };
  } catch (error) {
    const latency = performance.now() - startTime;
    return {
      isHealthy: false,
      latency,
      error: normalizeError({
        status: 'FETCH_ERROR',
        error: String(error),
      } as FetchBaseQueryError),
    };
  }
}

/**
 * Utility per costruire query params in modo sicuro
 */
export function buildQueryParams(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach((v) => searchParams.append(key, String(v)));
      } else if (value instanceof Date) {
        searchParams.append(key, value.toISOString());
      } else {
        searchParams.append(key, String(value));
      }
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Validator per response del backend
 */
export function validateBackendResponse<T>(response: unknown): response is BackendResponse<T> {
  if (typeof response !== 'object' || response === null) {
    return false;
  }

  const r = response as Record<string, unknown>;
  return 'success' in r && typeof r.success === 'boolean';
}

/**
 * Unwrap della response del backend
 */
export function unwrapBackendResponse<T>(response: BackendResponse<T>): T {
  if (!response.success) {
    throw new Error(response.error?.message || 'Backend operation failed');
  }

  if (response.data === undefined) {
    throw new Error('Backend response missing data field');
  }

  return response.data;
}

/**
 * Timeout wrapper per fetch calls
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = 'Operation timed out'
): Promise<T> {
  let timeoutId: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId!);
  }
}

/**
 * Batch request utility per ottimizzare chiamate multiple
 */
export class BatchRequestQueue<T, R> {
  private queue: Array<{ item: T; resolve: (value: R) => void; reject: (error: unknown) => void }> = [];
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private batchFn: (items: T[]) => Promise<R[]>,
    private delayMs: number = 50,
    private maxBatchSize: number = 100
  ) {}

  add(item: T): Promise<R> {
    return new Promise((resolve, reject) => {
      this.queue.push({ item, resolve, reject });

      if (this.queue.length >= this.maxBatchSize) {
        this.flush();
      } else if (!this.timer) {
        this.timer = setTimeout(() => this.flush(), this.delayMs);
      }
    });
  }

  private async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    const batch = this.queue.splice(0, this.maxBatchSize);
    if (batch.length === 0) return;

    try {
      const items = batch.map((b) => b.item);
      const results = await this.batchFn(items);

      batch.forEach((b, index) => {
        b.resolve(results[index]);
      });
    } catch (error) {
      batch.forEach((b) => {
        b.reject(error);
      });
    }
  }
}

/**
 * Request deduplication per evitare chiamate duplicate
 */
export class RequestDeduplicator<K, V> {
  private pending = new Map<K, Promise<V>>();

  async deduplicate(key: K, fn: () => Promise<V>): Promise<V> {
    // Se c'è già una richiesta in corso per questa chiave, restituiscila
    const existing = this.pending.get(key);
    if (existing) {
      return existing;
    }

    // Crea una nuova richiesta
    const promise = fn().finally(() => {
      // Rimuovi dalla mappa quando completa
      this.pending.delete(key);
    });

    this.pending.set(key, promise);
    return promise;
  }

  clear(): void {
    this.pending.clear();
  }
}
