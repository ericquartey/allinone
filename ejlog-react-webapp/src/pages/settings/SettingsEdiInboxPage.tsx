// ============================================================================
// EJLOG WMS - EDI Inbox Page
// ============================================================================

import React, { useEffect, useRef, useState } from 'react';
import { ArrowPathIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { integrationsApi } from '../../services/integrationsApi';

interface InboxItem {
  id: number;
  integrationKey: string;
  flow: string;
  messageType?: string | null;
  receivedAt: string;
  appliedAt?: string | null;
  appliedStatus?: string | null;
  appliedMessage?: string | null;
}

export default function SettingsEdiInboxPage() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applyStatus, setApplyStatus] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [applyErrors, setApplyErrors] = useState<Array<{ orderNumber?: string | null; lineNumber?: string | null; itemCode?: string | null; reason: string }>>([]);
  const [applyErrorsLoading, setApplyErrorsLoading] = useState(false);
  const [applyErrorsTotal, setApplyErrorsTotal] = useState(0);
  const [errorsPage, setErrorsPage] = useState(0);
  const [errorsPageSize] = useState(10);
  const [errorsFilters, setErrorsFilters] = useState({ reason: '', itemCode: '', orderNumber: '' });
  const [errorsExportStatus, setErrorsExportStatus] = useState<string | null>(null);
  const [errorsExportLimit, setErrorsExportLimit] = useState(1000);
  const [errorsExportAllStatus, setErrorsExportAllStatus] = useState<string | null>(null);
  const [errorsExportProgress, setErrorsExportProgress] = useState<string | null>(null);
  const [errorsExportProgressRatio, setErrorsExportProgressRatio] = useState<number | null>(null);
  const [overrideConfig, setOverrideConfig] = useState({
    overrideTipoLista: '',
    overrideAreaId: '',
    overrideMachineId: '',
  });
  const [overrideStatus, setOverrideStatus] = useState<string | null>(null);
  const [inboxExportStatus, setInboxExportStatus] = useState<string | null>(null);
  const exportCancelRef = useRef(false);

  const loadInbox = async () => {
    try {
      setLoading(true);
      const response = await integrationsApi.getEdiInbox('erp', { limit: 50, offset: 0 });
      setItems(response.data || []);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Errore caricamento EDI inbox');
    } finally {
      setLoading(false);
    }
  };

  const loadApplyErrors = async (id: number, page = 0) => {
    setApplyErrorsLoading(true);
    try {
      const response = await integrationsApi.getEdiApplyErrors('erp', {
        inboxId: id,
        limit: errorsPageSize,
        offset: page * errorsPageSize,
        reason: errorsFilters.reason || undefined,
        itemCode: errorsFilters.itemCode || undefined,
        orderNumber: errorsFilters.orderNumber || undefined,
      });
      setApplyErrors(response.data || []);
      setApplyErrorsTotal(response.total || 0);
      setErrorsPage(page);
    } finally {
      setApplyErrorsLoading(false);
    }
  };

  const loadDetail = async (id: number) => {
    try {
      setLoadingDetail(true);
      const response = await integrationsApi.getEdiInboxItem('erp', id);
      setSelected(response.data);
      setOverrideConfig({
        overrideTipoLista: response.data?.overrideTipoLista ? String(response.data.overrideTipoLista) : '',
        overrideAreaId: response.data?.overrideAreaId ? String(response.data.overrideAreaId) : '',
        overrideMachineId: response.data?.overrideMachineId ? String(response.data.overrideMachineId) : '',
      });
      setApplyErrors([]);
      setApplyErrorsTotal(0);
      await loadApplyErrors(id, 0);
    } catch (err: any) {
      setSelected(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSaveOverrides = async () => {
    if (!selected?.id) return;
    setOverrideStatus(null);
    const payload = {
      overrideTipoLista: overrideConfig.overrideTipoLista ? Number(overrideConfig.overrideTipoLista) : null,
      overrideAreaId: overrideConfig.overrideAreaId ? Number(overrideConfig.overrideAreaId) : null,
      overrideMachineId: overrideConfig.overrideMachineId ? Number(overrideConfig.overrideMachineId) : null,
    };
    try {
      const response = await integrationsApi.updateEdiInboxConfig('erp', selected.id, payload);
      if (response.success) {
        setOverrideStatus('Salvato');
        await loadDetail(selected.id);
      } else {
        setOverrideStatus(response.error || 'Errore salvataggio');
      }
    } catch (err: any) {
      setOverrideStatus(err?.message || 'Errore salvataggio');
    }
  };

  const handleExportInboxJson = () => {
    if (!selected) return;
    const payload = {
      id: selected.id,
      integrationKey: selected.integrationKey,
      flow: selected.flow,
      messageType: selected.messageType,
      receivedAt: selected.receivedAt,
      appliedAt: selected.appliedAt,
      appliedStatus: selected.appliedStatus,
      appliedMessage: selected.appliedMessage,
      parsed: selected.parsed,
      rawContent: selected.rawContent,
    };
    const name = `edi-inbox-${selected.id}.json`;
    downloadBlob(JSON.stringify(payload, null, 2), name, 'application/json');
    setInboxExportStatus('JSON scaricato');
    setTimeout(() => setInboxExportStatus(null), 2000);
  };

  const handleApply = async () => {
    if (!selected?.id) return;
    setApplying(true);
    setApplyStatus(null);
    setApplyErrors([]);
    try {
      const response = await integrationsApi.applyEdiInbox('erp', selected.id);
      if (response.success) {
        const errors = response.data?.errors || [];
        setApplyErrors(errors);
        setApplyStatus(errors.length ? 'Ordini creati con scarti' : 'Ordini creati');
        await loadApplyErrors(selected.id, 0);
        await loadInbox();
      } else {
        setApplyStatus(response.error || 'Errore applicazione EDI');
      }
    } catch (err: any) {
      setApplyStatus(err?.message || 'Errore applicazione EDI');
    } finally {
      setApplying(false);
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

  const handleErrorsExport = async () => {
    if (!selected?.id) return;
    setErrorsExportStatus(null);
    try {
      const response = await integrationsApi.getEdiApplyErrors('erp', {
        inboxId: selected.id,
        limit: errorsExportLimit,
        offset: 0,
        reason: errorsFilters.reason || undefined,
        itemCode: errorsFilters.itemCode || undefined,
        orderNumber: errorsFilters.orderNumber || undefined,
      });
      const rows = response.data || [];
      if (!rows.length) {
        setErrorsExportStatus('Nessun dato');
        return;
      }
      const columns = Object.keys(rows.reduce((acc: Record<string, boolean>, row: any) => {
        Object.keys(row || {}).forEach((key) => {
          acc[key] = true;
        });
        return acc;
      }, {}));
      const header = columns.map(escapeCsv).join(',');
      const lines = rows.map((row: any) =>
        columns.map((column) => escapeCsv(row?.[column])).join(',')
      );
      const name = `edi-errors-${selected.id}.csv`;
      downloadBlob([header, ...lines].join('\n'), name, 'text/csv');
      setErrorsExportStatus('CSV scaricato');
      setTimeout(() => setErrorsExportStatus(null), 2000);
    } catch (err: any) {
      setErrorsExportStatus(err?.message || 'Errore export');
    }
  };

  const handleErrorsExportJson = async () => {
    if (!selected?.id) return;
    setErrorsExportStatus(null);
    try {
      const response = await integrationsApi.getEdiApplyErrors('erp', {
        inboxId: selected.id,
        limit: errorsExportLimit,
        offset: 0,
        reason: errorsFilters.reason || undefined,
        itemCode: errorsFilters.itemCode || undefined,
        orderNumber: errorsFilters.orderNumber || undefined,
      });
      const rows = response.data || [];
      const name = `edi-errors-${selected.id}.json`;
      downloadBlob(JSON.stringify(rows, null, 2), name, 'application/json');
      setErrorsExportStatus('JSON scaricato');
      setTimeout(() => setErrorsExportStatus(null), 2000);
    } catch (err: any) {
      setErrorsExportStatus(err?.message || 'Errore export');
    }
  };

  const fetchAllErrors = async () => {
    if (!selected?.id) return [];
    exportCancelRef.current = false;
    const all: any[] = [];
    let offset = 0;
    let total = Infinity;
    const limit = errorsExportLimit;

    while (offset < total) {
      const totalLabel = Number.isFinite(total) ? ` / ${total}` : '';
      setErrorsExportProgress(`Scaricati ${offset}${totalLabel}`);
      if (exportCancelRef.current) break;
      const response = await integrationsApi.getEdiApplyErrors('erp', {
        inboxId: selected.id,
        limit,
        offset,
        reason: errorsFilters.reason || undefined,
        itemCode: errorsFilters.itemCode || undefined,
        orderNumber: errorsFilters.orderNumber || undefined,
      });
      const rows = response.data || [];
      if (typeof response.total === 'number') total = response.total;
      all.push(...rows);
      if (!rows.length) break;
      offset += limit;
      if (Number.isFinite(total) && total > 0) {
        setErrorsExportProgressRatio(Math.min(offset / total, 1));
      }
    }

    setErrorsExportProgress(null);
    setErrorsExportProgressRatio(null);
    return all;
  };

  const handleErrorsExportAllCsv = async () => {
    if (!selected?.id) return;
    setErrorsExportAllStatus(null);
    try {
      const rows = await fetchAllErrors();
      if (exportCancelRef.current) {
        setErrorsExportAllStatus('Export annullato');
        return;
      }
      if (!rows.length) {
        setErrorsExportAllStatus('Nessun dato');
        return;
      }
      const columns = Object.keys(rows.reduce((acc: Record<string, boolean>, row: any) => {
        Object.keys(row || {}).forEach((key) => {
          acc[key] = true;
        });
        return acc;
      }, {}));
      const header = columns.map(escapeCsv).join(',');
      const lines = rows.map((row: any) =>
        columns.map((column) => escapeCsv(row?.[column])).join(',')
      );
      const name = `edi-errors-${selected.id}-all.csv`;
      downloadBlob([header, ...lines].join('\n'), name, 'text/csv');
      setErrorsExportAllStatus('CSV completo scaricato');
      setErrorsExportProgress(null);
      setErrorsExportProgressRatio(null);
      setTimeout(() => setErrorsExportAllStatus(null), 2000);
    } catch (err: any) {
      setErrorsExportAllStatus(err?.message || 'Errore export');
      setErrorsExportProgress(null);
      setErrorsExportProgressRatio(null);
    }
  };

  const handleErrorsExportAllJson = async () => {
    if (!selected?.id) return;
    setErrorsExportAllStatus(null);
    try {
      const rows = await fetchAllErrors();
      if (exportCancelRef.current) {
        setErrorsExportAllStatus('Export annullato');
        return;
      }
      const name = `edi-errors-${selected.id}-all.json`;
      downloadBlob(JSON.stringify(rows, null, 2), name, 'application/json');
      setErrorsExportAllStatus('JSON completo scaricato');
      setErrorsExportProgress(null);
      setErrorsExportProgressRatio(null);
      setTimeout(() => setErrorsExportAllStatus(null), 2000);
    } catch (err: any) {
      setErrorsExportAllStatus(err?.message || 'Errore export');
      setErrorsExportProgress(null);
      setErrorsExportProgressRatio(null);
    }
  };

  useEffect(() => {
    loadInbox();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">EDI Inbox</h1>
            <p className="text-gray-600">Messaggi EDI ricevuti e archiviati.</p>
          </div>
          <button
            onClick={loadInbox}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Aggiorna
          </button>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <ArrowPathIcon className="h-4 w-4 animate-spin" />
            Caricamento inbox...
          </div>
        )}
        {error && <div className="text-sm text-red-600">{error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 bg-white border border-gray-200 rounded-lg">
            <div className="border-b border-gray-200 p-3 text-sm font-semibold text-gray-700">
              Messaggi recenti
            </div>
            <div className="divide-y">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => loadDetail(item.id)}
                  className="w-full text-left p-3 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-900">
                      {item.messageType || 'EDI'}
                    </div>
                    {item.appliedStatus && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full ${
                          item.appliedStatus === 'SUCCESS'
                            ? 'bg-green-100 text-green-700'
                            : item.appliedStatus === 'PARTIAL'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {item.appliedStatus}
                      </span>
                    )}
                    <div className="text-xs text-gray-500">
                      {new Date(item.receivedAt).toLocaleString('it-IT')}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {item.flow} • {item.integrationKey}
                  </div>
                </button>
              ))}
              {items.length === 0 && !loading && (
                <div className="p-4 text-sm text-gray-500">Nessun messaggio.</div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg">
            <div className="border-b border-gray-200 p-3 text-sm font-semibold text-gray-700 flex items-center gap-2">
              <DocumentTextIcon className="h-4 w-4" />
              Dettaglio messaggio
            </div>
            <div className="p-4">
              {loadingDetail && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  Caricamento dettaglio...
                </div>
              )}
              {!loadingDetail && !selected && (
                <div className="text-sm text-gray-500">Seleziona un messaggio.</div>
              )}
              {!loadingDetail && selected && (
                <div className="space-y-4">
                  <div className="text-sm text-gray-700">
                    <div>Tipo: {selected.messageType || 'EDI'}</div>
                    <div>Flow: {selected.flow}</div>
                    <div>Ricevuto: {new Date(selected.receivedAt).toLocaleString('it-IT')}</div>
                    {selected.appliedStatus && (
                      <div>
                        Applicazione: {selected.appliedStatus}
                        {selected.appliedAt ? ` • ${new Date(selected.appliedAt).toLocaleString('it-IT')}` : ''}
                      </div>
                    )}
                    {selected.appliedMessage && (
                      <div className="text-xs text-gray-500">{selected.appliedMessage}</div>
                    )}
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-700">
                    <div className="font-semibold text-gray-800 mb-2">Override workflow</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <input
                        type="number"
                        value={overrideConfig.overrideTipoLista}
                        onChange={(e) => setOverrideConfig((prev) => ({ ...prev, overrideTipoLista: e.target.value }))}
                        className="border border-gray-300 rounded-lg px-2 py-1 text-xs"
                        placeholder="idTipoLista"
                      />
                      <input
                        type="number"
                        value={overrideConfig.overrideAreaId}
                        onChange={(e) => setOverrideConfig((prev) => ({ ...prev, overrideAreaId: e.target.value }))}
                        className="border border-gray-300 rounded-lg px-2 py-1 text-xs"
                        placeholder="idArea"
                      />
                      <input
                        type="number"
                        value={overrideConfig.overrideMachineId}
                        onChange={(e) => setOverrideConfig((prev) => ({ ...prev, overrideMachineId: e.target.value }))}
                        className="border border-gray-300 rounded-lg px-2 py-1 text-xs"
                        placeholder="idMacchina"
                      />
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={handleSaveOverrides}
                        className="px-2 py-1 text-xs rounded-lg border border-gray-300 text-gray-700"
                      >
                        Salva override
                      </button>
                      {overrideStatus && <span className="text-xs text-gray-500">{overrideStatus}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleApply}
                      disabled={applying}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {applying
                        ? 'Applicando...'
                        : selected.appliedStatus
                        ? 'Riprova applicazione'
                        : 'Crea ordini'}
                    </button>
                    <button
                      onClick={handleExportInboxJson}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Esporta JSON
                    </button>
                    {applyStatus && <span className="text-xs text-gray-500">{applyStatus}</span>}
                    {inboxExportStatus && <span className="text-xs text-gray-500">{inboxExportStatus}</span>}
                  </div>
                  {applyErrorsLoading && (
                    <div className="text-xs text-gray-500">Caricamento errori...</div>
                  )}
                  {applyErrors.length > 0 && (
                    <div className="text-xs text-amber-600">
                      <div className="font-semibold mb-2">Righe scartate</div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                        <input
                          type="text"
                          value={errorsFilters.orderNumber}
                          onChange={(e) => setErrorsFilters((prev) => ({ ...prev, orderNumber: e.target.value }))}
                          className="border border-gray-300 rounded-lg px-2 py-1 text-xs"
                          placeholder="Filtro ordine"
                        />
                        <input
                          type="text"
                          value={errorsFilters.itemCode}
                          onChange={(e) => setErrorsFilters((prev) => ({ ...prev, itemCode: e.target.value }))}
                          className="border border-gray-300 rounded-lg px-2 py-1 text-xs"
                          placeholder="Filtro articolo"
                        />
                        <input
                          type="text"
                          value={errorsFilters.reason}
                          onChange={(e) => setErrorsFilters((prev) => ({ ...prev, reason: e.target.value }))}
                          className="border border-gray-300 rounded-lg px-2 py-1 text-xs"
                          placeholder="Filtro motivo"
                        />
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <button
                          onClick={() => selected?.id && loadApplyErrors(selected.id, 0)}
                          className="px-2 py-1 text-xs rounded-lg border border-amber-300 text-amber-700"
                        >
                          Filtra
                        </button>
                        <input
                          type="number"
                          min={1}
                          value={errorsExportLimit}
                          onChange={(e) => setErrorsExportLimit(Math.max(1, Number(e.target.value) || 1))}
                          className="w-24 px-2 py-1 text-xs border border-amber-300 rounded-lg text-amber-700"
                          placeholder="Limite"
                        />
                        <button
                          onClick={handleErrorsExport}
                          className="px-2 py-1 text-xs rounded-lg border border-amber-300 text-amber-700"
                        >
                          Esporta CSV
                        </button>
                        <button
                          onClick={handleErrorsExportJson}
                          className="px-2 py-1 text-xs rounded-lg border border-amber-300 text-amber-700"
                        >
                          Esporta JSON
                        </button>
                        <button
                          onClick={handleErrorsExportAllCsv}
                          className="px-2 py-1 text-xs rounded-lg border border-amber-300 text-amber-700"
                        >
                          Esporta tutto CSV
                        </button>
                        <button
                          onClick={handleErrorsExportAllJson}
                          className="px-2 py-1 text-xs rounded-lg border border-amber-300 text-amber-700"
                        >
                          Esporta tutto JSON
                        </button>
                        {errorsExportProgress && (
                          <button
                            onClick={() => {
                              exportCancelRef.current = true;
                              setErrorsExportProgress('Annullamento...');
                            }}
                            className="px-2 py-1 text-xs rounded-lg border border-amber-300 text-amber-700"
                          >
                            Annulla export
                          </button>
                        )}
                        <span className="text-xs text-amber-700">
                          Totale: {applyErrorsTotal}
                        </span>
                        {errorsExportStatus && (
                          <span className="text-xs text-amber-700">{errorsExportStatus}</span>
                        )}
                        {errorsExportAllStatus && (
                          <span className="text-xs text-amber-700">{errorsExportAllStatus}</span>
                        )}
                        {errorsExportProgress && (
                          <span className="text-xs text-amber-700">{errorsExportProgress}</span>
                        )}
                      </div>
                      {errorsExportProgressRatio !== null && (
                        <div className="h-2 w-full bg-amber-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 transition-all"
                            style={{ width: `${Math.round(errorsExportProgressRatio * 100)}%` }}
                          />
                        </div>
                      )}
                      <ul className="space-y-1">
                        {applyErrors.map((err, idx) => (
                          <li key={idx}>
                            Ordine {err.orderNumber || '-'} riga {err.lineNumber || '-'}: {err.itemCode || '-'} - {err.reason}
                          </li>
                        ))}
                      </ul>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => selected?.id && loadApplyErrors(selected.id, Math.max(errorsPage - 1, 0))}
                          disabled={errorsPage === 0}
                          className="px-2 py-1 text-xs rounded-lg border border-amber-300 text-amber-700 disabled:opacity-50"
                        >
                          Prev
                        </button>
                        <button
                          onClick={() => selected?.id && loadApplyErrors(selected.id, errorsPage + 1)}
                          disabled={(errorsPage + 1) * errorsPageSize >= applyErrorsTotal}
                          className="px-2 py-1 text-xs rounded-lg border border-amber-300 text-amber-700 disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                  {selected.parsed && (
                    <pre className="bg-gray-900 text-gray-100 text-xs p-4 rounded-lg overflow-auto">
                      {JSON.stringify(selected.parsed, null, 2)}
                    </pre>
                  )}
                  <pre className="bg-gray-50 text-gray-700 text-xs p-4 rounded-lg border border-gray-200 overflow-auto">
                    {selected.rawContent}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
