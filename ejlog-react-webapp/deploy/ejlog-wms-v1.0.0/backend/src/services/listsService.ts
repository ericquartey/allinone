// ============================================================================
// EJLOG WMS - Lists Service
// Centralized API service for list management operations
// ============================================================================

import axios, { AxiosError } from 'axios';

// Use relative URL for API calls - routes to Node.js api-server on port 7078
const BASE_URL = '/api';

const API_TIMEOUT = 30000;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * List types enum
 */
export enum ListType {
  PICKING = 0,
  REFILLING = 1,
  INVENTORY = 2
}

/**
 * List status enum
 */
export enum ListStatus {
  WAITING = 1,
  IN_PROGRESS = 2,
  COMPLETED = 3
}

/**
 * List command types
 */
export enum ListCommandType {
  CREATE = 1,
  DELETE = 2,
  UPDATE_HEADER = 3,
  UPDATE_ROWS = 4
}

/**
 * List header interface
 */
export interface ListHeader {
  listNumber: string;
  listDescription?: string;
  listType: ListType;
  listStatus: ListStatus;
  cause?: string;
  orderNumber?: string;
  priority?: number;
  sequenzaLancio?: number;  // NUOVO - Sequenza lancio da ListeAreaDetails
  exitPoint?: string;
  selectedWarehouses?: number[];
  auxHostText01?: string;
  auxHostInt01?: number | null;
  nomeArea?: string | null; // Real area name from Aree table
  locazionePTL?: string | null; // Real PTL location from LocazioniPTL table (e.g., "PTL G1N1")
}

/**
 * List row interface
 */
export interface ListRow {
  listNumber?: string;
  rowNumber: string;
  item: string;
  lineDescription?: string;
  requestedQty: number;
  processedQty?: number;
  lot?: string;
  serialNumber?: string;
  expiryDate?: string | null;
  barcodePtl?: string;
  rowSequence?: number;
}

/**
 * Complete list structure (header + rows)
 */
export interface List {
  listHeader: ListHeader;
  listRows: ListRow[];
}

/**
 * List command for create/update/delete operations
 */
export interface ListCommand {
  listHeader: ListHeader & { command: ListCommandType };
  listRows?: ListRow[];
}

/**
 * API response wrapper
 */
export interface APIResponse<T> {
  result: string;
  recordNumber?: number;
  message?: string;
  exported?: T[];  // Backend usa 'exported', non 'exportedItems'
  exportedItems?: T[];  // Manteniamo anche questo per retro-compatibilità
  errors?: APIError[];
}

export interface APIError {
  errorCode: number;
  errorMessage: string;
  description?: string;
  stackTrace?: string;
}

/**
 * Parameters for fetching lists
 */
export interface GetListsParams {
  limit: number;
  offset?: number;
  listNumber?: string;
  listType?: ListType;
  listStatus?: ListStatus;
  orderNumber?: string;
}

/**
 * Parameters for creating a new list
 */
export interface CreateListParams {
  listNumber?: string;
  listDescription?: string;
  listType: ListType;
  listStatus?: ListStatus;
  cause?: string;
  orderNumber?: string;
  priority?: number;
  exitPoint?: string;
  selectedWarehouses?: number[];
  rows: ListRow[];
}

/**
 * Parameters for updating a list
 */
export interface UpdateListParams {
  listNumber: string;
  listDescription?: string;
  listType?: ListType;
  listStatus?: ListStatus;
  cause?: string;
  orderNumber?: string;
  priority?: number;
  exitPoint?: string;
  selectedWarehouses?: number[];
  rows?: ListRow[];
}

// ============================================================================
// SERVICE FUNCTIONS
// ============================================================================

/**
 * Configure axios instance with base URL and timeout
 */
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Helper per estrarre i dati dalla risposta (compatibile con exported e exportedItems)
 */
function getExportedData<T>(response: APIResponse<T>): T[] {
  return response.exported || response.exportedItems || [];
}

/**
 * Error handler for API calls
 */
function handleAPIError(error: unknown): never {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<APIResponse<any>>;
    if (axiosError.response) {
      const apiResponse = axiosError.response.data;
      if (apiResponse && apiResponse.message) {
        throw new Error(apiResponse.message);
      }
      throw new Error(`HTTP ${axiosError.response.status}: ${axiosError.response.statusText}`);
    } else if (axiosError.request) {
      throw new Error('Errore di connessione al server. Verificare che il backend sia avviato.');
    }
  }
  throw new Error(error instanceof Error ? error.message : 'Errore sconosciuto');
}

