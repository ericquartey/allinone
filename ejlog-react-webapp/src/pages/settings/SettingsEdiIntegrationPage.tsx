// ============================================================================
// EJLOG WMS - EDI Integration Settings Page
// ============================================================================

import React, { useEffect, useState } from 'react';
import { ArrowPathIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { integrationsApi } from '../../services/integrationsApi';
import type { EdiIntegrationConfig } from '../../types/integrations';

type TestState = 'idle' | 'testing' | 'success' | 'error';

export default function SettingsEdiIntegrationPage() {
  const [draft, setDraft] = useState<EdiIntegrationConfig | null>(null);
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
        const response = await integrationsApi.getIntegration<EdiIntegrationConfig>('edi');
        if (!mounted) return;
        setDraft(response.data.config);
        setLoadError(null);
      } catch (error: any) {
        if (!mounted) return;
        setLoadError(error?.message || 'Errore caricamento integrazione EDI');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const updateField = (field: keyof EdiIntegrationConfig, value: any) => {
    setDraft((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const updateNested = (section: keyof EdiIntegrationConfig, field: string, value: any) => {
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
    await integrationsApi.saveIntegration('edi', {
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
      const response = await integrationsApi.testIntegration('edi', {
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
            Caricamento configurazione EDI...
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
          Configurazione EDI non disponibile.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Integrazione EDI / AS2</h1>
            <p className="text-gray-600">
              Configura lo scambio EDI con clienti e fornitori.
            </p>
          </div>
        </div>

        <div className={sectionClass}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Stato integrazione</h2>
              <p className="text-sm text-gray-600">
                Abilita o disabilita i flussi EDI.
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
              <label className={labelClass}>Protocollo</label>
              <select
                value={draft.protocol}
                onChange={(e) => updateField('protocol', e.target.value)}
                className={inputClass}
              >
                <option value="AS2">AS2</option>
                <option value="SFTP">SFTP</option>
                <option value="FTP">FTP</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Endpoint URL</label>
              <input
                type="text"
                value={draft.endpointUrl}
                onChange={(e) => updateField('endpointUrl', e.target.value)}
                className={inputClass}
                placeholder="https://edi.partner.com/as2"
              />
            </div>
          </div>
        </div>

        <div className={sectionClass}>
          <h2 className="text-lg font-semibold text-gray-900">AS2</h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>AS2 ID</label>
              <input
                type="text"
                value={draft.as2.as2Id}
                onChange={(e) => updateNested('as2', 'as2Id', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Partner ID</label>
              <input
                type="text"
                value={draft.as2.partnerId}
                onChange={(e) => updateNested('as2', 'partnerId', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>MDN URL</label>
              <input
                type="text"
                value={draft.as2.mdnUrl}
                onChange={(e) => updateNested('as2', 'mdnUrl', e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Certificato</label>
              <textarea
                rows={3}
                value={draft.as2.cert}
                onChange={(e) => updateNested('as2', 'cert', e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Private Key</label>
              <textarea
                rows={3}
                value={draft.as2.privateKey}
                onChange={(e) => updateNested('as2', 'privateKey', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <div className={sectionClass}>
          <h2 className="text-lg font-semibold text-gray-900">SFTP</h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <div className={sectionClass}>
          <h2 className="text-lg font-semibold text-gray-900">Messaggi EDI</h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(draft.messageTypes).map(([key, value]) => (
              <label key={key} className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => updateNested('messageTypes', key, e.target.checked)}
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
