// ============================================================================
// EJLOG WMS - List Operations Hub Page (Complete Implementation)
// Centro operazioni completo per gestione liste con tutte le funzionalità EjLog Swing
// ============================================================================

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Tab } from '@headlessui/react';
import {
  useGetListsQuery,
  useGetListRowsQuery,
  useExecuteListMutation,
  useTerminateListMutation,
  useSetListWaitingMutation,
} from '../../services/api/listsApi';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Badge from '../../components/shared/Badge';
import Input from '../../components/shared/Input';
import Spinner from '../../components/shared/Spinner';
import Alert from '../../components/shared/Alert';
import {
  PlayIcon,
  CheckCircleIcon,
  ClockIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  FunnelIcon,
  XMarkIcon,
  ClipboardDocumentListIcon,
  EyeIcon,
  BookmarkIcon,
  PauseIcon,
  StopIcon,
  PlusCircleIcon,
  PencilSquareIcon,
  BookmarkSlashIcon,
} from '@heroicons/react/24/outline';
import { ItemList } from '../../types/models';
import toast from 'react-hot-toast';
import { selectTouchMode } from '../../features/settings/settingsSlice';

// Import dei tab components
import InsertListTab from '../../components/operations/tabs/InsertListTab';
import EditListTab from '../../components/operations/tabs/EditListTab';
import ReserveListTab from '../../components/operations/tabs/ReserveListTab';
import UnreserveListTab from '../../components/operations/tabs/UnreserveListTab';

interface ColumnFilter {
  type?: string;
  status?: string;
  search?: string;
}

interface ExpandedRows {
  [key: string]: boolean;
}

interface StatusFilters {
  showInExecution: boolean;
  showInWaiting: boolean;
  showTerminated: boolean;
}