/**
 * Get lists with pagination and filters
 *
 * @param params - Query parameters for filtering and pagination
 * @returns Promise<APIResponse<List>>
 *
 * @example
 * const response = await getLists({
 *   limit: 25,
 *   offset: 0,
 *   listType: ListType.PICKING,
 *   listStatus: ListStatus.WAITING
 * });
 */
export async function getLists(params: GetListsParams): Promise<APIResponse<List>> {
  try {
    const queryParams = new URLSearchParams({
      limit: params.limit.toString(),
      ...(params.offset !== undefined && { offset: params.offset.toString() }),
      ...(params.listNumber && { listNumber: params.listNumber }),
      ...(params.listType !== undefined && { listType: params.listType.toString() }),
      ...(params.listStatus !== undefined && { listStatus: params.listStatus.toString() }),
      ...(params.orderNumber && { orderNumber: params.orderNumber }),
    });

    const response = await apiClient.get<APIResponse<List>>(`/lists?${queryParams}`);
    return response.data;
  } catch (error) {
    return handleAPIError(error);
  }
}

/**
 * Get a single list by list number
 *
 * @param listNumber - The list number to fetch
 * @returns Promise<List | null>
 *
 * @example
 * const list = await getListByNumber('L123456789');
 */
export async function getListByNumber(listNumber: string): Promise<List | null> {
  try {
    const response = await getLists({ limit: 1, listNumber });
    const data = getExportedData(response);
    if (response.result === 'OK' && data.length > 0) {
      return data[0];
    }
    return null;
  } catch (error) {
    return handleAPIError(error);
  }
}

/**
 * Create a new list
 *
 * @param params - Parameters for creating the list
 * @returns Promise<APIResponse<any>>
 *
 * @example
 * const response = await createList({
 *   listType: ListType.PICKING,
 *   listDescription: 'New picking list',
 *   orderNumber: 'ORD-001',
 *   rows: [
 *     {
 *       rowNumber: '1',
 *       item: 'ITEM-001',
 *       requestedQty: 10
 *     }
 *   ]
 * });
 */
export async function createList(params: CreateListParams): Promise<APIResponse<any>> {
  try {
    const listNumber = params.listNumber || `L${Date.now()}`;

    const command: ListCommand = {
      listHeader: {
        listNumber,
        command: ListCommandType.CREATE,
        listDescription: params.listDescription,
        listType: params.listType,
        listStatus: params.listStatus || ListStatus.WAITING,
        cause: params.cause,
        orderNumber: params.orderNumber,
        priority: params.priority ?? 50,
        exitPoint: params.exitPoint,
        selectedWarehouses: params.selectedWarehouses || [1],
      },
      listRows: params.rows,
    };

    const response = await apiClient.post<APIResponse<any>>('/Lists', [command]);
    return response.data;
  } catch (error) {
    return handleAPIError(error);
  }
}

/**
 * Update an existing list
 *
 * @param params - Parameters for updating the list
 * @returns Promise<APIResponse<any>>
 *
 * @example
 * const response = await updateList({
 *   listNumber: 'L123456789',
 *   listDescription: 'Updated description',
 *   listStatus: ListStatus.IN_PROGRESS
 * });
 */
export async function updateList(params: UpdateListParams): Promise<APIResponse<any>> {
  try {
    const command: ListCommand = {
      listHeader: {
        listNumber: params.listNumber,
        command: ListCommandType.UPDATE_HEADER,
        listDescription: params.listDescription,
        listType: params.listType || ListType.PICKING,
        listStatus: params.listStatus || ListStatus.WAITING,
        cause: params.cause,
        orderNumber: params.orderNumber,
        priority: params.priority,
        exitPoint: params.exitPoint,
        selectedWarehouses: params.selectedWarehouses,
      },
      listRows: params.rows,
    };

    const response = await apiClient.post<APIResponse<any>>('/Lists', [command]);
    return response.data;
  } catch (error) {
    return handleAPIError(error);
  }
}

/**
 * Delete a list by list number
 *
 * @param listNumber - The list number to delete
 * @returns Promise<APIResponse<any>>
 *
 * @example
 * const response = await deleteList('L123456789');
 */
export async function deleteList(listNumber: string): Promise<APIResponse<any>> {
  try {
    const command: ListCommand = {
      listHeader: {
        listNumber,
        command: ListCommandType.DELETE,
        listType: ListType.PICKING, // Required but not used for delete
        listStatus: ListStatus.WAITING, // Required but not used for delete
      },
    };

    const response = await apiClient.post<APIResponse<any>>('/Lists', [command]);
    return response.data;
  } catch (error) {
    return handleAPIError(error);
  }
}

