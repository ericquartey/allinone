// ============================================================================
// EJLOG WMS - RF Operations Service
// Service layer for RF terminal operations with backend integration
// ============================================================================

import axios, { AxiosError } from 'axios';

// Use relative URL in development to leverage Vite proxy (CORS bypass)
const BASE_URL = import.meta.env.DEV
  ? '/api'  // Development: use Vite proxy
  : 'http://localhost:8080/api';  // Production: full URL

const API_TIMEOUT = 30000;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Item list type enum - matches backend ItemListType
 */
export interface ItemListType {
  id: number;
  nickname?: string;
  canChangeArea?: boolean;
  canSortByPriority?: boolean;
}

/**
 * Machine info for item lists
 */
export interface MachineInfo {
  id: number;
  nickname?: string;
}

/**
 * Item list from backend API
 */
export interface ItemList {
  id: number;
  code: string;
  description?: string;
  isDispatchable: boolean;
  itemListType: ItemListType;
  machines?: MachineInfo[];
  priority?: number;
  shipmentUnitCode?: string;
  shipmentUnitDescription?: string;
}

/**
 * Item list row from backend API
 */
export interface ItemListRow {
  id: number;
  code: string;
  itemListId: number;
  itemId?: number;
  itemDescription?: string;
  requestedQuantity: number;
  dispatchedQuantity: number;
  isCompleted: boolean;
  machines?: MachineInfo[];
  containsExternalItems?: boolean;
}

/**
 * RF Operation types
 */
export enum RFOperationType {
  PICKING = 'picking',
  REFILLING = 'refilling',
  INVENTORY = 'inventory',
  RECEIVING = 'receiving',
  PUTAWAY = 'putaway',
  TRANSFER = 'transfer'
}

/**
 * RF workflow state
 */
export interface RFWorkflowState {
  operation: RFOperationType;
  step: number;
  listId?: number;
  list?: ItemList;
  itemId?: number;
  item?: ItemListRow;
  location?: string;
  quantity?: number;
}

/**
 * API error response
 */
export interface APIError {
  message: string;
  statusCode?: number;
  details?: string;
}

// ============================================================================
// MOCK DATA (for offline mode / testing)
// ============================================================================

const MOCK_LISTS: Record<string, ItemList> = {
  'LIST001': {
    id: 1,
    code: 'LIST001',
    description: 'Lista Picking Test',
    isDispatchable: true,
    itemListType: { id: 0, nickname: 'PICKING' },
    priority: 1,
    machines: []
  },
  'LIST002': {
    id: 2,
    code: 'LIST002',
    description: 'Lista Refilling Test',
    isDispatchable: true,
    itemListType: { id: 1, nickname: 'REFILLING' },
    priority: 2,
    machines: []
  },
  'LIST003': {
    id: 3,
    code: 'LIST003',
    description: 'Lista Inventario Test',
    isDispatchable: true,
    itemListType: { id: 2, nickname: 'INVENTORY' },
    priority: 1,
    machines: []
  }
};

const MOCK_ITEMS: Record<string, ItemListRow> = {
  'ART001': {
    id: 1,
    code: 'ART001',
    itemListId: 1,
    itemId: 101,
    itemDescription: 'Articolo Test 1',
    requestedQuantity: 10,
    dispatchedQuantity: 0,
    isCompleted: false,
    machines: []
  },
  'ART002': {
    id: 2,
    code: 'ART002',
    itemListId: 1,
    itemId: 102,
    itemDescription: 'Articolo Test 2',
    requestedQuantity: 5,
    dispatchedQuantity: 0,
    isCompleted: false,
    machines: []
  },
  'ART003': {
    id: 3,
    code: 'ART003',
    itemListId: 1,
    itemId: 103,
    itemDescription: 'Articolo Test 3',
    requestedQuantity: 20,
    dispatchedQuantity: 0,
    isCompleted: false,
    machines: []
  }
};

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Enable/disable offline mode with mock data
 */
let USE_MOCK_DATA = import.meta.env.MODE === 'test';

/**
 * Set offline mode (for testing/offline scenarios)
 */
export function setOfflineMode(enabled: boolean): void {
  USE_MOCK_DATA = enabled;
}

/**
 * Check if offline mode is active
 */
export function isOfflineMode(): boolean {
  return USE_MOCK_DATA;
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Format error for consistent error handling
 */
function formatError(error: unknown): APIError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    return {
      message: axiosError.response?.data?.message || axiosError.message || 'Network error',
      statusCode: axiosError.response?.status,
      details: JSON.stringify(axiosError.response?.data)
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      details: error.stack
    };
  }

  return {
    message: 'Unknown error occurred'
  };
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Get item list by barcode/number
 */
export async function getListByCode(code: string): Promise<ItemList> {
  // Offline mode: use mock data
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
    const list = MOCK_LISTS[code];
    if (!list) {
      throw new Error('Lista non trovata');
    }
    return list;
  }

  // Online mode: call backend API
  try {
    const response = await axios.get<ItemList>(
      `${BASE_URL}/item-lists/${code}/num`,
      { timeout: API_TIMEOUT }
    );
    return response.data;
  } catch (error) {
    const apiError = formatError(error);
    throw new Error(apiError.message);
  }
}

