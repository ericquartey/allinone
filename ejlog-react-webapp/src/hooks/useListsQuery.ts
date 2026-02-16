import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { listsService } from '../services/api';
import { List, ListFilterParams, ApiResponse } from '@/types/api';

/**
 * Query key factory for lists
 * Provides type-safe query keys for React Query
 */
export const listsKeys = {
  all: ['lists'] as const,
  lists: () => [...listsKeys.all, 'list'] as const,
  list: (filters: ListFilterParams) => [...listsKeys.lists(), filters] as const,
  detail: (id: string) => [...listsKeys.all, 'detail', id] as const,
};

/**
 * Hook to fetch paginated lists with React Query
 * @param params - Filter and pagination parameters
 * @param options - React Query options
 * @returns React Query result with lists data
 */
export const useListsQuery = (
  params: ListFilterParams = {},
  options?: Omit<UseQueryOptions<List[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<List[], Error>({
    queryKey: listsKeys.list(params),
    queryFn: () => listsService.getLists(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

/**
 * Hook to fetch single list detail
 * @param listId - List identifier
 * @param options - React Query options
 * @returns React Query result with list detail
 */
export const useListDetailQuery = (
  listId: string,
  options?: Omit<UseQueryOptions<List, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<List, Error>({
    queryKey: listsKeys.detail(listId),
    queryFn: () => listsService.viewList(listId),
    staleTime: 5 * 60 * 1000,
    enabled: !!listId, // Only fetch if listId is provided
    ...options,
  });
};

/**
 * Hook to save lists (create/update)
 * Automatically invalidates lists cache on success
 * @param options - React Query mutation options
 * @returns Mutation handler for saving lists
 */
export const useSaveListsMutation = (
  options?: Omit<UseMutationOptions<ApiResponse<List>, Error, List[]>, 'mutationFn'>
) => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<List>, Error, List[]>({
    mutationFn: (lists: List[]) => listsService.saveLists(lists),
    onSuccess: (data, variables, context) => {
      // Invalidate all lists queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: listsKeys.lists() });

      // Call custom onSuccess if provided
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

/**
 * Hook to view list details (legacy method)
 * @param options - React Query mutation options
 * @returns Mutation handler for viewing lists
 */
export const useViewListsMutation = (
  options?: Omit<UseMutationOptions<ApiResponse<List>, Error, any[]>, 'mutationFn'>
) => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<List>, Error, any[]>({
    mutationFn: (viewLists: any[]) => listsService.viewLists(viewLists),
    onSuccess: (data, variables, context) => {
      // Invalidate all lists queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: listsKeys.lists() });

      // Call custom onSuccess if provided
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

// Export default for backward compatibility
export default useListsQuery;
