/**
 * Integrations Routes
 * CRUD + Test for external integrations (SAP, ERP, EDI, MES, TMS, eCommerce)
 */

import express from 'express';
import axios from 'axios';
import { getPool } from '../db-config.js';

const router = express.Router();

const DEFAULT_CONFIGS = {
  sap: {
    enabled: false,
    mode: 'ODATA',
    payloadFormat: 'WMS',
    baseUrl: '',
    healthPath: '/$metadata',
    client: '',
    systemId: '',
    plant: '',
    storageLocation: '',
    username: '',
    password: '',
    oauth: {
      enabled: false,
      tokenUrl: '',
      clientId: '',
      clientSecret: '',
      scope: '',
    },
    rfc: {
      destination: '',
      gatewayHost: '',
      gatewayService: '',
      systemNumber: '',
      sapRouter: '',
    },
    idoc: {
      port: '',
      partner: '',
      messageType: '',
      basicType: '',
    },
    sftp: {
      host: '',
      port: 22,
      username: '',
      password: '',
      privateKey: '',
      inboundPath: '/inbound',
      outboundPath: '/outbound',
    },
    flows: {
      items: true,
      stock: true,
      orders: true,
      transfers: false,
      inventory: true,
      suppliers: false,
      customers: false,
    },
    mapping: {
      itemCodeSource: 'SAP_MATNR',
      locationCodeSource: 'SAP_LGORT',
      lotSource: 'SAP_CHARG',
    },
    endpoints: {
      items: '/items',
      stock: '/stock',
      orders: '/orders',
    },
  },
  erp: {
    enabled: false,
    mode: 'REST',
    payloadFormat: 'WMS',
    baseUrl: '',
    healthPath: '/health',
    odataServicePath: '',
    auth: {
      type: 'BASIC',
      username: '',
      password: '',
      tokenUrl: '',
      clientId: '',
      clientSecret: '',
      scope: '',
    },
    endpoints: {
      items: '/items',
      stock: '/stock',
      orders: '/orders',
      shipments: '/shipments',
      suppliers: '/suppliers',
      customers: '/customers',
    },
    flows: {
      items: true,
      stock: true,
      orders: true,
      shipments: true,
      suppliers: false,
      customers: false,
    },
    ediAs2: {
      endpointUrl: '',
      as2Id: '',
      partnerId: '',
      mdnUrl: '',
      cert: '',
      privateKey: '',
      messageTypeMap: {
        '832': 1,
        '846': 1,
        '850': 1,
        '855': 1,
        '856': 2,
        '940': 1,
        '945': 2,
      },
    },
  },
  edi: {
    enabled: false,
    protocol: 'AS2',
    endpointUrl: '',
    as2: {
      as2Id: '',
      partnerId: '',
      mdnUrl: '',
      cert: '',
      privateKey: '',
    },
    sftp: {
      host: '',
      port: 22,
      username: '',
      password: '',
      inboundPath: '/edi/in',
      outboundPath: '/edi/out',
    },
    messageTypes: {
      order940: true,
      order945: true,
      purchase850: true,
      confirm855: true,
      advance856: true,
      invoice810: false,
    },
  },
  mes: {
    enabled: false,
    mode: 'REST',
    baseUrl: '',
    healthPath: '/health',
    auth: {
      apiKey: '',
      headerName: 'x-api-key',
    },
    endpoints: {
      workOrders: '/work-orders',
      production: '/production',
      consumption: '/consumption',
    },
    mqtt: {
      brokerUrl: '',
      username: '',
      password: '',
      topics: '',
    },
  },
  tms: {
    enabled: false,
    mode: 'REST',
    baseUrl: '',
    healthPath: '/health',
    auth: {
      apiKey: '',
      headerName: 'x-api-key',
    },
    endpoints: {
      shipments: '/shipments',
      carriers: '/carriers',
      tracking: '/tracking',
      appointments: '/appointments',
    },
  },
  ecommerce: {
    enabled: false,
    platform: 'CUSTOM',
    baseUrl: '',
    healthPath: '/health',
    auth: {
      apiKey: '',
      apiSecret: '',
      accessToken: '',
    },
    endpoints: {
      orders: '/orders',
      inventory: '/inventory',
      shipments: '/shipments',
      returns: '/returns',
    },
    webhooks: {
      orders: '',
      inventory: '',
    },
  },
};

const getDefaultConfig = (key) => DEFAULT_CONFIGS[key] || { enabled: false };

const mergeConfigs = (base, override) => {
  if (!base || typeof base !== 'object') return override;
  if (!override || typeof override !== 'object') return base;
  const result = Array.isArray(base) ? [...base] : { ...base };
  Object.entries(override).forEach(([key, value]) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = mergeConfigs(base[key], value);
    } else {
      result[key] = value;
    }
  });
  return result;
};

const OAUTH_CACHE = new Map();

const ensureTable = async () => {
  const pool = await getPool();
  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'IntegrationsConfig')
    BEGIN
      CREATE TABLE IntegrationsConfig (
        id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        integrationKey NVARCHAR(50) NOT NULL UNIQUE,
        enabled BIT NOT NULL DEFAULT(0),
        configJson NVARCHAR(MAX) NOT NULL,
        updatedAt DATETIME NOT NULL DEFAULT(GETDATE()),
        updatedBy NVARCHAR(100) NULL
      );
    END
  `);
};

const ensureLogTable = async () => {
  const pool = await getPool();
  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'IntegrationSyncLog')
    BEGIN
      CREATE TABLE IntegrationSyncLog (
        id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        integrationKey NVARCHAR(50) NOT NULL,
        direction NVARCHAR(20) NOT NULL,
        flow NVARCHAR(50) NOT NULL,
        status NVARCHAR(20) NOT NULL,
        message NVARCHAR(500) NULL,
        recordCount INT NULL,
        startedAt DATETIME NOT NULL DEFAULT(GETDATE()),
        finishedAt DATETIME NULL,
        durationMs INT NULL
      );
    END

    IF COL_LENGTH('IntegrationSyncLog', 'durationMs') IS NULL
      ALTER TABLE IntegrationSyncLog ADD durationMs INT NULL;
  `);
};

const ensureEdiInboxTable = async () => {
  const pool = await getPool();
  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'IntegrationEdiInbox')
    BEGIN
      CREATE TABLE IntegrationEdiInbox (
        id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        integrationKey NVARCHAR(50) NOT NULL,
        flow NVARCHAR(50) NOT NULL,
        messageType NVARCHAR(10) NULL,
        rawContent NVARCHAR(MAX) NOT NULL,
        parsedJson NVARCHAR(MAX) NULL,
        receivedAt DATETIME NOT NULL DEFAULT(GETDATE()),
        appliedAt DATETIME NULL,
        appliedStatus NVARCHAR(20) NULL,
        appliedMessage NVARCHAR(500) NULL
      );
    END

    IF COL_LENGTH('IntegrationEdiInbox', 'appliedAt') IS NULL
      ALTER TABLE IntegrationEdiInbox ADD appliedAt DATETIME NULL;
    IF COL_LENGTH('IntegrationEdiInbox', 'appliedStatus') IS NULL
      ALTER TABLE IntegrationEdiInbox ADD appliedStatus NVARCHAR(20) NULL;
    IF COL_LENGTH('IntegrationEdiInbox', 'appliedMessage') IS NULL
      ALTER TABLE IntegrationEdiInbox ADD appliedMessage NVARCHAR(500) NULL;
    IF COL_LENGTH('IntegrationEdiInbox', 'overrideTipoLista') IS NULL
      ALTER TABLE IntegrationEdiInbox ADD overrideTipoLista INT NULL;
    IF COL_LENGTH('IntegrationEdiInbox', 'overrideAreaId') IS NULL
      ALTER TABLE IntegrationEdiInbox ADD overrideAreaId INT NULL;
    IF COL_LENGTH('IntegrationEdiInbox', 'overrideMachineId') IS NULL
      ALTER TABLE IntegrationEdiInbox ADD overrideMachineId INT NULL;
  `);
};

const ensureEdiApplyErrorTable = async () => {
  const pool = await getPool();
  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'IntegrationEdiApplyErrors')
    BEGIN
      CREATE TABLE IntegrationEdiApplyErrors (
        id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        inboxId INT NOT NULL,
        orderNumber NVARCHAR(100) NULL,
        lineNumber NVARCHAR(50) NULL,
        itemCode NVARCHAR(100) NULL,
        reason NVARCHAR(500) NOT NULL,
        createdAt DATETIME NOT NULL DEFAULT(GETDATE())
      );
    END
  `);
};

