// ============================================================================
// EJLOG WMS - UDC (Unità Di Carico / Loading Units) Service
// Centralized service for all UDC-related API operations
// ============================================================================

import axios, { AxiosError } from 'axios';
import { API_BASE_URL } from '../config/api';

// ============================================================================
// API CLIENT CONFIGURATION
// ============================================================================

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * UDC Status enum
 */
export enum UdcStatus {
  EMPTY = 'EMPTY',
  OCCUPIED = 'OCCUPIED',
  IN_TRANSIT = 'IN_TRANSIT',
  BLOCKED = 'BLOCKED',
  RESERVED = 'RESERVED',
}

/**
 * UDC Type enum
 */
export enum UdcType {
  PALLET = 'PALLET',
  BOX = 'BOX',
  CONTAINER = 'CONTAINER',
  CART = 'CART',
  CUSTOM = 'CUSTOM',
}

/**
 * Movement Type enum
 */
export enum MovementType {
  CREATION = 'CREATION',
  STOCKING = 'STOCKING',
  PICKING = 'PICKING',
  TRANSFER = 'TRANSFER',
  REFILLING = 'REFILLING',
  ADJUSTMENT = 'ADJUSTMENT',
  DELETION = 'DELETION',
}

/**
 * Compartment interface
 */
export interface Compartment {
  id: number;
  position: number;
  barcode?: string;
  productCode?: string;
  productDescription?: string;
  lot?: string;
  serialNumber?: string;
  expirationDate?: string;
  currentQuantity: number;
  maxQuantity?: number;
  fillPercentage: number;
  um?: string;
  isBlocked: boolean;
  blockReason?: string;
}

/**
 * UDC Content interface (product in UDC)
 */
export interface UdcContent {
  id: number;
  itemCode: string;
  itemDescription: string;
  lot?: string;
  serialNumber?: string;
  quantity: number;
  um: string;
  expirationDate?: string;
  stockedDate: string;
  compartmentId?: number;
  isBlocked: boolean;
  blockReason?: string;
}

/**
 * UDC Movement interface
 */
export interface UdcMovement {
  id: number;
  date: string;
  type: MovementType;
  fromLocation?: string;
  toLocation?: string;
  operator?: string;
  listCode?: string;
  note?: string;
  quantity?: number;
  itemCode?: string;
}

/**
 * Full UDC interface
 */
export interface Udc {
  id: number;
  barcode: string;
  type: UdcType;
  description?: string;
  status: UdcStatus;
  locationCode?: string;
  locationId?: number;
  warehouseZone?: string;
  warehouseId?: number;
  areaId?: number;
  createdDate: string;
  lastMovementDate?: string;
  isBlocked: boolean;
  blockReason?: string;
  weight?: number;
  volume?: number;
  maxWeight?: number;
  maxVolume?: number;
  width?: number;
  depth?: number;
  height?: number;
  fillPercentage?: number;
  compartments?: Compartment[];
  contents?: UdcContent[];
  itemsCount?: number;
  totalQuantity?: number;
  note?: string;
}

/**
 * UDC List Summary interface (for list views)
 */
export interface UdcSummary {
  id: number;
  barcode: string;
  type: UdcType;
  locationCode?: string;
  locationId?: number;
  status: UdcStatus;
  itemsCount: number;
  totalQuantity: number;
  lastMovementDate?: string;
  isBlocked: boolean;
  fillPercentage?: number;
  warehouseZone?: string;
}

/**
 * Create UDC parameters
 */
export interface CreateUdcParams {
  barcode?: string; // If not provided, system generates
  type: UdcType;
  description?: string;
  width: number;
  depth: number;
  height?: number;
  compartmentsCount?: number;
  maxWeight?: number;
  maxVolume?: number;
  locationId?: number;
  warehouseId?: number;
  areaId?: number;
  note?: string;
}

/**
 * Update UDC parameters
 */
