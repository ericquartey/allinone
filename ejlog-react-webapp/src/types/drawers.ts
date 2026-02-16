// src/types/drawers.ts

/**
 * TypeScript types for Drawer/LoadingUnit and Compartment management
 * Based on Swing UI: RicercaCassettoPanel, UdcScompartazione, ScompartoGrafico
 * Backend entities: Udc, Supporto, Prodotto
 */

export interface Product {
  id: number;
  articleId: number;
  articleCode?: string;
  articleDescription?: string;
  quantity: number;
  lotCode?: string;
  serialNumber?: string;
  weight?: number;
  expirationDate?: string;
}

export interface Compartment {
  id: number;
  barcode?: string;

  // Position (in millimeters or normalized coordinates)
  xPosition: number;
  yPosition: number;

  // Dimensions (in millimeters or normalized coordinates)
  width: number;
  depth: number;

  // Fill percentage (0-100)
  fillPercentage: number;

  // Loading unit reference
  loadingUnitId: number;

  // Products inside this compartment
  products?: Product[];

  // Additional properties
  description?: string;
  row?: number;
  column?: number;
  progressive?: number;
  weight?: number;
  tare?: number;
  maxProducts?: number;
  maxQuantity?: number;
  currentQuantity?: number;
  isBlocked?: boolean;
  isReserved?: boolean;
  reservationCount?: number;
  lastModified?: string;
  lastInventory?: string;
}

export interface LoadingUnit {
  id: number;
  code: string;
  barcode?: string;
  description?: string;

  // Location
  locationId?: number;
  locationCode?: string;
  locationDescription?: string;

  // Warehouse
  warehouseId: number;
  warehouseName?: string;

  // Dimensions (in millimeters)
  width: number;
  depth: number;
  height: number;

  // Classification
  heightClass?: string;
  widthClass?: string;
  depthClass?: string;

  // Compartments
  compartments?: Compartment[];
  compartmentCount?: number;
  emptyCompartmentCount?: number;
  productCount?: number;

  // Status
  isBlocked?: boolean;
  isOccupied?: boolean;

  // Additional properties
  weight?: number;
  maxWeight?: number;
  channelId?: number;
  zoneId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface StaticAssociation {
  id: number;
  compartmentId: number;
  loadingUnitId: number;
  articleId: number;
  articleCode?: string;
  articleDescription?: string;
  priority?: number;
  maxQuantity?: number;
  lotCode?: string;
  associatedDate?: string;
}

export enum ViewDirection {
  NORTH = 'NORTH',
  SOUTH = 'SOUTH',
  EAST = 'EAST',
  WEST = 'WEST'
}

export enum CompartmentFillFilter {
  ALL = 'ALL',
  EMPTY = 'EMPTY',
  PARTIAL = 'PARTIAL',
  FULL = 'FULL'
}

export interface DrawerFilters {
  search?: string;
  limit?: number;
  offset?: number;
  warehouseId?: number;
  locationCode?: string;
  heightClass?: string;
  fillFilter?: CompartmentFillFilter;
  isBlocked?: boolean;
  hasReservations?: boolean;
}

export interface CompartmentFilters {
  search?: string;
  fillPercentageMin?: number;
  fillPercentageMax?: number;
  isEmpty?: boolean;
  isReserved?: boolean;
  articleId?: number;
}

export interface LoadingUnitsResponse {
  items: LoadingUnit[];
  totalCount: number;
}

export interface CompartmentsResponse {
  items: Compartment[];
  totalCount: number;
}

export interface CallLoadingUnitResponse {
  success: boolean;
  data?: {
    idBuffer?: number;
    udcId?: number;
    numeroUdc?: number;
    idLocazionePrelievo?: number;
    idLocazioneDeposito?: number;
    message?: string;
  };
  error?: string;
  message?: string;
}

export interface DestinationLocation {
  id: number;
  barcode?: string;
  description?: string;
  locationType?: number;
  warehouseId?: number;
  enabled?: boolean;
  automated?: boolean;
  status?: number;
}

// Request DTOs
export interface CreateLoadingUnitRequest {
  code: string;
  barcode?: string;
  description?: string;
  warehouseId: number;
  locationId?: number;
  width: number;
  depth: number;
  height: number;
  heightClass?: string;
  widthClass?: string;
  depthClass?: string;
}

export interface UpdateLoadingUnitRequest {
  code?: string;
  barcode?: string;
  description?: string;
  locationId?: number;
  isBlocked?: boolean;
}

export interface UpdateCompartmentFillPercentageRequest {
  percentage: number;
}

export interface BoxToCompartmentRequest {
  barcode?: string;
  command?: number;
}

export interface CreateCompartmentRequest {
  xPosition: number;  // in mm
  yPosition: number;  // in mm
  width: number;      // in mm
  depth: number;      // in mm
}

// 3D Visualization types
export interface Compartment3D extends Compartment {
  // 3D specific properties
  color?: string;
  opacity?: number;
  isHovered?: boolean;
  isSelected?: boolean;
}

export interface DrawerView3DState {
  viewDirection: ViewDirection;
  showDimensions: boolean;
  showGrid: boolean;
  rotation: {
    x: number;
    y: number;
    z: number;
  };
  zoom: number;
}
