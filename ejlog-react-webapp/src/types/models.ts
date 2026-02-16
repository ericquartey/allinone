// ============================================================================
// EJLOG WMS - TypeScript Models
// Modelli completi di tutte le entità del sistema
// ============================================================================

// ============================================================================
// ENUMERAZIONI
// ============================================================================

// ALLINEATO con TipoListaEnum.java del backend EjLog
export enum ItemListType {
  PICKING = 1,              // Picking/Prelievo
  REFILLING = 2,            // Refilling/Rifornimento (era STOCCAGGIO)
  VISIONE = 3,              // Visione/Controllo
  INVENTARIO = 4,           // Inventario
  RIORDINO_INTER_MAGAZZINO = 10, // Riordino inter-magazzino
  // Valori legacy per compatibilità (NON usare per nuove liste)
  STOCCAGGIO = 2,           // @deprecated - usare REFILLING
  TRASFERIMENTO = 10,       // @deprecated - usare RIORDINO_INTER_MAGAZZINO
}

/**
 * IMPORTANTE: Enum allineato con StatoListaEnum.java del backend
 * NON modificare questi valori senza coordinamento con il team backend
 *
 * Valori corretti dal backend:
 * - IMPORTATA(0)
 * - IN_ATTESA(1)
 * - IN_ESECUZIONE(2)  ← CORRETTO (prima era 1, SBAGLIATO!)
 * - TERMINATA(3)
 */
export enum ItemListStatus {
  IMPORTATA = 0,          // Lista importata (non ancora lanciata)
  IN_ATTESA = 1,          // Lista in attesa di esecuzione (ex DA_EVADERE)
  IN_ESECUZIONE = 2,      // ✅ CORRETTO: Lista in esecuzione (era 1, ora 2)
  TERMINATA = 3,          // Lista terminata (ex COMPLETATA)

  // Stati aggiuntivi non presenti in StatoListaEnum backend
  // Questi potrebbero essere gestiti tramite altri campi (es. lista.terminata, lista.inevadibile)
  SOSPESA = 4,            // Lista sospesa (potrebbe essere stato derivato)
  ANNULLATA = 5,          // Lista annullata
  INEVADIBILE = 6,        // Lista inevadibile (gestito da campo separato nel backend)
}

export enum MissionOperationType {
  PRELIEVO = 1,
  DEPOSITO = 2,
  INVENTARIO = 3,
  TRASFERIMENTO = 4,
  RETTIFICA = 5,
  CONTROLLO = 6,
}

export enum MissionOperationStatus {
  DA_ESEGUIRE = 0,
  IN_ESECUZIONE = 1,
  COMPLETATA = 2,
  ANNULLATA = 3,
  IN_ERRORE = 4,
  SOSPESA = 5,
}

export enum UserAccessLevel {
  OPERATORE = 1,
  SUPERVISORE = 2,
  AMMINISTRATORE = 3,
  SYSTEM = 4,
}

export enum ManagementType {
  STANDARD = 0,
  LOTTO = 1,
  MATRICOLA = 2,
  LOTTO_E_MATRICOLA = 3,
}

export enum AlarmSeverity {
  INFO = 0,
  WARNING = 1,
  ERROR = 2,
  CRITICAL = 3,
}

export enum MachineStatus {
  IDLE = 0,
  WORKING = 1,
  ERROR = 2,
  MAINTENANCE = 3,
  OFFLINE = 4,
}

// ============================================================================
// MODELLI CORE
// ============================================================================

export interface Item {
  id: number;
  code: string;
  description: string;
  abcClassDescription?: string;
  itemCategoryDescription?: string;
  measureUnitDescription: string;
  managementType: ManagementType;
  note?: string;
  averageWeight?: number; // grammi
  unitWeight?: number;
  fifoTimePick?: number;
  fifoTimePut?: number;
  quantitySignificantFigures: number;
  isDraperyItem: boolean;
  isHandledByLot: boolean;
  isHandledBySerialNumber: boolean;
  isHandledByExpireDate: boolean;
  imageUrl?: string;
  barcode?: string;
  alternativeBarcodes?: string[];
  minStock?: number;
  maxStock?: number;
  reorderPoint?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  item: Item;
  stockedQuantity: number;
  inventoryThreshold: number;
  lot?: string;
  serialNumber?: string;
  sscc?: string;
  expirationDate?: string;
  compartmentId?: number;
  loadingUnitId?: number;
  areaId?: number;
  isBlocked: boolean;
  blockReason?: string;
}