export interface UpdateUdcParams {
  udcId: number;
  description?: string;
  note?: string;
  isBlocked?: boolean;
  blockReason?: string;
  locationId?: number;
  maxWeight?: number;
  maxVolume?: number;
}

/**
 * Add item to UDC parameters
 */
export interface AddItemToUdcParams {
  udcId: number;
  itemCode: string;
  quantity: number;
  lot?: string;
  serialNumber?: string;
  expirationDate?: string;
  compartmentId?: number;
  reasonId?: number;
  reasonNotes?: string;
}

/**
 * Transfer UDC parameters
 */
export interface TransferUdcParams {
  udcId: number;
  toLocationId?: number;
  toLocationCode?: string;
  operator?: string;
  listCode?: string;
  note?: string;
}

/**
 * UDC Filter parameters
 */
export interface UdcFilterParams {
  status?: UdcStatus;
  type?: UdcType;
  locationId?: number;
  warehouseId?: number;
  areaId?: number;
  barcode?: string;
  isBlocked?: boolean;
  isEmpty?: boolean;
  search?: string;
}

/**
 * API Response wrapper
 */
export interface APIResponse<T> {
  result: 'OK' | 'ERROR';
  message?: string;
  exportedItems?: T[];
  data?: T;
  totalCount?: number;
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Handle API errors with consistent format
 */
function handleAPIError(error: unknown): APIResponse<any> {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<APIResponse<any>>;
    if (axiosError.response?.data) {
      return axiosError.response.data;
    }
    return {
      result: 'ERROR',
      message: axiosError.message || 'Errore di connessione al server',
    };
  }
  return {
    result: 'ERROR',
    message: error instanceof Error ? error.message : 'Errore sconosciuto',
  };
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Get UDC list with optional filters
 *
 * @param filters - Optional filter parameters
 * @returns Promise with list of UDCs
 *
 * @example
 * ```typescript
 * const udcs = await UdcService.getUdcs({ status: UdcStatus.OCCUPIED });
 * ```
 */
export async function getUdcs(filters?: UdcFilterParams): Promise<UdcSummary[]> {
  try {
    // ========================================================================
    // NOTA: Backend endpoint /UDCs non ancora implementato (404)
    // Usiamo mock data temporaneo finché il backend non sarà disponibile
    // TODO: Rimuovere mock e abilitare chiamata API quando backend è pronto
    // ========================================================================

    console.warn('[UDC Service] Backend endpoint /UDCs not available (404) - using mock data');

    // Mock data per testing frontend
    const mockUdcs: UdcSummary[] = [
      {
        id: 1,
        barcode: 'UDC001234',
        type: UdcType.PALLET,
        status: UdcStatus.OCCUPIED,
        locationCode: 'A01-02-03',
        locationId: 101,
        warehouseZone: 'Zona A',
        itemsCount: 5,
        totalQuantity: 150,
        lastMovementDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        isBlocked: false,
        fillPercentage: 75,
      },
      {
        id: 2,
        barcode: 'UDC001235',
        type: UdcType.BOX,
        status: UdcStatus.EMPTY,
        locationCode: 'A01-03-01',
        locationId: 102,
        warehouseZone: 'Zona A',
        itemsCount: 0,
        totalQuantity: 0,
        lastMovementDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        isBlocked: false,
        fillPercentage: 0,
      },
      {
        id: 3,
        barcode: 'UDC001236',
        type: UdcType.PALLET,
        status: UdcStatus.OCCUPIED,
        locationCode: 'B02-01-05',
        locationId: 201,
        warehouseZone: 'Zona B',
        itemsCount: 3,
        totalQuantity: 85,
        lastMovementDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        isBlocked: false,
        fillPercentage: 60,
      },
      {
        id: 4,
        barcode: 'UDC001237',
        type: UdcType.CONTAINER,
        status: UdcStatus.IN_TRANSIT,
        warehouseZone: 'In Transito',
        itemsCount: 8,
        totalQuantity: 250,
        lastMovementDate: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        isBlocked: false,
        fillPercentage: 90,
      },
      {
        id: 5,
        barcode: 'UDC001238',
        type: UdcType.PALLET,
        status: UdcStatus.BLOCKED,
        locationCode: 'C03-02-01',
        locationId: 301,
        warehouseZone: 'Zona C',
        itemsCount: 2,
        totalQuantity: 45,
        lastMovementDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        isBlocked: true,
        fillPercentage: 30,
      },
      {
        id: 6,
        barcode: 'UDC001239',
        type: UdcType.CART,
        status: UdcStatus.OCCUPIED,
        locationCode: 'D01-01-01',
        locationId: 401,
        warehouseZone: 'Zona D',
        itemsCount: 12,
        totalQuantity: 300,
        lastMovementDate: new Date().toISOString(),
        isBlocked: false,
        fillPercentage: 85,
      },
      {
        id: 7,
        barcode: 'UDC001240',
        type: UdcType.PALLET,
        status: UdcStatus.EMPTY,
        locationCode: 'A02-01-01',
        locationId: 103,
        warehouseZone: 'Zona A',
        itemsCount: 0,
        totalQuantity: 0,
        lastMovementDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        isBlocked: false,
        fillPercentage: 0,
      },
      {
        id: 8,
        barcode: 'UDC001241',
        type: UdcType.BOX,
        status: UdcStatus.OCCUPIED,
        locationCode: 'B01-02-03',
        locationId: 202,
        warehouseZone: 'Zona B',
        itemsCount: 4,
        totalQuantity: 120,
        lastMovementDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        isBlocked: false,
        fillPercentage: 65,
      },
    ];

    // Apply filters if provided
    let filteredUdcs = mockUdcs;

    if (filters) {
      if (filters.status) {
        filteredUdcs = filteredUdcs.filter(udc => udc.status === filters.status);
      }
      if (filters.type) {
        filteredUdcs = filteredUdcs.filter(udc => udc.type === filters.type);
      }
      if (filters.locationId) {
        filteredUdcs = filteredUdcs.filter(udc => udc.locationId === filters.locationId);
      }
      if (filters.barcode) {
        filteredUdcs = filteredUdcs.filter(udc =>
          udc.barcode.toLowerCase().includes(filters.barcode!.toLowerCase())
        );
      }
      if (filters.isBlocked !== undefined) {
        filteredUdcs = filteredUdcs.filter(udc => udc.isBlocked === filters.isBlocked);
      }
      if (filters.isEmpty !== undefined) {
        filteredUdcs = filteredUdcs.filter(udc =>
          filters.isEmpty ? udc.itemsCount === 0 : udc.itemsCount > 0
        );
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredUdcs = filteredUdcs.filter(udc =>
          udc.barcode.toLowerCase().includes(searchLower) ||
          udc.locationCode?.toLowerCase().includes(searchLower) ||
          udc.warehouseZone?.toLowerCase().includes(searchLower)
        );
      }
    }

    return filteredUdcs;

    // ========================================================================
    // CODICE ORIGINALE DA RIABILITARE QUANDO BACKEND SARA' PRONTO:
    // ========================================================================
    // const queryParams = new URLSearchParams();
    //
    // if (filters?.status) queryParams.append('status', filters.status);
    // if (filters?.type) queryParams.append('type', filters.type);
    // if (filters?.locationId) queryParams.append('locationId', filters.locationId.toString());
    // if (filters?.warehouseId) queryParams.append('warehouseId', filters.warehouseId.toString());
    // if (filters?.areaId) queryParams.append('areaId', filters.areaId.toString());
    // if (filters?.barcode) queryParams.append('barcode', filters.barcode);
    // if (filters?.isBlocked !== undefined) queryParams.append('isBlocked', filters.isBlocked.toString());
    // if (filters?.isEmpty !== undefined) queryParams.append('isEmpty', filters.isEmpty.toString());
    // if (filters?.search) queryParams.append('search', filters.search);
    //
    // const url = queryParams.toString() ? `/UDCs?${queryParams}` : '/UDCs';
    // const response = await apiClient.get<APIResponse<UdcSummary>>(url);
    //
    // if (response.data.result === 'OK' && response.data.exportedItems) {
    //   return response.data.exportedItems;
    // }
    //
    // return [];
  } catch (error) {
    console.error('Error fetching UDCs:', error);
    return [];
  }
}

/**
 * Get UDC by ID with full details
 *
 * @param udcId - UDC identifier
 * @returns Promise with UDC details or null
 *
 * @example
 * ```typescript
 * const udc = await UdcService.getUdcById(123);
 * if (udc) {
 *   console.log(`UDC ${udc.barcode} has ${udc.compartments.length} compartments`);
 * }
 * ```
 */
export async function getUdcById(udcId: number): Promise<Udc | null> {
  try {
    const response = await apiClient.get<APIResponse<Udc>>(`/UDCs/${udcId}`);

    if (response.data.result === 'OK' && response.data.data) {
      return response.data.data;
    }

    return null;
  } catch (error) {
    console.error(`Error fetching UDC ${udcId}:`, error);
    return null;
  }
}

/**
 * Get UDC by barcode
 *
 * @param barcode - UDC barcode
 * @returns Promise with UDC details or null
 *
 * @example
 * ```typescript
 * const udc = await UdcService.getUdcByBarcode('UDC001234');
 * ```
 */
export async function getUdcByBarcode(barcode: string): Promise<Udc | null> {
  try {
    const response = await apiClient.get<APIResponse<Udc>>(`/UDCs/barcode/${encodeURIComponent(barcode)}`);

    if (response.data.result === 'OK' && response.data.data) {
      return response.data.data;
    }

    return null;
  } catch (error) {
    console.error(`Error fetching UDC by barcode ${barcode}:`, error);
    return null;
  }
}

/**
 * Create new UDC
 *
 * @param params - UDC creation parameters
 * @returns Promise with API response
 *
 * @example
 * ```typescript
 * const response = await UdcService.createUdc({
 *   type: UdcType.PALLET,
 *   width: 800,
 *   depth: 1200,
 *   height: 1000,
 *   compartmentsCount: 4,
 * });
 * ```
 */
export async function createUdc(params: CreateUdcParams): Promise<APIResponse<Udc>> {
  try {
    const response = await apiClient.post<APIResponse<Udc>>('/UDCs', params);
    return response.data;
  } catch (error) {
    return handleAPIError(error);
  }
}

/**
 * Update UDC information
 *
 * @param params - Update parameters
 * @returns Promise with API response
 *
 * @example
 * ```typescript
 * await UdcService.updateUdc({
 *   udcId: 123,
 *   isBlocked: true,
 *   blockReason: 'Merce danneggiata',
 * });
 * ```
 */
export async function updateUdc(params: UpdateUdcParams): Promise<APIResponse<Udc>> {
  try {
    const { udcId, ...updateData } = params;
    const response = await apiClient.put<APIResponse<Udc>>(`/UDCs/${udcId}`, updateData);
    return response.data;
  } catch (error) {
    return handleAPIError(error);
  }
}

/**
 * Delete UDC (only if empty)
 *
 * @param udcId - UDC identifier
 * @returns Promise with API response
 *
 * @example
 * ```typescript
 * const response = await UdcService.deleteUdc(123);
 * if (response.result === 'OK') {
 *   console.log('UDC eliminata con successo');
 * }
 * ```
 */
export async function deleteUdc(udcId: number): Promise<APIResponse<void>> {
  try {
    const response = await apiClient.delete<APIResponse<void>>(`/UDCs/${udcId}`);
    return response.data;
  } catch (error) {
    return handleAPIError(error);
  }
}

// ============================================================================
// COMPARTMENT OPERATIONS
// ============================================================================

/**
 * Get UDC compartments
 *
 * @param udcId - UDC identifier
 * @returns Promise with list of compartments
 *
 * @example
 * ```typescript
 * const compartments = await UdcService.getUdcCompartments(123);
 * console.log(`Found ${compartments.length} compartments`);
 * ```
 */
export async function getUdcCompartments(udcId: number): Promise<Compartment[]> {
  try {
    const response = await apiClient.get<APIResponse<Compartment>>(`/UDCs/${udcId}/compartments`);

    if (response.data.result === 'OK' && response.data.exportedItems) {
      return response.data.exportedItems;
    }

    return [];
  } catch (error) {
    console.error(`Error fetching compartments for UDC ${udcId}:`, error);
    return [];
  }
}

/**
 * Get available compartments for product (empty or same product/lot)
 *
 * @param udcId - UDC identifier
 * @param itemCode - Product code
 * @param lot - Product lot (optional)
 * @returns Promise with list of available compartments
 *
 * @example
 * ```typescript
 * const available = await UdcService.getAvailableCompartments(123, 'ART001', 'LOT001');
 * ```
 */
export async function getAvailableCompartments(
  udcId: number,
  itemCode: string,
  lot?: string
): Promise<Compartment[]> {
  const compartments = await getUdcCompartments(udcId);

  return compartments.filter((comp) => {
    // Empty compartment is always available
    if (!comp.productCode) return true;

    // Same product
    if (comp.productCode === itemCode) {
      // If lot specified, must match
      if (lot) {
        return !comp.lot || comp.lot === lot;
      }
      return true;
    }

    return false;
  });
}

// ============================================================================
// CONTENT OPERATIONS
// ============================================================================

/**
 * Get UDC contents (products/items)
 *
 * @param udcId - UDC identifier
 * @returns Promise with list of UDC contents
 *
 * @example
 * ```typescript
 * const contents = await UdcService.getUdcContents(123);
 * const totalQty = contents.reduce((sum, c) => sum + c.quantity, 0);
 * ```
 */
export async function getUdcContents(udcId: number): Promise<UdcContent[]> {
  try {
    const response = await apiClient.get<APIResponse<UdcContent>>(`/UDCs/${udcId}/contents`);

    if (response.data.result === 'OK' && response.data.exportedItems) {
      return response.data.exportedItems;
    }

    return [];
  } catch (error) {
    console.error(`Error fetching contents for UDC ${udcId}:`, error);
    return [];
  }
}

/**
 * Add item to UDC
 *
 * @param params - Add item parameters
 * @returns Promise with API response
 *
 * @example
 * ```typescript
 * await UdcService.addItemToUdc({
 *   udcId: 123,
 *   itemCode: 'ART001',
 *   quantity: 50,
 *   lot: 'LOT001',
 *   compartmentId: 5,
 * });
 * ```
 */
export async function addItemToUdc(params: AddItemToUdcParams): Promise<APIResponse<any>> {
  try {
    const { udcId, ...itemData } = params;
    const response = await apiClient.post<APIResponse<any>>(`/UDCs/${udcId}/add-item`, itemData);
    return response.data;
  } catch (error) {
    return handleAPIError(error);
  }
}

/**
 * Remove item from UDC
 *
 * @param udcId - UDC identifier
 * @param contentId - Content identifier to remove
 * @param quantity - Quantity to remove (optional, if not specified removes all)
 * @returns Promise with API response
 *
 * @example
 * ```typescript
 * await UdcService.removeItemFromUdc(123, 456, 25);
 * ```
 */
export async function removeItemFromUdc(
  udcId: number,
  contentId: number,
  quantity?: number
): Promise<APIResponse<any>> {
  try {
    const response = await apiClient.delete<APIResponse<any>>(`/UDCs/${udcId}/contents/${contentId}`, {
      data: { quantity },
    });
    return response.data;
  } catch (error) {
    return handleAPIError(error);
  }
}

// ============================================================================
// MOVEMENT OPERATIONS
// ============================================================================

/**
 * Get UDC movement history
 *
 * @param udcId - UDC identifier
 * @returns Promise with list of movements
 *
 * @example
 * ```typescript
 * const movements = await UdcService.getUdcMovements(123);
 * console.log(`UDC has ${movements.length} movements`);
 * ```
 */
export async function getUdcMovements(udcId: number): Promise<UdcMovement[]> {
  try {
    const response = await apiClient.get<APIResponse<UdcMovement>>(`/UDCs/${udcId}/movements`);

    if (response.data.result === 'OK' && response.data.exportedItems) {
      return response.data.exportedItems;
    }

    return [];
  } catch (error) {
    console.error(`Error fetching movements for UDC ${udcId}:`, error);
    return [];
  }
}

/**
 * Transfer UDC to new location
 *
 * @param params - Transfer parameters
 * @returns Promise with API response
 *
 * @example
 * ```typescript
 * await UdcService.transferUdc({
 *   udcId: 123,
 *   toLocationCode: 'A01-02-03',
 *   operator: 'OPER01',
 *   note: 'Ottimizzazione spazio',
 * });
 * ```
 */
export async function transferUdc(params: TransferUdcParams): Promise<APIResponse<any>> {
  try {
    const { udcId, ...transferData } = params;
    const response = await apiClient.post<APIResponse<any>>(`/UDCs/${udcId}/transfer`, transferData);
    return response.data;
  } catch (error) {
    return handleAPIError(error);
  }
}

// ============================================================================
// BLOCKING/UNBLOCKING OPERATIONS
// ============================================================================

/**
 * Block UDC
 *
 * @param udcId - UDC identifier
 * @param reason - Blocking reason
 * @returns Promise with API response
 *
 * @example
 * ```typescript
 * await UdcService.blockUdc(123, 'Merce danneggiata - controllo qualità');
 * ```
 */
export async function blockUdc(udcId: number, reason: string): Promise<APIResponse<any>> {
  return updateUdc({
    udcId,
    isBlocked: true,
    blockReason: reason,
  });
}

/**
 * Unblock UDC
 *
 * @param udcId - UDC identifier
 * @returns Promise with API response
 *
 * @example
 * ```typescript
 * await UdcService.unblockUdc(123);
 * ```
 */
export async function unblockUdc(udcId: number): Promise<APIResponse<any>> {
  return updateUdc({
    udcId,
    isBlocked: false,
    blockReason: undefined,
  });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get UDC status label in Italian
 *
 * @param status - UDC status enum value
 * @returns Italian label for status
 *
 * @example
 * ```typescript
 * const label = getUdcStatusLabel(UdcStatus.OCCUPIED); // "Occupato"
 * ```
 */
export function getUdcStatusLabel(status: UdcStatus): string {
  const labels: Record<UdcStatus, string> = {
    [UdcStatus.EMPTY]: 'Vuoto',
    [UdcStatus.OCCUPIED]: 'Occupato',
    [UdcStatus.IN_TRANSIT]: 'In Transito',
    [UdcStatus.BLOCKED]: 'Bloccato',
    [UdcStatus.RESERVED]: 'Riservato',
  };
  return labels[status] || status;
}

/**
 * Get UDC type label in Italian
 *
 * @param type - UDC type enum value
 * @returns Italian label for type
 *
 * @example
 * ```typescript
 * const label = getUdcTypeLabel(UdcType.PALLET); // "Pallet"
 * ```
 */
export function getUdcTypeLabel(type: UdcType): string {
  const labels: Record<UdcType, string> = {
    [UdcType.PALLET]: 'Pallet',
    [UdcType.BOX]: 'Scatola',
    [UdcType.CONTAINER]: 'Contenitore',
    [UdcType.CART]: 'Carrello',
    [UdcType.CUSTOM]: 'Personalizzato',
  };
  return labels[type] || type;
}

/**
 * Get movement type label in Italian
 *
 * @param type - Movement type enum value
 * @returns Italian label for movement type
 *
 * @example
 * ```typescript
 * const label = getMovementTypeLabel(MovementType.TRANSFER); // "Trasferimento"
 * ```
 */
export function getMovementTypeLabel(type: MovementType): string {
  const labels: Record<MovementType, string> = {
    [MovementType.CREATION]: 'Creazione',
    [MovementType.STOCKING]: 'Stoccaggio',
    [MovementType.PICKING]: 'Prelievo',
    [MovementType.TRANSFER]: 'Trasferimento',
    [MovementType.REFILLING]: 'Rifornimento',
    [MovementType.ADJUSTMENT]: 'Rettifica',
    [MovementType.DELETION]: 'Eliminazione',
  };
  return labels[type] || type;
}

/**
 * Calculate UDC fill percentage based on weight or volume
 *
 * @param udc - UDC object
 * @returns Fill percentage (0-100)
 *
 * @example
 * ```typescript
 * const fillPct = calculateUdcFillPercentage(udc); // 75.5
 * ```
 */
export function calculateUdcFillPercentage(udc: Udc): number {
  if (udc.fillPercentage !== undefined) {
    return udc.fillPercentage;
  }

  if (udc.weight && udc.maxWeight) {
    return (udc.weight / udc.maxWeight) * 100;
  }

  if (udc.volume && udc.maxVolume) {
    return (udc.volume / udc.maxVolume) * 100;
  }

  // If compartments available, calculate based on compartment fill
  if (udc.compartments && udc.compartments.length > 0) {
    const totalFill = udc.compartments.reduce((sum, comp) => sum + comp.fillPercentage, 0);
    return totalFill / udc.compartments.length;
  }

  return 0;
}

/**
 * Check if UDC is empty
 *
 * @param udc - UDC object
 * @returns True if UDC is empty
 *
 * @example
 * ```typescript
 * if (isUdcEmpty(udc)) {
 *   console.log('UDC can be deleted');
 * }
 * ```
 */
export function isUdcEmpty(udc: Udc): boolean {
  if (udc.status === UdcStatus.EMPTY) return true;
  if (udc.itemsCount !== undefined && udc.itemsCount === 0) return true;
  if (udc.totalQuantity !== undefined && udc.totalQuantity === 0) return true;
  if (udc.contents && udc.contents.length === 0) return true;
  return false;
}

/**
 * Check if UDC can accept more items
 *
 * @param udc - UDC object
 * @returns True if UDC can accept more items
 *
 * @example
 * ```typescript
 * if (canAcceptItems(udc)) {
 *   // Allow adding items
 * }
 * ```
 */
export function canAcceptItems(udc: Udc): boolean {
  if (udc.isBlocked) return false;
  if (udc.status === UdcStatus.BLOCKED) return false;

  const fillPct = calculateUdcFillPercentage(udc);
  if (fillPct >= 100) return false;

  return true;
}

/**
 * Validate UDC creation parameters
 *
 * @param params - Create UDC parameters
 * @returns Object with validation errors (empty if valid)
 *
 * @example
 * ```typescript
 * const errors = validateUdcCreation(params);
 * if (Object.keys(errors).length > 0) {
 *   console.error('Validation failed:', errors);
 * }
 * ```
 */
export function validateUdcCreation(params: CreateUdcParams): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!params.type) {
    errors.type = 'Tipo UDC obbligatorio';
  }

