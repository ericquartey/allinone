import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { reservationsService } from '../services/api';
import { Reservation, ReservationsResponse, ReservationStatus, ReservationsFilterParams } from '../services/api/reservations';

/**
 * Query key factory for reservations
 */
export const reservationsKeys = {
  all: ['reservations'] as const,
  lists: () => [...reservationsKeys.all, 'list'] as const,
  list: (filters: ReservationsFilterParams) => [...reservationsKeys.lists(), filters] as const,
  detail: (id: number) => [...reservationsKeys.all, 'detail', id] as const,
};

/**
 * React Query hook for reservations list
 * @param filters - Filter parameters
 * @param options - React Query options
 * @returns Query result with reservations data
 */
export function useReservations(
  filters: ReservationsFilterParams = {},
  options?: Omit<UseQueryOptions<ReservationsResponse, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<ReservationsResponse, Error>({
    queryKey: reservationsKeys.list(filters),
    queryFn: () => reservationsService.getReservations(filters),
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
    ...options,
  });
}

/**
 * React Query hook for single reservation
 * @param id - Reservation ID
 * @param options - React Query options
 * @returns Query result with reservation detail
 */
export function useReservation(
  id: number,
  options?: Omit<UseQueryOptions<Reservation, Error>, 'queryKey' | 'queryFn' | 'enabled'>
) {
  return useQuery<Reservation, Error>({
    queryKey: reservationsKeys.detail(id),
    queryFn: () => reservationsService.getReservationById(id),
    enabled: !!id,
    staleTime: 60000, // 1 minute
    ...options,
  });
}

/**
 * Update Reservation Status Params
 */
interface UpdateReservationStatusParams {
  id: number;
  status: ReservationStatus;
}

/**
 * Mutation hook for updating reservation status
 * @param options - React Query mutation options
 * @returns Mutation result
 */
export function useUpdateReservationStatus(
  options?: UseMutationOptions<Reservation, Error, UpdateReservationStatusParams>
) {
  const queryClient = useQueryClient();

  return useMutation<Reservation, Error, UpdateReservationStatusParams>({
    mutationFn: ({ id, status }: UpdateReservationStatusParams) =>
      reservationsService.updateReservationStatus(id, status),
    onSuccess: () => {
      // Invalidate and refetch reservations
      queryClient.invalidateQueries({ queryKey: reservationsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: reservationsKeys.all });
    },
    ...options,
  });
}

export default useReservations;
