// ============================================================================
// EJLOG WMS - Loading Units API Service
// Endpoints per la gestione UDC (Unità Di Carico)
// Backend: /EjLogHostVertimag/api/loading-units su porta 3077
// ============================================================================

import { baseApi } from './baseApi';
import type {
  LoadingUnit,
  Compartment,
  MissionOperation,
  PaginatedResponse,
  PaginationParams,
  SearchParams,
  Product,
} from '../../types/models';

/**
 * Response dal backend EjLog per GET /api/loading-units/{id}
 * Nota: il backend restituisce dati in formato Java che vanno trasformati
 */
interface BackendLoadingUnitResponse {
  id: number;
  width: number;
  depth: number;
  compartmentsCount: number;
  areaFillRate: number;
  note?: string;
  // Campi aggiuntivi che potrebbero arrivare dal backend
  machineId?: number;
  bayNumber?: number;
  barcode?: string;
}

/**
 * Trasforma i dati dal backend EjLog al formato frontend
 */
function transformLoadingUnit(raw: any): LoadingUnit {
  return {
    id: raw.id || 0,
    barcode: raw.barcode || undefined,
    width: raw.width || 0,
    depth: raw.depth || 0,
    height: raw.height || undefined,
    compartmentsCount: raw.compartmentsCount || 0,
    areaFillRate: raw.areaFillRate || 0,
    isBlockedFromEjlog: raw.isBlockedFromEjlog || false,
    note: raw.note || undefined,
    currentLocation: raw.currentLocation || undefined,
    machineId: raw.machineId || undefined,
    bayNumber: raw.bayNumber || undefined,
  };
}

/**
 * Trasforma i dati compartment dal backend al formato frontend
 * Il backend usa: xposition, yposition (lowercase) invece di xPosition, yPosition
 */
function transformCompartment(raw: any): Compartment {
  return {
    id: raw.id || 0,
    loadingUnitId: raw.loadingUnitId || 0,
    barcode: raw.barcode || undefined,
    width: raw.width || 0,
    depth: raw.depth || 0,
    height: raw.height || undefined,
    // Il backend usa lowercase: xposition, yposition
    xPosition: raw.xPosition || raw.xposition || 0,
    yPosition: raw.yPosition || raw.yposition || 0,
    zPosition: raw.zPosition || raw.zposition || 0,
    fillPercentage: raw.fillPercentage || 0,
    products: raw.products ? raw.products.map(transformProduct) : undefined,
    maxWeight: raw.maxWeight || undefined,
    currentWeight: raw.currentWeight || undefined,
  };
}

/**
 * Trasforma i prodotti dal formato backend
 */
function transformProduct(raw: any): Product {
  return {
    item: {
      id: raw.itemId || 0,
      code: raw.item || raw.itemCode || '',
      description: raw.description || '',
      itemCategoryDescription: raw.category || null,
      measureUnitDescription: raw.measureUnit || 'PZ',
      managementType: raw.managementType || 0,
      quantitySignificantFigures: 2,
      isDraperyItem: false,
      isHandledByLot: !!raw.lot,
      isHandledBySerialNumber: !!raw.serialNumber,
      isHandledByExpireDate: !!raw.expiryDate,
    },
    stockedQuantity: raw.qty ?? raw.quantity ?? 0,
    inventoryThreshold: raw.threshold || 0,
    lot: raw.lot || undefined,
    serialNumber: raw.serialNumber || undefined,
    sscc: raw.sscc || undefined,
    expirationDate: raw.expiryDate || raw.expirationDate || undefined,
    compartmentId: raw.compartmentId || undefined,
    loadingUnitId: raw.loadingUnitId || undefined,
    areaId: raw.areaId || undefined,
    isBlocked: raw.isBlocked || false,
    blockReason: raw.blockReason || undefined,
  };
}

