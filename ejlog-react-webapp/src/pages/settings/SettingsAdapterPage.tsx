// ============================================================================
// EJLOG WMS - Adapter Settings Page
// Configurazione dell'Adapter .NET integrato
// ============================================================================

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import {
  Settings,
  Server,
  CheckCircle,
  XCircle,
  RefreshCw,
  Save,
  TestTube,
  Activity,
  Clock,
  Copy,
} from 'lucide-react';
import { selectSettings, setExternalMasHost } from '../../features/settings/settingsSlice';

// ============================================================================
// TYPES
// ============================================================================

interface AdapterConfig {
  adapterPort: number;
  adapterHost: string;
  adapterBaseUrl: string;
  enabled: boolean;
  healthCheckInterval: number;
  timeout: number;
  healthy?: boolean;
  lastHealthCheck?: string;
}

interface NetworkInfo {
  localIP: string;
  networkName: string;
  externalURL: string;
  localURL: string;
}

interface AdapterStatus {
  healthy: boolean;
  url: string;
  version: string | null;
  lastCheck: string | null;
  error: string | null;
  enabled: boolean;
  network?: NetworkInfo;
}

const STANDALONE_ADAPTER_PORT = 10000;
const INTEGRATED_ADAPTER_PORT = 7077;

const getStandaloneHost = () => {
  if (typeof window !== 'undefined' && window.location?.hostname) {
    return window.location.hostname;
  }
  return 'localhost';
};

const buildExternalMasUrl = (rawHost?: string): string | null => {
  const trimmed = rawHost?.trim();
  if (!trimmed) return null;
  const hasScheme = /^https?:\/\//i.test(trimmed);
  const normalized = hasScheme ? trimmed : `http://${trimmed}`;

  try {
    const url = new URL(normalized);
    if (!url.port) {
      url.port = INTEGRATED_ADAPTER_PORT.toString();
    }
    return url.toString().replace(/\/$/, '');
  } catch {
    if (hasScheme) {
      return normalized;
    }
    return trimmed.includes(':')
      ? normalized
      : `http://${trimmed}:${INTEGRATED_ADAPTER_PORT}`;
  }
};

// ============================================================================
// COMPONENT
// ============================================================================

