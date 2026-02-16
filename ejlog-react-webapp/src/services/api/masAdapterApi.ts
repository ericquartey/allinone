import { baseApi } from './baseApi';
import { MAS_DOTNET_API_BASE_URL } from '../../config/api';
import type { MissionOperation, ApiResponse } from '../../types/models';
import type { Mission, MissionDetails } from '../../types/masAdapter';

const MAS_BASE = MAS_DOTNET_API_BASE_URL.replace(/\/$/, '');

const masUrl = (path: string) => {
  if (!path) return MAS_BASE;
  return `${MAS_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
};

export const masAdapterApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // =======================
    // Missions
    // =======================
    getMissions: builder.query<Mission[], Record<string, any> | void>({
      query: (params) => ({
        url: masUrl('/missions'),
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Mission' as const, id })),
              { type: 'Mission', id: 'LIST' },
            ]
          : [{ type: 'Mission', id: 'LIST' }],
    }),

    getMissionById: builder.query<Mission, number>({
      query: (id) => masUrl(`/missions/${id}`),
      providesTags: (result, error, id) => [{ type: 'Mission', id }],
    }),

    getMissionDetailsById: builder.query<MissionDetails, number>({
      query: (id) => masUrl(`/missions/${id}/details`),
      providesTags: (result, error, id) => [{ type: 'Mission', id }],
    }),

    countMission: builder.query<number, { id: number; bay: number }>({
      query: (params) => ({
        url: masUrl('/missions/count-mission'),
        params,
      }),
    }),

    countUdcToMove: builder.query<number, { id: number; bay: number }>({
      query: (params) => ({
        url: masUrl('/missions/count-udc-tomove'),
        params,
      }),
    }),

    setMaxMissionBay: builder.mutation<ApiResponse<void>, number>({
      query: (value) => ({
        url: masUrl('/missions/set-max-mission-bay'),
        method: 'POST',
        params: { value },
      }),
      invalidatesTags: [{ type: 'Mission', id: 'LIST' }],
    }),

    // =======================
    // Mission Operations
    // =======================
    getMissionOperations: builder.query<MissionOperation[], Record<string, any> | void>({
      query: (params) => ({
        url: masUrl('/mission-operations'),
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'MissionOperation' as const, id })),
              { type: 'MissionOperation', id: 'LIST' },
            ]
          : [{ type: 'MissionOperation', id: 'LIST' }],
    }),

    getMissionOperationById: builder.query<MissionOperation, number>({
      query: (id) => masUrl(`/mission-operations/${id}`),
      providesTags: (result, error, id) => [{ type: 'MissionOperation', id }],
    }),

    getMissionOperationAggregate: builder.query<MissionOperation, number>({
      query: (id) => masUrl(`/mission-operations/${id}/aggregate`),
      providesTags: (result, error, id) => [{ type: 'MissionOperation', id }],
    }),

    executeMissionOperation: builder.mutation<ApiResponse<void>, { id: number; userName?: string }>({
      query: ({ id, ...body }) => ({
        url: masUrl(`/mission-operations/${id}/execute`),
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'MissionOperation', id },
        { type: 'MissionOperation', id: 'LIST' },
      ],
    }),

    completeMissionOperation: builder.mutation<ApiResponse<void>, { id: number; payload: Record<string, any> }>({
      query: ({ id, payload }) => ({
        url: masUrl(`/mission-operations/${id}/complete`),
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'MissionOperation', id },
        { type: 'MissionOperation', id: 'LIST' },
      ],
    }),

    suspendMissionOperation: builder.mutation<ApiResponse<void>, { id: number; userName?: string }>({
      query: ({ id, ...body }) => ({
        url: masUrl(`/mission-operations/${id}/suspend`),
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'MissionOperation', id },
        { type: 'MissionOperation', id: 'LIST' },
      ],
    }),

    sendIdOperation: builder.mutation<ApiResponse<void>, { id: number }>({
      query: ({ id }) => ({
        url: masUrl(`/mission-operations/${id}/send-id-operation`),
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'MissionOperation', id: 'LIST' }],
    }),

    getOperationByParams: builder.query<MissionOperation, { idUdc: number; destinationGroup: number; idMission: number }>(
      {
        query: (params) => ({
          url: masUrl('/mission-operations/get-operation'),
          params,
        }),
        providesTags: (result) => (result ? [{ type: 'MissionOperation', id: result.id }] : []),
      }
    ),

    getOperationReasonsByType: builder.mutation<ApiResponse<any>, { type: number }>({
      query: ({ type }) => ({
        url: masUrl(`/mission-operations/${type}/reasons`),
        method: 'POST',
      }),
    }),

    getOperationOrders: builder.mutation<ApiResponse<any>, void>({
      query: () => ({
        url: masUrl('/mission-operations/orders'),
        method: 'POST',
      }),
    }),

    getOperationExtraCombo: builder.query<ApiResponse<any>, { type: number }>({
      query: (params) => ({
        url: masUrl('/mission-operations/extraCombo'),
        params,
      }),
    }),

    abortMissionOperation: builder.mutation<ApiResponse<void>, { id: number }>({
      query: ({ id }) => ({
        url: masUrl(`/mission-operations/${id}/abort`),
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'MissionOperation', id: 'LIST' }],
    }),

    partialCompleteMissionOperation: builder.mutation<ApiResponse<void>, { id: number; payload: Record<string, any> }>({
      query: ({ id, payload }) => ({
        url: masUrl(`/mission-operations/${id}/partial-complete`),
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: [{ type: 'MissionOperation', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetMissionsQuery,
  useGetMissionByIdQuery,
  useGetMissionDetailsByIdQuery,
  useCountMissionQuery,
  useCountUdcToMoveQuery,
  useSetMaxMissionBayMutation,
  useGetMissionOperationsQuery,
  useGetMissionOperationByIdQuery,
  useGetMissionOperationAggregateQuery,
  useExecuteMissionOperationMutation,
  useCompleteMissionOperationMutation,
  useSuspendMissionOperationMutation,
  useSendIdOperationMutation,
  useGetOperationByParamsQuery,
  useGetOperationReasonsByTypeMutation,
  useGetOperationOrdersMutation,
  useGetOperationExtraComboQuery,
  useAbortMissionOperationMutation,
  usePartialCompleteMissionOperationMutation,
} = masAdapterApi;
