import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { productsService } from '../services/api';
import { Item, ApiResponse } from '@/types/api';

/**
 * Products Filter Parameters
 */
interface ProductsFilterParams {
  skip?: number;
  take?: number;
  orderBy?: string;
  searchCode?: string;
  searchDescription?: string;
}

/**
 * Query key factory for products
 */
export const productsKeys = {
  all: ['products'] as const,
  lists: () => [...productsKeys.all, 'list'] as const,
  list: (filters: ProductsFilterParams) => [...productsKeys.lists(), filters] as const,
};

/**
 * Hook to fetch products with filters
 * @param params - Query parameters
 * @param options - React Query options
 * @returns Query result with products data
 */
export const useProducts = (
  params: ProductsFilterParams = {},
  options?: Omit<UseQueryOptions<ApiResponse<Item>, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<ApiResponse<Item>, Error>({
    queryKey: productsKeys.list(params),
    queryFn: () => productsService.getProducts(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

/**
 * Hook to save products
 * @param options - React Query mutation options
 * @returns Mutation result
 */
export const useSaveProducts = (
  options?: UseMutationOptions<ApiResponse<Item>, Error, Item[]>
) => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<Item>, Error, Item[]>({
    mutationFn: (products: Item[]) => productsService.saveProducts(products),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productsKeys.lists() });
    },
    ...options,
  });
};

export default useProducts;