const ensureEdiApplyAuditTable = async () => {
  const pool = await getPool();
  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'IntegrationEdiApplyAudit')
    BEGIN
      CREATE TABLE IntegrationEdiApplyAudit (
        id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        inboxId INT NOT NULL,
        appliedBy NVARCHAR(100) NULL,
        appliedAt DATETIME NOT NULL DEFAULT(GETDATE()),
        status NVARCHAR(20) NOT NULL,
        message NVARCHAR(500) NULL
      );
    END
  `);
};

const ensureItemMapTable = async () => {
  const pool = await getPool();
  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'IntegrationItemMap')
    BEGIN
      CREATE TABLE IntegrationItemMap (
        id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        integrationKey NVARCHAR(50) NOT NULL,
        externalCode NVARCHAR(100) NOT NULL,
        itemId INT NULL,
        itemCode NVARCHAR(100) NULL,
        description NVARCHAR(200) NULL,
        createdAt DATETIME NOT NULL DEFAULT(GETDATE())
      );
    END
  `);
};

const loadIntegration = async (key) => {
  const pool = await getPool();
  const result = await pool.request()
    .input('key', key)
    .query(`
      SELECT TOP 1 integrationKey, enabled, configJson, updatedAt, updatedBy
      FROM IntegrationsConfig
      WHERE integrationKey = @key
    `);

  if (result.recordset.length === 0) {
    return null;
  }

  const row = result.recordset[0];
  let config = {};
  try {
    config = JSON.parse(row.configJson);
  } catch (error) {
    config = {};
  }

  return {
    key: row.integrationKey,
    enabled: !!row.enabled,
    config,
    updatedAt: row.updatedAt,
    updatedBy: row.updatedBy,
  };
};

const saveIntegration = async (key, enabled, config, updatedBy = null) => {
  const pool = await getPool();
  const payload = JSON.stringify(config || {});

  await pool.request()
    .input('key', key)
    .input('enabled', enabled ? 1 : 0)
    .input('configJson', payload)
    .input('updatedBy', updatedBy)
    .query(`
      MERGE IntegrationsConfig AS target
      USING (SELECT @key AS integrationKey) AS source
      ON target.integrationKey = source.integrationKey
      WHEN MATCHED THEN
        UPDATE SET enabled = @enabled,
                   configJson = @configJson,
                   updatedAt = GETDATE(),
                   updatedBy = @updatedBy
      WHEN NOT MATCHED THEN
        INSERT (integrationKey, enabled, configJson, updatedAt, updatedBy)
        VALUES (@key, @enabled, @configJson, GETDATE(), @updatedBy);
    `);
};

const getOAuthToken = async ({ cacheKey, tokenUrl, clientId, clientSecret, scope }) => {
  if (!tokenUrl || !clientId) return null;
  const cached = OAUTH_CACHE.get(cacheKey);
  if (cached && cached.expiresAt > Date.now() + 60000) {
    return cached.token;
  }

  const params = new URLSearchParams();
  params.set('grant_type', 'client_credentials');
  if (scope) params.set('scope', scope);

  const response = await axios.post(tokenUrl, params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    auth: clientSecret ? { username: clientId, password: clientSecret } : undefined,
    validateStatus: () => true,
  });

  if (response.status < 200 || response.status >= 300) {
    throw new Error(`OAuth2 token error HTTP ${response.status}`);
  }

  const token = response.data?.access_token;
  if (!token) {
    throw new Error('OAuth2 token missing access_token');
  }

  const expiresIn = Number(response.data?.expires_in || 3600);
  OAUTH_CACHE.set(cacheKey, {
    token,
    expiresAt: Date.now() + expiresIn * 1000,
  });

  return token;
};

