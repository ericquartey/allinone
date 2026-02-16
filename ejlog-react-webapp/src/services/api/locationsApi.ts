// ============================================================================
// EJLOG WMS - Locations API Service (Ubicazioni/Warehouse Locations)
// RTK Query API per gestione ubicazioni di magazzino (Locazioni/LocazioneDB)
// Backend: /EjLogHostVertimag/Locations su porta 3077
//
// NOTA: L'endpoint backend NON è ancora implementato, quindi usa dati MOCK
// Cambia USE_MOCK_DATA a false quando il backend sarà pronto
// ============================================================================

import { baseApi } from './baseApi';

// ============================================================================
// CONFIGURAZIONE MOCK DATA
// ============================================================================
const USE_MOCK_DATA = false; // ✅ Usando dati reali dal backend

/**
 * Location type definition (Ubicazione/LocazioneDB)
 */
export interface Location {
  id: number;
  description: string;
  barcode?: string;
  locationType?: string;
  warehouseId?: number;
  areaId?: number;
  corridorId?: number;
  bayId?: number;
  channelId?: number;
  x?: number;
  y?: number;
  z?: number;
  w?: number;
  numUdc?: number;
  maxUdc?: number;
  enabled?: boolean;
  automated?: boolean;
  widthMm?: number;
  depthMm?: number;
  heightMm?: number;
}

/**
 * Location filters for query parameters
 */
export interface LocationFilters {
  barcode?: string;
  warehouseId?: number;
  areaId?: number;
  corridorId?: number;
  enabled?: boolean;
  limit?: number;
  offset?: number;
}

// ============================================================================
// DATI MOCK PER TESTING E SVILUPPO
// ============================================================================
const MOCK_LOCATIONS: Location[] = [
  // Zona A - Scaffalature
  {
    id: 1,
    description: 'Scaffale A01-01-01',
    barcode: 'LOC-A01-01-01',
    locationType: 'SCAFFALE',
    warehouseId: 1,
    areaId: 1,
    corridorId: 1,
    bayId: 1,
    channelId: 1,
    x: 0,
    y: 0,
    z: 0,
    w: 0,
    numUdc: 1,
    maxUdc: 1,
    enabled: true,
    automated: false,
    widthMm: 1200,
    depthMm: 800,
    heightMm: 2000,
  },
  {
    id: 2,
    description: 'Scaffale A01-01-02',
    barcode: 'LOC-A01-01-02',
    locationType: 'SCAFFALE',
    warehouseId: 1,
    areaId: 1,
    corridorId: 1,
    bayId: 1,
    channelId: 2,
    x: 0,
    y: 1,
    z: 0,
    w: 0,
    numUdc: 0,
    maxUdc: 1,
    enabled: true,
    automated: false,
    widthMm: 1200,
    depthMm: 800,
    heightMm: 2000,
  },
  {
    id: 3,
    description: 'Scaffale A01-02-01',
    barcode: 'LOC-A01-02-01',
    locationType: 'SCAFFALE',
    warehouseId: 1,
    areaId: 1,
    corridorId: 1,
    bayId: 2,
    channelId: 1,
    x: 1,
    y: 0,
    z: 0,
    w: 0,
    numUdc: 1,
    maxUdc: 1,
    enabled: true,
    automated: false,
    widthMm: 1200,
    depthMm: 800,
    heightMm: 2000,
  },
  // Zona B - Magazzino Verticale
  {
    id: 4,
    description: 'Vertimag Bay 01',
    barcode: 'LOC-VM01-BAY01',
    locationType: 'VERTIMAG',
    warehouseId: 1,
    areaId: 2,
    bayId: 1,
    numUdc: 1,
    maxUdc: 1,
    enabled: true,
    automated: true,
    widthMm: 1500,
    depthMm: 1000,
    heightMm: 2500,
  },
  {
    id: 5,
    description: 'Vertimag Bay 02',
    barcode: 'LOC-VM01-BAY02',
    locationType: 'VERTIMAG',
    warehouseId: 1,
    areaId: 2,
    bayId: 2,
    numUdc: 0,
    maxUdc: 1,
    enabled: true,
    automated: true,
    widthMm: 1500,
    depthMm: 1000,
    heightMm: 2500,
  },
  {
    id: 6,
    description: 'Vertimag Bay 03',
    barcode: 'LOC-VM01-BAY03',
    locationType: 'VERTIMAG',
    warehouseId: 1,
    areaId: 2,
    bayId: 3,
    numUdc: 1,
    maxUdc: 1,
    enabled: true,
    automated: true,
    widthMm: 1500,
    depthMm: 1000,
    heightMm: 2500,
  },
  // Zona C - Area Spedizione
  {
    id: 7,
    description: 'Area Spedizione 01',
    barcode: 'LOC-SHIP-01',
    locationType: 'SPEDIZIONE',
    warehouseId: 1,
    areaId: 3,
    numUdc: 2,
    maxUdc: 5,
    enabled: true,
    automated: false,
    widthMm: 2000,
    depthMm: 1500,
    heightMm: 500,
  },
  {
    id: 8,
    description: 'Area Spedizione 02',
    barcode: 'LOC-SHIP-02',
    locationType: 'SPEDIZIONE',
    warehouseId: 1,
    areaId: 3,
    numUdc: 0,
    maxUdc: 5,
    enabled: true,
    automated: false,
    widthMm: 2000,
    depthMm: 1500,
    heightMm: 500,
  },
  // Zona D - Buffer
  {
    id: 9,
    description: 'Buffer 01',
    barcode: 'LOC-BUF-01',
    locationType: 'BUFFER',
    warehouseId: 1,
    areaId: 4,
    numUdc: 3,
    maxUdc: 10,
    enabled: true,
    automated: false,
    widthMm: 3000,
    depthMm: 2000,
    heightMm: 500,
  },
  {
    id: 10,
    description: 'Buffer 02',
    barcode: 'LOC-BUF-02',
    locationType: 'BUFFER',
    warehouseId: 1,
    areaId: 4,
    numUdc: 5,
    maxUdc: 10,
    enabled: true,
    automated: false,
    widthMm: 3000,
    depthMm: 2000,
    heightMm: 500,
  },
];

