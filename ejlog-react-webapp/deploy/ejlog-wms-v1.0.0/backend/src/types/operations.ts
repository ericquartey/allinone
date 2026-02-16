// ============================================================================
// EJLOG WMS - Operations TypeScript Types
// Types specifici per operazioni di picking, refilling, inventario
// ============================================================================

import type { Item, MissionOperation } from './models';

// ============================================================================
// PICKING OPERATION TYPES
// ============================================================================

export interface PickingOperation extends MissionOperation {
  // Info Lista
  listNumber?: string;
  listDescription?: string;
  listRowNumber?: string;

  // Info Articolo
  itemCode: string;
  itemDescription: string;
  itemUm?: string;
  itemBarcode?: string;
  itemImageUrl?: string;

  // Gestione Lotto/Matricola
  requiresLot: boolean;
  requiresSerialNumber: boolean;
  requiresExpiryDate: boolean;
  lot?: string;
  serialNumber?: string;
  expiryDate?: string;

  // Quantità
  requestedQuantity: number;
  availableQuantity: number;
  processedQuantity: number;
  remainingQuantity: number;

  // UDC e Ubicazione
  udcId?: number;
  udcBarcode?: string;
  compartmentId?: number;
  compartmentBarcode?: string;
  locationCode?: string;
  locationWarehouse?: string;
  locationX?: number;
  locationY?: number;
  locationZ?: number;

  // Stato
  canBeExecuted: boolean;
  isCompleted: boolean;
  completedAt?: string;
  completedBy?: string;

  // Note e causali
  notes?: string;
  reasonId?: number;
  reasonDescription?: string;
}

export interface PickingList {
  id: number;
  code: string;
  description: string;
  type: 'PICKING' | 'REFILLING' | 'INVENTORY' | 'TRANSFER';
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: number;

  // Totali
  totalRows: number;
  completedRows: number;
  totalQuantity: number;
  processedQuantity: number;
  progressPercentage: number;

  // Operazioni
  operations?: PickingOperation[];

  // Meta
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  createdBy: string;
  assignedTo?: string;

  // Info Aggiuntive
  orderNumber?: string;
  cause?: string;
  exitPoint?: number;
  selectedWarehouses?: number[];
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface BarcodeValidation {
  valid: boolean;
  message?: string;
  itemCode?: string;
  lot?: string;
  serialNumber?: string;
  expiryDate?: string;
  quantity?: number;
}

export interface QuantityValidation {
  valid: boolean;
  message?: string;
  min: number;
  max: number;
  requested: number;
}

export interface LotValidation {
  valid: boolean;
  message?: string;
  required: boolean;
  lot?: string;
  expiryDate?: string;
}

// ============================================================================
// OPERATION COMPLETION TYPES
// ============================================================================

export interface CompletePickingRequest {
  operationId: number;
  quantity: number;
  wastedQuantity?: number;
  lot?: string;
  serialNumber?: string;
  expiryDate?: string;
  barcode?: string;
  udcBarcode?: string;
  compartmentId?: number;
  printerName?: string;
  nrLabels?: number;
  ignoreRemainingQuantity?: boolean;
  userName: string;
  notes?: string;
}

export interface CompletePickingResponse {
  success: boolean;
  message: string;
  operationId: number;
  movementId?: number;
  nextOperationId?: number;
  listCompleted: boolean;
  printJobId?: number;
}

// ============================================================================
// UDC SELECTION TYPES
// ============================================================================

export interface UdcOption {
  id: number;
  barcode: string;
  compartments: CompartmentOption[];
  currentWeight?: number;
  maxWeight?: number;
  fillPercentage: number;
  location?: string;
}

export interface CompartmentOption {
  id: number;
  barcode?: string;
  position: number;
  currentQuantity: number;
  maxQuantity?: number;
  fillPercentage: number;
  productCode?: string;
  lot?: string;
}

// ============================================================================
// REFILLING OPERATION TYPES
// ============================================================================

export interface RefillingOperation extends PickingOperation {
  // Info specifiche refilling
  destinationUdcId?: number;
  destinationCompartmentId?: number;
  destinationLocation?: string;

  // Merge con prodotto esistente
  canMergeWithExisting: boolean;
  existingLot?: string;
  existingQuantity?: number;
}

export interface CompleteRefillingRequest extends CompletePickingRequest {
  destinationUdcId?: number;
  destinationCompartmentId?: number;
  mergeWithExisting?: boolean;
}

// ============================================================================
// INVENTORY OPERATION TYPES
// ============================================================================

export interface InventoryOperation extends PickingOperation {
  // Quantità inventario
  expectedQuantity: number;
  countedQuantity?: number;
  variance?: number;
  variancePercentage?: number;

  // Stato inventario
  isCounted: boolean;
  isRecounted: boolean;
  needsRecount: boolean;
  recountReason?: string;
}

// ============================================================================
// OPERATION FILTERS
// ============================================================================

export interface OperationFilters {
  listId?: number;
  machineId?: number;
  udcId?: number;
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  itemCode?: string;
  locationCode?: string;
  fromDate?: string;
  toDate?: string;
}

// ============================================================================
// EXECUTION STATE
// ============================================================================

export interface PickingExecutionState {
  // Lista corrente
  list: PickingList | null;
  operations: PickingOperation[];
  currentOperationIndex: number;
  currentOperation: PickingOperation | null;

  // Validazioni
  barcodeValidated: boolean;
  scannedBarcode: string;
  quantityEntered: number;

  // Lotto/Matricola
  lotEntered: string;
  serialNumberEntered: string;
  expiryDateEntered: string;

  // UDC
  selectedUdc: UdcOption | null;
  selectedCompartment: CompartmentOption | null;

  // UI State
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  success: string | null;

  // Progress
  progressPercentage: number;
  remainingOperations: number;
}

// ============================================================================
// OPERATION HISTORY
// ============================================================================

export interface OperationHistoryEntry {
  id: number;
  operationId: number;
  action: 'STARTED' | 'PAUSED' | 'RESUMED' | 'COMPLETED' | 'CANCELLED';
  timestamp: string;
  userName: string;
  data?: Record<string, any>;
  notes?: string;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface OperationError {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, any>;
  canRetry: boolean;
  suggestedAction?: string;
}

// ============================================================================
// STATISTICS
// ============================================================================

export interface OperationStatistics {
  totalOperations: number;
  completedOperations: number;
  pendingOperations: number;
  cancelledOperations: number;
  averageTimePerOperation: number; // seconds
  totalTime: number; // seconds
  itemsPerHour: number;
  errorRate: number; // percentage
}
