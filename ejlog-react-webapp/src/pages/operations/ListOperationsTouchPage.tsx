// ============================================================================
// EJLOG WMS - List Operations Touch Page
// Interfaccia ottimizzata per dispositivi touch (tablet, touchscreen)
// Pulsanti grandi, navigazione semplice, niente scroll
// ============================================================================

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useGetListsQuery,
  useExecuteListMutation,
  useTerminateListMutation,
  useSetListWaitingMutation,
} from '../../services/api/listsApi';
import Badge from '../../components/shared/Badge';
import Spinner from '../../components/shared/Spinner';
import {
  PlayIcon,
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  FunnelIcon,
  HomeIcon,
  StopIcon,
  PauseIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

type TabView = 'lists' | 'execute' | 'waiting' | 'terminate' | 'terminated' | 'filters';

interface StatusFilters {
  showInExecution: boolean;
  showInWaiting: boolean;
  showTerminated: boolean;
}

const ListOperationsTouchPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState<TabView>('lists');
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [terminatedPage, setTerminatedPage] = useState(0);
  const [statusFilters, setStatusFilters] = useState<StatusFilters>({
    showInExecution: false,
    showInWaiting: false,
    showTerminated: false,
  });

  const ITEMS_PER_PAGE = 6;

  const { data: listsResponse, isLoading, refetch } = useGetListsQuery({}, {
    refetchOnMountOrArgChange: true,
  });

  const [executeList] = useExecuteListMutation();
  const [terminateList] = useTerminateListMutation();
  const [setListWaiting] = useSetListWaitingMutation();

  // WebSocket per aggiornamenti real-time
  useEffect(() => {
    const wsUrl = import.meta.env.DEV
      ? 'ws://localhost:3077/ws'
      : `${window.location.origin.replace(/^http/, 'ws')}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        const isListsEvent =
          msg?.channel === 'lists' ||
          msg?.type === 'lists_update' ||
          msg?.type === 'list_updated' ||
          msg?.type === 'list_changed';

        if (isListsEvent) {
          refetch();
          toast.success('Lista aggiornata', { id: 'lists-update', duration: 2000 });
        }
      } catch (err) {
        // ignore
      }
    };

    return () => socket.close();
  }, [refetch]);

  useEffect(() => {
    const handleAiListUpdate = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail?.listId) {
        refetch();
      }
    };

    window.addEventListener('ai:list-updated', handleAiListUpdate);
    return () => window.removeEventListener('ai:list-updated', handleAiListUpdate);
  }, [refetch]);

  // Filtra le liste (escludi le terminate dal tab principale, hanno il loro tab dedicato)
  const filteredLists = useMemo(() => {
    let result = listsResponse?.data || [];

    // Prima filtra via le liste terminate (vanno nel tab dedicato)
    result = result.filter(list => list.status !== 'completed');

    // Poi applica i filtri dell'utente
    if (statusFilters.showInExecution || statusFilters.showInWaiting) {
      result = result.filter(list => {
        if (statusFilters.showInExecution && list.status === 'active') return true;
        if (statusFilters.showInWaiting && list.status === 'waiting') return true;
        return false;
      });
    }

    return result;
  }, [listsResponse?.data, statusFilters]);

  // Paginazione
  const paginatedLists = useMemo(() => {
    const start = currentPage * ITEMS_PER_PAGE;
    return filteredLists.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredLists, currentPage]);

  const totalPages = Math.ceil(filteredLists.length / ITEMS_PER_PAGE);

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      completed: 'Completata',
      unfulfillable: 'Non Evadibile',
      active: 'In Esecuzione',
      waiting: 'In Attesa',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: 'bg-green-500',
      unfulfillable: 'bg-red-500',
      active: 'bg-blue-500',
      waiting: 'bg-yellow-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const handleExecute = async () => {
    if (!selectedListId) {
      toast.error('Seleziona una lista');
      return;
    }

    try {
      await executeList({ id: selectedListId }).unwrap();
      toast.success('Lista messa in esecuzione');
      setSelectedListId(null);
      setCurrentTab('lists');
      refetch();
    } catch (error) {
      toast.error('Errore durante esecuzione');
    }
  };

  const handleWaiting = async () => {
    if (!selectedListId) {
      toast.error('Seleziona una lista');
      return;
    }

    try {
      await setListWaiting({
        id: String(selectedListId),
        reason: 'Messa in attesa da interfaccia touch',
      }).unwrap();
      toast.success('Lista messa in attesa');
      setSelectedListId(null);
      setCurrentTab('lists');
      refetch();
    } catch (error) {
      toast.error('Errore durante messa in attesa');
    }
  };

  const handleTerminate = async () => {
    if (!selectedListId) {
      toast.error('Seleziona una lista');
      return;
    }

    try {
      await terminateList(selectedListId).unwrap();
      toast.success('Lista terminata');
      setSelectedListId(null);
      setCurrentTab('lists');
      refetch();
    } catch (error) {
      toast.error('Errore durante terminazione');
    }
  };

  // ============================================================================
  // RENDER: Tab Lista
  // ============================================================================
  const renderListsTab = () => (
    <div className="flex flex-col h-full">
      {/* Header con contatori - ridotto */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 shadow-lg flex-shrink-0">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/20 rounded-lg p-2 text-center backdrop-blur-sm">
            <div className="text-3xl font-bold">
              {filteredLists.filter(l => l.status === 'active').length}
            </div>
            <div className="text-xs mt-1 opacity-90">In Esecuzione</div>
          </div>
          <div className="bg-white/20 rounded-lg p-2 text-center backdrop-blur-sm">
            <div className="text-3xl font-bold">
              {filteredLists.filter(l => l.status === 'waiting').length}
            </div>
            <div className="text-xs mt-1 opacity-90">In Attesa</div>
          </div>
          <div className="bg-white/20 rounded-lg p-2 text-center backdrop-blur-sm">
            <div className="text-3xl font-bold">
              {filteredLists.filter(l => l.status === 'completed').length}
            </div>
            <div className="text-xs mt-1 opacity-90">Terminate</div>
          </div>
        </div>
      </div>

      {/* Lista con card compatte */}
      <div className="flex-1 overflow-hidden p-3 bg-gray-50">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Spinner />
          </div>
        ) : paginatedLists.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-2xl text-gray-400 mb-3">Nessuna lista disponibile</p>
              <button
                onClick={() => setCurrentTab('filters')}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl text-lg font-semibold hover:bg-blue-700 active:scale-95 transition-all"
              >
                Modifica Filtri
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 h-full">
            {paginatedLists.map((list) => {
              // Colori in base allo stato: giallo per "in attesa", verde per "in esecuzione"
              const getBgColor = () => {
                if (selectedListId === list.id) {
                  return list.status === 'active'
                    ? 'bg-green-100 border-3 border-green-600'
                    : 'bg-yellow-100 border-3 border-yellow-600';
                }
                return list.status === 'active'
                  ? 'bg-green-50 border-2 border-green-200 hover:bg-green-100'
                  : 'bg-yellow-50 border-2 border-yellow-200 hover:bg-yellow-100';
              };

              return (
              <button
                key={list.id}
                onClick={() => setSelectedListId(list.id)}
                className={`
                  relative rounded-xl p-3 text-left transition-all duration-200 shadow-lg
                  ${getBgColor()}
                  ${selectedListId === list.id ? 'scale-105' : 'hover:shadow-xl hover:scale-102'}
                `}
              >
                {/* Badge stato */}
                <div className="absolute top-2 right-2">
                  <div className={`${getStatusColor(list.status)} text-white px-2 py-1 rounded-full text-xs font-semibold`}>
                    {getStatusLabel(list.status)}
                  </div>
                </div>

                {/* Codice lista */}
                <div className="mb-2 pr-24">
                  <div className="text-gray-500 text-xs mb-1">Codice Lista</div>
                  <div className="text-2xl font-bold text-gray-900">{list.code}</div>
                </div>

                {/* Descrizione */}
                <div className="mb-2">
                  <div className="text-gray-600 text-sm truncate">{list.description || 'Nessuna descrizione'}</div>
                </div>

                {/* Statistiche */}
                <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-gray-200">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{list.totalRows || 0}</div>
                    <div className="text-xs text-gray-500">Tot</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{list.completedRows || 0}</div>
                    <div className="text-xs text-gray-500">OK</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-600">{list.unfulfillableRows || 0}</div>
                    <div className="text-xs text-gray-500">KO</div>
                  </div>
                </div>

                {/* Indicatore selezione */}
                {selectedListId === list.id && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <CheckCircleIcon className={`h-16 w-16 opacity-20 ${list.status === 'active' ? 'text-green-600' : 'text-yellow-600'}`} />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
          </div>
        )}
      </div>

      {/* Paginazione e azioni - compatto */}
      <div className="bg-white border-t border-gray-200 p-3 shadow-lg flex-shrink-0">
        <div className="flex items-center justify-between">
          {/* Paginazione */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all"
            >
              <ArrowLeftIcon className="h-6 w-6" />
            </button>
            <div className="text-lg font-semibold px-3">
              {currentPage + 1} / {totalPages || 1}
            </div>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage >= totalPages - 1}
              className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all"
            >
              <ArrowRightIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Azioni rapide */}
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentTab('filters')}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg text-lg font-semibold hover:bg-purple-700 active:scale-95 transition-all flex items-center gap-2"
            >
              <FunnelIcon className="h-5 w-5" />
              Filtri
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ============================================================================
  // RENDER: Tab Esegui
  // ============================================================================
  const renderExecuteTab = () => {
    const selectedList = filteredLists.find(l => l.id === selectedListId);

    return (
      <div className="flex flex-col items-center justify-center h-full p-8 bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-3xl w-full">
          <h2 className="text-5xl font-bold mb-8 text-center text-blue-900">
            Esegui Lista
          </h2>

          {selectedList ? (
            <>
              <div className="mb-8 p-6 bg-blue-50 rounded-2xl">
                <div className="text-gray-600 text-lg mb-2">Lista Selezionata</div>
                <div className="text-5xl font-bold text-blue-900 mb-4">{selectedList.code}</div>
                <div className="text-xl text-gray-700">{selectedList.description || 'Nessuna descrizione'}</div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8">
                <button
                  onClick={handleExecute}
                  className="py-8 bg-green-600 text-white rounded-2xl text-3xl font-bold hover:bg-green-700 active:scale-95 transition-all shadow-lg flex flex-col items-center gap-4"
                >
                  <PlayIcon className="h-16 w-16" />
                  CONFERMA
                </button>
                <button
                  onClick={() => {
                    setSelectedListId(null);
                    setCurrentTab('lists');
                  }}
                  className="py-8 bg-gray-600 text-white rounded-2xl text-3xl font-bold hover:bg-gray-700 active:scale-95 transition-all shadow-lg flex flex-col items-center gap-4"
                >
                  <XMarkIcon className="h-16 w-16" />
                  ANNULLA
                </button>
              </div>
            </>
          ) : (
            <div className="text-center">
              <p className="text-2xl text-gray-500 mb-8">Nessuna lista selezionata</p>
              <button
                onClick={() => setCurrentTab('lists')}
                className="px-12 py-6 bg-blue-600 text-white rounded-2xl text-2xl font-semibold hover:bg-blue-700 active:scale-95 transition-all"
              >
                Torna alla Lista
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ============================================================================
  // RENDER: Tab Metti in Attesa
  // ============================================================================
  const renderWaitingTab = () => {
    const selectedList = filteredLists.find(l => l.id === selectedListId);

    return (
      <div className="flex flex-col items-center justify-center h-full p-8 bg-gradient-to-br from-yellow-50 to-yellow-100">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-3xl w-full">
          <h2 className="text-5xl font-bold mb-8 text-center text-yellow-900">
            Metti in Attesa
          </h2>

          {selectedList ? (
            <>
              <div className="mb-8 p-6 bg-yellow-50 rounded-2xl">
                <div className="text-gray-600 text-lg mb-2">Lista Selezionata</div>
                <div className="text-5xl font-bold text-yellow-900 mb-4">{selectedList.code}</div>
                <div className="text-xl text-gray-700">{selectedList.description || 'Nessuna descrizione'}</div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8">
                <button
                  onClick={handleWaiting}
                  className="py-8 bg-yellow-600 text-white rounded-2xl text-3xl font-bold hover:bg-yellow-700 active:scale-95 transition-all shadow-lg flex flex-col items-center gap-4"
                >
                  <PauseIcon className="h-16 w-16" />
                  CONFERMA
                </button>
                <button
                  onClick={() => {
                    setSelectedListId(null);
                    setCurrentTab('lists');
                  }}
                  className="py-8 bg-gray-600 text-white rounded-2xl text-3xl font-bold hover:bg-gray-700 active:scale-95 transition-all shadow-lg flex flex-col items-center gap-4"
                >
                  <XMarkIcon className="h-16 w-16" />
                  ANNULLA
                </button>
              </div>
            </>
          ) : (
            <div className="text-center">
              <p className="text-2xl text-gray-500 mb-8">Nessuna lista selezionata</p>
              <button
                onClick={() => setCurrentTab('lists')}
                className="px-12 py-6 bg-yellow-600 text-white rounded-2xl text-2xl font-semibold hover:bg-yellow-700 active:scale-95 transition-all"
              >
                Torna alla Lista
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ============================================================================
  // RENDER: Tab Termina
  // ============================================================================
  const renderTerminateTab = () => {
    const selectedList = filteredLists.find(l => l.id === selectedListId);

    return (
      <div className="flex flex-col items-center justify-center h-full p-8 bg-gradient-to-br from-green-50 to-green-100">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-3xl w-full">
          <h2 className="text-5xl font-bold mb-8 text-center text-green-900">
            Termina Lista
          </h2>

          {selectedList ? (
            <>
              <div className="mb-8 p-6 bg-green-50 rounded-2xl">
                <div className="text-gray-600 text-lg mb-2">Lista Selezionata</div>
                <div className="text-5xl font-bold text-green-900 mb-4">{selectedList.code}</div>
                <div className="text-xl text-gray-700">{selectedList.description || 'Nessuna descrizione'}</div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8">
                <button
                  onClick={handleTerminate}
                  className="py-8 bg-green-600 text-white rounded-2xl text-3xl font-bold hover:bg-green-700 active:scale-95 transition-all shadow-lg flex flex-col items-center gap-4"
                >
                  <StopIcon className="h-16 w-16" />
                  CONFERMA
                </button>
                <button
                  onClick={() => {
                    setSelectedListId(null);
                    setCurrentTab('lists');
                  }}
                  className="py-8 bg-gray-600 text-white rounded-2xl text-3xl font-bold hover:bg-gray-700 active:scale-95 transition-all shadow-lg flex flex-col items-center gap-4"
                >
                  <XMarkIcon className="h-16 w-16" />
                  ANNULLA
                </button>
              </div>
            </>
          ) : (
            <div className="text-center">
              <p className="text-2xl text-gray-500 mb-8">Nessuna lista selezionata</p>
              <button
                onClick={() => setCurrentTab('lists')}
                className="px-12 py-6 bg-green-600 text-white rounded-2xl text-2xl font-semibold hover:bg-green-700 active:scale-95 transition-all"
              >
                Torna alla Lista
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ============================================================================
  // RENDER: Tab Liste Terminate
  // ============================================================================
  const renderTerminatedTab = () => {
    // Filtra solo le liste terminate
    const terminatedLists = (listsResponse?.data || []).filter(
      list => list.status === 'completed'
    );

    // Paginazione per le liste terminate
    const start = terminatedPage * ITEMS_PER_PAGE;
    const paginatedTerminated = terminatedLists.slice(start, start + ITEMS_PER_PAGE);
    const totalTerminatedPages = Math.ceil(terminatedLists.length / ITEMS_PER_PAGE);

    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-600 to-gray-700 text-white p-3 shadow-lg flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">Liste Terminate</h3>
              <p className="text-sm opacity-90 mt-1">
                Totale: {terminatedLists.length} liste completate
              </p>
            </div>
            <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm">
              <div className="text-4xl font-bold">{terminatedLists.length}</div>
            </div>
          </div>
        </div>

        {/* Lista terminate */}
        <div className="flex-1 overflow-hidden p-3 bg-gray-50">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Spinner />
            </div>
          ) : terminatedLists.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <CheckCircleIcon className="h-24 w-24 text-gray-300 mx-auto mb-4" />
                <p className="text-2xl text-gray-400 mb-3">Nessuna lista terminata</p>
                <p className="text-lg text-gray-500">Le liste completate appariranno qui</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 h-full">
              {paginatedTerminated.map((list) => (
                <button
                  key={list.id}
                  onClick={() => setSelectedListId(list.id)}
                  className={`
                    relative rounded-xl p-3 text-left transition-all duration-200 shadow-lg
                    ${selectedListId === list.id
                      ? 'bg-gray-100 border-3 border-gray-600 scale-105'
                      : 'bg-white hover:shadow-xl hover:scale-102 border-2 border-gray-200'
                    }
                  `}
                >
                  {/* Badge stato */}
                  <div className="absolute top-2 right-2">
                    <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                      <CheckCircleIcon className="h-4 w-4" />
                      Completata
                    </div>
                  </div>

                  {/* Codice lista */}
                  <div className="mb-2 pr-28">
                    <div className="text-gray-500 text-xs mb-1">Codice Lista</div>
                    <div className="text-2xl font-bold text-gray-900">{list.code}</div>
                  </div>

                  {/* Descrizione */}
                  <div className="mb-2">
                    <div className="text-gray-600 text-sm truncate">
                      {list.description || 'Nessuna descrizione'}
                    </div>
                  </div>

                  {/* Statistiche */}
                  <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-gray-200">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">{list.totalRows || 0}</div>
                      <div className="text-xs text-gray-500">Tot</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{list.completedRows || 0}</div>
                      <div className="text-xs text-gray-500">OK</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-600">{list.unfulfillableRows || 0}</div>
                      <div className="text-xs text-gray-500">KO</div>
                    </div>
                  </div>

                  {/* Data completamento */}
                  {list.createdAt && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="text-xs text-gray-500">
                        {new Date(list.createdAt).toLocaleString('it-IT')}
                      </div>
                    </div>
                  )}

                  {/* Indicatore selezione */}
                  {selectedListId === list.id && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <CheckCircleIcon className="h-16 w-16 text-gray-600 opacity-20" />
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Paginazione */}
        {totalTerminatedPages > 1 && (
          <div className="bg-white p-3 shadow-lg flex items-center justify-between flex-shrink-0 border-t border-gray-200">
            <button
              onClick={() => setTerminatedPage(p => Math.max(0, p - 1))}
              disabled={terminatedPage === 0}
              className="px-6 py-3 bg-gray-600 text-white rounded-xl text-lg font-semibold hover:bg-gray-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <ArrowLeftIcon className="h-6 w-6" />
              Indietro
            </button>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {terminatedPage + 1} / {totalTerminatedPages}
              </div>
              <div className="text-sm text-gray-600">
                {terminatedLists.length} liste terminate
              </div>
            </div>
            <button
              onClick={() => setTerminatedPage(p => Math.min(totalTerminatedPages - 1, p + 1))}
              disabled={terminatedPage >= totalTerminatedPages - 1}
              className="px-6 py-3 bg-gray-600 text-white rounded-xl text-lg font-semibold hover:bg-gray-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Avanti
              <ArrowRightIcon className="h-6 w-6" />
            </button>
          </div>
        )}
      </div>
    );
  };

  // ============================================================================
  // RENDER: Tab Filtri
  // ============================================================================
  const renderFiltersTab = () => (
    <div className="flex flex-col items-center justify-center h-full p-8 bg-gradient-to-br from-purple-50 to-purple-100">
      <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-4xl w-full">
        <h2 className="text-5xl font-bold mb-12 text-center text-purple-900">
          Filtri Liste
        </h2>

        <div className="grid grid-cols-3 gap-8 mb-12">
          {/* Filtro In Esecuzione */}
          <button
            onClick={() => setStatusFilters(prev => ({ ...prev, showInExecution: !prev.showInExecution }))}
            className={`
              p-8 rounded-2xl text-center transition-all shadow-lg
              ${statusFilters.showInExecution
                ? 'bg-blue-600 text-white scale-105'
                : 'bg-white border-4 border-blue-300 text-blue-900 hover:bg-blue-50'
              }
            `}
          >
            <PlayIcon className="h-16 w-16 mx-auto mb-4" />
            <div className="text-2xl font-bold mb-2">In Esecuzione</div>
            <div className="text-5xl font-bold">
              {filteredLists.filter(l => l.status === 'active').length}
            </div>
          </button>

          {/* Filtro In Attesa */}
          <button
            onClick={() => setStatusFilters(prev => ({ ...prev, showInWaiting: !prev.showInWaiting }))}
            className={`
              p-8 rounded-2xl text-center transition-all shadow-lg
              ${statusFilters.showInWaiting
                ? 'bg-yellow-600 text-white scale-105'
                : 'bg-white border-4 border-yellow-300 text-yellow-900 hover:bg-yellow-50'
              }
            `}
          >
            <ClockIcon className="h-16 w-16 mx-auto mb-4" />
            <div className="text-2xl font-bold mb-2">In Attesa</div>
            <div className="text-5xl font-bold">
              {filteredLists.filter(l => l.status === 'waiting').length}
            </div>
          </button>

          {/* Filtro Terminate */}
          <button
            onClick={() => setStatusFilters(prev => ({ ...prev, showTerminated: !prev.showTerminated }))}
            className={`
              p-8 rounded-2xl text-center transition-all shadow-lg
              ${statusFilters.showTerminated
                ? 'bg-green-600 text-white scale-105'
                : 'bg-white border-4 border-green-300 text-green-900 hover:bg-green-50'
              }
            `}
          >
            <CheckCircleIcon className="h-16 w-16 mx-auto mb-4" />
            <div className="text-2xl font-bold mb-2">Terminate</div>
            <div className="text-5xl font-bold">
              {filteredLists.filter(l => l.status === 'completed').length}
            </div>
          </button>
        </div>

        {/* Pulsanti azioni */}
        <div className="grid grid-cols-2 gap-8">
          <button
            onClick={() => {
              setStatusFilters({ showInExecution: false, showInWaiting: false, showTerminated: false });
              setCurrentPage(0);
            }}
            className="py-6 bg-gray-600 text-white rounded-2xl text-2xl font-semibold hover:bg-gray-700 active:scale-95 transition-all"
          >
            Azzera Filtri
          </button>
          <button
            onClick={() => {
              setCurrentPage(0);
              setCurrentTab('lists');
            }}
            className="py-6 bg-purple-600 text-white rounded-2xl text-2xl font-semibold hover:bg-purple-700 active:scale-95 transition-all"
          >
            Applica e Chiudi
          </button>
        </div>
      </div>
    </div>
  );

  // ============================================================================
  // RENDER PRINCIPALE
  // ============================================================================
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Top Navigation Bar - sempre visibile */}
      <div className="bg-white shadow-lg z-10 flex-shrink-0">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            {/* Logo/Home */}
            <button
              onClick={() => navigate('/operations')}
              className="flex items-center gap-2 px-3 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 active:scale-95 transition-all"
            >
              <HomeIcon className="h-6 w-6" />
              <span className="text-sm font-semibold">Home</span>
            </button>

            {/* Nuova Lista Button */}
            <button
              onClick={() => navigate('/operations/lists/touch/create')}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 active:scale-95 transition-all shadow-md"
            >
              <PlusIcon className="h-6 w-6" />
              <span className="text-sm font-semibold">Nuova Lista</span>
            </button>
          </div>

          {/* Tabs Navigation */}
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentTab('lists')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                currentTab === 'lists'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Liste
            </button>
            <button
              onClick={() => setCurrentTab('execute')}
              disabled={!selectedListId}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                currentTab === 'execute'
                  ? 'bg-green-600 text-white shadow-lg'
                  : selectedListId
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Esegui
            </button>
            <button
              onClick={() => setCurrentTab('waiting')}
              disabled={!selectedListId}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                currentTab === 'waiting'
                  ? 'bg-yellow-600 text-white shadow-lg'
                  : selectedListId
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Attesa
            </button>
            <button
              onClick={() => setCurrentTab('terminate')}
              disabled={!selectedListId}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                currentTab === 'terminate'
                  ? 'bg-green-600 text-white shadow-lg'
                  : selectedListId
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Termina
            </button>
            <button
              onClick={() => setCurrentTab('terminated')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                currentTab === 'terminated'
                  ? 'bg-gray-600 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Terminate
            </button>
          </div>

          {/* Info lista selezionata */}
          <div className="px-3 py-2 bg-blue-50 rounded-lg min-w-[150px] text-center">
            {selectedListId ? (
              <>
                <div className="text-xs text-gray-600">Selezionata</div>
                <div className="text-lg font-bold text-blue-900">
                  {filteredLists.find(l => l.id === selectedListId)?.code || selectedListId}
                </div>
              </>
            ) : (
              <div className="text-gray-400 text-sm">Nessuna</div>
            )}
          </div>
        </div>
      </div>

      {/* Contenuto Tab */}
      <div className="flex-1 overflow-hidden">
        {currentTab === 'lists' && renderListsTab()}
        {currentTab === 'execute' && renderExecuteTab()}
        {currentTab === 'waiting' && renderWaitingTab()}
        {currentTab === 'terminate' && renderTerminateTab()}
        {currentTab === 'terminated' && renderTerminatedTab()}
        {currentTab === 'filters' && renderFiltersTab()}
      </div>
    </div>
  );
};

export default ListOperationsTouchPage;

