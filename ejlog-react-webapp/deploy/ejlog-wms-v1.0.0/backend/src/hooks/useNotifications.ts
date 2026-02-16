// ============================================================================
// EJLOG WMS - Notifications Hooks
// React Query hooks per gestione notifiche
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  notificationKeys,
  type NotificationFilters,
  type MarkAsReadRequest,
  type DeleteNotificationRequest,
} from '../services/api/notificationsApi';

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Hook per recuperare lista notifiche
 * @param filters - Filtri per la ricerca
 * @param options - Opzioni React Query
 */
export function useNotifications(
  filters?: NotificationFilters,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
) {
  return useQuery({
    queryKey: notificationKeys.list(filters),
    queryFn: () => getNotifications(filters),
    refetchInterval: options?.refetchInterval || 30000, // Auto-refresh ogni 30s
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook per recuperare conteggio notifiche non lette
 * @param options - Opzioni React Query
 */
export function useUnreadCount(options?: {
  enabled?: boolean;
  refetchInterval?: number;
}) {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: getUnreadCount,
    refetchInterval: options?.refetchInterval || 30000, // Auto-refresh ogni 30s
    enabled: options?.enabled ?? true,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Hook per segnare notifica come letta
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: MarkAsReadRequest) => markAsRead(request),
    onSuccess: () => {
      // Invalida cache notifiche
      queryClient.invalidateQueries({
        queryKey: notificationKeys.all,
      });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Errore durante l\'aggiornamento notifica';
      toast.error(errorMessage);
      console.error('Mark as read error:', error);
    },
  });
}

/**
 * Hook per segnare tutte le notifiche come lette
 */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => markAllAsRead(userId),
    onSuccess: () => {
      // Invalida cache notifiche
      queryClient.invalidateQueries({
        queryKey: notificationKeys.all,
      });

      toast.success('Tutte le notifiche segnate come lette');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Errore durante l\'aggiornamento notifiche';
      toast.error(errorMessage);
      console.error('Mark all as read error:', error);
    },
  });
}

/**
 * Hook per eliminare una notifica
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: DeleteNotificationRequest) => deleteNotification(request),
    onSuccess: () => {
      // Invalida cache notifiche
      queryClient.invalidateQueries({
        queryKey: notificationKeys.all,
      });

      toast.success('Notifica eliminata');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Errore durante l\'eliminazione notifica';
      toast.error(errorMessage);
      console.error('Delete notification error:', error);
    },
  });
}

/**
 * Hook per eliminare tutte le notifiche
 */
export function useClearAllNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => clearAllNotifications(userId),
    onSuccess: () => {
      // Invalida cache notifiche
      queryClient.invalidateQueries({
        queryKey: notificationKeys.all,
      });

      toast.success('Tutte le notifiche eliminate');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Errore durante l\'eliminazione notifiche';
      toast.error(errorMessage);
      console.error('Clear all notifications error:', error);
    },
  });
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Hook composito per gestione completa notifiche
 * Combina queries e mutations in un unico hook
 */
export function useNotificationsManagement(filters?: NotificationFilters) {
  const notificationsQuery = useNotifications(filters);
  const unreadCountQuery = useUnreadCount();
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();
  const deleteMutation = useDeleteNotification();
  const clearAllMutation = useClearAllNotifications();

  return {
    // Data
    notifications: notificationsQuery.data || [],
    unreadCount: unreadCountQuery.data || 0,

    // Loading states
    isLoadingNotifications: notificationsQuery.isLoading,
    isLoadingUnreadCount: unreadCountQuery.isLoading,
    isUpdating:
      markAsReadMutation.isPending ||
      markAllAsReadMutation.isPending ||
      deleteMutation.isPending ||
      clearAllMutation.isPending,

    // Error states
    notificationsError: notificationsQuery.error,
    unreadCountError: unreadCountQuery.error,

    // Mutations
    markAsRead: markAsReadMutation.mutateAsync,
    markAllAsRead: markAllAsReadMutation.mutateAsync,
    deleteNotification: deleteMutation.mutateAsync,
    clearAll: clearAllMutation.mutateAsync,

    // Refetch
    refetchNotifications: notificationsQuery.refetch,
    refetchUnreadCount: unreadCountQuery.refetch,
  };
}

export default {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
  useClearAllNotifications,
  useNotificationsManagement,
};
