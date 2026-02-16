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

// ============================================================================
// AI ASSISTANT SETTINGS
// ============================================================================

/**
 * AI model providers
 */
export type AIModel = 'claude' | 'gpt4' | 'local';

/**
 * AI context depth levels
 */
export type AIContextDepth = 'minimal' | 'standard' | 'full';

/**
 * AI Assistant configuration
 */
export interface AIAssistantSettings {
  enabled: boolean;                    // AI abilitato/disabilitato
  voiceEnabled: boolean;               // Voice input attivo
  voiceOutput: boolean;                // TTS risposte vocali
  autoTrigger: boolean;                // Suggerimenti automatici
  language: 'it' | 'en';              // Lingua AI
  model: AIModel;                     // Modello AI
  contextDepth: AIContextDepth;       // Profondita contesto
  showAvatar: boolean;                 // Mostra avatar assistente
}

// ============================================================================
// INTEGRATIONS SETTINGS
// ============================================================================

export type SapIntegrationMode = 'ODATA' | 'IDOC' | 'RFC' | 'SFTP';

export interface SapIntegrationSettings {
  enabled: boolean;
  mode: SapIntegrationMode;
  baseUrl: string;
  client: string;
  systemId: string;
  username: string;
  password: string;
  oauth: {
    enabled: boolean;
    tokenUrl: string;
    clientId: string;
    clientSecret: string;
    scope: string;
  };
  rfc: {
    destination: string;
    gatewayHost: string;
    gatewayService: string;
    systemNumber: string;
    sapRouter: string;
  };
  idoc: {
    port: string;
    partner: string;
    messageType: string;
    basicType: string;
  };
  sftp: {
    host: string;
    port: number;
    username: string;
    password: string;
    privateKey: string;
    inboundPath: string;
    outboundPath: string;
  };
  flows: {
    items: boolean;
    stock: boolean;
    orders: boolean;
    transfers: boolean;
    inventory: boolean;
    suppliers: boolean;
    customers: boolean;
  };
  mapping: {
    itemCodeSource: 'SAP_MATNR' | 'WMS_CODE';
    locationCodeSource: 'SAP_LGORT' | 'WMS_LOCATION';
    lotSource: 'SAP_CHARG' | 'WMS_LOT';
  };
  lastTestAt?: string;
}

export interface IntegrationsSettings {
  sap: SapIntegrationSettings;
}
