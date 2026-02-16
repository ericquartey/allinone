import React, { useCallback, useMemo, useState } from 'react';
import { Repeat, Settings, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { skipToken } from '@reduxjs/toolkit/query';
import PpcProgressBar from './PpcProgressBar';
import { ppcT } from '../../features/ppc/ppcStrings';
import usePpcMachineStatus from '../../hooks/usePpcMachineStatus';
import { usePermissions } from '../../hooks/usePermissions';
import { useGetBayQuery } from '../../services/api/ppcAutomationApi';
import ppcAutomationService from '../../services/ppc/automationService';

const formatTemplate = (template: string, ...values: Array<string | number>) =>
  template.replace(/\{(\d+)\}/g, (_match, index) => {
    const value = values[Number(index)];
    return value === undefined ? '' : String(value);
  });

const PpcHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { warehouseFill, hasErrors, isManual, isOff, refresh, errors, bayNumber } = usePpcMachineStatus({
    pollIntervalMs: 2000,
  });
  const { data: bay } = useGetBayQuery(bayNumber ?? skipToken, {
    pollingInterval: 1500,
    refetchOnFocus: true,
  });
  const { user, isAuthenticated } = usePermissions();
  const [isTogglingPower, setIsTogglingPower] = useState(false);
  const [isTogglingMode, setIsTogglingMode] = useState(false);
  const numericFill =
    typeof warehouseFill === 'number' && Number.isFinite(warehouseFill)
      ? warehouseFill
      : null;
  const fillValue = numericFill ?? 0;
  const fillText = numericFill === null ? '--' : `${numericFill.toFixed(2)}%`;
  const fillGradient =
    fillValue >= 93
      ? { color1: 'var(--ppc-orange)', color2: 'var(--ppc-red)' }
      : { color1: 'var(--ppc-green)', color2: 'var(--ppc-orange)' };
  const { primaryError, errorSeverity } = useMemo(() => {
    const firstError = errors[0] ?? null;
    return {
      primaryError: firstError,
      errorSeverity: firstError?.Severity ?? null,
    };
  }, [errors]);
  const errorClass = useMemo(() => {
    const base = `ppc-main-menu__status-tab${hasErrors ? ' is-danger' : ''}`;
    if (!hasErrors) {
      return base;
    }
    let severityClass = 'ppc-main-menu__status-tab--severity-normal';
    switch (errorSeverity) {
      case 2:
        severityClass = 'ppc-main-menu__status-tab--severity-high';
        break;
      case 3:
        severityClass = 'ppc-main-menu__status-tab--severity-homing';
        break;
      case 0:
        severityClass = 'ppc-main-menu__status-tab--severity-low';
        break;
      case 1:
      default:
        severityClass = 'ppc-main-menu__status-tab--severity-normal';
        break;
    }
    return `${base} ppc-main-menu__status-tab--blink ${severityClass}`;
  }, [hasErrors, errorSeverity]);
  const offClass = useMemo(
    () => `ppc-main-menu__status-tab${isOff ? ' is-off' : ' is-on'}`,
    [isOff]
  );
  const manualClass = useMemo(
    () => `ppc-main-menu__status-tab${isManual ? ' is-manual' : ' is-auto'}`,
    [isManual]
  );
  const powerLabel = isOff
    ? ppcT('General.Off', 'Spenta')
    : ppcT('General.On', 'Accesa');
  const currentUserLabel = user?.username || user?.fullName || 'admin';
  const errorCodeLabel = primaryError?.Code ?? '--';
  const errorDescription =
    primaryError?.Description || ppcT('ErrorsApp.ErrorDescription', 'Error description');
  const errorReason =
    primaryError?.Reason || ppcT('ErrorsApp.ErrorReason', 'Error reason');
  const errorBayLabel = primaryError?.BayNumber
    ? `${ppcT('General.Bay', 'Bay')} ${primaryError.BayNumber}`
    : '--';
  const errorIdLabel = primaryError?.Id ?? '--';
  const errorBadgeLabel = errorCodeLabel === '--' ? '--' : `E-${errorCodeLabel}`;
  const errorSeverityClass = useMemo(() => {
    switch (errorSeverity) {
      case 2:
        return 'ppc-error-popup--severity-high';
      case 3:
        return 'ppc-error-popup--severity-homing';
      case 0:
        return 'ppc-error-popup--severity-low';
      case 1:
      default:
        return 'ppc-error-popup--severity-normal';
    }
  }, [errorSeverity]);
  const isMainMenu = location.pathname === '/ppc/menu/main-menu';
  const upperLoadingUnit = useMemo(() => {
    const positions = bay?.Positions ?? [];
    const upper = positions.find((position) => position.IsUpper);
    return upper?.LoadingUnit ?? null;
  }, [bay]);
  const drawerCode =
    upperLoadingUnit?.Code ?? (upperLoadingUnit?.Id ? String(upperLoadingUnit.Id) : '--');
  const showDrawerIndicator = Boolean(upperLoadingUnit);
  const drawerIndicatorLabel = showDrawerIndicator
    ? formatTemplate(
        ppcT('OperatorApp.DrawerPresentCenter', 'Cassetto {0} presente'),
        drawerCode
      )
    : '';

  const handleTogglePower = useCallback(async () => {
    if (isTogglingPower) return;
    const confirmMessage = isOff
      ? ppcT('General.ConfirmPowerOn', 'Confermi accensione macchina?')
      : ppcT('General.ConfirmPowerOff', 'Confermi spegnimento macchina?');
    if (!window.confirm(confirmMessage)) {
      return;
    }
    setIsTogglingPower(true);
    try {
      if (isOff) {
        await ppcAutomationService.powerOn();
      } else {
        await ppcAutomationService.powerOff();
      }
      await refresh();
    } finally {
      setIsTogglingPower(false);
    }
  }, [isOff, isTogglingPower, refresh]);

  const handleToggleMode = useCallback(async () => {
    if (isTogglingMode) return;
    const confirmMessage = isManual
      ? ppcT(
          'General.ConfirmMachineModeSwitchAutomatic',
          'Sei sicuro di voler mettere la macchina in automatico?'
        )
      : ppcT('General.ConfirmMachineModeSwitchManual', 'Sei sicuro di voler mettere la macchina in manuale?');
    if (!window.confirm(confirmMessage)) {
      return;
    }
    setIsTogglingMode(true);
    try {
      if (isManual) {
        await ppcAutomationService.setMachineAutomatic();
      } else {
        await ppcAutomationService.setMachineManual();
      }
      await refresh();
    } finally {
      setIsTogglingMode(false);
    }
  }, [isManual, isTogglingMode, refresh]);

  const handleOpenErrors = useCallback(() => {
    navigate('/ppc/errors/error-details');
  }, [navigate]);

  const handleOpenDrawerPresent = useCallback(() => {
    navigate('/ppc/operator/drawer-present');
  }, [navigate]);

  const handleOpenLogin = useCallback(() => {
    navigate('/ppc/login/login');
  }, [navigate]);

  const handleSync = useCallback(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="ppc-header">
      <div className="ppc-main-menu__status-bar">
        <div className="ppc-main-menu__status-left">
          <div className="ppc-main-menu__logos">
            <img
              className="ppc-main-menu__logo"
              src="/ppc-assets/newferrettologo_small_dark.png"
              alt="Ferretto"
            />
            <img
              className="ppc-main-menu__logo ppc-main-menu__logo--group"
              src="/ppc-assets/newferretto_dark.png"
              alt="Ferretto"
            />
          </div>
          <div className="ppc-main-menu__fill">
            <PpcProgressBar
              label={ppcT('OperatorApp.WarehouseOccupied', 'Riempimento magazzino')}
              value={fillValue}
              displayValue={fillText}
              color1={fillGradient.color1}
              color2={fillGradient.color2}
            />
          </div>
        </div>

        <div className="ppc-main-menu__status-tabs">
          {showDrawerIndicator && (
            <button
              type="button"
              className="ppc-main-menu__drawer-indicator ppc-main-menu__status-tab"
              onClick={handleOpenDrawerPresent}
              title={drawerIndicatorLabel}
            >
              <span className="ppc-main-menu__drawer-indicator__label">
                {drawerIndicatorLabel}
              </span>
              <span className="ppc-main-menu__drawer-indicator__led" aria-hidden />
            </button>
          )}
          {hasErrors && (
            <button
              type="button"
              className={`${errorClass} ${errorSeverityClass}`}
              onClick={handleOpenErrors}
              title={errorDescription}
            >
              <span>{ppcT('General.Error', 'Errore')}</span>
              <span className="ppc-error-popup__chip">{errorBadgeLabel}</span>
            </button>
          )}
          <button
            type="button"
            className={offClass}
            onClick={handleTogglePower}
            disabled={isTogglingPower}
          >
            {powerLabel}
          </button>
          <button
            type="button"
            className={manualClass}
            onClick={handleToggleMode}
            disabled={isTogglingMode}
          >
            {isManual
              ? ppcT('General.Manual', 'Manuale')
              : ppcT('General.Automatic', 'Automatico')}
          </button>
          <button
            type="button"
            className="ppc-main-menu__status-tab is-user"
            onClick={handleOpenLogin}
          >
            {currentUserLabel}
          </button>
          <button
            type="button"
            className="ppc-main-menu__status-icon"
            aria-label={isAuthenticated ? 'User profile' : 'Login'}
            onClick={handleOpenLogin}
          >
            <User size={20} />
          </button>
          <button
            type="button"
            className="ppc-main-menu__status-icon"
            aria-label="Sync"
            onClick={handleSync}
          >
            <Repeat size={20} />
          </button>
          <button type="button" className="ppc-main-menu__status-icon" aria-label="Settings">
            <Settings size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PpcHeader;
