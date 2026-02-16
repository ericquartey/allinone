// ============================================================================
// EJLOG WMS - Notifications API Service
// Endpoint per la gestione notifiche real-time con RTK Query
// ============================================================================

import { baseApi } from './baseApi';

export interface Notification {
  id: number;
  userId?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  priority: 1 | 2 | 3 | 4; // 1=Bassa, 2=Media, 3=Alta, 4=Urgente
  read: boolean;
  category?: string;
  relatedEntity?: string;
  relatedId?: string;
  createdDate: string;
  readDate?: string;
  expiresAt?: string;
  actionUrl?: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  limit: number;
  offset: number;
}

export interface NotificationPreferences {
  id?: number;
  userId: string;
  enableSound: boolean;
  enableDesktop: boolean;
  enableEmail: boolean;
  enablePush: boolean;
  categories: string[];
  quietHoursStart?: string;
  quietHoursEnd?: string;
  createdDate?: string;
  modifiedDate?: string;
}

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/notifications - Lista notifiche
    getNotifications: builder.query<
      NotificationsResponse,
      { userId?: string; unreadOnly?: boolean; category?: string; limit?: number; offset?: number } | void
    >({
      query: (params = {}) => ({
        url: '/notifications',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.notifications.map(({ id }) => ({ type: 'Notification' as const, id })),
              { type: 'Notification', id: 'LIST' },
            ]
          : [{ type: 'Notification', id: 'LIST' }],
    }),

    // GET /api/notifications/unread-count - Conteggio non lette
    getUnreadCount: builder.query<{ unreadCount: number }, { userId?: string } | void>({
      query: (params = {}) => ({
        url: '/notifications/unread-count',
        params,
      }),
      providesTags: [{ type: 'Notification', id: 'COUNT' }],
    }),

    // PUT /api/notifications/:id/read - Marca come letta
    markAsRead: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: 'PUT',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Notification', id },
        { type: 'Notification', id: 'LIST' },
        { type: 'Notification', id: 'COUNT' },
      ],
    }),

    // PUT /api/notifications/mark-all-read - Marca tutte come lette
    markAllAsRead: builder.mutation<{ message: string; count: number }, { userId?: string } | void>({
      query: (body = {}) => ({
        url: '/notifications/mark-all-read',
        method: 'PUT',
        body,
      }),
      invalidatesTags: [
        { type: 'Notification', id: 'LIST' },
        { type: 'Notification', id: 'COUNT' },
      ],
    }),

    // GET /api/notifications/preferences/:userId - Recupera preferenze
    getPreferences: builder.query<NotificationPreferences, string>({
      query: (userId) => `/notifications/preferences/${userId}`,
      providesTags: (result, error, userId) => [{ type: 'NotificationPreferences', id: userId }],
    }),

    // PUT /api/notifications/preferences/:userId - Aggiorna preferenze
    updatePreferences: builder.mutation<{ message: string }, { userId: string; data: Partial<NotificationPreferences> }>({
      query: ({ userId, data }) => ({
        url: `/notifications/preferences/${userId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { userId }) => [{ type: 'NotificationPreferences', id: userId }],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useGetPreferencesQuery,
  useUpdatePreferencesMutation,
} = notificationsApi;