/**
 * Calculate progress percentage for a list
 *
 * @param listRows - Array of list rows
 * @returns Progress percentage (0-100)
 *
 * @example
 * const progress = calculateListProgress(list.listRows);
 * // Returns: 75.5
 */
export function calculateListProgress(listRows: ListRow[]): number {
  if (!listRows || listRows.length === 0) return 0;

  const totalProcessed = listRows.reduce((sum, row) => sum + (row.processedQty || 0), 0);
  const totalRequested = listRows.reduce((sum, row) => sum + row.requestedQty, 0);

  return totalRequested > 0 ? (totalProcessed / totalRequested) * 100 : 0;
}

/**
 * Get human-readable label for list type
 *
 * @param type - List type enum value
 * @returns String label
 *
 * @example
 * getListTypeLabel(ListType.PICKING) // Returns: "Picking"
 */
export function getListTypeLabel(type: ListType): string {
  const labels: { [key in ListType]: string } = {
    [ListType.PICKING]: 'Picking',
    [ListType.REFILLING]: 'Refilling',
    [ListType.INVENTORY]: 'Inventario',
  };
  return labels[type] || 'Sconosciuto';
}

/**
 * Get human-readable label for list status
 *
 * @param status - List status enum value
 * @returns String label
 *
 * @example
 * getListStatusLabel(ListStatus.IN_PROGRESS) // Returns: "In Corso"
 */
export function getListStatusLabel(status: ListStatus): string {
  const labels: { [key in ListStatus]: string } = {
    [ListStatus.WAITING]: 'Aperta',
    [ListStatus.IN_PROGRESS]: 'In Corso',
    [ListStatus.COMPLETED]: 'Completata',
  };
  return labels[status] || 'Sconosciuto';
}

/**
 * Validate list creation parameters
 *
 * @param params - Create list parameters
 * @returns Object with validation errors (empty if valid)
 *
 * @example
 * const errors = validateListCreation(params);
 * if (Object.keys(errors).length > 0) {
 *   // Handle validation errors
 * }
 */
export function validateListCreation(params: CreateListParams): { [key: string]: string } {
  const errors: { [key: string]: string } = {};

  if (params.listNumber && !params.listNumber.trim()) {
    errors.listNumber = 'Numero lista obbligatorio';
  }

  if (!params.rows || params.rows.length === 0) {
    errors.rows = 'Inserire almeno una riga';
  }

  params.rows?.forEach((row, idx) => {
    if (!row.item || !row.item.trim()) {
      errors[`row_${idx}_item`] = 'Articolo obbligatorio';
    }
    if (!row.requestedQty || row.requestedQty <= 0) {
      errors[`row_${idx}_qty`] = 'Quantità deve essere maggiore di 0';
    }
  });

  return errors;
}

/**
 * Validate list update parameters
 *
 * @param params - Update list parameters
 * @returns Object with validation errors (empty if valid)
 */
export function validateListUpdate(params: UpdateListParams): { [key: string]: string } {
  const errors: { [key: string]: string } = {};

  if (!params.listNumber || !params.listNumber.trim()) {
    errors.listNumber = 'Numero lista obbligatorio';
  }

  if (params.rows) {
    if (params.rows.length === 0) {
      errors.rows = 'Inserire almeno una riga';
    }

    params.rows.forEach((row, idx) => {
      if (!row.item || !row.item.trim()) {
        errors[`row_${idx}_item`] = 'Articolo obbligatorio';
      }
      if (!row.requestedQty || row.requestedQty <= 0) {
        errors[`row_${idx}_qty`] = 'Quantità deve essere maggiore di 0';
      }
    });
  }

  return errors;
}

/**
 * Generate a unique list number
 *
 * @param prefix - Optional prefix (default: 'L')
 * @returns Generated list number
 *
 * @example
 * const listNumber = generateListNumber('PICK');
 * // Returns: "PICK1638360000000"
 */
export function generateListNumber(prefix: string = 'L'): string {
  return `${prefix}${Date.now()}`;
}

/**
 * Check if a list is completed
 *
 * @param list - The list to check
 * @returns True if all rows are fully processed
 */
export function isListCompleted(list: List): boolean {
  if (!list.listRows || list.listRows.length === 0) return false;

  return list.listRows.every(row =>
    row.processedQty !== undefined && row.processedQty >= row.requestedQty
  );
}

