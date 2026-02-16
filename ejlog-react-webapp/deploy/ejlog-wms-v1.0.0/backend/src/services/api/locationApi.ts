// ============================================================================
// EJLOG WMS - Location API (Machines & Bays)
// RTK Query API per gestione machines e bays dal backend EjLog
// Backend: /EjLogHostVertimag/machines su porta 3077
//
// NOTA: L'endpoint backend NON è ancora implementato, quindi usa dati MOCK
// Cambia USE_MOCK_DATA a false quando il backend sarà pronto
// ============================================================================

import { baseApi } from './baseApi';
import type {
  Machine,
  Bay,
  DestinationGroup,
  LoadingUnit,
} from '../../types/models';
import { MachineStatus } from '../../types/models';

// ============================================================================
// CONFIGURAZIONE MOCK DATA
// ============================================================================
// IMPORTANTE: L'endpoint GET /EjLogHostVertimag/machines NON è ancora implementato!
// Il backend restituisce 404 Not Found quando chiamato.
// Usiamo dati MOCK fino a quando l'endpoint non sarà disponibile.
// - Dati MOCK per la lista machines
// - Dati MOCK per dettagli machines, loading units, destination groups
const USE_MOCK_FOR_MACHINES_LIST = true; // ⚠️ MOCK DATA - Endpoint non implementato
const USE_REAL_BACKEND_FOR_DETAILS = false; // ⚠️ MOCK DATA per dettagli

// Alias per retrocompatibilità con il codice sotto
const USE_MOCK_DATA = USE_MOCK_FOR_MACHINES_LIST;

// ============================================================================
// DATI MOCK PER TESTING E SVILUPPO
// ============================================================================
const MOCK_MACHINES: Machine[] = [
  {
    id: 1,
    code: 'VERTIMAG-01',
    description: 'Magazzino Verticale 1',
    machineType: 'VERTIMAG',
    status: MachineStatus.WORKING,
    isActive: true,
    baysCount: 24,
    bays: Array.from({ length: 24 }, (_, i) => ({
      id: i + 1,
      machineId: 1,
      bayNumber: i + 1,
      code: `BAY-${String(i + 1).padStart(2, '0')}`,
      description: `Cassetto ${i + 1}`,
      isOccupied: i % 3 === 0,
      loadingUnitId: i % 3 === 0 ? 1000 + i : undefined,
      loadingUnitBarcode: i % 3 === 0 ? `UDC-${1000 + i}` : undefined,
      capacity: 100,
      currentWeight: i % 3 === 0 ? 75 : 0,
      maxWeight: 100,
    })),
  },
  {
    id: 2,
    code: 'VERTIMAG-02',
    description: 'Magazzino Verticale 2',
    machineType: 'VERTIMAG',
    status: MachineStatus.IDLE,
    isActive: true,
    baysCount: 24,
    bays: Array.from({ length: 24 }, (_, i) => ({
      id: 24 + i + 1,
      machineId: 2,
      bayNumber: i + 1,
      code: `BAY-${String(i + 1).padStart(2, '0')}`,
      description: `Cassetto ${i + 1}`,
      isOccupied: i % 4 === 0,
      loadingUnitId: i % 4 === 0 ? 2000 + i : undefined,
      loadingUnitBarcode: i % 4 === 0 ? `UDC-${2000 + i}` : undefined,
      capacity: 100,
      currentWeight: i % 4 === 0 ? 60 : 0,
      maxWeight: 100,
    })),
  },
  {
    id: 3,
    code: 'VERTIMAG-03',
    description: 'Magazzino Verticale 3',
    machineType: 'VERTIMAG',
    status: MachineStatus.ERROR,
    isActive: false,
    baysCount: 24,
    bays: [],
  },
];

