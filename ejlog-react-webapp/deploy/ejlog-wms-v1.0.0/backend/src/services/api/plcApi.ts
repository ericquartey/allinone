/**
 * PLC Controller API - RTK Query
 *
 * API endpoints for PLC device management, commands, signals, and databuffer
 */

import { baseApi } from './baseApi';
import type {
  PLCDevice,
  PLCCommand,
  Signal,
  GetPLCDevicesRequest,
  GetPLCDevicesResponse,
  SendPLCCommandRequest,
  SendPLCCommandResponse,
  ReadDatabufferRequest,
  ReadDatabufferResponse,
  WriteSignalRequest,
  WriteSignalResponse,
  GetSignalHistoryRequest,
  GetSignalHistoryResponse,
  PLCCommandTemplate,
  ShuttleStatus,
  TransferLineStatus,
  VerticalMagazineStatus,
} from '../../types/plc';

export const plcApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // ============================================
    // PLC Devices
    // ============================================

    /**
     * Get list of PLC devices with filters
     */
    getPLCDevices: builder.query<GetPLCDevicesResponse, GetPLCDevicesRequest>({
      query: (params) => ({
        url: '/plc/devices',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.devices.map(({ id }) => ({ type: 'PLCDevice' as const, id })),
              { type: 'PLCDevice', id: 'LIST' },
            ]
          : [{ type: 'PLCDevice', id: 'LIST' }],
    }),

    /**
     * Get single PLC device by ID
     */
    getPLCDeviceById: builder.query<PLCDevice, string>({
      query: (id) => `/plc/devices/${id}`,
      providesTags: (result, error, id) => [{ type: 'PLCDevice', id }],
    }),

    /**
     * Connect to PLC device
     */
    connectPLCDevice: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/plc/devices/${id}/connect`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'PLCDevice', id }],
    }),

    /**
     * Disconnect from PLC device
     */
    disconnectPLCDevice: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/plc/devices/${id}/disconnect`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'PLCDevice', id }],
    }),

    /**
     * Reset PLC device
     */
    resetPLCDevice: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/plc/devices/${id}/reset`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'PLCDevice', id }],
    }),

    // ============================================
    // PLC Commands
    // ============================================

    /**
     * Send command to PLC device
     */
    sendPLCCommand: builder.mutation<SendPLCCommandResponse, SendPLCCommandRequest>({
      query: (body) => ({
        url: '/plc/commands',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'PLCCommand', id: 'LIST' }],
    }),

    /**
     * Get command history for a device
     */
    getPLCCommands: builder.query<PLCCommand[], { deviceId: string; limit?: number }>({
      query: ({ deviceId, limit = 50 }) => ({
        url: '/plc/commands',
        params: { deviceId, limit },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'PLCCommand' as const, id })),
              { type: 'PLCCommand', id: 'LIST' },
            ]
          : [{ type: 'PLCCommand', id: 'LIST' }],
    }),

    /**
     * Get command by ID
     */
    getPLCCommandById: builder.query<PLCCommand, string>({
      query: (id) => `/plc/commands/${id}`,
      providesTags: (result, error, id) => [{ type: 'PLCCommand', id }],
    }),

    /**
     * Get command templates
     */
    getPLCCommandTemplates: builder.query<PLCCommandTemplate[], void>({
      query: () => '/plc/command-templates',
    }),

    /**
     * Cancel pending command
     */
    cancelPLCCommand: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/plc/commands/${id}/cancel`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'PLCCommand', id }],
    }),

    // ============================================
    // Databuffer
    // ============================================

    /**
     * Read databuffer from PLC
     */
    readDatabuffer: builder.query<ReadDatabufferResponse, ReadDatabufferRequest>({
      query: (params) => ({
        url: '/plc/databuffer/read',
        params,
      }),
      providesTags: (result, error, { deviceId, dbNumber }) => [
        { type: 'Databuffer', id: `${deviceId}-DB${dbNumber}` },
      ],
    }),

    /**
     * Write to databuffer
     */
    writeDatabuffer: builder.mutation<
      { success: boolean; message: string },
      {
        deviceId: string;
        dbNumber: number;
        startByte: number;
        data: number[];
        reason?: string;
      }
    >({
      query: (body) => ({
        url: '/plc/databuffer/write',
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { deviceId, dbNumber }) => [
        { type: 'Databuffer', id: `${deviceId}-DB${dbNumber}` },
      ],
    }),

    // ============================================
    // Signals
    // ============================================

    /**
     * Get signals for a device
     */
    getSignals: builder.query<Signal[], { deviceId: string }>({
      query: ({ deviceId }) => ({
        url: '/plc/signals',
        params: { deviceId },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Signal' as const, id })),
              { type: 'Signal', id: 'LIST' },
            ]
          : [{ type: 'Signal', id: 'LIST' }],
    }),

    /**
     * Get signal by ID
     */
    getSignalById: builder.query<Signal, string>({
      query: (id) => `/plc/signals/${id}`,
      providesTags: (result, error, id) => [{ type: 'Signal', id }],
    }),

    /**
     * Get signal by address
     */
    getSignalByAddress: builder.query<Signal, { deviceId: string; address: string }>({
      query: ({ deviceId, address }) => ({
        url: '/plc/signals/by-address',
        params: { deviceId, address },
      }),
    }),

    /**
     * Read signal value
     */
    readSignal: builder.query<{ value: any; timestamp: Date }, { deviceId: string; address: string }>({
      query: ({ deviceId, address }) => ({
        url: '/plc/signals/read',
        params: { deviceId, address },
      }),
    }),

    /**
     * Write signal value
     */
    writeSignal: builder.mutation<WriteSignalResponse, WriteSignalRequest>({
      query: (body) => ({
        url: '/plc/signals/write',
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { deviceId }) => [
        { type: 'Signal', id: 'LIST' },
        { type: 'Databuffer', id: `${deviceId}-*` },
      ],
    }),

    /**
     * Subscribe to signal monitoring
     */
    subscribeToSignal: builder.mutation<{ success: boolean }, { signalId: string }>({
      query: (body) => ({
        url: '/plc/signals/subscribe',
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { signalId }) => [{ type: 'Signal', id: signalId }],
    }),

    /**
     * Unsubscribe from signal monitoring
     */
    unsubscribeFromSignal: builder.mutation<{ success: boolean }, { signalId: string }>({
      query: (body) => ({
        url: '/plc/signals/unsubscribe',
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { signalId }) => [{ type: 'Signal', id: signalId }],
    }),

    /**
     * Get signal history
     */
    getSignalHistory: builder.query<GetSignalHistoryResponse, GetSignalHistoryRequest>({
      query: (params) => ({
        url: '/plc/signals/history',
        params: {
          ...params,
          startTime: params.startTime.toISOString(),
          endTime: params.endTime.toISOString(),
        },
      }),
    }),

    // ============================================
    // Device-Specific Status
    // ============================================

    /**
     * Get shuttle status
     */
    getShuttleStatus: builder.query<ShuttleStatus, string>({
      query: (deviceId) => `/plc/shuttles/${deviceId}/status`,
      providesTags: (result, error, deviceId) => [{ type: 'PLCDevice', id: deviceId }],
    }),

    /**
     * Get transfer line status
     */
    getTransferLineStatus: builder.query<TransferLineStatus, string>({
      query: (deviceId) => `/plc/transfers/${deviceId}/status`,
      providesTags: (result, error, deviceId) => [{ type: 'PLCDevice', id: deviceId }],
    }),

    /**
     * Get vertical magazine status
     */
    getVerticalMagazineStatus: builder.query<VerticalMagazineStatus, string>({
      query: (deviceId) => `/plc/vertimags/${deviceId}/status`,
      providesTags: (result, error, deviceId) => [{ type: 'PLCDevice', id: deviceId }],
    }),

    // ============================================
    // Statistics & Analytics
    // ============================================

    /**
     * Get device statistics
     */
    getDeviceStatistics: builder.query<
      {
        totalCommands: number;
        successRate: number;
        avgResponseTime: number;
        uptime: number;
        lastHourCommands: number;
      },
      { deviceId: string; period?: '1h' | '24h' | '7d' | '30d' }
    >({
      query: ({ deviceId, period = '24h' }) => ({
        url: `/plc/devices/${deviceId}/statistics`,
        params: { period },
      }),
    }),

    /**
     * Get system health
     */
    getSystemHealth: builder.query<
      {
        totalDevices: number;
        onlineDevices: number;
        devicesWithErrors: number;
        totalSignals: number;
        monitoredSignals: number;
        avgResponseTime: number;
      },
      void
    >({
      query: () => '/plc/system/health',
    }),

    // ============================================
    // Signal Monitoring
    // ============================================

    /**
     * Update signal configuration
     */
    updateSignalConfig: builder.mutation<
      void,
      import('../../types/plc').UpdateSignalConfigRequest
    >({
      query: ({ signalId, config }) => ({
        url: `/plc/signals/${signalId}/config`,
        method: 'PATCH',
        body: config,
      }),
      invalidatesTags: ['Signal'],
    }),

    /**
     * Get signal alarms
     */
    getSignalAlarms: builder.query<
      import('../../types/plc').GetSignalAlarmsResponse,
      import('../../types/plc').GetSignalAlarmsRequest
    >({
      query: (params) => ({
        url: '/plc/alarms',
        params,
      }),
      providesTags: ['Signal'],
    }),

    /**
     * Acknowledge alarm
     */
    acknowledgeAlarm: builder.mutation<
      void,
      import('../../types/plc').AcknowledgeAlarmRequest
    >({
      query: (body) => ({
        url: `/plc/alarms/${body.alarmId}/acknowledge`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Signal'],
    }),

    /**
     * Get signal groups
     */
    getSignalGroups: builder.query<
      import('../../types/plc').SignalGroup[],
      { deviceId?: string }
    >({
      query: (params) => ({
        url: '/plc/signal-groups',
        params,
      }),
      providesTags: ['Signal'],
    }),

    /**
     * Create signal group
     */
    createSignalGroup: builder.mutation<
      import('../../types/plc').SignalGroup,
      Omit<import('../../types/plc').SignalGroup, 'id' | 'createdAt' | 'updatedAt'>
    >({
      query: (body) => ({
        url: '/plc/signal-groups',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Signal'],
    }),

    /**
     * Update signal group
     */
    updateSignalGroup: builder.mutation<
      void,
      { id: string; data: Partial<import('../../types/plc').SignalGroup> }
    >({
      query: ({ id, data }) => ({
        url: `/plc/signal-groups/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Signal'],
    }),

    /**
     * Delete signal group
     */
    deleteSignalGroup: builder.mutation<void, string>({
      query: (id) => ({
        url: `/plc/signal-groups/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Signal'],
    }),

    /**
     * Update signal (edit metadata)
     */
    updateSignal: builder.mutation<
      void,
      { signalId: string; data: Partial<import('../../types/plc').Signal> }
    >({
      query: ({ signalId, data }) => ({
        url: `/plc/signals/${signalId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Signal'],
    }),

    /**
     * Delete signal
     */
    deleteSignal: builder.mutation<void, string>({
      query: (signalId) => ({
        url: `/plc/signals/${signalId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Signal'],
    }),
  }),
});

// Export hooks for usage in components
export const {
  // Devices
  useGetPLCDevicesQuery,
  useGetPLCDeviceByIdQuery,
  useConnectPLCDeviceMutation,
  useDisconnectPLCDeviceMutation,
  useResetPLCDeviceMutation,

  // Commands
  useSendPLCCommandMutation,
  useGetPLCCommandsQuery,
  useGetPLCCommandByIdQuery,
  useGetPLCCommandTemplatesQuery,
  useCancelPLCCommandMutation,

  // Databuffer
  useReadDatabufferQuery,
  useWriteDatabufferMutation,

  // Signals
  useGetSignalsQuery,
  useGetSignalByIdQuery,
  useGetSignalByAddressQuery,
  useReadSignalQuery,
  useWriteSignalMutation,
  useSubscribeToSignalMutation,
  useUnsubscribeFromSignalMutation,
  useGetSignalHistoryQuery,

  // Device-specific
  useGetShuttleStatusQuery,
  useGetTransferLineStatusQuery,
  useGetVerticalMagazineStatusQuery,

  // Statistics
  useGetDeviceStatisticsQuery,
  useGetSystemHealthQuery,

  // Signal Management Hooks (duplicati rimossi)
  // useGetSignalsQuery, // Già esportato sopra
  // useGetSignalByIdQuery, // Già esportato sopra
  useUpdateSignalMutation,
  useDeleteSignalMutation,
  // useGetSignalHistoryQuery, // Già esportato sopra
  useUpdateSignalConfigMutation,
  useGetSignalAlarmsQuery,
  useAcknowledgeAlarmMutation,
  useGetSignalGroupsQuery,
  useCreateSignalGroupMutation,
  useUpdateSignalGroupMutation,
  useDeleteSignalGroupMutation,
} = plcApi;

// Export stub hooks for missing PLC-related endpoints
export {
  useGetSignalsByDeviceQuery,
  useSendShuttleCommandMutation,
  useGetShuttleHistoryQuery,
  useGetTransferStatusQuery,
  useSendTransferCommandMutation,
  useGetTransferHistoryQuery,
} from './stubHooks';
