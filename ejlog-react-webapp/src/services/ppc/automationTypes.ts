export type MachineIdentity = {
  Id: number;
  ModelName?: string;
  SerialNumber?: string;
  AreaId?: number | null;
  InstallationDate?: string | null;
};

export type DeviceInformation = {
  ModelNumber?: string;
  SerialNumber?: string;
  FirmwareVersion?: string;
};

export type AccessoryBase = {
  IsEnabledNew?: boolean;
  IsConfiguredNew?: boolean;
  DeviceInformation?: DeviceInformation | null;
};

export type SerialPortAccessory = AccessoryBase & {
  PortName?: string | null;
};

export type TcpIpAccessory = AccessoryBase & {
  IpAddress?: string | null;
  TcpPort?: number | null;
};

export type AlphaNumericBar = TcpIpAccessory & {
  ClearAlphaBarOnCloseView?: boolean | null;
  UseGet?: boolean | null;
  MaxMessageLength?: number | null;
  Size?: number | null;
  Field1?: string | null;
  Field2?: string | null;
  Field3?: string | null;
  Field4?: string | null;
  Field5?: string | null;
};

export type CardReader = AccessoryBase & {
  IsLocal?: boolean | null;
  TokenRegex?: string | null;
};

export type LabelPrinter = AccessoryBase & {
  Name?: string | null;
};

export type LaserPointer = TcpIpAccessory & {
  XOffset?: number | null;
  YOffset?: number | null;
  ZOffsetLowerPosition?: number | null;
  ZOffsetUpperPosition?: number | null;
};

export type WeightingScale = TcpIpAccessory;

export type BayAccessories = {
  AlphaNumericBar?: AlphaNumericBar | null;
  BarcodeReader?: SerialPortAccessory | null;
  CardReader?: CardReader | null;
  LabelPrinter?: LabelPrinter | null;
  LaserPointer?: LaserPointer | null;
  TokenReader?: SerialPortAccessory | null;
  WeightingScale?: WeightingScale | null;
};

export enum WeightingScaleModelNumber {
  DiniArgeo = 0,
  MinebeaIntec = 1,
}

export enum MachineMode {
  NotSpecified = 0,
  Automatic = 1,
  Manual = 2,
  Manual2 = 3,
  Manual3 = 4,
  LoadUnitOperations = 5,
  LoadUnitOperations2 = 6,
  LoadUnitOperations3 = 7,
  Test = 8,
  Test2 = 9,
  Test3 = 10,
  Compact = 11,
  Compact2 = 12,
  Compact3 = 13,
  FullTest = 14,
  FullTest2 = 15,
  FullTest3 = 16,
  FirstTest = 17,
  FirstTest2 = 18,
  FirstTest3 = 19,
  Shutdown = 20,
  SwitchingToAutomatic = 21,
  SwitchingToManual = 22,
  SwitchingToManual2 = 23,
  SwitchingToManual3 = 24,
  SwitchingToLoadUnitOperations = 25,
  SwitchingToLoadUnitOperations2 = 26,
  SwitchingToLoadUnitOperations3 = 27,
  SwitchingToCompact = 28,
  SwitchingToCompact2 = 29,
  SwitchingToCompact3 = 30,
  SwitchingToFullTest = 31,
  SwitchingToFullTest2 = 32,
  SwitchingToFullTest3 = 33,
  SwitchingToFirstTest = 34,
  SwitchingToFirstTest2 = 35,
  SwitchingToFirstTest3 = 36,
  SwitchingToShutdown = 37,
  FastCompact = 38,
  FastCompact2 = 39,
  FastCompact3 = 40,
  SwitchingToFastCompact = 41,
  SwitchingToFastCompact2 = 42,
  SwitchingToFastCompact3 = 43,
}

export enum MachinePowerState {
  NotSpecified = 0,
  Unpowered = 1,
  PoweringUp = 2,
  Powered = 3,
  PoweringDown = 4,
}

export type MachineError = {
  Id?: number;
  Code: number;
  Description?: string;
  Reason?: string;
  AdditionalText?: string;
  BayNumber?: number;
  InverterIndex?: number | null;
  DetailCode?: number | null;
  OccurrenceDate?: string;
  Severity?: number | null;
};