export interface ItemList {
  id: number;
  code: string;
  description?: string;
  itemListType: ItemListType;
  status: ItemListStatus;
  isDispatchable: boolean;
  priority: number;
  shipmentUnitCode?: string;
  shipmentUnitDescription?: string;
  machines?: MachineItemListInfo[];
  rows?: ItemListRow[];
  totalRows?: number;
  completedRows?: number;
  requestedQuantity?: number;
  dispatchedQuantity?: number;
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string;
  createdBy?: string;
  // Campi aggiuntivi dal backend (auxHost fields)
  rifLista?: string; // Riferimento lista (orderNumber dal backend)
  areaDestinationGroupId?: number; // Area destination group (auxHostInt01)
  listId?: string; // ID lista corretta (listNumber dal backend)
  auxHostText01?: string;
  auxHostText02?: string;
  auxHostInt01?: number;
  auxHostInt02?: number;
}

export interface ItemListRow {
  id: number;
  itemListId: number;
  code?: string;
  itemId: number;
  itemCode?: string;
  itemDescription?: string;
  requestedQuantity: number;
  dispatchedQuantity: number;
  remainingQuantity?: number;
  isCompleted: boolean;
  containsExternalItems: boolean;
  machines?: MachineInfo[];
  lot?: string;
  serialNumber?: string;
  expirationDate?: string;
  note?: string;
}

export interface LoadingUnit {
  id: number;
  barcode?: string;
  width: number;
  depth: number;
  height?: number;
  compartmentsCount: number;
  areaFillRate: number;
  isBlockedFromEjlog: boolean;
  note?: string;
  currentLocation?: string;
  machineId?: number;
  bayNumber?: number;
  compartments?: Compartment[];
}

export interface Compartment {
  id: number;
  loadingUnitId: number;
  barcode?: string;
  width: number;
  depth: number;
  height?: number;
  xPosition: number;
  yPosition: number;
  zPosition?: number;
  fillPercentage: number;
  products?: Product[];
  maxWeight?: number;
  currentWeight?: number;
}

export interface Area {
  id: number;
  code: string;
  name: string;
  description?: string;
  warehouseId?: number;
  isActive: boolean;
}

export interface MachineInfo {
  id: number;
  code: string;
  description?: string;
  machineType?: string;
  bayNumber?: number;
  status?: MachineStatus;
  currentOperationId?: number;
  isAvailable: boolean;
}

export interface MachineItemListInfo extends MachineInfo {
  itemListId?: number;
  assignedAt?: string;
}

export interface MissionOperation {
  id: number;
  type: MissionOperationType;
  status: MissionOperationStatus;
  itemId: number;
  itemCode?: string;
  itemDescription?: string;
  loadingUnitId?: number;
  loadingUnitBarcode?: string;
  compartmentId?: number;
  quantity: number;
  remainingQuantity: number;
  dispatchedQuantity?: number;
  wastedQuantity?: number;
  lot?: string;
  serialNumber?: string;
  expirationDate?: string;
  machineId?: number;
  bayNumber?: number;
  destinationGroupId?: number;
  itemListId?: number;
  itemListRowId?: number;
  priority?: number;
  reasonId?: number;
  reasonDescription?: string;
  reasonNotes?: string;
  operatorUserName?: string;
  createdAt?: string;
  startedAt?: string;
  completedAt?: string;
}

// ============================================================================
// AUTENTICAZIONE E UTENTI
// ============================================================================

export interface User {
  id: number;
  userName: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  accessLevel: UserAccessLevel;
  isActive: boolean;
  badgeCode?: string;
  defaultAreaId?: number;
  permissions?: string[];
  createdAt?: string;
  lastLoginAt?: string;
}

