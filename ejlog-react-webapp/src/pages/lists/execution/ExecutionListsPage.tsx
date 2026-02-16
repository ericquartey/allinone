// ============================================================================
// EJLOG WMS - Execution Lists Page
// Gestione liste in esecuzione - DATI REALI DAL BACKEND
// ============================================================================

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, CheckSquare, Square, ListChecks, Search, TrendingUp, RefreshCw } from 'lucide-react';
import { useGetListsQuery } from '../../../services/api/listsApi';

interface ExecutionList {
  id: number;
  numero: string;
  tipo: 'PICKING' | 'REFILLING' | 'INVENTARIO';
  stato: string;
  utente: string;
  dataInizio: string;
  righeCompletate: number;
  totaleRighe: number;
}

export default function ExecutionListsPage() {
  const navigate = useNavigate();
  const [selectedLists, setSelectedLists] = useState<Set<number>>(new Set());
  const [searchFilter, setSearchFilter] = useState('');

  // Fetch real data from backend
  const { data: backendLists, isLoading, error, refetch } = useGetListsQuery({
    stato: 'IN_ESECUZIONE,IN_ATTESA', // Solo liste in esecuzione o in attesa
  });

  // Transform backend data to local format
  const lists: ExecutionList[] = useMemo(() => {
    if (!backendLists || backendLists.length === 0) return [];

    return backendLists.map((backendList) => {
      // Map tipoLista to tipo string
      const getTipoString = (tipoLista?: number): 'PICKING' | 'REFILLING' | 'INVENTARIO' => {
        switch (tipoLista) {
          case 1:
            return 'PICKING';
          case 2:
            return 'REFILLING';
          case 3:
            return 'INVENTARIO';
          default:
            return 'PICKING';
        }
      };

      return {
        id: backendList.id,
        numero: backendList.numList || backendList.id?.toString() || 'N/D',
        tipo: getTipoString(backendList.tipoLista),
        stato: backendList.stato || 'N/D',
        utente: backendList.userName || 'N/D',
        dataInizio: backendList.dataCreazione || backendList.dataInizioEsecuzione || new Date().toISOString(),
        righeCompletate: backendList.numRigheCompletate || 0,
        totaleRighe: backendList.numRighe || 0,
      };
    });
  }, [backendLists]);

  const filteredLists = lists.filter((list) => {
    if (!searchFilter.trim()) return true;
    const search = searchFilter.toLowerCase();
    return (
      list.numero.toLowerCase().includes(search) ||
      list.tipo.toLowerCase().includes(search) ||
      list.utente.toLowerCase().includes(search)
    );
  });

  const handleSelectAll = () => {
    setSelectedLists(new Set(filteredLists.map((l) => l.id)));
  };

  const handleSelectNone = () => {
    setSelectedLists(new Set());
  };

  const handleToggleSelect = (listId: number) => {
    const newSelected = new Set(selectedLists);
    if (newSelected.has(listId)) {
      newSelected.delete(listId);
    } else {
      newSelected.add(listId);
    }
    setSelectedLists(newSelected);
  };

  const handleExecute = () => {
    if (selectedLists.size === 0) {
      alert('Seleziona almeno una lista da eseguire');
      return;
    }

    const firstSelectedList = filteredLists.find((l) => selectedLists.has(l.id));
    if (!firstSelectedList) return;

    const typeMap: Record<string, string> = {
      PICKING: 'picking',
      REFILLING: 'refilling',
      INVENTARIO: 'inventory',
    };

    const execType = typeMap[firstSelectedList.tipo] || 'picking';
    navigate(`/lists/${firstSelectedList.id}/execute/${execType}`);
  };

  const getProgressPercentage = (list: ExecutionList) => {
    return Math.round((list.righeCompletate / list.totaleRighe) * 100);
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'PICKING':
        return 'bg-blue-100 text-blue-800';
      case 'REFILLING':
        return 'bg-green-100 text-green-800';
      case 'INVENTARIO':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatoColor = (stato: string) => {
    switch (stato) {
      case 'IN_ESECUZIONE':
        return 'bg-yellow-100 text-yellow-800';
      case 'IN_ATTESA':
        return 'bg-orange-100 text-orange-800';
      case 'COMPLETATA':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ListChecks className="w-8 h-8 text-ferretto-red" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Liste in Esecuzione</h1>
              <p className="text-sm text-gray-600 mt-1">
                Gestisci e monitora le liste operative in corso - Dati Reali
              </p>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Aggiorna
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Caricamento liste in corso...</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-red-900 mb-2">Errore nel caricamento delle liste</h3>
          <p className="text-red-700 mb-4">
            Impossibile connettersi al backend EjLog. Verifica che il server sia avviato.
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Riprova
          </button>
        </div>
      )}

      {/* Content - Only show if not loading and no error */}
      {!isLoading && !error && (
        <>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Totale Liste</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{lists.length}</p>
            </div>
            <ListChecks className="w-10 h-10 text-gray-400 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Esecuzione</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {lists.filter((l) => l.stato === 'IN_ESECUZIONE').length}
              </p>
            </div>
            <Play className="w-10 h-10 text-yellow-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Attesa</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {lists.filter((l) => l.stato === 'IN_ATTESA').length}
              </p>
            </div>
            <Pause className="w-10 h-10 text-orange-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Selezionate</p>
              <p className="text-2xl font-bold text-ferretto-red mt-1">{selectedLists.size}</p>
            </div>
            <CheckSquare className="w-10 h-10 text-ferretto-red opacity-20" />
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3 mb-4">
          <button
            onClick={handleExecute}
            disabled={selectedLists.size === 0}
            className="flex items-center gap-2 px-4 py-2 bg-ferretto-red text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            <Play size={18} />
            Esegui ({selectedLists.size})
          </button>

          <button
            disabled={selectedLists.size === 0}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            <Pause size={18} />
            Metti in Attesa
          </button>

          <div className="flex-1"></div>

          <button
            onClick={handleSelectAll}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <CheckSquare size={18} />
            Seleziona Tutto
          </button>

          <button
            onClick={handleSelectNone}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Square size={18} />
            Deseleziona Tutto
          </button>
        </div>

        {/* Search Filter */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filtra per numero lista, tipo, utente..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ferretto-red focus:border-transparent"
          />
        </div>
      </div>

      {/* Lists Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {filteredLists.length === 0 ? (
          <div className="p-12 text-center">
            <ListChecks className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {searchFilter
                ? 'Nessuna lista trovata con i criteri di ricerca'
                : 'Nessuna lista in esecuzione'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-12 px-4 py-3"></th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Numero
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Stato
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Utente
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Data Inizio
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Progresso
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLists.map((list) => (
                  <tr
                    key={list.id}
                    className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedLists.has(list.id) ? 'bg-red-50' : ''
                    }`}
                    onClick={() => handleToggleSelect(list.id)}
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedLists.has(list.id)}
                        onChange={() => handleToggleSelect(list.id)}
                        className="w-5 h-5 text-ferretto-red border-gray-300 rounded focus:ring-ferretto-red cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-mono font-semibold text-gray-900">
                        {list.numero}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getTipoColor(list.tipo)}`}>
                        {list.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatoColor(list.stato)}`}>
                        {list.stato}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-700">{list.utente}</td>
                    <td className="px-4 py-4 text-gray-600 text-sm">{list.dataInizio}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-ferretto-red h-full transition-all duration-300"
                            style={{
                              width: `${getProgressPercentage(list)}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700 min-w-[80px]">
                          {list.righeCompletate}/{list.totaleRighe} ({getProgressPercentage(list)}%)
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Card */}
      {filteredLists.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-blue-800">
                <strong>Info:</strong> Seleziona una o più liste e clicca su "Esegui" per avviare l'esecuzione.
                Le liste possono essere filtrate usando la barra di ricerca.
              </p>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}
