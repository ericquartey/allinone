import { useEffect } from 'react';
import { useAppDispatch } from '../app/hooks';
import { ppcAutomationApi } from '../services/api/ppcAutomationApi';
import { ppcAutomationHubService } from '../services/ppc/automationHub';

const EVENT_TAGS: Record<string, string[]> = {
  AssignedMissionChanged: ['LoadingUnits', 'Cells', 'Missions'],
  AssignedMissionOperationChanged: ['LoadingUnits', 'Missions'],
  BayStatusChanged: ['Bay'],
  ErrorStatusChanged: ['Errors'],
  ProductsChanged: ['LoadingUnits', 'Missions'],
  SetBayDrawerOperationToInventory: ['LoadingUnits'],
  SetBayDrawerOperationToPick: ['LoadingUnits'],
  SetBayDrawerOperationToRefill: ['LoadingUnits'],
  SetBayDrawerOperationToWaiting: ['LoadingUnits'],
  BayChainPositionChanged: ['Bay'],
  BayLightChanged: ['BayLight'],
  CurrentPositionChanged: ['ElevatorPosition'],
  DiagOutChanged: ['Sensors'],
  ElevatorPositionChanged: ['ElevatorPosition', 'LoadingUnits'],
  FsmException: ['Errors'],
  HomingProcedureStatusChanged: ['MachineMode'],
  MachineModeChanged: ['MachineMode'],
  MachinePowerChanged: ['MachinePower'],
  MachineStateActiveNotify: ['MachineMode'],
  MachineStatusActiveNotify: ['MachinePower'],
  MoveLoadingUnit: ['LoadingUnits', 'Cells'],
  PositioningNotify: ['ElevatorPosition'],
  PowerEnableNotify: ['MachinePower'],
  ResolutionCalibrationNotify: ['MachineConfig'],
  SensorsChanged: ['Sensors'],
  ShutterPositioningNotify: ['Bay'],
  SocketLinkAlphaNumericBarChange: ['Accessories'],
  SocketLinkLaserPointerChange: ['Accessories'],
  SocketLinkOperationChange: ['LoadingUnits'],
  SwitchAxisNotify: ['ElevatorPosition'],
  SystemTimeChanged: ['Identity'],
};

export const usePpcAutomationHub = (): void => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const connect = async () => {
      try {
        await ppcAutomationHubService.connect();
        unsubscribe = ppcAutomationHubService.onEvent((eventName) => {
          const tags = EVENT_TAGS[eventName];
          if (!tags || tags.length === 0) {
            return;
          }
          dispatch(ppcAutomationApi.util.invalidateTags(tags));
        });
      } catch (error) {
        console.error('[PPC MAS HUB] Connection failed:', error);
      }
    };

    connect();

    return () => {
      if (unsubscribe) unsubscribe();
      ppcAutomationHubService.disconnect();
    };
  }, [dispatch]);
};

export default usePpcAutomationHub;
