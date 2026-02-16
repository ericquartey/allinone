/**
 * EjLog Adapter Server - Node.js Proxy per EjLog .NET Adapter
 *
 * Questo server Node.js fa da proxy verso l'adapter .NET Core (C#) originale.
 * Permette di configurare la porta dell'adapter dall'interfaccia React
 * e gestisce health check e monitoring.
 */

import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ============================================
// CONFIGURATION
// ============================================

const CONFIG_FILE = path.join(__dirname, 'config', 'adapter-config.json');
const DEFAULT_CONFIG = {
  adapterPort: 10000,
  adapterHost: 'localhost',
  adapterBaseUrl: null, // Costruito dinamicamente
  enabled: true,
  healthCheckInterval: 30000, // 30 secondi
  timeout: 10000, // 10 secondi
};

let config = { ...DEFAULT_CONFIG };

// Carica configurazione salvata
function loadConfig() {
  try {
    if (existsSync(CONFIG_FILE)) {
      const savedConfig = JSON.parse(readFileSync(CONFIG_FILE, 'utf8'));
      config = { ...DEFAULT_CONFIG, ...savedConfig };
    }
  } catch (error) {
    console.error('[ADAPTER SERVER] Errore caricamento configurazione:', error.message);
  }

  // Costruisci URL base adapter
  config.adapterBaseUrl = `http://${config.adapterHost}:${config.adapterPort}`;
  console.log(`[ADAPTER SERVER] Configurazione caricata: ${config.adapterBaseUrl}`);

  return config;
}

// Salva configurazione
function saveConfig(newConfig) {
  try {
    const configDir = path.dirname(CONFIG_FILE);
    if (!existsSync(configDir)) {
      import('fs').then(fs => fs.mkdirSync(configDir, { recursive: true }));
    }

    config = { ...config, ...newConfig };
    config.adapterBaseUrl = `http://${config.adapterHost}:${config.adapterPort}`;

    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
    console.log('[ADAPTER SERVER] Configurazione salvata:', config);

    return config;
  } catch (error) {
    console.error('[ADAPTER SERVER] Errore salvataggio configurazione:', error.message);
    throw error;
  }
}

loadConfig();

// ============================================
// MIDDLEWARE
// ============================================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`[ADAPTER SERVER] ${req.method} ${req.path}`);
  next();
});

// ============================================
// HEALTH CHECK
// ============================================

let adapterHealthy = false;
let lastHealthCheck = null;
let healthCheckError = null;

