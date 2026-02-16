// ============================================================================
// EJLOG WMS - List Detail Page Enhanced
// Pagina dettaglio lista con visualizzazione righe
// ============================================================================

import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
} from 'lucide-react';
import DataGridAdvanced from '../../components/common/DataGridAdvanced';
import ExportButton from '../../components/common/ExportButton';
import {
  useGetListByIdQuery,
  useGetListRowsQuery,
  useExecuteListMutation,
  useSuspendListMutation,
  useTerminateListMutation,
  useDeleteListMutation,
} from '../../services/api';
import type { ItemListRow } from '../../types/models';

const ListDetailPageEnhanced: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const listId = Number(id);

  // Query e mutations
  const { data: list, isLoading, error, refetch } = useGetListByIdQuery(listId);
  const { data: rows = [], isLoading: rowsLoading } = useGetListRowsQuery(listId);
  const [executeList] = useExecuteListMutation();
  const [suspendList] = useSuspendListMutation();
  const [terminateList] = useTerminateListMutation();
  const [deleteList] = useDeleteListMutation();

  // Definizione colonne righe
  const columns = useMemo<ColumnDef<ItemListRow>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Codice Riga',
        cell: ({ getValue }) => getValue() || '-',
      },
      {
        accessorKey: 'itemCode',
        header: 'Codice Articolo',
        cell: ({ getValue }) => getValue() || '-',
      },
      {
        accessorKey: 'itemDescription',
        header: 'Descrizione',
        cell: ({ getValue }) => getValue() || '-',
      },
      {
        accessorKey: 'requestedQuantity',
        header: 'Qtà Richiesta',
        cell: ({ getValue }) => getValue(),
      },
      {
        accessorKey: 'dispatchedQuantity',
        header: 'Qtà Evasa',
        cell: ({ getValue }) => getValue(),
      },
      {
        id: 'progress',
        header: 'Avanzamento',
        cell: ({ row }) => {
          const requested = row.original.requestedQuantity;
          const dispatched = row.original.dispatchedQuantity;
          const percentage = requested > 0 ? Math.round((dispatched / requested) * 100) : 0;

          return (
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2 w-24">
                <div
                  className={`h-2 rounded-full transition-all ${
                    percentage === 100 ? 'bg-green-600' : 'bg-blue-600'
                  }`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
              <span className="text-xs text-gray-600 w-12 text-right">{percentage}%</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'isCompleted',
        header: 'Completata',
        cell: ({ getValue }) => {
          const isCompleted = getValue() as boolean;
          return isCompleted ? (
            <CheckCircleIcon className="w-5 h-5 text-green-600" />
          ) : (
            <XCircleIcon className="w-5 h-5 text-gray-400" />
          );
        },
      },
      {
        accessorKey: 'lot',
        header: 'Lotto',
        cell: ({ getValue }) => getValue() || '-',
      },
      {
        accessorKey: 'serialNumber',
        header: 'Matricola',
        cell: ({ getValue }) => getValue() || '-',
      },
    ],
    []
  );

  // Handlers
  const handleExecute = async () => {
    if (!confirm('Vuoi avviare l\'esecuzione di questa lista?')) return;

    try {
      await executeList({ id: listId, userName: 'current_user' }).unwrap();
      toast.success('Lista avviata con successo');
      refetch();
    } catch (error) {
      toast.error('Errore durante l\'avvio della lista');
    }
  };

  const handleSuspend = async () => {
    if (!confirm('Vuoi sospendere questa lista?')) return;

    try {
      await suspendList({ id: listId, userName: 'current_user' }).unwrap();
      toast.success('Lista sospesa con successo');
      refetch();
    } catch (error) {
      toast.error('Errore durante la sospensione della lista');
    }
  };

  const handleTerminate = async () => {
    if (!confirm('Vuoi terminare questa lista? Questa azione non può essere annullata.')) return;

    try {
      await terminateList(listId).unwrap();
      toast.success('Lista terminata con successo');
      navigate('/lists');
    } catch (error) {
      toast.error('Errore durante la terminazione della lista');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Sei sicuro di voler eliminare questa lista? Questa azione non può essere annullata.')) return;

    try {
      await deleteList(listId).unwrap();
      toast.success('Lista eliminata con successo');
      navigate('/lists');
    } catch (error) {
      toast.error('Errore durante l\'eliminazione della lista');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (error || !list) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Errore durante il caricamento della lista</p>
          <button
            onClick={() => navigate('/lists')}
            className="mt-4 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Torna alle liste
          </button>
        </div>
      </div>
    );
  }

  const getStatusLabel = (status: number): string => {
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

  const getStatusColor = (status: number): string => {
    const colors: Record<number, string> = {
      0: 'bg-yellow-100 text-yellow-800',
      1: 'bg-blue-100 text-blue-800',
      2: 'bg-orange-100 text-orange-800',
      3: 'bg-green-100 text-green-800',
      4: 'bg-red-100 text-red-800',
      5: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const totalProgress =
    list.totalRows && list.totalRows > 0
      ? Math.round(((list.completedRows || 0) / list.totalRows) * 100)
      : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/lists')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Lista {list.code}</h1>
            <p className="text-gray-600">{list.description || 'Nessuna descrizione'}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {list.status === 0 && (
            <button
              onClick={handleExecute}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <PlayIcon className="w-4 h-4" />
              Esegui
            </button>
          )}

          {list.status === 1 && (
            <button
              onClick={handleSuspend}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              <PauseIcon className="w-4 h-4" />
              Sospendi
            </button>
          )}

          {(list.status === 1 || list.status === 2) && (
            <button
              onClick={handleTerminate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <CheckCircleIcon className="w-4 h-4" />
              Termina
            </button>
          )}

          {(list.status === 0 || list.status === 4) && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <TrashIcon className="w-4 h-4" />
              Elimina
            </button>
          )}

          <ExportButton
            data={rows}
            filename={`lista-${list.code}-righe`}
            columns={[
              { key: 'code', label: 'Codice Riga' },
              { key: 'itemCode', label: 'Codice Articolo' },
              { key: 'itemDescription', label: 'Descrizione' },
              { key: 'requestedQuantity', label: 'Qtà Richiesta' },
              { key: 'dispatchedQuantity', label: 'Qtà Evasa' },
              { key: 'lot', label: 'Lotto' },
              { key: 'serialNumber', label: 'Matricola' },
            ]}
          />
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Stato</h3>
            <span className={`inline-block px-3 py-1 rounded-full text-sm ${getStatusColor(list.status)}`}>
              {getStatusLabel(list.status)}
            </span>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Priorità</h3>
            <p className="text-lg font-semibold">{list.priority}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Avanzamento Totale</h3>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    totalProgress === 100 ? 'bg-green-600' : 'bg-blue-600'
                  }`}
                  style={{ width: `${totalProgress}%` }}
                />
              </div>
              <span className="text-sm font-medium">{totalProgress}%</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {list.completedRows || 0} / {list.totalRows || 0} righe completate
            </p>
          </div>
        </div>

        {list.createdAt && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Creata il {new Date(list.createdAt).toLocaleString('it-IT')}
              {list.createdBy && ` da ${list.createdBy}`}
            </p>
          </div>
        )}
      </div>

      {/* Righe Lista */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Righe Lista</h2>
        </div>

        <DataGridAdvanced
          data={rows}
          columns={columns}
          loading={rowsLoading}
          searchable
          exportable
        />
      </div>
    </div>
  );
};

export default ListDetailPageEnhanced;