export interface UserClaims extends User {
  token: string;
  refreshToken?: string;
  tokenExpiration?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

// Backend login user (without firstName/lastName, token, etc.)
export interface LoginUser {
  id: number;
  username: string;
  groupId: number;
  groupName: string;
  groupLevel: number;
  languageId: number;
  barcode: string | null;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: LoginUser;
  expiresIn: string;
  message: string;
  isSuperuser?: boolean;
}

// ============================================================================
// BARCODE E REGOLE
// ============================================================================

export interface BarcodeRule {
  id: number;
  pattern: string;
  type: string;
  itemCodeStart?: number;
  itemCodeLength?: number;
  quantityStart?: number;
  quantityLength?: number;
  quantityMultiplier?: number;
  lotStart?: number;
  lotLength?: number;
  serialNumberStart?: number;
  serialNumberLength?: number;
  expirationDateStart?: number;
  expirationDateLength?: number;
  expirationDateFormat?: string;
  ssccStart?: number;
  ssccLength?: number;
  priority: number;
  isActive: boolean;
}

// ============================================================================
// CAUSALI E MOTIVI
// ============================================================================

export interface OperationReason {
  id: number;
  code: string;
  description: string;
  type: string; // PRELIEVO, DEPOSITO, RETTIFICA, etc.
  requiresNote: boolean;
  isActive: boolean;
}

// ============================================================================
// ALLARMI
// ============================================================================

export interface Alarm {
  id: number;
  machineId: number;
  machineCode?: string;
  alarmCode: string;
  description?: string;
  severity: AlarmSeverity;
  occurredAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  isActive: boolean;
  notes?: string;
}

export interface AlarmDefinition {
  code: string;
  description: string;
  severity: AlarmSeverity;
  category?: string;
  troubleshooting?: string;
}

// ============================================================================
// GRUPPI DESTINAZIONE
// ============================================================================

export interface DestinationGroup {
  id: number;
  code: string;
  description?: string;
  machineId?: number;
  bayNumber?: number;
  isActive: boolean;
}

// ============================================================================
// STAMPE
// ============================================================================

export interface PrinterInfo {
  id: number;
  name: string;
  description?: string;
  printerType: string; // ZEBRA, DATAMAX, LASER, etc.
  ipAddress?: string;
  port?: number;
  isDefault: boolean;
  isActive: boolean;
}

export interface PrintJob {
  id: number;
  printerId: number;
  templateName: string;
  parameters: Record<string, any>;
  status: 'PENDING' | 'PRINTING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
}

// ============================================================================
// MOVIMENTI STOCK
// ============================================================================

export interface StockMovement {
  id: number;
  itemId: number;
  itemCode?: string;
  itemDescription?: string;
  movementType: string; // IN, OUT, ADJUSTMENT, TRANSFER
  quantity: number;
  lot?: string;
  serialNumber?: string;
  fromLocationId?: number;
  toLocationId?: number;
  fromCompartmentId?: number;
  toCompartmentId?: number;
  reasonId?: number;
  reasonDescription?: string;
  notes?: string;
  operatorUserName?: string;
  documentNumber?: string;
  occurredAt: string;
}

// ============================================================================
// PUT-TO-LIGHT
// ============================================================================

export interface PutToLightShelf {
  code: string;
  description?: string;
  machineCode?: string;
  basketCode?: string;
  carCode?: string;
  ledStatus?: 'OFF' | 'ON' | 'BLINKING';
  isActive: boolean;
}

export interface Basket {
  code: string;
  shelfCode?: string;
  itemListId?: number;
  status: 'EMPTY' | 'FILLING' | 'FULL' | 'COMPLETED';
  assignedAt?: string;
  completedAt?: string;
}

// ============================================================================
// CONFIGURAZIONE SISTEMA
// ============================================================================

export interface SystemParameter {
  key: string;
  value: string;
  description?: string;
  category?: string;
  dataType: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
  isReadOnly: boolean;
}

export interface Warehouse {
  id: number;
  code: string;
  name: string;
  description?: string;
  address?: string;
  isActive: boolean;
}

// ============================================================================
// CATEGORIE ARTICOLI
// ============================================================================

export interface ItemCategory {
  id: number;
  code: string;
  description: string;
  parentCategoryId?: number;
  level?: number;
  isActive: boolean;
}

export interface AbcClass {
  code: string; // A, B, C
  description: string;
  minPercentage: number;
  maxPercentage: number;
}

// ============================================================================
// MODELLI LISTE
// ============================================================================

export interface ListTemplate {
  id: number;
  name: string;
  description?: string;
  listType: ItemListType;
  defaultPriority: number;
  rows?: ListTemplateRow[];
  isActive: boolean;
}

export interface ListTemplateRow {
  id: number;
  templateId: number;
  itemId: number;
  quantity: number;
  order: number;
}

// ============================================================================
// STATISTICHE E KPI
// ============================================================================

export interface DashboardStats {
  totalItems: number;
  totalStock: number;
  itemsBelowMinStock: number;
  activeLists: number;
  pendingLists: number;
  completedListsToday: number;
  activeOperations: number;
  activeAlarms: number;
  machinesOnline: number;
  machinesTotal: number;
}

export interface StockStats {
  totalValue: number;
  totalQuantity: number;
  totalLocations: number;
  occupancyPercentage: number;
  abcDistribution: {
    A: number;
    B: number;
    C: number;
  };
}

export interface OperationStats {
  totalOperations: number;
  completedOperations: number;
  averageCompletionTime: number; // minuti
  errorRate: number; // percentuale
  throughput: number; // operazioni/ora
}

// ============================================================================
// RICHIESTE API
// ============================================================================

export interface PickItemRequest {
  id: number;
  destinationGroupId?: number;
  machineId?: number;
  compartmentId?: number;
  quantity: number;
  lot?: string;
  serialNumber?: string;
  expireDate?: string;
  reasonId?: number;
  reasonNotes?: string;
  userName: string;
}

export interface PutItemRequest {
  id: number;
  destinationGroupId?: number;
  machineId?: number;
  compartmentId?: number;
  quantity: number;
  lot?: string;
  serialNumber?: string;
  expireDate?: string;
  userName: string;
}

export interface CompleteOperationRequest {
  id: number;
  quantity: number;
  wastedQuantity?: number;
  printerName?: string;
  nrLabels?: number;
  ignoreRemainingQuantity?: boolean;
  fullCompartment?: boolean;
  barcode?: string;
  toteBarcode?: string;
  userName: string;
}

export interface ExecuteListRequest {
  id: number;
  areaId?: number;
  destinationGroupId?: number;
  userName: string;
}

export interface CreateLoadingUnitRequest {
  width: number;
  depth: number;
  height?: number;
  compartmentsCount: number;
  note?: string;
}

export interface AddItemToUdcRequest {
  loadingUnitId: number;
  itemId: number;
  quantity: number;
  compartmentId?: number;
  lot?: string;
  serialNumber?: string;
  expirationDate?: string;
  userName: string;
}

// ============================================================================
// PAGINAZIONE E FILTRI
// ============================================================================

export interface PaginationParams {
  skip?: number;
  take?: number;
  page?: number;
  pageSize?: number;
}

export interface SortParams {
  orderBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface SearchParams {
  search?: string;
  searchFields?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

// ============================================================================
// FILTRI SPECIFICI
// ============================================================================

export interface ItemFilters extends PaginationParams, SortParams, SearchParams {
  categoryId?: number;
  abcClass?: string;
  managementType?: ManagementType;
  belowMinStock?: boolean;
}

export interface ListFilters extends PaginationParams, SortParams, SearchParams {
  type?: ItemListType;
  status?: ItemListStatus;
  fromDate?: string;
  toDate?: string;
  priorityMin?: number;
  priorityMax?: number;
}

export interface StockFilters extends PaginationParams, SortParams, SearchParams {
  itemId?: number;
  areaId?: number;
  lot?: string;
  serialNumber?: string;
  belowMinStock?: boolean;
  isBlocked?: boolean;
}

export interface AlarmFilters extends PaginationParams, SortParams, SearchParams {
  machineId?: number;
  severity?: AlarmSeverity;
  isActive?: boolean;
  fromDate?: string;
  toDate?: string;
}

// ============================================================================
// MACHINES E BAYS (LOCATIONS)
// ============================================================================

export interface Machine {
  id: number;
  code: string;
  description?: string;
  machineType?: string;
  status?: MachineStatus;
  isActive: boolean;
  baysCount?: number;
  bays?: Bay[];
}

export interface Bay {
  id?: number;
  machineId: number;
  bayNumber: number;
  code?: string;
  description?: string;
  isOccupied: boolean;
  loadingUnitId?: number;
  loadingUnitBarcode?: string;
  destinationGroups?: DestinationGroup[];
  capacity?: number;
  currentWeight?: number;
  maxWeight?: number;
}
