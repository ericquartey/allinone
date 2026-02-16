// ============================================================================
// EJLOG WMS - Stock API Service
// Endpoint per giacenze e movimenti
// ============================================================================

import { baseApi } from './baseApi';
import type {
  StockMovement,
  StockFilters,
  PaginatedResponse,
  ApiResponse,
  StockStats,
} from '../../types/models';

// Stock Item type for the /Stock endpoint
export interface StockItem {
  id: number;
  itemId: number;
  itemCode: string;
  itemDescription: string | null;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  lot: string;
  serialNumber: string;
  locationId: number;
  locationCode: string;
  loadingUnitId: number;
  insertDate: string;
  lastModifiedDate: string;
}

export interface StockResponse {
  items: StockItem[];
  totalCount: number;
  limit: number;
  offset: number;
  source: string;
}

export interface StockQueryParams {
  limit?: number;
  offset?: number;
  itemCode?: string;
  lot?: string;
  trayId?: number;
}

export const stockApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /EjLogHostVertimag/Stock - Lista giacenze
    getStock: builder.query<StockResponse, StockQueryParams | void>({
      query: (params = {}) => ({
        url: '/EjLogHostVertimag/Stock',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: 'Stock' as const, id })),
              { type: 'Stock', id: 'LIST' },
            ]
          : [{ type: 'Stock', id: 'LIST' }],
    }),

    // GET /api/stock/movements - Movimenti stock
    getStockMovements: builder.query<PaginatedResponse<StockMovement>, StockFilters>({
      query: (filters) => ({
        url: '/stock/movements',
        params: filters,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'StockMovement' as const, id })),
              { type: 'StockMovement', id: 'LIST' },
            ]
          : [{ type: 'StockMovement', id: 'LIST' }],
    }),

    // GET /api/stock/movements/{id} - Dettaglio movimento
    getStockMovementById: builder.query<StockMovement, number>({
      query: (id) => `/stock/movements/${id}`,
      providesTags: (result, error, id) => [{ type: 'StockMovement', id }],
    }),

    // GET /api/stock/stats - Statistiche giacenze
    getStockStats: builder.query<StockStats, void>({
      query: () => '/stock/stats',
    }),

    // GET /api/stock/by-item/{itemId} - Giacenze per articolo
    getStockByItem: builder.query<
      Array<{
        locationId: number;
        locationName: string;
        quantity: number;
        lot?: string;
        serialNumber?: string;
      }>,
      number
    >({
      query: (itemId) => `/stock/by-item/${itemId}`,
      providesTags: (result, error, itemId) => [{ type: 'Item', id: itemId }],
    }),

    // GET /api/stock/by-location/{locationId} - Giacenze per ubicazione
    getStockByLocation: builder.query<
      Array<{
        itemId: number;
        itemCode: string;
        itemDescription: string;
        quantity: number;
        lot?: string;
        serialNumber?: string;
      }>,
      number
    >({
      query: (locationId) => `/stock/by-location/${locationId}`,
    }),

    // POST /api/stock/adjustment - Rettifica giacenza
    createStockAdjustment: builder.mutation<
      ApiResponse<StockMovement>,
      {
        itemId: number;
        locationId: number;
        quantity: number;
        reasonId: number;
        notes?: string;
        userName: string;
      }
    >({
      query: (body) => ({
        url: '/stock/adjustment',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'StockMovement', id: 'LIST' },
        { type: 'Product', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetStockQuery,
  useGetStockMovementsQuery,
  useGetStockMovementByIdQuery,
  useGetStockStatsQuery,
  useGetStockByItemQuery,
  useGetStockByLocationQuery,
  useCreateStockAdjustmentMutation,
} = stockApi;