async function checkAdapterHealth() {
  try {
    const response = await fetch(`${config.adapterBaseUrl}/api/version`, {
      method: 'GET',
      signal: AbortSignal.timeout(config.timeout),
    });

    if (response.ok) {
      const version = await response.text();
      adapterHealthy = true;
      lastHealthCheck = new Date();
      healthCheckError = null;
      console.log(`[ADAPTER SERVER] Health check OK - Adapter version: ${version}`);
      return { healthy: true, version };
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    adapterHealthy = false;
    lastHealthCheck = new Date();
    healthCheckError = error.message;
    console.error(`[ADAPTER SERVER] Health check FAILED: ${error.message}`);
    return { healthy: false, error: error.message };
  }
}

// Health check periodico
if (config.enabled) {
  setInterval(checkAdapterHealth, config.healthCheckInterval);
  // Prima esecuzione immediata
  checkAdapterHealth();
}

// ============================================
// API ENDPOINTS
// ============================================

// GET /health - Health check endpoint
app.get('/health', async (req, res) => {
  const adapterHealth = await checkAdapterHealth();

  res.json({
    status: adapterHealth.healthy ? 'healthy' : 'unhealthy',
    adapter: {
      healthy: adapterHealth.healthy,
      url: config.adapterBaseUrl,
      version: adapterHealth.version || null,
      lastCheck: lastHealthCheck,
      error: healthCheckError,
    },
    server: {
      port: PORT,
      uptime: process.uptime(),
      timestamp: new Date(),
    },
  });
});

// GET /api/adapter/config - Ottieni configurazione adapter
app.get('/api/adapter/config', (req, res) => {
  res.json({
    success: true,
    config: {
      adapterPort: config.adapterPort,
      adapterHost: config.adapterHost,
      adapterBaseUrl: config.adapterBaseUrl,
      enabled: config.enabled,
      healthCheckInterval: config.healthCheckInterval,
      timeout: config.timeout,
      healthy: adapterHealthy,
      lastHealthCheck,
    },
  });
});

// PUT /api/adapter/config - Aggiorna configurazione adapter
app.put('/api/adapter/config', (req, res) => {
  try {
    const { adapterPort, adapterHost, enabled, healthCheckInterval, timeout } = req.body;

    const newConfig = {};

    if (adapterPort !== undefined) {
      if (typeof adapterPort !== 'number' || adapterPort < 1 || adapterPort > 65535) {
        return res.status(400).json({
          success: false,
          error: 'Porta non valida. Deve essere tra 1 e 65535.',
        });
      }
      newConfig.adapterPort = adapterPort;
    }

    if (adapterHost !== undefined) {
      newConfig.adapterHost = adapterHost;
    }

    if (enabled !== undefined) {
      newConfig.enabled = Boolean(enabled);
    }

    if (healthCheckInterval !== undefined) {
      newConfig.healthCheckInterval = healthCheckInterval;
    }

    if (timeout !== undefined) {
      newConfig.timeout = timeout;
    }

    const updatedConfig = saveConfig(newConfig);

    // Riavvia health check con nuova configurazione
    checkAdapterHealth();

    res.json({
      success: true,
      message: 'Configurazione aggiornata con successo',
      config: updatedConfig,
    });
  } catch (error) {
    console.error('[ADAPTER SERVER] Errore aggiornamento config:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/adapter/status - Stato adapter
app.get('/api/adapter/status', async (req, res) => {
  const health = await checkAdapterHealth();

  res.json({
    success: true,
    status: {
      healthy: health.healthy,
      url: config.adapterBaseUrl,
      version: health.version || null,
      lastCheck: lastHealthCheck,
      error: healthCheckError,
      enabled: config.enabled,
    },
  });
});

// POST /api/adapter/test - Test connessione adapter
app.post('/api/adapter/test', async (req, res) => {
  const { adapterPort, adapterHost } = req.body;

  const testUrl = `http://${adapterHost || config.adapterHost}:${adapterPort || config.adapterPort}`;

  try {
    const response = await fetch(`${testUrl}/api/version`, {
      method: 'GET',
      signal: AbortSignal.timeout(config.timeout),
    });

    if (response.ok) {
      const version = await response.text();
      res.json({
        success: true,
        message: 'Connessione riuscita',
        version,
        url: testUrl,
      });
    } else {
      res.status(response.status).json({
        success: false,
        error: `HTTP ${response.status}`,
        url: testUrl,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      url: testUrl,
    });
  }
});

// ============================================
// PROXY TO .NET ADAPTER
// ============================================

// Proxy middleware per tutte le chiamate /api/adapter/*
const adapterProxy = createProxyMiddleware({
  target: () => config.adapterBaseUrl,
  changeOrigin: true,
  pathRewrite: {
    '^/api/adapter': '/api', // Rimuove /adapter dal path
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[ADAPTER PROXY] → ${req.method} ${config.adapterBaseUrl}${req.path.replace('/api/adapter', '/api')}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`[ADAPTER PROXY] ← ${proxyRes.statusCode} ${req.path}`);
  },
  onError: (err, req, res) => {
    console.error(`[ADAPTER PROXY] ERROR: ${err.message}`);
    res.status(502).json({
      success: false,
      error: 'Errore di comunicazione con l\'adapter',
      message: err.message,
      adapterUrl: config.adapterBaseUrl,
    });
  },
});

// Monta il proxy solo se l'adapter è abilitato
app.use('/api/adapter', (req, res, next) => {
  if (!config.enabled) {
    return res.status(503).json({
      success: false,
      error: 'Adapter disabilitato',
      message: 'L\'adapter è attualmente disabilitato nella configurazione',
    });
  }

  if (!adapterHealthy) {
    return res.status(503).json({
      success: false,
      error: 'Adapter non disponibile',
      message: 'L\'adapter non risponde agli health check',
      lastCheck: lastHealthCheck,
      adapterUrl: config.adapterBaseUrl,
    });
  }

  adapterProxy(req, res, next);
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint non trovato',
    path: req.path,
  });
});

app.use((err, req, res, next) => {
  console.error('[ADAPTER SERVER] Error:', err);
  res.status(500).json({
    success: false,
    error: 'Errore interno del server',
    message: err.message,
  });
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.ADAPTER_PORT || 10000;

const server = app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🚀 EJLOG ADAPTER SERVER - STARTED');
  console.log('='.repeat(60));
  console.log(`📡 Server listening on:        http://localhost:${PORT}`);
  console.log(`🔌 .NET Adapter target:        ${config.adapterBaseUrl}`);
  console.log(`✅ Adapter enabled:            ${config.enabled}`);
  console.log(`💚 Health check interval:      ${config.healthCheckInterval}ms`);
  console.log('='.repeat(60));
  console.log('');
  console.log('📋 Available endpoints:');
  console.log(`   GET  /health                  - Server health check`);
  console.log(`   GET  /api/adapter/config      - Get adapter configuration`);
  console.log(`   PUT  /api/adapter/config      - Update adapter configuration`);
  console.log(`   GET  /api/adapter/status      - Get adapter status`);
  console.log(`   POST /api/adapter/test        - Test adapter connection`);
  console.log(`   ALL  /api/adapter/*           - Proxy to .NET adapter`);
  console.log('='.repeat(60));
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[ADAPTER SERVER] SIGTERM received, closing server...');
  server.close(() => {
    console.log('[ADAPTER SERVER] Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[ADAPTER SERVER] SIGINT received, closing server...');
  server.close(() => {
    console.log('[ADAPTER SERVER] Server closed');
    process.exit(0);
  });
});

export default app;
