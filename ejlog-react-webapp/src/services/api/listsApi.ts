// ============================================================================
// EJLOG WMS - Lists API Service
// Tutti gli endpoint per la gestione liste
// ============================================================================

import { baseApi } from './baseApi';
import type {
  ItemList,
  ItemListRow,
  ListFilters,
  PaginatedResponse,
  ApiResponse,
  ExecuteListRequest,
  ItemListStatus,
} from '../../types/models';

const statusStringFromId = (id: number | undefined, fallback: string) => {
  switch (id) {
    case 1:
      return 'waiting';
    case 2:
      return 'active';
    case 3:
      return 'completed';
    default:
      return fallback;
  }
};

/**
 * Mappa l'ID dello stato dal backend (StatoListaEnum.java) all'enum frontend
 *
 * Backend mapping (StatoListaEnum.java):
 * - IMPORTATA(0)
 * - IN_ATTESA(1)
 * - IN_ESECUZIONE(2)  ← CORRETTO!
 * - TERMINATA(3)
 */
const statusEnumFromId = (id: number | undefined, fallback: ItemListStatus) => {
  switch (id) {
    case 0:
      return ItemListStatus.IMPORTATA;
    case 1:
      return ItemListStatus.IN_ATTESA;      // ✅ CORRETTO (era DA_EVADERE)
    case 2:
      return ItemListStatus.IN_ESECUZIONE;  // ✅ CORRETTO (ora allineato)
    case 3:
      return ItemListStatus.TERMINATA;      // ✅ CORRETTO (era COMPLETATA)
    default:
      return fallback;
  }
};

