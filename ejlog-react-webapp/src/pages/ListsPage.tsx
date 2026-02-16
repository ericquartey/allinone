import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Table from '../components/common/Table';
import Modal from '../components/common/Modal';
import Loading from '../components/common/Loading';
import Badge from '../components/common/Badge';
import { useLists } from '../hooks/useLists';
import { useListOperations } from '../hooks/useListOperations';

function ListsPage(): JSX.Element {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedList, setSelectedList] = useState(null);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(50);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Fetch lists from real API
  const { data, isLoading, isError, error, refetch } = useLists({
    skip: page * pageSize,
    take: pageSize,
    orderBy: 'numeroLista',
    listType: filterType || null,
    status: filterStatus || null,
  });

  // List operations hook
  const { setListWaiting, terminateList, loading: operationLoading } = useListOperations();

  // Extract lists from response
  const lists = data?.lists || [];
  const totalCount = data?.totalCount || 0;

  const handleViewDetails = (list) => {
    setSelectedList(list);
    setShowDetailModal(true);
  };

  const handleExecute = async (list) => {
    const success = await setListWaiting(parseInt(list.numeroLista));
    if (success) {
      await refetch();
    }
  };

  const handleTerminate = async (list) => {
    const success = await terminateList(parseInt(list.numeroLista));
    if (success) {
      await refetch();
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      0: { label: 'Creata', variant: 'info' },
      1: { label: 'In Esecuzione', variant: 'warning' },
      2: { label: 'Completata', variant: 'success' },
      3: { label: 'Annullata', variant: 'error' },
    };

    const statusInfo = statusMap[status] || { label: 'Sconosciuto', variant: 'default' };

    return (
      <Badge variant={statusInfo.variant}>
        {statusInfo.label}
      </Badge>
    );
  };

  const getTypeBadge = (tipo) => {
    const typeMap = {
      1: { label: 'Prelievo', color: 'bg-blue-100 text-blue-800' },
      2: { label: 'Versamento', color: 'bg-green-100 text-green-800' },
      3: { label: 'Inventario', color: 'bg-purple-100 text-purple-800' },
      4: { label: 'Trasferimento', color: 'bg-orange-100 text-orange-800' },
    };

    const typeInfo = typeMap[tipo] || { label: 'Altro', color: 'bg-gray-100 text-gray-800' };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeInfo.color}`}>
        {typeInfo.label}
      </span>
    );
  };

  const columns = [
    {
      accessorKey: 'numeroLista',
      header: 'N° Lista',
      cell: ({ row }) => (
        <span className="font-medium text-ferretto-red">{row.original.numeroLista}</span>
      ),
    },
    {
      accessorKey: 'tipo',
      header: 'Tipo',
      cell: ({ row }) => getTypeBadge(row.original.tipo),
    },
    {
      accessorKey: 'descrizione',
      header: 'Descrizione',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.descrizione || '-'}</span>
      ),
    },
    {
      accessorKey: 'numeroRighe',
      header: 'Righe',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.numeroRighe || 0}</span>
      ),
    },
    {
      accessorKey: 'stato',
      header: 'Stato',
      cell: ({ row }) => getStatusBadge(row.original.stato),
    },
    {
      accessorKey: 'dataCreazione',
      header: 'Data Creazione',
      cell: ({ row }) => {
        const date = row.original.dataCreazione;
        return date ? new Date(date).toLocaleString('it-IT') : '-';
      },
    },
    {
      id: 'actions',
      header: 'Azioni',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleViewDetails(row.original)}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="Dettagli"
          >
            <EyeIcon className="w-5 h-5" />
          </button>
          {row.original.stato === 0 && (
            <button
              onClick={() => handleExecute(row.original)}
              className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
              title="Esegui"
            >
              <CheckCircleIcon className="w-5 h-5" />
            </button>
          )}
          {row.original.stato === 1 && (
            <button
              onClick={() => handleTerminate(row.original)}
              className="p-1 text-orange-600 hover:bg-orange-50 rounded transition-colors"
              title="Chiudi"
            >
              <XCircleIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loading size="lg" text="Caricamento liste dal server..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="text-red-600 text-lg font-semibold">
          Errore nel caricamento delle liste
        </div>
        <div className="text-gray-600">
          {error?.message || 'Errore sconosciuto'}
        </div>
        <Button onClick={() => window.location.reload()}>
          Ricarica la pagina
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Gestione Liste
          </h1>
          <p className="text-gray-600 mt-1">
            {totalCount} liste totali • Pagina {page + 1} • {lists.length} visualizzate
          </p>
          <div className="flex items-center space-x-2 mt-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              🟢 Backend Connesso
            </span>
            <span className="text-xs text-gray-500">
              Dati dal server EjLog
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="secondary" onClick={() => toast.info('Export in sviluppo')}>
            <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
            Esporta
          </Button>
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            <PlusIcon className="w-5 h-5 mr-2" />
            Nuova Lista
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtri</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo Lista
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ferretto-red focus:border-transparent"
            >
              <option value="">Tutti i tipi</option>
              <option value="1">Prelievo</option>
              <option value="2">Versamento</option>
              <option value="3">Inventario</option>
              <option value="4">Trasferimento</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stato
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ferretto-red focus:border-transparent"
            >
              <option value="">Tutti gli stati</option>
              <option value="0">Creata</option>
              <option value="1">In Esecuzione</option>
              <option value="2">Completata</option>
              <option value="3">Annullata</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button
              variant="ghost"
              onClick={() => {
                setFilterType('');
                setFilterStatus('');
              }}
              className="w-full"
            >
              Pulisci Filtri
            </Button>
          </div>
        </div>
      </Card>

      {/* Lists Table */}
      <Card padding="none">
        <div className="p-6">
          <Table data={lists} columns={columns} pageSize={10} searchable />
        </div>
      </Card>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Dettagli Lista"
        size="lg"
      >
        {selectedList && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numero Lista
                </label>
                <div className="text-lg font-semibold text-ferretto-red">
                  {selectedList.numeroLista}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <div>{getTypeBadge(selectedList.tipo)}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stato
                </label>
                <div>{getStatusBadge(selectedList.stato)}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numero Righe
                </label>
                <div className="text-lg font-semibold">
                  {selectedList.numeroRighe || 0}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrizione
              </label>
              <div className="text-gray-900">
                {selectedList.descrizione || 'Nessuna descrizione'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Creazione
              </label>
              <div className="text-gray-900">
                {selectedList.dataCreazione
                  ? new Date(selectedList.dataCreazione).toLocaleString('it-IT')
                  : '-'}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nuova Lista"
        footer={
          <Modal.Footer
            onCancel={() => setShowCreateModal(false)}
            onConfirm={() => {
              toast.success('Creazione lista in fase di implementazione');
              setShowCreateModal(false);
            }}
            confirmText="Crea"
          />
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo Lista
            </label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ferretto-red focus:border-transparent">
              <option value="1">Prelievo</option>
              <option value="2">Versamento</option>
              <option value="3">Inventario</option>
              <option value="4">Trasferimento</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrizione
            </label>
            <textarea
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ferretto-red focus:border-transparent"
              placeholder="Descrizione della lista..."
              rows={3}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default ListsPage;
