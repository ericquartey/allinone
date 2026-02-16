// ============================================================================
// EJLOG WMS - Operations API Service
// Tutti gli endpoint per la gestione operazioni missione
// ============================================================================

import { baseApi } from './baseApi';
import type {
  MissionOperation,
  OperationReason,
  ApiResponse,
  CompleteOperationRequest,
} from '../../types/models';

export const operationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/operations/{id} - Dettaglio operazione
    getOperation: builder.query<MissionOperation, number>({
      query: (id) => `/api/operations/${id}`,
      providesTags: (result, error, id) => [{ type: 'MissionOperation', id }],
    }),

    // GET /api/operations/{id}/aggregate - Operazione aggregata
    getOperationAggregate: builder.query<MissionOperation, number>({
      query: (id) => `/api/operations/${id}/aggregate`,
      providesTags: (result, error, id) => [{ type: 'MissionOperation', id }],
    }),

    // GET /api/operations/by-params - Operazione per parametri
    getOperationByParams: builder.query<
      MissionOperation,
      {
        machineId?: number;
        bayNumber?: number;
        itemId?: number;
        loadingUnitId?: number;
        type?: number;
      }
    >({
      query: (params) => ({
        url: '/operations/by-params',
        params,
      }),
      providesTags: (result) =>
        result ? [{ type: 'MissionOperation', id: result.id }] : [],
    }),

    // POST /api/operations/{id}/execute - Esegui operazione
    executeOperation: builder.mutation<
      ApiResponse<any>,
      { id: number; userName: string; notes?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/api/operations/${id}/execute`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'MissionOperation', id },
        { type: 'MissionOperation', id: 'LIST' },
      ],
    }),

    // POST /api/operations/{id}/complete - Completa operazione
    completeOperation: builder.mutation<ApiResponse<any>, CompleteOperationRequest>({
      query: ({ id, ...body }) => ({
        url: `/api/operations/${id}/complete`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'MissionOperation', id },
        { type: 'MissionOperation', id: 'LIST' },
        { type: 'ItemList', id: 'LIST' },
        { type: 'Product', id: 'LIST' },
      ],
    }),

    // POST /api/operations/{id}/suspend - Sospendi operazione
    suspendOperation: builder.mutation<
      ApiResponse<any>,
      { id: number; reasonId?: number; notes?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/api/operations/${id}/suspend`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'MissionOperation', id },
        { type: 'MissionOperation', id: 'LIST' },
      ],
    }),

    // POST /api/operations/send-id - Invia ID operazione
    sendIdOperation: builder.mutation<
      ApiResponse<any>,
      { operationId: number; machineId: number }
    >({
      query: (body) => ({
        url: '/operations/send-id',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'MissionOperation', id: 'LIST' }],
    }),

    // GET /api/operations/reasons - Causali per tipo
    getReasonsByType: builder.query<OperationReason[], { type: string }>({
      query: (params) => ({
        url: '/operations/reasons',
        params,
      }),
      providesTags: [{ type: 'OperationReason', id: 'LIST' }],
    }),

    // GET /api/operations/available-orders - Ordini disponibili
    getAvailableOrders: builder.query<
      any[],
      { machineId?: number; itemId?: number; areaId?: number }
    >({
      query: (params) => ({
        url: '/operations/available-orders',
        params,
      }),
    }),

    // GET /api/operations/extra-combo - Extra combo per operazione
    getExtraCombo: builder.query<any, { operationId: number }>({
      query: (params) => ({
        url: '/operations/extra-combo',
        params,
      }),
    }),

    // GET /api/operations - Lista operazioni
    getOperations: builder.query<
      MissionOperation[],
      {
        machineId?: number;
        status?: number;
        itemListId?: number;
        fromDate?: string;
        toDate?: string;
      }
    >({
      query: (params) => ({
        url: '/api/operations',
        params,
      }),
      transformResponse: (response: any) => response.data || [],
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'MissionOperation' as const, id })),
              { type: 'MissionOperation', id: 'LIST' },
            ]
          : [{ type: 'MissionOperation', id: 'LIST' }],
    }),

    // POST /api/operations - Crea operazione
    createOperation: builder.mutation<ApiResponse<MissionOperation>, Partial<MissionOperation>>({
      query: (body) => ({
        url: '/api/operations',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'MissionOperation', id: 'LIST' }],
    }),

    // DELETE /api/operations/{id} - Elimina operazione
    deleteOperation: builder.mutation<ApiResponse<void>, number>({
      query: (id) => ({
        url: `/api/operations/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'MissionOperation', id },
        { type: 'MissionOperation', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetOperationQuery,
  useGetOperationAggregateQuery,
  useGetOperationByParamsQuery,
  useLazyGetOperationByParamsQuery,
  useExecuteOperationMutation,
  useCompleteOperationMutation,
  useSuspendOperationMutation,
  useSendIdOperationMutation,
  useGetReasonsByTypeQuery,
  useGetAvailableOrdersQuery,
  useGetExtraComboQuery,
  useGetOperationsQuery,
  useCreateOperationMutation,
  useDeleteOperationMutation,
} = operationsApi;