export const loadingUnitsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ========================================================================
    // GET /EjLogHostVertimag/api/loading-units - Lista UDC (BACKEND REALE porta 3077)
    // ========================================================================
    getLoadingUnits: builder.query<PaginatedResponse<LoadingUnit>, PaginationParams & SearchParams>({
      query: (params) => ({
        url: '/EjLogHostVertimag/api/loading-units',
        params: {
          limit: params.take || params.pageSize || 50,
          offset: params.skip || 0,
          search: params.search,
        },
      }),
      transformResponse: (response: any) => {
        // Il backend restituisce un array semplice, non una risposta paginata
        const items = Array.isArray(response) ? response : [];
        return {
          data: items.map(transformLoadingUnit),
          total: items.length,
          page: 0,
          pageSize: items.length,
          totalPages: 1,
        };
      },
      providesTags: (result) => [{ type: 'LoadingUnit', id: 'LIST' }],
    }),

    // ========================================================================
    // GET /EjLogHostVertimag/api/loading-units/{id} - Dettaglio UDC
    // ========================================================================
    getLoadingUnitById: builder.query<LoadingUnit, number>({
      query: (id) => `/EjLogHostVertimag/api/loading-units/${id}`,
      transformResponse: (response: any) => transformLoadingUnit(response),
      providesTags: (result, error, id) => [{ type: 'LoadingUnit', id }],
    }),

    // ========================================================================
    // GET /EjLogHostVertimag/api/loading-units/{id}/compartments - Scompartimenti di un'UDC
    // Query parameter: includeProducts=true per includere i prodotti
    // ========================================================================
    getCompartmentsByLoadingUnit: builder.query<
      Compartment[],
      { id: number; includeProducts?: boolean }
    >({
      query: ({ id, includeProducts = true }) => ({
        url: `/EjLogHostVertimag/api/loading-units/${id}/compartments`,
        params: {
          includeProducts,
        },
      }),
      transformResponse: (response: any) => {
        const compartments = Array.isArray(response) ? response : [];
        return compartments.map(transformCompartment);
      },
      providesTags: (result, error, { id }) => [
        { type: 'Compartment', id: `LOADING_UNIT_${id}` },
      ],
    }),

    // ========================================================================
    // GET /EjLogHostVertimag/api/loading-units/{id}/mission-operations - Operazioni missione per UDC
    // ========================================================================
    getMissionOperationsByLoadingUnit: builder.query<MissionOperation[], number>({
      query: (id) => `/EjLogHostVertimag/api/loading-units/${id}/mission-operations`,
      providesTags: (result, error, id) => [{ type: 'MissionOperation', id: `LOADING_UNIT_${id}` }],
    }),

    // ========================================================================
    // PUT /EjLogHostVertimag/api/loading-units - Crea nuova UDC
    // ========================================================================
    createLoadingUnit: builder.mutation<LoadingUnit, { machineId?: number }>({
      query: (body) => ({
        url: '/EjLogHostVertimag/api/loading-units',
        method: 'PUT',
        params: body,
      }),
      transformResponse: (response: any) => transformLoadingUnit(response),
      invalidatesTags: [{ type: 'LoadingUnit', id: 'LIST' }],
    }),

    // ========================================================================
    // DELETE /EjLogHostVertimag/api/loading-units/{id} - Elimina UDC
    // ========================================================================
    deleteLoadingUnit: builder.mutation<void, number>({
      query: (id) => ({
        url: `/EjLogHostVertimag/api/loading-units/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'LoadingUnit', id: 'LIST' },
        { type: 'LoadingUnit', id },
      ],
    }),

    // ========================================================================
    // POST /EjLogHostVertimag/api/loading-units/{id}/immediate_additem - Aggiungi item a UDC
    // ========================================================================
    addItemToLoadingUnit: builder.mutation<
      void,
      {
        id: number;
        itemId: number;
        quantity: number;
        compartmentId?: number;
        lot?: string;
        serialNumber?: string;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/EjLogHostVertimag/api/loading-units/${id}/immediate_additem`,
        method: 'POST',
        params: body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'LoadingUnit', id },
        { type: 'Compartment', id: `LOADING_UNIT_${id}` },
      ],
    }),

    // ========================================================================
    // POST /EjLogHostVertimag/api/loading-units/{id}/additem-reasons - Aggiungi item con causale
    // ========================================================================
    addItemToLoadingUnitWithReason: builder.mutation<
      void,
      {
        id: number;
        itemId: number;
        quantity: number;
        compartmentId?: number;
        lot?: string;
        serialNumber?: string;
        reasonId?: number;
        reasonNotes?: string;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/EjLogHostVertimag/api/loading-units/${id}/additem-reasons`,
        method: 'POST',
        params: body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'LoadingUnit', id },
        { type: 'Compartment', id: `LOADING_UNIT_${id}` },
      ],
    }),

    // ========================================================================
    // POST /EjLogHostVertimag/api/loading-units/{id}/call - Chiama UDC a postazione
    // ========================================================================
    callLoadingUnit: builder.mutation<
      void,
      {
        id: number;
        destinationGroupId?: number;
        userName?: string;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/EjLogHostVertimag/api/loading-units/${id}/call`,
        method: 'POST',
        params: body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'LoadingUnit', id }],
    }),

    // ========================================================================
    // POST /EjLogHostVertimag/api/loading-units/{id}/set-lu-info - Imposta info UDC
    // ========================================================================
    setLoadingUnitInfo: builder.mutation<
      LoadingUnit,
      {
        id: number;
        machineId?: number;
        cellId?: number;
        y?: number;
        side?: number;
        height?: number;
        bayNumber?: number;
        netWeight?: number;
        tare?: number;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/EjLogHostVertimag/api/loading-units/${id}/set-lu-info`,
        method: 'POST',
        params: body,
      }),
      transformResponse: (response: any) => transformLoadingUnit(response),
      invalidatesTags: (result, error, { id }) => [
        { type: 'LoadingUnit', id: 'LIST' },
        { type: 'LoadingUnit', id },
      ],
    }),
  }),
});

export const {
  useGetLoadingUnitsQuery,
  useGetLoadingUnitByIdQuery,
  useGetCompartmentsByLoadingUnitQuery,
  useGetMissionOperationsByLoadingUnitQuery,
  useCreateLoadingUnitMutation,
  useDeleteLoadingUnitMutation,
  useAddItemToLoadingUnitMutation,
  useAddItemToLoadingUnitWithReasonMutation,
  useCallLoadingUnitMutation,
  useSetLoadingUnitInfoMutation,
} = loadingUnitsApi;

