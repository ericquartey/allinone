// ============================================================================
// EJLOG WMS - Settings Types
// Types and interfaces for system configuration and settings
// ============================================================================

/**
 * Composite key for Config entity (sezione, sottosezione, chiave)
 */
export interface ConfigId {
  sezione: string;
  sottosezione: string;
  chiave: string;
}

/**
 * Config entity - System configuration key-value pairs
 */
export interface Config {
  id: ConfigId;
  valore: string;
  dataUltimaModifica?: string; // ISO date string
  valorePrecedente?: string;
  utente?: string;
  visualizzaSuClient?: boolean;
  visualizzaSuControllore?: boolean;
  riavvioClientRichiesto?: boolean;
  riavvioControlloreRichiesto?: boolean;
  descrizione?: string;
}

/**
 * Config with UI state for editing
 */
export interface ConfigItem extends Config {
  isEditing?: boolean;
  hasChanges?: boolean;
  originalValue?: string;
}

/**
 * Config grouped by sezione and sottosezione
 */
export interface ConfigGroup {
  sezione: string;
  sottosezioni: {
    [sottosezione: string]: Config[];
  };
}

/**
 * Filters for config search
 */
export interface ConfigFilters {
  sezione?: string;
  sottosezione?: string;
  chiave?: string;
  searchText?: string;
}

/**
 * Request to create new config
 */
export interface CreateConfigRequest {
  sezione: string;
  sottosezione: string;
  chiave: string;
  valore: string;
  descrizione?: string;
  riavvioClientRichiesto?: boolean;
  riavvioControlloreRichiesto?: boolean;
}

/**
 * Request to update existing config
 */
export interface UpdateConfigRequest {
  sezione: string;
  sottosezione: string;
  chiave: string;
  valore: string;
  descrizione?: string;
  riavvioClientRichiesto?: boolean;
  riavvioControlloreRichiesto?: boolean;
}

/**
 * Host exchange mode types
 */
export type HostExchangeMode = 'DATABASE' | 'FILE' | 'REST';

/**
 * Host settings
 */
export interface HostSettings {
  exchangeMode: HostExchangeMode;
  lastChangeDate?: string;
  lastChangeUser?: string;
}

/**
 * Schedule configuration for import/export
 */
export interface Schedule {
  id: number;
  name: string;
  type: 'IMPORT' | 'EXPORT';
  category: string;
  cronExpression: string;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
}

/**
 * System property
 */
export interface SystemProperty {
  key: string;
  value: string;
  description?: string;
  category: string;
}

/**
 * Vertimag quota configuration
 */
export interface VertimagQuota {
  level: number;
  quota: number;
  descrizione?: string;
}

/**
 * Hardware device configuration
 */
export interface HardwareDevice {
  id: number;
  type: 'PRINTER' | 'BARCODE_READER' | 'SCALE' | 'BARRIER';
  name: string;
  enabled: boolean;
  configuration: Record<string, any>;
}

/**
 * Config history entry
 */
export interface ConfigHistory {
  sezione: string;
  sottosezione: string;
  chiave: string;
  valore: string;
  valorePrecedente?: string;
  dataModifica: string;
  utente: string;
}
