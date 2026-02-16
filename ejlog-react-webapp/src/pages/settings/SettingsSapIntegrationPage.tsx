// ============================================================================
// EJLOG WMS - SAP Integration Settings Page
// Configurazione integrazione SAP (S/4HANA, ECC) con canali piu comuni
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ServerIcon,
} from '@heroicons/react/24/outline';
import { integrationsApi } from '../../services/integrationsApi';
import type { SapIntegrationConfig, SapIntegrationMode, SapPayloadFormat } from '../../types/integrations';

type TestState = 'idle' | 'testing' | 'success' | 'error';

const modeLabels: Record<SapIntegrationMode, string> = {
  ODATA: 'OData / REST',
  IDOC: 'IDoc',
  RFC: 'RFC / BAPI',
  SFTP: 'File (SFTP)',
};

const payloadLabels: Record<SapPayloadFormat, string> = {
  WMS: 'WMS (standard)',
  SAP_ODATA: 'SAP OData',
  SAP_IDOC: 'SAP IDoc',
};

export default function SettingsSapIntegrationPage() {
  const [draft, setDraft] = useState<SapIntegrationConfig | null>(null);
  const [testState, setTestState] = useState<TestState>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [odataInfo, setOdataInfo] = useState<string | null>(null);
  const [odataSuggestions, setOdataSuggestions] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const response = await integrationsApi.getIntegration<SapIntegrationConfig>('sap');
        if (!mounted) return;
        setDraft(response.data.config);
        setLoadError(null);
      } catch (error: any) {
        if (!mounted) return;
        setLoadError(error?.message || 'Errore caricamento integrazione SAP');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSave = async () => {
    if (!draft) return;
    await integrationsApi.saveIntegration('sap', {
      enabled: draft.enabled,
      config: draft,
    });
    setLastSavedAt(new Date().toISOString());
  };

  const updateField = (field: keyof SapIntegrationConfig, value: any) => {
    setDraft((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const updateNested = (section: keyof SapIntegrationConfig, field: string, value: any) => {
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

  const testEndpoint = useMemo(() => {
    if (!draft?.baseUrl) return '';
    return draft.baseUrl.replace(/\/+$/, '') + '/$metadata';
  }, [draft?.baseUrl]);

  const handleTestConnection = async () => {
    if (!draft) return;
    setTestState('testing');
    setTestMessage('Test in corso...');

    if (!draft.enabled) {
      setTestState('error');
      setTestMessage('Integrazione disabilitata.');
      return;
    }
    try {
      const response = await integrationsApi.testIntegration('sap', {
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
      const response = await integrationsApi.validateOdata('sap');
      if (response.success) {
        const sets = response.data?.entitySets?.slice(0, 6) || [];
        setOdataInfo(`OK • ${sets.join(', ')}`);
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
      const response = await integrationsApi.suggestOdata('sap');
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
            Caricamento configurazione SAP...
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
          Configurazione SAP non disponibile.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
            <ServerIcon className="h-7 w-7 text-blue-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Integrazione SAP</h1>
            <p className="text-gray-600">
              Configura lo scambio dati con SAP S/4HANA o ECC.
            </p>
          </div>
        </div>

        {/* Status */}
        <div className={sectionClass}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Stato integrazione</h2>
              <p className="text-sm text-gray-600">
                Abilita o disabilita lo scambio dati SAP per WMS.
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
              <label className={labelClass}>Canale integrazione</label>
              <select
                value={draft.mode}
                onChange={(e) => updateField('mode', e.target.value as SapIntegrationMode)}
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
                onChange={(e) => updateField('payloadFormat', e.target.value as SapPayloadFormat)}
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
              <label className={labelClass}>Client SAP</label>
              <input
                type="text"
                value={draft.client}
                onChange={(e) => updateField('client', e.target.value)}
                className={inputClass}
                placeholder="100"
              />
            </div>
            <div>
              <label className={labelClass}>System ID</label>
              <input
                type="text"
                value={draft.systemId}
                onChange={(e) => updateField('systemId', e.target.value)}
                className={inputClass}
                placeholder="PRD"
              />
            </div>
            <div>
              <label className={labelClass}>Plant (WERKS)</label>
              <input
                type="text"
                value={draft.plant}
                onChange={(e) => updateField('plant', e.target.value)}
                className={inputClass}
                placeholder="1000"
              />
            </div>
            <div>
              <label className={labelClass}>Storage Location (LGORT)</label>
              <input
                type="text"
                value={draft.storageLocation}
                onChange={(e) => updateField('storageLocation', e.target.value)}
                className={inputClass}
                placeholder="0001"
              />
            </div>
          </div>
        </div>

        {/* Connection */}
        <div className={sectionClass}>
          <h2 className="text-lg font-semibold text-gray-900">Connessione OData / REST</h2>
          <p className="text-sm text-gray-600 mb-4">
            Endpoint standard per SAP Gateway o SAP BTP.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelClass}>Base URL OData</label>
              <input
                type="text"
                value={draft.baseUrl}
                onChange={(e) => updateField('baseUrl', e.target.value)}
                className={inputClass}
                placeholder="https://sap.example.com/sap/opu/odata/sap"
              />
              {draft.baseUrl && (
                <p className="text-xs text-gray-500 mt-1">Test endpoint: {testEndpoint}</p>
              )}
              {draft.mode === 'ODATA' && (
                <div className="mt-2">
                  <div className="flex flex-wrap items-center gap-2">
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
            <div>
              <label className={labelClass}>Username</label>
              <input
                type="text"
                value={draft.username}
                onChange={(e) => updateField('username', e.target.value)}
                className={inputClass}
                placeholder="WMS_USER"
              />
            </div>
            <div>
              <label className={labelClass}>Password</label>
              <input
                type="password"
                value={draft.password}
                onChange={(e) => updateField('password', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div className="mt-4 border-t border-gray-200 pt-4">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={draft.oauth.enabled}
                onChange={(e) => updateNested('oauth', 'enabled', e.target.checked)}
                className="h-4 w-4 text-blue-600"
              />
              <span className="text-sm text-gray-700">Usa OAuth2 (Client Credentials)</span>
            </label>
            {draft.oauth.enabled && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className={labelClass}>Token URL</label>
                  <input
                    type="text"
                    value={draft.oauth.tokenUrl}
                    onChange={(e) => updateNested('oauth', 'tokenUrl', e.target.value)}
                    className={inputClass}
                    placeholder="https://sap.example.com/oauth/token"
                  />
                </div>
                <div>
                  <label className={labelClass}>Client ID</label>
                  <input
                    type="text"
                    value={draft.oauth.clientId}
                    onChange={(e) => updateNested('oauth', 'clientId', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Client Secret</label>
                  <input
                    type="password"
                    value={draft.oauth.clientSecret}
                    onChange={(e) => updateNested('oauth', 'clientSecret', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Scope</label>
                  <input
                    type="text"
                    value={draft.oauth.scope}
                    onChange={(e) => updateNested('oauth', 'scope', e.target.value)}
                    className={inputClass}
                    placeholder="basic"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RFC / BAPI */}
        {draft.mode === 'RFC' && (
          <div className={sectionClass}>
            <h2 className="text-lg font-semibold text-gray-900">RFC / BAPI</h2>
            <p className="text-sm text-gray-600 mb-4">
              Parametri per connessione RFC o destinazione SAP.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Destination</label>
                <input
                  type="text"
                  value={draft.rfc.destination}
                  onChange={(e) => updateNested('rfc', 'destination', e.target.value)}
                  className={inputClass}
                  placeholder="SAP_RFC_DEST"
                />
              </div>
              <div>
                <label className={labelClass}>System Number</label>
                <input
                  type="text"
                  value={draft.rfc.systemNumber}
                  onChange={(e) => updateNested('rfc', 'systemNumber', e.target.value)}
                  className={inputClass}
                  placeholder="00"
                />
              </div>
              <div>
                <label className={labelClass}>Gateway Host</label>
                <input
                  type="text"
                  value={draft.rfc.gatewayHost}
                  onChange={(e) => updateNested('rfc', 'gatewayHost', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Gateway Service</label>
                <input
                  type="text"
                  value={draft.rfc.gatewayService}
                  onChange={(e) => updateNested('rfc', 'gatewayService', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>SAP Router</label>
                <input
                  type="text"
                  value={draft.rfc.sapRouter}
                  onChange={(e) => updateNested('rfc', 'sapRouter', e.target.value)}
                  className={inputClass}
                  placeholder="/H/1.2.3.4/S/3299"
                />
              </div>
            </div>
          </div>
        )}

        {/* IDoc */}
        {draft.mode === 'IDOC' && (
          <div className={sectionClass}>
            <h2 className="text-lg font-semibold text-gray-900">IDoc</h2>
            <p className="text-sm text-gray-600 mb-4">
              Configura port e partner IDoc per scambio asincrono.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Port</label>
                <input
                  type="text"
                  value={draft.idoc.port}
                  onChange={(e) => updateNested('idoc', 'port', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Partner</label>
                <input
                  type="text"
                  value={draft.idoc.partner}
                  onChange={(e) => updateNested('idoc', 'partner', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Message Type</label>
                <input
                  type="text"
                  value={draft.idoc.messageType}
                  onChange={(e) => updateNested('idoc', 'messageType', e.target.value)}
                  className={inputClass}
                  placeholder="WMMBXY"
                />
              </div>
              <div>
                <label className={labelClass}>Basic Type</label>
                <input
                  type="text"
                  value={draft.idoc.basicType}
                  onChange={(e) => updateNested('idoc', 'basicType', e.target.value)}
                  className={inputClass}
                  placeholder="MBGMCR03"
                />
              </div>
            </div>
          </div>
        )}

        {/* SFTP */}
        {draft.mode === 'SFTP' && (
          <div className={sectionClass}>
            <h2 className="text-lg font-semibold text-gray-900">File (SFTP)</h2>
            <p className="text-sm text-gray-600 mb-4">
              Scambio file CSV/XML con cartelle inbound/outbound.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Host</label>
                <input
                  type="text"
                  value={draft.sftp.host}
                  onChange={(e) => updateNested('sftp', 'host', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Porta</label>
                <input
                  type="number"
                  value={draft.sftp.port}
                  onChange={(e) => updateNested('sftp', 'port', Number(e.target.value))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Username</label>
                <input
                  type="text"
                  value={draft.sftp.username}
                  onChange={(e) => updateNested('sftp', 'username', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Password</label>
                <input
                  type="password"
                  value={draft.sftp.password}
                  onChange={(e) => updateNested('sftp', 'password', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Private Key (opzionale)</label>
                <textarea
                  rows={3}
                  value={draft.sftp.privateKey}
                  onChange={(e) => updateNested('sftp', 'privateKey', e.target.value)}
                  className={inputClass}
                  placeholder="-----BEGIN PRIVATE KEY-----"
                />
              </div>
              <div>
                <label className={labelClass}>Inbound path</label>
                <input
                  type="text"
                  value={draft.sftp.inboundPath}
                  onChange={(e) => updateNested('sftp', 'inboundPath', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Outbound path</label>
                <input
                  type="text"
                  value={draft.sftp.outboundPath}
                  onChange={(e) => updateNested('sftp', 'outboundPath', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        )}

        {/* Flows */}
        <div className={sectionClass}>
          <h2 className="text-lg font-semibold text-gray-900">Flussi attivi</h2>
          <p className="text-sm text-gray-600 mb-4">
            Seleziona quali dati scambiare tra SAP e WMS.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

        {/* Endpoints */}
        <div className={sectionClass}>
          <h2 className="text-lg font-semibold text-gray-900">Endpoint SAP</h2>
          <p className="text-sm text-gray-600 mb-4">
            Percorsi relativi per invio dati verso SAP (items/stock/orders).
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        {/* Mapping */}
        <div className={sectionClass}>
          <h2 className="text-lg font-semibold text-gray-900">Mapping chiavi</h2>
          <p className="text-sm text-gray-600 mb-4">
            Definisci le chiavi principali usate per allineare i dati.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Codice articolo</label>
              <select
                value={draft.mapping.itemCodeSource}
                onChange={(e) => updateNested('mapping', 'itemCodeSource', e.target.value)}
                className={inputClass}
              >
                <option value="SAP_MATNR">SAP MATNR</option>
                <option value="WMS_CODE">Codice WMS</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Codice ubicazione</label>
              <select
                value={draft.mapping.locationCodeSource}
                onChange={(e) => updateNested('mapping', 'locationCodeSource', e.target.value)}
                className={inputClass}
              >
                <option value="SAP_LGORT">SAP LGORT</option>
                <option value="WMS_LOCATION">Codice WMS</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Lotto</label>
              <select
                value={draft.mapping.lotSource}
                onChange={(e) => updateNested('mapping', 'lotSource', e.target.value)}
                className={inputClass}
              >
                <option value="SAP_CHARG">SAP CHARG</option>
                <option value="WMS_LOT">Lotto WMS</option>
              </select>
            </div>
          </div>
        </div>

        {/* Actions */}
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
              <p className="text-xs text-amber-600">
                Le credenziali sono salvate nel database. Usa protezioni backend per ambienti reali.
              </p>
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