const MOCK_DESTINATION_GROUPS: DestinationGroup[] = [
  { id: 1, code: 'DG-01', description: 'Gruppo Destinazione 1', isActive: true },
  { id: 2, code: 'DG-02', description: 'Gruppo Destinazione 2', isActive: true },
  { id: 3, code: 'DG-03', description: 'Gruppo Destinazione 3', isActive: true },
];

/**
 * Trasforma i dati machine dal backend EjLog al formato frontend
 */
function transformMachine(raw: any): Machine {
  return {
    id: raw.id || 0,
    code: raw.code || `MACHINE_${raw.id}`,
    description: raw.description || raw.name || undefined,
    machineType: raw.machineType || raw.type || undefined,
    status: raw.status !== undefined ? raw.status : undefined,
    isActive: raw.isActive !== undefined ? raw.isActive : true,
    baysCount: raw.baysCount || raw.numberOfBays || 0,
    bays: raw.bays ? raw.bays.map(transformBay) : undefined,
  };
}

/**
 * Trasforma i dati bay dal backend EjLog al formato frontend
 */
function transformBay(raw: any): Bay {
  return {
    id: raw.id || undefined,
    machineId: raw.machineId || 0,
    bayNumber: raw.bayNumber || raw.number || 0,
    code: raw.code || `BAY_${raw.bayNumber}`,
    description: raw.description || undefined,
    isOccupied: raw.isOccupied || raw.occupied || false,
    loadingUnitId: raw.loadingUnitId || raw.luId || undefined,
    loadingUnitBarcode: raw.loadingUnitBarcode || raw.luBarcode || undefined,
    destinationGroups: raw.destinationGroups || undefined,
    capacity: raw.capacity || undefined,
    currentWeight: raw.currentWeight || undefined,
    maxWeight: raw.maxWeight || undefined,
  };
}

/**
 * Trasforma i destination groups dal backend
 */
function transformDestinationGroup(raw: any): DestinationGroup {
  return {
    id: raw.id || 0,
    code: raw.code || '',
    description: raw.description || undefined,
    machineId: raw.machineId || undefined,
    bayNumber: raw.bayNumber || undefined,
    isActive: raw.isActive !== undefined ? raw.isActive : true,
  };
}

