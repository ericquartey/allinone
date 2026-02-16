import React, { useCallback, useMemo, useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import PpcLabeledText from '../../../components/ppc/PpcLabeledText';
import PpcActionButton from '../../../components/ppc/PpcActionButton';
import PpcSensorCard from '../../../components/ppc/PpcSensorCard';
import { ppcT } from '../../../features/ppc/ppcStrings';
import usePpcMachineStatus from '../../../hooks/usePpcMachineStatus';
import { useGetBayQuery } from '../../../services/api/ppcAutomationApi';
import ppcAutomationService from '../../../services/ppc/automationService';
import { MachineErrorCode } from '../../../services/ppc/automationTypes';

const PpcErrorZeroSensorPage: React.FC = () => {
  const { errors, refresh } = usePpcMachineStatus();
  const [isWorking, setIsWorking] = useState(false);
  const [bayIsExternal, setBayIsExternal] = useState<boolean | null>(null);
  const machineError = useMemo(() => errors[0] ?? null, [errors]);
  const bayQuery = useGetBayQuery(machineError?.BayNumber ?? skipToken, {
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const errorCode = machineError?.Code ?? '--';
  const errorId = machineError?.Id ?? '--';
  const firstSeen = machineError?.OccurrenceDate
    ? new Date(machineError.OccurrenceDate).toLocaleString('it-IT')
    : '--';
  const instruction =
    machineError?.Reason ||
    ppcT('ErrorsApp.FindZeroStartConfirm', 'Find zero start confirm');

  const isElevatorZeroError = useMemo(
    () =>
      machineError?.Code === MachineErrorCode.MissingZeroSensorWithEmptyElevator ||
      machineError?.Code === MachineErrorCode.ZeroSensorErrorAfterDeposit ||
      machineError?.Code === MachineErrorCode.ConditionsNotMetForHoming,
    [machineError?.Code]
  );

  const isBayZeroError = useMemo(
    () =>
      machineError?.Code === MachineErrorCode.SensorZeroBayNotActiveAtStart ||
      machineError?.Code === MachineErrorCode.SensorZeroBayNotActiveAtEnd ||
      machineError?.Code === MachineErrorCode.ConditionsNotMetForHoming,
    [machineError?.Code]
  );

  const resolveBayType = useCallback(async () => {
    if (!machineError?.BayNumber) {
      return false;
    }
    if (bayIsExternal !== null) {
      return bayIsExternal;
    }
    const isExternal = !!bayQuery.data?.IsExternal;
    setBayIsExternal(isExternal);
    return isExternal;
  }, [bayIsExternal, bayQuery.data, machineError?.BayNumber]);

  const handleStart = useCallback(async () => {
    if (!machineError) {
      return;
    }
    try {
      setIsWorking(true);
      if (isElevatorZeroError) {
        await ppcAutomationService.findHorizontalZero();
      } else if (isBayZeroError) {
        const isExternal = await resolveBayType();
        if (isExternal) {
          await ppcAutomationService.tuneExternalBay();
        } else {
          await ppcAutomationService.tuneCarousel();
        }
      }
      await refresh();
    } finally {
      setIsWorking(false);
    }
  }, [isBayZeroError, isElevatorZeroError, machineError, refresh, resolveBayType]);

  const handleResolve = useCallback(async () => {
    if (!machineError) {
      return;
    }
    try {
      setIsWorking(true);
      await ppcAutomationService.resolveAllErrors();
      await refresh();
    } finally {
      setIsWorking(false);
    }
  }, [machineError, refresh]);

  const steps = [
    { label: '1', active: true },
    { label: '2', active: true },
    { label: '3', active: false },
  ];

  return (
    <div className="ppc-page ppc-error-wizard">
      <div className="ppc-error-wizard__title">
        {ppcT('ErrorsApp.FindZeroSensor', 'Find zero sensor')}
      </div>
      <div className="ppc-error-wizard__description">{instruction}</div>

      <div className="ppc-error-wizard__layout">
        <div className="ppc-wizard">
          <div className="ppc-wizard__timeline">
            {steps.map((step) => (
              <div
                key={step.label}
                className={`ppc-wizard__step${step.active ? ' is-active' : ''}`}
              >
                <div className="ppc-wizard__step-circle">{step.label}</div>
              </div>
            ))}
          </div>

          <div className="ppc-wizard__panel">
            <div className="ppc-wizard__panel-header">
              <div className="ppc-wizard__panel-title">
                {ppcT('ErrorsApp.FindZeroSensor', 'Find zero sensor')}
              </div>
              <div className="ppc-wizard__panel-code">
                <div className="ppc-error-details__label">
                  {ppcT('ErrorsApp.ErrorCode', 'Error code')}
                </div>
                <div className="ppc-error-details__chip ppc-error-details__chip--danger">
                  {errorCode}
                </div>
              </div>
            </div>

            <div className="ppc-wizard__panel-grid">
              <PpcLabeledText label={ppcT('ErrorsApp.Id', 'Id')} value={errorId} />
              <PpcLabeledText
                label={ppcT('ErrorsApp.FirstSeen', 'First seen')}
                value={firstSeen}
                align="right"
              />
            </div>

            <div className="ppc-error-zero__images">
              <img src="/ppc-assets/ErrorZeroElevator.png" alt="Zero elevator" />
              <img src="/ppc-assets/ErrorZeroBay.png" alt="Zero bay" />
              <img src="/ppc-assets/ErrorZeroBayExternal.png" alt="Zero bay external" />
            </div>

            <div className="ppc-wizard__panel-actions">
              <PpcActionButton
                label={ppcT('General.Start', 'Start')}
                onClick={handleStart}
                disabled={isWorking}
              />
              <PpcActionButton
                label={ppcT('ErrorsApp.MarkAsResolved', 'Mark as resolved')}
                onClick={handleResolve}
                disabled={isWorking}
              />
            </div>
          </div>
        </div>

        <div className="ppc-error-wizard__side">
          <PpcSensorCard
            title={ppcT('SensorCard.Position', 'Position')}
            lines={['Elevator 0', 'Bay zero']}
          />
          <PpcSensorCard
            title={ppcT('SensorCard.AxisVertical', 'Axis vertical')}
            lines={['P 0.00', 'S 0.00']}
          />
          <PpcSensorCard
            title={ppcT('SensorCard.AxisHorizontal', 'Axis horizontal')}
            lines={['P 0.00', 'S 0.00']}
          />
          <PpcSensorCard
            title={ppcT('SensorCard.Shutter', 'Shutter')}
            lines={[ppcT('SensorCard.Open', 'Open')]}
          />
        </div>
      </div>
    </div>
  );
};

export default PpcErrorZeroSensorPage;