export enum MachineErrorCode {
  NoError = -1,
  CradleNotCompletelyLoaded = 1,
  ConditionsNotMetForPositioning = 2,
  ConditionsNotMetForRunning = 3,
  ConditionsNotMetForHoming = 4,
  SecurityWasTriggered = 5,
  SecurityButtonWasTriggered = 6,
  SecurityBarrierWasTriggered = 7,
  SecurityLeftSensorWasTriggered = 8,
  InverterFaultStateDetected = 9,
  CradleNotCorrectlyLoadedDuringPickup = 10,
  CradleNotCorrectlyUnloadedDuringDeposit = 11,
  ZeroSensorErrorAfterPickup = 12,
  ZeroSensorErrorAfterDeposit = 13,
  InvalidPresenceSensors = 14,
  MissingZeroSensorWithEmptyElevator = 15,
  ZeroSensorActiveWithFullElevator = 16,
  LoadUnitPresentOnEmptyElevator = 17,
  TopLevelBayOccupied = 18,
  BottomLevelBayOccupied = 19,
  TopLevelBayEmpty = 20,
  BottomLevelBayEmpty = 21,
  SensorZeroBayNotActiveAtStart = 22,
  InverterConnectionError = 23,
  IoDeviceConnectionError = 24,
  LaserConnectionError = 25,
  LoadUnitWeightExceeded = 26,
  LoadUnitHeightFromBayExceeded = 27,
  LoadUnitHeightToBayExceeded = 28,
  LoadUnitWeightTooLow = 29,
  MachineWeightExceeded = 30,
  DestinationBelowLowerBound = 31,
  DestinationOverUpperBound = 32,
  BayInvertersBusy = 33,
  IoDeviceError = 34,
  MachineModeNotValid = 35,
  AnotherMissionIsActiveForThisLoadUnit = 36,
  AnotherMissionIsActiveForThisBay = 37,
  AnotherMissionOfThisTypeIsActive = 38,
  WarehouseIsFull = 39,
  CellLogicallyOccupied = 40,
  MoveBayChainNotAllowed = 41,
  AutomaticRestoreNotAllowed = 42,
  DestinationTypeNotValid = 43,
  MissionTypeNotValid = 44,
  ResumeCommandNotValid = 45,
  DestinationBayNotCalibrated = 46,
  NoLoadUnitInSource = 47,
  LoadUnitSourceDb = 48,
  LoadUnitDestinationCell = 49,
  LoadUnitElevator = 50,
  LoadUnitNotRemoved = 51,
  LoadUnitDestinationBay = 52,
  LoadUnitSourceCell = 53,
  LoadUnitNotFound = 54,
  LoadUnitNotLoaded = 55,
  LoadUnitSourceBay = 56,
  LoadUnitShutterOpen = 57,
  LoadUnitShutterInvalid = 58,
  LoadUnitShutterClosed = 59,
  LoadUnitPresentInCell = 60,
  LoadUnitOtherBay = 61,
  LoadUnitSourceElevator = 62,
  LoadUnitMissingOnElevator = 63,
  LoadUnitMissingOnBay = 64,
  LoadUnitUndefinedUpper = 65,
  LoadUnitUndefinedBottom = 66,
  FirstTestFailed = 67,
  FullTestFailed = 68,
  WarehouseNotEmpty = 69,
  SensorZeroBayNotActiveAtEnd = 70,
  SecurityRightSensorWasTriggered = 71,
  VerticalPositionChanged = 72,
  InvalidBay = 73,
  InvalidPositionBay = 74,
  ElevatorOverrunDetected = 75,
  ElevatorUnderrunDetected = 76,
  ExternalBayEmpty = 77,
  ExternalBayOccupied = 78,
  WmsError = 79,
  BayPositionDisabled = 80,
  MoveExtBayNotAllowed = 81,
  StartPositioningBlocked = 82,
  InverterCommandTimeout = 83,
  IoDeviceCommandTimeout = 84,
  TelescopicBayError = 85,
  LoadUnitTareError = 86,
  VerticalZeroLowError = 87,
  VerticalZeroHighError = 88,
  LoadUnitHeightFromBayTooLow = 89,
  PreFireAlarm = 90,
  FireAlarm = 91,
  BackupDatabaseOnServer = 92,
  ZeroSensorErrorAfterHoming = 93,
  IoResetSecurityTimeout = 94,
  ProfileResolutionFail = 95,
  SensitiveEdgeAlarm = 96,
  SensitiveCarpetsAlarm = 97,
  HeightAlarm = 98,
  BayBlockedPiston = 99,
  InverterErrorBaseCode = 1000,
  InverterErrorInvalidParameter = 1001,
  InverterErrorInvalidDataset = 1002,
  InverterErrorParameterIsWriteOnly = 1003,
  InverterErrorParameterIsReadOnly = 1004,
  InverterErrorEepromReadError = 1005,
  InverterErrorEepromWriteError = 1006,
  InverterErrorEepromChecksumError = 1007,
  InverterErrorCannotWriteParameterWhileRunning = 1008,
  InverterErrorDatasetValuesAreDifferent = 1009,
  InverterErrorUnknownParameter = 1011,
  InverterErrorSyntaxError = 1013,
  InverterErrorWrongPayloadLength = 1014,
  InverterErrorNodeNotAvailable = 1020,
  InverterErrorSyntaxError2 = 1030,
}