const buildRequestOptions = async (integrationKey, config) => {
  const headers = {};
  let auth = undefined;

  if (integrationKey === 'sap' && config?.oauth?.enabled) {
    const token = await getOAuthToken({
      cacheKey: `sap:${config.oauth.tokenUrl}:${config.oauth.clientId}`,
      tokenUrl: config.oauth.tokenUrl,
      clientId: config.oauth.clientId,
      clientSecret: config.oauth.clientSecret,
      scope: config.oauth.scope,
    });
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  if (config?.auth?.type === 'OAUTH2') {
    const token = await getOAuthToken({
      cacheKey: `${integrationKey}:${config.auth.tokenUrl}:${config.auth.clientId}`,
      tokenUrl: config.auth.tokenUrl,
      clientId: config.auth.clientId,
      clientSecret: config.auth.clientSecret,
      scope: config.auth.scope,
    });
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  if (config?.auth?.type === 'API_KEY') {
    const headerName = config.auth.headerName || 'x-api-key';
    if (config.auth.apiKey) headers[headerName] = config.auth.apiKey;
  }

  if (config?.auth?.apiKey && !config?.auth?.type) {
    const headerName = config.auth.headerName || 'x-api-key';
    headers[headerName] = config.auth.apiKey;
  }

  if (config?.auth?.accessToken) headers.Authorization = `Bearer ${config.auth.accessToken}`;
  if (config?.auth?.apiSecret) headers['x-api-secret'] = config.auth.apiSecret;

  if (config?.auth?.type === 'BASIC') {
    auth = {
      username: config.auth.username || '',
      password: config.auth.password || '',
    };
  } else if (config?.username || config?.password) {
    auth = {
      username: config.username || '',
      password: config.password || '',
    };
  }

  return { headers, auth };
};

const createSyncLog = async (integrationKey, direction, flow) => {
  const pool = await getPool();
  const result = await pool.request()
    .input('integrationKey', integrationKey)
    .input('direction', direction)
    .input('flow', flow)
    .input('status', 'IN_PROGRESS')
    .query(`
      INSERT INTO IntegrationSyncLog (integrationKey, direction, flow, status, startedAt)
      OUTPUT INSERTED.id
      VALUES (@integrationKey, @direction, @flow, @status, GETDATE())
    `);
  return result.recordset[0].id;
};

const updateSyncLog = async (id, { status, message, recordCount }) => {
  const pool = await getPool();
  await pool.request()
    .input('id', id)
    .input('status', status)
    .input('message', message || null)
    .input('recordCount', recordCount ?? null)
    .query(`
      UPDATE IntegrationSyncLog
      SET status = @status,
          message = @message,
          recordCount = @recordCount,
          finishedAt = GETDATE(),
          durationMs = DATEDIFF(ms, startedAt, GETDATE())
      WHERE id = @id
    `);
};

const buildFlowUrl = (config, flow) => {
  if (config.mode === 'EDI_AS2' && config.ediAs2?.endpointUrl) {
    return config.ediAs2.endpointUrl;
  }

  const baseUrl = config.baseUrl || config.endpointUrl || '';
  const endpoint = config.endpoints?.[flow] || config[`${flow}Endpoint`];
  if (!baseUrl || !endpoint) return '';

  if (config.mode === 'ODATA' && config.odataServicePath) {
    return baseUrl.replace(/\/+$/, '') + config.odataServicePath + endpoint;
  }

  return baseUrl.replace(/\/+$/, '') + endpoint;
};

const loadItemsPayload = async (limit = 500) => {
  const pool = await getPool();
  const result = await pool.request()
    .input('limit', limit)
    .query(`
      SELECT TOP (@limit)
        A.id,
        A.codice AS code,
        A.descrizione AS description,
        A.barcode,
        A.um AS unitOfMeasure,
        A.peso AS weight,
        A.prezzoUnitario AS price
      FROM Articoli A
      WHERE A.recordCancellato = 0
      ORDER BY A.id DESC
    `);
  return result.recordset || [];
};

const loadStockPayload = async (limit = 500) => {
  const pool = await getPool();
  const result = await pool.request()
    .input('limit', limit)
    .query(`
      SELECT TOP (@limit)
        UP.idArticolo AS itemId,
        A.codice AS itemCode,
        A.descrizione AS itemDescription,
        UP.qta AS quantity,
        UP.lotto AS lot,
        UP.matricola AS serialNumber,
        U.idLocazione AS locationId,
        U.id AS loadingUnitId
      FROM UdcProdotti UP
      LEFT JOIN Udc U ON UP.idUdc = U.id
      LEFT JOIN Articoli A ON UP.idArticolo = A.id
      WHERE UP.recordCancellato = 0
      ORDER BY UP.id DESC
    `);
  return result.recordset || [];
};

const loadOrdersPayload = async (limit = 200) => {
  const pool = await getPool();
  const result = await pool.request()
    .input('limit', limit)
    .query(`
      SELECT TOP (@limit)
        L.id,
        L.numLista AS orderNumber,
        L.descrizione AS description,
        L.rifLista AS reference,
        L.idTipoLista AS orderType,
        L.priorita AS priority,
        COUNT(RL.id) AS totalRows
      FROM Liste L
      LEFT JOIN RigheLista RL ON L.id = RL.idLista
      WHERE L.terminata = 0 AND L.recordCancellato = 0
      GROUP BY L.id, L.numLista, L.descrizione, L.rifLista, L.idTipoLista, L.priorita
      ORDER BY L.dataCreazione DESC
    `);
  return result.recordset || [];
};

const buildEdiX12 = ({ messageType, payload }) => {
  const now = new Date();
  const dateYYMMDD = now.toISOString().slice(2, 10).replace(/-/g, '');
  const timeHHMM = now.toISOString().slice(11, 16).replace(':', '');
  const control = String(Math.floor(Math.random() * 900000) + 100000);
  const segments = [];

  segments.push(`ISA*00*          *00*          *ZZ*WMS           *ZZ*ERP           *${dateYYMMDD}*${timeHHMM}*U*00401*${control}*0*P*>`);
  segments.push(`GS*${messageType}*WMS*ERP*${now.toISOString().slice(0, 10).replace(/-/g, '')}*${timeHHMM}*${control}*X*004010`);
  segments.push(`ST*${messageType}*${control}`);

  if (messageType === '850') {
    payload.forEach((row, index) => {
      segments.push(`BEG*00*SA*${row.orderNumber || ''}**${now.toISOString().slice(0, 10).replace(/-/g, '')}`);
      segments.push(`REF*PO*${row.reference || ''}`);
      segments.push(`N1*ST*WMS`);
      segments.push(`PO1*${index + 1}*${row.totalRows || 1}*EA*${row.price || ''}**VP*${row.orderNumber || ''}`);
      segments.push(`PID*F****${row.description || ''}`);
    });
    segments.push(`CTT*${payload.length}`);
  }

  if (messageType === '855') {
    payload.forEach((row, index) => {
      segments.push(`BAK*00*AD*${row.orderNumber || ''}*${now.toISOString().slice(0, 10).replace(/-/g, '')}`);
      segments.push(`REF*PO*${row.reference || ''}`);
      segments.push(`N1*ST*WMS`);
      segments.push(`PO1*${index + 1}*${row.totalRows || 1}*EA`);
    });
    segments.push(`CTT*${payload.length}`);
  }

  if (messageType === '856') {
    payload.forEach((row, index) => {
      segments.push(`BSN*00*${row.orderNumber || ''}*${now.toISOString().slice(0, 10).replace(/-/g, '')}*${timeHHMM}`);
      segments.push(`HL*${index + 1}**S`);
      segments.push(`TD1*CTN*${row.totalRows || 1}`);
      segments.push(`REF*PO*${row.reference || ''}`);
      segments.push(`MAN*CP*${row.orderNumber || ''}`);
    });
  }

  if (messageType === '832') {
    payload.forEach((item, index) => {
      segments.push(`LIN*${index + 1}*VP*${item.code || ''}`);
      segments.push(`PID*F****${item.description || ''}`);
      if (item.barcode) segments.push(`LIN*${index + 1}*EN*${item.barcode}`);
    });
  }

  if (messageType === '846') {
    payload.forEach((row, index) => {
      segments.push(`LIN*${index + 1}*VP*${row.itemCode || ''}`);
      segments.push(`QTY*33*${row.quantity ?? 0}`);
      if (row.lot) segments.push(`REF*LT*${row.lot}`);
    });
  }

  if (messageType === '940') {
    payload.forEach((row, index) => {
      segments.push(`W05*${row.orderNumber || ''}*${row.reference || ''}`);
      segments.push(`N1*WH*WMS`);
      segments.push(`G62*11*${now.toISOString().slice(0, 10).replace(/-/g, '')}`);
      segments.push(`W01*${row.totalRows || 0}*EA*${row.orderType || ''}`);
      segments.push(`LX*${index + 1}`);
    });
    segments.push(`CTT*${payload.length}`);
  }

  if (messageType === '945') {
    payload.forEach((row, index) => {
      segments.push(`W06*${row.orderNumber || ''}*${row.reference || ''}`);
      segments.push(`N1*ST*WMS`);
      segments.push(`G62*11*${now.toISOString().slice(0, 10).replace(/-/g, '')}`);
      segments.push(`W12*${row.totalRows || 0}*EA`);
      segments.push(`LX*${index + 1}`);
    });
    segments.push(`CTT*${payload.length}`);
  }

  segments.push(`SE*${segments.length + 1}*${control}`);
  segments.push(`GE*1*${control}`);
  segments.push(`IEA*1*${control}`);

  return segments.join('~') + '~';
};

const parseEdiX12 = (content = '') => {
  const segments = content.split('~').map((s) => s.trim()).filter(Boolean);
  const stSegment = segments.find((segment) => segment.startsWith('ST*'));
  const messageType = stSegment ? stSegment.split('*')[1] : null;
  const isaSegment = segments.find((segment) => segment.startsWith('ISA*'));
  const gsSegment = segments.find((segment) => segment.startsWith('GS*'));
  const seSegment = segments.find((segment) => segment.startsWith('SE*'));
  const errors = [];
  if (!isaSegment) errors.push('Missing ISA segment');
  if (!gsSegment) errors.push('Missing GS segment');
  if (!stSegment) errors.push('Missing ST segment');
  if (!seSegment) errors.push('Missing SE segment');

  const orderSegments = ['BEG', 'BAK', 'BSN', 'W05', 'W06'];
  const orderNumbers = segments
    .filter((segment) => orderSegments.includes(segment.split('*')[0]))
    .map((segment) => segment.split('*')[2] || segment.split('*')[3] || '')
    .filter(Boolean);

  const orders = [];
  let current = null;

  segments.forEach((segment) => {
    const parts = segment.split('*');
    const tag = parts[0];

    if (tag === 'BEG') {
      if (current) orders.push(current);
      current = {
        messageType,
        orderNumber: parts[3] || '',
        orderDate: parts[5] || '',
        reference: '',
        lines: [],
      };
    }

    if (tag === 'BAK') {
      if (current) orders.push(current);
      current = {
        messageType,
        orderNumber: parts[3] || '',
        orderDate: parts[4] || '',
        reference: '',
        lines: [],
      };
    }

    if (tag === 'BSN') {
      if (current) orders.push(current);
      current = {
        messageType,
        orderNumber: parts[2] || '',
        orderDate: parts[3] || '',
        reference: '',
        lines: [],
      };
    }

    if (tag === 'W05') {
      if (current) orders.push(current);
      current = {
        messageType,
        orderNumber: parts[1] || '',
        reference: parts[2] || '',
        orderDate: '',
        lines: [],
      };
    }

    if (tag === 'W06') {
      if (current) orders.push(current);
      current = {
        messageType,
        orderNumber: parts[1] || '',
        reference: parts[2] || '',
        orderDate: '',
        lines: [],
      };
    }

    if (tag === 'REF' && current) {
      if (parts[1] === 'PO') current.reference = parts[2] || current.reference;
    }

    if (tag === 'PO1' && current) {
      current.lines.push({
        line: parts[1] || '',
        quantity: parts[2] ? Number(parts[2]) : null,
        uom: parts[3] || '',
        price: parts[4] ? Number(parts[4]) : null,
        itemCode: parts[7] || '',
      });
    }

    if (tag === 'W01' && current) {
      current.lines.push({
        line: parts[1] || '',
        quantity: parts[1] ? Number(parts[1]) : null,
        uom: parts[2] || '',
        itemCode: parts[3] || '',
      });
    }

    if (tag === 'W12' && current) {
      current.lines.push({
        line: parts[1] || '',
        quantity: parts[1] ? Number(parts[1]) : null,
        uom: parts[2] || '',
      });
    }

    if (tag === 'LIN' && current) {
      const itemCode = parts.includes('VP') ? parts[parts.indexOf('VP') + 1] : '';
      const barcode = parts.includes('EN') ? parts[parts.indexOf('EN') + 1] : '';
      current.lines.push({
        line: parts[1] || '',
        itemCode,
        barcode,
      });
    }

    if (tag === 'QTY' && current && current.lines.length) {
      const lastLine = current.lines[current.lines.length - 1];
      if (parts[1] === '33') lastLine.quantity = Number(parts[2] || 0);
    }
  });

  if (current) orders.push(current);

  return {
    messageType,
    segmentCount: segments.length,
    errors,
    orderNumbers: Array.from(new Set(orderNumbers)).slice(0, 25),
    orders: orders.slice(0, 50),
  };
};

const mapPayloadForIntegration = (integrationKey, config, flow, payload) => {
  const format = config.payloadFormat || 'WMS';

  if (integrationKey === 'sap') {
    if (format === 'SAP_ODATA') {
      if (flow === 'items') {
        return payload.map((item) => ({
          Material: item.code,
          Description: item.description,
          BaseUnit: item.unitOfMeasure || '',
          EAN: item.barcode || '',
          Weight: item.weight ?? null,
          Price: item.price ?? null,
        }));
      }
      if (flow === 'stock') {
        return payload.map((row) => ({
          Material: row.itemCode,
          Plant: config.plant || '',
          StorageLocation: config.storageLocation || '',
          LocationId: row.locationId,
          Quantity: row.quantity,
          Lot: row.lot,
          SerialNumber: row.serialNumber,
          LoadingUnitId: row.loadingUnitId,
        }));
      }
      if (flow === 'orders') {
        return payload.map((row) => ({
          OrderNumber: row.orderNumber,
          Reference: row.reference,
          OrderType: row.orderType,
          Priority: row.priority,
          TotalRows: row.totalRows,
          Description: row.description,
        }));
      }
    }

    if (format === 'SAP_IDOC') {
      if (flow === 'items') {
        return payload.map((item) => ({
          IDOC: {
            EDI_DC40: {
              IDOCTYP: 'WMSMAT',
              MESTYP: 'WMSMAT',
            },
            E1WMSMAT: {
              MATNR: item.code,
              MAKTX: item.description,
              MEINS: item.unitOfMeasure || '',
              EAN11: item.barcode || '',
              BRGEW: item.weight ?? null,
            },
          },
        }));
      }
      if (flow === 'stock') {
        return payload.map((row) => ({
          IDOC: {
            EDI_DC40: {
              IDOCTYP: 'WMSSTK',
              MESTYP: 'WMSSTK',
            },
            E1WMSSTK: {
              MATNR: row.itemCode,
              WERKS: config.plant || '',
              LGORT: config.storageLocation || row.locationId || '',
              LABST: row.quantity,
              CHARG: row.lot,
              SERNR: row.serialNumber,
            },
          },
        }));
      }
      if (flow === 'orders') {
        return payload.map((row) => ({
          IDOC: {
            EDI_DC40: {
              IDOCTYP: 'WMSORD',
              MESTYP: 'WMSORD',
            },
            E1WMSORD: {
              VBELN: row.orderNumber,
              BSART: row.orderType,
              PRIORITY: row.priority,
              TEXT1: row.description || '',
              REFNUM: row.reference || '',
            },
          },
        }));
      }
    }
  }

  if (integrationKey === 'erp' && format === 'ERP_GENERIC') {
    if (flow === 'items') {
      return payload.map((item) => ({
        item_code: item.code,
        description: item.description,
        barcode: item.barcode,
        uom: item.unitOfMeasure,
        weight: item.weight,
        price: item.price,
      }));
    }
    if (flow === 'stock') {
      return payload.map((row) => ({
        item_code: row.itemCode,
        quantity: row.quantity,
        lot: row.lot,
        serial_number: row.serialNumber,
        location_id: row.locationId,
        loading_unit_id: row.loadingUnitId,
      }));
    }
    if (flow === 'orders') {
      return payload.map((row) => ({
        order_number: row.orderNumber,
        reference: row.reference,
        order_type: row.orderType,
        priority: row.priority,
        total_rows: row.totalRows,
        description: row.description,
      }));
    }
  }

  if (integrationKey === 'erp' && format === 'ERP_ODATA') {
    if (flow === 'items') {
      return payload.map((item) => ({
        ItemCode: item.code,
        Description: item.description,
        Barcode: item.barcode,
        UnitOfMeasure: item.unitOfMeasure,
        Weight: item.weight,
        Price: item.price,
      }));
    }
    if (flow === 'stock') {
      return payload.map((row) => ({
        ItemCode: row.itemCode,
        Quantity: row.quantity,
        Lot: row.lot,
        SerialNumber: row.serialNumber,
        LocationId: row.locationId,
        LoadingUnitId: row.loadingUnitId,
      }));
    }
    if (flow === 'orders') {
      return payload.map((row) => ({
        OrderNumber: row.orderNumber,
        Reference: row.reference,
        OrderType: row.orderType,
        Priority: row.priority,
        TotalRows: row.totalRows,
        Description: row.description,
      }));
    }
  }

  if (integrationKey === 'erp' && config.mode === 'EDI_AS2') {
    const ediTypeByFlow = { items: '832', stock: '846', orders: '940' };
    const messageType = ediTypeByFlow[flow] || '846';
    return buildEdiX12({ messageType, payload });
  }

  return payload;
};

// GET /api/integrations
router.get('/', async (_req, res) => {
  try {
    await ensureTable();
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT integrationKey, enabled, updatedAt, updatedBy
      FROM IntegrationsConfig
      ORDER BY integrationKey
    `);

    res.json({
      success: true,
      data: result.recordset.map((row) => ({
        key: row.integrationKey,
        enabled: !!row.enabled,
        updatedAt: row.updatedAt,
        updatedBy: row.updatedBy,
      })),
    });
  } catch (error) {
    console.error('[GET /api/integrations] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/integrations/status
router.get('/status', async (_req, res) => {
  try {
    await ensureTable();
    await ensureLogTable();

    const keys = Object.keys(DEFAULT_CONFIGS);
    const statusData = [];

    for (const key of keys) {
      const integration = await loadIntegration(key);
      const enabled = integration?.enabled ?? false;
      const pool = await getPool();
      const logResult = await pool.request()
        .input('key', key)
        .query(`
          SELECT TOP 1 *
          FROM IntegrationSyncLog
          WHERE integrationKey = @key
          ORDER BY startedAt DESC
        `);
      const lastLog = logResult.recordset[0];
      statusData.push({
        key,
        enabled,
        updatedAt: integration?.updatedAt || null,
        updatedBy: integration?.updatedBy || null,
        lastSyncAt: lastLog?.startedAt || null,
        lastStatus: lastLog?.status || null,
        lastFlow: lastLog?.flow || null,
        lastMessage: lastLog?.message || null,
      });
    }

    res.json({ success: true, data: statusData });
  } catch (error) {
    console.error('[GET /api/integrations/status] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/integrations/logs
router.get('/logs', async (req, res) => {
  try {
    await ensureLogTable();
    const { key, limit = 50, offset = 0 } = req.query;
    const pool = await getPool();

    const request = pool.request()
      .input('limit', parseInt(limit, 10))
      .input('offset', parseInt(offset, 10));

    let whereClause = '';
    if (key) {
      request.input('key', String(key));
      whereClause = 'WHERE integrationKey = @key';
    }

    const result = await request.query(`
      SELECT *
      FROM IntegrationSyncLog
      ${whereClause}
      ORDER BY startedAt DESC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `);

    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error('[GET /api/integrations/logs] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/integrations/:key
router.get('/:key', async (req, res) => {
  try {
    const key = String(req.params.key).toLowerCase();
    await ensureTable();
    const existing = await loadIntegration(key);

    if (!existing) {
      return res.json({
        success: true,
        data: {
          key,
          enabled: false,
          config: getDefaultConfig(key),
          updatedAt: null,
          updatedBy: null,
        },
      });
    }

    res.json({
      success: true,
      data: {
        ...existing,
        config: mergeConfigs(getDefaultConfig(key), existing.config || {}),
      },
    });
  } catch (error) {
    console.error(`[GET /api/integrations/${req.params.key}] Error:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/integrations/:key
router.put('/:key', async (req, res) => {
  try {
    const key = String(req.params.key).toLowerCase();
    await ensureTable();

    const payload = req.body || {};
    const config = payload.config || payload;
    const enabled = payload.enabled ?? config?.enabled ?? false;
    const updatedBy = payload.updatedBy || req.user?.userName || 'system';

    await saveIntegration(key, enabled, config, updatedBy);
    const saved = await loadIntegration(key);

    res.json({ success: true, data: saved });
  } catch (error) {
    console.error(`[PUT /api/integrations/${req.params.key}] Error:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/integrations/:key/sync
router.post('/:key/sync', async (req, res) => {
  try {
    const key = String(req.params.key).toLowerCase();
    await ensureTable();
    await ensureLogTable();

    const existing = await loadIntegration(key);
    const mergedConfig = { ...getDefaultConfig(key), ...(existing?.config || {}) };
    const enabled = existing?.enabled ?? mergedConfig.enabled ?? false;

    if (!enabled) {
      return res.status(400).json({ success: false, error: 'Integrazione disabilitata' });
    }

    const direction = req.body?.direction || 'outbound';
    const requestedFlows = req.body?.flows;
    const flowKeys = Array.isArray(requestedFlows)
      ? requestedFlows
      : Object.keys(mergedConfig.flows || {}).filter((flow) => mergedConfig.flows[flow]);

    const results = [];

    for (const flow of flowKeys) {
      const logId = await createSyncLog(key, direction, flow);
      try {
        let payload = [];
        if (flow === 'items') payload = await loadItemsPayload();
        if (flow === 'stock') payload = await loadStockPayload();
        if (flow === 'orders') payload = await loadOrdersPayload();

        const url = buildFlowUrl(mergedConfig, flow);
        if (!url) {
          throw new Error('Endpoint non configurato');
        }

        const mappedPayload = mapPayloadForIntegration(key, mergedConfig, flow, payload);
        const requestOptions = await buildRequestOptions(key, mergedConfig);
        const isEdi = typeof mappedPayload === 'string';
        const response = await axios.post(url, mappedPayload, {
          ...requestOptions,
          headers: {
            ...(requestOptions.headers || {}),
            ...(isEdi ? { 'Content-Type': 'application/edi-x12' } : {}),
          },
          validateStatus: () => true,
        });

        const ok = response.status >= 200 && response.status < 300;
        await updateSyncLog(logId, {
          status: ok ? 'SUCCESS' : 'FAILED',
          message: ok ? 'Sync completato' : `HTTP ${response.status}`,
          recordCount: Array.isArray(payload) ? payload.length : 0,
        });

        results.push({
          flow,
          status: ok ? 'SUCCESS' : 'FAILED',
          message: ok ? 'Sync completato' : `HTTP ${response.status}`,
          recordCount: Array.isArray(payload) ? payload.length : 0,
        });
      } catch (error) {
        await updateSyncLog(logId, {
          status: 'FAILED',
          message: error.message,
          recordCount: 0,
        });
        results.push({
          flow,
          status: 'FAILED',
          message: error.message,
          recordCount: 0,
        });
      }
    }

    res.json({ success: true, data: results });
  } catch (error) {
    console.error(`[POST /api/integrations/${req.params.key}/sync] Error:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/integrations/:key/preview
router.post('/:key/preview', async (req, res) => {
  try {
    const key = String(req.params.key).toLowerCase();
    await ensureTable();

    const existing = await loadIntegration(key);
    const mergedConfig = mergeConfigs(getDefaultConfig(key), existing?.config || {});
    const flow = req.body?.flow || 'items';
    const limit = Number(req.body?.limit || 3);

    let payload = [];
    if (flow === 'items') payload = await loadItemsPayload(limit);
    if (flow === 'stock') payload = await loadStockPayload(limit);
    if (flow === 'orders') payload = await loadOrdersPayload(limit);

    const mappedPayload = mapPayloadForIntegration(key, mergedConfig, flow, payload);

    res.json({
      success: true,
      data: {
        key,
        flow,
        count: mappedPayload.length,
        payload: mappedPayload,
      },
    });
  } catch (error) {
    console.error(`[POST /api/integrations/${req.params.key}/preview] Error:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/integrations/:key/edi/export
router.post('/:key/edi/export', async (req, res) => {
  try {
    const key = String(req.params.key).toLowerCase();
    await ensureTable();

    const existing = await loadIntegration(key);
    const mergedConfig = mergeConfigs(getDefaultConfig(key), existing?.config || {});
    const flow = req.body?.flow || 'items';
    const limit = Number(req.body?.limit || 10);
    const messageType = req.body?.messageType || (flow === 'items' ? '832' : flow === 'orders' ? '940' : '846');

    let payload = [];
    if (flow === 'items') payload = await loadItemsPayload(limit);
    if (flow === 'stock') payload = await loadStockPayload(limit);
    if (flow === 'orders') payload = await loadOrdersPayload(limit);

    const ediContent = buildEdiX12({
      messageType,
      payload,
    });

    const filename = `${key}-${flow}-${new Date().toISOString().slice(0, 10)}.edi`;

    res.json({
      success: true,
      data: {
        key,
        flow,
        messageType,
        filename,
        content: ediContent,
      },
    });
  } catch (error) {
    console.error(`[POST /api/integrations/${req.params.key}/edi/export] Error:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/integrations/:key/edi/import
router.post('/:key/edi/import', async (req, res) => {
  try {
    const key = String(req.params.key).toLowerCase();
    await ensureLogTable();
    await ensureEdiInboxTable();

    const flow = req.body?.flow || 'unknown';
    const content = req.body?.content || '';
    const parsed = parseEdiX12(content);
    const logId = await createSyncLog(key, 'inbound', flow);
    await updateSyncLog(logId, {
      status: 'SUCCESS',
      message: `EDI import ${parsed.messageType || 'UNKNOWN'} (${content.length} chars, ${parsed.segmentCount} segmenti)`,
      recordCount: null,
    });

    const pool = await getPool();
    await pool.request()
      .input('integrationKey', key)
      .input('flow', flow)
      .input('messageType', parsed.messageType || null)
      .input('rawContent', content)
      .input('parsedJson', JSON.stringify(parsed))
      .query(`
        INSERT INTO IntegrationEdiInbox (integrationKey, flow, messageType, rawContent, parsedJson, receivedAt)
        VALUES (@integrationKey, @flow, @messageType, @rawContent, @parsedJson, GETDATE())
      `);

    res.json({ success: true, data: { key, flow, parsed } });
  } catch (error) {
    console.error(`[POST /api/integrations/${req.params.key}/edi/import] Error:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/integrations/:key/edi/inbox
router.get('/:key/edi/inbox', async (req, res) => {
  try {
    const key = String(req.params.key).toLowerCase();
    await ensureEdiInboxTable();

    const { limit = 50, offset = 0 } = req.query;
    const pool = await getPool();

    const result = await pool.request()
      .input('integrationKey', key)
      .input('limit', parseInt(limit, 10))
      .input('offset', parseInt(offset, 10))
      .query(`
        SELECT id, integrationKey, flow, messageType, receivedAt, appliedAt, appliedStatus, appliedMessage,
               overrideTipoLista, overrideAreaId, overrideMachineId
        FROM IntegrationEdiInbox
        WHERE integrationKey = @integrationKey
        ORDER BY receivedAt DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY
      `);

    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error(`[GET /api/integrations/${req.params.key}/edi/inbox] Error:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/integrations/:key/edi/inbox/:id
router.get('/:key/edi/inbox/:id', async (req, res) => {
  try {
    const key = String(req.params.key).toLowerCase();
    const id = parseInt(req.params.id, 10);
    await ensureEdiInboxTable();

    const pool = await getPool();
    const result = await pool.request()
      .input('integrationKey', key)
      .input('id', id)
      .query(`
        SELECT id, integrationKey, flow, messageType, rawContent, parsedJson, receivedAt, appliedAt, appliedStatus, appliedMessage,
               overrideTipoLista, overrideAreaId, overrideMachineId
        FROM IntegrationEdiInbox
        WHERE integrationKey = @integrationKey AND id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, error: 'EDI not found' });
    }

    const row = result.recordset[0];
    let parsed = null;
    try {
      parsed = row.parsedJson ? JSON.parse(row.parsedJson) : null;
    } catch {
      parsed = null;
    }

    res.json({
      success: true,
      data: {
        id: row.id,
        integrationKey: row.integrationKey,
        flow: row.flow,
        messageType: row.messageType,
        rawContent: row.rawContent,
        parsed,
        receivedAt: row.receivedAt,
        appliedAt: row.appliedAt,
        appliedStatus: row.appliedStatus,
        appliedMessage: row.appliedMessage,
        overrideTipoLista: row.overrideTipoLista,
        overrideAreaId: row.overrideAreaId,
        overrideMachineId: row.overrideMachineId,
      },
    });
  } catch (error) {
    console.error(`[GET /api/integrations/${req.params.key}/edi/inbox/:id] Error:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/integrations/:key/edi/inbox/:id/config
router.patch('/:key/edi/inbox/:id/config', async (req, res) => {
  try {
    const key = String(req.params.key).toLowerCase();
    const id = Number(req.params.id);
    const { overrideTipoLista, overrideAreaId, overrideMachineId } = req.body || {};
    await ensureEdiInboxTable();

    const pool = await getPool();
    await pool.request()
      .input('integrationKey', key)
      .input('id', id)
      .input('overrideTipoLista', overrideTipoLista ?? null)
      .input('overrideAreaId', overrideAreaId ?? null)
      .input('overrideMachineId', overrideMachineId ?? null)
      .query(`
        UPDATE IntegrationEdiInbox
        SET overrideTipoLista = @overrideTipoLista,
            overrideAreaId = @overrideAreaId,
            overrideMachineId = @overrideMachineId
        WHERE integrationKey = @integrationKey AND id = @id
      `);

    res.json({ success: true });
  } catch (error) {
    console.error(`[PATCH /api/integrations/${req.params.key}/edi/inbox/:id/config] Error:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/integrations/:key/edi/apply-errors
router.get('/:key/edi/apply-errors', async (req, res) => {
  try {
    const key = String(req.params.key).toLowerCase();
    const inboxId = Number(req.query?.inboxId);
    const { limit = 50, offset = 0, reason, itemCode, orderNumber } = req.query;
    await ensureEdiApplyErrorTable();

    if (!inboxId) {
      return res.status(400).json({ success: false, error: 'inboxId obbligatorio' });
    }

    const pool = await getPool();
    const request = pool.request()
      .input('inboxId', inboxId)
      .input('limit', parseInt(limit, 10))
      .input('offset', parseInt(offset, 10));

    const filters = ['inboxId = @inboxId'];
    if (reason) {
      request.input('reason', `%${reason}%`);
      filters.push('reason LIKE @reason');
    }
    if (itemCode) {
      request.input('itemCode', `%${itemCode}%`);
      filters.push('itemCode LIKE @itemCode');
    }
    if (orderNumber) {
      request.input('orderNumber', `%${orderNumber}%`);
      filters.push('orderNumber LIKE @orderNumber');
    }

    const whereClause = `WHERE ${filters.join(' AND ')}`;

    const result = await request.query(`
        SELECT id, inboxId, orderNumber, lineNumber, itemCode, reason, createdAt
        FROM IntegrationEdiApplyErrors
        ${whereClause}
        ORDER BY createdAt DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY
      `);

    const countResult = await request.query(`
        SELECT COUNT(*) AS total
        FROM IntegrationEdiApplyErrors
        ${whereClause}
      `);

    res.json({ success: true, data: result.recordset, total: countResult.recordset[0]?.total || 0 });
  } catch (error) {
    console.error(`[GET /api/integrations/${req.params.key}/edi/apply-errors] Error:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/integrations/:key/item-mappings
router.get('/:key/item-mappings', async (req, res) => {
  try {
    const key = String(req.params.key).toLowerCase();
    await ensureItemMapTable();
    const { limit = 50, offset = 0, search } = req.query;
    const pool = await getPool();

    const request = pool.request()
      .input('integrationKey', key)
      .input('limit', parseInt(limit, 10))
      .input('offset', parseInt(offset, 10));

    let whereClause = 'WHERE integrationKey = @integrationKey';
    if (search) {
      request.input('search', `%${search}%`);
      whereClause += ' AND (externalCode LIKE @search OR itemCode LIKE @search)';
    }

    const result = await request.query(`
      SELECT id, integrationKey, externalCode, itemId, itemCode, description, createdAt
      FROM IntegrationItemMap
      ${whereClause}
      ORDER BY createdAt DESC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `);

    const countResult = await request.query(`
      SELECT COUNT(*) AS total
      FROM IntegrationItemMap
      ${whereClause}
    `);

    res.json({ success: true, data: result.recordset, total: countResult.recordset[0]?.total || 0 });
  } catch (error) {
    console.error(`[GET /api/integrations/${req.params.key}/item-mappings] Error:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/integrations/:key/item-mappings/suggest
router.get('/:key/item-mappings/suggest', async (req, res) => {
  try {
    const key = String(req.params.key).toLowerCase();
    const { search, limit = 10 } = req.query;
    if (!search) {
      return res.status(400).json({ success: false, error: 'search obbligatorio' });
    }

    const pool = await getPool();
    const result = await pool.request()
      .input('search', `%${search}%`)
      .input('limit', parseInt(limit, 10))
      .query(`
        SELECT TOP (@limit)
          id,
          codice AS itemCode,
          descrizione AS description
        FROM Articoli
        WHERE recordCancellato = 0
          AND (codice LIKE @search OR descrizione LIKE @search OR barcode LIKE @search)
        ORDER BY codice
      `);

    res.json({
      success: true,
      data: result.recordset.map((row) => ({
        integrationKey: key,
        externalCode: search,
        itemId: row.id,
        itemCode: row.itemCode,
        description: row.description,
      })),
    });
  } catch (error) {
    console.error(`[GET /api/integrations/${req.params.key}/item-mappings/suggest] Error:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/integrations/:key/item-mappings/suggest-errors
router.get('/:key/item-mappings/suggest-errors', async (req, res) => {
  try {
    const key = String(req.params.key).toLowerCase();
    const inboxId = Number(req.query?.inboxId);
    const { limit = 10 } = req.query;
    if (!inboxId) {
      return res.status(400).json({ success: false, error: 'inboxId obbligatorio' });
    }

    const pool = await getPool();
    const errorCodesResult = await pool.request()
      .input('inboxId', inboxId)
      .input('limit', parseInt(limit, 10))
      .query(`
        SELECT DISTINCT TOP (@limit) itemCode
        FROM IntegrationEdiApplyErrors
        WHERE inboxId = @inboxId AND itemCode IS NOT NULL
        ORDER BY itemCode
      `);

    const suggestions = [];
    for (const row of errorCodesResult.recordset) {
      const externalCode = row.itemCode;
      const candidates = await pool.request()
        .input('search', `%${externalCode}%`)
        .query(`
          SELECT TOP 3 id, codice AS itemCode, descrizione AS description
          FROM Articoli
          WHERE recordCancellato = 0
            AND (codice LIKE @search OR descrizione LIKE @search OR barcode LIKE @search)
          ORDER BY codice
        `);
      candidates.recordset.forEach((candidate) => {
        suggestions.push({
          integrationKey: key,
          externalCode,
          itemId: candidate.id,
          itemCode: candidate.itemCode,
          description: candidate.description,
        });
      });
    }

    res.json({ success: true, data: suggestions });
  } catch (error) {
    console.error(`[GET /api/integrations/${req.params.key}/item-mappings/suggest-errors] Error:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/integrations/:key/item-mappings
router.post('/:key/item-mappings', async (req, res) => {
  try {
    const key = String(req.params.key).toLowerCase();
    const { externalCode, itemId, itemCode, description } = req.body || {};
    await ensureItemMapTable();

    if (!externalCode) {
      return res.status(400).json({ success: false, error: 'externalCode obbligatorio' });
    }

    const pool = await getPool();
    const request = pool.request()
      .input('integrationKey', key)
      .input('externalCode', externalCode)
      .input('itemId', itemId || null)
      .input('itemCode', itemCode || null)
      .input('description', description || null);

    await request.query(`
      MERGE IntegrationItemMap AS target
      USING (SELECT @integrationKey AS integrationKey, @externalCode AS externalCode) AS source
      ON target.integrationKey = source.integrationKey AND target.externalCode = source.externalCode
      WHEN MATCHED THEN
        UPDATE SET itemId = @itemId, itemCode = @itemCode, description = @description
      WHEN NOT MATCHED THEN
        INSERT (integrationKey, externalCode, itemId, itemCode, description, createdAt)
        VALUES (@integrationKey, @externalCode, @itemId, @itemCode, @description, GETDATE());
    `);

    res.json({ success: true });
  } catch (error) {
    console.error(`[POST /api/integrations/${req.params.key}/item-mappings] Error:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/integrations/:key/item-mappings/:id
router.delete('/:key/item-mappings/:id', async (req, res) => {
  try {
    const key = String(req.params.key).toLowerCase();
    const id = Number(req.params.id);
    await ensureItemMapTable();
    const pool = await getPool();

    await pool.request()
      .input('integrationKey', key)
      .input('id', id)
      .query('DELETE FROM IntegrationItemMap WHERE integrationKey = @integrationKey AND id = @id');

    res.json({ success: true });
  } catch (error) {
    console.error(`[DELETE /api/integrations/${req.params.key}/item-mappings/:id] Error:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/integrations/:key/edi/send
router.post('/:key/edi/send', async (req, res) => {
  try {
    const key = String(req.params.key).toLowerCase();
    await ensureTable();
    await ensureLogTable();

    const existing = await loadIntegration(key);
    const mergedConfig = mergeConfigs(getDefaultConfig(key), existing?.config || {});

    const flow = req.body?.flow || 'items';
    const limit = Number(req.body?.limit || 10);
    const messageType = req.body?.messageType || (flow === 'items' ? '832' : flow === 'orders' ? '940' : '846');
    const endpointUrl = mergedConfig.ediAs2?.endpointUrl || mergedConfig.endpointUrl;

    if (!endpointUrl) {
      return res.status(400).json({ success: false, error: 'Endpoint AS2 non configurato' });
    }

    let payload = [];
    if (flow === 'items') payload = await loadItemsPayload(limit);
    if (flow === 'stock') payload = await loadStockPayload(limit);
    if (flow === 'orders') payload = await loadOrdersPayload(limit);

    const ediContent = buildEdiX12({
      messageType,
      payload,
    });

    const logId = await createSyncLog(key, 'outbound', flow);
    const response = await axios.post(endpointUrl, ediContent, {
      headers: { 'Content-Type': 'application/edi-x12' },
      validateStatus: () => true,
    });
    const ok = response.status >= 200 && response.status < 300;
    await updateSyncLog(logId, {
      status: ok ? 'SUCCESS' : 'FAILED',
      message: ok ? `EDI ${messageType} inviato` : `HTTP ${response.status}`,
      recordCount: payload.length,
    });

    res.json({
      success: ok,
      data: { flow, messageType, status: ok ? 'SUCCESS' : 'FAILED', recordCount: payload.length },
      error: ok ? undefined : `HTTP ${response.status}`,
    });
  } catch (error) {
    console.error(`[POST /api/integrations/${req.params.key}/edi/send] Error:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/integrations/:key/test
router.post('/:key/test', async (req, res) => {
  try {
    const key = String(req.params.key).toLowerCase();
    await ensureTable();

    const payload = req.body || {};
    const config = payload.config || payload;
    const mergedConfig = { ...getDefaultConfig(key), ...config };

    if (!mergedConfig.enabled) {
      return res.status(400).json({
        success: false,
        error: 'Integrazione disabilitata',
      });
    }

    let testResult = { ok: false, message: 'Test non configurato' };

    const baseUrl = mergedConfig.baseUrl || mergedConfig.endpointUrl;
    const healthPath = mergedConfig.healthPath || '/health';

    if (key === 'sap' && mergedConfig.mode === 'ODATA' && baseUrl) {
      const url = baseUrl.replace(/\/+$/, '') + (healthPath || '/$metadata');
      const response = await axios.get(url, {
        ...(await buildRequestOptions(key, mergedConfig)),
        validateStatus: () => true,
      });
      const ok = response.status >= 200 && response.status < 300;
      testResult = {
        ok,
        message: ok ? 'OData raggiungibile' : `HTTP ${response.status}`,
      };
    } else if (key === 'erp' && mergedConfig.mode === 'ODATA' && baseUrl) {
      const servicePath = mergedConfig.odataServicePath || '';
      const url = baseUrl.replace(/\/+$/, '') + servicePath + '/$metadata';
      const response = await axios.get(url, {
        ...(await buildRequestOptions(key, mergedConfig)),
        validateStatus: () => true,
      });
      const ok = response.status >= 200 && response.status < 300;
      testResult = {
        ok,
        message: ok ? 'OData raggiungibile' : `HTTP ${response.status}`,
      };
    } else if (key === 'erp' && mergedConfig.mode === 'EDI_AS2' && mergedConfig.ediAs2?.endpointUrl) {
      const response = await axios.get(mergedConfig.ediAs2.endpointUrl, {
        validateStatus: () => true,
      });
      const ok = response.status >= 200 && response.status < 300;
      testResult = {
        ok,
        message: ok ? 'Endpoint AS2 raggiungibile' : `HTTP ${response.status}`,
      };
    } else if (baseUrl) {
      const url = baseUrl.replace(/\/+$/, '') + healthPath;
      const response = await axios.get(url, {
        ...(await buildRequestOptions(key, mergedConfig)),
        validateStatus: () => true,
      });
      const ok = response.status >= 200 && response.status < 300;
      testResult = {
        ok,
        message: ok ? 'Endpoint raggiungibile' : `HTTP ${response.status}`,
      };
    } else {
      testResult = {
        ok: false,
        message: 'Base URL mancante per test',
      };
    }

    res.json({
      success: testResult.ok,
      data: {
        key,
        message: testResult.message,
      },
    });
  } catch (error) {
    console.error(`[POST /api/integrations/${req.params.key}/test] Error:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/integrations/:key/edi/apply
router.post('/:key/edi/apply', async (req, res) => {
  try {
    const key = String(req.params.key).toLowerCase();
    const inboxId = Number(req.body?.inboxId);
    const appliedBy = req.body?.appliedBy || req.user?.userName || 'system';

    if (!inboxId) {
      return res.status(400).json({ success: false, error: 'inboxId obbligatorio' });
    }

    await ensureEdiInboxTable();
    await ensureEdiApplyErrorTable();
    await ensureEdiApplyAuditTable();
    const pool = await getPool();

    const inboxResult = await pool.request()
      .input('integrationKey', key)
      .input('id', inboxId)
      .query(`
        SELECT id, flow, messageType, parsedJson, overrideTipoLista, overrideAreaId, overrideMachineId
        FROM IntegrationEdiInbox
        WHERE integrationKey = @integrationKey AND id = @id
      `);

    if (inboxResult.recordset.length === 0) {
      return res.status(404).json({ success: false, error: 'EDI not found' });
    }

    const inbox = inboxResult.recordset[0];
    let parsed = null;
    try {
      parsed = inbox.parsedJson ? JSON.parse(inbox.parsedJson) : null;
    } catch {
      parsed = null;
    }

    if (!parsed?.orders?.length) {
      await pool.request()
        .input('id', inboxId)
        .input('status', 'FAILED')
        .input('message', 'Nessun ordine da applicare')
        .query(`
          UPDATE IntegrationEdiInbox
          SET appliedAt = GETDATE(),
              appliedStatus = @status,
              appliedMessage = @message
          WHERE id = @id
        `);
      await pool.request()
        .input('inboxId', inboxId)
        .input('appliedBy', appliedBy)
        .input('status', 'FAILED')
        .input('message', 'Nessun ordine da applicare')
        .query(`
          INSERT INTO IntegrationEdiApplyAudit (inboxId, appliedBy, appliedAt, status, message)
          VALUES (@inboxId, @appliedBy, GETDATE(), @status, @message)
        `);
      return res.status(400).json({ success: false, error: 'Nessun ordine da applicare' });
    }

    const created = [];
    const errors = [];
    const integrationConfig = await loadIntegration(key);
    const config = mergeConfigs(getDefaultConfig(key), integrationConfig?.config || {});
    const typeMap = config?.ediAs2?.messageTypeMap || {};
    const idTipoLista = inbox.overrideTipoLista || typeMap[parsed.messageType] || 1;
    const overrideAreaId = inbox.overrideAreaId || null;
    const overrideMachineId = inbox.overrideMachineId || null;

    for (const order of parsed.orders) {
      if (!order.orderNumber) {
        errors.push({ orderNumber: null, lineNumber: null, itemCode: null, reason: 'Numero ordine mancante' });
        continue;
      }
      if (!order.lines || order.lines.length === 0) {
        errors.push({ orderNumber: order.orderNumber, lineNumber: null, itemCode: null, reason: 'Nessuna riga ordine' });
        continue;
      }

      const insertListQuery = `
        INSERT INTO Liste (numLista, descrizione, rifLista, idTipoLista, priorita, terminata, recordCancellato, dataCreazione)
        OUTPUT INSERTED.id
        VALUES (@numLista, @descrizione, @rifLista, @idTipoLista, @priorita, 0, 0, GETDATE())
      `;

      const listInsert = await pool.request()
        .input('numLista', order.orderNumber || `EDI-${Date.now()}`)
        .input('descrizione', `EDI ${inbox.messageType || ''}`.trim())
        .input('rifLista', order.reference || null)
        .input('idTipoLista', idTipoLista)
        .input('priorita', 1)
        .query(insertListQuery);

      const listId = listInsert.recordset[0].id;

      for (const line of order.lines || []) {
        if (!line.itemCode) {
          errors.push({
            orderNumber: order.orderNumber,
            lineNumber: line.line || null,
            itemCode: null,
            reason: 'Codice articolo mancante',
          });
          continue;
        }
        if (!line.quantity || line.quantity <= 0) {
          errors.push({
            orderNumber: order.orderNumber,
            lineNumber: line.line || null,
            itemCode: line.itemCode,
            reason: 'Quantita non valida',
          });
          continue;
        }
        let itemId = null;
        const itemResult = await pool.request()
          .input('code', line.itemCode)
          .query('SELECT TOP 1 id FROM Articoli WHERE codice = @code');

        itemId = itemResult.recordset[0]?.id || null;

        if (!itemId) {
          await ensureItemMapTable();
          const mapResult = await pool.request()
            .input('integrationKey', key)
            .input('externalCode', line.itemCode)
            .query(`
              SELECT TOP 1 itemId, itemCode
              FROM IntegrationItemMap
              WHERE integrationKey = @integrationKey AND externalCode = @externalCode
            `);
          const mapRow = mapResult.recordset[0];
          if (mapRow?.itemId) {
            itemId = mapRow.itemId;
          } else if (mapRow?.itemCode) {
            const mappedItem = await pool.request()
              .input('code', mapRow.itemCode)
              .query('SELECT TOP 1 id FROM Articoli WHERE codice = @code');
            itemId = mappedItem.recordset[0]?.id || null;
          }
        }
        if (!itemId) {
          errors.push({
            orderNumber: order.orderNumber,
            lineNumber: line.line || null,
            itemCode: line.itemCode,
            reason: 'Articolo non trovato',
          });
          continue;
        }

        await pool.request()
          .input('idLista', listId)
          .input('numRigaLista', line.line || 1)
          .input('idProdotto', itemId)
          .input('codice', line.itemCode)
          .input('descrizione', null)
          .input('qtaRichiesta', line.quantity || 0)
          .input('qtaMovimentata', 0)
          .input('qtaPrenotata', 0)
          .query(`
            INSERT INTO RigheLista (
              idLista,
              numRigaLista,
              idProdotto,
              codice,
              descrizione,
              qtaRichiesta,
              qtaMovimentata,
              qtaPrenotata,
              recordCancellato,
              dataCreazione
            )
            VALUES (
              @idLista,
              @numRigaLista,
              @idProdotto,
              @codice,
              @descrizione,
              @qtaRichiesta,
              @qtaMovimentata,
              @qtaPrenotata,
              0,
              GETDATE()
            )
          `);
      }

      if (overrideAreaId || overrideMachineId) {
        await pool.request()
          .input('idLista', listId)
          .input('idArea', overrideAreaId)
          .input('idMacchina', overrideMachineId)
          .query(`
            IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'ListeAreaDetails')
            BEGIN
              INSERT INTO ListeAreaDetails (idLista, idArea, idMacchina)
              VALUES (@idLista, @idArea, @idMacchina)
            END
          `);
      }

      created.push({ listId, orderNumber: order.orderNumber || null });
    }

    if (errors.length > 0) {
      for (const err of errors) {
        await pool.request()
          .input('inboxId', inboxId)
          .input('orderNumber', err.orderNumber)
          .input('lineNumber', err.lineNumber)
          .input('itemCode', err.itemCode)
          .input('reason', err.reason)
          .query(`
            INSERT INTO IntegrationEdiApplyErrors (inboxId, orderNumber, lineNumber, itemCode, reason, createdAt)
            VALUES (@inboxId, @orderNumber, @lineNumber, @itemCode, @reason, GETDATE())
          `);
      }
    }

    const appliedStatus = errors.length
      ? (created.length ? 'PARTIAL' : 'FAILED')
      : 'SUCCESS';
    const appliedMessage = errors.length
      ? `Ordini creati: ${created.length}, scarti: ${errors.length}`
      : `Ordini creati: ${created.length}`;

    await pool.request()
      .input('id', inboxId)
      .input('status', appliedStatus)
      .input('message', appliedMessage)
      .query(`
        UPDATE IntegrationEdiInbox
        SET appliedAt = GETDATE(),
            appliedStatus = @status,
            appliedMessage = @message
        WHERE id = @id
      `);
    await pool.request()
      .input('inboxId', inboxId)
      .input('appliedBy', appliedBy)
      .input('status', appliedStatus)
      .input('message', appliedMessage)
      .query(`
        INSERT INTO IntegrationEdiApplyAudit (inboxId, appliedBy, appliedAt, status, message)
        VALUES (@inboxId, @appliedBy, GETDATE(), @status, @message)
      `);

    res.json({ success: true, data: { created, errors } });
  } catch (error) {
    console.error(`[POST /api/integrations/${req.params.key}/edi/apply] Error:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/integrations/:key/odata/validate
router.post('/:key/odata/validate', async (req, res) => {
  try {
    const key = String(req.params.key).toLowerCase();
    await ensureTable();

    const existing = await loadIntegration(key);
    const mergedConfig = mergeConfigs(getDefaultConfig(key), existing?.config || {});

    let metadataUrl = '';
    if (key === 'sap' && mergedConfig.mode === 'ODATA' && mergedConfig.baseUrl) {
      metadataUrl = mergedConfig.baseUrl.replace(/\/+$/, '') + '/$metadata';
    }
    if (key === 'erp' && mergedConfig.mode === 'ODATA' && mergedConfig.baseUrl) {
      const servicePath = mergedConfig.odataServicePath || '';
      metadataUrl = mergedConfig.baseUrl.replace(/\/+$/, '') + servicePath + '/$metadata';
    }

    if (!metadataUrl) {
      return res.status(400).json({ success: false, error: 'OData non configurato' });
    }

    const response = await axios.get(metadataUrl, {
      ...(await buildRequestOptions(key, mergedConfig)),
      validateStatus: () => true,
    });

    if (response.status < 200 || response.status >= 300) {
      return res.status(400).json({ success: false, error: `HTTP ${response.status}` });
    }

    const metadata = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    const entitySetMatches = [...metadata.matchAll(/EntitySet Name="([^"]+)"/g)].map((m) => m[1]);
    const entityTypeMatches = [...metadata.matchAll(/EntityType Name="([^"]+)"/g)].map((m) => m[1]);

    res.json({
      success: true,
      data: {
        url: metadataUrl,
        entitySets: entitySetMatches.slice(0, 50),
        entityTypes: entityTypeMatches.slice(0, 50),
        rawLength: metadata.length,
      },
    });
  } catch (error) {
    console.error(`[POST /api/integrations/${req.params.key}/odata/validate] Error:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/integrations/:key/odata/suggest
router.post('/:key/odata/suggest', async (req, res) => {
  try {
    const key = String(req.params.key).toLowerCase();
    await ensureTable();

    const existing = await loadIntegration(key);
    const mergedConfig = mergeConfigs(getDefaultConfig(key), existing?.config || {});

    let metadataUrl = '';
    if (key === 'sap' && mergedConfig.mode === 'ODATA' && mergedConfig.baseUrl) {
      metadataUrl = mergedConfig.baseUrl.replace(/\/+$/, '') + '/$metadata';
    }
    if (key === 'erp' && mergedConfig.mode === 'ODATA' && mergedConfig.baseUrl) {
      const servicePath = mergedConfig.odataServicePath || '';
      metadataUrl = mergedConfig.baseUrl.replace(/\/+$/, '') + servicePath + '/$metadata';
    }

    if (!metadataUrl) {
      return res.status(400).json({ success: false, error: 'OData non configurato' });
    }

    const response = await axios.get(metadataUrl, {
      ...(await buildRequestOptions(key, mergedConfig)),
      validateStatus: () => true,
    });

    if (response.status < 200 || response.status >= 300) {
      return res.status(400).json({ success: false, error: `HTTP ${response.status}` });
    }

    const metadata = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    const entitySets = [...metadata.matchAll(/EntitySet Name="([^"]+)"/g)].map((m) => m[1]);

    const pickMatch = (keywords) => {
      for (const keyword of keywords) {
        const match = entitySets.find((name) => name.toLowerCase().includes(keyword));
        if (match) return match;
      }
      return null;
    };

    const suggestions = {
      items: pickMatch(['material', 'item', 'product', 'article']),
      stock: pickMatch(['stock', 'inventory', 'warehouse', 'quant']),
      orders: pickMatch(['order', 'sales', 'delivery', 'shipment']),
    };

    res.json({ success: true, data: { entitySets, suggestions } });
  } catch (error) {
    console.error(`[POST /api/integrations/${req.params.key}/odata/suggest] Error:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
