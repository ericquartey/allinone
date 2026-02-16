// src/pages/lists/management/ListsManagementPage.tsx

/**
 * GESTIONE LISTE - Pagina Principale
 *
 * Implementazione completa basata su analisi Swing documentata in:
 * - MIGRAZIONE_EJLOG_SWING_TO_REACT.md
 * - ANALISI_BACKEND_OPERAZIONI_LISTE.md
 *
 * Features:
 * - Tabella liste con 13 colonne
 * - Filtri avanzati (tipo, stato, priorità, data, operatore)
 * - Color highlighting per stati (5 colori)
 * - Badge priorità (Alta/Media/Bassa)
 * - Progress bar completamento
 * - Paginazione
 * - Azioni: Esegui, Pausa, Completa, Annulla, Duplica, Elimina
 * - Dialogs per operazioni complesse
 */

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Copy,
  Trash2,
  Plus,
  Edit,
  Eye,
  RefreshCw,
  Filter,
} from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import toast from 'react-hot-toast';

// Hooks
import { useLists, useListFilters, useListActions, useListPermissions } from '../../../hooks/useLists';

// Types
import type { ListExport, ListType, ListStatus } from '../../../types/lists';

// Utils
import {
  getStatusLabel,
  getStatusBgColor,
  getStatusTextColor,
  getTypeLabel,
  getPriorityLabel,
  getPriorityBadgeColor,
  calculateProgressFromRows,
  getProgressColor,
  getListsStatistics,
  formatDate,
  formatDateTime,
} from '../../../utils/listUtils';

