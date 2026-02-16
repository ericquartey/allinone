// ============================================================================
// EJLOG WMS - Movements API Service
// Tutti gli endpoint per la gestione movimenti di magazzino
// ============================================================================

import { baseApi } from './baseApi';
import type {
  StockMovement,
  PaginatedResponse,
  PaginationParams,
  SortParams,
  SearchParams,
} from '../../types/models';

export interface MovementFilters extends PaginationParams, SortParams, SearchParams {
  itemId?: number;
  itemCode?: string;
  movementType?: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER';
  fromDate?: string;
  toDate?: string;
  fromLocationId?: number;
  toLocationId?: number;
  lot?: string;
  serialNumber?: string;
  documentNumber?: string;
  operatorUserName?: string;
}

export const movementsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/stock-movements - Lista movimenti con filtri
    getMovements: builder.query<PaginatedResponse<StockMovement>, MovementFilters>({
      query: (filters) => ({
        url: '/stock-movements',
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

    // GET /api/stock-movements/{id} - Dettaglio movimento
    getMovementById: builder.query<StockMovement, number>({
      query: (id) => `/stock-movements/${id}`,
      providesTags: (result, error, id) => [{ type: 'StockMovement', id }],
    }),

    // GET /api/stock-movements/item/{itemId} - Movimenti per articolo
    getMovementsByItem: builder.query<StockMovement[], number>({
      query: (itemId) => `/stock-movements/item/${itemId}`,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'StockMovement' as const, id })),
              { type: 'StockMovement', id: 'LIST' },
            ]
          : [{ type: 'StockMovement', id: 'LIST' }],
    }),

    // GET /api/stock-movements/location/{locationId} - Movimenti per ubicazione
    getMovementsByLocation: builder.query<StockMovement[], number>({
      query: (locationId) => `/stock-movements/location/${locationId}`,
      providesTags: [{ type: 'StockMovement', id: 'LIST' }],
    }),

    // POST /api/stock-movements - Crea nuovo movimento
    createMovement: builder.mutation<StockMovement, Partial<StockMovement>>({
      query: (movement) => ({
        url: '/stock-movements',
        method: 'POST',
        body: movement,
      }),
      invalidatesTags: [
        { type: 'StockMovement', id: 'LIST' },
        { type: 'Product', id: 'LIST' },
      ],
    }),

    // GET /api/stock-movements/export - Esporta movimenti in Excel
    exportMovements: builder.query<Blob, MovementFilters>({
      query: (filters) => ({
        url: '/stock-movements/export',
        params: filters,
        responseHandler: (response) => response.blob(),
      }),
    }),

    // GET /api/stock-movements/stats - Statistiche movimenti
    getMovementsStats: builder.query<{
      totalIn: number;
      totalOut: number;
      totalAdjustments: number;
      totalTransfers: number;
      byType: Record<string, number>;
      byDate: Array<{ date: string; count: number }>;
    }, { fromDate?: string; toDate?: string }>({
      query: (params) => ({
        url: '/stock-movements/stats',
        params,
      }),
      providesTags: [{ type: 'StockMovement', id: 'STATS' }],
    }),
  }),
});

export const {
  useGetMovementsQuery,
  useLazyGetMovementsQuery,
  useGetMovementByIdQuery,
  useGetMovementsByItemQuery,
  useGetMovementsByLocationQuery,
  useCreateMovementMutation,
  useLazyExportMovementsQuery,
  useGetMovementsStatsQuery,
} = movementsApi;