export const listsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/item-lists - Ricerca liste con filtri (DATI REALI)
    getLists: builder.query<PaginatedResponse<ItemList>, ListFilters>({
      query: (filters = {}) => ({
        url: '/api/item-lists',
        params: {
          limit: filters.limit || 100,
          offset: filters.offset || 0,
          search: filters.search,
          tipoLista: filters.tipoLista,
          terminata: filters.terminata,
          esportata: filters.esportata,
        },
      }),
      transformResponse: (response: any) => {
        // Trasforma la risposta per adattarla al formato atteso dal frontend
        return {
          data: response.data.map((list: any) => ({
            id: list.id,
            code: list.listNumber || list.id.toString(),
            description: list.listReference || '',
            type: list.listType,
            priority: 1,
            // PRIORITÀ: completed field > listStatusId > altri campi
            status: list.completed
              ? 'completed'
              : list.unfulfillable
                ? 'unfulfillable'
                : statusStringFromId(
                    list.listStatusId,
                    (list.startedAt || list.launchedAt)
                      ? 'active'
                      : 'waiting'
                  ),
            createdAt: list.createdAt,
            totalRows: list.totalRows,
            completedRows: list.completedRows,
            startedRows: list.startedRows,
            unfulfillableRows: list.unfulfillableRows,
          })),
          pagination: response.pagination,
        };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'ItemList' as const, id })),
              { type: 'ItemList', id: 'LIST' },
            ]
          : [{ type: 'ItemList', id: 'LIST' }],
    }),

    // GET /api/item-lists/{id} - Dettaglio lista per ID
    getListById: builder.query<ItemList, number>({
      query: (id) => `/api/item-lists/${id}`,
      transformResponse: (response: any) => {
        const data = response?.data || response;
        const fallbackStatus =
          data.completed
            ? ItemListStatus.TERMINATA      // ✅ Aggiornato da COMPLETATA
            : data.unfulfillable
              ? ItemListStatus.INEVADIBILE
              : (data.startedAt || data.launchedAt)
                ? ItemListStatus.IN_ESECUZIONE
                : ItemListStatus.IN_ATTESA;  // ✅ Aggiornato da DA_EVADERE
        const status = statusEnumFromId(data.listStatusId, fallbackStatus);
        return {
          id: data.id,
          code: data.listNumber || String(data.id),
          description: data.listReference || '',
          itemListType: data.listType,
          type: data.listType,
          priority: data.priority ?? 1,
          status,
          isDispatchable:
            status === ItemListStatus.IN_ATTESA || status === ItemListStatus.IN_ESECUZIONE,  // ✅ Aggiornato da DA_EVADERE
          totalRows: data.totalRows,
          completedRows: data.completedRows,
          startedRows: data.startedRows,
          unfulfillableRows: data.unfulfillableRows,
          createdAt: data.createdAt,
        } as ItemList;
      },
      providesTags: (result, error, id) => [{ type: 'ItemList', id }],
    }),

    // GET /api/item-lists/{id}/num - Lista per numero
    getListByNumber: builder.query<ItemList, string>({
      query: (code) => `/api/item-lists/${encodeURIComponent(code)}/num`,
      transformResponse: (response: any) => {
        const data = response?.data || response;
        const fallback =
          data.completed
            ? 'completed'
            : data.unfulfillable
              ? 'unfulfillable'
              : (data.startedAt || data.launchedAt)
                ? 'active'
                : 'waiting';
        const status = statusStringFromId(data.listStatusId, fallback);
        return {
          id: data.id,
          code: data.listNumber || String(data.id),
          description: data.listReference || '',
          itemListType: data.listType,
          type: data.listType,
          priority: data.priority ?? 1,
          status,
          isDispatchable: status === 'waiting' || status === 'active',
          totalRows: data.totalRows,
          completedRows: data.completedRows,
          startedRows: data.startedRows,
          unfulfillableRows: data.unfulfillableRows,
          createdAt: data.createdAt,
        } as ItemList;
      },
      providesTags: (result) => (result ? [{ type: 'ItemList', id: result.id }] : []),
    }),

    // GET /api/item-lists/{id}/items - Righe lista (DATI REALI)
    getListRows: builder.query<PaginatedResponse<ItemListRow>, { id: number; limit?: number; offset?: number }>({
      query: ({ id, limit = 100, offset = 0 }) => ({
        url: `/api/item-lists/${id}/items`,
        params: { limit, offset },
      }),
      transformResponse: (response: any) => {
        return {
          data: response.data.map((row: any) => ({
            id: row.id,
            rowNumber: row.rowNumber,
            itemCode: row.itemCode,
            description: row.articleDescription || row.description,
            barcode: row.barcode,
            requestedQuantity: row.requestedQuantity,
            movedQuantity: row.movedQuantity,
            reservedQuantity: row.reservedQuantity,
            lot: row.lot,
            serialNumber: row.serialNumber,
            completed: row.completed,
            unfulfillable: row.unfulfillable,
          })),
          pagination: response.pagination,
        };
      },
      providesTags: (result, error, { id }) => [{ type: 'ItemList', id }],
    }),

    // PUT /api/lists/{id}/execute - Esegui lista (CORRETTO per backend reale)
    executeList: builder.mutation<void, ExecuteListRequest>({
      query: ({ id, ...params }) => ({
        url: `/api/lists/${id}/execute`,
        method: 'PUT',
        params,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'ItemList', id },
        { type: 'ItemList', id: 'LIST' },
        { type: 'MissionOperation', id: 'LIST' },
      ],
    }),

    // POST /api/item-lists/execute-num - Esegui lista per numero
    executeListByNumber: builder.mutation<
      void,
      { numList: string; areaId?: number; destinationGroupId?: number; userName?: string }
    >({
      query: (params) => ({
        url: '/api/item-lists/execute-num',
        method: 'POST',
        params,
      }),
      invalidatesTags: [
        { type: 'ItemList', id: 'LIST' },
        { type: 'MissionOperation', id: 'LIST' },
      ],
    }),

    // POST /api/item-lists/{id}/suspend - Sospendi lista
    suspendList: builder.mutation<void, { id: number; userName?: string }>({
      query: ({ id, ...params }) => ({
        url: `/api/item-lists/${id}/suspend`,
        method: 'POST',
        params,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'ItemList', id },
        { type: 'ItemList', id: 'LIST' },
      ],
    }),

    // POST /api/lists/{id}/terminate - Termina lista (CORRETTO per backend reale)
    terminateList: builder.mutation<void, number>({
      query: (id) => ({
        url: `/api/lists/${id}/terminate`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'ItemList', id },
        { type: 'ItemList', id: 'LIST' },
      ],
    }),

    // POST /api/item-lists/{id}/reserve - Prenota lista per operatore
    reserveList: builder.mutation<void, { id: string; operatorId: string; notes?: string }>({
      query: ({ id, operatorId, notes }) => ({
        url: `/api/item-lists/${id}/reserve`,
        method: 'POST',
        body: { operatorId, notes },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'ItemList', id },
        { type: 'ItemList', id: 'LIST' },
      ],
    }),

    // POST /api/item-lists/{id}/rereserve - Riassegna lista ad altro operatore
    rereserveList: builder.mutation<void, {
      id: string;
      previousOperatorId: string;
      newOperatorId: string;
      reason?: string;
      notes?: string;
    }>({
      query: ({ id, previousOperatorId, newOperatorId, reason, notes }) => ({
        url: `/api/item-lists/${id}/rereserve`,
        method: 'POST',
        body: { previousOperatorId, newOperatorId, reason, notes },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'ItemList', id },
        { type: 'ItemList', id: 'LIST' },
      ],
    }),

    // POST /api/item-lists/{id}/waiting - Metti lista in attesa
    setListWaiting: builder.mutation<void, {
      id: string;
      reason: string;
      notes?: string;
      estimatedWaitTimeMinutes?: number;
    }>({
      query: ({ id, reason, notes, estimatedWaitTimeMinutes }) => ({
        url: `/api/item-lists/${id}/waiting`,
        method: 'POST',
        body: { reason, notes, estimatedWaitTimeMinutes },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'ItemList', id },
        { type: 'ItemList', id: 'LIST' },
      ],
    }),

    // POST /api/item-lists - Crea nuova lista
    createList: builder.mutation<ItemList, Partial<ItemList> & { tipoLista: number; areaId: number }>({
      query: (params) => ({
        url: '/api/item-lists',
        method: 'POST',
        body: params, // Backend expects body payload
      }),
      // Normalize backend response { success, data: {...} } to ItemList shape used by the UI
      transformResponse: (response: any) => {
        const data = response?.data || response;
        return {
          id: data.id,
          code: data.listNumber || String(data.id),
          description: data.listReference || '',
          type: data.listType ?? data.tipoLista ?? 0,
          priority: 1,
          status: 'waiting',
          createdAt: new Date().toISOString(),
          totalRows: 0,
          completedRows: 0,
          startedRows: 0,
          unfulfillableRows: 0,
        } as ItemList;
      },
      invalidatesTags: [{ type: 'ItemList', id: 'LIST' }],
    }),

    // PUT /api/item-lists/{id} - Aggiorna lista
    updateList: builder.mutation<
      ItemList,
      { id: number } & Partial<ItemList>
    >({
      query: ({ id, ...params }) => ({
        url: `/api/item-lists/${id}`,
        method: 'PUT',
        body: params,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'ItemList', id },
        { type: 'ItemList', id: 'LIST' },
      ],
    }),

    // DELETE /api/item-lists/{id} - Elimina lista
    deleteList: builder.mutation<void, number>({
      query: (id) => ({
        url: `/api/item-lists/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'ItemList', id: 'LIST' }],
    }),

    // POST /api/item-lists/{id}/rows - Aggiungi riga a lista (placeholder - da implementare backend)
    addListRow: builder.mutation<
      ItemListRow,
      { listId: number; row: Partial<ItemListRow> }
    >({
      query: ({ listId, row }) => ({
        url: `/api/item-lists/${listId}/rows`,
        method: 'POST',
        body: row,
      }),
      invalidatesTags: (result, error, { listId }) => [{ type: 'ItemList', id: listId }],
    }),

    // PUT /api/item-lists/{id}/rows/{rowId} - Aggiorna riga lista (placeholder - da implementare backend)
    updateListRow: builder.mutation<
      ItemListRow,
      { listId: number; rowId: number; data: Partial<ItemListRow> }
    >({
      query: ({ listId, rowId, data }) => ({
        url: `/api/item-lists/${listId}/rows/${rowId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { listId }) => [{ type: 'ItemList', id: listId }],
    }),

    // DELETE /api/item-lists/{id}/rows/{rowId} - Elimina riga lista (placeholder - da implementare backend)
    deleteListRow: builder.mutation<void, { listId: number; rowId: number }>({
      query: ({ listId, rowId }) => ({
        url: `/api/item-lists/${listId}/rows/${rowId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { listId }) => [{ type: 'ItemList', id: listId }],
    }),

    // GET /api/item-lists/next-number/:type - Ottieni prossimo numero lista sequenziale
    getNextListNumber: builder.query<
      { nextId: number; nextNumber: string; prefix: string },
      number
    >({
      query: (type) => `/api/item-lists/next-number/${type}`,
      transformResponse: (response: any) => response.data,
    }),
  }),
});

export const {
  useGetListsQuery,
  useGetListByIdQuery,
  useGetListByNumberQuery,
  useLazyGetListByNumberQuery,
  useGetListRowsQuery,
  useLazyGetListRowsQuery,
  useExecuteListMutation,
  useExecuteListByNumberMutation,
  useSuspendListMutation,
  useTerminateListMutation,
  useReserveListMutation,
  useRereserveListMutation,
  useSetListWaitingMutation,
  useCreateListMutation,
  useUpdateListMutation,
  useDeleteListMutation,
  useAddListRowMutation,
  useUpdateListRowMutation,
  useDeleteListRowMutation,
  useGetNextListNumberQuery,
} = listsApi;
