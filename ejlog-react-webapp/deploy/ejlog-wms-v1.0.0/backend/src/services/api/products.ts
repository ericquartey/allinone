import apiClient from './client';
import { API_ENDPOINTS } from './endpoints';
import { Item, PaginationParams, ApiResponse } from '@/types/api';

/**
 * Products Filter Parameters
 */
interface ProductsFilterParams extends PaginationParams {
  searchCode?: string;
  searchDescription?: string;
  machineId?: string;
  compartmentId?: string;
}

/**
 * Products API Service
 * Handles product catalog operations
 */
export const productsService = {
  /**
   * Get products with filters
   * @param params - Filter and pagination parameters
   * @returns Promise<ApiResponse<Item>> - Products data
   */
  getProducts: async (params: ProductsFilterParams = {}): Promise<ApiResponse<Item>> => {
    const {
      skip = 0,
      take = 50,
      orderBy = undefined,
      searchCode = undefined,
      searchDescription = undefined,
      machineId = undefined,
      compartmentId = undefined
    } = params;

    // Backend uses 'limit' and 'offset' instead of 'take' and 'skip'
    const queryParams: Record<string, any> = {
      limit: take,
      offset: skip
    };
    if (searchCode) queryParams.itemCode = searchCode;
    if (orderBy) queryParams.orderBy = orderBy;

    const response = await apiClient.get<ApiResponse<Item>>(
      API_ENDPOINTS.ITEMS,
      { params: queryParams }
    );
    return response.data;
  },

  /**
   * Save products
   * @param products - Array of products to save
   * @returns Promise<ApiResponse<Item>> - Save response
   */
  saveProducts: async (products: Item[]): Promise<ApiResponse<Item>> => {
    const response = await apiClient.post<ApiResponse<Item>>(
      API_ENDPOINTS.ITEMS,
      products
    );
    return response.data;
  },
};

export default productsService;
