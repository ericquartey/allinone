// ============================================================================
// EJLOG WMS - Locations Page (Machines & Bays)
// Pagina completa con dati reali dal backend EjLog (porta 3077)
// Visualizzazione gerarchica: Machines → Bays → UDC
// ============================================================================

import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  ServerIcon,
  DatabaseIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertTriangleIcon,
  SearchIcon,
  RefreshCwIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  BoxIcon,
  MapPinIcon,
  GridIcon,
} from 'lucide-react';
import Badge from '../../components/shared/Badge';
import {
  useGetMachinesQuery,
  useGetDestinationGroupsByBayQuery,
} from '../../services/api/locationApi';
import type { Machine, Bay, MachineStatus } from '../../types/models';

/**
 * Componente per mostrare una singola bay con le sue informazioni
 */
const BayCard: React.FC<{ bay: Bay; machineCode: string }> = ({ bay, machineCode }) => {
  const [showDestinations, setShowDestinations] = useState(false);

  // Query destination groups (solo se richiesto)
  const {
    data: destinationGroups,
    isLoading: loadingDestinations,
  } = useGetDestinationGroupsByBayQuery(
    { machineId: bay.machineId, bayNumber: bay.bayNumber },
    { skip: !showDestinations }
  );

  const getOccupancyColor = (isOccupied: boolean) => {
    return isOccupied ? 'bg-red-100 border-red-300' : 'bg-green-100 border-green-300';
  };

  return (
    <div className={`border-2 rounded-lg overflow-hidden ${getOccupancyColor(bay.isOccupied)}`}>
      {/* Header Bay */}
      <div className="flex items-center gap-3 p-3">
        <MapPinIcon className="w-6 h-6 text-blue-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">
              Bay #{bay.bayNumber}
            </span>
            {bay.code && bay.code !== `BAY_${bay.bayNumber}` && (
              <span className="text-xs text-gray-600 font-mono bg-white px-2 py-0.5 rounded border">
                {bay.code}
              </span>
            )}
            <Badge variant={bay.isOccupied ? 'danger' : 'success'} size="sm">
              {bay.isOccupied ? 'Occupata' : 'Libera'}
            </Badge>
          </div>
          {bay.description && (
            <div className="text-xs text-gray-600 mt-1">{bay.description}</div>
          )}
          <div className="text-xs text-gray-600 mt-1">
            Macchina: {machineCode} | Bay: {bay.bayNumber}
          </div>
        </div>

        {/* Info UDC se presente */}
        {bay.isOccupied && (
          <div className="text-right">
            <div className="flex items-center gap-2">
              <BoxIcon className="w-4 h-4 text-orange-600" />
              <div>
                {bay.loadingUnitId && (
                  <div className="text-sm font-semibold text-gray-900">
                    UDC #{bay.loadingUnitId}
                  </div>
                )}
                {bay.loadingUnitBarcode && (
                  <div className="text-xs font-mono text-gray-600">
                    {bay.loadingUnitBarcode}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Toggle Destination Groups */}
        <button
          onClick={() => setShowDestinations(!showDestinations)}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Mostra destination groups"
        >
          {showDestinations ? (
            <ChevronDownIcon className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronRightIcon className="w-4 h-4 text-gray-600" />
          )}
        </button>
      </div>

      {/* Destination Groups (espandibili) */}
      {showDestinations && (
        <div className="p-3 bg-white border-t-2">
          {loadingDestinations && (
            <div className="text-center py-4 text-gray-600">
              <RefreshCwIcon className="w-5 h-5 mx-auto mb-2 animate-spin" />
              Caricamento gruppi destinazione...
            </div>
          )}

          {!loadingDestinations && destinationGroups && (
            <div>
              <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase">
                Destination Groups ({destinationGroups.length})
              </h4>
              {destinationGroups.length > 0 ? (
                <div className="space-y-1">
                  {destinationGroups.map((dg, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs"
                    >
                      <GridIcon className="w-3 h-3 text-gray-500" />
                      <span className="font-mono font-semibold">{dg.code}</span>
                      {dg.description && (
                        <span className="text-gray-600">- {dg.description}</span>
                      )}
                      <Badge
                        variant={dg.isActive ? 'success' : 'default'}
                        size="sm"
                      >
                        {dg.isActive ? 'Attivo' : 'Inattivo'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-3 text-gray-500 text-xs">
                  Nessun destination group configurato
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Componente per mostrare una singola machine con le sue bays
 */
const MachineCard: React.FC<{ machine: Machine }> = ({ machine }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calcola statistiche bays
  const baysStats = useMemo(() => {
    if (!machine.bays || machine.bays.length === 0) {
      return {
        total: machine.baysCount || 0,
        occupied: 0,
        free: 0,
        occupancyRate: 0,
      };
    }

    const total = machine.bays.length;
    const occupied = machine.bays.filter((b) => b.isOccupied).length;
    const free = total - occupied;
    const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;

    return { total, occupied, free, occupancyRate };
  }, [machine.bays, machine.baysCount]);

  const getStatusColor = (status?: MachineStatus) => {
    switch (status) {
      case 0: // IDLE
        return 'bg-blue-100 border-blue-300';
      case 1: // WORKING
        return 'bg-green-100 border-green-300';
      case 2: // ERROR
        return 'bg-red-100 border-red-300';
      case 3: // MAINTENANCE
        return 'bg-yellow-100 border-yellow-300';
      case 4: // OFFLINE
        return 'bg-gray-100 border-gray-300';
      default:
        return 'bg-white border-gray-300';
    }
  };

  const getStatusLabel = (status?: MachineStatus) => {
    switch (status) {
      case 0:
        return 'Idle';
      case 1:
        return 'Working';
      case 2:
        return 'Error';
      case 3:
        return 'Manutenzione';
      case 4:
        return 'Offline';
      default:
        return 'Sconosciuto';
    }
  };

  const getStatusVariant = (status?: MachineStatus): 'success' | 'warning' | 'danger' | 'default' => {
    switch (status) {
      case 1: // WORKING
        return 'success';
      case 2: // ERROR
        return 'danger';
      case 3: // MAINTENANCE
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <div className={`border-2 rounded-xl overflow-hidden shadow-md ${getStatusColor(machine.status)}`}>
      {/* Header Machine */}
      <div
        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-opacity-80 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <ChevronDownIcon className="w-5 h-5 text-gray-700 flex-shrink-0" />
        ) : (
          <ChevronRightIcon className="w-5 h-5 text-gray-700 flex-shrink-0" />
        )}
        <ServerIcon className="w-10 h-10 text-blue-700 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xl font-bold text-gray-900">
              {machine.code}
            </span>
            {machine.description && (
              <span className="text-sm text-gray-700">{machine.description}</span>
            )}
            {machine.status !== undefined && (
              <Badge variant={getStatusVariant(machine.status)} size="sm">
                {getStatusLabel(machine.status)}
              </Badge>
            )}
            {!machine.isActive && (
              <Badge variant="danger" size="sm">
                Inattiva
              </Badge>
            )}
          </div>
          {machine.machineType && (
            <div className="text-sm text-gray-600 mt-1">
              Tipo: {machine.machineType}
            </div>
          )}
        </div>
        <div className="flex items-center gap-6 flex-shrink-0">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{baysStats.total}</div>
            <div className="text-xs text-gray-600">Bays Totali</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{baysStats.occupied}</div>
            <div className="text-xs text-gray-600">Occupate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{baysStats.free}</div>
            <div className="text-xs text-gray-600">Libere</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-700">{baysStats.occupancyRate}%</div>
            <div className="text-xs text-gray-600">Occupazione</div>
          </div>
        </div>
      </div>

      {/* Bays (espandibili) */}
      {isExpanded && (
        <div className="p-4 bg-white border-t-2">
          {machine.bays && machine.bays.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 uppercase mb-3">
                Bays ({machine.bays.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {machine.bays.map((bay, idx) => (
                  <BayCard key={idx} bay={bay} machineCode={machine.code} />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              Nessuna bay configurata per questa macchina
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Pagina principale LocationsPage
 */
const LocationsPage: React.FC = () => {
  // Filtri
  const [search, setSearch] = useState('');

  // Query machines
  const {
    data: machines,
    isLoading,
    error,
    refetch,
  } = useGetMachinesQuery();

  // Filtra machines localmente
  const filteredMachines = useMemo(() => {
    if (!machines || machines.length === 0) return [];
    if (!search.trim()) return machines;

    const searchLower = search.toLowerCase();
    return machines.filter(
      (m) =>
        m.code.toLowerCase().includes(searchLower) ||
        m.description?.toLowerCase().includes(searchLower) ||
        m.machineType?.toLowerCase().includes(searchLower)
    );
  }, [machines, search]);

  // Statistiche globali
  const globalStats = useMemo(() => {
    if (!filteredMachines || filteredMachines.length === 0) {
      return {
        totalMachines: 0,
        activeMachines: 0,
        totalBays: 0,
        occupiedBays: 0,
        freeBays: 0,
        avgOccupancy: 0,
      };
    }

    const totalMachines = filteredMachines.length;
    const activeMachines = filteredMachines.filter((m) => m.isActive).length;

    let totalBays = 0;
    let occupiedBays = 0;

    filteredMachines.forEach((machine) => {
      if (machine.bays && machine.bays.length > 0) {
        totalBays += machine.bays.length;
        occupiedBays += machine.bays.filter((b) => b.isOccupied).length;
      } else {
        totalBays += machine.baysCount || 0;
      }
    });

    const freeBays = totalBays - occupiedBays;
    const avgOccupancy = totalBays > 0 ? Math.round((occupiedBays / totalBays) * 100) : 0;

    return {
      totalMachines,
      activeMachines,
      totalBays,
      occupiedBays,
      freeBays,
      avgOccupancy,
    };
  }, [filteredMachines]);

  // Rendering errore
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertTriangleIcon className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-900 mb-2">
            Errore caricamento Machines
          </h2>
          <p className="text-red-700 mb-4">
            Impossibile connettersi al backend EjLog sulla porta 3077.
            <br />
            Verifica che il backend sia avviato e accessibile.
            <br />
            Endpoint: GET /EjLogHostVertimag/api/machines
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestione Postazioni (Machines & Bays)
          </h1>
          <p className="text-gray-600">
            Vista completa machines, bays e UDC presenti
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCwIcon className="w-4 h-4" />
            Ricarica
          </button>
        </div>
      </div>

      {/* Statistiche Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {/* Totale Machines */}
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Machines</p>
              <p className="text-2xl font-bold text-gray-900">{globalStats.totalMachines}</p>
            </div>
            <ServerIcon className="w-10 h-10 text-blue-500 opacity-50" />
          </div>
        </div>

        {/* Machines Attive */}
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Attive</p>
              <p className="text-2xl font-bold text-gray-900">{globalStats.activeMachines}</p>
            </div>
            <CheckCircleIcon className="w-10 h-10 text-green-500 opacity-50" />
          </div>
        </div>

        {/* Totale Bays */}
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Totale Bays</p>
              <p className="text-2xl font-bold text-gray-900">{globalStats.totalBays}</p>
            </div>
            <DatabaseIcon className="w-10 h-10 text-purple-500 opacity-50" />
          </div>
        </div>

        {/* Bays Occupate */}
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Bays Occupate</p>
              <p className="text-2xl font-bold text-red-600">{globalStats.occupiedBays}</p>
            </div>
            <XCircleIcon className="w-10 h-10 text-red-500 opacity-50" />
          </div>
        </div>

        {/* Bays Libere */}
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Bays Libere</p>
              <p className="text-2xl font-bold text-green-600">{globalStats.freeBays}</p>
            </div>
            <CheckCircleIcon className="w-10 h-10 text-green-500 opacity-50" />
          </div>
        </div>

        {/* Occupazione Media */}
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Occupazione</p>
              <p className="text-2xl font-bold text-yellow-600">{globalStats.avgOccupancy}%</p>
            </div>
            <GridIcon className="w-10 h-10 text-yellow-500 opacity-50" />
          </div>
        </div>
      </div>

      {/* Filtri */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cerca machines per codice, descrizione, tipo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setSearch('')}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Reset Filtri
          </button>
        </div>
      </div>

      {/* Info Riga */}
      {!isLoading && machines && (
        <div className="text-sm text-gray-600">
          Visualizzate <span className="font-semibold">{filteredMachines.length}</span> di{' '}
          <span className="font-semibold">{machines.length}</span> machines
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <RefreshCwIcon className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-600" />
          <p className="text-gray-600">Caricamento machines...</p>
        </div>
      )}

      {/* Lista Machines */}
      {!isLoading && (
        <div className="space-y-4">
          {filteredMachines.length > 0 ? (
            filteredMachines.map((machine) => <MachineCard key={machine.id} machine={machine} />)
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <ServerIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">
                {search.trim() ? 'Nessuna machine trovata con i filtri applicati' : 'Nessuna machine disponibile'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationsPage;

