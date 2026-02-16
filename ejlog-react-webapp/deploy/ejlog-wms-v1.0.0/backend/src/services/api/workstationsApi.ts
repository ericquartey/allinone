// ============================================================================
// EJLOG WMS - Workstations API Service
// RTK Query API per gestione postazioni di lavoro (Workstations)
// Backend: /EjLogHostVertimag/Workstations su porta 3077
// ============================================================================

import { baseApi } from './baseApi';

/**
 * Workstation type definition
 */
export interface Workstation {
  id: number;
  description: string;
  ipAddress?: string;
  workstationType?: string;
  connectedUserId?: number;
  connectedUserName?: string;
  lastConnectionDate?: string;
  softwareVersion?: string;
  locationId?: number;
  areaIds?: string;
  zoneIds?: string;
  roles?: string;
}

/**
 * Workstation filters for query parameters
 */
export interface WorkstationFilters {
  ipAddress?: string;
  connectedUserId?: number;
}

/**
 * API for Workstation CRUD operations
 */
export const workstationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ========================================================================
    // GET /EjLogHostVertimag/Workstations - Get all workstations with filters
    // ========================================================================
    getWorkstations: builder.query<Workstation[], WorkstationFilters | void>({
      query: (filters) => ({
        url: '/EjLogHostVertimag/Workstations',
        params: filters || {},
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Workstation' as const, id })),
              { type: 'Workstation', id: 'LIST' },
            ]
          : [{ type: 'Workstation', id: 'LIST' }],
    }),

    // ========================================================================
    // GET /EjLogHostVertimag/Workstations/{id} - Get workstation by ID
    // ========================================================================
    getWorkstationById: builder.query<Workstation, number>({
      query: (id) => `/EjLogHostVertimag/Workstations/${id}`,
      providesTags: (result, error, id) => [{ type: 'Workstation', id }],
    }),

    // ========================================================================
    // POST /EjLogHostVertimag/Workstations - Create new workstation
    // ========================================================================
    createWorkstation: builder.mutation<Workstation, Partial<Workstation>>({
      query: (body) => ({
        url: '/EjLogHostVertimag/Workstations',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Workstation', id: 'LIST' }],
    }),

    // ========================================================================
    // PUT /EjLogHostVertimag/Workstations/{id} - Update workstation
    // ========================================================================
    updateWorkstation: builder.mutation<
      Workstation,
      { id: number; data: Partial<Workstation> }
    >({
      query: ({ id, data }) => ({
        url: `/EjLogHostVertimag/Workstations/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Workstation', id },
        { type: 'Workstation', id: 'LIST' },
      ],
    }),

    // ========================================================================
    // DELETE /EjLogHostVertimag/Workstations/{id} - Delete workstation
    // ========================================================================
    deleteWorkstation: builder.mutation<void, number>({
      query: (id) => ({
        url: `/EjLogHostVertimag/Workstations/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Workstation', id: 'LIST' }],
    }),
  }),
});

// Export hooks for use in components
export const {
  useGetWorkstationsQuery,
  useGetWorkstationByIdQuery,
  useCreateWorkstationMutation,
  useUpdateWorkstationMutation,
  useDeleteWorkstationMutation,
} = workstationsApi;

