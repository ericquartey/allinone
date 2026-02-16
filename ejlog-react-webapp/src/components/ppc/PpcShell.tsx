import React, { useEffect, useMemo, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { skipToken } from '@reduxjs/toolkit/query';
import PpcHeader from './PpcHeader';
import PpcFooter from './PpcFooter';
import usePpcAutomationHub from '../../hooks/usePpcAutomationHub';
import usePpcMachineStatus from '../../hooks/usePpcMachineStatus';
import { useGetBayQuery, useGetCurrentErrorsQuery, useGetSensorsQuery } from '../../services/api/ppcAutomationApi';
import { ppcT } from '../../features/ppc/ppcStrings';
import type { Bay } from '../../services/ppc/automationTypes';
import { MachineErrorCode } from '../../services/ppc/automationTypes';

const getBayZeroChainIndex = (bayNumber: number) => {
  switch (bayNumber) {
    case 1:
      return 74;
    case 2:
      return 90;
    case 3:
      return 106;
    default:
      return 74;
  }
};

type NullableBoolCandidate = {
  hasValue?: boolean;
  HasValue?: boolean;
  value?: boolean;
  Value?: boolean;
};

const getNullableBool = (value: unknown): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === null || value === undefined || typeof value !== 'object') {
    return false;
  }
  const maybe = value as NullableBoolCandidate;
  const keys: Array<keyof NullableBoolCandidate> = ['value', 'Value', 'hasValue', 'HasValue'];
  for (const key of keys) {
    const candidate = maybe[key];
    if (typeof candidate === 'boolean') {
      return candidate;
    }
  }
  return false;
};

const resolveErrorRoute = ({
  errorCode,
  bay,
  sensors,
  bayNumber,
}: {
  errorCode?: number | null;
  bay: Bay | undefined;
  sensors: boolean[];
  bayNumber: number;
}): string => {
  if (errorCode === undefined || errorCode === null) {
    return '/ppc/errors/error-details';
  }

  const zeroChainSensor = Boolean(sensors[55] || sensors[58]);
  const luPresentInOperatorSide = Boolean(sensors[10]);
  const luPresentInMachineSide = Boolean(sensors[11]);
  const bayZeroChain = Boolean(sensors[getBayZeroChainIndex(bayNumber)]);

  const isErrorZero = () => {
    switch (errorCode) {
      case MachineErrorCode.MissingZeroSensorWithEmptyElevator:
      case MachineErrorCode.ZeroSensorErrorAfterDeposit:
        return !zeroChainSensor && !luPresentInMachineSide && !luPresentInOperatorSide;
      case MachineErrorCode.SensorZeroBayNotActiveAtEnd:
      case MachineErrorCode.SensorZeroBayNotActiveAtStart:
        return !bayZeroChain && Boolean(bay?.Carousel);
      case MachineErrorCode.ConditionsNotMetForHoming: {
        const zeroMissing = !zeroChainSensor && !luPresentInMachineSide && !luPresentInOperatorSide;
        if (zeroMissing) {
          return true;
        }
        return !bayZeroChain && Boolean(bay?.Carousel);
      }
      default:
        return false;
    }
  };

  const isNewStepEnabled = getNullableBool(bay?.IsNewStepEnabled);

  if (
    isNewStepEnabled &&
    (errorCode === MachineErrorCode.LoadUnitHeightFromBayExceeded ||
      errorCode === MachineErrorCode.LoadUnitHeightFromBayTooLow)
  ) {
    return '/ppc/errors/error-details';
  }

  if (
    errorCode === MachineErrorCode.LoadUnitMissingOnElevator ||
    errorCode === MachineErrorCode.LoadUnitMissingOnBay
  ) {
    return '/ppc/errors/error-loadunit-missing';
  }

  if (errorCode === MachineErrorCode.InverterFaultStateDetected) {
    return '/ppc/errors/error-inverter-fault';
  }

  if (
    errorCode === MachineErrorCode.MoveBayChainNotAllowed ||
    errorCode === MachineErrorCode.LoadUnitHeightFromBayExceeded ||
    errorCode === MachineErrorCode.LoadUnitHeightFromBayTooLow ||
    errorCode === MachineErrorCode.LoadUnitWeightExceeded
  ) {
    return '/ppc/errors/error-load-unit-errors';
  }

  if (isErrorZero()) {
    return '/ppc/errors/error-zero-sensor';
  }

  return '/ppc/errors/error-details';
};

