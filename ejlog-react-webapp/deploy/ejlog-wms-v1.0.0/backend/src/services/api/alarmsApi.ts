// ============================================================================
// EJLOG WMS - Alarms API Service
// Endpoint per la gestione allarmi
// ============================================================================

import { baseApi } from './baseApi';
import type { Alarm, AlarmDefinition, AlarmFilters, PaginatedResponse, ApiResponse } from '../../types/models';

export const alarmsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/alarms - Lista allarmi con filtri
    getAlarms: builder.query<PaginatedResponse<Alarm>, AlarmFilters>({
      query: (filters) => ({
        url: '/alarms',
        params: filters,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Alarm' as const, id })),
              { type: 'Alarm', id: 'LIST' },
            ]
          : [{ type: 'Alarm', id: 'LIST' }],
    }),

    // GET /api/alarms/{id} - Dettaglio allarme
    getAlarmById: builder.query<Alarm, number>({
      query: (id) => `/alarms/${id}`,
      providesTags: (result, error, id) => [{ type: 'Alarm', id }],
    }),

    // GET /api/alarms/active - Allarmi attivi
    getActiveAlarms: builder.query<Alarm[], { machineId?: number }>({
      query: (params) => ({
        url: '/alarms/active',
        params,
      }),
      providesTags: [{ type: 'Alarm', id: 'LIST' }],
    }),

    // POST /api/alarms/{id}/acknowledge - Riconosci allarme
    acknowledgeAlarm: builder.mutation<ApiResponse<void>, { id: number; userName: string; notes?: string }>({
      query: ({ id, ...body }) => ({
        url: `/alarms/${id}/acknowledge`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Alarm', id },
        { type: 'Alarm', id: 'LIST' },
      ],
    }),

    // POST /api/alarms/{id}/resolve - Risolvi allarme
    resolveAlarm: builder.mutation<ApiResponse<void>, { id: number; userName: string; notes?: string }>({
      query: ({ id, ...body }) => ({
        url: `/alarms/${id}/resolve`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Alarm', id },
        { type: 'Alarm', id: 'LIST' },
      ],
    }),

    // GET /api/alarms/definitions - Definizioni allarmi
    getAlarmDefinitions: builder.query<AlarmDefinition[], void>({
      query: () => '/alarms/definitions',
    }),

    // GET /api/alarms/stats - Statistiche allarmi
    getAlarmStats: builder.query<
      {
        totalActive: number;
        bySeverity: Record<string, number>;
        byMachine: Record<string, number>;
      },
      void
    >({
      query: () => '/alarms/stats',
    }),
  }),
});

export const {
  useGetAlarmsQuery,
  useGetAlarmByIdQuery,
  useGetActiveAlarmsQuery,
  useAcknowledgeAlarmMutation,
  useResolveAlarmMutation,
  useGetAlarmDefinitionsQuery,
  useGetAlarmStatsQuery,
} = alarmsApi;
