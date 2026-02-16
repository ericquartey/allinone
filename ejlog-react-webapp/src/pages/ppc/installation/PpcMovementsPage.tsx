import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ppcT } from '../../../features/ppc/ppcStrings';
import PpcActionButton from '../../../components/ppc/PpcActionButton';
import PpcFormField from '../../../components/ppc/PpcFormField';
import PpcCheckboxField from '../../../components/ppc/PpcCheckboxField';
import PpcSensorCard, { PpcSensorBadge } from '../../../components/ppc/PpcSensorCard';
import PpcSelectField from '../../../components/ppc/PpcSelectField';
import { usePermissions } from '../../../hooks/usePermissions';
import {
  useGetBayQuery,
  useGetBayLightQuery,
  useGetElevatorPositionQuery,
  useGetLoadingUnitOnBoardQuery,
  useGetLoadingUnitsQuery,
  useGetMachineConfigQuery,
  useGetSensorsQuery,
  useLazyGetLoadingUnitByIdQuery,
} from '../../../services/api/ppcAutomationApi';
import {
  type Bay,
  type BayPosition,
  type MachineConfig,
  LoadingUnitLocation,
  MovementCategory,
  HorizontalMovementDirection,
  VerticalMovementDirection,
  ExternalBayMovementDirection,
  ShutterPosition,
  ShutterMovementDirection,
  ShutterType,
} from '../../../services/ppc/automationTypes';
import ppcAutomationService from '../../../services/ppc/automationService';
import { PPC_BAY_NUMBER } from '../../../config/api';

type MovementMode = 'guided' | 'manual' | 'operator';

const getBayPositionOptions = (bay: Bay | null): BayPosition[] => {
  const positions = bay?.Positions ?? [];
  if (positions.length === 0) {
    return [];
  }
  const sorted = [...positions].sort((a, b) => (a.Height ?? 0) - (b.Height ?? 0));
  return sorted;
};

const findAxisSpeed = (machine: MachineConfig | null, orientation: 'vertical' | 'horizontal') => {
  if (!machine?.Elevator?.Axes) {
    return null;
  }
  const target = orientation === 'vertical' ? 1 : 2;
  const axis = machine.Elevator.Axes.find((item) => {
    if (typeof item.Orientation === 'number') {
      return item.Orientation === target;
    }
    return String(item.Orientation).toLowerCase() === orientation;
  });
  return axis?.EmptyLoadMovement?.Speed ?? null;
};

const setAxisSpeed = (machine: MachineConfig, orientation: 'vertical' | 'horizontal', value: number) => {
  if (!machine.Elevator?.Axes) {
    return;
  }
  const target = orientation === 'vertical' ? 1 : 2;
  const axis = machine.Elevator.Axes.find((item) => {
    if (typeof item.Orientation === 'number') {
      return item.Orientation === target;
    }
    return String(item.Orientation).toLowerCase() === orientation;
  });
  if (axis?.EmptyLoadMovement) {
    axis.EmptyLoadMovement.Speed = value;
  }
};

const formatDecimal = (value?: number | null, decimals = 2) => {
  if (value == null || Number.isNaN(value)) {
    return '--';
  }
  return value.toFixed(decimals);
};

