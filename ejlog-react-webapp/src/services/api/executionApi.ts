// ============================================================================
// EJLOG WMS - Execution API Service
// Endpoint per l'esecuzione di liste (Picking, Refilling, Inventario)
// ============================================================================

import { apiClient } from './client';

// ============================================================================
// Types
// ============================================================================

export interface ExecutionList {
  id: number;
  numero: string;
  tipoLista: {
    id: number;
    descrizione: string;
  };
  statoLista: {
    id: number;
    descrizione: string;
  };
  dataCreazione: string;
  dataEsecuzione?: string;
  utente?: string;
  totaleRighe: number;
  righeCompletate: number;
}

export interface ExecutionListRow {
  id: number;
  itemId: number;
  itemCode: string;
  itemDescription: string;
  quantityRequired: number;
  quantityPicked?: number;
  quantityDeposited?: number;
  sourceLocationCode: string;
  sourceLocationId: number;
  destinationLocationCode?: string;
  destinationLocationId?: number;
  udcCode?: string;
  lotManaged: boolean;
  serialManaged: boolean;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface ExecutionListFilters {
  zoneIds?: string; // comma-separated
  listTypes?: string; // comma-separated: PICKING,REFILLING,INVENTARIO
  listStatuses?: string; // comma-separated, default: IN_ESECUZIONE
  skip?: number;
  take?: number;
}

export interface PickItemRequest {
  itemId: number;
  quantity: number;
  lot?: string;
  serialNumber?: string;
  sourceLocationId: number;
  userName: string;
}

export interface RefillItemRequest {
  itemId: number;
  udcCode: string;
  destinationLocationId: number;
  quantity: number;
  userName: string;
}

export interface InventoryItemRequest {
  itemId: number;
  quantity: number;
  locationId: number;
  userName: string;
}

export interface VisionConfirmRequest {
  itemId: number;
  locationId: number;
  userName: string;
}

export interface PauseListsRequest {
  listIds: number[];
  userName?: string;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * GET /api/item-lists/execution
 * Recupera liste IN_ESECUZIONE con filtri
 */
export async function getExecutionLists(
  filters?: ExecutionListFilters
): Promise<ExecutionList[]> {
  const response = await apiClient.get<ExecutionList[]>('/api/item-lists/execution', {
    params: filters,
  });
  return response.data;
}

/**
 * GET /api/item-lists/{id}/rows
 * Recupera righe di una lista specifica
 */
export async function getListRows(listId: number): Promise<ExecutionListRow[]> {
  const response = await apiClient.get<ExecutionListRow[]>(
    `/api/item-lists/${listId}/rows`
  );
  return response.data;
}

/**
 * POST /api/items/{id}/pick
 * Conferma picking di un articolo
 */
export async function pickItem(request: PickItemRequest): Promise<void> {
  await apiClient.post(`/api/items/${request.itemId}/pick`, {
    quantity: request.quantity,
    lot: request.lot,
    serialNumber: request.serialNumber,
    sourceLocationId: request.sourceLocationId,
    userName: request.userName,
  });
}

/**
 * POST /api/items/{id}/refill
 * Conferma refilling/deposito di un articolo
 */
export async function refillItem(request: RefillItemRequest): Promise<void> {
  await apiClient.post(`/api/items/${request.itemId}/refill`, {
    udcCode: request.udcCode,
    destinationLocationId: request.destinationLocationId,
    quantity: request.quantity,
    userName: request.userName,
  });
}

/**
 * POST /api/items/{id}/inventory
 * Conferma conteggio inventario di un articolo
 */
export async function inventoryItem(request: InventoryItemRequest): Promise<void> {
  await apiClient.post(`/api/items/${request.itemId}/inventory`, {
    quantity: request.quantity,
    locationId: request.locationId,
    userName: request.userName,
  });
}

/**
 * POST /api/items/{id}/vision-confirm
 * Conferma operazione di visione UDC (solo conferma, no quantità)
 */
export async function visionConfirm(request: VisionConfirmRequest): Promise<void> {
  await apiClient.post(`/api/items/${request.itemId}/vision-confirm`, {
    locationId: request.locationId,
    userName: request.userName,
  });
}

/**
 * PUT /api/item-lists/pause
 * Mette una o più liste in attesa/pausa
 */
export async function pauseLists(request: PauseListsRequest): Promise<void> {
  await apiClient.put('/api/item-lists/pause', {
    listIds: request.listIds,
    userName: request.userName,
  });
}

/**
 * GET /api/item-lists/{id}/status
 * Recupera lo stato aggiornato di una lista
 */
export async function getListStatus(listId: number): Promise<{
  totaleRighe: number;
  righeCompletate: number;
  statoLista: { id: number; descrizione: string };
}> {
  const response = await apiClient.get(`/api/item-lists/${listId}/status`);
  return response.data;
}

// ============================================================================
// React Query Hooks (optional - per uso futuro)
// ============================================================================

/**
 * Query key factory per React Query
 */
export const executionKeys = {
  all: ['execution'] as const,
  lists: (filters?: ExecutionListFilters) => [...executionKeys.all, 'lists', filters] as const,
  list: (id: number) => [...executionKeys.all, 'list', id] as const,
  rows: (id: number) => [...executionKeys.all, 'rows', id] as const,
  status: (id: number) => [...executionKeys.all, 'status', id] as const,
};

export default {
  getExecutionLists,
  getListRows,
  pickItem,
  refillItem,
  inventoryItem,
  visionConfirm,
  pauseLists,
  getListStatus,
  executionKeys,
};