const PpcShell: React.FC = () => {
  usePpcAutomationHub();
  const navigate = useNavigate();
  const location = useLocation();
  const lastNonErrorPath = useRef<string | null>(null);
  const upperDrawerArrivalRef = useRef(0);
  const drawerRedirectedArrivalRef = useRef(0);
  const prevUpperDrawerRef = useRef(false);
  const { bayNumber, isOff } = usePpcMachineStatus({ pollIntervalMs: 2000 });
  const { data: bay } = useGetBayQuery(bayNumber ?? skipToken, {
    pollingInterval: 1000,
    refetchOnFocus: true,
    refetchOnReconnect: true,
    refetchOnMountOrArgChange: true,
  });
  const { data: currentErrors = [] } = useGetCurrentErrorsQuery(undefined, {
    pollingInterval: 1000,
    refetchOnFocus: true,
    refetchOnReconnect: true,
    refetchOnMountOrArgChange: true,
  });
  const { data: sensors = [] } = useGetSensorsQuery(undefined, {
    pollingInterval: 1000,
    refetchOnFocus: true,
    refetchOnReconnect: true,
    refetchOnMountOrArgChange: true,
  });
  const errors = useMemo(() => {
    let normalized = [];
    if (Array.isArray(currentErrors)) {
      normalized = currentErrors;
    } else if (currentErrors && typeof currentErrors === 'object' && 'Code' in currentErrors) {
      normalized = [currentErrors];
    }
    return normalized.slice().sort((a, b) => {
      const aTime = a.OccurrenceDate ? Date.parse(a.OccurrenceDate) : 0;
      const bTime = b.OccurrenceDate ? Date.parse(b.OccurrenceDate) : 0;
      return bTime - aTime;
    });
  }, [currentErrors]);
  const hasUpperDrawer = useMemo(() => {
    const positions = bay?.Positions ?? [];
    const upper = positions.find((position) => position.IsUpper);
    return Boolean(upper?.LoadingUnit);
  }, [bay]);

  const isLayoutModule = location.pathname.startsWith('/ppc/layout');
  const hideShellChrome = isLayoutModule;
  const isDrawerPresentPage = location.pathname === '/ppc/operator/drawer-present';
  const isErrorPage = location.pathname.startsWith('/ppc/errors');
  const hasErrors = errors.length > 0;
  const primaryError = errors[0];
  const errorRoute = resolveErrorRoute({
    errorCode: primaryError?.Code,
    bay,
    sensors,
    bayNumber,
  });
  const errorLabel =
    primaryError?.Description ||
    primaryError?.Reason ||
    ppcT('ErrorsApp.ErrorDescription', 'Error description');

  useEffect(() => {
    if (!isErrorPage) {
      lastNonErrorPath.current = location.pathname;
    }

    if (hasUpperDrawer && !prevUpperDrawerRef.current) {
      upperDrawerArrivalRef.current += 1;
    }

    if (!hasUpperDrawer) {
      upperDrawerArrivalRef.current = 0;
      drawerRedirectedArrivalRef.current = 0;
    }

    prevUpperDrawerRef.current = hasUpperDrawer;

    if (hasErrors) {
      if (location.pathname !== errorRoute) {
        navigate(errorRoute, { replace: true });
      }
      return;
    }

    const shouldAutoOpenDrawer =
      hasUpperDrawer &&
      upperDrawerArrivalRef.current > drawerRedirectedArrivalRef.current &&
      !isDrawerPresentPage &&
      !isOff;

    if (shouldAutoOpenDrawer) {
      drawerRedirectedArrivalRef.current = upperDrawerArrivalRef.current;
      navigate('/ppc/operator/drawer-present', { replace: true });
      return;
    }

    if (!hasUpperDrawer && isDrawerPresentPage && !isOff) {
      navigate('/ppc/operator/item-operation-wait', { replace: true });
      return;
    }

    if (isOff && isDrawerPresentPage) {
      navigate('/ppc/menu/main-menu', { replace: true });
      return;
    }

    if (isErrorPage) {
      const fallback = lastNonErrorPath.current ?? '/ppc/menu/main-menu';
      if (fallback !== location.pathname) {
        navigate(fallback, { replace: true });
      }
    }
  }, [
    errorRoute,
    hasErrors,
    hasUpperDrawer,
    isDrawerPresentPage,
    isErrorPage,
    isOff,
    location.pathname,
    navigate,
  ]);

  return (
    <div className="ppc-shell-inner">
      {!hideShellChrome && <PpcHeader />}
      {!hideShellChrome && hasErrors && (
        <div className="ppc-error-banner" role="alert">
          <span className="ppc-error-banner__code">
            {ppcT('ErrorsApp.ErrorCode', 'Errore')} {primaryError?.Code ?? '--'}
          </span>
          <span className="ppc-error-banner__text">{errorLabel}</span>
        </div>
      )}
      <main className={`ppc-main${isLayoutModule ? ' ppc-main--layout' : ''}`}>
        <Outlet />
      </main>
      {!hideShellChrome && <PpcFooter />}
    </div>
  );
};

export default PpcShell;
