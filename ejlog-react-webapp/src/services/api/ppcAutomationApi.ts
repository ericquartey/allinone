// ============================================================================
// PPC Automation API (MAS Automation Service)
// RTK Query wrapper to keep PPC data aligned with the rest of the app.
// ============================================================================

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import {
  PPC_AUTOMATION_API_BASE_URL,
  PPC_LANGUAGE,
  PPC_BAY_NUMBER,
} from '../../config/api';
import type {
  BayAccessories,
  Bay,
  Cell,
  ElevatorPosition,
  LoadingUnit,
  MachineError,
  MachineIdentity,
  MachineMode,
  MachinePowerState,
  MachineConfig,
  Mission,
  SetupStatusCapabilities,
} from '../ppc/automationTypes';

const getPpcBayNumber = () => {
  const stored = localStorage.getItem('ppcBayNumber');
  const parsed = stored ? Number(stored) : Number.NaN;
  if (!Number.isFinite(parsed) || parsed < 1) {
    return PPC_BAY_NUMBER;
  }
  return parsed;
};

const getPpcLanguage = () => localStorage.getItem('ppcLanguage') || PPC_LANGUAGE;

const baseQuery = fetchBaseQuery({
  baseUrl: PPC_AUTOMATION_API_BASE_URL,
  prepareHeaders: (headers) => {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json');
    }
    headers.set('Accept-Language', getPpcLanguage());
    headers.set('Bay-Number', String(getPpcBayNumber()));
    return headers;
  },
});

export const ppcAutomationApi = createApi({
  reducerPath: 'ppcAutomationApi',
  baseQuery,
  tagTypes: [
    'Identity',
    'MachineMode',
    'MachinePower',
    'Errors',
    'Cells',
    'Sensors',
    'Bay',
    'BayLight',
    'Accessories',
    'LoadingUnits',
    'LoadingUnit',
    'ElevatorPosition',
    'MachineConfig',
    'LoadingUnitCompartments',
    'Missions',
    'SetupStatus',
  ],
  endpoints: (builder) => ({
    getIdentity: builder.query<MachineIdentity, void>({
      query: () => '/api/identity',
      providesTags: ['Identity'],
    }),
    getMachineMode: builder.query<MachineMode, void>({
      query: () => '/api/mode',
      providesTags: ['MachineMode'],
    }),
    getMachinePower: builder.query<MachinePowerState, void>({
      query: () => '/api/power',
      providesTags: ['MachinePower'],
    }),
    getCurrentErrors: builder.query<MachineError[], void>({
      query: () => '/api/errors/current',
      providesTags: ['Errors'],
    }),
    getCells: builder.query<Cell[], void>({
      query: () => '/api/cells',
      providesTags: ['Cells'],
    }),
    getSensors: builder.query<boolean[], void>({
      query: () => '/api/sensors',
      providesTags: ['Sensors'],
    }),
    getBay: builder.query<Bay, number>({
      query: (bayNumber) => `/api/bays/${bayNumber}`,
      providesTags: (result, error, bayNumber) => [{ type: 'Bay', id: bayNumber }],
    }),
    getBayLight: builder.query<boolean, void>({
      query: () => ({
        url: '/api/bays/get-light',
        method: 'POST',
      }),
      providesTags: ['BayLight'],
    }),
    getAccessories: builder.query<BayAccessories, number | void>({
      query: (bayNumber) => ({
        url: '/api/accessories',
        params: bayNumber ? { bayNumber } : undefined,
      }),
      providesTags: ['Accessories'],
    }),
    getLoadingUnitOnBoard: builder.query<LoadingUnit, void>({
      query: () => '/api/elevator/loading-unit-on-board',
      providesTags: ['LoadingUnit', 'LoadingUnits'],
    }),
    getLoadingUnits: builder.query<LoadingUnit[], void>({
      query: () => '/api/loading-units',
      providesTags: ['LoadingUnits'],
    }),
    getLoadingUnitById: builder.query<LoadingUnit, number>({
      query: (id) => ({
        url: '/api/loading-units/get-unit-by-id',
        params: { id },
      }),
      providesTags: (result, error, id) => [{ type: 'LoadingUnit', id }],
    }),
    getLoadingUnitCompartments: builder.query<any[], number>({
      query: (id) => `/api/loading-units/${id}/compartments`,
      providesTags: (result, error, id) => [{ type: 'LoadingUnitCompartments', id }],
    }),
    getElevatorPosition: builder.query<ElevatorPosition, void>({
      query: () => '/api/elevator/position',
      providesTags: ['ElevatorPosition'],
    }),
    getAlphaNumericBarMovement: builder.query<boolean, void>({
      query: () => '/api/identity/get/AlphaNumericBarMovement',
      providesTags: ['Identity'],
    }),
    getMachineConfig: builder.query<MachineConfig, void>({
      query: () => ({
        url: '/api/configuration/get/machine',
        method: 'POST',
      }),
      providesTags: ['MachineConfig'],
    }),
    getMissions: builder.query<Mission[], void>({
      query: () => '/api/missions',
      providesTags: ['Missions'],
    }),
    getSetupStatus: builder.query<SetupStatusCapabilities, void>({
      query: () => '/api/setup/setup-status',
      providesTags: ['SetupStatus'],
    }),
  }),
});

export const {
  useGetIdentityQuery,
  useGetMachineModeQuery,
  useGetMachinePowerQuery,
  useGetCurrentErrorsQuery,
  useGetCellsQuery,
  useGetSensorsQuery,
  useGetBayQuery,
  useGetBayLightQuery,
  useGetAccessoriesQuery,
  useGetLoadingUnitOnBoardQuery,
  useGetLoadingUnitsQuery,
  useGetLoadingUnitByIdQuery,
  useLazyGetLoadingUnitByIdQuery,
  useGetLoadingUnitCompartmentsQuery,
  useLazyGetLoadingUnitCompartmentsQuery,
  useGetElevatorPositionQuery,
  useGetAlphaNumericBarMovementQuery,
  useGetMachineConfigQuery,
  useGetMissionsQuery,
  useGetSetupStatusQuery,
} = ppcAutomationApi;

export default ppcAutomationApi;
