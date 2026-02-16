// ============================================================================
// EJLOG WMS - Items API Service
// Tutti gli endpoint per la gestione articoli
// Updated: usando /products endpoint invece di /items
// ============================================================================

import { baseApi } from './baseApi';
import type {
  Item,
  ItemFilters,
  PaginatedResponse,
  ApiResponse,
  PickItemRequest,
  PutItemRequest,
} from '../../types/models';

export const itemsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/items - Lista articoli con filtri e paginazione
    // Backend Node.js usa limit/offset
    getItems: builder.query<PaginatedResponse<Item>, ItemFilters>({
      query: (filters) => {
        // Converti page/pageSize in limit/offset
        const limit = filters.pageSize;
        const offset = filters.page * filters.pageSize;

        console.log('[RTK QUERY] getItems called with filters:', { limit, offset, search: filters.searchQuery });

        return {
          url: '/api/items',
          params: {
            limit,
            offset,
            search: filters.searchQuery,
          },
        };
      },
      // FORCE REFETCH on every mount and argument change
      keepUnusedDataFor: 0,
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
      transformResponse: (response: { success: boolean; data: any[]; pagination: any }, meta, arg) => {
        // Il backend Node.js restituisce { success, data, pagination }
        return {
          data: response.data.map((item) => ({
            id: item.id,
            code: item.code,
            description: item.description,
            abcClassDescription: '', // Non disponibile da backend semplice
            itemCategoryDescription: item.categoryId ? `Categoria ${item.categoryId}` : '',
            measureUnitDescription: item.unitOfMeasure || '',
            managementType: 0, // Standard per default
            note: '',
            averageWeight: item.weight || 0,
            unitWeight: item.weight || 0,
            fifoTimePick: 0,
            fifoTimePut: 0,
            quantitySignificantFigures: 0,
            isDraperyItem: false,
            isHandledByLot: false,
            isHandledBySerialNumber: false,
            isHandledByExpireDate: false,
            imageUrl: item.imageUrl || '',
            barcode: item.barcode || '',
            alternativeBarcodes: [],
          })),
          page: arg.page,
          pageSize: arg.pageSize,
          total: response.pagination.total,
          totalPages: Math.ceil(response.pagination.total / arg.pageSize),
        };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Item' as const, id })),
              { type: 'Item', id: 'LIST' },
            ]
          : [{ type: 'Item', id: 'LIST' }],
    }),

    // GET /api/items/{id} - Dettaglio articolo per ID
    getItemById: builder.query<Item, number>({
      query: (id) => `/api/items/${id}`,
      providesTags: (result, error, id) => [{ type: 'Item', id }],
    }),

    // GET /api/items/barcode/{barcode} - Articolo da barcode
    getItemByBarcode: builder.query<Item, string>({
      query: (barcode) => `/api/items/barcode/${encodeURIComponent(barcode)}`,
      providesTags: (result) => (result ? [{ type: 'Item', id: result.id }] : []),
    }),

    // POST /api/items/{id}/pick - Prelievo articolo
    pickItem: builder.mutation<ApiResponse<any>, PickItemRequest>({
      query: ({ id, ...body }) => ({
        url: `/api/items/${id}/pick`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Item', id },
        { type: 'Product', id: 'LIST' },
        { type: 'StockMovement', id: 'LIST' },
      ],
    }),

    // POST /api/items/{id}/put - Deposito articolo
    putItem: builder.mutation<ApiResponse<any>, PutItemRequest>({
      query: ({ id, ...body }) => ({
        url: `/items/${id}/put`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Item', id },
        { type: 'Product', id: 'LIST' },
        { type: 'StockMovement', id: 'LIST' },
      ],
    }),

    // PUT /api/items/{id}/stock - Aggiorna giacenza
    updateStock: builder.mutation<
      ApiResponse<any>,
      { id: number; quantity: number; reason?: string; userName: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/items/${id}/stock`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Item', id },
        { type: 'Product', id: 'LIST' },
      ],
    }),

    // POST /api/items/{id}/update-after-pick - Aggiorna dopo prelievo
    updateAfterPick: builder.mutation<
      ApiResponse<any>,
      { id: number; quantity: number; compartmentId?: number }
    >({
      query: ({ id, ...body }) => ({
        url: `/items/${id}/update-after-pick`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Item', id }],
    }),

    // POST /api/items/{id}/update-after-fill - Aggiorna dopo riempimento
    updateAfterFill: builder.mutation<
      ApiResponse<any>,
      { id: number; quantity: number; compartmentId: number }
    >({
      query: ({ id, ...body }) => ({
        url: `/items/${id}/update-after-fill`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Item', id }],
    }),

    // PUT /api/items/{id}/average-weight - Aggiorna peso medio
    updateAverageWeight: builder.mutation<ApiResponse<any>, { id: number; weight: number }>({
      query: ({ id, weight }) => ({
        url: `/items/${id}/average-weight`,
        method: 'PUT',
        body: { weight },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Item', id }],
    }),

    // POST /api/items/{id}/print-label - Stampa etichetta articolo
    printItemLabel: builder.mutation<
      ApiResponse<any>,
      { id: number; printerId?: number; copies?: number }
    >({
      query: ({ id, ...body }) => ({
        url: `/items/${id}/print-label`,
        method: 'POST',
        body,
      }),
    }),

    // POST /api/items/{id}/print-weight-label - Stampa etichetta peso
    printWeightLabel: builder.mutation<
      ApiResponse<any>,
      { id: number; weight: number; printerId?: number }
    >({
      query: ({ id, ...body }) => ({
        url: `/items/${id}/print-weight-label`,
        method: 'POST',
        body,
      }),
    }),

    // POST /api/items/{id}/send-to-machine - Invia prodotto a macchina
    sendProductToMachine: builder.mutation<
      ApiResponse<any>,
      { id: number; machineId: number; quantity: number }
    >({
      query: ({ id, ...body }) => ({
        url: `/items/${id}/send-to-machine`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Machine', id: 'LIST' }],
    }),

    // GET /api/items/{id}/fill-products-percent - Percentuale riempimento prodotti
    getFillProductsPercent: builder.query<{ percent: number }, number>({
      query: (id) => `/items/${id}/fill-products-percent`,
    }),

    // GET /api/items/{id}/is-handled-by-lot - Gestito a lotto?
    isHandledByLot: builder.query<boolean, number>({
      query: (id) => `/items/${id}/is-handled-by-lot`,
    }),

    // GET /api/items/{id}/is-handled-by-serial-number - Gestito a matricola?
    isHandledBySerialNumber: builder.query<boolean, number>({
      query: (id) => `/items/${id}/is-handled-by-serial-number`,
    }),

    // GET /api/items/{id}/is-handled-by-expire-date - Gestito con scadenza?
    isHandledByExpireDate: builder.query<boolean, number>({
      query: (id) => `/items/${id}/is-handled-by-expire-date`,
    }),

    // GET /api/items/{id}/is-drapery-exist - È telo?
    isDraperyExist: builder.query<boolean, number>({
      query: (id) => `/items/${id}/is-drapery-exist`,
    }),

    // POST /api/items/{id}/signal-defect - Segnala difetto
    signalDefect: builder.mutation<
      ApiResponse<any>,
      { id: number; defectDescription: string; quantity?: number }
    >({
      query: ({ id, ...body }) => ({
        url: `/items/${id}/signal-defect`,
        method: 'POST',
        body,
      }),
    }),

    // POST /api/items - Crea nuovo articolo
    createItem: builder.mutation<ApiResponse<Item>, Partial<Item>>({
      query: (body) => ({
        url: '/api/items',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Item', id: 'LIST' }],
    }),

    // PUT /api/items/{id} - Aggiorna articolo
    updateItem: builder.mutation<ApiResponse<Item>, { id: number; data: Partial<Item> }>({
      query: ({ id, data }) => ({
        url: `/items/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Item', id },
        { type: 'Item', id: 'LIST' },
      ],
    }),

    // DELETE /api/items/{id} - Elimina articolo
    deleteItem: builder.mutation<ApiResponse<void>, number>({
      query: (id) => ({
        url: `/items/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Item', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetItemsQuery,
  useGetItemByIdQuery,
  useGetItemByBarcodeQuery,
  useLazyGetItemByBarcodeQuery,
  usePickItemMutation,
  usePutItemMutation,
  useUpdateStockMutation,
  useUpdateAfterPickMutation,
  useUpdateAfterFillMutation,
  useUpdateAverageWeightMutation,
  usePrintItemLabelMutation,
  usePrintWeightLabelMutation,
  useSendProductToMachineMutation,
  useGetFillProductsPercentQuery,
  useIsHandledByLotQuery,
  useIsHandledBySerialNumberQuery,
  useIsHandledByExpireDateQuery,
  useIsDraperyExistQuery,
  useSignalDefectMutation,
  useCreateItemMutation,
  useUpdateItemMutation,
  useDeleteItemMutation,
} = itemsApi;