const SettingsAdapterPage: React.FC = () => {
  const adapterHost = getStandaloneHost();
  const standaloneBaseUrl = `http://${adapterHost}:${STANDALONE_ADAPTER_PORT}`;
  const integratedBaseUrl = `http://${adapterHost}:${INTEGRATED_ADAPTER_PORT}`;
  const [config, setConfig] = useState<AdapterConfig>({
    adapterPort: INTEGRATED_ADAPTER_PORT,
    adapterHost: adapterHost,
    adapterBaseUrl: integratedBaseUrl,
    enabled: true,
    healthCheckInterval: 30000,
    timeout: 10000,
  });

  const [status, setStatus] = useState<AdapterStatus | null>(null);
  const [standaloneStatus, setStandaloneStatus] = useState<AdapterStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testingStandalone, setTestingStandalone] = useState(false);
  const [copyingMasUrl, setCopyingMasUrl] = useState(false);
  const dispatch = useDispatch();
  const settings = useSelector(selectSettings);
  const externalMasHost = settings.externalMasHost || '';
  const externalMasUrl = buildExternalMasUrl(externalMasHost);
  const preferredMasUrl =
    externalMasUrl || standaloneStatus?.network?.externalURL || standaloneBaseUrl;

  // ============================================
  // LOAD CONFIGURATION
  // ============================================

  const loadConfig = async () => {
    try {
      setLoading(true);

      // Adapter integrato su porta 7077 (backend)
      setConfig({
        adapterPort: INTEGRATED_ADAPTER_PORT,
        adapterHost: adapterHost,
        adapterBaseUrl: integratedBaseUrl,
        enabled: true,
        healthCheckInterval: 30000,
        timeout: 10000,
      });

    } catch (error) {
      console.error('Errore caricamento configurazione adapter:', error);
      toast.error('Errore nel caricamento della configurazione');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // LOAD STATUS
  // ============================================

  const loadStatus = async () => {
    try {
      // Test health check adapter standalone (porta 1000) - include network info
      const response = await fetch(`${standaloneBaseUrl}/health`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const health = await response.json();

      setStandaloneStatus({
        healthy: true,
        url: standaloneBaseUrl,
        version: health.service || '2.3.12.4-node-standalone',
        lastCheck: new Date().toISOString(),
        error: null,
        enabled: true,
        network: health.network || undefined,
      });
    } catch (error: any) {
      console.error('Errore caricamento stato adapter standalone:', error);
      setStandaloneStatus({
        healthy: false,
        url: standaloneBaseUrl,
        version: null,
        lastCheck: new Date().toISOString(),
        error: error.message,
        enabled: true,
      });
    }

    // Mantieni anche il check dell'adapter integrato su 7077
    try {
      const response = await fetch(`${integratedBaseUrl}/api/adapter/version`);
      if (response.ok) {
        const version = await response.text();
        setStatus({
          healthy: true,
          url: `${integratedBaseUrl}/api/adapter`,
          version: version,
          lastCheck: new Date().toISOString(),
          error: null,
          enabled: true,
        });
      }
    } catch (error: any) {
      setStatus({
        healthy: false,
        url: `${integratedBaseUrl}/api/adapter`,
        version: null,
        lastCheck: new Date().toISOString(),
        error: error.message,
        enabled: true,
      });
    }
  };

  // ============================================
  // SAVE CONFIGURATION
  // ============================================

  const handleSave = async () => {
    try {
      setSaving(true);

      // L'adapter Ã¨ ora integrato - configurazione fissa
      toast.success('Adapter integrato - configurazione automatica!');

      await loadStatus();
    } catch (error: any) {
      console.error('Errore salvataggio configurazione:', error);
      toast.error('Errore nel salvataggio della configurazione');
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // TEST CONNECTION
  // ============================================

  const handleTest = async () => {
    try {
      setTesting(true);

      // Test diretto all'adapter integrato
      const response = await fetch(`${integratedBaseUrl}/api/adapter/version`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const version = await response.text();
      toast.success(`âœ… Adapter Integrato Online! Versione: ${version}`);

      await loadStatus();
    } catch (error: any) {
      console.error('Errore test connessione:', error);
      toast.error(`âŒ Test fallito: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  // Test adapter standalone (porta 1000)
  const handleTestStandalone = async () => {
    try {
      setTestingStandalone(true);

      // Test health check
      const response = await fetch(`${standaloneBaseUrl}/health`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const health = await response.json();

      if (health.success && health.status === 'healthy') {
        toast.success(`âœ… Adapter Standalone Online!\nðŸ“¡ Porta: ${health.port}\nâ± Uptime: ${Math.floor(health.uptime)}s`);
      } else {
        throw new Error('Health check failed');
      }

      await loadStatus();
    } catch (error: any) {
      console.error('Errore test adapter standalone:', error);
      toast.error(`âŒ Adapter Standalone non raggiungibile: ${error.message}`);
    } finally {
      setTestingStandalone(false);
    }
  };

  // ============================================
  // EFFECTS
  // ============================================

  const handleCopyMasUrl = async () => {
    if (!externalMasUrl) {
      toast.error("Configurare prima l'IP esterno");
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      toast.error('Clipboard non disponibile');
      return;
    }

    try {
      setCopyingMasUrl(true);
      await navigator.clipboard.writeText(externalMasUrl);
      toast.success('URL MAS esterno copiato');
    } catch (error) {
      console.error('Errore copia URL MAS:', error);
      toast.error("Impossibile copiare l'URL");
    } finally {
      setCopyingMasUrl(false);
    }
  };

  useEffect(() => {
    loadConfig();
    loadStatus();

    // Auto-refresh status ogni 30 secondi
    const interval = setInterval(loadStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  // ============================================
  // RENDER
  // ============================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Server className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configurazione Adapter</h1>
            <p className="text-sm text-gray-500">
              Gestisci le impostazioni dell'adapter .NET EjLog
            </p>
          </div>
        </div>

        {/* Status Badge */}
        {status && (
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              status.healthy
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {status.healthy ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            <span className="font-medium">
              {status.healthy ? 'Adapter Online' : 'Adapter Offline'}
            </span>
          </div>
        )}
      </div>

      {/* Adapter Standalone Status Card - PORTA 1000 */}
      {standaloneStatus && (
        <div className="bg-white rounded-lg shadow-sm border-2 border-blue-300 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Server className="w-5 h-5 text-blue-600" />
              Adapter Standalone - Porta {STANDALONE_ADAPTER_PORT} (Per PPC)
            </h2>
            <div className="flex gap-2">
              <button
                onClick={handleTestStandalone}
                disabled={testingStandalone}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors disabled:bg-gray-400"
              >
                <TestTube className="w-4 h-4" />
                {testingStandalone ? 'Testing...' : 'Test Health'}
              </button>
              <button
                onClick={loadStatus}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Aggiorna
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">URL Locale</div>
              <div className="font-mono text-sm text-blue-600 font-bold">
                {standaloneStatus.network?.localURL || standaloneBaseUrl}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500">URL Esterno (PPC)</div>
              <div className="font-mono text-sm text-blue-600 font-bold">
                {preferredMasUrl}
              </div>
            </div>

            {standaloneStatus.network && (
              <>
                <div>
                  <div className="text-sm text-gray-500">IP Scheda di Rete</div>
                  <div className="font-mono text-sm text-green-600 font-bold flex items-center gap-1">
                    ðŸ–§ {standaloneStatus.network.localIP}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-500">Interfaccia di Rete</div>
                  <div className="font-mono text-sm text-gray-900">
                    {standaloneStatus.network.networkName}
                  </div>
                </div>
              </>
            )}

            <div>
              <div className="text-sm text-gray-500">Versione</div>
              <div className="font-mono text-sm text-gray-900">
                {standaloneStatus.version || 'N/A'}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500">Stato</div>
              <div
                className={`text-sm font-medium flex items-center gap-1 ${
                  standaloneStatus.healthy ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {standaloneStatus.healthy ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Online
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    Offline
                  </>
                )}
              </div>
            </div>

            <div className="col-span-2">
              <div className="text-sm text-gray-500 mb-2">Endpoint Health Check</div>
              <code className="bg-blue-50 text-blue-700 px-3 py-2 rounded block text-sm">
                GET {preferredMasUrl}/health
              </code>
            </div>

            {standaloneStatus.error && (
              <div className="col-span-2">
                <div className="text-sm text-gray-500">Errore</div>
                <div className="text-sm text-red-600 font-mono">{standaloneStatus.error}</div>
              </div>
            )}
          </div>

          {/* Info box */}
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="font-medium text-blue-900 text-sm mb-1">Collegamento PPC</h4>
            <ul className="text-xs text-blue-800 space-y-1 list-disc pl-4">
              <li>
                Configura il PPC per connettersi a <code className="bg-blue-100 px-1 rounded">{preferredMasUrl}</code>
              </li>
              <li>
                Health check: <code className="bg-blue-100 px-1 rounded">GET {preferredMasUrl}/health</code>
              </li>
              <li>
                API Items: <code className="bg-blue-100 px-1 rounded">GET {preferredMasUrl}/api/items</code>
              </li>
              <li>
                API Lists: <code className="bg-blue-100 px-1 rounded">GET {preferredMasUrl}/api/lists</code>
              </li>
              {standaloneStatus.network && (
                <li className="text-green-700 font-medium">
                  IP rilevato automaticamente dalla scheda di rete: {standaloneStatus.network.localIP}
                </li>
              )}
              {externalMasHost && (
                <li className="text-blue-700 font-medium">
                  Override manuale: {externalMasHost} punta a {preferredMasUrl}
                </li>
              )}
            </ul>
          </div>

        </div>
      )}

      {/* Status Card - Adapter Integrato */}
      {status && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Adapter Integrato - Porta 7077 (Backend)
            </h2>
            <button
              onClick={loadStatus}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Aggiorna
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">URL Adapter</div>
              <div className="font-mono text-sm text-gray-900">{status.url}</div>
            </div>

            <div>
              <div className="text-sm text-gray-500">Versione</div>
              <div className="font-mono text-sm text-gray-900">
                {status.version || 'N/A'}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500">Ultimo Check</div>
              <div className="text-sm text-gray-900">
                {status.lastCheck
                  ? new Date(status.lastCheck).toLocaleString('it-IT')
                  : 'N/A'}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500">Stato</div>
              <div
                className={`text-sm font-medium ${
                  status.healthy ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {status.healthy ? 'Connesso' : 'Disconnesso'}
              </div>
            </div>

            {status.error && (
              <div className="col-span-2">
                <div className="text-sm text-gray-500">Errore</div>
                <div className="text-sm text-red-600 font-mono">{status.error}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Configuration Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Configurazione Connessione
        </h2>

        <div className="space-y-4">
          {/* Enabled */}
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Adapter Abilitato
              </label>
              <p className="text-sm text-gray-500">
                Abilita o disabilita l'adapter
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) =>
                  setConfig({ ...config, enabled: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Host */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Host Adapter (Integrato)
            </label>
            <input
              type="text"
              value={config.adapterHost}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
              placeholder="localhost"
            />
            <p className="mt-1 text-sm text-green-600">
              âœ… Adapter integrato nel backend Node.js
            </p>
          </div>

          {/* Port */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Porta Adapter (Integrato)
            </label>
            <input
              type="number"
              value={config.adapterPort}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
            />
            <p className="mt-1 text-sm text-green-600">
              âœ… Porta 7077 - stesso backend del progetto React
            </p>
          </div>

          {/* Health Check Interval */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Intervallo Health Check (ms)
            </label>
            <input
              type="number"
              value={config.healthCheckInterval}
              onChange={(e) =>
                setConfig({
                  ...config,
                  healthCheckInterval: parseInt(e.target.value) || 30000,
                })
              }
              min={5000}
              max={300000}
              step={1000}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Frequenza di controllo dello stato (default: 30000ms = 30s)
            </p>
          </div>

          {/* Timeout */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Timeout Connessione (ms)
            </label>
            <input
              type="number"
              value={config.timeout}
              onChange={(e) =>
                setConfig({ ...config, timeout: parseInt(e.target.value) || 10000 })
              }
              min={1000}
              max={60000}
              step={1000}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Timeout massimo per le richieste (default: 10000ms = 10s)
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Host/IP MAS Esterno
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={externalMasHost}
                onChange={(e) => dispatch(setExternalMasHost(e.target.value))}
                placeholder="es. 213.82.68.18 o mas.dominio.it"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                disabled={!externalMasUrl || copyingMasUrl}
                onClick={handleCopyMasUrl}
                className="flex items-center gap-1 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:cursor-not-allowed disabled:bg-gray-200"
              >
                <Copy className="w-4 h-4" />
                {copyingMasUrl ? 'Copia...' : 'Copia URL'}
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Inserisci il DNS/IP pubblico da cui il MAS esterno sarÃ  raggiungibile
              (aggiunge automaticamente porta 7077 se mancante).
            </p>
            {externalMasUrl && (
              <div className="text-xs text-blue-600 font-mono bg-blue-50 px-2 py-1 rounded-md">
                URL generato: {externalMasUrl}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Salvataggio...' : 'Salva Configurazione'}
          </button>

          <button
            onClick={handleTest}
            disabled={testing}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <TestTube className="w-4 h-4" />
            {testing ? 'Testing...' : 'Test Connessione'}
          </button>
        </div>
      </div>

      {/* Info Card - Adapter Standalone */}
      <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">ðŸš€ Adapter Standalone - Porta {STANDALONE_ADAPTER_PORT}</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>â€¢ <strong>Server dedicato per PPC</strong> sulla porta {STANDALONE_ADAPTER_PORT}</li>
          <li>â€¢ <strong>Accessibile da dispositivi esterni</strong> (IP rilevato automaticamente)</li>
          <li>â€¢ Avvio: <code className="bg-blue-100 px-1 rounded">npm run start:adapter</code></li>
          <li>â€¢ Health Check: <code className="bg-blue-100 px-1 rounded">GET /health</code></li>
          <li>â€¢ CORS abilitato per tutti gli origin (PPC-friendly)</li>
          <li>â€¢ Tutte le API adapter disponibili su porte /api/* e root /*</li>
        </ul>
      </div>

      {/* Info Card - Adapter Integrato */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-medium text-green-900 mb-2">âœ… Adapter Integrato - Porta 7077</h3>
        <ul className="text-sm text-green-800 space-y-1">
          <li>â€¢ <strong>L'adapter Ã¨ completamente integrato</strong> nel backend Node.js</li>
          <li>â€¢ <strong>Non serve piÃ¹ avviare l'adapter .NET</strong> separatamente</li>
          <li>â€¢ Tutte le API sono disponibili su <code className="bg-green-100 px-1 rounded">{integratedBaseUrl}/api/adapter/*</code></li>
          <li>â€¢ Si avvia automaticamente con <code className="bg-green-100 px-1 rounded">npm start</code></li>
          <li>â€¢ Database JSON integrato con tutti i dati</li>
          <li>â€¢ 60+ API endpoints replicati dall'adapter .NET originale</li>
        </ul>
      </div>

      {/* API Examples Card - Standalone */}
      {standaloneStatus && (
        <div className="bg-gray-50 border-2 border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">ðŸ“¡ Esempi API - Adapter Standalone (Porta {STANDALONE_ADAPTER_PORT})</h3>
          {standaloneStatus.network && (
            <div className="mb-3 text-xs text-green-700 bg-green-50 px-2 py-1 rounded">
              âœ… IP rilevato: <strong>{standaloneStatus.network.localIP}</strong> ({standaloneStatus.network.networkName})
            </div>
          )}
          <div className="space-y-2 text-sm text-gray-700">
            <div>
              <code className="bg-blue-50 text-blue-700 px-2 py-1 rounded block">
                GET {preferredMasUrl}/health
              </code>
              <span className="text-xs text-gray-500">Health check (da PPC)</span>
            </div>
            <div>
              <code className="bg-blue-50 text-blue-700 px-2 py-1 rounded block">
                GET {preferredMasUrl}/api/version
              </code>
              <span className="text-xs text-gray-500">Versione adapter</span>
            </div>
            <div>
              <code className="bg-blue-50 text-blue-700 px-2 py-1 rounded block">
                GET {preferredMasUrl}/api/items
              </code>
              <span className="text-xs text-gray-500">Lista articoli</span>
            </div>
            <div>
              <code className="bg-blue-50 text-blue-700 px-2 py-1 rounded block">
                GET {preferredMasUrl}/api/lists
              </code>
              <span className="text-xs text-gray-500">Liste di lavoro</span>
            </div>
          </div>
        </div>
      )}

      {/* API Examples Card - Integrato */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-2">ðŸ“¡ Esempi API - Adapter Integrato (Porta 7077)</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <div>
            <code className="bg-gray-100 px-2 py-1 rounded block">GET /api/adapter/version</code>
            <span className="text-xs text-gray-500">Versione adapter</span>
          </div>
          <div>
            <code className="bg-gray-100 px-2 py-1 rounded block">GET /api/adapter/items</code>
            <span className="text-xs text-gray-500">Lista articoli</span>
          </div>
          <div>
            <code className="bg-gray-100 px-2 py-1 rounded block">GET /api/adapter/item-lists</code>
            <span className="text-xs text-gray-500">Lista delle liste</span>
          </div>
          <div>
            <code className="bg-gray-100 px-2 py-1 rounded block">POST /api/adapter/items/:id/pick</code>
            <span className="text-xs text-gray-500">Operazione Pick</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsAdapterPage;