/**
 * API for Location CRUD operations (Ubicazioni)
 */
export const locationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ========================================================================
    // GET /EjLogHostVertimag/Locations - Get all locations with filters
    // ========================================================================
    getLocations: builder.query<Location[], LocationFilters | void>({
      queryFn: USE_MOCK_DATA
        ? async (filters) => {
            // Simula delay di rete
            await new Promise(resolve => setTimeout(resolve, 300));

            let filtered = [...MOCK_LOCATIONS];

            // Applica filtri se presenti
            if (filters) {
              if (filters.barcode) {
                filtered = filtered.filter(loc =>
                  loc.barcode?.toLowerCase().includes(filters.barcode!.toLowerCase())
                );
              }
              if (filters.warehouseId) {
                filtered = filtered.filter(loc => loc.warehouseId === filters.warehouseId);
              }
              if (filters.areaId) {
                filtered = filtered.filter(loc => loc.areaId === filters.areaId);
              }
              if (filters.corridorId) {
                filtered = filtered.filter(loc => loc.corridorId === filters.corridorId);
              }
              if (filters.enabled !== undefined) {
                filtered = filtered.filter(loc => loc.enabled === filters.enabled);
              }

              // Paginazione
              if (filters.offset) {
                filtered = filtered.slice(filters.offset);
              }
              if (filters.limit) {
                filtered = filtered.slice(0, filters.limit);
              }
            }

            return { data: filtered };
          }
        : undefined,
      query: USE_MOCK_DATA
        ? undefined
        : (filters) => ({
            url: '/EjLogHostVertimag/Locations',
            params: filters || {},
          }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Location' as const, id })),
              { type: 'Location', id: 'LIST' },
            ]
          : [{ type: 'Location', id: 'LIST' }],
    }),

    // ========================================================================
    // GET /EjLogHostVertimag/Locations/{id} - Get location by ID
    // ========================================================================
    getLocationById: builder.query<Location, number>({
      query: (id) => `/EjLogHostVertimag/Locations/${id}`,
      providesTags: (result, error, id) => [{ type: 'Location', id }],
    }),

    // ========================================================================
    // POST /EjLogHostVertimag/Locations - Create new location
    // ========================================================================
    createLocation: builder.mutation<Location, Partial<Location>>({
      query: (body) => ({
        url: '/EjLogHostVertimag/Locations',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Location', id: 'LIST' }],
    }),

    // ========================================================================
    // PUT /EjLogHostVertimag/Locations/{id} - Update location
    // ========================================================================
    updateLocation: builder.mutation<
      Location,
      { id: number; data: Partial<Location> }
    >({
      query: ({ id, data }) => ({
        url: `/EjLogHostVertimag/Locations/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Location', id },
        { type: 'Location', id: 'LIST' },
      ],
    }),

    // ========================================================================
    // DELETE /EjLogHostVertimag/Locations/{id} - Delete location
    // ========================================================================
    deleteLocation: builder.mutation<void, number>({
      query: (id) => ({
        url: `/EjLogHostVertimag/Locations/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Location', id: 'LIST' }],
    }),
  }),
});

// Export hooks for use in components
export const {
  useGetLocationsQuery,
  useGetLocationByIdQuery,
  useCreateLocationMutation,
  useUpdateLocationMutation,
  useDeleteLocationMutation,
} = locationsApi;

