// ============================================================================
// EJLOG WMS - Execution Hooks
// React Query hooks per gestione execution lists (Picking, Refilling, etc.)
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  getExecutionLists,
  getListRows,
  pickItem,
  refillItem,
  inventoryItem,
  visionConfirm,
  pauseLists,
  getListStatus,
  executionKeys,
  type ExecutionListFilters,
  type PickItemRequest,
  type RefillItemRequest,
  type InventoryItemRequest,
  type VisionConfirmRequest,
  type PauseListsRequest,
} from '../services/api/executionApi';

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Hook per recuperare liste in esecuzione
 * @param filters - Filtri per la ricerca
 * @param options - Opzioni React Query
 */
export function useExecutionLists(
  filters?: ExecutionListFilters,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
) {
  return useQuery({
    queryKey: executionKeys.lists(filters),
    queryFn: () => getExecutionLists(filters),
    refetchInterval: options?.refetchInterval || 30000, // Auto-refresh ogni 30s
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook per recuperare righe di una lista
 * @param listId - ID della lista
 */
export function useListRows(listId: number | string) {
  const id = typeof listId === 'string' ? parseInt(listId, 10) : listId;

  return useQuery({
    queryKey: executionKeys.rows(id),
    queryFn: () => getListRows(id),
    enabled: !!id && !isNaN(id),
  });
}

/**
 * Hook per recuperare stato aggiornato di una lista
 * @param listId - ID della lista
 * @param options - Opzioni React Query
 */
export function useListStatus(
  listId: number,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
) {
  return useQuery({
    queryKey: executionKeys.status(listId),
    queryFn: () => getListStatus(listId),
    refetchInterval: options?.refetchInterval || 5000, // Auto-refresh ogni 5s
    enabled: options?.enabled ?? true,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Hook per eseguire picking di un articolo
 */
export function usePickItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: PickItemRequest) => pickItem(request),
    onSuccess: (_, variables) => {
      // Invalida cache righe lista per ricaricare dati aggiornati
      queryClient.invalidateQueries({
        queryKey: executionKeys.rows(variables.itemId),
      });

      // Invalida cache status lista
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey as string[];
          return key[0] === 'execution' && key[1] === 'status';
        },
      });

      toast.success('Picking confermato con successo');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Errore durante il picking';
      toast.error(errorMessage);
      console.error('Pick item error:', error);
    },
  });
}

/**
 * Hook per eseguire refilling/deposito di un articolo
 */
export function useRefillItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: RefillItemRequest) => refillItem(request),
    onSuccess: (_, variables) => {
      // Invalida cache righe lista
      queryClient.invalidateQueries({
        queryKey: executionKeys.rows(variables.itemId),
      });

      // Invalida cache status lista
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey as string[];
          return key[0] === 'execution' && key[1] === 'status';
        },
      });

      toast.success('Refilling confermato con successo');
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message || 'Errore durante il refilling';
      toast.error(errorMessage);
      console.error('Refill item error:', error);
    },
  });
}

/**
 * Hook per eseguire conteggio inventario di un articolo
 */
export function useInventoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: InventoryItemRequest) => inventoryItem(request),
    onSuccess: (_, variables) => {
      // Invalida cache righe lista
      queryClient.invalidateQueries({
        queryKey: executionKeys.rows(variables.itemId),
      });

      // Invalida cache status lista
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey as string[];
          return key[0] === 'execution' && key[1] === 'status';
        },
      });

      toast.success('Inventario confermato con successo');
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message || 'Errore durante il conteggio inventario';
      toast.error(errorMessage);
      console.error('Inventory item error:', error);
    },
  });
}

/**
 * Hook per confermare operazione di visione UDC
 */
export function useVisionConfirm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: VisionConfirmRequest) => visionConfirm(request),
    onSuccess: (_, variables) => {
      // Invalida cache righe lista
      queryClient.invalidateQueries({
        queryKey: executionKeys.rows(variables.itemId),
      });

      // Invalida cache status lista
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey as string[];
          return key[0] === 'execution' && key[1] === 'status';
        },
      });

      // Success toast handled in component for better UX flow
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message || 'Errore durante la conferma visione';
      toast.error(errorMessage);
      console.error('Vision confirm error:', error);
    },
  });
}

/**
 * Hook per mettere liste in pausa
 */
export function usePauseLists() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: PauseListsRequest) => pauseLists(request),
    onSuccess: (_, variables) => {
      // Invalida cache liste per ricaricare stato aggiornato
      queryClient.invalidateQueries({
        queryKey: executionKeys.all,
      });

      toast.success(
        `${variables.listIds.length} lista/e messa/e in pausa con successo`
      );
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message || 'Errore durante la pausa liste';
      toast.error(errorMessage);
      console.error('Pause lists error:', error);
    },
  });
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Hook per il polling automatico dello stato lista
 * Utile per aggiornare progress bar in real-time
 */
export function useListStatusPolling(
  listId: number,
  options?: {
    enabled?: boolean;
    interval?: number;
  }
) {
  const interval = options?.interval || 5000; // Default 5 secondi

  const { data, isLoading } = useListStatus(listId, {
    enabled: options?.enabled ?? true,
    refetchInterval: interval,
  });

  const progress = data
    ? Math.round((data.righeCompletate / data.totaleRighe) * 100)
    : 0;

  return {
    status: data?.statoLista,
    totaleRighe: data?.totaleRighe || 0,
    righeCompletate: data?.righeCompletate || 0,
    progress,
    isLoading,
  };
}

/**
 * Hook composito per gestione completa esecuzione lista
 * Combina queries e mutations in un unico hook
 */
export function useListExecution(listId: number | string) {
  const id = typeof listId === 'string' ? parseInt(listId, 10) : listId;

  const rowsQuery = useListRows(id);
  const statusQuery = useListStatus(id, { refetchInterval: 10000 });
  const pickMutation = usePickItem();
  const refillMutation = useRefillItem();
  const inventoryMutation = useInventoryItem();

  return {
    // Data
    rows: rowsQuery.data || [],
    status: statusQuery.data,

    // Loading states
    isLoadingRows: rowsQuery.isLoading,
    isLoadingStatus: statusQuery.isLoading,
    isExecuting: pickMutation.isPending || refillMutation.isPending || inventoryMutation.isPending,

    // Mutations
    pickItem: pickMutation.mutateAsync,
    refillItem: refillMutation.mutateAsync,
    inventoryItem: inventoryMutation.mutateAsync,

    // Refetch
    refetchRows: rowsQuery.refetch,
    refetchStatus: statusQuery.refetch,
  };
}

export default {
  useExecutionLists,
  useListRows,
  useListStatus,
  usePickItem,
  useRefillItem,
  useInventoryItem,
  usePauseLists,
  useListStatusPolling,
  useListExecution,
};
