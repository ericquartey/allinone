/**
 * Ferretto Vertical Warehouse - Type Definitions
 * Modelli dati basati sul progetto XAML originale C:\F_WMS\VerticalWarehouses
 */

// =====================================================
// ENUMERAZIONI
// =====================================================

export enum Orientation {
  Vertical = 'Vertical',
  Horizontal = 'Horizontal',
}

export enum WarehouseSide {
  Front = 'Front',
  Back = 'Back',
  NotSpecified = 'NotSpecified',
}

export enum BayNumber {
  None = 0,
  BayOne = 1,
  BayTwo = 2,
  BayThree = 3,
}

export enum LoadingUnitLocation {
  // Carousel Bays (Front side)
  CarouselBay1Up = 'CarouselBay1Up',
  CarouselBay1Down = 'CarouselBay1Down',
  CarouselBay2Up = 'CarouselBay2Up',
  CarouselBay2Down = 'CarouselBay2Down',
  CarouselBay3Up = 'CarouselBay3Up',
  CarouselBay3Down = 'CarouselBay3Down',

  // External Bays
  ExternalBay1Up = 'ExternalBay1Up',
  ExternalBay1Down = 'ExternalBay1Down',
  ExternalBay2Up = 'ExternalBay2Up',
  ExternalBay2Down = 'ExternalBay2Down',
  ExternalBay3Up = 'ExternalBay3Up',
  ExternalBay3Down = 'ExternalBay3Down',

  // Internal Bays
  InternalBay1Up = 'InternalBay1Up',
  InternalBay1Down = 'InternalBay1Down',
  InternalBay2Up = 'InternalBay2Up',
  InternalBay2Down = 'InternalBay2Down',
  InternalBay3Up = 'InternalBay3Up',
  InternalBay3Down = 'InternalBay3Down',

  // Special
  None = 'None',
  Elevator = 'Elevator',
}

export enum SupportType {
  Insert = 'Insert',     // Fork cells: 1, 5, 9, 13, 17...
  Above = 'Above',       // Above cells: 2, 3, 4, 6, 7, 8...
  Undefined = 'Undefined',
}

export enum BlockLevel {
  None = 'None',
  SpaceOnly = 'SpaceOnly',
  Full = 'Full',
}

export enum MissionType {
  NoType = 'NoType',
  Manual = 'Manual',
  LoadUnitOperation = 'LoadUnitOperation',
  WMS = 'WMS',
  IN = 'IN',
  OUT = 'OUT',
  FirstTest = 'FirstTest',
  FullTestIN = 'FullTestIN',
  FullTestOUT = 'FullTestOUT',
  Compact = 'Compact',
  FastCompact = 'FastCompact',
}

export enum MissionStatus {
  New = 'New',
  Executing = 'Executing',
  Waiting = 'Waiting',
  Completed = 'Completed',
  Aborted = 'Aborted',
  Completing = 'Completing',
}

export enum MissionStep {
  NotDefined = 0,
  New = 1,
  Start = 2,
  LoadElevator = 3,
  ToTarget = 4,
  DepositUnit = 5,
  WaitPick = 6,
  BayChain = 7,
  CloseShutter = 8,
  BackToBay = 9,
  WaitChain = 10,
  WaitDepositCell = 11,
  WaitDepositExternalBay = 12,
  WaitDepositInternalBay = 13,
  WaitDepositBay = 14,
  DoubleExtBay = 15,
  ExtBay = 16,
  ElevatorBayUp = 17,
  End = 18,
  Error = 101,
  ErrorLoad = 102,
  ErrorDeposit = 103,
}

export enum HorizontalMovementDirection {
  None = 'None',
  Forward = 'Forward',
  Backward = 'Backward',
}

export enum ShutterPosition {
  NotSpecified = 'NotSpecified',
  Opened = 'Opened',
  Half = 'Half',
  Closed = 'Closed',
  Intermediate = 'Intermediate',
}

// =====================================================
// STRUTTURE DATI
// =====================================================

/**
 * Asse dell'elevatore (Verticale o Orizzontale)
 * Basato su: C:\F_WMS\VerticalWarehouses\...\ElevatorAxis.cs
 */
export interface ElevatorAxis {
  id: number;
  orientation: Orientation;

  // Limiti fisici in millimetri
  lowerBound: number;  // mm
  upperBound: number;  // mm

  // Risoluzione encoder
  resolution: number;  // imp/mm

  // Offset per operazioni
  verticalDepositOffset?: number;  // mm
  verticalPickupOffset?: number;   // mm

  // Velocità
  homingFastSpeed: number;          // mm/s
  horizontalCalibrateSpeed?: number; // mm/s

  // Posizione corrente
  currentPosition: number;  // mm
}

/**
 * Proprietà strutturali dell'elevatore
 * Basato su: C:\F_WMS\VerticalWarehouses\...\ElevatorStructuralProperties.cs
 */
export interface ElevatorStructuralProperties {
  elevatorWeight: number;      // kg
  pulleyDiameter: number;      // mm
  shaftDiameter: number;       // mm
  shaftElasticity: number;     // N/mm²
  halfShaftLength: number;     // mm
  beltSpacing: number;         // mm (distanza tra catene)
  beltRigidity: number;        // N/m/mm
  secondTermMultiplier: number;
}

/**
 * Elevatore completo
 * Basato su: C:\F_WMS\VerticalWarehouses\...\Elevator.cs
 */
export interface Elevator {
  id: number;

