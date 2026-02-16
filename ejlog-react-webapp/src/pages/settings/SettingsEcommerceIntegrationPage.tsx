// ============================================================================
// EJLOG WMS - eCommerce Integration Settings Page
// ============================================================================

import React, { useEffect, useState } from 'react';
import { ArrowPathIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { integrationsApi } from '../../services/integrationsApi';
import type { EcommerceIntegrationConfig } from '../../types/integrations';

type TestState = 'idle' | 'testing' | 'success' | 'error';

export default function SettingsEcommerceIntegrationPage() {
  const [draft, setDraft] = useState<EcommerceIntegrationConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [testState, setTestState] = useState<TestState>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const response = await integrationsApi.getIntegration<EcommerceIntegrationConfig>('ecommerce');
        if (!mounted) return;
        setDraft(response.data.config);
        setLoadError(null);
      } catch (error: any) {
        if (!mounted) return;
        setLoadError(error?.message || 'Errore caricamento integrazione eCommerce');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const updateField = (field: keyof EcommerceIntegrationConfig, value: any) => {
    setDraft((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const updateNested = (section: keyof EcommerceIntegrationConfig, field: string, value: any) => {
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
    await integrationsApi.saveIntegration('ecommerce', {
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
      const response = await integrationsApi.testIntegration('ecommerce', {
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
            Caricamento configurazione eCommerce...
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
          Configurazione eCommerce non disponibile.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Integrazione eCommerce</h1>
          <p className="text-gray-600">
            Connetti marketplace e store per ordini e stock.
          </p>
        </div>

        <div className={sectionClass}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Stato integrazione</h2>
              <p className="text-sm text-gray-600">Abilita o disabilita lo scambio eCommerce.</p>
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
              <label className={labelClass}>Piattaforma</label>
              <select
                value={draft.platform}
                onChange={(e) => updateField('platform', e.target.value)}
                className={inputClass}
              >
                <option value="CUSTOM">Custom</option>
                <option value="SHOPIFY">Shopify</option>
                <option value="MAGENTO">Magento</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Base URL</label>
              <input
                type="text"
                value={draft.baseUrl}
                onChange={(e) => updateField('baseUrl', e.target.value)}
                className={inputClass}
                placeholder="https://store.example.com/api"
              />
            </div>
            <div>
              <label className={labelClass}>Health path</label>
              <input
                type="text"
                value={draft.healthPath}
                onChange={(e) => updateField('healthPath', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <div className={sectionClass}>
          <h2 className="text-lg font-semibold text-gray-900">Autenticazione</h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <label className={labelClass}>API Secret</label>
              <input
                type="password"
                value={draft.auth.apiSecret}
                onChange={(e) => updateNested('auth', 'apiSecret', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Access Token</label>
              <input
                type="password"
                value={draft.auth.accessToken}
                onChange={(e) => updateNested('auth', 'accessToken', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <div className={sectionClass}>
          <h2 className="text-lg font-semibold text-gray-900">Endpoint eCommerce</h2>
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
          <h2 className="text-lg font-semibold text-gray-900">Webhooks</h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(draft.webhooks).map(([key, value]) => (
              <div key={key}>
                <label className={labelClass}>{key}</label>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => updateNested('webhooks', key, e.target.value)}
                  className={inputClass}
                />
              </div>
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
