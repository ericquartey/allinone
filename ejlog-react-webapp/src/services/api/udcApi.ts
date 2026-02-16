// ============================================================================
// EJLOG WMS - Loading Units (UDC) API Service
// Tutti gli endpoint per la gestione unità di carico
// ============================================================================

import { baseApi } from './baseApi';
import type {
  LoadingUnit,
  Compartment,
  MissionOperation,
  ApiResponse,
  CreateLoadingUnitRequest,
  AddItemToUdcRequest,
} from '../../types/models';

export const udcApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // POST /api/udc - Crea nuova UDC
    createUdc: builder.mutation<ApiResponse<LoadingUnit>, CreateLoadingUnitRequest>({
      query: (body) => ({
        url: '/udc',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'LoadingUnit', id: 'LIST' }],
    }),

    // GET /api/udc/{id} - Dettaglio UDC
    getUdc: builder.query<LoadingUnit, number>({
      query: (id) => `/udc/${id}`,
      providesTags: (result, error, id) => [{ type: 'LoadingUnit', id }],
    }),

    // GET /api/udc/barcode/{barcode} - UDC da barcode
    getUdcByBarcode: builder.query<LoadingUnit, string>({
      query: (barcode) => `/udc/barcode/${encodeURIComponent(barcode)}`,
      providesTags: (result) => (result ? [{ type: 'LoadingUnit', id: result.id }] : []),
    }),

    // DELETE /api/udc/{id} - Elimina UDC
    deleteUdc: builder.mutation<ApiResponse<void>, number>({
      query: (id) => ({
        url: `/udc/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'LoadingUnit', id },
        { type: 'LoadingUnit', id: 'LIST' },
      ],
    }),

    // GET /api/udc/{id}/compartments - Compartimenti UDC
    getUdcCompartments: builder.query<Compartment[], number>({
      query: (id) => `/udc/${id}/compartments`,
      providesTags: (result, error, id) => [
        { type: 'LoadingUnit', id },
        { type: 'Compartment', id: 'LIST' },
      ],
    }),

    // GET /api/udc/{id}/missions - Operazioni missione UDC
    getUdcMissionOperations: builder.query<MissionOperation[], number>({
      query: (id) => `/udc/${id}/missions`,
      providesTags: (result, error, id) => [
        { type: 'LoadingUnit', id },
        { type: 'MissionOperation', id: 'LIST' },
      ],
    }),

    // POST /api/udc/{id}/immediate-add-item - Aggiungi articolo immediato
    immediateAddItem: builder.mutation<ApiResponse<any>, AddItemToUdcRequest>({
      query: ({ loadingUnitId, ...body }) => ({
        url: `/udc/${loadingUnitId}/immediate-add-item`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { loadingUnitId }) => [
        { type: 'LoadingUnit', id: loadingUnitId },
        { type: 'Product', id: 'LIST' },
      ],
    }),

    // POST /api/udc/{id}/immediate-add-by-list - Aggiungi da lista immediato
    immediateAddByList: builder.mutation<
      ApiResponse<any>,
      { loadingUnitId: number; listId: number; userName: string }
    >({
      query: ({ loadingUnitId, ...body }) => ({
        url: `/udc/${loadingUnitId}/immediate-add-by-list`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { loadingUnitId }) => [
        { type: 'LoadingUnit', id: loadingUnitId },
        { type: 'ItemList', id: 'LIST' },
      ],
    }),

    // POST /api/udc/{id}/add-item-with-reason - Aggiungi articolo con causale
    addItemWithReason: builder.mutation<
      ApiResponse<any>,
      AddItemToUdcRequest & { reasonId: number; reasonNotes?: string }
    >({
      query: ({ loadingUnitId, ...body }) => ({
        url: `/udc/${loadingUnitId}/add-item-with-reason`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { loadingUnitId }) => [
        { type: 'LoadingUnit', id: loadingUnitId },
      ],
    }),

    // POST /api/udc/{id}/call - Chiama UDC
    callUdc: builder.mutation<
      ApiResponse<any>,
      { id: number; machineId: number; bayNumber?: number }
    >({
      query: ({ id, ...body }) => ({
        url: `/udc/${id}/call`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'LoadingUnit', id },
        { type: 'Machine', id: 'LIST' },
      ],
    }),

    // POST /api/udc/{id}/send-to-bay - Invia UDC a baia
    sendUdcToBay: builder.mutation<
      ApiResponse<any>,
      { id: number; machineId: number; bayNumber: number }
    >({
      query: ({ id, ...body }) => ({
        url: `/udc/${id}/send-to-bay`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'LoadingUnit', id },
        { type: 'Machine', id: 'LIST' },
      ],
    }),

    // POST /api/udc/{id}/send-out-bay - Estrai UDC da baia
    sendUdcOutBay: builder.mutation<ApiResponse<any>, { id: number; machineId: number }>({
      query: ({ id, ...body }) => ({
        url: `/udc/${id}/send-out-bay`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'LoadingUnit', id },
        { type: 'Machine', id: 'LIST' },
      ],
    }),

    // POST /api/udc/{id}/move-bay-to-trolley - Sposta da baia a carrello
    moveUdcFromBayToTrolley: builder.mutation<
      ApiResponse<any>,
      { id: number; machineId: number; bayNumber: number }
    >({
      query: ({ id, ...body }) => ({
        url: `/udc/${id}/move-bay-to-trolley`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'LoadingUnit', id }],
    }),

    // POST /api/udc/{id}/move-trolley-to-bay - Sposta da carrello a baia
    moveUdcFromTrolleyToBay: builder.mutation<
      ApiResponse<any>,
      { id: number; machineId: number; bayNumber: number }
    >({
      query: ({ id, ...body }) => ({
        url: `/udc/${id}/move-trolley-to-bay`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'LoadingUnit', id }],
    }),

    // POST /api/udc/{id}/send-matrix-request - Invia richiesta matrice
    sendMatrixRequest: builder.mutation<
      ApiResponse<any>,
      { id: number; requestType: string; data: any }
    >({
      query: ({ id, ...body }) => ({
        url: `/udc/${id}/send-matrix-request`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'LoadingUnit', id }],
    }),

    // PUT /api/udc/{id}/info - Aggiorna info UDC
    setUdcInfo: builder.mutation<
      ApiResponse<any>,
      { id: number; note?: string; isBlocked?: boolean }
    >({
      query: ({ id, ...body }) => ({
        url: `/udc/${id}/info`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'LoadingUnit', id }],
    }),

    // POST /api/udc/{id}/load-drapery - Carica telo
    loadDraperyItem: builder.mutation<
      ApiResponse<any>,
      { id: number; itemId: number; quantity: number; compartmentId?: number }
    >({
      query: ({ id, ...body }) => ({
        url: `/udc/${id}/load-drapery`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'LoadingUnit', id }],
    }),

    // GET /api/udc - Lista UDC
    getUdcList: builder.query<LoadingUnit[], { areaId?: number; machineId?: number }>({
      query: (params) => ({
        url: '/udc',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'LoadingUnit' as const, id })),
              { type: 'LoadingUnit', id: 'LIST' },
            ]
          : [{ type: 'LoadingUnit', id: 'LIST' }],
    }),
  }),
});

export const {
  useCreateUdcMutation,
  useGetUdcQuery,
  useGetUdcByBarcodeQuery,
  useLazyGetUdcByBarcodeQuery,
  useDeleteUdcMutation,
  useGetUdcCompartmentsQuery,
  useGetUdcMissionOperationsQuery,
  useImmediateAddItemMutation,
  useImmediateAddByListMutation,
  useAddItemWithReasonMutation,
  useCallUdcMutation,
  useSendUdcToBayMutation,
  useSendUdcOutBayMutation,
  useMoveUdcFromBayToTrolleyMutation,
  useMoveUdcFromTrolleyToBayMutation,
  useSendMatrixRequestMutation,
  useSetUdcInfoMutation,
  useLoadDraperyItemMutation,
  useGetUdcListQuery,
} = udcApi;
