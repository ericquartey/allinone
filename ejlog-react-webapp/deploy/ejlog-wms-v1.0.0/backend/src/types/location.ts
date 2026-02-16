// ============================================================================
// EJLOG WMS - Location Types
// TypeScript type definitions for warehouse location management
// ============================================================================

// ============================================
// Base Location Types
// ============================================

export type LocationType =
  | 'RACK'          // Scaffalatura standard
  | 'BUFFER'        // Buffer temporaneo
  | 'PICKING'       // Postazione picking
  | 'STORAGE'       // Stoccaggio profondo
  | 'TRANSIT'       // Transito/passaggio
  | 'SHIPPING'      // Spedizione
  | 'RECEIVING'     // Ricevimento
  | 'STAGING'       // Staging area
  | 'VIRTUAL';      // Ubicazione virtuale

export type LocationStatus =
  | 'AVAILABLE'     // Disponibile
  | 'OCCUPIED'      // Occupata
  | 'RESERVED'      // Riservata
  | 'BLOCKED'       // Bloccata
  | 'MAINTENANCE'   // In manutenzione
  | 'DAMAGED';      // Danneggiata

export type LocationAccessType =
  | 'MANUAL'        // Accesso manuale
  | 'AUTOMATIC'     // Accesso automatico (AGV, shuttle)
  | 'SEMI_AUTO'     // Semi-automatico
  | 'RESTRICTED';   // Accesso ristretto

// ============================================
// Main Location Interface
// ============================================

export interface Location {
  // Identification
  id: string;
  code: string;              // Codice ubicazione (es: "A01-02-03")
  barcode: string;           // Barcode fisico

  // Classification
  type: LocationType;
  status: LocationStatus;
  accessType: LocationAccessType;

  // Physical properties
  coordinates: LocationCoordinates;
  dimensions: LocationDimensions;

  // Hierarchy
  warehouseId: string;
  warehouseName: string;
  zoneId: string;
  zoneName: string;
  areaId?: string;
  areaName?: string;

  // Occupancy
  isOccupied: boolean;
  occupancy: LocationOccupancy | null;
  capacity: LocationCapacity;

  // Configuration
  config: LocationConfig;

  // Restrictions
  restrictions: LocationRestrictions;

  // Integration
  plcDeviceId?: string;
  plcSignalIds?: string[];

  // Metadata
  lastMovementAt: Date | null;
  lastInventoryAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}

// ============================================
// Location Details
// ============================================

export interface LocationCoordinates {
  // Physical position
  x: number;              // Coordinate X (mm)
  y: number;              // Coordinate Y (mm)
  z: number;              // Coordinate Z (mm - altezza)

  // Logical position
  aisle: string;          // Corridoio
  bay: string;            // Campata
  level: string;          // Livello
  position: string;       // Posizione
}

export interface LocationDimensions {
  width: number;          // Larghezza (mm)
  depth: number;          // Profondità (mm)
  height: number;         // Altezza (mm)
  maxWeight: number;      // Peso max (kg)
  maxVolume: number;      // Volume max (m³)
}

export interface LocationOccupancy {
  udcBarcode: string;
  udcType: string;
  itemCode?: string;
  itemDescription?: string;
  quantity: number;
  weight: number;         // kg
  volume: number;         // m³
  occupiedSince: Date;
  reservedBy?: string;    // User/process che ha riservato
  reservedUntil?: Date;
}

export interface LocationCapacity {
  maxUdcs: number;        // Numero max UDC
  maxWeight: number;      // Peso max totale
  maxVolume: number;      // Volume max totale
  currentWeight: number;  // Peso attuale
  currentVolume: number;  // Volume attuale
  utilizationPercent: number;
}

export interface LocationConfig {
  // Picking configuration
  isPickingLocation: boolean;
  pickingPriority: number;
  pickingZoneId?: string;

  // Storage configuration
  isStorageLocation: boolean;
  storagePriority: number;
  storageZoneId?: string;

  // Replenishment
  requiresReplenishment: boolean;
  replenishmentThreshold: number;
  replenishmentSourceId?: string;

  // Quality control
  requiresQualityCheck: boolean;
  qualityCheckType?: string;

  // Other
  allowMixedProducts: boolean;
  allowMixedBatches: boolean;
  fifoEnabled: boolean;
  lifoEnabled: boolean;
}

export interface LocationRestrictions {
  // Product restrictions
  allowedProductCategories: string[];
  blockedProductCategories: string[];
  allowedItemCodes: string[];
  blockedItemCodes: string[];

  // Dimensional restrictions
  minWeight: number;
  maxWeight: number;
  minVolume: number;
  maxVolume: number;

  // Environmental
  requiresTemperatureControl: boolean;
  minTemperature?: number;
  maxTemperature?: number;
  requiresHumidityControl: boolean;

  // Access
  requiresAuthorization: boolean;
  authorizedUsers: string[];
  authorizedRoles: string[];
}

// ============================================
// Location History & Events
// ============================================

export interface LocationEvent {
  id: string;
  locationId: string;
  locationCode: string;
  type: LocationEventType;
  description: string;
  timestamp: Date;
  userId?: string;
  userName?: string;
  details: Record<string, any>;
}

