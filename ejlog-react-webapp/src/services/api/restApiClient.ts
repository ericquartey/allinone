/**
 * REST API Client for EjLog WMS
 *
 * Questo client è dedicato alle chiamate REST API dirette su /api/item-lists/*
 * Differenza con apiClient (Host API):
 * - Host API: /EjLogHostVertimag/Lists (CRUD via command pattern)
 * - REST API: /api/item-lists/* (operazioni avanzate: execute, terminate, reserve, etc.)
 *
 * Backend porta: 3077
 *
 * IMPORTANTE:
 * - In DEV: Usa URL relativo per permettere al proxy Vite di funzionare
 * - In PROD: Usa origin corrente
 * - Il proxy Vite (vite.config.js) reindirizza /api/item-lists/* → http://localhost:3077/api/item-lists/*
 *   (NON aggiunge /EjLogHostVertimag - gli endpoint REST sono diretti)
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

// Configurazione base per REST API
// FIX: Usa URL relativo in DEV per permettere al proxy Vite di funzionare
const REST_API_BASE_URL = import.meta.env.DEV
  ? '' // URL relativo - il proxy Vite gestisce il routing
  : window.location.origin;

// Crea istanza axios dedicata per REST API
export const restApiClient: AxiosInstance = axios.create({
  baseURL: REST_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000, // 30 secondi
  withCredentials: false, // Se serve autenticazione, cambiare a true
});

// Request interceptor - Aggiunge token autenticazione se presente
restApiClient.interceptors.request.use(
  (config) => {
    // Aggiungi token JWT se disponibile (supporta diverse chiavi per compatibilità)
    const token = localStorage.getItem('token') ||
                  localStorage.getItem('auth_token') ||
                  localStorage.getItem('ejlog_auth_token') ||
                  localStorage.getItem('authToken');

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log della richiesta in development
    if (import.meta.env.DEV) {
      console.log(`[REST API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, {
        params: config.params,
        data: config.data,
      });
    }

    return config;
  },
  (error) => {
    console.error('[REST API] Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Gestisce errori e log
restApiClient.interceptors.response.use(
  (response) => {
    // Log della risposta in development
    if (import.meta.env.DEV) {
      console.log(`[REST API] Response ${response.status}:`, {
        method: response.config.method?.toUpperCase(),
        url: response.config.url,
        data: response.data,
      });
    }

    return response;
  },
  (error) => {
    // Gestione errori centralizzata
    if (error.response) {
      // Server ha risposto con status code fuori dal range 2xx
      const { status, data } = error.response;

      console.error(`[REST API] Error ${status}:`, {
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
        message: data?.message || data,
        fullResponse: data,
      });

      // Gestione errori specifici
      switch (status) {
        case 400:
          console.warn('[REST API] Bad Request:', data?.message || data);
          break;

        case 401:
          // Non autorizzato - potrebbe essere necessario re-login
          console.warn('[REST API] Unauthorized - token scaduto?');
          // Opzionale: redirect a login o refresh token
          break;

        case 403:
          console.warn('[REST API] Forbidden - insufficient permissions');
          break;

        case 404:
          console.warn('[REST API] Resource not found');
          break;

        case 500:
          console.error('[REST API] Internal Server Error');
          break;

        default:
          console.error(`[REST API] HTTP ${status} error`);
      }
    } else if (error.request) {
      // Richiesta inviata ma nessuna risposta ricevuta
      console.error('[REST API] No response received - Backend potrebbe essere offline:', {
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
      });
      console.error('[REST API] Verifica che il backend sia in esecuzione su porta 3077');
    } else {
      // Errore durante la configurazione della richiesta
      console.error('[REST API] Request setup error:', error.message);
    }

    return Promise.reject(error);
  }
);

/**
 * Helper functions per chiamate API comuni
 */

export const restApi = {
  /**
   * GET request
   */
  get: <T = any>(url: string, config?: AxiosRequestConfig) =>
    restApiClient.get<T>(url, config),

  /**
   * POST request
   */
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    restApiClient.post<T>(url, data, config),

  /**
   * PUT request
   */
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    restApiClient.put<T>(url, data, config),

  /**
   * DELETE request
   */
  delete: <T = any>(url: string, config?: AxiosRequestConfig) =>
    restApiClient.delete<T>(url, config),

  /**
   * PATCH request
   */
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    restApiClient.patch<T>(url, data, config),
};

export default restApiClient;

