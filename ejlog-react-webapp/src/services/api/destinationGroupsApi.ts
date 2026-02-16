// ============================================================================
// EJLOG WMS - Destination Groups API Service
// Endpoint per la gestione gruppi di destinazione
// ============================================================================

import { baseApi } from './baseApi';

export interface DestinationGroup {
  id: number;
  description: string;
  active: boolean;
}

export const destinationGroupsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/destination-groups - Lista gruppi di destinazione
    getDestinationGroups: builder.query<DestinationGroup[], void>({
      query: () => '/api/destination-groups',
      transformResponse: (response: { success: boolean; data: DestinationGroup[] }) =>
        response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'DestinationGroup' as const, id })),
              { type: 'DestinationGroup', id: 'LIST' },
            ]
          : [{ type: 'DestinationGroup', id: 'LIST' }],
    }),

    // GET /api/destination-groups/:id - Dettaglio gruppo
    getDestinationGroupById: builder.query<DestinationGroup, number>({
      query: (id) => `/api/destination-groups/${id}`,
      transformResponse: (response: { success: boolean; data: DestinationGroup }) =>
        response.data,
      providesTags: (result, error, id) => [{ type: 'DestinationGroup', id }],
    }),
  }),
});

export const {
  useGetDestinationGroupsQuery,
  useGetDestinationGroupByIdQuery,
} = destinationGroupsApi;