  if (!params.width || params.width <= 0) {
    errors.width = 'Larghezza deve essere maggiore di 0';
  }

  if (!params.depth || params.depth <= 0) {
    errors.depth = 'Profondità deve essere maggiore di 0';
  }

  if (params.compartmentsCount && params.compartmentsCount < 0) {
    errors.compartmentsCount = 'Numero compartimenti non può essere negativo';
  }

  if (params.maxWeight && params.maxWeight <= 0) {
    errors.maxWeight = 'Peso massimo deve essere maggiore di 0';
  }

  if (params.maxVolume && params.maxVolume <= 0) {
    errors.maxVolume = 'Volume massimo deve essere maggiore di 0';
  }

  return errors;
}

/**
 * Validate add item to UDC parameters
 *
 * @param params - Add item parameters
 * @returns Object with validation errors (empty if valid)
 *
 * @example
 * ```typescript
 * const errors = validateAddItem(params);
 * ```
 */
export function validateAddItem(params: AddItemToUdcParams): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!params.udcId || params.udcId <= 0) {
    errors.udcId = 'ID UDC non valido';
  }

  if (!params.itemCode || params.itemCode.trim() === '') {
    errors.itemCode = 'Codice articolo obbligatorio';
  }

  if (!params.quantity || params.quantity <= 0) {
    errors.quantity = 'Quantità deve essere maggiore di 0';
  }

  return errors;
}

