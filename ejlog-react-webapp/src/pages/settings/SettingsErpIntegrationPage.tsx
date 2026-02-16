// ============================================================================
// EJLOG WMS - ERP Integration Settings Page
// ============================================================================

import React, { useEffect, useState } from 'react';
import { ArrowPathIcon, CheckCircleIcon, ExclamationTriangleIcon, ServerIcon } from '@heroicons/react/24/outline';
import { integrationsApi } from '../../services/integrationsApi';
import type { ErpIntegrationConfig, ErpMode, ErpPayloadFormat } from '../../types/integrations';

type TestState = 'idle' | 'testing' | 'success' | 'error';

const modeLabels: Record<ErpMode, string> = {
  REST: 'REST / JSON',
  SOAP: 'SOAP / XML',
  SFTP: 'File (SFTP)',
  ODATA: 'OData',
  EDI_AS2: 'EDI / AS2',
};

const payloadLabels: Record<ErpPayloadFormat, string> = {
  WMS: 'WMS (standard)',
  ERP_GENERIC: 'ERP Generic (snake_case)',
  ERP_ODATA: 'ERP OData',
};

const ediMessageTypes = ['832', '846', '850', '855', '856', '940', '945'];

export default function SettingsErpIntegrationPage() {
  const [draft, setDraft] = useState<ErpIntegrationConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [testState, setTestState] = useState<TestState>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [odataInfo, setOdataInfo] = useState<string | null>(null);
  const [ediContent, setEdiContent] = useState<string>('');
  const [ediStatus, setEdiStatus] = useState<string | null>(null);
  const [ediFlow, setEdiFlow] = useState<'items' | 'stock' | 'orders'>('items');
  const [ediMessageType, setEdiMessageType] = useState<string>('832');
  const [ediImport, setEdiImport] = useState('');
  const [odataSuggestions, setOdataSuggestions] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const response = await integrationsApi.getIntegration<ErpIntegrationConfig>('erp');
        if (!mounted) return;
        setDraft(response.data.config);
        setLoadError(null);
      } catch (error: any) {
        if (!mounted) return;
        setLoadError(error?.message || 'Errore caricamento integrazione ERP');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const updateField = (field: keyof ErpIntegrationConfig, value: any) => {
    setDraft((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const updateNested = (section: keyof ErpIntegrationConfig, field: string, value: any) => {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [section]: {
          ...(prev as any)[section],
          [field]: value,
        },
      };
    });
  };

  const handleSave = async () => {
    if (!draft) return;
    await integrationsApi.saveIntegration('erp', {
      enabled: draft.enabled,
      config: draft,
    });
    setLastSavedAt(new Date().toISOString());
  };

  const handleTestConnection = async () => {
    if (!draft) return;
    setTestState('testing');
    setTestMessage('Test in corso...');
    try {
      const response = await integrationsApi.testIntegration('erp', {
        enabled: draft.enabled,
        config: draft,
      });
      if (response.success) {
        setTestState('success');
        setTestMessage(response.data?.message || 'Test completato.');
        updateField('lastTestAt', new Date().toISOString());
        return;
      }
      setTestState('error');
      setTestMessage(response.error || response.data?.message || 'Test fallito.');
    } catch (error: any) {
      setTestState('error');
      setTestMessage(error?.message || 'Errore durante il test.');
    }
  };

  const handleValidateOdata = async () => {
    setOdataInfo(null);
    try {
      const response = await integrationsApi.validateOdata('erp');
      if (response.success) {
        const sets = response.data?.entitySets?.slice(0, 6) || [];
        setOdataInfo(`OK - ${sets.join(', ')}`);
      } else {
        setOdataInfo(response.error || 'OData non valido');
      }
    } catch (error: any) {
      setOdataInfo(error?.message || 'Errore validazione OData');
    }
  };

  const handleSuggestOdata = async () => {
    setOdataSuggestions(null);
    try {
      const response = await integrationsApi.suggestOdata('erp');
      if (response.success) {
        setOdataSuggestions(response.data?.suggestions || {});
      }
    } catch {
      setOdataSuggestions(null);
    }
  };

  const applyOdataSuggestions = () => {
    if (!odataSuggestions) return;
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        endpoints: {
          ...prev.endpoints,
          items: odataSuggestions.items ? `/${odataSuggestions.items}` : prev.endpoints.items,
          stock: odataSuggestions.stock ? `/${odataSuggestions.stock}` : prev.endpoints.stock,
          orders: odataSuggestions.orders ? `/${odataSuggestions.orders}` : prev.endpoints.orders,
        },
      };
    });
  };

  const handleEdiExport = async () => {
    setEdiStatus(null);
    try {
      const response = await integrationsApi.exportEdi('erp', { flow: ediFlow, limit: 10, messageType: ediMessageType });
      setEdiContent(response.data?.content || '');
      setEdiStatus('File EDI generato');
    } catch (error: any) {
      setEdiStatus(error?.message || 'Errore export EDI');
    }
  };

  const handleEdiSend = async () => {
    setEdiStatus(null);
    try {
      const response = await integrationsApi.sendEdi('erp', { flow: ediFlow, limit: 10, messageType: ediMessageType });
      setEdiStatus(response.success ? 'EDI inviato' : response.error || 'Invio fallito');
    } catch (error: any) {
      setEdiStatus(error?.message || 'Errore invio EDI');
    }
  };

  const handleEdiImport = async () => {
    setEdiStatus(null);
    try {
      const response = await integrationsApi.importEdi('erp', { flow: ediFlow, content: ediImport, messageType: ediMessageType });
      setEdiStatus(response.success ? 'EDI importato' : response.error || 'Import fallito');
    } catch (error: any) {
      setEdiStatus(error?.message || 'Errore import EDI');
    }
  };

  const updateEdiMap = (messageType: string, value: number) => {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        ediAs2: {
          ...prev.ediAs2,
          messageTypeMap: {
            ...prev.ediAs2.messageTypeMap,
            [messageType]: value,
          },
        },
      };
    });
  };

  const renderTestStatus = () => {
    if (testState === 'idle') return null;
    const isSuccess = testState === 'success';
    const Icon = isSuccess ? CheckCircleIcon : ExclamationTriangleIcon;
    const color = isSuccess ? 'text-green-600' : 'text-amber-600';
    return (
      <div className={`flex items-center gap-2 text-sm ${color}`}>
        <Icon className="h-5 w-5" />
        <span>{testMessage}</span>
      </div>
    );
  };

  const sectionClass = 'bg-white rounded-lg shadow-sm border border-gray-200 p-6';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';
  const inputClass =
    'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <ArrowPathIcon className="h-5 w-5 animate-spin" />
            Caricamento configurazione ERP...
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-red-600">
            <ExclamationTriangleIcon className="h-5 w-5" />
            {loadError}
          </div>
        </div>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto text-sm text-gray-600">
          Configurazione ERP non disponibile.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
            <ServerIcon className="h-7 w-7 text-blue-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Integrazione ERP</h1>
            <p className="text-gray-600">
              Configura lo scambio dati con ERP esterni via API o file.
            </p>
          </div>
        </div>

        <div className={sectionClass}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Stato integrazione</h2>
              <p className="text-sm text-gray-600">
                Abilita o disabilita lo scambio dati ERP.
              </p>
            </div>
            <label className="inline-flex items-center gap-2">
              <span className="text-sm text-gray-700">Attiva</span>
              <input
                type="checkbox"
                checked={draft.enabled}
                onChange={(e) => updateField('enabled', e.target.checked)}
                className="h-5 w-5 text-blue-600"
              />
            </label>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Modalita</label>
              <select
                value={draft.mode}
                onChange={(e) => updateField('mode', e.target.value as ErpMode)}
                className={inputClass}
              >
                {Object.entries(modeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Formato payload</label>
              <select
                value={draft.payloadFormat}
                onChange={(e) => updateField('payloadFormat', e.target.value as ErpPayloadFormat)}
                className={inputClass}
              >
                {Object.entries(payloadLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Base URL</label>
              <input
                type="text"
                value={draft.baseUrl}
                onChange={(e) => updateField('baseUrl', e.target.value)}
                className={inputClass}
                placeholder="https://erp.example.com/api"
              />
            </div>
            <div>
              <label className={labelClass}>Health path</label>
              <input
                type="text"
                value={draft.healthPath}
                onChange={(e) => updateField('healthPath', e.target.value)}
                className={inputClass}
                placeholder="/health"
              />
            </div>
            {draft.mode === 'ODATA' && (
              <div className="md:col-span-2">
                <label className={labelClass}>OData Service Path</label>
                <input
                  type="text"
                  value={draft.odataServicePath}
                  onChange={(e) => updateField('odataServicePath', e.target.value)}
                  className={inputClass}
                  placeholder="/odata/service"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Il test usera <code>/$metadata</code> su questo path.
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleValidateOdata}
                    className="inline-flex items-center gap-2 px-3 py-1 text-xs bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Valida metadata
                  </button>
                  <button
                    onClick={handleSuggestOdata}
                    className="inline-flex items-center gap-2 px-3 py-1 text-xs bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Suggerisci mapping
                  </button>
                  {odataSuggestions && (
                    <button
                      onClick={applyOdataSuggestions}
                      className="inline-flex items-center gap-2 px-3 py-1 text-xs bg-blue-600 text-white rounded-lg"
                    >
                      Applica suggerimenti
                    </button>
                  )}
                </div>
                {odataInfo && <p className="text-xs text-gray-500 mt-1">{odataInfo}</p>}
                {odataSuggestions && (
                  <p className="text-xs text-gray-500 mt-1">
                    Suggerimenti: items={odataSuggestions.items || '-'}, stock={odataSuggestions.stock || '-'},
                    orders={odataSuggestions.orders || '-'}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className={sectionClass}>
          <h2 className="text-lg font-semibold text-gray-900">Autenticazione</h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Tipo</label>
              <select
                value={draft.auth.type}
                onChange={(e) => updateNested('auth', 'type', e.target.value)}
                className={inputClass}
              >
                <option value="BASIC">Basic</option>
                <option value="OAUTH2">OAuth2</option>
                <option value="API_KEY">API Key</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Username</label>
              <input
                type="text"
                value={draft.auth.username}
                onChange={(e) => updateNested('auth', 'username', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Password</label>
              <input
                type="password"
                value={draft.auth.password}
                onChange={(e) => updateNested('auth', 'password', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Token URL</label>
              <input
                type="text"
                value={draft.auth.tokenUrl}
                onChange={(e) => updateNested('auth', 'tokenUrl', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Client ID</label>
              <input
                type="text"
                value={draft.auth.clientId}
                onChange={(e) => updateNested('auth', 'clientId', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Client Secret</label>
              <input
                type="password"
                value={draft.auth.clientSecret}
                onChange={(e) => updateNested('auth', 'clientSecret', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>API Key</label>
              <input
                type="text"
                value={draft.auth.apiKey}
                onChange={(e) => updateNested('auth', 'apiKey', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Header API Key</label>
              <input
                type="text"
                value={draft.auth.headerName}
                onChange={(e) => updateNested('auth', 'headerName', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Scope</label>
              <input
                type="text"
                value={draft.auth.scope}
                onChange={(e) => updateNested('auth', 'scope', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {draft.mode === 'EDI_AS2' && (
          <div className={sectionClass}>
            <h2 className="text-lg font-semibold text-gray-900">EDI / AS2</h2>
            <p className="text-sm text-gray-600 mb-4">
              Configura endpoint AS2 per scambio EDI con ERP.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelClass}>Endpoint URL</label>
                <input
                  type="text"
                  value={draft.ediAs2.endpointUrl}
                  onChange={(e) => updateNested('ediAs2', 'endpointUrl', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>AS2 ID</label>
                <input
                  type="text"
                  value={draft.ediAs2.as2Id}
                  onChange={(e) => updateNested('ediAs2', 'as2Id', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Partner ID</label>
                <input
                  type="text"
                  value={draft.ediAs2.partnerId}
                  onChange={(e) => updateNested('ediAs2', 'partnerId', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>MDN URL</label>
                <input
                  type="text"
                  value={draft.ediAs2.mdnUrl}
                  onChange={(e) => updateNested('ediAs2', 'mdnUrl', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Certificato</label>
                <textarea
                  rows={3}
                  value={draft.ediAs2.cert}
                  onChange={(e) => updateNested('ediAs2', 'cert', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Private Key</label>
                <textarea
                  rows={3}
                  value={draft.ediAs2.privateKey}
                  onChange={(e) => updateNested('ediAs2', 'privateKey', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            <div className="mt-4 border-t border-gray-200 pt-4">
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={ediFlow}
                  onChange={(e) => setEdiFlow(e.target.value as any)}
                  className="border border-gray-300 rounded-lg px-2 py-1 text-xs"
                >
                  <option value="items">items (832)</option>
                  <option value="stock">stock (846)</option>
                  <option value="orders">orders (940)</option>
                </select>
                <select
                  value={ediMessageType}
                  onChange={(e) => setEdiMessageType(e.target.value)}
                  className="border border-gray-300 rounded-lg px-2 py-1 text-xs"
                >
                  <option value="832">832 - Price/Sales Catalog</option>
                  <option value="846">846 - Inventory Inquiry</option>
                  <option value="850">850 - Purchase Order</option>
                  <option value="855">855 - PO Acknowledgment</option>
                  <option value="856">856 - ASN</option>
                  <option value="940">940 - Warehouse Shipping Order</option>
                  <option value="945">945 - Warehouse Shipping Advice</option>
                </select>
                <button
                  onClick={handleEdiExport}
                  className="px-3 py-1 text-xs rounded-lg border border-gray-300 bg-white text-gray-700"
                >
                  Genera EDI
                </button>
                <button
                  onClick={handleEdiSend}
                  className="px-3 py-1 text-xs rounded-lg border border-gray-300 bg-white text-gray-700"
                >
                  Invia AS2
                </button>
                <button
                  onClick={handleEdiImport}
                  className="px-3 py-1 text-xs rounded-lg border border-gray-300 bg-white text-gray-700"
                >
                  Importa EDI
                </button>
                {ediStatus && <span className="text-xs text-gray-500">{ediStatus}</span>}
              </div>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600">Contenuto generato</label>
                  <textarea
                    rows={6}
                    value={ediContent}
                    onChange={(e) => setEdiContent(e.target.value)}
                    className={inputClass}
                    placeholder="EDI generato..."
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Importa contenuto</label>
                  <textarea
                    rows={6}
                    value={ediImport}
                    onChange={(e) => setEdiImport(e.target.value)}
                    className={inputClass}
                    placeholder="Incolla EDI qui..."
                  />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Mapping idTipoLista</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {ediMessageTypes.map((mt) => (
                    <label key={mt} className="text-xs text-gray-700 flex flex-col gap-1">
                      {mt}
                      <input
                        type="number"
                        value={draft.ediAs2.messageTypeMap?.[mt] ?? 1}
                        onChange={(e) => updateEdiMap(mt, Number(e.target.value))}
                        className="border border-gray-300 rounded-lg px-2 py-1 text-xs"
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className={sectionClass}>
          <h2 className="text-lg font-semibold text-gray-900">Endpoint ERP</h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(draft.endpoints).map(([key, value]) => (
              <div key={key}>
                <label className={labelClass}>{key}</label>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => updateNested('endpoints', key, e.target.value)}
                  className={inputClass}
                />
              </div>
            ))}
          </div>
        </div>

        <div className={sectionClass}>
          <h2 className="text-lg font-semibold text-gray-900">Flussi attivi</h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(draft.flows).map(([key, value]) => (
              <label key={key} className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => updateNested('flows', key, e.target.checked)}
                  className="h-4 w-4 text-blue-600"
                />
                <span>{key}</span>
              </label>
            ))}
          </div>
        </div>

        <div className={sectionClass}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              {renderTestStatus()}
              {draft.lastTestAt && (
                <p className="text-xs text-gray-500">
                  Ultimo test: {new Date(draft.lastTestAt).toLocaleString('it-IT')}
                </p>
              )}
              {lastSavedAt && (
                <p className="text-xs text-gray-500">
                  Ultimo salvataggio: {new Date(lastSavedAt).toLocaleString('it-IT')}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleTestConnection}
                disabled={testState === 'testing'}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <ArrowPathIcon className={`h-5 w-5 ${testState === 'testing' ? 'animate-spin' : ''}`} />
                Test connessione
              </button>
              <button
                onClick={handleSave}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Salva configurazione
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