const ListOperationsHubPage: React.FC = () => {
  const navigate = useNavigate();
  const touchMode = useSelector(selectTouchMode);

  // Redirect to touch page if touch mode is enabled
  useEffect(() => {
    if (touchMode) {
      navigate('/operations/lists/touch', { replace: true });
    }
  }, [touchMode, navigate]);

  const [selectedListIds, setSelectedListIds] = useState<Set<string>>(new Set());
  const [searchCode, setSearchCode] = useState('');
  const [columnFilters, setColumnFilters] = useState<ColumnFilter>({});
  const [showFilters, setShowFilters] = useState(false);
  const [expandedRows, setExpandedRows] = useState<ExpandedRows>({});
  const [showModelsModal, setShowModelsModal] = useState(false);
  const [showMultipleRowsModal, setShowMultipleRowsModal] = useState(false);
  const [statusFilters, setStatusFilters] = useState<StatusFilters>({
    showInExecution: false,
    showInWaiting: false,
    showTerminated: false,
  });

  const { data: listsResponse, isLoading, error, refetch } = useGetListsQuery(
    {},
    {
      refetchOnMountOrArgChange: true,
      refetchOnFocus: false,
      refetchOnReconnect: false,
      pollingInterval: undefined, // affidiamo gli update a WebSocket
    }
  );

  // Notifica nuove liste rilevate durante il polling
  const previousIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const currentIds = new Set((listsResponse?.data || []).map(l => String(l.id)));
    if (previousIdsRef.current.size > 0) {
      const newOnes = Array.from(currentIds).filter(id => !previousIdsRef.current.has(id));
      if (newOnes.length > 0) {
        toast.success(`Nuove liste disponibili (${newOnes.length})`, { id: 'new-lists' });
      }
    }
    previousIdsRef.current = currentIds;
  }, [listsResponse]);

  // WebSocket listener per notifiche in tempo reale da backend (/ws, channel "lists")
  useEffect(() => {
    const lastRefetch = { ts: 0 };
    const wsUrl = import.meta.env.DEV
      ? 'ws://localhost:3077/ws'
      : `${window.location.origin.replace(/^http/, 'ws')}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      // opzionale: potrebbe richiedere subscribe esplicito, ma il server broadcasta su canale "lists"
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg?.channel === 'lists') {
          const now = Date.now();
          if (now - lastRefetch.ts > 1000) {
            lastRefetch.ts = now;
            refetch();
          }
          const label = msg?.type === 'list_created' ? 'Nuova lista creata' : 'Lista aggiornata';
          toast.success(label, { id: 'lists-realtime', duration: 2000 });
        }
      } catch (err) {
        // ignore parse errors
      }
    };

    socket.onerror = () => {
      socket.close();
    };

    return () => {
      socket.close();
    };
  }, [refetch]);

  const [executeList] = useExecuteListMutation();
  const [terminateList] = useTerminateListMutation();
  const [setListWaiting] = useSetListWaitingMutation();

  // Filtra le liste
  const filteredLists = useMemo(() => {
    let result = listsResponse?.data || [];

    // Filtro per ricerca codice
    if (searchCode) {
      result = result.filter(list =>
        list.code.toLowerCase().includes(searchCode.toLowerCase())
      );
    }

    // Filtro per tipo
    if (columnFilters.type) {
      result = result.filter(list => String(list.type) === columnFilters.type);
    }

    // Filtro per stato
    if (columnFilters.status) {
      result = result.filter(list => list.status === columnFilters.status);
    }

    // Filtri checkbox per stato (come in EjLog Swing)
    // NOTA: Se nessun filtro attivo, mostra tutte (comprese terminate)
    if (statusFilters.showInExecution || statusFilters.showInWaiting || statusFilters.showTerminated) {
      result = result.filter(list => {
        // Mostra liste in esecuzione (status='active')
        if (statusFilters.showInExecution && list.status === 'active') return true;
        // Mostra liste in attesa (status='waiting')
        if (statusFilters.showInWaiting && list.status === 'waiting') return true;
        // Mostra liste terminate (status='completed')
        if (statusFilters.showTerminated && list.status === 'completed') return true;
        return false;
      });
    }
    // Se nessun filtro attivo, mostra TUTTE le liste (incluse terminate)

    return result;
  }, [listsResponse?.data, searchCode, columnFilters, statusFilters]);

  // Ottieni tipi e stati unici per i filtri
  const uniqueTypes = useMemo(() => {
    const types = new Set(listsResponse?.data?.map(list => String(list.type)) || []);
    return Array.from(types).sort();
  }, [listsResponse?.data]);

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(listsResponse?.data?.map(list => list.status) || []);
    return Array.from(statuses);
  }, [listsResponse?.data]);

  // Calcola i contatori per ogni stato
  const statusCounts = useMemo(() => {
    const allLists = listsResponse?.data || [];
    return {
      inExecution: allLists.filter(list => list.status === 'active').length,
      inWaiting: allLists.filter(list => list.status === 'waiting').length,
      terminated: allLists.filter(list => list.status === 'completed').length,
    };
  }, [listsResponse?.data]);

  const handleSelectList = (listId: string) => {
    const newSet = new Set(selectedListIds);
    if (newSet.has(listId)) {
      newSet.delete(listId);
    } else {
      newSet.add(listId);
    }
    setSelectedListIds(newSet);
  };

  const handleSelectAll = () => {
    if (selectedListIds.size === filteredLists.length) {
      setSelectedListIds(new Set());
    } else {
      setSelectedListIds(new Set(filteredLists.map(list => String(list.id))));
    }
  };

  const handleToggleExpand = (listId: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [listId]: !prev[listId]
    }));
  };

  const handleClearFilters = () => {
    setColumnFilters({});
    setSearchCode('');
    setStatusFilters({
      showInExecution: false,
      showInWaiting: false,
      showTerminated: false,
    });
  };

  const handleShowMultipleRows = () => {
    setShowMultipleRowsModal(true);
  };

  // Funzioni per cambiare stato delle liste (come in EjLog Swing)
  const handleExecuteLists = async () => {
    if (selectedListIds.size === 0) {
      alert('Seleziona almeno una lista prima di procedere');
      return;
    }

    try {
      for (const listId of Array.from(selectedListIds)) {
        await executeList({ id: Number(listId) }).unwrap();
      }
      alert(`${selectedListIds.size} liste messe in esecuzione con successo`);
      setSelectedListIds(new Set());
      refetch();
    } catch (error) {
      alert('Errore durante l\'esecuzione delle liste: ' + JSON.stringify(error));
    }
  };

  const handleWaitingLists = async () => {
    if (selectedListIds.size === 0) {
      alert('Seleziona almeno una lista prima di procedere');
      return;
    }

    const reason = prompt('Inserisci il motivo della messa in attesa:');
    if (!reason) return;

    try {
      for (const listId of Array.from(selectedListIds)) {
        await setListWaiting({
          id: String(Number(listId)),
          reason,
          notes: 'Messa in attesa tramite interfaccia web',
        }).unwrap();
      }
      alert(`${selectedListIds.size} liste messe in attesa con successo`);
      setSelectedListIds(new Set());
      refetch();
    } catch (error) {
      alert('Errore durante la messa in attesa delle liste: ' + JSON.stringify(error));
    }
  };

  const handleTerminateLists = async () => {
    if (selectedListIds.size === 0) {
      alert('Seleziona almeno una lista prima di procedere');
      return;
    }

    if (!confirm(`Sei sicuro di voler terminare ${selectedListIds.size} liste?`)) {
      return;
    }

    try {
      for (const listId of Array.from(selectedListIds)) {
        await terminateList(Number(listId)).unwrap();
      }
      alert(`${selectedListIds.size} liste terminate con successo`);
      setSelectedListIds(new Set());
      refetch();
    } catch (error) {
      alert('Errore durante la terminazione delle liste: ' + JSON.stringify(error));
    }
  };

  const handleManageModels = () => {
    setShowModelsModal(true);
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      completed: 'Completata',
      unfulfillable: 'Non Evadibile',
      active: 'Attiva',
      waiting: 'In Attesa',
      reserved: 'Prenotata',
    };
    return labels[status] || status;
  };

  const getStatusVariant = (status: string) => {
    const variants: Record<string, 'success' | 'danger' | 'warning' | 'info' | 'default'> = {
      completed: 'success',
      unfulfillable: 'danger',
      active: 'warning',
      waiting: 'warning',
      reserved: 'info',
    };
    return variants[status] || 'default';
  };

  return (
    <div className="max-w-full mx-auto space-y-6 px-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Operazioni Liste</h1>
          <p className="text-gray-600 mt-1">Gestisci le operazioni sulle liste di lavoro</p>
        </div>
        <Button variant="ghost" onClick={() => navigate('/operations')}>
          Torna alle Operazioni
        </Button>
      </div>

      {/* Filtri Stato (Mini Card con Icone) */}
      <div>
        <h3 className="font-semibold mb-3 text-lg">Filtri Stato Liste</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card: Mostra Liste in Esecuzione */}
          <div
            onClick={() => setStatusFilters(prev => ({ ...prev, showInExecution: !prev.showInExecution }))}
            className={`
              relative cursor-pointer rounded-lg border-2 transition-all duration-200
              ${statusFilters.showInExecution
                ? 'border-blue-500 bg-blue-50 shadow-xl shadow-blue-300 scale-105'
                : 'border-gray-200 bg-white hover:border-blue-400 hover:shadow-lg hover:shadow-blue-200 hover:bg-blue-50 hover:scale-102'
              }
            `}
          >
            <div className="p-4 flex items-center space-x-4">
              <div className={`
                p-3 rounded-full transition-colors
                ${statusFilters.showInExecution
                  ? 'bg-blue-500 text-white'
                  : 'bg-blue-100 text-blue-600'
                }
              `}>
                <PlayIcon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h4 className={`font-semibold ${statusFilters.showInExecution ? 'text-blue-900' : 'text-gray-900'}`}>
                  Mostra Liste in Esecuzione
                </h4>
                {statusCounts.inExecution > 0 && (
                  <div className="mt-2 inline-block px-3 py-1 bg-red-500 text-white font-bold rounded animate-pulse">
                    {statusCounts.inExecution} {statusCounts.inExecution === 1 ? 'lista' : 'liste'}
                  </div>
                )}
              </div>
              {statusFilters.showInExecution && (
                <div className="absolute top-2 right-2">
                  <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                </div>
              )}
            </div>
          </div>

          {/* Card: Mostra Liste in Attesa */}
          <div
            onClick={() => setStatusFilters(prev => ({ ...prev, showInWaiting: !prev.showInWaiting }))}
            className={`
              relative cursor-pointer rounded-lg border-2 transition-all duration-200
              ${statusFilters.showInWaiting
                ? 'border-yellow-500 bg-yellow-50 shadow-xl shadow-yellow-300 scale-105'
                : 'border-gray-200 bg-white hover:border-yellow-400 hover:shadow-lg hover:shadow-yellow-200 hover:bg-yellow-50 hover:scale-102'
              }
            `}
          >
            <div className="p-4 flex items-center space-x-4">
              <div className={`
                p-3 rounded-full transition-colors
                ${statusFilters.showInWaiting
                  ? 'bg-yellow-500 text-white'
                  : 'bg-yellow-100 text-yellow-600'
                }
              `}>
                <PauseIcon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h4 className={`font-semibold ${statusFilters.showInWaiting ? 'text-yellow-900' : 'text-gray-900'}`}>
                  Mostra Liste in Attesa
                </h4>
                {statusCounts.inWaiting > 0 && (
                  <div className="mt-2 inline-block px-3 py-1 bg-red-500 text-white font-bold rounded animate-pulse">
                    {statusCounts.inWaiting} {statusCounts.inWaiting === 1 ? 'lista' : 'liste'}
                  </div>
                )}
              </div>
              {statusFilters.showInWaiting && (
                <div className="absolute top-2 right-2">
                  <CheckCircleIcon className="h-5 w-5 text-yellow-600" />
                </div>
              )}
            </div>
          </div>

          {/* Card: Mostra Liste Terminate */}
          <div
            onClick={() => setStatusFilters(prev => ({ ...prev, showTerminated: !prev.showTerminated }))}
            className={`
              relative cursor-pointer rounded-lg border-2 transition-all duration-200
              ${statusFilters.showTerminated
                ? 'border-green-500 bg-green-50 shadow-xl shadow-green-300 scale-105'
                : 'border-gray-200 bg-white hover:border-green-400 hover:shadow-lg hover:shadow-green-200 hover:bg-green-50 hover:scale-102'
              }
            `}
          >
            <div className="p-4 flex items-center space-x-4">
              <div className={`
                p-3 rounded-full transition-colors
                ${statusFilters.showTerminated
                  ? 'bg-green-500 text-white'
                  : 'bg-green-100 text-green-600'
                }
              `}>
                <StopIcon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h4 className={`font-semibold ${statusFilters.showTerminated ? 'text-green-900' : 'text-gray-900'}`}>
                  Mostra Liste Terminate
                </h4>
                {statusCounts.terminated > 0 && (
                  <div className="mt-2 inline-block px-3 py-1 bg-red-500 text-white font-bold rounded animate-pulse">
                    {statusCounts.terminated} {statusCounts.terminated === 1 ? 'lista' : 'liste'}
                  </div>
                )}
              </div>
              {statusFilters.showTerminated && (
                <div className="absolute top-2 right-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Barra azioni multiple */}
      {selectedListIds.size > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-blue-900">
                {selectedListIds.size} {selectedListIds.size === 1 ? 'lista selezionata' : 'liste selezionate'}
              </p>
            </div>
            <div className="flex gap-2">
              {selectedListIds.size > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShowMultipleRows}
                  leftIcon={<EyeIcon className="h-4 w-4" />}
                >
                  Visualizza Tutte le Righe
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedListIds(new Set())}
              >
                Deseleziona Tutto
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Tabella Liste */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Liste Disponibili</h2>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              leftIcon={<FunnelIcon className="h-4 w-4" />}
            >
              {showFilters ? 'Nascondi' : 'Mostra'} Filtri
            </Button>
            {(Object.keys(columnFilters).length > 0 || searchCode || statusFilters.showInExecution || statusFilters.showInWaiting || statusFilters.showTerminated) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                leftIcon={<XMarkIcon className="h-4 w-4" />}
              >
                Pulisci Filtri
              </Button>
            )}
          </div>
        </div>

        {/* Filtri */}
        {showFilters && (
          <div className="grid md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cerca per Codice
              </label>
              <Input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                placeholder="Filtra liste per codice..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo Lista
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={columnFilters.type || ''}
                onChange={(e) => setColumnFilters(prev => ({ ...prev, type: e.target.value }))}
              >
                <option value="">Tutti i tipi</option>
                {uniqueTypes.map(type => (
                  <option key={type} value={type}>Tipo {type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stato
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={columnFilters.status || ''}
                onChange={(e) => setColumnFilters(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="">Tutti gli stati</option>
                {uniqueStatuses.map(status => (
                  <option key={status} value={status}>{getStatusLabel(status)}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : error ? (
          <Alert type="error">
            Errore nel caricamento delle liste: {JSON.stringify(error)}
          </Alert>
        ) : filteredLists && filteredLists.length > 0 ? (
          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedListIds.size === filteredLists.length && filteredLists.length > 0}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Espandi
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Codice
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Descrizione
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tipo
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Stato
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Data Creazione
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Righe Totali
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Completate
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Iniziate
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Non Evadibili
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Priorità
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Azioni
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLists.map((list) => {
                  const listId = String(list.id);
                  const isExpanded = expandedRows[listId];
                  const isSelected = selectedListIds.has(listId);

                  const createdDate = list.createdAt ? new Date(list.createdAt).toLocaleString('it-IT', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'N/D';

                  return (
                    <React.Fragment key={list.id}>
                      <tr
                        className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
                      >
                        <td className="px-3 py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectList(listId)}
                            className="h-4 w-4 text-blue-600 rounded"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <button
                            onClick={() => handleToggleExpand(listId)}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            {isExpanded ? (
                              <ChevronDownIcon className="h-5 w-5 text-gray-600" />
                            ) : (
                              <ChevronRightIcon className="h-5 w-5 text-gray-600" />
                            )}
                          </button>
                        </td>
                        <td className="px-3 py-3 text-sm font-medium text-gray-900">{list.code}</td>
                        <td className="px-3 py-3 text-sm text-gray-600">{list.description || 'N/D'}</td>
                        <td className="px-3 py-3 text-sm">
                          <Badge variant="info">Tipo {list.type}</Badge>
                        </td>
                        <td className="px-3 py-3 text-sm">
                          <Badge variant={getStatusVariant(list.status)}>
                            {getStatusLabel(list.status)}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-600 whitespace-nowrap">{createdDate}</td>
                        <td className="px-3 py-3 text-sm text-right font-medium">{list.totalRows || 0}</td>
                        <td className="px-3 py-3 text-sm text-right">
                          <span className="text-green-600 font-medium">{list.completedRows || 0}</span>
                        </td>
                        <td className="px-3 py-3 text-sm text-right">
                          <span className="text-blue-600">{list.startedRows || 0}</span>
                        </td>
                        <td className="px-3 py-3 text-sm text-right">
                          <span className="text-red-600">{list.unfulfillableRows || 0}</span>
                        </td>
                        <td className="px-3 py-3 text-sm text-center">{list.priority || 1}</td>
                        <td className="px-3 py-3 text-right">
                          <div className="flex gap-1 justify-end">
                            <button
                              onClick={async () => {
                                try {
                                  await executeList({ id: Number(listId) }).unwrap();
                                  alert('Lista messa in esecuzione');
                                  refetch();
                                } catch (e) {
                                  alert('Errore: ' + JSON.stringify(e));
                                }
                              }}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              title="Esegui"
                            >
                              <PlayIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  await terminateList(Number(listId)).unwrap();
                                  alert('Lista terminata');
                                  refetch();
                                } catch (e) {
                                  alert('Errore: ' + JSON.stringify(e));
                                }
                              }}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              title="Completa"
                            >
                              <CheckCircleIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={async () => {
                                const reason = prompt('Motivo attesa:');
                                if (reason) {
                                  try {
                                    await setListWaiting({ id: String(Number(listId)), reason }).unwrap();
                                    alert('Lista messa in attesa');
                                    refetch();
                                  } catch (e) {
                                    alert('Errore: ' + JSON.stringify(e));
                                  }
                                }
                              }}
                              className="p-1 text-yellow-600 hover:bg-yellow-50 rounded"
                              title="Attesa"
                            >
                              <ClockIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={13} className="px-3 py-3 bg-gray-50">
                            <ListRowsExpanded listId={Number(list.id)} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Alert type="info">
            Nessuna lista disponibile
            {(searchCode || Object.keys(columnFilters).length > 0 || statusFilters.showInExecution || statusFilters.showInWaiting || statusFilters.showTerminated) && ' con i filtri specificati'}
          </Alert>
        )}
      </Card>

      {/* Card Operazioni (come in EjLog Swing) */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Esegui Liste */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleExecuteLists}>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <PlayIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Esegui Liste</h3>
              <p className="text-sm text-gray-600">Metti in esecuzione</p>
            </div>
          </div>
        </Card>

        {/* Card 2: Metti in Attesa */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleWaitingLists}>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-yellow-100 rounded-full">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Metti in Attesa</h3>
              <p className="text-sm text-gray-600">Sospendi liste</p>
            </div>
          </div>
        </Card>

        {/* Card 3: Termina Liste */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleTerminateLists}>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Termina Liste</h3>
              <p className="text-sm text-gray-600">Completa liste</p>
            </div>
          </div>
        </Card>

        {/* Card 4: Gestione Modelli */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleManageModels}>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 rounded-full">
              <ClipboardDocumentListIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Gestione Modelli</h3>
              <p className="text-sm text-gray-600">Modelli liste</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Sezione Tab per Gestione Liste */}
      <Card>
        <Tab.Group>
          <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1">
            <Tab
              className={({ selected }) =>
                `w-full rounded-lg py-3 px-4 text-sm font-medium leading-5 transition-all
                focus:outline-none focus:ring-2 ring-offset-2 ring-offset-blue-400 ring-white ring-opacity-60
                ${
                  selected
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-gray-700 hover:bg-white/[0.12] hover:text-blue-600'
                }`
              }
            >
              <div className="flex items-center justify-center space-x-2">
                <PlusCircleIcon className="h-5 w-5" />
                <span>Inserimento</span>
              </div>
            </Tab>
            <Tab
              className={({ selected }) =>
                `w-full rounded-lg py-3 px-4 text-sm font-medium leading-5 transition-all
                focus:outline-none focus:ring-2 ring-offset-2 ring-offset-green-400 ring-white ring-opacity-60
                ${
                  selected
                    ? 'bg-green-600 text-white shadow'
                    : 'text-gray-700 hover:bg-white/[0.12] hover:text-green-600'
                }`
              }
            >
              <div className="flex items-center justify-center space-x-2">
                <PencilSquareIcon className="h-5 w-5" />
                <span>Modifica</span>
              </div>
            </Tab>
            <Tab
              className={({ selected }) =>
                `w-full rounded-lg py-3 px-4 text-sm font-medium leading-5 transition-all
                focus:outline-none focus:ring-2 ring-offset-2 ring-offset-purple-400 ring-white ring-opacity-60
                ${
                  selected
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-gray-700 hover:bg-white/[0.12] hover:text-purple-600'
                }`
              }
            >
              <div className="flex items-center justify-center space-x-2">
                <BookmarkIcon className="h-5 w-5" />
                <span>Prenotazione</span>
              </div>
            </Tab>
            <Tab
              className={({ selected }) =>
                `w-full rounded-lg py-3 px-4 text-sm font-medium leading-5 transition-all
                focus:outline-none focus:ring-2 ring-offset-2 ring-offset-red-400 ring-white ring-opacity-60
                ${
                  selected
                    ? 'bg-red-600 text-white shadow'
                    : 'text-gray-700 hover:bg-white/[0.12] hover:text-red-600'
                }`
              }
            >
              <div className="flex items-center justify-center space-x-2">
                <BookmarkSlashIcon className="h-5 w-5" />
                <span>Deprenotazione</span>
              </div>
            </Tab>
          </Tab.List>

          <Tab.Panels className="mt-6">
            <Tab.Panel className="rounded-xl p-3 focus:outline-none">
              <InsertListTab />
            </Tab.Panel>
            <Tab.Panel className="rounded-xl p-3 focus:outline-none">
              <EditListTab />
            </Tab.Panel>
            <Tab.Panel className="rounded-xl p-3 focus:outline-none">
              <ReserveListTab />
            </Tab.Panel>
            <Tab.Panel className="rounded-xl p-3 focus:outline-none">
              <UnreserveListTab />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </Card>

      {/* Modali */}
      {showModelsModal && (
        <ModelsModal onClose={() => setShowModelsModal(false)} />
      )}

      {showMultipleRowsModal && (
        <MultipleRowsModal
          listIds={Array.from(selectedListIds).map(Number)}
          onClose={() => setShowMultipleRowsModal(false)}
        />
      )}
    </div>
  );
};

// Componente per visualizzare le righe espanse di una lista
const ListRowsExpanded: React.FC<{ listId: number }> = ({ listId }) => {
  const { data: rowsData, isLoading, error } = useGetListRowsQuery({ id: listId });

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <Alert type="error">
        Errore nel caricamento delle righe
      </Alert>
    );
  }

  if (!rowsData?.data || rowsData.data.length === 0) {
    return (
      <Alert type="info">
        Nessuna riga presente in questa lista
      </Alert>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">N. Riga</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Codice Articolo</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Descrizione</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Barcode</th>
            <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">Qtà Richiesta</th>
            <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">Qtà Movimentata</th>
            <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">Qtà Riservata</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Lotto</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Matricola</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Stato</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {rowsData.data.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50">
              <td className="px-3 py-2">{row.rowNumber}</td>
              <td className="px-3 py-2 font-medium">{row.itemCode}</td>
              <td className="px-3 py-2">{row.description}</td>
              <td className="px-3 py-2 text-gray-600">{row.barcode || '-'}</td>
              <td className="px-3 py-2 text-right">{row.requestedQuantity}</td>
              <td className="px-3 py-2 text-right text-green-600">{row.movedQuantity}</td>
              <td className="px-3 py-2 text-right text-blue-600">{row.reservedQuantity}</td>
              <td className="px-3 py-2">{row.lot || '-'}</td>
              <td className="px-3 py-2">{row.serialNumber || '-'}</td>
              <td className="px-3 py-2">
                {row.completed ? (
                  <Badge variant="success">Completata</Badge>
                ) : row.unfulfillable ? (
                  <Badge variant="danger">Non Evadibile</Badge>
                ) : (
                  <Badge variant="warning">Da Evadere</Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Modal per i modelli di liste
const ModelsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const models = [
    { id: 1, name: 'Modello Picking Standard', type: 1, description: 'Lista picking per ordini standard' },
    { id: 2, name: 'Modello Riordino', type: 2, description: 'Lista per riordini automatici' },
    { id: 3, name: 'Modello Inventario', type: 3, description: 'Lista per inventario ciclico' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold">Modelli Liste</h2>
          <p className="text-gray-600 mt-1">Seleziona un modello per creare una nuova lista</p>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-3">
            {models.map((model) => (
              <div
                key={model.id}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{model.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{model.description}</p>
                    <div className="mt-2">
                      <Badge variant="info">Tipo {model.type}</Badge>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    Usa Modello
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-6 border-t bg-gray-50">
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
              Chiudi
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Modal per visualizzare le righe di liste multiple
const MultipleRowsModal: React.FC<{ listIds: number[]; onClose: () => void }> = ({ listIds, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold">Righe Liste Selezionate</h2>
          <p className="text-gray-600 mt-1">
            Visualizzazione righe di {listIds.length} {listIds.length === 1 ? 'lista' : 'liste'}
          </p>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-6">
            {listIds.map((listId) => (
              <div key={listId} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b">
                  <h3 className="font-semibold">Lista ID: {listId}</h3>
                </div>
                <div className="p-4">
                  <ListRowsExpanded listId={listId} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-6 border-t bg-gray-50">
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
              Chiudi
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListOperationsHubPage;