export const locationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ========================================================================
    // GET /EjLogHostVertimag/machines - Lista di tutte le machines
    // ========================================================================
    getMachines: builder.query<Machine[], void>({
      queryFn: USE_MOCK_DATA
        ? async () => {
            // Simula delay di rete
            await new Promise(resolve => setTimeout(resolve, 300));
            return { data: MOCK_MACHINES };
          }
        : undefined,
      query: USE_MOCK_DATA ? undefined : () => '/EjLogHostVertimag/machines',
      transformResponse: USE_MOCK_DATA
        ? undefined
        : (response: any) => {
            const machines = Array.isArray(response) ? response : [];
            return machines.map(transformMachine);
          },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Machine' as const, id })),
              { type: 'Machine', id: 'LIST' },
            ]
          : [{ type: 'Machine', id: 'LIST' }],
    }),

    // ========================================================================
    // GET /EjLogHostVertimag/machines/{id} - Dettaglio singola machine
    // ========================================================================
    getMachineById: builder.query<Machine, number>({
      queryFn: USE_MOCK_DATA
        ? async (id) => {
            await new Promise(resolve => setTimeout(resolve, 200));
            const machine = MOCK_MACHINES.find(m => m.id === id);
            if (!machine) {
              return { error: { status: 404, data: 'Machine not found' } };
            }
            return { data: machine };
          }
        : undefined,
      query: USE_MOCK_DATA ? undefined : (id) => `/EjLogHostVertimag/machines/${id}`,
      transformResponse: USE_MOCK_DATA ? undefined : (response: any) => transformMachine(response),
      providesTags: (result, error, id) => [{ type: 'Machine', id }],
    }),

    // ========================================================================
    // GET /EjLogHostVertimag/machines/{id}/bays/{bayNumber}/destination-groups
    // Ottiene i destination groups per una specifica bay
    // ========================================================================
    getDestinationGroupsByBay: builder.query<
      DestinationGroup[],
      { machineId: number; bayNumber: number }
    >({
      queryFn: USE_MOCK_DATA
        ? async ({ machineId, bayNumber }) => {
            await new Promise(resolve => setTimeout(resolve, 200));
            // Restituisce i destination groups mock con machineId e bayNumber popolati
            const groups = MOCK_DESTINATION_GROUPS.map(g => ({
              ...g,
              machineId,
              bayNumber,
            }));
            return { data: groups };
          }
        : undefined,
      query: USE_MOCK_DATA
        ? undefined
        : ({ machineId, bayNumber }) =>
            `/EjLogHostVertimag/machines/${machineId}/bays/${bayNumber}/destination-groups`,
      transformResponse: USE_MOCK_DATA
        ? undefined
        : (response: any) => {
            const groups = Array.isArray(response) ? response : [];
            return groups.map(transformDestinationGroup);
          },
      providesTags: (result, error, { machineId, bayNumber }) => [
        { type: 'DestinationGroup', id: `MACHINE_${machineId}_BAY_${bayNumber}` },
      ],
    }),

    // ========================================================================
    // POST /EjLogHostVertimag/loading-units/send-loadingunit-in-bay
    // Invia UDC in una bay
    // ========================================================================
    sendLoadingUnitToBay: builder.mutation<
      void,
      {
        loadingUnitId: number;
        machineId: number;
        bayNumber: number;
        destinationGroupId?: number;
      }
    >({
      queryFn: USE_MOCK_DATA
        ? async (params) => {
            await new Promise(resolve => setTimeout(resolve, 500));
            console.log('MOCK: Invio UDC in bay:', params);
            // Simula operazione riuscita
            return { data: undefined };
          }
        : undefined,
      query: USE_MOCK_DATA
        ? undefined
        : (params) => ({
            url: '/EjLogHostVertimag/loading-units/send-loadingunit-in-bay',
            method: 'POST',
            params,
          }),
      invalidatesTags: (result, error, { machineId, loadingUnitId }) => [
        { type: 'Machine', id: machineId },
        { type: 'Machine', id: 'LIST' },
        { type: 'LoadingUnit', id: loadingUnitId },
      ],
    }),

    // ========================================================================
    // POST /EjLogHostVertimag/loading-units/send-loadingunit-out-bay
    // Rimuove UDC da una bay
    // ========================================================================
    sendLoadingUnitOutOfBay: builder.mutation<
      void,
      {
        loadingUnitId: number;
        machineId: number;
        bayNumber: number;
      }
    >({
      queryFn: USE_MOCK_DATA
        ? async (params) => {
            await new Promise(resolve => setTimeout(resolve, 500));
            console.log('MOCK: Rimozione UDC da bay:', params);
            // Simula operazione riuscita
            return { data: undefined };
          }
        : undefined,
      query: USE_MOCK_DATA
        ? undefined
        : (params) => ({
            url: '/EjLogHostVertimag/loading-units/send-loadingunit-out-bay',
            method: 'POST',
            params,
          }),
      invalidatesTags: (result, error, { machineId, loadingUnitId }) => [
        { type: 'Machine', id: machineId },
        { type: 'Machine', id: 'LIST' },
        { type: 'LoadingUnit', id: loadingUnitId },
      ],
    }),
  }),
});

// Export hooks per l'utilizzo nei componenti
// ============================================================================
// REAL LOCATION ENDPOINTS - Using /api/locations backend
// ============================================================================

