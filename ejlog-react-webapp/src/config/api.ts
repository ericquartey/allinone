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
 * Base URL per adapter .NET EjLog (ufficiale)
 * Default: proxy Vite verso http://localhost:9000
 */
export const EJLOG_DOTNET_API_BASE_URL =
  import.meta.env.VITE_EJLOG_DOTNET_API_BASE_URL || '/api/ejlog-adapter/api';

/**
 * Base URL per adapter .NET MAS (ufficiale)
 * Default: proxy Vite verso http://localhost:10000
 */
export const MAS_DOTNET_API_BASE_URL =
  import.meta.env.VITE_MAS_DOTNET_API_BASE_URL || '/api/mas-adapter/api';

/**
 * Base URL SignalR per MAS adapter (hub /hubs/data)
 */
export const MAS_DOTNET_HUB_BASE_URL =
  import.meta.env.VITE_MAS_DOTNET_HUB_BASE_URL || '/api/mas-adapter';

/**
 * Base URL per MAS Automation Service (PPC).
 * Default: proxy Vite verso http://localhost:5000
 */
export const PPC_AUTOMATION_API_BASE_URL =
  import.meta.env.VITE_PPC_AUTOMATION_API_BASE_URL || '/api/mas-automation';

/**
 * Base URL SignalR per MAS Automation Service (PPC).
 */
export const PPC_AUTOMATION_HUB_BASE_URL =
  import.meta.env.VITE_PPC_AUTOMATION_HUB_BASE_URL || '/api/mas-automation';

/**
 * Bay number and language defaults for PPC requests.
 */
export const PPC_BAY_NUMBER = Number(import.meta.env.VITE_PPC_BAY_NUMBER || 1);
export const PPC_LANGUAGE = import.meta.env.VITE_PPC_LANGUAGE || 'it-IT';

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