const PpcMovementsPage: React.FC = () => {
  const { isOperator } = usePermissions();
  const [mode, setMode] = useState<MovementMode>(isOperator ? 'operator' : 'guided');
  const [useWeightControl, setUseWeightControl] = useState<boolean>(false);
  const [loadingUnitId, setLoadingUnitId] = useState<string>('');
  const [cellId, setCellId] = useState<string>('');
  const [targetHeight, setTargetHeight] = useState<string>('');
  const [selectedBayPositionId, setSelectedBayPositionId] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isPolicyBypassed, setIsPolicyBypassed] = useState<boolean>(false);
  const [verticalSpeed, setVerticalSpeed] = useState<number | null>(null);
  const [horizontalSpeed, setHorizontalSpeed] = useState<number | null>(null);
  const [getLoadingUnitById] = useLazyGetLoadingUnitByIdQuery();

  const bayQuery = useGetBayQuery(PPC_BAY_NUMBER, {
    pollingInterval: 2000,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const positionQuery = useGetElevatorPositionQuery(undefined, {
    pollingInterval: 1000,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const sensorsQuery = useGetSensorsQuery(undefined, {
    pollingInterval: 1000,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const lightQuery = useGetBayLightQuery(undefined, {
    pollingInterval: 2000,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const loadingUnitOnBoardQuery = useGetLoadingUnitOnBoardQuery(undefined, {
    pollingInterval: 1000,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const machineConfigQuery = useGetMachineConfigQuery(undefined, {
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const loadingUnitsQuery = useGetLoadingUnitsQuery(undefined, {
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const bay = bayQuery.data ?? null;
  const elevatorPosition = positionQuery.data ?? null;
  const loadingUnitOnBoard = loadingUnitOnBoardQuery.data ?? null;
  const sensors = sensorsQuery.data ?? [];
  const lightOn = Boolean(lightQuery.data);
  const machineConfig = (machineConfigQuery.data as MachineConfig | undefined) ?? null;

  const bayPositions = useMemo(() => getBayPositionOptions(bay), [bay]);

  useEffect(() => {
    if (!machineConfig) {
      return;
    }
    setVerticalSpeed(findAxisSpeed(machineConfig, 'vertical'));
    setHorizontalSpeed(findAxisSpeed(machineConfig, 'horizontal'));
  }, [machineConfig]);

  useEffect(() => {
    if (!bay?.Positions?.length) {
      return;
    }
    if (selectedBayPositionId) {
      return;
    }
    const defaultPosition = bay.Positions.find((pos) => !pos.IsUpper)?.Id ?? bay.Positions[0]?.Id;
    if (defaultPosition) {
      setSelectedBayPositionId(String(defaultPosition));
    }
  }, [bay, selectedBayPositionId]);

  useEffect(() => {
    if (isOperator) {
      setMode('operator');
    }
  }, [isOperator]);

  useEffect(() => {
    if (mode !== 'manual' && isPolicyBypassed) {
      setIsPolicyBypassed(false);
    }
  }, [mode, isPolicyBypassed]);

  const setMessage = (message: string) => {
    setStatusMessage(message);
    window.setTimeout(() => setStatusMessage(''), 4000);
  };

  const selectedBayPosition = bayPositions.find((pos) => String(pos.Id) === selectedBayPositionId);
  const isMultiPosition = bayPositions.length > 1;
  const lowerBayPosition = bayPositions.find((pos) => !pos.IsUpper);
  const upperBayPosition = bayPositions.find((pos) => pos.IsUpper);
  const isElevatorInCell = Boolean(elevatorPosition?.CellId);
  const shutterType = bay?.Shutter?.Type ?? ShutterType.NotSpecified;
  const canShowIntermediateShutter = shutterType === ShutterType.ThreeSensors;
  const canShowClosedShutter = shutterType !== ShutterType.NotSpecified;

  const handleMoveToBay = async (overridePosition?: BayPosition | null) => {
    const target = overridePosition ?? selectedBayPosition;
    const bayPositionId = Number(target?.Id);
    if (!bayPositionId) {
      setMessage('Seleziona posizione baia');
      return;
    }
    await ppcAutomationService.moveElevatorToBayPosition(bayPositionId, true, useWeightControl);
    if (target?.Id) {
      setSelectedBayPositionId(String(target.Id));
    }
  };

  const handleMoveToCell = async () => {
    const cellValue = Number(cellId);
    if (!cellValue) {
      setMessage('Inserisci cella');
      return;
    }
    await ppcAutomationService.moveElevatorToCell(cellValue, true, useWeightControl);
  };

  const handleMoveToHeight = async () => {
    const heightValue = Number(targetHeight);
    if (!Number.isFinite(heightValue) || heightValue <= 0) {
      setMessage('Altezza non valida');
      return;
    }
    const loadUnitValue = Number(loadingUnitId);
    await ppcAutomationService.moveElevatorToHeight(
      heightValue,
      useWeightControl,
      Number.isFinite(loadUnitValue) && loadUnitValue > 0 ? loadUnitValue : undefined
    );
  };

  const handleMoveToLoadingUnit = async () => {
    const unitValue = Number(loadingUnitId);
    if (!unitValue) {
      setMessage('Inserisci UDC');
      return;
    }
    try {
      const loadUnit = await getLoadingUnitById(unitValue).unwrap();
      if (!loadUnit) {
        setMessage('UDC non presente');
        return;
      }
      if (loadUnit.CellId) {
        await ppcAutomationService.moveElevatorToCell(loadUnit.CellId, true, useWeightControl);
        return;
      }
      await ppcAutomationService.moveElevatorToFreeCell(unitValue, true, useWeightControl);
    } catch {
      setMessage('UDC non presente');
    }
  };

  const handleUnloadToBay = async () => {
    const target = selectedBayPosition;
    const bayPositionId = Number(target?.Id);
    if (!bayPositionId) {
      setMessage('Seleziona posizione baia');
      return;
    }
    if (!loadingUnitOnBoard?.Id) {
      await ppcAutomationService.unloadToBay(bayPositionId);
      return;
    }
    if (target?.Location != null) {
      await ppcAutomationService.ejectLoadingUnit(target.Location, loadingUnitOnBoard.Id);
      return;
    }
    await ppcAutomationService.unloadToBay(bayPositionId);
  };

  const handleLoadFromBay = async () => {
    const target = selectedBayPosition;
    const bayPositionId = Number(target?.Id);
    if (!bayPositionId) {
      setMessage('Seleziona posizione baia');
      return;
    }
    if (target?.LoadingUnit?.Id) {
      await ppcAutomationService.startMovingLoadingUnitToBay(target.LoadingUnit.Id, LoadingUnitLocation.Elevator);
      return;
    }
    await ppcAutomationService.loadFromBay(bayPositionId);
  };

  const handleUnloadToCell = async () => {
    const cellValue = Number(cellId);
    if (!cellValue) {
      setMessage('Inserisci cella');
      return;
    }
    if (!loadingUnitOnBoard?.Id) {
      await ppcAutomationService.unloadToCell(cellValue);
      return;
    }
    const targetCell = elevatorPosition?.CellId ?? cellValue;
    await ppcAutomationService.insertLoadingUnit(LoadingUnitLocation.Elevator, targetCell, loadingUnitOnBoard.Id);
  };

  const handleLoadFromCell = async () => {
    const cellValue = Number(cellId);
    if (!cellValue) {
      setMessage('Inserisci cella');
      return;
    }
    const loadUnits = loadingUnitsQuery.data ?? [];
    const loadUnit = loadUnits.find((item) => item.CellId === cellValue);
    if (!loadUnit?.Id) {
      setMessage('UDC non presente in cella');
      return;
    }
    await ppcAutomationService.startMovingLoadingUnitToBay(loadUnit.Id, LoadingUnitLocation.Elevator);
  };

  const handleToggleLight = async () => {
    await ppcAutomationService.setBayLight(!lightOn, true);
    await lightQuery.refetch();
  };

  const handleStopAll = async () => {
    await ppcAutomationService.stopAllMovements();
  };

  const handleResetMachine = async () => {
    await ppcAutomationService.resetMachine(false);
  };

  const handleResetMissions = async () => {
    await ppcAutomationService.resetMissions();
  };

  const handleTuningChain = async () => {
    await ppcAutomationService.findHorizontalZero();
  };

  const handleVerticalCalibration = async () => {
    await ppcAutomationService.startVerticalOriginProcedure();
  };

  const handleBlockUdc = async () => {
    await ppcAutomationService.blockUdc(PPC_BAY_NUMBER);
  };

  const handleFreeUdc = async () => {
    await ppcAutomationService.freeUdc(PPC_BAY_NUMBER);
  };

  const handleOpenShutter = async () => {
    await ppcAutomationService.moveShutterToPosition(ShutterPosition.Opened);
  };

  const handleIntermediateShutter = async () => {
    await ppcAutomationService.moveShutterToPosition(ShutterPosition.Half);
  };

  const handleClosedShutter = async () => {
    await ppcAutomationService.moveShutterToPosition(ShutterPosition.Closed);
  };

  const handleTuneBay = async () => {
    await ppcAutomationService.tuneCarousel();
  };

  const handleTuneExtBay = async () => {
    await ppcAutomationService.tuneExternalBay();
  };

  const handleCarouselUp = async () => {
    await ppcAutomationService.moveCarousel(VerticalMovementDirection.Up, MovementCategory.Assisted);
  };

  const handleCarouselDown = async () => {
    await ppcAutomationService.moveCarousel(VerticalMovementDirection.Down, MovementCategory.Assisted);
  };

  const resolveExternalBayUpper = () => {
    if (!bay?.IsDouble) {
      return false;
    }
    return Boolean(selectedBayPosition?.IsUpper ?? elevatorPosition?.BayPositionUpper);
  };

  const handleExternalBayTowardOperator = async () => {
    await ppcAutomationService.moveExternalBay(
      ExternalBayMovementDirection.TowardOperator,
      MovementCategory.Assisted,
      resolveExternalBayUpper()
    );
  };

  const handleExternalBayTowardMachine = async () => {
    await ppcAutomationService.moveExternalBay(
      ExternalBayMovementDirection.TowardMachine,
      MovementCategory.Assisted,
      resolveExternalBayUpper()
    );
  };

  const handleExternalBayInsert = async () => {
    await ppcAutomationService.moveExternalBayForInsertion(resolveExternalBayUpper());
  };

  const handleExternalBayExtract = async () => {
    await ppcAutomationService.moveExternalBayForExtraction(resolveExternalBayUpper());
  };

  const handleSaveSpeeds = async () => {
    if (!machineConfig) {
      setMessage('Configurazione non disponibile');
      return;
    }
    if (verticalSpeed != null) {
      setAxisSpeed(machineConfig, 'vertical', verticalSpeed);
    }
    if (horizontalSpeed != null) {
      setAxisSpeed(machineConfig, 'horizontal', horizontalSpeed);
    }
    await ppcAutomationService.updateMachineConfig(machineConfig);
    setMessage('Velocita aggiornate');
  };

  const hasCarousel = Boolean(bay?.Carousel);
  const hasExternalBay = Boolean(bay?.External) || Boolean(bay?.IsExternal);
  const hasShutter = Boolean(bay?.Shutter);

  const bayNumber = bay?.Number ?? PPC_BAY_NUMBER;
  const isUpperPosition = Boolean(
    selectedBayPosition?.IsUpper ?? elevatorPosition?.BayPositionUpper
  );

  const positionValue = elevatorPosition ? `in Baia ${bayNumber}` : '--';
  const positionSecondary = elevatorPosition
    ? isUpperPosition
      ? 'Posizione Alta'
      : 'Posizione Bassa'
    : undefined;
  const drawerValue = loadingUnitOnBoard?.Id ? `UDC ${loadingUnitOnBoard.Id}` : 'Nessun cassetto';
  const verticalValue = elevatorPosition
    ? `${formatDecimal(elevatorPosition.Vertical)} mm`
    : '--';
  const horizontalValue = elevatorPosition
    ? `${formatDecimal(elevatorPosition.Horizontal)} mm`
    : '--';
  const shutterValue = hasShutter
    ? sensors[66]
      ? 'Aperta'
      : 'Chiusa'
    : '--';

  const positionBadges: PpcSensorBadge[] = [];
  if (elevatorPosition) {
    positionBadges.push({
      label: isUpperPosition ? 'Posizione Alta' : 'Posizione Bassa',
      variant: 'info',
    });
    if (loadingUnitOnBoard?.Id) {
      positionBadges.push({
        label: 'UDC a bordo',
        variant: 'success',
      });
    }
  }

  const verticalBadges: PpcSensorBadge[] = [];
  if (sensors[50]) {
    verticalBadges.push({ label: 'Zero', variant: 'success' });
  }
  if (sensors[53]) {
    verticalBadges.push({ label: 'Overrun', variant: 'warning' });
  }

  const horizontalBadges: PpcSensorBadge[] = [];
  if (sensors[55]) {
    horizontalBadges.push({ label: 'Zero pawl', variant: 'success' });
  }
  if (sensors[56]) {
    horizontalBadges.push({ label: 'Catena', variant: 'success' });
  }

  const bayBadges: PpcSensorBadge[] = [];
  if (bay?.IsDouble) {
    bayBadges.push({ label: 'Telescopica', variant: 'info' });
  }
  if (bay?.IsExternal) {
    bayBadges.push({ label: 'Baia esterna', variant: 'warning' });
  }

  const shutterBadges: PpcSensorBadge[] = [];
  if (sensors[66]) {
    shutterBadges.push({ label: 'Sens. A', variant: 'success' });
  }
  if (sensors[67]) {
    shutterBadges.push({ label: 'Sens. B', variant: 'success' });
  }

  const positionLines = elevatorPosition
    ? [
        `Cella: ${elevatorPosition.CellId ?? '--'}`,
        `Pos logica: ${selectedBayPosition?.Id ?? elevatorPosition.BayPositionId ?? '--'}`,
        `Sensore zero: ${sensors[50] ? 'ON' : 'OFF'}`,
      ]
    : ['--'];

  const drawerLines = [
    `Peso netto: ${formatDecimal(loadingUnitOnBoard?.NetWeight)} kg`,
    `Altezza: ${formatDecimal(loadingUnitOnBoard?.Height)} mm`,
  ];

  const verticalLines = [
    `Zero: ${sensors[50] ? 'ON' : 'OFF'}`,
    `Overrun: ${sensors[53] ? 'ON' : 'OFF'}`,
  ];

  const horizontalLines = [
    `Catena: ${sensors[56] ? 'ON' : 'OFF'}`,
    `Zero pawl: ${sensors[55] ? 'ON' : 'OFF'}`,
  ];

  const bayLines = bayPositions.length
    ? bayPositions.map((pos) => `Pos ${pos.Id}: ${pos.Height?.toFixed(0) ?? '--'}`)
    : ['--'];

  const shutterLines = hasShutter
    ? [
        `Serranda A: ${sensors[66] ? 'ON' : 'OFF'}`,
        `Serranda B: ${sensors[67] ? 'ON' : 'OFF'}`,
      ]
    : ['--'];

  return (
    <div className="ppc-page ppc-movements">
      <div className="ppc-movements__layout">
        <div className="ppc-movements__sensors">
          <PpcSensorCard
            title={ppcT('InstallationApp.Position', 'Posizione')}
            value={positionValue}
            secondary={positionSecondary}
            badges={positionBadges}
            lines={positionLines}
          />
          <PpcSensorCard
            title={ppcT('InstallationApp.Drawer', 'Cassetto')}
            value={drawerValue}
            lines={drawerLines}
          />
          <PpcSensorCard
            title={ppcT('InstallationApp.VerticalAxis', 'Asse verticale')}
            value={verticalValue}
            badges={verticalBadges}
            lines={verticalLines}
          />
          <PpcSensorCard
            title={ppcT('InstallationApp.HorizontalAxis', 'Asse orizzontale')}
            value={horizontalValue}
            badges={horizontalBadges}
            lines={horizontalLines}
          />
          <PpcSensorCard
            title={ppcT('InstallationApp.Bay', 'Baia')}
            value={`Baia ${bayNumber}`}
            secondary={bay?.IsActive ? 'Attiva' : 'Inattiva'}
            badges={bayBadges}
            lines={bayLines}
          />
          {hasShutter && (
            <PpcSensorCard
              title={ppcT('InstallationApp.Shutter', 'Serranda')}
              value={shutterValue}
              badges={shutterBadges}
              lines={shutterLines}
            />
          )}
        </div>

        <div className="ppc-movements__main">
          <div className="ppc-movements__tabs">
            {!isOperator && (
              <>
                <button
                  type="button"
                  className={`ppc-movements__tab${mode === 'guided' ? ' is-active' : ''}`}
                  onClick={() => setMode('guided')}
                >
                  {ppcT('InstallationApp.MovementsGuided', 'Movimenti guidati')}
                </button>
                <button
                  type="button"
                  className={`ppc-movements__tab${mode === 'manual' ? ' is-active' : ''}`}
                  onClick={() => setMode('manual')}
                >
                  {ppcT('InstallationApp.MovementsManual', 'Movimenti manuali')}
                </button>
              </>
            )}
            <button
              type="button"
              className={`ppc-movements__tab${mode === 'operator' ? ' is-active' : ''}`}
              onClick={() => setMode('operator')}
            >
              {ppcT('OperatorApp.Elevator', 'Elevator')}
            </button>
          </div>

          {statusMessage && (
            <div className="ppc-movements__status">{statusMessage}</div>
          )}

          {mode === 'guided' && (
            <div className="ppc-movements__panel">
              <div className="ppc-movements__row">
                <PpcActionButton
                  label={ppcT('InstallationApp.GoToLoadUnit', 'Vai a UDC')}
                  onClick={handleMoveToLoadingUnit}
                />
                <PpcFormField
                  label={ppcT('InstallationApp.LoadingUnit', 'UDC')}
                  value={loadingUnitId}
                  onChange={setLoadingUnitId}
                />
                <PpcCheckboxField
                  label={ppcT('InstallationApp.UseWeightControl', 'Usa controllo peso')}
                  checked={useWeightControl}
                  onChange={setUseWeightControl}
                />
              </div>

              <div className="ppc-movements__row">
                {isMultiPosition ? (
                  <div />
                ) : (
                  <PpcActionButton
                    label={ppcT('InstallationApp.GoToBay', 'Vai a baia')}
                    onClick={() => handleMoveToBay()}
                  />
                )}
                {isMultiPosition ? (
                  <div className="ppc-movements__bay-buttons">
                    <PpcActionButton
                      label={ppcT('InstallationApp.BayPositionDown', 'Posizione bassa')}
                      onClick={() => handleMoveToBay(lowerBayPosition ?? null)}
                      className={selectedBayPosition?.Id === lowerBayPosition?.Id ? 'is-active' : undefined}
                      disabled={!lowerBayPosition}
                    />
                    <PpcActionButton
                      label={ppcT('InstallationApp.BayPositionUp', 'Posizione alta')}
                      onClick={() => handleMoveToBay(upperBayPosition ?? null)}
                      className={selectedBayPosition?.Id === upperBayPosition?.Id ? 'is-active' : undefined}
                      disabled={!upperBayPosition}
                    />
                  </div>
                ) : (
                  <PpcSelectField
                    label={ppcT('InstallationApp.BayPosition', 'Posizione baia')}
                    value={selectedBayPositionId}
                    onChange={setSelectedBayPositionId}
                    options={bayPositions.map((pos) => ({
                      label: `${pos.Id} (${pos.Height?.toFixed(0) ?? '--'})`,
                      value: String(pos.Id),
                    }))}
                  />
                )}
                <div className="ppc-movements__actions">
                  {isElevatorInCell ? (
                    <>
                      <PpcActionButton
                        label={ppcT('InstallationApp.UnloadToCell', 'Scarica in cella')}
                        onClick={handleUnloadToCell}
                      />
                      <PpcActionButton
                        label={ppcT('InstallationApp.LoadFromCell', 'Carica da cella')}
                        onClick={handleLoadFromCell}
                      />
                    </>
                  ) : (
                    <>
                      <PpcActionButton
                        label={ppcT('InstallationApp.UnloadToBay', 'Scarica in baia')}
                        onClick={handleUnloadToBay}
                      />
                      <PpcActionButton
                        label={ppcT('InstallationApp.LoadFromBay', 'Carica da baia')}
                        onClick={handleLoadFromBay}
                      />
                    </>
                  )}
                </div>
              </div>

              <div className="ppc-movements__row">
                <PpcActionButton
                  label={ppcT('InstallationApp.GoToCell', 'Vai a cella')}
                  onClick={handleMoveToCell}
                />
                <PpcFormField
                  label={ppcT('InstallationApp.Cell', 'Cella')}
                  value={cellId}
                  onChange={setCellId}
                />
                <div />
              </div>

              <div className="ppc-movements__row">
                <PpcActionButton
                  label={ppcT('InstallationApp.GoToHeight', 'Vai a quota')}
                  onClick={handleMoveToHeight}
                />
                <PpcFormField
                  label={ppcT('InstallationApp.Height', 'Altezza')}
                  value={targetHeight}
                  onChange={setTargetHeight}
                />
                <div />
              </div>

              <div className="ppc-movements__row ppc-movements__row--wide">
                <PpcActionButton
                  label={ppcT('InstallationApp.ChainCalibration', 'Calibrazione catena')}
                  onClick={handleTuningChain}
                />
                <PpcActionButton
                  label={ppcT('InstallationApp.VerticalCalibration', 'Calibrazione verticale')}
                  onClick={handleVerticalCalibration}
                />
              </div>

              {bay?.BayPistonBlock && (
                <div className="ppc-movements__row ppc-movements__row--wide">
                  <PpcActionButton
                    label={ppcT('InstallationApp.BlockUDC', 'Blocca UDC')}
                    onClick={handleBlockUdc}
                  />
                  <PpcActionButton
                    label={ppcT('InstallationApp.FreeUDC', 'Libera UDC')}
                    onClick={handleFreeUdc}
                  />
                </div>
              )}

              {(hasShutter || hasCarousel || hasExternalBay) && (
                <div className="ppc-movements__row ppc-movements__row--wide">
                  {hasShutter && (
                    <div className="ppc-movements__button-group">
                      <PpcActionButton
                        label={ppcT('InstallationApp.ShutterOpen', 'Aperta')}
                        onClick={handleOpenShutter}
                      />
                      {canShowIntermediateShutter && (
                        <PpcActionButton
                          label={ppcT('InstallationApp.ShutterMidWay', 'A meta via')}
                          onClick={handleIntermediateShutter}
                        />
                      )}
                      {canShowClosedShutter && (
                        <PpcActionButton
                          label={ppcT('InstallationApp.ShutterClosed', 'Chiusa')}
                          onClick={handleClosedShutter}
                        />
                      )}
                    </div>
                  )}
                  {hasCarousel && (
                    <PpcActionButton
                      label={ppcT('InstallationApp.BayCalibration', 'Calibrazione baia')}
                      onClick={handleTuneBay}
                    />
                  )}
                  {hasExternalBay && (
                    <PpcActionButton
                      label={ppcT('InstallationApp.ExtBayCalibration', 'Calibrazione baia esterna')}
                      onClick={handleTuneExtBay}
                    />
                  )}
                </div>
              )}

              {hasCarousel && (
                <div className="ppc-movements__row ppc-movements__row--wide">
                  <PpcActionButton
                    label={ppcT('InstallationApp.CarouselUp', 'Giostra su')}
                    onClick={handleCarouselUp}
                  />
                  <PpcActionButton
                    label={ppcT('InstallationApp.CarouselDown', 'Giostra giu')}
                    onClick={handleCarouselDown}
                  />
                </div>
              )}

              {hasExternalBay && (
                <div className="ppc-movements__row ppc-movements__row--wide">
                  <PpcActionButton
                    label={ppcT('InstallationApp.ExtBayTowardOperator', 'Verso operatore')}
                    onClick={handleExternalBayTowardOperator}
                  />
                  <PpcActionButton
                    label={ppcT('InstallationApp.ExtBayTowardMachine', 'Verso macchina')}
                    onClick={handleExternalBayTowardMachine}
                  />
                  <PpcActionButton
                    label={ppcT('InstallationApp.ExtBayMovementForExtraction', 'Movimento per estrazione')}
                    onClick={handleExternalBayExtract}
                  />
                  <PpcActionButton
                    label={ppcT('InstallationApp.ExtBayMovementForInsertion', 'Movimento per inserimento')}
                    onClick={handleExternalBayInsert}
                  />
                </div>
              )}
            </div>
          )}

          {mode === 'manual' && (
            <div className="ppc-movements__panel">
              <div className="ppc-movements__manual-grid">
                <div className="ppc-movements__manual-block">
                  <div className="ppc-movements__block-title">
                    {ppcT('InstallationApp.Elevator', 'Elevatore')}
                  </div>
                  <div className="ppc-movements__manual-buttons">
                    <button
                      type="button"
                      className="ppc-movements__hold"
                      onPointerDown={() => ppcAutomationService.moveElevatorVerticalManual(VerticalMovementDirection.Up)}
                      onPointerUp={handleStopAll}
                      onPointerLeave={handleStopAll}
                      onPointerCancel={handleStopAll}
                    >
                      {ppcT('InstallationApp.ElevatorUp', 'Su')}
                    </button>
                    <button
                      type="button"
                      className="ppc-movements__hold"
                      onPointerDown={() => ppcAutomationService.moveElevatorVerticalManual(VerticalMovementDirection.Down)}
                      onPointerUp={handleStopAll}
                      onPointerLeave={handleStopAll}
                      onPointerCancel={handleStopAll}
                    >
                      {ppcT('InstallationApp.ElevatorDown', 'Giu')}
                    </button>
                    <button
                      type="button"
                      className="ppc-movements__hold"
                      onPointerDown={() => ppcAutomationService.moveElevatorHorizontalManual(HorizontalMovementDirection.Backwards)}
                      onPointerUp={handleStopAll}
                      onPointerLeave={handleStopAll}
                      onPointerCancel={handleStopAll}
                    >
                      {ppcT('InstallationApp.ElevatorBack', 'Indietro')}
                    </button>
                    <button
                      type="button"
                      className="ppc-movements__hold"
                      onPointerDown={() => ppcAutomationService.moveElevatorHorizontalManual(HorizontalMovementDirection.Forwards)}
                      onPointerUp={handleStopAll}
                      onPointerLeave={handleStopAll}
                      onPointerCancel={handleStopAll}
                    >
                      {ppcT('InstallationApp.ElevatorForwards', 'Avanti')}
                    </button>
                  </div>
                </div>

                {hasCarousel && (
                  <div className="ppc-movements__manual-block">
                    <div className="ppc-movements__block-title">
                      {ppcT('InstallationApp.Carousel', 'Carousel')}
                    </div>
                    <div className="ppc-movements__manual-buttons">
                      <button
                        type="button"
                        className="ppc-movements__hold"
                        onPointerDown={() => ppcAutomationService.moveCarousel(VerticalMovementDirection.Up, MovementCategory.Manual)}
                        onPointerUp={handleStopAll}
                        onPointerLeave={handleStopAll}
                        onPointerCancel={handleStopAll}
                      >
                        {ppcT('InstallationApp.CarouselUp', 'Apri')}
                      </button>
                      <button
                        type="button"
                        className="ppc-movements__hold"
                        onPointerDown={() => ppcAutomationService.moveCarousel(VerticalMovementDirection.Down, MovementCategory.Manual)}
                        onPointerUp={handleStopAll}
                        onPointerLeave={handleStopAll}
                        onPointerCancel={handleStopAll}
                      >
                        {ppcT('InstallationApp.CarouselDown', 'Chiudi')}
                      </button>
                    </div>
                  </div>
                )}

                {hasExternalBay && (
                  <div className="ppc-movements__manual-block">
                    <div className="ppc-movements__block-title">
                      {ppcT('InstallationApp.ExternalBay', 'Baia esterna')}
                    </div>
                    <div className="ppc-movements__manual-buttons">
                      <button
                        type="button"
                        className="ppc-movements__hold"
                        onPointerDown={() => ppcAutomationService.moveExternalBay(
                          ExternalBayMovementDirection.TowardOperator,
                          MovementCategory.Manual,
                          resolveExternalBayUpper(),
                          isPolicyBypassed
                        )}
                        onPointerUp={handleStopAll}
                        onPointerLeave={handleStopAll}
                        onPointerCancel={handleStopAll}
                      >
                        {ppcT('InstallationApp.ExtBayTowardOperator', 'Verso operatore')}
                      </button>
                      <button
                        type="button"
                        className="ppc-movements__hold"
                        onPointerDown={() => ppcAutomationService.moveExternalBay(
                          ExternalBayMovementDirection.TowardMachine,
                          MovementCategory.Manual,
                          resolveExternalBayUpper(),
                          isPolicyBypassed
                        )}
                        onPointerUp={handleStopAll}
                        onPointerLeave={handleStopAll}
                        onPointerCancel={handleStopAll}
                      >
                        {ppcT('InstallationApp.ExtBayTowardMachine', 'Verso macchina')}
                      </button>
                    </div>
                  </div>
                )}

                {hasShutter && (
                  <div className="ppc-movements__manual-block">
                    <div className="ppc-movements__block-title">
                      {ppcT('InstallationApp.Shutter', 'Saracinesca')}
                    </div>
                    <div className="ppc-movements__manual-buttons">
                      <button
                        type="button"
                        className="ppc-movements__hold"
                        onPointerDown={() => ppcAutomationService.moveShutter(ShutterMovementDirection.Up)}
                        onPointerUp={handleStopAll}
                        onPointerLeave={handleStopAll}
                        onPointerCancel={handleStopAll}
                      >
                        {ppcT('InstallationApp.ShutterUp', 'Su')}
                      </button>
                      <button
                        type="button"
                        className="ppc-movements__hold"
                        onPointerDown={() => ppcAutomationService.moveShutter(ShutterMovementDirection.Down)}
                        onPointerUp={handleStopAll}
                        onPointerLeave={handleStopAll}
                        onPointerCancel={handleStopAll}
                      >
                        {ppcT('InstallationApp.ShutterDown', 'Giu')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {mode === 'operator' && (
            <div className="ppc-movements__panel">
              <div className="ppc-movements__operator">
                <div className="ppc-movements__operator-block">
                  <div className="ppc-movements__block-title">
                    {ppcT('OperatorApp.VerticalAxis', 'Asse verticale')}
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1000}
                    value={verticalSpeed ?? 0}
                    onChange={(event) => setVerticalSpeed(Number(event.target.value))}
                  />
                  <div className="ppc-movements__operator-value">{verticalSpeed ?? '--'}</div>
                </div>
                <div className="ppc-movements__operator-block">
                  <div className="ppc-movements__block-title">
                    {ppcT('OperatorApp.HorizontalAxis', 'Asse orizzontale')}
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1000}
                    value={horizontalSpeed ?? 0}
                    onChange={(event) => setHorizontalSpeed(Number(event.target.value))}
                  />
                  <div className="ppc-movements__operator-value">{horizontalSpeed ?? '--'}</div>
                </div>
              </div>
              <div className="ppc-movements__operator-actions">
                <PpcActionButton label={ppcT('General.Save', 'Salva')} onClick={handleSaveSpeeds} />
              </div>
            </div>
          )}

          <div className="ppc-movements__footer">
            <div className="ppc-movements__footer-left">
              {isOperator ? (
                <PpcActionButton
                  label={ppcT('InstallationApp.Reset', 'Reset missioni')}
                  onClick={handleResetMissions}
                />
              ) : (
                <>
                  <PpcActionButton
                    label={ppcT('InstallationApp.ResetMachine', 'Reset macchina')}
                    onClick={handleResetMachine}
                  />
                  <PpcActionButton
                    label={ppcT('InstallationApp.Reset', 'Reset missioni')}
                    onClick={handleResetMissions}
                  />
                </>
              )}
            </div>
            <div className="ppc-movements__footer-center">
              <PpcActionButton label={ppcT('InstallationApp.Stop', 'Stop')} tone="warning" onClick={handleStopAll} />
            </div>
            <div className="ppc-movements__footer-right">
              <PpcActionButton
                label={lightOn ? 'Luce ON' : 'Luce OFF'}
                onClick={handleToggleLight}
                className={lightOn ? 'is-active' : undefined}
              />
              {mode === 'manual' && (
                <PpcActionButton
                  label={isPolicyBypassed ? 'Bypass ON' : 'Bypass OFF'}
                  onClick={() => setIsPolicyBypassed((prev) => !prev)}
                  className={isPolicyBypassed ? 'is-danger' : undefined}
                />
              )}
              <PpcActionButton label={ppcT('InstallationApp.SecuritySensors', 'Sensori')} onClick={() => window.location.assign('/ppc/installation/other-sensors')} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PpcMovementsPage;