export type BlockLevel =
  | 'Undefined'
  | 'None'
  | 'SpaceOnly'
  | 'Blocked'
  | 'NeedsTest'
  | 'UnderWeight'
  | 'Reserved';

export type Cell = {
  IsFree: boolean;
  BlockLevel: BlockLevel;
};

export type ActionPolicy = {
  IsAllowed: boolean;
  Reason?: string;
  ReasonType?: number;
};

export type BayPosition = {
  Id?: number;
  Height?: number;
  IsUpper?: boolean;
  Location?: LoadingUnitLocation;
  LoadingUnit?: LoadingUnit | null;
};

export type Bay = {
  Id?: number;
  Number?: number;
  BayPistonBlock?: boolean;
  IsActive?: boolean;
  IsExternal?: boolean;
  IsDouble?: boolean;
  IsNewStepEnabled?: boolean;
  Carousel?: unknown | null;
  External?: unknown | null;
  LaserIgnoreItemHeight?: boolean;
  Shutter?: { Type?: ShutterType } | null;
  Positions?: BayPosition[];
};

export type LoadingUnit = {
  Id?: number;
  CellId?: number | null;
  Code?: string | null;
  Height?: number | null;
  NetWeight?: number | null;
  MaxNetWeight?: number | null;
  LaserOffset?: number | null;
  RotationClass?: string | null;
  IsDoubleHeight?: boolean | null;
  IsHeightFixed?: boolean | null;
  IsCellFixed?: boolean | null;
  IsIntoMachineOK?: boolean | null;
  Description?: string | null;
  Status?: number | string | null;
  Cell?: {
    Side?: number | string | null;
  } | null;
};

export type ElevatorPosition = {
  Vertical: number;
  Horizontal: number;
  CellId?: number | null;
  BayPositionId?: number | null;
  BayPositionUpper?: boolean | null;
};

export type MachineConfig = {
  Elevator?: {
    Axes?: Array<{
      Orientation?: number | string;
      EmptyLoadMovement?: {
        Speed?: number;
      };
    }>;
  };
};

export type Mission = {
  Id?: number;
  TargetBay?: number;
  LoadUnitId?: number | null;
  MissionType?: number | string | null;
  Status?: number | string | null;
};

export enum Orientation {
  Horizontal = 0,
  Vertical = 1,
}

export type SetupProcedure = {
  IsCompleted?: boolean;
  PerformedCycles?: number;
  TotalCycles?: number;
};

export type RepeatedTestProcedure = SetupProcedure & {
  LowerPosition?: number;
  UpperPosition?: number;
  DelayStart?: number;
  DelayBetweenCycles?: number;
};

export type OffsetCalibrationProcedure = SetupProcedure & {
  ReferenceCellId?: number;
  InProgress?: boolean;
  Step?: number;
};

export type VerticalResolutionCalibrationProcedure = SetupProcedure & {
  Resolution?: number;
  ExpectedDistance?: number;
  MeasuredDistance?: number;
  StartPosition?: number;
  InitialPosition?: number;
  FinalPosition?: number;
};

export type HomingProcedureParameters = SetupProcedure & {
  UpperBound?: number;
  LowerBound?: number;
  Offset?: number;
  Resolution?: number;
};

export type BayProfileCheckProcedure = SetupProcedure & {
  ProfileConst0?: number;
  ProfileConst1?: number;
  Sample?: number;
};

