import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { movementsService } from '../services/api';
import { Movement, ApiResponse } from '@/types/api';

/**
 * Movements Filter Parameters
 */
interface MovementsFilterParams {
  articleId?: string;
  skip?: number;
  take?: number;
  orderBy?: string;
  fromDate?: string;
  toDate?: string;
  movementType?: string;
}

/**
 * Query key factory for movements
 */
export const movementsKeys = {
  all: ['movements'] as const,
  lists: () => [...movementsKeys.all, 'list'] as const,
  list: (filters: MovementsFilterParams) => [...movementsKeys.lists(), filters] as const,
};

/**
 * Hook to fetch movements with filters
 * @param params - Query parameters
 * @param options - React Query options
 * @returns Query result with movements data
 */
export const useMovements = (
  params: MovementsFilterParams = {},
  options?: Omit<UseQueryOptions<ApiResponse<Movement>, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<ApiResponse<Movement>, Error>({
    queryKey: movementsKeys.list(params),
    queryFn: () => movementsService.getMovements(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

export default useMovements;
