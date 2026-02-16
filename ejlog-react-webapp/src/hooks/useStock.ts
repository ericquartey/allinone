import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { stockService } from '../services/api';
import { Stock, ApiResponse } from '@/types/api';

/**
 * Stock Filter Parameters
 */
interface StockFilterParams {
  articleId?: string;
  skip?: number;
  take?: number;
  orderBy?: string;
  searchCode?: string;
  searchDescription?: string;
  lot?: string;
  locationId?: string;
  showOnlyPositive?: boolean;
}

/**
 * Query key factory for stock
 */
export const stockKeys = {
  all: ['stock'] as const,
  lists: () => [...stockKeys.all, 'list'] as const,
  list: (filters: StockFilterParams) => [...stockKeys.lists(), filters] as const,
};

/**
 * Hook to fetch stock with filters
 * @param params - Query parameters
 * @param options - React Query options
 * @returns Query result with stock data
 */
export const useStock = (
  params: StockFilterParams = {},
  options?: Omit<UseQueryOptions<ApiResponse<Stock>, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<ApiResponse<Stock>, Error>({
    queryKey: stockKeys.list(params),
    queryFn: () => stockService.getStock(params),
    staleTime: 2 * 60 * 1000, // 2 minutes (stock changes frequently)
    ...options,
  });
};

export default useStock;
