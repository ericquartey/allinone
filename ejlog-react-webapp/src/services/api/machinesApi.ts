// ============================================================================
// EJLOG WMS - Machines API Service
// Endpoint per la gestione macchine e baie
// ============================================================================

import { baseApi } from './baseApi';
import type {
  MachineInfo,
  Area,
  DestinationGroup,
  LoadingUnit,
  MissionOperation,
  Alarm,
  ApiResponse,
} from '../../types/models';

export const machinesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/machines/{id}/area - Area della macchina
    getMachineArea: builder.query<Area, number>({
      query: (machineId) => `/machines/${machineId}/area`,
      providesTags: (result, error, machineId) => [{ type: 'Machine', id: machineId }],
    }),

    // GET /api/machines/{id}/destination-groups - Gruppi destinazione macchina
    getMachineDestinationGroups: builder.query<DestinationGroup[], number>({
      query: (machineId) => `/machines/${machineId}/destination-groups`,
      providesTags: (result, error, machineId) => [
        { type: 'Machine', id: machineId },
        { type: 'DestinationGroup', id: 'LIST' },
      ],
    }),

    // GET /api/machines/{id}/bay/{bayNumber}/destination-groups - Gruppi destinazione baia
    getBayDestinationGroups: builder.query<
      DestinationGroup[],
      { machineId: number; bayNumber: number }
    >({
      query: ({ machineId, bayNumber }) =>
        `/machines/${machineId}/bay/${bayNumber}/destination-groups`,
      providesTags: [{ type: 'DestinationGroup', id: 'LIST' }],
    }),

    // GET /api/machines/{id}/loading-units - UDC in macchina
    getMachineLoadingUnits: builder.query<LoadingUnit[], number>({
      query: (machineId) => `/machines/${machineId}/loading-units`,
      providesTags: (result, error, machineId) => [
        { type: 'Machine', id: machineId },
        { type: 'LoadingUnit', id: 'LIST' },
      ],
    }),

    // GET /api/machines/{id}/mission-operations - Operazioni missione macchina
    getMachineMissionOperations: builder.query<MissionOperation[], number>({
      query: (machineId) => `/machines/${machineId}/mission-operations`,
      providesTags: (result, error, machineId) => [
        { type: 'Machine', id: machineId },
        { type: 'MissionOperation', id: 'LIST' },
      ],
    }),

    // POST /api/machines/{id}/alarms - Invia allarmi
    postAlarms: builder.mutation<ApiResponse<any>, { machineId: number; alarms: Partial<Alarm>[] }>({
      query: ({ machineId, alarms }) => ({
        url: `/machines/${machineId}/alarms`,
        method: 'POST',
        body: alarms,
      }),
      invalidatesTags: (result, error, { machineId }) => [
        { type: 'Machine', id: machineId },
        { type: 'Alarm', id: 'LIST' },
      ],
    }),

    // POST /api/machines/{id}/states - Invia stati
    postStates: builder.mutation<ApiResponse<any>, { machineId: number; states: any[] }>({
      query: ({ machineId, states }) => ({
        url: `/machines/${machineId}/states`,
        method: 'POST',
        body: states,
      }),
      invalidatesTags: (result, error, { machineId }) => [{ type: 'Machine', id: machineId }],
    }),

    // GET /api/machines - Lista macchine
    getMachines: builder.query<MachineInfo[], void>({
      query: () => '/api/machines',
      transformResponse: (response: { success: boolean; data: any[] }) =>
        response.data.map((machine: any) => ({
          id: machine.id,
          description: machine.description,
          active: machine.active,
        })),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Machine' as const, id })),
              { type: 'Machine', id: 'LIST' },
            ]
          : [{ type: 'Machine', id: 'LIST' }],
    }),

    // GET /api/machines/{id} - Dettaglio macchina
    getMachineById: builder.query<MachineInfo, number>({
      query: (id) => `/machines/${id}`,
      providesTags: (result, error, id) => [{ type: 'Machine', id }],
    }),

    // POST /api/machines - Crea macchina
    createMachine: builder.mutation<ApiResponse<MachineInfo>, Partial<MachineInfo>>({
      query: (body) => ({
        url: '/machines',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Machine', id: 'LIST' }],
    }),

    // PUT /api/machines/{id} - Aggiorna macchina
    updateMachine: builder.mutation<
      ApiResponse<MachineInfo>,
      { id: number; data: Partial<MachineInfo> }
    >({
      query: ({ id, data }) => ({
        url: `/machines/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Machine', id },
        { type: 'Machine', id: 'LIST' },
      ],
    }),

    // DELETE /api/machines/{id} - Elimina macchina
    deleteMachine: builder.mutation<ApiResponse<void>, number>({
      query: (id) => ({
        url: `/machines/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Machine', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetMachineAreaQuery,
  useGetMachineDestinationGroupsQuery,
  useGetBayDestinationGroupsQuery,
  useGetMachineLoadingUnitsQuery,
  useGetMachineMissionOperationsQuery,
  usePostAlarmsMutation,
  usePostStatesMutation,
  useGetMachinesQuery,
  useGetMachineByIdQuery,
  useCreateMachineMutation,
  useUpdateMachineMutation,
  useDeleteMachineMutation,
} = machinesApi;
