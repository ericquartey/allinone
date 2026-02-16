import ppcAutomationClient from './automationClient';
import { PPC_BAY_NUMBER } from '../../config/api';
import type {
  Bay,
  BayAccessories,
  ElevatorPosition,
  Cell,
  LoadingUnit,
  LoadingUnitLocation,
  MachineConfig,
  MachineError,
  MachineIdentity,
  MachineMode,
  MachinePowerState,
  Mission,
  MovementCategory,
  Orientation,
  SetupStatusCapabilities,
  RepeatedTestProcedure,
  SetupProcedure,
  OffsetCalibrationProcedure,
  VerticalResolutionCalibrationProcedure,
  HomingProcedureParameters,
  BayProfileCheckProcedure,
  PositioningProcedure,
  WeightMeasurement,
  WeightData,
  ExternalBayMovementDirection,
  HorizontalMovementDirection,
  ShutterPosition,
  ShutterMovementDirection,
  VerticalMovementDirection,
  WeightingScaleModelNumber,
  UserParameters,
} from './automationTypes';

export const ppcAutomationService = {
  getIdentity: async () => {
    const response = await ppcAutomationClient.get<MachineIdentity>('/api/identity');
    return response.data;
  },
  getMachineMode: async () => {
    const response = await ppcAutomationClient.get<MachineMode>('/api/mode');
    return response.data;
  },
  getMachinePower: async () => {
    const response = await ppcAutomationClient.get<MachinePowerState>('/api/power');
    return response.data;
  },
  setMachineAutomatic: async () => {
    await ppcAutomationClient.post('/api/mode/automatic');
  },
  setMachineManual: async () => {
    await ppcAutomationClient.post('/api/mode/manual');
  },
  powerOn: async () => {
    await ppcAutomationClient.post('/api/power/power-on');
  },
  powerOff: async () => {
    await ppcAutomationClient.post('/api/power/power-off');
  },
  getWmsEnabled: async () => {
    const response = await ppcAutomationClient.get<boolean>('/api/wms/status/enabled');
    return response.data;
  },
  getAccessories: async (bayNumber?: number) => {
    const response = await ppcAutomationClient.get<BayAccessories>('/api/accessories', {
      params: bayNumber ? { bayNumber } : undefined,
    });
    return response.data;
  },
  getAlphaNumericBarMovement: async () => {
    const response = await ppcAutomationClient.get<boolean>('/api/identity/get/AlphaNumericBarMovement');
    return response.data;
  },
  setAlphaNumericBarMovement: async (value: boolean) => {
    await ppcAutomationClient.post('/api/identity/set/AlphaNumericBarMovement', null, {
      params: { value },
    });
  },
  updateAlphaNumericBar: async (payload: {
    isEnabled: boolean;
    ipAddress: string;
    port: number;
    size: number;
    maxMessageLength: number;
    clearOnClose: boolean;
    useGet: boolean;
    messageFields: string[];
  }) => {
    const { messageFields, ...params } = payload;
    await ppcAutomationClient.put('/api/accessories/alpha-numeric-bar', messageFields, { params });
  },
  updateBarcodeReaderSettings: async (payload: { isEnabled: boolean; portName: string }) => {
    await ppcAutomationClient.put('/api/accessories/barcode-reader', null, { params: payload });
  },
  updateCardReaderSettings: async (payload: {
    isEnabled: boolean;
    tokenRegex: string;
    isLocal: boolean;
  }) => {
    await ppcAutomationClient.put('/api/accessories/card-reader', null, { params: payload });
  },
  updateLabelPrinterSettings: async (payload: { isEnabled: boolean; printerName: string }) => {
    await ppcAutomationClient.put('/api/accessories/laber-printer', null, { params: payload });
  },
  updateLaserPointer: async (payload: {
    isEnabled: boolean;
    ipAddress: string;
    port: number;
    xOffset: number;
    yOffset: number;
    zOffsetLowerPosition: number;
    zOffsetUpperPosition: number;
    ignoreItemHeight: boolean;
  }) => {
    await ppcAutomationClient.put('/api/accessories/laser-pointer', null, { params: payload });
  },
  updateTokenReaderSettings: async (payload: { isEnabled: boolean; portName: string }) => {
    await ppcAutomationClient.put('/api/accessories/token-reader', null, { params: payload });
  },
  updateWeightingScaleSettings: async (payload: {
    isEnabled: boolean;
    ipAddress: string;
    port: number;
    modelNumber: WeightingScaleModelNumber;
  }) => {
    await ppcAutomationClient.put('/api/accessories/weighting-scale', null, { params: payload });
  },
  printLabelTestPage: async (bayNumber?: number) => {
    await ppcAutomationClient.put('/api/accessories/print-test-page', null, {
      params: bayNumber ? { bayNumber } : undefined,
    });
  },
  getCurrentErrors: async () => {
    const response = await ppcAutomationClient.get<MachineError[]>('/api/errors/current');
    return response.data;
  },
  resolveError: async (id: number) => {
    await ppcAutomationClient.post(`/api/errors/${id}/resolve`);
  },
  resolveAllErrors: async () => {
    await ppcAutomationClient.post('/api/errors/resolveall');
  },
  getCells: async () => {
    const response = await ppcAutomationClient.get<Cell[]>('/api/cells');
    return response.data;
  },
  getSensors: async () => {
    const response = await ppcAutomationClient.get<boolean[]>('/api/sensors');
    return response.data;
  },
  getSensorsOutFault: async () => {
    const response = await ppcAutomationClient.get<boolean[]>('/api/sensors/out-fault');
    return response.data;
  },
  getSensorsOutCurrent: async () => {
    const response = await ppcAutomationClient.get<number[]>('/api/sensors/out-current');
    return response.data;
  },
  getSensitiveEdgeAlarmEnable: async () => {
    const response = await ppcAutomationClient.post<boolean>('/api/identity/get/SensitiveEdgeAlarm/enable');
    return response.data;
  },
  getSensitiveCarpetsAlarmEnable: async () => {
    const response = await ppcAutomationClient.post<boolean>('/api/identity/get/SensitiveCarpetsAlarm/enable');
    return response.data;
  },
  setSensitiveEdgeBypass: async (value: boolean) => {
    await ppcAutomationClient.post('/api/identity/set/SensitiveEdgeBypass', null, { params: { value } });
  },
  setSensitiveCarpetsBypass: async (value: boolean) => {
    await ppcAutomationClient.post('/api/identity/set/SensitiveCarpetsBypass', null, { params: { value } });
  },
  getBay: async (bayNumber: number) => {
    const response = await ppcAutomationClient.get<Bay>(`/api/bays/${bayNumber}`);
    return response.data;
  },
  getBays: async () => {
    const response = await ppcAutomationClient.get<Bay[]>('/api/bays');
    return response.data;
  },
  getBayLight: async () => {
    const response = await ppcAutomationClient.post<boolean>('/api/bays/get-light');
    return response.data;
  },
  setBayLight: async (enable: boolean, forced: boolean) => {
    await ppcAutomationClient.post('/api/bays/set-light', null, {
      params: { enable, forced },
    });
  },
  getElevatorPosition: async () => {
    const response = await ppcAutomationClient.get<ElevatorPosition>('/api/elevator/position');
    return response.data;
  },
  getVerticalOffset: async () => {
    const response = await ppcAutomationClient.get<number>('/api/elevator/vertical/offset');
    return response.data;
  },
  getLoadingUnitOnBoard: async () => {
    const response = await ppcAutomationClient.get<LoadingUnit>('/api/elevator/loading-unit-on-board');
    return response.data;
  },
  getLoadingUnitById: async (id: number) => {
    const response = await ppcAutomationClient.get<LoadingUnit>('/api/loading-units/get-unit-by-id', {
      params: { id },
    });
    return response.data;
  },
  getLoadingUnits: async () => {
    const response = await ppcAutomationClient.get<LoadingUnit[]>('/api/loading-units');
    return response.data;
  },
  moveLoadingUnitToBay: async (loadingUnitId: number, userName?: string) => {
    const params = {
      machineId: PPC_BAY_NUMBER,
      loadingUnitId,
      ...(userName ? { userName } : {}),
    };
    try {
      await ppcAutomationClient.post('/api/loading-units/send-loadingunit-in-bay', null, {
        params,
      });
    } catch (error) {
      await ppcAutomationClient.post(`/api/loading-units/${loadingUnitId}/move-to-bay`, null, {
        params: userName ? { userName } : undefined,
      });
    }
  },
  startMovingLoadingUnitToBay: async (loadingUnitId: number, destination: LoadingUnitLocation) => {
    await ppcAutomationClient.post('/api/loading-units/start-moving-loading-unit-to-bay', null, {
      params: { loadingUnitId, destination },
    });
  },
  startMovingLoadingUnitToCell: async (loadingUnitId: number, destinationCellId?: number | null) => {
    await ppcAutomationClient.post('/api/loading-units/start-moving-loading-unit-to-cell', null, {
      params: { loadingUnitId, destinationCellId },
    });
  },
  insertLoadingUnit: async (source: LoadingUnitLocation, destinationCellId: number | null | undefined, loadingUnitId: number) => {
    await ppcAutomationClient.post('/api/loading-units/insert-loading-unit', null, {
      params: { source, destinationCellId, loadingUnitId },
    });
  },
  ejectLoadingUnit: async (destination: LoadingUnitLocation, loadingUnitId: number) => {
    await ppcAutomationClient.post('/api/loading-units/eject-loading-unit', null, {
      params: { destination, loadingUnitId },
    });
  },
  moveElevatorToBayPosition: async (bayPositionId: number, computeElongation: boolean, performWeighting: boolean) => {
    await ppcAutomationClient.post('/api/elevator/vertical/move-to-bay-position', null, {
      params: { bayPositionId, computeElongation, performWeighting },
    });
  },
  moveElevatorToCell: async (cellId: number, computeElongation: boolean, performWeighting: boolean) => {
    await ppcAutomationClient.post('/api/elevator/vertical/move-to-cell', null, {
      params: { cellId, computeElongation, performWeighting },
    });
  },
  moveElevatorToFreeCell: async (loadUnitId: number, computeElongation: boolean, performWeighting: boolean) => {
    await ppcAutomationClient.post('/api/elevator/vertical/move-to-free-cell', null, {
      params: { loadUnitId, computeElongation, performWeighting },
    });
  },
  moveElevatorToHeight: async (targetPosition: number, performWeighting: boolean, loadUnitId?: number) => {
    await ppcAutomationClient.post('/api/elevator/vertical/move-to', null, {
      params: { targetPosition, performWeighting, loadUnitId },
    });
  },
  moveElevatorVerticalManual: async (direction: VerticalMovementDirection) => {
    await ppcAutomationClient.post('/api/elevator/vertical/manual-move', null, {
      params: { direction },
    });
  },
  moveElevatorHorizontalManual: async (direction: HorizontalMovementDirection) => {
    await ppcAutomationClient.post('/api/elevator/horizontal/move-manual', null, {
      params: { direction },
    });
  },
  loadFromBay: async (bayPositionId: number) => {
    await ppcAutomationClient.post('/api/elevator/horizontal/load-from-bay', null, {
      params: { bayPositionId },
    });
  },
  unloadToBay: async (bayPositionId: number) => {
    await ppcAutomationClient.post('/api/elevator/horizontal/unload-to-bay', null, {
      params: { bayPositionId },
    });
  },
  loadFromCell: async (cellId: number) => {
    await ppcAutomationClient.post('/api/elevator/horizontal/load-from-cell', null, {
      params: { cellId },
    });
  },
  unloadToCell: async (cellId: number) => {
    await ppcAutomationClient.post('/api/elevator/horizontal/unload-to-cell', null, {
      params: { cellId },
    });
  },
  moveCarousel: async (direction: VerticalMovementDirection, category: MovementCategory) => {
    const endpoint = category === MovementCategory.Manual ? '/api/carousel/move-manual' : '/api/carousel/move-assisted';
    await ppcAutomationClient.post(endpoint, null, {
      params: { direction },
    });
  },
  moveExternalBay: async (
    direction: ExternalBayMovementDirection,
    category: MovementCategory,
    isPositionUpper: boolean,
    bypass = false
  ) => {
    if (category === MovementCategory.Manual) {
      const endpoint = isPositionUpper ? '/api/externalbay/move-manual-double' : '/api/externalbay/move-manual';
      await ppcAutomationClient.post(endpoint, null, {
        params: { direction, bypass },
      });
      return;
    }
    if (isPositionUpper) {
      await ppcAutomationClient.post('/api/externalbay/move-assisted-ext-bay', null, {
        params: { direction, isPositionUpper },
      });
      return;
    }
    await ppcAutomationClient.post('/api/externalbay/move-assisted', null, {
      params: { direction },
    });
  },
  moveShutter: async (direction: ShutterMovementDirection) => {
    await ppcAutomationClient.post('/api/shutters/move', null, {
      params: { direction },
    });
  },
  moveShutterToPosition: async (targetPosition: ShutterPosition) => {
    await ppcAutomationClient.post('/api/shutters/moveTo', null, {
      params: { targetPosition },
    });
  },
  findHorizontalZero: async () => {
    await ppcAutomationClient.post('/api/elevator/horizontal/find-lost-zero');
  },
  startVerticalOriginProcedure: async () => {
    await ppcAutomationClient.post('/api/setup/VerticalOriginProcedure/start');
  },
  tuneCarousel: async () => {
    await ppcAutomationClient.post('/api/carousel/find-zero');
  },
  tuneExternalBay: async () => {
    await ppcAutomationClient.post('/api/externalbay/find-zero');
  },
  moveExternalBayForInsertion: async (isUpperPosition: boolean) => {
    await ppcAutomationClient.post('/api/externalbay/move-for-insertion', null, {
      params: { isUpperPosition },
    });
  },
  moveExternalBayForExtraction: async (isUpperPosition: boolean) => {
    await ppcAutomationClient.post('/api/externalbay/move-for-extraction', null, {
      params: { isUpperPosition },
    });
  },
  blockUdc: async (bayNumber: number) => {
    await ppcAutomationClient.post('/api/bays/set/SendBlockComandBay', null, {
      params: { bayNumber },
    });
  },
  freeUdc: async (bayNumber: number) => {
    await ppcAutomationClient.post('/api/bays/set/SendFreeComandBay', null, {
      params: { bayNumber },
    });
  },
  resetPistonUdc: async (bayNumber: number) => {
    await ppcAutomationClient.post('/api/bays/set/SendResetPistonBay', null, {
      params: { bayNumber },
    });
  },
  stopAllMovements: async () => {
    await Promise.allSettled([
      ppcAutomationClient.post('/api/elevator/stop'),
      ppcAutomationClient.post('/api/carousel/stop'),
      ppcAutomationClient.post('/api/externalbay/stop'),
      ppcAutomationClient.post('/api/shutters/stop'),
    ]);
  },
  resetMachine: async (force: boolean) => {
    await ppcAutomationClient.post('/api/missions/reset-machine', null, {
      params: { force },
    });
  },
  resetMissions: async () => {
    const response = await ppcAutomationClient.get<Mission[]>('/api/missions');
    await Promise.allSettled(
      response.data.map((mission) =>
        ppcAutomationClient.get('/api/loading-units/abort-moving', {
          params: {
            missionId: mission.Id,
            targetBay: mission.TargetBay ?? 0,
          },
        })
      )
    );
  },
  abortMission: async (missionId: number, targetBay?: number | null) => {
    await ppcAutomationClient.get('/api/loading-units/abort-moving', {
      params: {
        missionId,
        targetBay,
      },
    });
  },
  abortMissions: async (missions: Array<{ Id?: number; TargetBay?: number | null }>) => {
    await Promise.all(
      missions.map((mission) =>
        mission.Id
          ? ppcAutomationClient.get('/api/loading-units/abort-moving', {
              params: {
                missionId: mission.Id,
                targetBay: mission.TargetBay ?? 0,
              },
            })
          : Promise.resolve()
      )
    );
  },
  getMachineConfig: async () => {
    const response = await ppcAutomationClient.post<MachineConfig>('/api/configuration/get/machine');
    return response.data;
  },
  updateMachineConfig: async (config: MachineConfig) => {
    await ppcAutomationClient.post('/api/configuration/update-parameter', config);
  },
  getSetupStatus: async () => {
    const response = await ppcAutomationClient.get<SetupStatusCapabilities>('/api/setup/setup-status');
    return response.data;
  },
  bypassSetupStep: async (step: string) => {
    await ppcAutomationClient.post(`/api/setup/setup-status/${step}`);
  },
  confirmSetup: async () => {
    await ppcAutomationClient.post('/api/servicing/confirm-setup');
  },
  getWeightAnalysisParameters: async (orientation: Orientation) => {
    const response = await ppcAutomationClient.get<SetupProcedure>('/api/setup/WeightAnalysisProcedure/parameters', {
      params: { orientation },
    });
    return response.data;
  },
  startWeightAnalysis: async (payload: { displacement: number; netWeight: number; loadingUnitId?: number | null }) => {
    const { displacement, netWeight, loadingUnitId } = payload;
    await ppcAutomationClient.post('/api/setup/WeightAnalysisProcedure/start', null, {
      params: {
        displacement,
        netWeight,
        loadingUnitId: loadingUnitId ?? undefined,
      },
    });
  },
  stopWeightAnalysis: async () => {
    await ppcAutomationClient.post('/api/setup/WeightAnalysisProcedure/stop');
  },
  getVerticalOriginParameters: async () => {
    const response = await ppcAutomationClient.get<HomingProcedureParameters>('/api/setup/VerticalOriginProcedure/parameters');
    return response.data;
  },
  stopVerticalOriginProcedure: async () => {
    await ppcAutomationClient.post('/api/setup/VerticalOriginProcedure/stop');
  },
  getVerticalOffsetParameters: async () => {
    const response = await ppcAutomationClient.get<OffsetCalibrationProcedure>('/api/setup/VerticalOffsetProcedure/parameters');
    return response.data;
  },
  moveVerticalOffsetUp: async () => {
    await ppcAutomationClient.post('/api/setup/VerticalOffsetProcedure/move-up');
  },
  moveVerticalOffsetDown: async () => {
    await ppcAutomationClient.post('/api/setup/VerticalOffsetProcedure/move-down');
  },
  updateVerticalOffset: async (newOffset: number) => {
    await ppcAutomationClient.post('/api/setup/VerticalOffsetProcedure/update-vertical-offset', null, {
      params: { newOffset },
    });
  },
  updateVerticalOffsetAndComplete: async (newOffset: number) => {
    await ppcAutomationClient.post('/api/setup/VerticalOffsetProcedure/update-vertical-offset-and-complete', null, {
      params: { newOffset },
    });
  },
  completeVerticalOffsetProcedure: async () => {
    await ppcAutomationClient.post('/api/setup/VerticalOffsetProcedure/complete');
  },
  getVerticalResolutionParameters: async () => {
    const response = await ppcAutomationClient.get<VerticalResolutionCalibrationProcedure>(
      '/api/setup/VerticalResolutionCalibrationProcedure/parameters'
    );
    return response.data;
  },
  getAdjustedVerticalResolution: async (measuredDistance: number, expectedDistance: number) => {
    const response = await ppcAutomationClient.get<number>('/api/setup/VerticalResolutionCalibrationProcedure/adjusted-resolution', {
      params: { measuredDistance, expectedDistance },
    });
    return response.data;
  },
  updateVerticalResolution: async (newResolution: number) => {
    await ppcAutomationClient.post('/api/elevator/vertical/resolution', null, {
      params: { newResolution },
    });
  },
  getBeltBurnishingParameters: async () => {
    const response = await ppcAutomationClient.get<RepeatedTestProcedure>('/api/setup/BeltBurnishingProcedure/parameters');
    return response.data;
  },
  resetBeltBurnishing: async () => {
    await ppcAutomationClient.post('/api/setup/BeltBurnishingProcedure/reset');
  },
  startBeltBurnishing: async (payload: { upperPosition: number; lowerPosition: number; delayStart: number }) => {
    const { upperPosition, lowerPosition, delayStart } = payload;
    await ppcAutomationClient.post('/api/setup/BeltBurnishingProcedure/start', null, {
      params: { upperPosition, lowerPosition, delayStart },
    });
  },
  stopBeltBurnishing: async () => {
    await ppcAutomationClient.post('/api/setup/BeltBurnishingProcedure/stop');
  },
  getProfileParameters: async () => {
    const response = await ppcAutomationClient.get<BayProfileCheckProcedure>('/api/ProfileProcedure/parameters');
    return response.data;
  },
  startProfileCalibration: async (bayPositionId: number) => {
    await ppcAutomationClient.post('/api/ProfileProcedure/calibration', null, {
      params: { bayPositionId },
    });
  },
  startProfileResolution: async (bayPositionId: number) => {
    await ppcAutomationClient.post('/api/ProfileProcedure/resolution', null, {
      params: { bayPositionId },
    });
  },
  saveProfile: async () => {
    await ppcAutomationClient.post('/api/ProfileProcedure/save');
  },
  stopProfile: async () => {
    await ppcAutomationClient.post('/api/ProfileProcedure/stop');
  },
  updateBayProfileConstants: async (k0: number, k1: number) => {
    await ppcAutomationClient.post('/api/bays/set-profile-const-bay', null, {
      params: { k0, k1 },
    });
  },
  updateBayHeight: async (position: number, height: number) => {
    await ppcAutomationClient.post('/api/bays/height', null, {
      params: { position, height },
    });
  },
  getCarouselParameters: async () => {
    const response = await ppcAutomationClient.get<RepeatedTestProcedure>('/api/carousel/parameters');
    return response.data;
  },
  getCarouselPosition: async () => {
    const response = await ppcAutomationClient.get<number>('/api/carousel/position');
    return response.data;
  },
  startCarouselCalibration: async () => {
    await ppcAutomationClient.post('/api/carousel/start-calibration');
  },
  stopCarouselCalibration: async () => {
    await ppcAutomationClient.post('/api/carousel/stop-calibration');
  },
  resetCarouselCalibration: async () => {
    await ppcAutomationClient.post('/api/carousel/reset-calibration');
  },
  setCarouselCalibrationCompleted: async () => {
    await ppcAutomationClient.post('/api/carousel/set-completed');
  },
  updateCarouselElevatorDistance: async (value: number) => {
    await ppcAutomationClient.post('/api/carousel/update-elevator-distance', null, {
      params: { value },
    });
  },
  getExternalBayParameters: async () => {
    const response = await ppcAutomationClient.get<RepeatedTestProcedure>('/api/externalbay/parameters');
    return response.data;
  },
  getExternalBayPosition: async () => {
    const response = await ppcAutomationClient.get<number>('/api/externalbay/position');
    return response.data;
  },
  startExternalBayCalibration: async () => {
    await ppcAutomationClient.post('/api/externalbay/start-calibration');
  },
  stopExternalBayCalibration: async () => {
    await ppcAutomationClient.post('/api/externalbay/stop-calibration');
  },
  resetExternalBayCalibration: async () => {
    await ppcAutomationClient.post('/api/externalbay/reset-calibration');
  },
  setExternalBayCalibrationCompleted: async () => {
    await ppcAutomationClient.post('/api/externalbay/set-completed');
  },
  updateExternalBayResolution: async (newRace: number) => {
    await ppcAutomationClient.post('/api/externalbay/update-resolution', null, {
      params: { newRace },
    });
  },
  updateExternalBayRaceDistance: async (value: number) => {
    await ppcAutomationClient.post('/api/externalbay/update-race-distance', null, {
      params: { value },
    });
  },
  updateExternalBayExtraRaceDistance: async (value: number) => {
    await ppcAutomationClient.post('/api/externalbay/update-extra-race-distance', null, {
      params: { value },
    });
  },
  updateExternalBayCycle: async (cycle: number) => {
    await ppcAutomationClient.post('/api/externalbay/update-cycle', null, {
      params: { cycle },
    });
  },
  startExternalBayDoubleTest: async (payload: {
    direction: ExternalBayMovementDirection;
    isPositionUpper: boolean;
    checkUdcPresence: boolean;
  }) => {
    const { direction, isPositionUpper, checkUdcPresence } = payload;
    await ppcAutomationClient.post('/api/externalbay/start-double-ext-movements', null, {
      params: { direction, isPositionUpper, checkUdcPresence },
    });
  },
  getShutterTestParameters: async () => {
    const response = await ppcAutomationClient.get<RepeatedTestProcedure>('/api/shutters/test-parameters');
    return response.data;
  },
  runShutterTest: async (delayInSeconds: number, testCycleCount: number) => {
    await ppcAutomationClient.post('/api/shutters/run-test', null, {
      params: { delayInSeconds, testCycleCount },
    });
  },
  resetShutterTest: async () => {
    await ppcAutomationClient.post('/api/shutters/reset-test');
  },
  setShutterRequiredCycles: async (value: number) => {
    await ppcAutomationClient.post('/api/shutters/shutter-requiredcycles', null, {
      params: { value },
    });
  },
  getVerticalWeightMeasurement: async () => {
    const response = await ppcAutomationClient.get<WeightMeasurement>('/api/elevator/vertical/weightMeasurement');
    return response.data;
  },
  getElevatorWeight: async () => {
    const response = await ppcAutomationClient.get<number>('/api/elevator/elevator/weight');
    return response.data;
  },
  updateWeightMeasurement: async (payload: {
    measureConst0: number;
    measureConst1: number;
    measureConst2: number;
    weightData: WeightData[];
  }) => {
    const { measureConst0, measureConst1, measureConst2, weightData } = payload;
    await ppcAutomationClient.post('/api/elevator/update/MeasureConst', weightData, {
      params: { measureConst0, measureConst1, measureConst2 },
    });
  },
  getHorizontalResolutionProcedure: async () => {
    const response = await ppcAutomationClient.get<RepeatedTestProcedure>('/api/elevator/horizontal/resolution-procedure');
    return response.data;
  },
  getHorizontalResolutionValue: async () => {
    const response = await ppcAutomationClient.get<number>('/api/elevator/horizontal/resolution-value');
    return response.data;
  },
  getHorizontalTotalDistance: async () => {
    const response = await ppcAutomationClient.get<number>('/api/elevator/horizontal/total-distance');
    return response.data;
  },
  resetHorizontalResolution: async () => {
    await ppcAutomationClient.post('/api/elevator/horizontal/reset-resolution');
  },
  moveHorizontalCalibration: async (direction: HorizontalMovementDirection) => {
    await ppcAutomationClient.post('/api/elevator/horizontal/calibration', null, {
      params: { direction },
    });
  },
  moveHorizontalResolution: async (direction: HorizontalMovementDirection) => {
    await ppcAutomationClient.post('/api/elevator/horizontal/resolution', null, {
      params: { direction },
    });
  },
  updateHorizontalResolution: async (newResolution: number) => {
    await ppcAutomationClient.post('/api/elevator/horizontal/resolution-update', null, {
      params: { newResolution },
    });
  },
  setHorizontalChainCalibrationDistance: async (distance: number) => {
    await ppcAutomationClient.post('/api/elevator/horizontal/calibration/update-distance', null, {
      params: { distance },
    });
  },
  setHorizontalChainCalibrationCompleted: async () => {
    await ppcAutomationClient.post('/api/elevator/horizontal/calibration/set-completed');
  },
  setHorizontalResolutionCalibrationCompleted: async () => {
    await ppcAutomationClient.post('/api/elevator/horizontal/resolution/set-completed');
  },
  startWeightCheck: async (payload: { loadingUnitId: number; runToTest: number; weight: number }) => {
    const { loadingUnitId, runToTest, weight } = payload;
    await ppcAutomationClient.post('/api/elevator/weight-check', null, {
      params: { loadingUnitId, runToTest, weight },
    });
  },
  stopWeightCheck: async () => {
    await ppcAutomationClient.post('/api/elevator/weight-check-stop');
  },
  getDepositAndPickUpParameters: async () => {
    const response = await ppcAutomationClient.get<RepeatedTestProcedure>('/api/setup/DepositAndPickupProcedure/parameters');
    return response.data;
  },
  increaseDepositAndPickUpCycles: async () => {
    const response = await ppcAutomationClient.post<number>('/api/setup/DepositAndPickupProcedure/increase-performed-cycles');
    return response.data;
  },
  setDepositAndPickUpTestCompleted: async () => {
    await ppcAutomationClient.post('/api/elevator/deposit/and/pickup/set-completed');
  },
  resetEnduranceTest: async () => {
    await ppcAutomationClient.post('/api/EnduranceTest/reset');
  },
  startEnduranceHorizontalMovements: async (bayPositionId: number, loadingUnitId: number) => {
    await ppcAutomationClient.post('/api/EnduranceTest/start/repetitive-horizontal', null, {
      params: { bayPositionId, loadingUnitId },
    });
  },
  stopEnduranceHorizontalMovements: async () => {
    await ppcAutomationClient.post('/api/EnduranceTest/stop/repetitive-horizontal');
  },
  stopEnduranceTest: async () => {
    await ppcAutomationClient.post('/api/EnduranceTest/stop-test/repetitive-horizontal');
  },
  startFirstTest: async (loadunit: number) => {
    await ppcAutomationClient.post('/api/FirstTest/start', null, {
      params: { loadunit },
    });
  },
  stopFirstTest: async () => {
    await ppcAutomationClient.post('/api/FirstTest/stop');
  },
  getFullTestParameters: async () => {
    const response = await ppcAutomationClient.get<RepeatedTestProcedure>('/api/FullTest/parameters');
    return response.data;
  },
  startFullTest: async (payload: { loadunits: number[]; cycles: number; randomCells: boolean; randomBays: boolean }) => {
    const { loadunits, cycles, randomCells, randomBays } = payload;
    await ppcAutomationClient.post('/api/FullTest/start', loadunits, {
      params: { cycles, randomCells, randomBays },
    });
  },
  stopFullTest: async () => {
    await ppcAutomationClient.post('/api/FullTest/stop');
  },
  getCellsHeightCheckParameters: async () => {
    const response = await ppcAutomationClient.get<PositioningProcedure>('/api/cells/height-check-parameters');
    return response.data;
  },
  getCellPanelsParameters: async () => {
    const response = await ppcAutomationClient.get<PositioningProcedure>('/api/cellpanels/height-check-parameters');
    return response.data;
  },
  restartCellPanelsProcedure: async () => {
    await ppcAutomationClient.post('/api/cellpanels/restart');
  },
  updateCellPanelHeight: async (cellPanelId: number, heightDifference: number) => {
    await ppcAutomationClient.post('/api/cellpanels/height', null, {
      params: { cellPanelId, heightDifference },
    });
  },
  updateCellHeight: async (id: number, height: number) => {
    await ppcAutomationClient.post(`/api/cells/${id}/height`, null, {
      params: { height },
    });
  },
  updateCellsHeight: async (payload: { fromid: number; toid: number; side: number; height: number }) => {
    const { fromid, toid, side, height } = payload;
    await ppcAutomationClient.post('/api/cells/fromid/toid/height', null, {
      params: { fromid, toid, side, height },
    });
  },
  getCellPanelsStep: async () => {
    const response = await ppcAutomationClient.get<number>('/api/cells/Get-CellStep');
    return response.data;
  },
  setCellPanelsStep: async (value: number) => {
    await ppcAutomationClient.post('/api/cells/Set-CellStep', null, {
      params: { value },
    });
  },
  resetAllCells: async () => {
    await ppcAutomationClient.post('/api/cells/reset-all-cell');
  },
  saveCell: async (cell: Cell) => {
    await ppcAutomationClient.post('/api/cells/save-cell', cell);
  },
  saveCells: async (cells: Cell[]) => {
    await ppcAutomationClient.post('/api/cells/save-cells', cells);
  },
  getTokenUsers: async () => {
    const response = await ppcAutomationClient.get<UserParameters[]>('/api/users/get-token-users');
    return response.data;
  },
  addTokenUser: async (user: UserParameters) => {
    await ppcAutomationClient.post('/api/users/add-user', user);
  },
  deleteTokenUser: async (user: UserParameters) => {
    await ppcAutomationClient.post('/api/users/delete-user', user);
  },

  // IP Manager Settings
  getIpManagerSettings: async () => {
    try {
      const response = await ppcAutomationClient.get('/api/settings/ip-manager');
      return response.data;
    } catch (error) {
      console.warn('[AutomationService] IP Manager settings not available, returning empty');
      return {
        bay1: { remoteIO: '', alphanumericBar: '', laser: '', weightingScale: '' },
        bay2: { remoteIO: '', alphanumericBar: '', laser: '', weightingScale: '' },
        bay3: { remoteIO: '', alphanumericBar: '', laser: '', weightingScale: '' },
        machineInverter: '',
      };
    }
  },

  updateIpManagerSettings: async (settings: {
    bay1: { remoteIO: string; alphanumericBar: string; laser: string; weightingScale: string };
    bay2: { remoteIO: string; alphanumericBar: string; laser: string; weightingScale: string };
    bay3: { remoteIO: string; alphanumericBar: string; laser: string; weightingScale: string };
    machineInverter: string;
  }) => {
    await ppcAutomationClient.put('/api/settings/ip-manager', settings);
  },
};

export default ppcAutomationService;
