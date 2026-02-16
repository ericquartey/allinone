// ============================================================================
// EJLOG WMS - Integration Item Mappings Page
// ============================================================================

import React, { useEffect, useState } from 'react';
import { ArrowPathIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { integrationsApi } from '../../services/integrationsApi';

interface MappingRow {
  id: number;
  integrationKey: string;
  externalCode: string;
  itemId?: number | null;
  itemCode?: string | null;
  description?: string | null;
  createdAt?: string;
}

export default function SettingsItemMappingsPage() {
  const [items, setItems] = useState<MappingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [newRow, setNewRow] = useState({ externalCode: '', itemCode: '', description: '' });
  const [suggestionStatus, setSuggestionStatus] = useState<string | null>(null);
  const [suggestionRows, setSuggestionRows] = useState<Array<{ externalCode: string; itemCode: string; description?: string; itemId?: number; selected?: boolean }>>([]);
  const [errorInboxId, setErrorInboxId] = useState('');
  const [batchStatus, setBatchStatus] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const response = await integrationsApi.getItemMappings('erp', { limit: 50, offset: 0, search });
      setItems(response.data || []);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Errore caricamento mapping');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async () => {
    if (!newRow.externalCode) {
      setError('External code obbligatorio');
      return;
    }
    await integrationsApi.saveItemMapping('erp', {
      externalCode: newRow.externalCode,
      itemCode: newRow.itemCode || null,
      description: newRow.description || null,
    });
    setNewRow({ externalCode: '', itemCode: '', description: '' });
    await load();
  };

  const handleDelete = async (id: number) => {
    await integrationsApi.deleteItemMapping('erp', id);
    await load();
  };

  const handleSuggest = async () => {
    if (!search) {
      setSuggestionStatus('Inserisci un filtro per suggerimenti');
      return;
    }
    try {
      const response = await integrationsApi.suggestItemMappings('erp', { search, limit: 10 });
      const rows = (response.data || []).map((row: any) => ({ ...row, selected: true }));
      setSuggestionRows(rows);
      setSuggestionStatus('Suggerimenti caricati');
    } catch (err: any) {
      setSuggestionStatus(err?.message || 'Errore suggerimenti');
    }
  };

  const handleSuggestFromErrors = async () => {
    if (!errorInboxId) {
      setSuggestionStatus('Inserisci ID inbox');
      return;
    }
    try {
      const response = await integrationsApi.suggestItemMappingsFromErrors('erp', {
        inboxId: Number(errorInboxId),
        limit: 10,
      });
      const rows = (response.data || []).map((row: any) => ({ ...row, selected: true }));
      setSuggestionRows(rows);
      setSuggestionStatus('Suggerimenti da scarti caricati');
    } catch (err: any) {
      setSuggestionStatus(err?.message || 'Errore suggerimenti scarti');
    }
  };

  const handleApplyBatch = async () => {
    const selectedRows = suggestionRows.filter((row) => row.selected);
    if (!selectedRows.length) {
      setBatchStatus('Nessun suggerimento');
      return;
    }
    setBatchStatus(null);
    try {
      const ok = window.confirm(`Creare ${selectedRows.length} mapping?`);
      if (!ok) return;
      for (const row of selectedRows) {
        await integrationsApi.saveItemMapping('erp', {
          externalCode: row.externalCode,
          itemCode: row.itemCode || null,
          description: row.description || null,
        });
      }
      setBatchStatus('Mapping creati');
      await load();
    } catch (err: any) {
      setBatchStatus(err?.message || 'Errore batch');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mapping articoli</h1>
            <p className="text-gray-600">Collega codici esterni EDI/ERP agli articoli WMS.</p>
          </div>
          <button
            onClick={load}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Aggiorna
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              type="text"
              value={newRow.externalCode}
              onChange={(e) => setNewRow((prev) => ({ ...prev, externalCode: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="External code"
            />
            <input
              type="text"
              value={newRow.itemCode}
              onChange={(e) => setNewRow((prev) => ({ ...prev, itemCode: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Codice articolo WMS"
            />
            <input
              type="text"
              value={newRow.description}
              onChange={(e) => setNewRow((prev) => ({ ...prev, description: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Descrizione"
            />
            <button
              onClick={handleAdd}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4" />
              Aggiungi
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Cerca codice esterno o WMS"
            />
            <button
              onClick={load}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700"
            >
              Cerca
            </button>
            <button
              onClick={handleSuggest}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700"
            >
              Suggerisci
            </button>
            <input
              type="number"
              value={errorInboxId}
              onChange={(e) => setErrorInboxId(e.target.value)}
              className="w-28 border border-gray-300 rounded-lg px-2 py-2 text-sm"
              placeholder="Inbox ID"
            />
            <button
              onClick={handleSuggestFromErrors}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700"
            >
              Suggerisci da scarti
            </button>
            <button
              onClick={handleApplyBatch}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700"
            >
              Crea mapping in batch
            </button>
            {suggestionStatus && <span className="text-xs text-gray-500">{suggestionStatus}</span>}
            {batchStatus && <span className="text-xs text-gray-500">{batchStatus}</span>}
          </div>
          {suggestionRows.length > 0 && (
            <div className="mb-3 text-xs text-gray-600 space-y-2">
              <div>{suggestionRows.length} suggerimenti disponibili.</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setSuggestionRows((prev) => prev.map((row) => ({ ...row, selected: true })))
                  }
                  className="px-2 py-1 text-xs rounded-lg border border-gray-300 text-gray-700"
                >
                  Seleziona tutto
                </button>
                <button
                  onClick={() =>
                    setSuggestionRows((prev) => prev.map((row) => ({ ...row, selected: false })))
                  }
                  className="px-2 py-1 text-xs rounded-lg border border-gray-300 text-gray-700"
                >
                  Deseleziona tutto
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestionRows.map((row, index) => (
                  <label
                    key={`${row.itemCode}-${index}`}
                    className={`flex items-center gap-2 px-2 py-1 text-xs rounded-lg border ${
                      row.selected ? 'border-blue-300 text-gray-700' : 'border-gray-200 text-gray-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={!!row.selected}
                      onChange={(e) =>
                        setSuggestionRows((prev) =>
                          prev.map((item, idx) =>
                            idx === index ? { ...item, selected: e.target.checked } : item
                          )
                        )
                      }
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setNewRow({
                          externalCode: row.externalCode,
                          itemCode: row.itemCode,
                          description: row.description || '',
                        })
                      }
                      className="text-left"
                    >
                      {row.itemCode} {row.description ? `- ${row.description}` : ''}
                    </button>
                  </label>
                ))}
              </div>
            </div>
          )}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
              Caricamento...
            </div>
          )}
          {error && <div className="text-sm text-red-600">{error}</div>}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2 pr-4">External</th>
                  <th className="py-2 pr-4">Articolo WMS</th>
                  <th className="py-2 pr-4">Descrizione</th>
                  <th className="py-2 pr-4">Azione</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} className="border-b last:border-none">
                    <td className="py-2 pr-4 text-gray-900">{row.externalCode}</td>
                    <td className="py-2 pr-4 text-gray-700">{row.itemCode || '-'}</td>
                    <td className="py-2 pr-4 text-gray-500">{row.description || '-'}</td>
                    <td className="py-2 pr-4">
                      <button
                        onClick={() => handleDelete(row.id)}
                        className="inline-flex items-center gap-1 text-xs text-red-600"
                      >
                        <TrashIcon className="h-4 w-4" />
                        Elimina
                      </button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && !loading && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-500">
                      Nessun mapping trovato.
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
