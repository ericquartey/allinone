// ============================================================================
// EJLOG WMS - API Configuration
// Configurazione centralizzata per gli endpoint del backend
// ============================================================================

/**
 * Base URL per il backend EjLog
 * Il server TypeScript/Node.js espone le API REST su questa URL
 *
 * IMPORTANTE: In development usa stringa vuota per sfruttare il proxy Vite
 * Il proxy (vite.config.js) inoltra le richieste a http://localhost:3077
 * - Development: '' (usa proxy Vite → http://localhost:3077)
 * - Base path: /EjLogHostVertimag e /api
 * - Endpoint login: POST /api/auth/login
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Timeout predefinito per le richieste HTTP (in millisecondi)
 */
export const API_TIMEOUT = 30000;

/**
 * Headers predefiniti per tutte le richieste
 */
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

