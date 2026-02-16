import { useCallback, useEffect, useMemo } from 'react';
import { PPC_BAY_NUMBER, PPC_LANGUAGE } from '../config/api';
import {
  useGetCellsQuery,
  useGetCurrentErrorsQuery,
  useGetIdentityQuery,
  useGetMachineModeQuery,
  useGetMachinePowerQuery,
} from '../services/api/ppcAutomationApi';
import type {
  Cell,
  MachineError,
  MachineIdentity,
  MachineMode,
  MachinePowerState,
} from '../services/ppc/automationTypes';
import { MachineMode as MachineModeEnum, MachinePowerState as MachinePowerStateEnum } from '../services/ppc/automationTypes';

type PpcMachineStatus = {
  identity: MachineIdentity | null;
  mode: MachineMode | null;
  power: MachinePowerState | null;
  errors: MachineError[];
  warehouseFill: number | null;
  bayNumber: number;
  isLoading: boolean;
  error: string | null;
};

const computeWarehouseFill = (cells: Cell[] | null) => {
  if (!cells || cells.length === 0) {
    return null;
  }

  const totalCells = cells.length;
  const lockedCells = cells.filter((cell) => cell.BlockLevel === 'Blocked').length;
  const freeCells = cells.filter((cell) => cell.IsFree).length;
  const available = totalCells - lockedCells;

  if (available <= 0) {
    return 0;
  }

  const fill = 100 - (freeCells / available) * 100;
  return Math.min(fill, 100);
};

const isManualModeForBay = (mode: MachineMode | null, bayNumber: number) => {
  if (mode === null || mode === undefined) {
    return false;
  }

  switch (bayNumber) {
    case 1:
      return mode === MachineModeEnum.Manual;
    case 2:
      return mode === MachineModeEnum.Manual2;
    case 3:
      return mode === MachineModeEnum.Manual3;
    default:
      return mode === MachineModeEnum.Manual;
  }
};

const isPowerOff = (power: MachinePowerState | null) =>
  power !== null &&
  power !== undefined &&
  power !== MachinePowerStateEnum.Powered &&
  power !== MachinePowerStateEnum.PoweringUp;

const getPpcBayNumber = () => {
  const stored = localStorage.getItem('ppcBayNumber');
  const parsed = stored ? Number(stored) : Number.NaN;
  if (!Number.isFinite(parsed) || parsed < 1) {
    return PPC_BAY_NUMBER;
  }
  return parsed;
};

const ensurePpcDefaults = () => {
  if (!localStorage.getItem('ppcBayNumber')) {
    localStorage.setItem('ppcBayNumber', String(PPC_BAY_NUMBER));
  }
  if (!localStorage.getItem('ppcLanguage')) {
    localStorage.setItem('ppcLanguage', PPC_LANGUAGE);
  }
};

export const usePpcMachineStatus = (options?: { pollIntervalMs?: number; cellsIntervalMs?: number }) => {
  const pollIntervalMs = options?.pollIntervalMs ?? 10000;
  const cellsIntervalMs = options?.cellsIntervalMs ?? 15000;

  useEffect(() => {
    ensurePpcDefaults();
  }, []);

  const identityQuery = useGetIdentityQuery(undefined, {
    pollingInterval: pollIntervalMs,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const modeQuery = useGetMachineModeQuery(undefined, {
    pollingInterval: pollIntervalMs,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const powerQuery = useGetMachinePowerQuery(undefined, {
    pollingInterval: pollIntervalMs,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const errorsQuery = useGetCurrentErrorsQuery(undefined, {
    pollingInterval: pollIntervalMs,
    refetchOnFocus: true,
    refetchOnReconnect: true,
    refetchOnMountOrArgChange: true,
  });
  const cellsQuery = useGetCellsQuery(undefined, {
    pollingInterval: cellsIntervalMs,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const errors = useMemo(() => {
    let normalized: MachineError[] = [];
    if (Array.isArray(errorsQuery.data)) {
      normalized = errorsQuery.data;
    } else if (errorsQuery.data && typeof errorsQuery.data === 'object' && 'Code' in errorsQuery.data) {
      normalized = [errorsQuery.data as MachineError];
    }
    return normalized
      .slice()
      .sort((a, b) => {
        const aTime = a.OccurrenceDate ? Date.parse(a.OccurrenceDate) : 0;
        const bTime = b.OccurrenceDate ? Date.parse(b.OccurrenceDate) : 0;
        return bTime - aTime;
      });
  }, [errorsQuery.data]);

  const warehouseFill = useMemo(() => computeWarehouseFill(cellsQuery.data ?? null), [cellsQuery.data]);

  const refresh = useCallback(async () => {
    await Promise.all([
      identityQuery.refetch(),
      modeQuery.refetch(),
      powerQuery.refetch(),
      errorsQuery.refetch(),
      cellsQuery.refetch(),
    ]);
  }, [identityQuery, modeQuery, powerQuery, errorsQuery, cellsQuery]);

  const error =
    identityQuery.error ||
    modeQuery.error ||
    powerQuery.error ||
    errorsQuery.error ||
    cellsQuery.error;

  const errorMessage =
    error && typeof error === 'object' && 'status' in error ? 'PPC data error' : null;

  const status: PpcMachineStatus = {
    identity: identityQuery.data ?? null,
    mode: modeQuery.data ?? null,
    power: powerQuery.data ?? null,
    errors,
    warehouseFill,
    bayNumber: getPpcBayNumber(),
    isLoading:
      identityQuery.isFetching ||
      modeQuery.isFetching ||
      powerQuery.isFetching ||
      errorsQuery.isFetching ||
      cellsQuery.isFetching,
    error: errorMessage,
  };

  const derived = useMemo(() => {
    const hasErrors = status.errors.length > 0;
    const manual = isManualModeForBay(status.mode, status.bayNumber);
    const off = isPowerOff(status.power);

    return {
      hasErrors,
      isManual: manual,
      isOff: off,
    };
  }, [status.errors.length, status.mode, status.bayNumber, status.power]);

  return { ...status, ...derived, refresh };
};

export default usePpcMachineStatus;