export type PositioningProcedure = SetupProcedure & {
  CellId?: number;
  Height?: number;
  Position?: number;
  InProgress?: boolean;
  Step?: number;
};

export type SetupStepStatus = {
  CanBePerformed: boolean;
  InProgress: boolean;
  IsBypassed: boolean;
  IsCompleted: boolean;
};

export type BaySetupStatus = {
  CarouselCalibration?: SetupStepStatus | null;
  Check?: SetupStepStatus | null;
  ExternalBayCalibration?: SetupStepStatus | null;
  IsAllTestCompleted: boolean;
  Laser?: SetupStepStatus | null;
  Profile?: SetupStepStatus | null;
  Shutter?: SetupStepStatus | null;
  FullTest?: SetupStepStatus | null;
};

export type SetupStatusCapabilities = {
  AllLoadingUnits?: SetupStepStatus | null;
  Bay1?: BaySetupStatus | null;
  Bay2?: BaySetupStatus | null;
  Bay3?: BaySetupStatus | null;
  BeltBurnishing?: SetupStepStatus | null;
  CellPanelsCheck?: SetupStepStatus | null;
  CellPanelsCheckWeight?: SetupStepStatus | null;
  CellsHeightCheck?: SetupStepStatus | null;
  CompletedDate?: string | null;
  DepositAndPickUpTest?: SetupStepStatus | null;
  FullTest?: SetupStepStatus | null;
  HorizontalChainCalibration?: SetupStepStatus | null;
  HorizontalHoming?: SetupStepStatus | null;
  HorizontalResolutionCalibration?: SetupStepStatus | null;
  IsComplete: boolean;
  LoadFirstDrawerTest?: SetupStepStatus | null;
  VerticalOffsetCalibration?: SetupStepStatus | null;
  VerticalOffsetCalibrationWeight?: SetupStepStatus | null;
  VerticalOriginCalibration?: SetupStepStatus | null;
  VerticalOriginCalibrationWeight?: SetupStepStatus | null;
  VerticalResolutionCalibration?: SetupStepStatus | null;
  WeightMeasurement?: SetupStepStatus | null;
};

export type WeightData = {
  Weight?: number;
  Current?: number;
  Tare?: number;
};

export type WeightMeasurement = SetupProcedure & {
  MeasureConst0?: number;
  MeasureConst1?: number;
  MeasureConst2?: number;
  WeightData?: WeightData[];
};

export type UserParameters = {
  Id?: number;
  Name?: string;
  Token?: string | null;
  AccessLevel?: number;
  PasswordHash?: string | null;
  PasswordSalt?: string | null;
};

export enum LoadingUnitLocation {
  NoLocation = 0,
  InternalBay1Up = 1,
  InternalBay1Down = 2,
  InternalBay2Up = 3,
  InternalBay2Down = 4,
  InternalBay3Up = 5,
  InternalBay3Down = 6,
  ExternalBay1Up = 7,
  ExternalBay1Down = 8,
  ExternalBay2Up = 9,
  ExternalBay2Down = 10,
  ExternalBay3Up = 11,
  ExternalBay3Down = 12,
  CarouselBay1Up = 13,
  CarouselBay1Down = 14,
  CarouselBay2Up = 15,
  CarouselBay2Down = 16,
  CarouselBay3Up = 17,
  CarouselBay3Down = 18,
  Cell = 19,
  LoadUnit = 20,
  Elevator = 21,
  Up = 22,
  Down = 23,
}

export enum WarehouseSide {
  NotSpecified = 0,
  Front = 1,
  Back = 2,
}

export enum ShutterPosition {
  NotSpecified = 0,
  Opened = 1,
  Half = 2,
  Closed = 3,
  Intermediate = 4,
}

export enum ShutterType {
  NotSpecified = 0,
  TwoSensors = 1,
  ThreeSensors = 2,
  UpperHalf = 3,
}

export enum MovementCategory {
  None = 0,
  Manual = 1,
  Assisted = 2,
  Automatic = 3,
}

export enum HorizontalMovementDirection {
  NotSpecified = 0,
  Forwards = 1,
  Backwards = 2,
}

export enum VerticalMovementDirection {
  Up = 0,
  Down = 1,
}

export enum ExternalBayMovementDirection {
  TowardOperator = 0,
  TowardMachine = 1,
}

export enum ShutterMovementDirection {
  NotSpecified = 0,
  Up = 1,
  Down = 2,
}
