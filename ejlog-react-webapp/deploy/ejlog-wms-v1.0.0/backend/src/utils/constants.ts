// ============================================================================
// EJLOG WMS - Constants
// Costanti applicazione
// ============================================================================

// Colori tema Ferretto
export const COLORS = {
  ferrRed: '#E30613',
  ferrGray: '#32373c',
};

// Dimensioni paginazione
export const PAGE_SIZES = [10, 20, 50, 100];
export const DEFAULT_PAGE_SIZE = 20;

// Intervalli refresh (millisecondi)
export const REFRESH_INTERVALS = {
  DASHBOARD: 30000, // 30 secondi
  OPERATIONS: 10000, // 10 secondi
  ALARMS: 5000, // 5 secondi
  MACHINES: 15000, // 15 secondi
};

// Formati data
export const DATE_FORMATS = {
  DISPLAY: 'DD/MM/YYYY',
  DISPLAY_TIME: 'DD/MM/YYYY HH:mm',
  API: 'YYYY-MM-DD',
  API_TIME: 'YYYY-MM-DDTHH:mm:ss',
};

// Limiti
export const LIMITS = {
  MAX_BARCODE_LENGTH: 50,
  MAX_DESCRIPTION_LENGTH: 200,
  MAX_NOTE_LENGTH: 500,
  MIN_PASSWORD_LENGTH: 6,
};

// Messaggi
export const MESSAGES = {
  LOADING: 'Caricamento in corso...',
  NO_DATA: 'Nessun dato disponibile',
  ERROR_GENERIC: 'Si è verificato un errore',
  ERROR_NETWORK: 'Errore di connessione',
  ERROR_UNAUTHORIZED: 'Non autorizzato',
  SUCCESS_SAVE: 'Salvato con successo',
  SUCCESS_DELETE: 'Eliminato con successo',
  CONFIRM_DELETE: 'Sei sicuro di voler eliminare questo elemento?',
};

// Permessi
export const PERMISSIONS = {
  ITEMS_VIEW: 'items:view',
  ITEMS_CREATE: 'items:create',
  ITEMS_EDIT: 'items:edit',
  ITEMS_DELETE: 'items:delete',
  LISTS_VIEW: 'lists:view',
  LISTS_EXECUTE: 'lists:execute',
  OPERATIONS_VIEW: 'operations:view',
  OPERATIONS_EXECUTE: 'operations:execute',
  CONFIG_VIEW: 'config:view',
  CONFIG_EDIT: 'config:edit',
  ADMIN: 'admin',
};