export type LocationEventType =
  | 'OCCUPIED'
  | 'FREED'
  | 'RESERVED'
  | 'UNRESERVED'
  | 'BLOCKED'
  | 'UNBLOCKED'
  | 'INVENTORY_CHECK'
  | 'MAINTENANCE_START'
  | 'MAINTENANCE_END'
  | 'CONFIG_CHANGED'
  | 'DAMAGE_REPORTED'
  | 'DAMAGE_FIXED';

export interface LocationMovement {
  id: string;
  locationId: string;
  locationCode: string;
  movementType: 'IN' | 'OUT' | 'TRANSFER';
  udcBarcode: string;
  itemCode?: string;
  quantity: number;
  fromLocationId?: string;
  toLocationId?: string;
  userId: string;
  userName: string;
  timestamp: Date;
  reason?: string;
}

// ============================================
// Warehouse Structure
// ============================================

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  description: string;
  address: string;
  totalLocations: number;
  availableLocations: number;
  occupiedLocations: number;
  zones: Zone[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Zone {
  id: string;
  code: string;
  name: string;
  description: string;
  warehouseId: string;
  type: 'STORAGE' | 'PICKING' | 'BUFFER' | 'SHIPPING' | 'RECEIVING' | 'OTHER';
  totalLocations: number;
  availableLocations: number;
  areas: Area[];
  coordinates: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Area {
  id: string;
  code: string;
  name: string;
  description: string;
  zoneId: string;
  totalLocations: number;
  availableLocations: number;
  coordinates: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Request/Response Types
// ============================================

export interface GetLocationsRequest {
  warehouseId?: string;
  zoneId?: string;
  areaId?: string;
  type?: LocationType;
  status?: LocationStatus;
  search?: string;
  isOccupied?: boolean;
  page?: number;
  pageSize?: number;
}

export interface GetLocationsResponse {
  locations: Location[];
  total: number;
  page: number;
  pageSize: number;
  summary: {
    totalLocations: number;
    availableLocations: number;
    occupiedLocations: number;
    blockedLocations: number;
    averageOccupancy: number;
  };
}

export interface GetLocationHistoryRequest {
  locationId: string;
  startDate?: Date;
  endDate?: Date;
  eventTypes?: LocationEventType[];
  limit?: number;
}

export interface UpdateLocationRequest {
  locationId: string;
  status?: LocationStatus;
  config?: Partial<LocationConfig>;
  restrictions?: Partial<LocationRestrictions>;
  tags?: string[];
}

export interface ReserveLocationRequest {
  locationId: string;
  reservedBy: string;
  reservedUntil: Date;
  reason: string;
}

export interface BlockLocationRequest {
  locationId: string;
  reason: string;
  blockedBy: string;
  blockedUntil?: Date;
}

export interface GetWarehouseMapRequest {
  warehouseId: string;
  zoneId?: string;
  includeOccupancy?: boolean;
  includeSignals?: boolean;
}

export interface WarehouseMapData {
  warehouse: Warehouse;
  zones: Zone[];
  locations: Location[];
  heatmap?: {
    locationId: string;
    value: number;
    label: string;
  }[];
}

// ============================================
// Location Analytics
// ============================================

export interface LocationAnalytics {
  locationId: string;
  locationCode: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  metrics: {
    totalMovements: number;
    averageOccupancyPercent: number;
    averageDwellTime: number;        // seconds
    peakOccupancyTime: Date;
    utilizationPercent: number;
    turnoverRate: number;
  };
  movementsByHour: {
    hour: number;
    count: number;
  }[];
  topProducts: {
    itemCode: string;
    itemDescription: string;
    quantity: number;
    frequency: number;
  }[];
}

// ============================================
// Location Suggestion
// ============================================

export interface LocationSuggestion {
  location: Location;
  score: number;
  reasons: string[];
  distance: number;           // meters
  estimatedTime: number;      // seconds
}

export interface GetLocationSuggestionsRequest {
  itemCode?: string;
  udcType?: string;
  quantity?: number;
  weight?: number;
  volume?: number;
  operationType: 'STORAGE' | 'PICKING' | 'TRANSFER';
  maxSuggestions?: number;
}

// ============================================
// Constants & Labels
// ============================================

export const LocationTypeLabels: Record<LocationType, string> = {
  RACK: 'Scaffalatura',
  BUFFER: 'Buffer',
  PICKING: 'Picking',
  STORAGE: 'Stoccaggio',
  TRANSIT: 'Transito',
  SHIPPING: 'Spedizione',
  RECEIVING: 'Ricevimento',
  STAGING: 'Staging',
  VIRTUAL: 'Virtuale'
};

export const LocationStatusLabels: Record<LocationStatus, string> = {
  AVAILABLE: 'Disponibile',
  OCCUPIED: 'Occupata',
  RESERVED: 'Riservata',
  BLOCKED: 'Bloccata',
  MAINTENANCE: 'Manutenzione',
  DAMAGED: 'Danneggiata'
};

export const LocationStatusColors = {
  AVAILABLE: 'green',
  OCCUPIED: 'blue',
  RESERVED: 'yellow',
  BLOCKED: 'red',
  MAINTENANCE: 'orange',
  DAMAGED: 'purple'
} as const;
