// ============================================================================
// EJLOG WMS - Integrations Types
// ============================================================================

export type IntegrationKey = 'sap' | 'erp' | 'edi' | 'mes' | 'tms' | 'ecommerce';

export type SapIntegrationMode = 'ODATA' | 'IDOC' | 'RFC' | 'SFTP';
export type SapPayloadFormat = 'WMS' | 'SAP_ODATA' | 'SAP_IDOC';

export interface SapIntegrationConfig {
  enabled: boolean;
  mode: SapIntegrationMode;
  payloadFormat: SapPayloadFormat;
  baseUrl: string;
  healthPath?: string;
  client: string;
  systemId: string;
  plant: string;
  storageLocation: string;
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
  flows: Record<string, boolean>;
  mapping: {
    itemCodeSource: string;
    locationCodeSource: string;
    lotSource: string;
  };
  endpoints: {
    items: string;
    stock: string;
    orders: string;
  };
  lastTestAt?: string;
}

export type ErpMode = 'REST' | 'SOAP' | 'SFTP' | 'ODATA' | 'EDI_AS2';
export type ErpPayloadFormat = 'WMS' | 'ERP_GENERIC' | 'ERP_ODATA';

export interface ErpIntegrationConfig {
  enabled: boolean;
  mode: ErpMode;
  payloadFormat: ErpPayloadFormat;
  baseUrl: string;
  healthPath: string;
  odataServicePath: string;
  auth: {
    type: 'BASIC' | 'OAUTH2' | 'API_KEY';
    username: string;
    password: string;
    tokenUrl: string;
    clientId: string;
    clientSecret: string;
    scope: string;
    apiKey: string;
    headerName: string;
  };
  endpoints: Record<string, string>;
  flows: Record<string, boolean>;
  ediAs2: {
    endpointUrl: string;
    as2Id: string;
    partnerId: string;
    mdnUrl: string;
    cert: string;
    privateKey: string;
    messageTypeMap: Record<string, number>;
  };
  lastTestAt?: string;
}

export interface EdiIntegrationConfig {
  enabled: boolean;
  protocol: 'AS2' | 'SFTP' | 'FTP';
  endpointUrl: string;
  as2: {
    as2Id: string;
    partnerId: string;
    mdnUrl: string;
    cert: string;
    privateKey: string;
  };
  sftp: {
    host: string;
    port: number;
    username: string;
    password: string;
    inboundPath: string;
    outboundPath: string;
  };
  messageTypes: Record<string, boolean>;
  lastTestAt?: string;
}

export interface MesIntegrationConfig {
  enabled: boolean;
  mode: 'REST' | 'MQTT';
  baseUrl: string;
  healthPath: string;
  auth: {
    apiKey: string;
    headerName: string;
  };
  endpoints: Record<string, string>;
  mqtt: {
    brokerUrl: string;
    username: string;
    password: string;
    topics: string;
  };
  lastTestAt?: string;
}

export interface TmsIntegrationConfig {
  enabled: boolean;
  mode: 'REST';
  baseUrl: string;
  healthPath: string;
  auth: {
    apiKey: string;
    headerName: string;
  };
  endpoints: Record<string, string>;
  lastTestAt?: string;
}

export interface EcommerceIntegrationConfig {
  enabled: boolean;
  platform: 'SHOPIFY' | 'MAGENTO' | 'CUSTOM';
  baseUrl: string;
  healthPath: string;
  auth: {
    apiKey: string;
    apiSecret: string;
    accessToken: string;
  };
  endpoints: Record<string, string>;
  webhooks: Record<string, string>;
  lastTestAt?: string;
}

export interface IntegrationStatus {
  key: IntegrationKey | string;
  enabled: boolean;
  updatedAt?: string | null;
  updatedBy?: string | null;
  lastSyncAt?: string | null;
  lastStatus?: string | null;
  lastFlow?: string | null;
  lastMessage?: string | null;
}

export interface IntegrationLogEntry {
  id: number;
  integrationKey: string;
  direction: string;
  flow: string;
  status: string;
  message?: string | null;
  recordCount?: number | null;
  startedAt: string;
  finishedAt?: string | null;
  durationMs?: number | null;
}