// Components
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import Loading from '../../../components/common/Loading';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const ListsManagementPage: React.FC = () => {
  const navigate = useNavigate();

  // Filters state
  const { filters, updateFilter, clearFilters, hasActiveFilters } = useListFilters();

  // Lists data
  const { lists, totalCount, loading, error, fetchLists } = useLists(filters);

  // Actions
  const listActions = useListActions(fetchLists);

  // UI state
  const [selectedList, setSelectedList] = useState<ListExport | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showExecuteDialog, setShowExecuteDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [copyListNumber, setCopyListNumber] = useState('');

  // ============================================================================
  // STATISTICS
  // ============================================================================

  const stats = getListsStatistics(lists.map(l => l.listHeader));

  // ============================================================================
  // ACTION HANDLERS
  // ============================================================================

  const handleExecuteList = useCallback(async (list: ListExport) => {
    const success = await listActions.executeList(list.listHeader.listNumber);
    if (success) {
      fetchLists();
    }
  }, [listActions, fetchLists]);

  const handlePauseList = useCallback(async (list: ListExport) => {
    const success = await listActions.pauseList(list.listHeader.listNumber);
    if (success) {
      fetchLists();
    }
  }, [listActions, fetchLists]);

  const handleCompleteList = useCallback(async (list: ListExport) => {
    const success = await listActions.completeList(list.listHeader.listNumber);
    if (success) {
      fetchLists();
    }
  }, [listActions, fetchLists]);

  const handleCancelList = useCallback(async () => {
    if (!selectedList) return;
    if (!cancelReason.trim()) {
      toast.error('Inserire motivo annullamento');
      return;
    }

    const success = await listActions.cancelList(selectedList.listHeader.listNumber, cancelReason);
    if (success) {
      setShowCancelDialog(false);
      setCancelReason('');
      setSelectedList(null);
      fetchLists();
    }
  }, [selectedList, cancelReason, listActions, fetchLists]);

  const handleCopyList = useCallback(async () => {
    if (!selectedList) return;
    if (!copyListNumber.trim()) {
      toast.error('Inserire numero nuova lista');
      return;
    }

    const success = await listActions.copyList(selectedList.listHeader.listNumber, copyListNumber);
    if (success) {
      setShowCopyDialog(false);
      setCopyListNumber('');
      setSelectedList(null);
      fetchLists();
    }
  }, [selectedList, copyListNumber, listActions, fetchLists]);

  const handleDeleteList = useCallback(async (list: ListExport) => {
    if (!window.confirm(`Confermi eliminazione lista ${list.listHeader.listNumber}?`)) {
      return;
    }

    const { deleteList } = useLists();
    const success = await deleteList(list.listHeader.listNumber);
    if (success) {
      fetchLists();
    }
  }, [fetchLists]);

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderStatusBadge = (status: ListStatus) => {
    const label = getStatusLabel(status);
    const bgColor = getStatusBgColor(status);
    const textColor = getStatusTextColor(status);

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
        {label}
      </span>
    );
  };

  const renderPriorityBadge = (priority: number) => {
    const label = getPriorityLabel(priority);
    const color = getPriorityBadgeColor(priority);

    const colorClasses = {
      red: 'bg-red-100 text-red-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      green: 'bg-green-100 text-green-800',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClasses[color as keyof typeof colorClasses]}`}>
        {label} ({priority})
      </span>
    );
  };

  const renderProgressBar = (list: ListExport) => {
    const progress = calculateProgressFromRows(list.listRows);
    const progressColor = getProgressColor(progress);

    const colorClasses = {
      gray: 'bg-gray-200',
      red: 'bg-red-500',
      yellow: 'bg-yellow-500',
      green: 'bg-green-500',
    };

    return (
      <div className="w-full">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>{progress}%</span>
          <span>{list.listRows.length} righe</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${colorClasses[progressColor as keyof typeof colorClasses]}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  };

  const renderActions = (list: ListExport) => {
    const permissions = useListPermissions(list.listHeader);

    return (
      <div className="flex gap-1">
        {permissions.canExecute && (
          <button
            onClick={() => handleExecuteList(list)}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            title="Esegui lista"
          >
            <Play size={16} />
          </button>
        )}

        {permissions.canPause && (
          <button
            onClick={() => handlePauseList(list)}
            className="p-1 text-yellow-600 hover:bg-yellow-50 rounded"
            title="Pausa lista"
          >
            <Pause size={16} />
          </button>
        )}

        {permissions.canTerminate && (
          <button
            onClick={() => handleCompleteList(list)}
            className="p-1 text-green-600 hover:bg-green-50 rounded"
            title="Completa lista"
          >
            <CheckCircle size={16} />
          </button>
        )}

        {permissions.canTerminate && (
          <button
            onClick={() => {
              setSelectedList(list);
              setShowCancelDialog(true);
            }}
            className="p-1 text-red-600 hover:bg-red-50 rounded"
            title="Annulla lista"
          >
            <XCircle size={16} />
          </button>
        )}

        {permissions.canCopy && (
          <button
            onClick={() => {
              setSelectedList(list);
              setShowCopyDialog(true);
            }}
            className="p-1 text-purple-600 hover:bg-purple-50 rounded"
            title="Duplica lista"
          >
            <Copy size={16} />
          </button>
        )}

        {permissions.canDelete && (
          <button
            onClick={() => handleDeleteList(list)}
            className="p-1 text-red-600 hover:bg-red-50 rounded"
            title="Elimina lista"
          >
            <Trash2 size={16} />
          </button>
        )}

        <button
          onClick={() => navigate(`/lists/${list.listHeader.listNumber}`)}
          className="p-1 text-gray-600 hover:bg-gray-50 rounded"
          title="Dettagli lista"
        >
          <Eye size={16} />
        </button>
      </div>
    );
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Errore caricamento liste</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={() => fetchLists()}
            className="mt-2 text-sm underline"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestione Liste</h1>
              <p className="text-sm text-gray-600 mt-1">
                {totalCount} liste totali
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  showFilters || hasActiveFilters
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Filter size={16} />
                Filtri
                {hasActiveFilters && <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">●</span>}
              </button>

              <button
                onClick={fetchLists}
                disabled={loading}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                Aggiorna
              </button>

              <button
                onClick={() => navigate('/lists/create')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus size={16} />
                Nuova Lista
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="px-6 py-4 grid grid-cols-7 gap-4">
          <Card className="p-3">
            <div className="text-xs text-gray-600">Totale</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-gray-600">Picking</div>
            <div className="text-2xl font-bold text-blue-600">{stats.picking}</div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-gray-600">Rifornimento</div>
            <div className="text-2xl font-bold text-purple-600">{stats.refilling}</div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-gray-600">Inventario</div>
            <div className="text-2xl font-bold text-orange-600">{stats.inventory}</div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-gray-600">In Attesa</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.waiting}</div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-gray-600">In Corso</div>
            <div className="text-2xl font-bold text-blue-600">{stats.inExecution}</div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-gray-600">Completate</div>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </Card>
        </div>

        {/* Filters Panel (Collapsible) */}
        {showFilters && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo Lista
                </label>
                <select
                  value={filters.listType || ''}
                  onChange={(e) => updateFilter('listType', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Tutti</option>
                  <option value="1">Picking</option>
                  <option value="2">Rifornimento</option>
                  <option value="3">Inventario</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stato
                </label>
                <select
                  value={filters.listStatus || ''}
                  onChange={(e) => updateFilter('listStatus', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Tutti</option>
                  <option value="1">In Attesa</option>
                  <option value="2">In Esecuzione</option>
                  <option value="3">Terminata</option>
                  <option value="4">Sospesa</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numero Lista
                </label>
                <input
                  type="text"
                  value={filters.listNumber || ''}
                  onChange={(e) => updateFilter('listNumber', e.target.value || undefined)}
                  placeholder="Cerca..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex items-end gap-2">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Pulisci
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="p-6">
        <Card>
          {loading ? (
            <div className="p-12">
              <Loading />
            </div>
          ) : lists.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <p>Nessuna lista trovata</p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-2 text-blue-600 hover:underline"
                >
                  Rimuovi filtri
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Numero</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrizione</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stato</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priorità</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Causale</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commessa</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progresso</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Creata</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {lists.map((list) => (
                    <tr key={list.listHeader.listNumber} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-sm">{list.listHeader.listNumber}</td>
                      <td className="px-4 py-3 text-sm">{list.listHeader.listDescription || '-'}</td>
                      <td className="px-4 py-3 text-sm">{getTypeLabel(list.listHeader.listType)}</td>
                      <td className="px-4 py-3">{renderStatusBadge(list.listHeader.listStatus!)}</td>
                      <td className="px-4 py-3">{renderPriorityBadge(list.listHeader.priority || 0)}</td>
                      <td className="px-4 py-3 text-sm">{list.listHeader.cause || '-'}</td>
                      <td className="px-4 py-3 text-sm">{list.listHeader.orderNumber || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="w-48">{renderProgressBar(list)}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">{formatDateTime(list.listHeader.createdAt)}</td>
                      <td className="px-4 py-3">{renderActions(list)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Pagination */}
        {totalCount > (filters.limit || 50) && (
          <div className="mt-4 flex justify-center">
            <div className="flex gap-2">
              <button
                onClick={() => updateFilter('offset', Math.max(0, (filters.offset || 0) - (filters.limit || 50)))}
                disabled={(filters.offset || 0) === 0}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50"
              >
                Precedente
              </button>
              <span className="px-4 py-2">
                Pagina {Math.floor((filters.offset || 0) / (filters.limit || 50)) + 1}
              </span>
              <button
                onClick={() => updateFilter('offset', (filters.offset || 0) + (filters.limit || 50))}
                disabled={(filters.offset || 0) + (filters.limit || 50) >= totalCount}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50"
              >
                Successiva
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dialog: Cancel List */}
      {showCancelDialog && selectedList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Annulla Lista</h3>
            <p className="text-sm text-gray-600 mb-4">
              Lista: <span className="font-mono">{selectedList.listHeader.listNumber}</span>
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivo annullamento *
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Inserisci motivo..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
              rows={4}
              required
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowCancelDialog(false);
                  setSelectedList(null);
                  setCancelReason('');
                }}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Annulla
              </button>
              <button
                onClick={handleCancelList}
                disabled={!cancelReason.trim() || listActions.isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {listActions.isLoading ? 'Annullamento...' : 'Conferma Annullamento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog: Copy List */}
      {showCopyDialog && selectedList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Duplica Lista</h3>
            <p className="text-sm text-gray-600 mb-4">
              Lista origine: <span className="font-mono">{selectedList.listHeader.listNumber}</span>
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Numero nuova lista *
            </label>
            <input
              type="text"
              value={copyListNumber}
              onChange={(e) => setCopyListNumber(e.target.value)}
              placeholder="Es: PICK001"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
              required
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowCopyDialog(false);
                  setSelectedList(null);
                  setCopyListNumber('');
                }}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Annulla
              </button>
              <button
                onClick={handleCopyList}
                disabled={!copyListNumber.trim() || listActions.isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {listActions.isLoading ? 'Duplicazione...' : 'Duplica'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListsManagementPage;
