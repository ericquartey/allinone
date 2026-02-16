// ============================================================================
// EJLOG WMS - Reservations API Service
// Gestione prenotazioni (operazioni di picking/refilling/inventory)
// ============================================================================

import { baseApi } from './baseApi';
import type {
  Reservation,
  ReservationFilters,
  ConfirmReservationRequest,
} from '../../types/reservations';
import type {
  PaginatedResponse,
  ApiResponse,
} from '../../types/models';

export const reservationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/reservations - Lista prenotazioni con filtri
    getReservations: builder.query<PaginatedResponse<Reservation>, ReservationFilters>({
      query: (filters) => ({
        url: '/reservations',
        params: filters,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Reservation' as const, id })),
              { type: 'Reservation', id: 'LIST' },
            ]
          : [{ type: 'Reservation', id: 'LIST' }],
    }),

    // GET /api/reservations/{id} - Dettaglio prenotazione per ID
    getReservationById: builder.query<Reservation, number>({
      query: (id) => `/reservations/${id}`,
      providesTags: (result, error, id) => [{ type: 'Reservation', id }],
    }),

    // GET /api/lists/{listId}/reservations - Prenotazioni per lista
    getReservationsByList: builder.query<Reservation[], number>({
      query: (listId) => `/lists/${listId}/reservations`,
      providesTags: (result, error, listId) => [
        { type: 'Reservation', id: `LIST_${listId}` },
      ],
    }),

    // POST /api/reservations/{id}/confirm - Conferma prenotazione
    confirmReservation: builder.mutation<
      ApiResponse<Reservation>,
      { id: number; data: ConfirmReservationRequest }
    >({
      query: ({ id, data }) => ({
        url: `/reservations/${id}/confirm`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Reservation', id },
        { type: 'Reservation', id: 'LIST' },
        { type: 'ItemList', id: 'LIST' },
        { type: 'Stock', id: 'LIST' },
      ],
    }),

    // POST /api/reservations/{id}/skip - Salta prenotazione
    skipReservation: builder.mutation<
      ApiResponse<Reservation>,
      { id: number; reason?: string }
    >({
      query: ({ id, reason }) => ({
        url: `/reservations/${id}/skip`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Reservation', id },
        { type: 'Reservation', id: 'LIST' },
      ],
    }),

    // POST /api/reservations/{id}/validate-barcode - Valida barcode UDC/Prodotto
    validateBarcode: builder.mutation<
      ApiResponse<{ valid: boolean; message?: string }>,
      { id: number; barcode: string; type: 'UDC' | 'PRODUCT' }
    >({
      query: ({ id, barcode, type }) => ({
        url: `/reservations/${id}/validate-barcode`,
        method: 'POST',
        body: { barcode, type },
      }),
    }),
  }),
});

export const {
  useGetReservationsQuery,
  useGetReservationByIdQuery,
  useGetReservationsByListQuery,
  useLazyGetReservationsByListQuery,
  useConfirmReservationMutation,
  useSkipReservationMutation,
  useValidateBarcodeMutation,
} = reservationsApi;