/**
 * Get remaining quantity for a list row
 *
 * @param row - The list row
 * @returns Remaining quantity to process
 */
export function getRemainingQuantity(row: ListRow): number {
  return row.requestedQty - (row.processedQty || 0);
}

/**
 * Sort lists by priority (descending) and creation date
 *
 * @param lists - Array of lists to sort
 * @returns Sorted array
 */
export function sortListsByPriority(lists: List[]): List[] {
  return [...lists].sort((a, b) => {
    // First by priority (higher first)
    const priorityDiff = (b.listHeader.priority || 0) - (a.listHeader.priority || 0);
    if (priorityDiff !== 0) return priorityDiff;

    // Then by list number (newer first, assuming timestamp-based)
    return b.listHeader.listNumber.localeCompare(a.listHeader.listNumber);
  });
}

/**
 * Filter lists by type
 *
 * @param lists - Array of lists
 * @param type - List type to filter
 * @returns Filtered array
 */
export function filterListsByType(lists: List[], type: ListType): List[] {
  return lists.filter(list => list.listHeader.listType === type);
}

/**
 * Filter lists by status
 *
 * @param lists - Array of lists
 * @param status - List status to filter
 * @returns Filtered array
 */
export function filterListsByStatus(lists: List[], status: ListStatus): List[] {
  return lists.filter(list => list.listHeader.listStatus === status);
}

// ============================================================================
// ASSIGNMENT WORKFLOW FUNCTIONS
// ============================================================================

/**
 * User/Operator interface for list assignment
 */
export interface User {
  userId: string;
  username: string;
  firstName?: string;
  lastName?: string;
  badge?: string;
  role?: string;
  isActive?: boolean;
}

/**
 * Warehouse interface
 */
export interface Warehouse {
  warehouseId: number;
  warehouseName: string;
  warehouseCode?: string;
  isActive?: boolean;
}

/**
 * Area interface
 */
export interface Area {
  areaId: number;
  areaName: string;
  areaCode?: string;
  warehouseId?: number;
  isActive?: boolean;
}

/**
 * List assignment interface
 */
export interface ListAssignment {
  listNumber: string;
  assignedUserId?: string;
  assignedUsername?: string;
  assignedAt?: string;
  assignedBy?: string;
  warehouseId?: number;
  areaId?: number;
}

/**
 * Parameters for assigning a list to a user
 */
export interface AssignListParams {
  listNumber: string;
  userId: string;
  warehouseId?: number;
  areaId?: number;
}

/**
 * Get available users for list assignment
 *
 * @param role - Optional role filter (e.g., 'operator', 'picker')
 * @returns Promise<User[]>
 *
 * @example
 * const users = await getAvailableUsers('operator');
 */
export async function getAvailableUsers(role?: string): Promise<User[]> {
  try {
    const queryParams = new URLSearchParams({
      ...(role && { role }),
    });

    const response = await apiClient.get<APIResponse<User>>(`/Users?${queryParams}`);

    if (response.data.result === 'OK' && response.data.exportedItems) {
      return response.data.exportedItems;
    }

    return [];
  } catch (error) {
    console.error('Error fetching users:', error);
    // Return empty array on error instead of throwing
    return [];
  }
}

/**
 * Get available warehouses
 *
 * @returns Promise<Warehouse[]>
 *
 * @example
 * const warehouses = await getWarehouses();
 */
export async function getWarehouses(): Promise<Warehouse[]> {
  try {
    const response = await apiClient.get<APIResponse<Warehouse>>('/Warehouses');

    if (response.data.result === 'OK' && response.data.exportedItems) {
      return response.data.exportedItems.filter(w => w.isActive !== false);
    }

    return [];
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    return [];
  }
}

/**
 * Get areas for a specific warehouse
 *
 * @param warehouseId - Optional warehouse ID filter
 * @returns Promise<Area[]>
 *
 * @example
 * const areas = await getAreas(1);
 */
export async function getAreas(warehouseId?: number): Promise<Area[]> {
  try {
    const queryParams = new URLSearchParams({
      ...(warehouseId && { warehouseId: warehouseId.toString() }),
    });

    const response = await apiClient.get<APIResponse<Area>>(`/Areas?${queryParams}`);

    if (response.data.result === 'OK' && response.data.exportedItems) {
      return response.data.exportedItems.filter(a => a.isActive !== false);
    }

    return [];
  } catch (error) {
    console.error('Error fetching areas:', error);
    return [];
  }
}