const locationsApiExtended = locationApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/locations - Get all locations with real data
    getLocations: builder.query<any, any>({
      query: (params) => ({
        url: '/api/locations',
        params: params || {},
      }),
      transformResponse: (response: any) => {
        // Backend returns: { success, data: [...locations], pagination }
        // Frontend expects: { locations: [...], total, summary }
        const locations = response.data || [];
        const total = response.pagination?.total || locations.length;

        // Map location types from backend numbers to descriptive strings
        const locationTypeMap: Record<number, string> = {
          1: 'Floor',
          4: 'Temporanea',
          9: 'PRE-PTL',
          11: 'POST-PTL',
        };

        // Map warehouse IDs to names (basic mapping, could be enhanced with API call)
        const warehouseMap: Record<number, string> = {
          99: 'Magazzino Principale',
          50001: 'Magazzino PTL',
        };

        // Calculate summary stats using real backend fields
        const summary = {
          totalLocations: total,
          availableLocations: locations.filter((l: any) => (l.currentUdcCount || 0) === 0 && l.enabled).length,
          occupiedLocations: locations.filter((l: any) => (l.currentUdcCount || 0) > 0).length,
          blockedLocations: locations.filter((l: any) => !l.enabled).length,
        };

        // Transform each location to match frontend expectations
        const transformedLocations = locations.map((loc: any) => {
          const isOccupied = (loc.currentUdcCount || 0) > 0;
          const currentCapacity = loc.currentUdcCount || 0;
          const maxCapacity = loc.maxUdcCapacity || 1;

          return {
            id: loc.id,
            code: loc.barcode || loc.description || `LOC-${loc.id}`,
            barcode: loc.barcode || '',
            description: loc.description || '',
            warehouseName: warehouseMap[loc.warehouseId] || `Mag. ${loc.warehouseId || 'N/A'}`,
            zoneName: loc.aisleId ? `Corsia ${loc.aisleId}` : 'N/A',
            type: locationTypeMap[loc.locationType] || `Tipo ${loc.locationType || 'N/A'}`,
            status: loc.enabled ? (isOccupied ? 'OCCUPIED' : 'AVAILABLE') : 'DISABLED',
            isOccupied,
            occupancy: isOccupied ? {
              udcBarcode: `UDC-${currentCapacity}`,
              itemCode: null,
            } : null,
            capacity: {
              max: maxCapacity,
              current: currentCapacity,
              utilizationPercent: maxCapacity > 0 ? (currentCapacity / maxCapacity * 100) : 0,
            },
          };
        });

        return {
          locations: transformedLocations,
          total,
          summary,
        };
      },
      providesTags: ['Location'],
    }),

    // GET /api/locations/:code - Get single location by code
    getLocationByCode: builder.query<any, string>({
      query: (code) => `/api/locations/${code}`,
      providesTags: (result, error, code) => [{ type: 'Location', id: code }],
    }),

    // GET /api/warehouses - Get all warehouses (stub for now)
    getWarehouses: builder.query<any[], void>({
      queryFn: async () => {
        // Return empty array for now - can be implemented later
        return { data: [] };
      },
    }),

    // GET /api/zones - Get zones by warehouse (stub for now)
    getZonesByWarehouse: builder.query<any[], string>({
      queryFn: async () => {
        // Return empty array for now - can be implemented later
        return { data: [] };
      },
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetMachinesQuery,
  useGetMachineByIdQuery,
  useGetDestinationGroupsByBayQuery,
  useSendLoadingUnitToBayMutation,
  useSendLoadingUnitOutOfBayMutation,
  // Real location endpoints
  useGetLocationsQuery,
  useGetLocationByCodeQuery,
  useGetWarehousesQuery,
  useGetZonesByWarehouseQuery,
} = locationsApiExtended;

// Export remaining stub hooks for not yet implemented endpoints
export {
  useGetWarehouseMapQuery,
  useGetOccupancyHeatmapQuery,
  useGetLocationHistoryQuery,
  useGetLocationMovementsQuery,
  useReserveLocationMutation,
  useUnreserveLocationMutation,
  useBlockLocationMutation,
  useUnblockLocationMutation,
  useUpdateLocationMutation,
  useTriggerInventoryCheckMutation,
} from './stubHooks';