  // 2 Assi: Verticale e Orizzontale
  axes: ElevatorAxis[];

  // Proprietà strutturali
  structuralProperties: ElevatorStructuralProperties;

  // Stato corrente
  bayPosition: BayPosition | null;
  cell: Cell | null;
  loadingUnit: LoadingUnit | null;
  loadingUnitId: number | null;

  // Calcolati
  verticalPosition: number;   // mm - posizione asse verticale
  horizontalPosition: number; // mm - posizione asse orizzontale
}

/**
 * Posizione in una baia (Up o Down)
 * Basato su: C:\F_WMS\VerticalWarehouses\...\BayPosition.cs
 */
export interface BayPosition {
  id: number;
  bayId: number;
  location: LoadingUnitLocation;

  // Altezze in millimetri
  height: number;           // mm - altezza assoluta
  maxSingleHeight: number;  // mm
  maxDoubleHeight: number;  // mm

  // Stati
  isBlocked: boolean;
  isUpper: boolean;        // true se Up, false se Down
  isPreferred: boolean;    // posizione preferita per baia

  // Offset calibrazione
  profileOffset: number;   // mm

  // Cassetto caricato
  loadingUnit: LoadingUnit | null;
}

/**
 * Baia (Bay1, Bay2, Bay3)
 * Basato su: C:\F_WMS\VerticalWarehouses\...\Bay.cs
 */
export interface Bay {
  id: number;
  number: BayNumber;
  side: WarehouseSide;

  // Configurazione
  isDouble: boolean;         // 2 posizioni (Up/Down) vs 1
  isExternal: boolean;
  isTelescopic: boolean;

  // Posizioni nella baia
  positions: BayPosition[];

  // Catena - Configurazione
  chainOffset: number;      // mm
  resolution: number;       // encoder resolution

  // Conversione profilo -> altezza: heightMm = (profile * k1) + k0
  profileConst0: number;    // k0
  profileConst1: number;    // k1

  // Operazione corrente
  operation: string | null;
  currentMission: Mission | null;
}

/**
 * Cella di stoccaggio
 * Basato su: C:\F_WMS\VerticalWarehouses\...\Cell.cs
 */
export interface Cell {
  id: number;
  side: WarehouseSide;

  // Posizione verticale assoluta in millimetri
  position: number;  // mm

  // Tipo di supporto (calcolato da ID e lato)
  support: SupportType;

  // Stato
  blockLevel: BlockLevel;
  isFree: boolean;
  isAvailable: boolean;

  // Cassetto caricato
  loadingUnit: LoadingUnit | null;
  loadingUnitId: number | null;

  // Calcolo supporto:
  // Front fork cells: 1, 5, 9, 13, 17 ... (id-1) % 4 == 0 -> Insert
  // Back fork cells: 14, 18, 22, 26, 30 ... (id-2) % 4 == 0 -> Insert
  // Altri: Above
}

/**
 * Cassetto (Loading Unit / UDC)
 */
export interface LoadingUnit {
  id: number;
  barcode: string;
  location: LoadingUnitLocation;

  // Dimensioni
  width: number;   // mm
  height: number;  // mm
  depth: number;   // mm
  weight: number;  // kg

  // Stati
  isEmpty: boolean;
  isBlocked: boolean;

  // Riferimenti
  cellId: number | null;
  bayPositionId: number | null;
}

/**
 * Missione completa
 * Basato su: C:\F_WMS\VerticalWarehouses\...\Mission.cs
 */
export interface Mission {
  id: number;

  // Tipo e stato
  missionType: MissionType;
  status: MissionStatus;
  step: MissionStep;

  // Cassetto
  loadUnitId: number;
  loadingUnit: LoadingUnit | null;

  // Sorgente e destinazione
  loadUnitSource: LoadingUnitLocation;
  loadUnitDestination: LoadingUnitLocation;
  loadUnitCellSourceId: number | null;
  destinationCellId: number | null;

  // Baia target
  targetBay: BayNumber;

  // Attuatori
  closeShutterBayNumber: BayNumber;
  closeShutterPosition: ShutterPosition;
  openShutterPosition: ShutterPosition;
  direction: HorizontalMovementDirection;

  // Configurazione
  priority: number;
  missionTime: number; // secondi

  // Stati avanzati
  needMovingBackward: boolean;
  restoreConditions: boolean;
  restoreStep: MissionStep | null;

  // Timestamp
  stepTime: string | null;

  // Errori
  errorCode: string | null;
  stopReason: string | null;
}

/**
 * Configurazione completa del magazzino
 */
export interface WarehouseConfiguration {
  // Elevatore
  elevator: Elevator;

  // Baie (3 baie, ognuna con 1 o 2 posizioni)
  bays: Bay[];

  // Celle (disposte verticalmente)
  cells: Cell[];

  // Dimensioni fisiche
  totalHeight: number;      // mm - altezza totale magazzino
  columnSpacing: number;    // mm - spaziatura tra colonne
  floorHeight: number;      // mm - altezza standard piano
  cellDepth: number;        // mm - profondità cella

  // Configurazione
  numberOfFloors: number;   // numero piani logici
  numberOfColumns: number;  // colonne per piano

  // Lato warehouse
  side: WarehouseSide;
}

/**
 * Stato real-time del magazzino
 */
export interface WarehouseState {
  configuration: WarehouseConfiguration;
  elevator: Elevator;
  missions: Mission[];
  activeMission: Mission | null;
  cells: Cell[];
  bays: Bay[];
  timestamp: number;
}