/**
 * Filter UDCs by search term (barcode or location)
 *
 * @param udcs - Array of UDCs
 * @param searchTerm - Search string
 * @returns Filtered array of UDCs
 *
 * @example
 * ```typescript
 * const filtered = filterUdcsBySearch(allUdcs, 'A01');
 * ```
 */
export function filterUdcsBySearch(udcs: UdcSummary[], searchTerm: string): UdcSummary[] {
  if (!searchTerm || searchTerm.trim() === '') return udcs;

  const term = searchTerm.toLowerCase().trim();

  return udcs.filter((udc) => {
    return (
      udc.barcode.toLowerCase().includes(term) ||
      (udc.locationCode && udc.locationCode.toLowerCase().includes(term)) ||
      (udc.warehouseZone && udc.warehouseZone.toLowerCase().includes(term))
    );
  });
}

/**
 * Sort UDCs by various criteria
 *
 * @param udcs - Array of UDCs
 * @param sortBy - Sort criterion
 * @param order - Sort order ('asc' or 'desc')
 * @returns Sorted array of UDCs
 *
 * @example
 * ```typescript
 * const sorted = sortUdcs(udcs, 'fillPercentage', 'desc');
 * ```
 */
export function sortUdcs(
  udcs: UdcSummary[],
  sortBy: 'barcode' | 'location' | 'fillPercentage' | 'itemsCount' | 'lastMovement',
  order: 'asc' | 'desc' = 'asc'
): UdcSummary[] {
  const sorted = [...udcs].sort((a, b) => {
    let compareValue = 0;

    switch (sortBy) {
      case 'barcode':
        compareValue = a.barcode.localeCompare(b.barcode);
        break;
      case 'location':
        compareValue = (a.locationCode || '').localeCompare(b.locationCode || '');
        break;
      case 'fillPercentage':
        compareValue = (a.fillPercentage || 0) - (b.fillPercentage || 0);
        break;
      case 'itemsCount':
        compareValue = a.itemsCount - b.itemsCount;
        break;
      case 'lastMovement':
        const dateA = a.lastMovementDate ? new Date(a.lastMovementDate).getTime() : 0;
        const dateB = b.lastMovementDate ? new Date(b.lastMovementDate).getTime() : 0;
        compareValue = dateA - dateB;
        break;
    }

    return order === 'asc' ? compareValue : -compareValue;
  });

  return sorted;
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export default {
  // CRUD
  getUdcs,
  getUdcById,
  getUdcByBarcode,
  createUdc,
  updateUdc,
  deleteUdc,

  // Compartments
  getUdcCompartments,
  getAvailableCompartments,

  // Contents
  getUdcContents,
  addItemToUdc,
  removeItemFromUdc,

  // Movements
  getUdcMovements,
  transferUdc,

  // Blocking
  blockUdc,
  unblockUdc,

  // Utilities
  getUdcStatusLabel,
  getUdcTypeLabel,
  getMovementTypeLabel,
  calculateUdcFillPercentage,
  isUdcEmpty,
  canAcceptItems,
  validateUdcCreation,
  validateAddItem,
  filterUdcsBySearch,
  sortUdcs,
};
