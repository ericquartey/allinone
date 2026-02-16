// ============================================================================
// EJLOG WMS - List Monitor Page
// Monitoraggio real-time liste in esecuzione
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCwIcon, EyeIcon } from 'lucide-react';
import { useGetListsQuery } from '../../services/api';
import type { ItemList, ItemListStatus } from '../../types/models';

const ListMonitorPage: React.FC = () => {
  const navigate = useNavigate();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 secondi

  // Filtra solo liste in esecuzione o sospese
  const { data: lists = [], isLoading, refetch } = useGetListsQuery({
    status: 1, // In esecuzione
  });

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refetch();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refetch]);

  const getStatusLabel = (status: ItemListStatus): string => {
    const labels: Record<number, string> = {
      0: 'Da Evadere',
      1: 'In Esecuzione',
      2: 'Sospesa',
      3: 'Completata',
      4: 'Annullata',
      5: 'Inevadibile',
    };
    return labels[status] || 'Sconosciuto';
  };

  const getStatusColor = (status: ItemListStatus): string => {
    const colors: Record<number, string> = {
      1: 'bg-blue-500',
      2: 'bg-orange-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const getTypeLabel = (type: number): string => {
    const labels: Record<number, string> = {
      0: 'Picking',
      1: 'Stoccaggio',
      2: 'Inventario',
      3: 'Trasferimento',
      4: 'Rettifica',
      5: 'Produzione',
    };
    return labels[type] || 'Sconosciuto';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Monitoraggio Liste</h1>
          <p className="text-gray-600">Visualizzazione real-time delle liste in esecuzione</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Auto-refresh toggle */}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Auto-refresh</span>
          </label>

          {/* Refresh interval */}
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            disabled={!autoRefresh}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
          >
            <option value={3000}>3 sec</option>
            <option value={5000}>5 sec</option>
            <option value={10000}>10 sec</option>
            <option value={30000}>30 sec</option>
          </select>

          {/* Manual refresh */}
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCwIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Aggiorna
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Liste in Esecuzione</h3>
          <p className="text-3xl font-bold text-blue-600">
            {lists.filter((l) => l.status === 1).length}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Liste Sospese</h3>
          <p className="text-3xl font-bold text-orange-600">
            {lists.filter((l) => l.status === 2).length}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Avanzamento Medio</h3>
          <p className="text-3xl font-bold text-green-600">
            {lists.length > 0
              ? Math.round(
                  lists.reduce((sum, list) => {
                    const total = list.totalRows || 0;
                    const completed = list.completedRows || 0;
                    return sum + (total > 0 ? (completed / total) * 100 : 0);
                  }, 0) / lists.length
                )
              : 0}
            %
          </p>
        </div>
      </div>

      {/* Liste Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isLoading && lists.length === 0 ? (
          <div className="col-span-2 flex justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
              <p className="mt-4 text-gray-600">Caricamento...</p>
            </div>
          </div>
        ) : lists.length === 0 ? (
          <div className="col-span-2 bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">Nessuna lista in esecuzione</p>
          </div>
        ) : (
          lists.map((list) => {
            const totalRows = list.totalRows || 0;
            const completedRows = list.completedRows || 0;
            const percentage = totalRows > 0 ? Math.round((completedRows / totalRows) * 100) : 0;

            return (
              <div
                key={list.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
              >
                {/* Card Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{list.code}</h3>
                      <p className="text-sm text-gray-600">{list.description || '-'}</p>
                    </div>
                    <button
                      onClick={() => navigate(`/lists/${list.id}`)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Visualizza dettagli"
                    >
                      <EyeIcon className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-full text-white ${getStatusColor(
                        list.status
                      )}`}
                    >
                      {getStatusLabel(list.status)}
                    </span>
                    <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                      {getTypeLabel(list.itemListType)}
                    </span>
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                      Priorità {list.priority}
                    </span>
                  </div>
                </div>

                {/* Progress */}
                <div className="p-6">
                  <div className="mb-2 flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Avanzamento</span>
                    <span className="text-sm font-bold text-gray-900">{percentage}%</span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                    <div
                      className={`h-4 rounded-full transition-all duration-500 ${
                        percentage === 100
                          ? 'bg-green-500'
                          : percentage > 50
                          ? 'bg-blue-500'
                          : 'bg-yellow-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-sm text-gray-600">
                    <span>
                      Righe: {completedRows} / {totalRows}
                    </span>
                    {list.requestedQuantity && list.dispatchedQuantity && (
                      <span>
                        Qtà: {list.dispatchedQuantity} / {list.requestedQuantity}
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Info */}
                {list.createdAt && (
                  <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Creata: {new Date(list.createdAt).toLocaleString('it-IT')}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ListMonitorPage;
