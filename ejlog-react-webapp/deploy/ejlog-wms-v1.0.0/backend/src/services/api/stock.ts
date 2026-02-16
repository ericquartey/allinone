import apiClient from './client';
import { API_ENDPOINTS } from './endpoints';
import { Stock, PaginationParams, ApiResponse } from '@/types/api';

/**
 * Stock Filter Parameters
 */
interface StockFilterParams extends PaginationParams {
  articleId?: string;
  searchCode?: string;
  searchDescription?: string;
  lot?: string;
  locationId?: string;
  showOnlyPositive?: boolean;
}

/**
 * Stock API Service
 * Handles stock/inventory operations
 */
export const stockService = {
  /**
   * Get stock with filters
   * @param params - Filter and pagination parameters
   * @returns Promise<ApiResponse<Stock>> - Stock data
   */
  getStock: async (params: StockFilterParams = {}): Promise<ApiResponse<Stock>> => {
    const {
      articleId = undefined,
      skip = 0,
      take = 50,
      orderBy = undefined,
      searchCode = undefined,
      searchDescription = undefined,
      lot = undefined,
      locationId = undefined,
      showOnlyPositive = undefined
    } = params;

    // Backend uses 'limit' and 'offset' instead of 'take' and 'skip'
    const queryParams: Record<string, any> = {
      limit: take,
      offset: skip
    };
    if (searchCode) queryParams.itemCode = searchCode;
    if (lot) queryParams.lot = lot;
    if (locationId !== undefined) queryParams.trayId = locationId;
    if (orderBy) queryParams.orderBy = orderBy;

    const response = await apiClient.get<ApiResponse<Stock>>(
      API_ENDPOINTS.STOCK,
      { params: queryParams }
    );
    return response.data;
  },
};

export default stockService;