/**
 * Assign a list to a user/operator
 *
 * @param params - Assignment parameters
 * @returns Promise<APIResponse<any>>
 *
 * @example
 * const response = await assignListToUser({
 *   listNumber: 'L123456789',
 *   userId: 'user001',
 *   warehouseId: 1,
 *   areaId: 5
 * });
 */
export async function assignListToUser(params: AssignListParams): Promise<APIResponse<any>> {
  try {
    // First get the current list
    const list = await getListByNumber(params.listNumber);
    if (!list) {
      throw new Error(`Lista ${params.listNumber} non trovata`);
    }

    // Update the list with assignment info using auxHostText01 for userId
    const updateParams: UpdateListParams = {
      listNumber: params.listNumber,
      listType: list.listHeader.listType,
      listStatus: ListStatus.IN_PROGRESS, // Set to in progress when assigned
      auxHostText01: params.userId, // Store assigned user ID in aux field
      selectedWarehouses: params.warehouseId ? [params.warehouseId] : list.listHeader.selectedWarehouses,
    };

    const response = await updateList(updateParams);
    return response;
  } catch (error) {
    return handleAPIError(error);
  }
}

/**
 * Unassign a list from a user
 *
 * @param listNumber - The list number to unassign
 * @returns Promise<APIResponse<any>>
 *
 * @example
 * const response = await unassignList('L123456789');
 */
export async function unassignList(listNumber: string): Promise<APIResponse<any>> {
  try {
    const list = await getListByNumber(listNumber);
    if (!list) {
      throw new Error(`Lista ${listNumber} non trovata`);
    }

    const updateParams: UpdateListParams = {
      listNumber,
      listType: list.listHeader.listType,
      listStatus: ListStatus.WAITING, // Set back to waiting when unassigned
      auxHostText01: undefined, // Clear assignment
    };

    const response = await updateList(updateParams);
    return response;
  } catch (error) {
    return handleAPIError(error);
  }
}

/**
 * Get lists assigned to a specific user
 *
 * @param userId - User ID to filter by
 * @param listStatus - Optional status filter
 * @returns Promise<List[]>
 *
 * @example
 * const userLists = await getListsAssignedToUser('user001', ListStatus.IN_PROGRESS);
 */
export async function getListsAssignedToUser(
  userId: string,
  listStatus?: ListStatus
): Promise<List[]> {
  try {
    // Get all lists and filter by auxHostText01 field
    const response = await getLists({
      limit: 1000, // Get all lists
      listStatus,
    });

    if (response.result === 'OK' && response.exportedItems) {
      return response.exportedItems.filter(
        list => list.listHeader.auxHostText01 === userId
      );
    }

    return [];
  } catch (error) {
    console.error('Error fetching user lists:', error);
    return [];
  }
}

/**
 * Check if a list is assigned to a user
 *
 * @param list - The list to check
 * @returns True if list is assigned
 */
export function isListAssigned(list: List): boolean {
  return !!(list.listHeader.auxHostText01 && list.listHeader.auxHostText01.trim());
}

/**
 * Get assigned user ID from a list
 *
 * @param list - The list to check
 * @returns User ID or null
 */
export function getAssignedUserId(list: List): string | null {
  return list.listHeader.auxHostText01 || null;
}

/**
 * Validate list assignment
 *
 * @param params - Assignment parameters
 * @returns Object with validation errors (empty if valid)
 */
export function validateListAssignment(params: AssignListParams): { [key: string]: string } {
  const errors: { [key: string]: string } = {};

  if (!params.listNumber || !params.listNumber.trim()) {
    errors.listNumber = 'Numero lista obbligatorio';
  }

  if (!params.userId || !params.userId.trim()) {
    errors.userId = 'Utente obbligatorio';
  }

  return errors;
}

/**
 * Get unassigned lists
 *
 * @param listType - Optional list type filter
 * @returns Promise<List[]>
 *
 * @example
 * const unassignedLists = await getUnassignedLists(ListType.PICKING);
 */
export async function getUnassignedLists(listType?: ListType): Promise<List[]> {
  try {
    const response = await getLists({
      limit: 1000,
      listType,
      listStatus: ListStatus.WAITING, // Only waiting lists can be unassigned
    });

    if (response.result === 'OK' && response.exportedItems) {
      return response.exportedItems.filter(list => !isListAssigned(list));
    }

    return [];
  } catch (error) {
    console.error('Error fetching unassigned lists:', error);
    return [];
  }
}
