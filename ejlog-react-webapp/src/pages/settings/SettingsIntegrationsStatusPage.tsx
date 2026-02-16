// ============================================================================
// EJLOG WMS - Integrations Status Page
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { integrationsApi } from '../../services/integrationsApi';
import type { IntegrationLogEntry, IntegrationStatus } from '../../types/integrations';

const statusBadge = (status?: string | null) => {
  if (!status) return { label: 'N/A', className: 'bg-gray-100 text-gray-700' };
  if (status === 'SUCCESS') return { label: 'OK', className: 'bg-green-100 text-green-700' };
  if (status === 'FAILED') return { label: 'KO', className: 'bg-red-100 text-red-700' };
  if (status === 'IN_PROGRESS') return { label: 'IN CORSO', className: 'bg-amber-100 text-amber-700' };
  return { label: status, className: 'bg-gray-100 text-gray-700' };
};

export default function SettingsIntegrationsStatusPage() {
  const [statusList, setStatusList] = useState<IntegrationStatus[]>([]);
  const [logs, setLogs] = useState<IntegrationLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filterKey, setFilterKey] = useState<string>('all');
  const [syncingKey, setSyncingKey] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState<string | null>(null);
  const [previewFlowByKey, setPreviewFlowByKey] = useState<Record<string, string>>({});
  const [previewPayload, setPreviewPayload] = useState<any | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewView, setPreviewView] = useState<'json' | 'table'>('json');
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [logsCsvStatus, setLogsCsvStatus] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statusResponse, logsResponse] = await Promise.all([
        integrationsApi.getIntegrationsStatus(),
        integrationsApi.getIntegrationLogs({ limit: 50 }),
      ]);
      setStatusList(statusResponse.data || []);
      setLogs(logsResponse.data || []);
      setLoadError(null);
    } catch (error: any) {
      setLoadError(error?.message || 'Errore caricamento stato integrazioni');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredLogs = useMemo(() => {
    if (filterKey === 'all') return logs;
    return logs.filter((log) => log.integrationKey === filterKey);
  }, [filterKey, logs]);

  const logStats = useMemo(() => {
    if (!filteredLogs.length) return null;
    const total = filteredLogs.length;
    const success = filteredLogs.filter((log) => log.status === 'SUCCESS').length;
    const failed = filteredLogs.filter((log) => log.status === 'FAILED').length;
    const avgDuration = Math.round(
      filteredLogs.reduce((sum, log) => sum + (log.durationMs || 0), 0) / total
    );
    return { total, success, failed, avgDuration };
  }, [filteredLogs]);

  const handleSync = async (key: string) => {
    setSyncingKey(key);
    try {
      await integrationsApi.runIntegrationSync(key as any, {
        direction: 'outbound',
        flows: ['items', 'stock', 'orders'],
      });
      await loadData();
    } catch {
      await loadData();
    } finally {
      setSyncingKey(null);
    }
  };

  const handlePreview = async (key: string) => {
    const flow = previewFlowByKey[key] || 'items';
    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewKey(key);
    try {
      const response = await integrationsApi.previewIntegration(key as any, { flow, limit: 3 });
      setPreviewPayload(response.data);
      setPreviewView('json');
    } catch (error: any) {
      setPreviewPayload(null);
      setPreviewError(error?.message || 'Errore anteprima payload');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!previewPayload) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(previewPayload, null, 2));
      setCopyStatus('Copiato');
      setTimeout(() => setCopyStatus(null), 2000);
    } catch {
      setCopyStatus('Errore copia');
      setTimeout(() => setCopyStatus(null), 2000);
    }
  };

  const downloadBlob = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const escapeCsv = (value: any) => {
    const str = value === null || value === undefined ? '' : String(value);
    const escaped = str.replace(/"/g, '""');
    return `"${escaped}"`;
  };

  const handleDownloadJson = () => {
    if (!previewPayload) return;
    const name = `${previewKey || 'integration'}-${previewFlowByKey[previewKey || ''] || 'items'}.json`;
    downloadBlob(JSON.stringify(previewPayload, null, 2), name, 'application/json');
  };

  const handleDownloadCsv = () => {
    if (!previewRows.length) return;
    const name = `${previewKey || 'integration'}-${previewFlowByKey[previewKey || ''] || 'items'}.csv`;
    const header = previewColumns.map(escapeCsv).join(',');
    const lines = previewRows.map((row: any) =>
      previewColumns.map((column) => escapeCsv(row?.[column])).join(',')
    );
    downloadBlob([header, ...lines].join('\n'), name, 'text/csv');
  };

  const previewRows = Array.isArray(previewPayload?.payload) ? previewPayload.payload : [];
  const previewColumns = previewRows.length
    ? Object.keys(previewRows.reduce((acc: Record<string, boolean>, row: any) => {
        Object.keys(row || {}).forEach((key) => {
          acc[key] = true;
        });
        return acc;
      }, {}))
    : [];

  const logsColumns = logs.length
    ? Object.keys(logs.reduce((acc: Record<string, boolean>, row: any) => {
        Object.keys(row || {}).forEach((key) => {
          acc[key] = true;
        });
        return acc;
      }, {}))
    : [];

  const handleLogsCsv = () => {
    if (!logs.length) return;
    const name = `integration-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    const header = logsColumns.map(escapeCsv).join(',');
    const lines = logs.map((row: any) =>
      logsColumns.map((column) => escapeCsv(row?.[column])).join(',')
    );
    downloadBlob([header, ...lines].join('\n'), name, 'text/csv');
    setLogsCsvStatus('CSV scaricato');
    setTimeout(() => setLogsCsvStatus(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto flex items-center gap-2 text-sm text-gray-600">
          <ArrowPathIcon className="h-5 w-5 animate-spin" />
          Caricamento stato integrazioni...
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto flex items-center gap-2 text-sm text-red-600">
          <ExclamationTriangleIcon className="h-5 w-5" />
          {loadError}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Stato integrazioni</h1>
            <p className="text-gray-600">Monitoraggio sincronizzazioni e log recenti.</p>
          </div>
          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Aggiorna
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {statusList.map((integration) => {
            const badge = statusBadge(integration.lastStatus);
            return (
              <div key={integration.key} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-lg font-semibold text-gray-900">{integration.key}</div>
                    <div className="text-sm text-gray-600">
                      {integration.enabled ? 'Attiva' : 'Disattiva'}
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${badge.className}`}>
                    {badge.label}
                  </span>
                </div>
                <div className="mt-3 text-sm text-gray-600 space-y-1">
                  <div className="flex items-center gap-2">
                    <ClockIcon className="h-4 w-4 text-gray-400" />
                    {integration.lastSyncAt
                      ? new Date(integration.lastSyncAt).toLocaleString('it-IT')
                      : 'Nessuna sync'}
                  </div>
                  <div>Flusso: {integration.lastFlow || '-'}</div>
                  <div className="text-xs text-gray-500">{integration.lastMessage || ''}</div>
                </div>
                <div className="mt-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={previewFlowByKey[integration.key] || 'items'}
                      onChange={(e) =>
                        setPreviewFlowByKey((prev) => ({ ...prev, [integration.key]: e.target.value }))
                      }
                      className="border border-gray-300 rounded-lg px-2 py-1 text-xs"
                    >
                      <option value="items">items</option>
                      <option value="stock">stock</option>
                      <option value="orders">orders</option>
                    </select>
                    <button
                      onClick={() => handlePreview(integration.key)}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Anteprima payload
                    </button>
                    <button
                      onClick={() => handleSync(integration.key)}
                      disabled={syncingKey === integration.key || !integration.enabled}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {syncingKey === integration.key ? (
                        <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircleIcon className="h-4 w-4" />
                      )}
                      Sync ora
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900">Anteprima payload</h2>
          <p className="text-sm text-gray-600">
            {previewKey
              ? `Integrazione: ${previewKey} • Flusso: ${previewFlowByKey[previewKey] || 'items'}`
              : 'Seleziona una integrazione per vedere un esempio payload.'}
          </p>
          <div className="mt-4">
            {previewLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                Caricamento anteprima...
              </div>
            )}
            {previewError && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <ExclamationTriangleIcon className="h-4 w-4" />
                {previewError}
              </div>
            )}
            {!previewLoading && !previewError && previewPayload && (
              <div className="mt-3 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setPreviewView('json')}
                    className={`px-3 py-1 text-xs rounded-lg border ${
                      previewView === 'json'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    JSON
                  </button>
                  <button
                    onClick={() => setPreviewView('table')}
                    disabled={previewRows.length === 0}
                    className={`px-3 py-1 text-xs rounded-lg border ${
                      previewView === 'table'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300'
                    } ${previewRows.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Tabella
                  </button>
                  <button
                    onClick={handleCopy}
                    className="px-3 py-1 text-xs rounded-lg border border-gray-300 bg-white text-gray-700"
                  >
                    Copia JSON
                  </button>
                  <button
                    onClick={handleDownloadJson}
                    className="px-3 py-1 text-xs rounded-lg border border-gray-300 bg-white text-gray-700"
                  >
                    Scarica JSON
                  </button>
                  <button
                    onClick={handleDownloadCsv}
                    disabled={previewRows.length === 0}
                    className={`px-3 py-1 text-xs rounded-lg border border-gray-300 bg-white text-gray-700 ${
                      previewRows.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    Scarica CSV
                  </button>
                  {copyStatus && <span className="text-xs text-gray-500">{copyStatus}</span>}
                </div>
                {previewView === 'json' && (
                  <pre className="bg-gray-900 text-gray-100 text-xs p-4 rounded-lg overflow-auto">
                    {JSON.stringify(previewPayload, null, 2)}
                  </pre>
                )}
                {previewView === 'table' && (
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="min-w-full text-xs">
                      <thead>
                        <tr className="text-left text-gray-500 border-b bg-gray-50">
                          {previewColumns.map((column) => (
                            <th key={column} className="py-2 px-3">
                              {column}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.map((row: any, index: number) => (
                          <tr key={index} className="border-b last:border-none">
                            {previewColumns.map((column) => (
                              <td key={column} className="py-2 px-3 text-gray-700">
                                {row?.[column] !== undefined && row?.[column] !== null
                                  ? String(row[column])
                                  : '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
            {!previewLoading && !previewError && !previewPayload && (
              <div className="text-sm text-gray-500 mt-3">Nessuna anteprima disponibile.</div>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Log sincronizzazioni</h2>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterKey}
                onChange={(e) => setFilterKey(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">Tutte</option>
                {statusList.map((integration) => (
                  <option key={integration.key} value={integration.key}>
                    {integration.key}
                  </option>
                ))}
              </select>
              <button
                onClick={handleLogsCsv}
                disabled={filteredLogs.length === 0}
                className={`px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-700 ${
                  filteredLogs.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Esporta CSV
              </button>
              {logsCsvStatus && <span className="text-xs text-gray-500">{logsCsvStatus}</span>}
            </div>
          </div>
          {logStats && (
            <div className="mb-3 grid grid-cols-1 md:grid-cols-4 gap-2 text-xs text-gray-600">
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                Totale: {logStats.total}
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-green-700">
                Successi: {logStats.success}
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-700">
                Errori: {logStats.failed}
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-blue-700">
                Avg durata: {isNaN(logStats.avgDuration) ? '-' : `${logStats.avgDuration} ms`}
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2 pr-4">Integrazione</th>
                  <th className="py-2 pr-4">Flusso</th>
                  <th className="py-2 pr-4">Stato</th>
                  <th className="py-2 pr-4">Record</th>
                  <th className="py-2 pr-4">Durata</th>
                  <th className="py-2 pr-4">Avvio</th>
                  <th className="py-2 pr-4">Messaggio</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => {
                  const badge = statusBadge(log.status);
                  return (
                    <tr key={log.id} className="border-b last:border-none">
                      <td className="py-2 pr-4 text-gray-900">{log.integrationKey}</td>
                      <td className="py-2 pr-4 text-gray-700">{log.flow}</td>
                      <td className="py-2 pr-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-gray-700">{log.recordCount ?? '-'}</td>
                      <td className="py-2 pr-4 text-gray-700">{log.durationMs ? `${log.durationMs} ms` : '-'}</td>
                      <td className="py-2 pr-4 text-gray-700">
                        {new Date(log.startedAt).toLocaleString('it-IT')}
                      </td>
                      <td className="py-2 pr-4 text-gray-500">{log.message || '-'}</td>
                    </tr>
                  );
                })}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-gray-500">
                      Nessun log disponibile.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
