import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  ArrowLeftIcon,
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import Table from '../../../components/common/Table';
import Loading from '../../../components/common/Loading';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

/**
 * ListDetailPage - Vista dettagliata lista con items e azioni
 *
 * Features:
 * - Header: ID lista, tipo, stato, descrizione
 * - Metadata: Creato il, Operatore, Priorità, Progress bar
 * - Table items: Codice, Descrizione, Quantità, Ubicazione, Stato
 * - Actions: Avvia lista, Pausa, Completa, Cancella
 * - Button: Torna alla lista
 */
function ListDetailPage(): JSX.Element {
  const { id } = useParams();
  const navigate = useNavigate();
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch list detail
  const { data: list, isLoading, isError, error } = useQuery({
    queryKey: ['lists', id],
    queryFn: async () => {
      // Mock data per testing - sostituire con API reale
      return {
        id: parseInt(id),
        listType: 0,
        listTypeLabel: 'Picking',
        status: 'OPEN',
        statusLabel: 'Aperta',
        description: 'Lista picking magazzino A - Cliente XYZ',
        createdDate: '2025-11-25T10:00:00',
        assignedTo: 'operatore1',
        priority: 'HIGH',
        totalItems: 50,
        completedItems: 15,
        items: [
          {
            id: 1,
            code: 'ART-001',
            description: 'Articolo test 1',
            quantity: 10,
            location: 'A-01-02',
            status: 'PENDING',
          },
          {
            id: 2,
            code: 'ART-002',
            description: 'Articolo test 2',
            quantity: 5,
            location: 'B-03-04',
            status: 'COMPLETED',
          },
          {
            id: 3,
            code: 'ART-003',
            description: 'Articolo test 3',
            quantity: 15,
            location: 'C-05-06',
            status: 'PENDING',
          },
        ],
      };
    },
    staleTime: 30 * 1000, // 30 secondi
  });

  // Fetch list items
  const { data: items = [] } = useQuery({
    queryKey: ['lists', id, 'items'],
    queryFn: async () => {
      // Ritorna items dalla lista se già caricati
      return list?.items || [];
    },
    enabled: !!list,
    staleTime: 30 * 1000,
  });

  const handleBack = () => {
    navigate('/lists/management');
  };

  const handleStartList = async () => {
    setActionLoading(true);
    try {
      // TODO: Integrare API per avviare lista
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Lista avviata con successo');
    } catch (error) {
      toast.error('Errore durante l\'avvio della lista');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePauseList = async () => {
    setActionLoading(true);
    try {
      // TODO: Integrare API per mettere in pausa lista
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Lista messa in pausa');
    } catch (error) {
      toast.error('Errore durante la pausa della lista');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteList = async () => {
    setActionLoading(true);
    try {
      // TODO: Integrare API per completare lista
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Lista completata');
    } catch (error) {
      toast.error('Errore durante il completamento della lista');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelList = async () => {
    const confirmed = window.confirm(
      'Sei sicuro di voler cancellare questa lista? L\'operazione non è reversibile.'
    );

    if (!confirmed) return;

    setActionLoading(true);
    try {
      // TODO: Integrare API per cancellare lista
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Lista cancellata');
      navigate('/lists/management');
    } catch (error) {
      toast.error('Errore durante la cancellazione della lista');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      OPEN: { label: 'Aperta', variant: 'info' },
      IN_PROGRESS: { label: 'In Corso', variant: 'warning' },
      COMPLETED: { label: 'Completata', variant: 'success' },
      CANCELLED: { label: 'Annullata', variant: 'error' },
    };

    const statusInfo = statusMap[status] || { label: 'Sconosciuto', variant: 'default' };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getPriorityBadge = (priority) => {
    const priorityMap = {
      HIGH: { label: 'Alta', color: 'bg-red-100 text-red-800' },
      MEDIUM: { label: 'Media', color: 'bg-yellow-100 text-yellow-800' },
      LOW: { label: 'Bassa', color: 'bg-green-100 text-green-800' },
    };

    const priorityInfo = priorityMap[priority] || {
      label: 'Media',
      color: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${priorityInfo.color}`}>
        {priorityInfo.label}
      </span>
    );
  };

  const getItemStatusBadge = (status) => {
    const statusMap = {
      PENDING: { label: 'In Attesa', color: 'bg-gray-100 text-gray-800' },
      IN_PROGRESS: { label: 'In Corso', color: 'bg-blue-100 text-blue-800' },
      COMPLETED: { label: 'Completato', color: 'bg-green-100 text-green-800' },
      CANCELLED: { label: 'Annullato', color: 'bg-red-100 text-red-800' },
    };

    const statusInfo = statusMap[status] || {
      label: 'Sconosciuto',
      color: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

  const itemsColumns = [
    {
      accessorKey: 'code',
      header: 'Codice',
      cell: ({ row }) => (
        <span className="font-medium text-ferretto-red">{row.original.code}</span>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Descrizione',
      cell: ({ row }) => <span className="text-sm">{row.original.description}</span>,
    },
    {
      accessorKey: 'quantity',
      header: 'Quantità',
      cell: ({ row }) => <span className="font-medium">{row.original.quantity}</span>,
    },
    {
      accessorKey: 'location',
      header: 'Ubicazione',
      cell: ({ row }) => (
        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
          {row.original.location}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Stato',
      cell: ({ row }) => getItemStatusBadge(row.original.status),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loading size="lg" text="Caricamento dettaglio lista..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="text-red-600 text-lg font-semibold">
          Errore nel caricamento della lista
        </div>
        <div className="text-gray-600">{error?.message || 'Errore sconosciuto'}</div>
        <Button onClick={handleBack}>Torna alla Lista</Button>
      </div>
    );
  }

  const progressPercentage = list.totalItems > 0
    ? Math.round((list.completedItems / list.totalItems) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Torna alla Lista
          </Button>
        </div>

        <div className="flex items-center space-x-3">
          {list.status === 'OPEN' && (
            <Button
              variant="success"
              onClick={handleStartList}
              loading={actionLoading}
            >
              <PlayIcon className="w-5 h-5 mr-2" />
              Avvia Lista
            </Button>
          )}

          {list.status === 'IN_PROGRESS' && (
            <>
              <Button
                variant="warning"
                onClick={handlePauseList}
                loading={actionLoading}
              >
                <PauseIcon className="w-5 h-5 mr-2" />
                Pausa
              </Button>
              <Button
                variant="success"
                onClick={handleCompleteList}
                loading={actionLoading}
              >
                <CheckCircleIcon className="w-5 h-5 mr-2" />
                Completa
              </Button>
            </>
          )}

          {(list.status === 'OPEN' || list.status === 'IN_PROGRESS') && (
            <Button
              variant="danger"
              onClick={handleCancelList}
              loading={actionLoading}
            >
              <XCircleIcon className="w-5 h-5 mr-2" />
              Cancella
            </Button>
          )}
        </div>
      </div>

      {/* List Info */}
      <Card>
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dettaglio Lista #{list.id}</h1>
              <p className="text-gray-600 mt-1">{list.description}</p>
            </div>
            {getStatusBadge(list.status)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <div className="text-sm text-gray-600 mb-1">Tipo Lista:</div>
              <div className="font-semibold text-gray-900">{list.listTypeLabel}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Stato:</div>
              <div>{getStatusBadge(list.status)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Operatore:</div>
              <div className="font-semibold text-gray-900">{list.assignedTo}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Priorità:</div>
              <div>{getPriorityBadge(list.priority)}</div>
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-600 mb-1">Creato il:</div>
            <div className="font-semibold text-gray-900">
              {format(new Date(list.createdDate), 'PPpp', { locale: it })}
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-700">Progresso</div>
              <div className="text-sm font-semibold text-ferretto-red">
                {list.completedItems} / {list.totalItems} ({progressPercentage}%)
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-ferretto-red h-3 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Items Table */}
      <Card>
        <div className="mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Items Lista</h3>
          <p className="text-gray-600 text-sm mt-1">
            {items.length} items totali
          </p>
        </div>

        <Table data={items} columns={itemsColumns} pageSize={20} searchable />
      </Card>
    </div>
  );
}

export default ListDetailPage;
