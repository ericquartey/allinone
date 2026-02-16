// src/services/listsApi.ts

import { apiClient } from './api/client';
import type {
  List,
  ListRow,
  ListExport,
  ListFilters,
  ListsResponse,
  StandardResponse,
  CreateListRequest,
  UpdateListRequest,
  DeleteListRequest,
  UpdateListRowsRequest,
  HostCommandList
} from '../types/lists';

const API_BASE_PATH = '/api/lists';

/**
 * API Client for Lists Management
 * Based on backend proxy-api.js routes (item-lists-enhanced.js)
 * Backend runs on port 3077
 *
 * NOTE: Uses '/api/lists' path (lowercase) - Vite proxy forwards to http://localhost:3077/api/lists
 * Backend endpoint registered at: /api/lists (see server/routes/item-lists-enhanced.js)
 */
export const listsApi = {
  // ================== GET Operations ==================

  /**
   * GET /EjLogHostVertimag/Lists
   * Fetch all lists with optional filters
   * @param filters - Filter criteria for lists
   * @returns ListsResponse with exported lists
   */
  getAllLists: async (filters?: ListFilters): Promise<ListsResponse> => {
    const params = new URLSearchParams();

    // Limit is required by backend
    params.append('limit', (filters?.limit || 100).toString());

    if (filters?.offset !== undefined) {
      params.append('offset', filters.offset.toString());
    }

    if (filters?.listNumber) {
      params.append('listNumber', filters.listNumber);
    }

    if (filters?.listType !== undefined) {
      params.append('listType', filters.listType.toString());
    }

    if (filters?.listStatus !== undefined) {
      params.append('listStatus', filters.listStatus.toString());
    }

    const response = await apiClient.get<ListsResponse>(`${API_BASE_PATH}`, {
      params,
      headers: { 'Accept': 'application/json' }
    });

    return response.data;
  },

  /**
   * Get lists as array (convenience method)
   * Extracts the list exports from the response
   */
  getListsArray: async (filters?: ListFilters): Promise<ListExport[]> => {
    const response = await listsApi.getAllLists(filters);
    return response.exported || [];
  },

  /**
   * Get a single list by list number
   */
  getListByNumber: async (listNumber: string): Promise<ListExport | null> => {
    const response = await listsApi.getAllLists({ listNumber, limit: 1 });

    if (response.exported && response.exported.length > 0) {
      return response.exported[0];
    }

    return null;
  },

  // ================== POST Operations ==================

  /**
   * POST /api/Lists
   * Generic method for all list operations
   * @param requests - Array of list operation requests
   * @returns StandardResponse with operation results
   */
  executeListOperations: async (
    requests: Array<CreateListRequest | UpdateListRequest | DeleteListRequest | UpdateListRowsRequest>
  ): Promise<StandardResponse> => {
    const response = await apiClient.post<StandardResponse>(`${API_BASE_PATH}`, requests, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    return response.data;
  },

  /**
   * Create a new list
   * Command: NUOVA_LISTA
   */
  createList: async (data: {
    listNumber: string;
    listDescription?: string;
    listType: number;
    listStatus?: number;
    cause?: string;
    orderNumber?: string;
    priority?: number;
    exitPoint?: number;
    selectedWarehouses?: number[];
    rows: Array<{
      rowNumber: string;
      item: string;
      lineDescription?: string;
      requestedQty: number;
      lot?: string;
      serialNumber?: string;
      expiryDate?: string;
      rowSequence?: number;
      operatorInfo?: string;
      labelInfo?: string;
      auxHostText01?: string;
      auxHostText02?: string;
      auxHostText03?: string;
      auxHostText04?: string;
      auxHostText05?: string;
      auxHostInt01?: number;
      auxHostInt02?: number;
      auxHostInt03?: number;
      auxHostBit01?: boolean;
      auxHostBit02?: boolean;
      auxHostBit03?: boolean;
      auxHostDate01?: string;
      auxHostDate02?: string;
      auxHostDate03?: string;
      auxHostNum01?: number;
      auxHostNum02?: number;
      auxHostNum03?: number;
    }>;
    auxHostText01?: string;
    auxHostText02?: string;
    auxHostText03?: string;
    auxHostText04?: string;
    auxHostText05?: string;
    auxHostInt01?: number;
    auxHostInt02?: number;
    auxHostInt03?: number;
    auxHostBit01?: boolean;
    auxHostBit02?: boolean;
    auxHostBit03?: boolean;
    auxHostDate01?: string;
    auxHostDate02?: string;
    auxHostDate03?: string;
    auxHostNum01?: number;
    auxHostNum02?: number;
    auxHostNum03?: number;
  }): Promise<StandardResponse> => {
    const request: CreateListRequest = {
      command: HostCommandList.NUOVA_LISTA,
      listHeader: {
        listNumber: data.listNumber,
        listDescription: data.listDescription,
        listType: data.listType,
        listStatus: data.listStatus,
        cause: data.cause,
        orderNumber: data.orderNumber,
        priority: data.priority,
        exitPoint: data.exitPoint,
        selectedWarehouses: data.selectedWarehouses,
        auxHostText01: data.auxHostText01,
        auxHostText02: data.auxHostText02,
        auxHostText03: data.auxHostText03,
        auxHostText04: data.auxHostText04,
        auxHostText05: data.auxHostText05,
        auxHostInt01: data.auxHostInt01,
        auxHostInt02: data.auxHostInt02,
        auxHostInt03: data.auxHostInt03,
        auxHostBit01: data.auxHostBit01,
        auxHostBit02: data.auxHostBit02,
        auxHostBit03: data.auxHostBit03,
        auxHostDate01: data.auxHostDate01,
        auxHostDate02: data.auxHostDate02,
        auxHostDate03: data.auxHostDate03,
        auxHostNum01: data.auxHostNum01,
        auxHostNum02: data.auxHostNum02,
        auxHostNum03: data.auxHostNum03,
      },
      listRows: data.rows
    };

    return await listsApi.executeListOperations([request]);
  },

  /**
   * Update list header
   * Command: AGGIORNA_LISTA
   */
  updateList: async (
    listNumber: string,
    data: {
      listDescription?: string;
      priority?: number;
      auxHostText01?: string;
      auxHostText02?: string;
      auxHostText03?: string;
      auxHostText04?: string;
      auxHostText05?: string;
      auxHostInt01?: number;
      auxHostInt02?: number;
      auxHostInt03?: number;
      auxHostBit01?: boolean;
      auxHostBit02?: boolean;
      auxHostBit03?: boolean;
      auxHostDate01?: string;
      auxHostDate02?: string;
      auxHostDate03?: string;
      auxHostNum01?: number;
      auxHostNum02?: number;
      auxHostNum03?: number;
    }
  ): Promise<StandardResponse> => {
    const request: UpdateListRequest = {
      command: HostCommandList.AGGIORNA_LISTA,
      listHeader: {
        listNumber,
        listDescription: data.listDescription,
        priority: data.priority,
        auxHostText01: data.auxHostText01,
        auxHostText02: data.auxHostText02,
        auxHostText03: data.auxHostText03,
        auxHostText04: data.auxHostText04,
        auxHostText05: data.auxHostText05,
        auxHostInt01: data.auxHostInt01,
        auxHostInt02: data.auxHostInt02,
        auxHostInt03: data.auxHostInt03,
        auxHostBit01: data.auxHostBit01,
        auxHostBit02: data.auxHostBit02,
        auxHostBit03: data.auxHostBit03,
        auxHostDate01: data.auxHostDate01,
        auxHostDate02: data.auxHostDate02,
        auxHostDate03: data.auxHostDate03,
        auxHostNum01: data.auxHostNum01,
        auxHostNum02: data.auxHostNum02,
        auxHostNum03: data.auxHostNum03,
      },
      listRows: []
    };

    return await listsApi.executeListOperations([request]);
  },

  /**
   * Delete a list
   * Command: ELIMINA_LISTA
   */
  deleteList: async (listNumber: string): Promise<StandardResponse> => {
    const request: DeleteListRequest = {
      command: HostCommandList.ELIMINA_LISTA,
      listHeader: {
        listNumber
      },
      listRows: []
    };

    return await listsApi.executeListOperations([request]);
  },

  /**
   * Update list rows
   * Command: AGGIORNA_RIGA
   */
  updateListRows: async (
    listNumber: string,
    rows: Array<{
      rowNumber: string;
      item: string;
      requestedQty: number;
      lineDescription?: string;
      lot?: string;
      serialNumber?: string;
      expiryDate?: string;
      rowSequence?: number;
      operatorInfo?: string;
      labelInfo?: string;
      auxHostText01?: string;
      auxHostText02?: string;
      auxHostText03?: string;
      auxHostText04?: string;
      auxHostText05?: string;
      auxHostInt01?: number;
      auxHostInt02?: number;
      auxHostInt03?: number;
      auxHostBit01?: boolean;
      auxHostBit02?: boolean;
      auxHostBit03?: boolean;
      auxHostDate01?: string;
      auxHostDate02?: string;
      auxHostDate03?: string;
      auxHostNum01?: number;
      auxHostNum02?: number;
      auxHostNum03?: number;
    }>
  ): Promise<StandardResponse> => {
    const request: UpdateListRowsRequest = {
      command: HostCommandList.AGGIORNA_RIGA,
      listHeader: {
        listNumber
      },
      listRows: rows.map(row => ({
        ...row,
        listNumber
      }))
    };

    return await listsApi.executeListOperations([request]);
  },

  // ================== Utility Methods ==================

  /**
   * Check if response is successful
   */
  isResponseOk: (response: StandardResponse | ListsResponse): boolean => {
    return response.result === 'OK';
  },

  /**
   * Get error messages from response
   */
  getErrorMessages: (response: StandardResponse | ListsResponse): string[] => {
    if (!response.errors || response.errors.length === 0) {
      return [];
    }

    return response.errors.map(err =>
      err.errorMessage || err.description || 'Unknown error'
    );
  },

  /**
   * Get first error message
   */
  getFirstErrorMessage: (response: StandardResponse | ListsResponse): string | null => {
    const errors = listsApi.getErrorMessages(response);
    return errors.length > 0 ? errors[0] : null;
  }
};

export default listsApi;

