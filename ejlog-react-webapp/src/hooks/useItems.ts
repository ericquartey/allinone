import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { itemsService } from '../services/api';
import { Item, ItemsResponse } from '@/types/api';

/**
 * Items Filter Parameters
 */
interface ItemsFilterParams {
  skip?: number;
  take?: number;
  orderBy?: string;
  sortDirection?: 'asc' | 'desc';
  searchCode?: string;
  searchDescription?: string;
}

/**
 * Query key factory for items
 */
export const itemsKeys = {
  all: ['items'] as const,
  lists: () => [...itemsKeys.all, 'list'] as const,
  list: (filters: ItemsFilterParams) => [...itemsKeys.lists(), filters] as const,
};

/**
 * Hook to fetch paginated items
 * @param params - Query parameters
 * @param options - React Query options
 * @returns Query result with items data
 */
export const useItems = (
  params: ItemsFilterParams = {},
  options?: Omit<UseQueryOptions<ItemsResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<ItemsResponse, Error>({
    queryKey: itemsKeys.list(params),
    queryFn: () => itemsService.getItems(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

/**
 * Hook to save items (create/update)
 * @param options - React Query mutation options
 * @returns Mutation result
 */
export const useSaveItems = (
  options?: UseMutationOptions<ItemsResponse, Error, Item[]>
) => {
  const queryClient = useQueryClient();

  return useMutation<ItemsResponse, Error, Item[]>({
    mutationFn: (items: Item[]) => itemsService.saveItems(items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemsKeys.lists() });
    },
    ...options,
  });
};

export default useItems;
