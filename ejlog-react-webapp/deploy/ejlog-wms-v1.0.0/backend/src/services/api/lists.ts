import apiClient from './client';
import { API_ENDPOINTS } from './endpoints';
import { List, ListFilterParams, ApiResponse } from '@/types/api';

/**
 * Lists API Service
 * Handles list-related operations with full type safety
 */
export const listsService = {
  /**
   * Get paginated lists with filters
   * @param params - Filter and pagination parameters
   * @returns Promise<List[]> - Array of lists
   */
  getLists: async (params: ListFilterParams = {}): Promise<List[]> => {
    const {
      skip = 0,
      take = 50,
      orderBy = undefined,
      listType = undefined,
      status = undefined,
      listNumber = undefined
    } = params;

    // Backend uses 'limit' and 'offset' instead of 'take' and 'skip'
    const queryParams: Record<string, any> = {
      limit: take,
      offset: skip
    };

    if (listType !== undefined) queryParams.listType = listType;
    if (status !== undefined) queryParams.listStatus = status;
    if (listNumber) queryParams.listNumber = listNumber;
    if (orderBy) queryParams.orderBy = orderBy;

    // IMPORTANTE: usare /api/EjLogHostVertimag/Lists per sfruttare il proxy Vite
    // Il proxy Vite trasforma: /api/EjLogHostVertimag/* → http://localhost:3077/EjLogHostVertimag/*
    console.log('[listsService] Calling backend with params:', queryParams);

    const response = await apiClient.get<ApiResponse<List>>(
      '/api/EjLogHostVertimag/Lists',
      { params: queryParams }
    );

    console.log('[listsService] Response from backend:', response.data);

    // Il backend ritorna { result, message, recordNumber, exported, errors }
    // exported è un array di { listHeader, listRows }
    return response.data.exported || [];
  },

  /**
   * Create or update lists
   * @param lists - Array of lists to save
   * @returns Promise<ApiResponse<List>> - Standard response
   */
  saveLists: async (lists: List[]): Promise<ApiResponse<List>> => {
    const response = await apiClient.post<ApiResponse<List>>(
      API_ENDPOINTS.LISTS,
      lists
    );
    return response.data;
  },

  /**
   * View list details by ID
   * @param listId - List identifier
   * @returns Promise<List> - List details
   */
  viewList: async (listId: string): Promise<List> => {
    const response = await apiClient.get<ApiResponse<List>>(
      `${API_ENDPOINTS.LISTS}/${listId}`
    );
    // Return first item from exported or result array
    const list = response.data.exported?.[0] || response.data.result?.[0];
    if (!list) {
      throw new Error(`List with ID ${listId} not found`);
    }
    return list;
  },

  /**
   * View multiple lists (legacy method)
   * @param viewLists - Array of view list requests
   * @returns Promise<ApiResponse<List>> - Standard response
   */
  viewLists: async (viewLists: any[]): Promise<ApiResponse<List>> => {
    const response = await apiClient.post<ApiResponse<List>>(
      API_ENDPOINTS.LISTS_VIEW,
      viewLists
    );
    return response.data;
  },
};

export default listsService;