/**
 * Get item list by ID
 */
export async function getListById(id: number): Promise<ItemList> {
  // Offline mode: use mock data
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const list = Object.values(MOCK_LISTS).find(l => l.id === id);
    if (!list) {
      throw new Error('Lista non trovata');
    }
    return list;
  }

  // Online mode: call backend API
  try {
    const response = await axios.get<ItemList>(
      `${BASE_URL}/item-lists/${id}`,
      { timeout: API_TIMEOUT }
    );
    return response.data;
  } catch (error) {
    const apiError = formatError(error);
    throw new Error(apiError.message);
  }
}

/**
 * Get list rows (items) for a given list ID
 */
export async function getListRows(listId: number): Promise<ItemListRow[]> {
  // Offline mode: use mock data
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return Object.values(MOCK_ITEMS).filter(item => item.itemListId === listId);
  }

  // Online mode: call backend API
  try {
    const response = await axios.get<ItemListRow[]>(
      `${BASE_URL}/item-lists/${listId}/rows`,
      { timeout: API_TIMEOUT }
    );
    return response.data;
  } catch (error) {
    const apiError = formatError(error);
    throw new Error(apiError.message);
  }
}

/**
 * Get item by barcode from list rows
 */
export async function getItemByCode(listId: number, code: string): Promise<ItemListRow> {
  // Offline mode: use mock data
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const item = MOCK_ITEMS[code];
    if (!item) {
      throw new Error('Articolo non trovato');
    }
    return item;
  }

  // Online mode: fetch rows and find by code
  try {
    const rows = await getListRows(listId);
    const item = rows.find(row => row.code === code);
    if (!item) {
      throw new Error('Articolo non trovato');
    }
    return item;
  } catch (error) {
    const apiError = formatError(error);
    throw new Error(apiError.message);
  }
}

/**
 * Start executing a list (mark as IN_PROGRESS)
 */
export async function executeList(
  listId: number,
  options?: {
    areaId?: number;
    destinationGroupId?: number;
    userName?: string;
    itemListEvadabilityType?: number;
  }
): Promise<void> {
  // Offline mode: simulate success
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return;
  }

  // Online mode: call backend API
  try {
    await axios.post(
      `${BASE_URL}/item-lists/${listId}/execute`,
      null,
      {
        params: options,
        timeout: API_TIMEOUT
      }
    );
  } catch (error) {
    const apiError = formatError(error);
    throw new Error(apiError.message);
  }
}

/**
 * Execute list by number/barcode (instead of ID)
 */
export async function executeListByNum(
  numList: string,
  options?: {
    areaId?: number;
    destinationGroupId?: number;
    userName?: string;
    itemListEvadabilityType?: number;
  }
): Promise<void> {
  // Offline mode: simulate success
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return;
  }

  // Online mode: call backend API
  try {
    await axios.post(
      `${BASE_URL}/item-lists/execute-num`,
      null,
      {
        params: { numList, ...options },
        timeout: API_TIMEOUT
      }
    );
  } catch (error) {
    const apiError = formatError(error);
    throw new Error(apiError.message);
  }
}

/**
 * Suspend list execution
 */
export async function suspendList(listId: number, userName?: string): Promise<void> {
  // Offline mode: simulate success
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return;
  }

  // Online mode: call backend API
  try {
    await axios.post(
      `${BASE_URL}/item-lists/${listId}/suspend`,
      null,
      {
        params: { userName },
        timeout: API_TIMEOUT
      }
    );
  } catch (error) {
    const apiError = formatError(error);
    throw new Error(apiError.message);
  }
}

/**
 * Terminate list (mark as completed)
 */
export async function terminateList(listId: number): Promise<void> {
  // Offline mode: simulate success
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return;
  }

  // Online mode: call backend API
  try {
    await axios.post(
      `${BASE_URL}/item-lists/${listId}/terminate`,
      null,
      { timeout: API_TIMEOUT }
    );
  } catch (error) {
    const apiError = formatError(error);
    throw new Error(apiError.message);
  }
}

/**
 * Confirm quantity for an item (this would typically call a movement/picking API)
 * For now, this is a placeholder that would integrate with the specific operation API
 */
export async function confirmQuantity(
  listId: number,
  rowId: number,
  quantity: number,
  operation: RFOperationType
): Promise<void> {
  // Offline mode: simulate success
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return;
  }

  // Online mode: would need specific endpoint for quantity confirmation
  // This depends on the operation type (picking, refilling, etc.)
  // For now, throw error to indicate not implemented
  throw new Error('Quantity confirmation API not yet implemented for operation: ' + operation);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Configuration
  setOfflineMode,
  isOfflineMode,

  // List operations
  getListByCode,
  getListById,
  getListRows,
  getItemByCode,

  // Execution operations
  executeList,
  executeListByNum,
  suspendList,
  terminateList,
  confirmQuantity
};
