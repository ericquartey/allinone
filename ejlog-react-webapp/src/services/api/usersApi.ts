// ============================================================================
// EJLOG WMS - Users/Auth API Service
// Endpoint per autenticazione e gestione utenti
// ============================================================================

import { baseApi } from './baseApi';
import type { User, UserClaims, LoginRequest, LoginResponse, ApiResponse } from '../../types/models';
import type {
  UserGroup,
  LoginAttempt,
  LoginHistoryFilters,
  UserSearchParams,
  UserSearchResponse
} from '../../types/user.types';

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // POST /api/auth/login - Login con username/password
    // Backend Node.js su porta 3077 con database SQL Server
    // 35 utenti reali dal database: superuser, admin, user, etc.
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/api/auth/login',
        method: 'POST',
        body: credentials, // Backend usa body JSON
      }),
    }),

    // POST /api/auth/badge - Login con badge
    authenticateWithBadge: builder.mutation<LoginResponse, { badgeCode: string }>({
      query: (body) => ({
        url: '/auth/badge',
        method: 'POST',
        body,
      }),
    }),

    // POST /api/auth/logout - Logout
    logout: builder.mutation<ApiResponse<void>, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
    }),

    // GET /api/users - Lista utenti (richiede autenticazione)
    getUsers: builder.query<UserClaims[], void>({
      query: () => '/api/users',
      providesTags: [{ type: 'User', id: 'LIST' }],
    }),

    // GET /api/users/{id} - Dettaglio utente
    getUserById: builder.query<User, number>({
      query: (id) => `/users/${id}`,
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),

    // GET /api/users/me - Utente corrente
    getCurrentUser: builder.query<UserClaims, void>({
      query: () => '/users/me',
    }),

    // POST /api/users - Crea utente
    createUser: builder.mutation<ApiResponse<User>, Partial<User> & { password: string }>({
      query: (body) => ({
        url: '/users',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),

    // PUT /api/users/{id} - Aggiorna utente
    updateUser: builder.mutation<ApiResponse<User>, { id: number; data: Partial<User> }>({
      query: ({ id, data }) => ({
        url: `/users/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'User', id },
        { type: 'User', id: 'LIST' },
      ],
    }),

    // PUT /api/users/{id}/password - Cambia password
    changePassword: builder.mutation<
      ApiResponse<void>,
      { id: number; currentPassword: string; newPassword: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/users/${id}/password`,
        method: 'PUT',
        body,
      }),
    }),

    // DELETE /api/users/{id} - Elimina utente
    deleteUser: builder.mutation<ApiResponse<void>, number>({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),

    // ==================== USER GROUPS ====================

    // GET /api/user-groups - Lista gruppi utenti
    getUserGroups: builder.query<UserGroup[], void>({
      query: () => '/api/user-groups',
      providesTags: [{ type: 'User', id: 'GROUPS' }],
    }),

    // GET /api/user-groups/{id} - Dettaglio gruppo
    getUserGroupById: builder.query<UserGroup, number>({
      query: (id) => `/api/user-groups/${id}`,
      providesTags: (result, error, id) => [{ type: 'User', id: `GROUP_${id}` }],
    }),

    // POST /api/user-groups - Crea gruppo
    createUserGroup: builder.mutation<UserGroup, { name: string; level: number; description?: string }>({
      query: (body) => ({
        url: '/api/user-groups',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'User', id: 'GROUPS' }],
    }),

    // PUT /api/user-groups/{id} - Aggiorna gruppo
    updateUserGroup: builder.mutation<UserGroup, { id: number; data: Partial<UserGroup> }>({
      query: ({ id, data }) => ({
        url: `/api/user-groups/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'User', id: `GROUP_${id}` },
        { type: 'User', id: 'GROUPS' },
      ],
    }),

    // DELETE /api/user-groups/{id} - Elimina gruppo
    deleteUserGroup: builder.mutation<ApiResponse<void>, number>({
      query: (id) => ({
        url: `/api/user-groups/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'User', id: 'GROUPS' }],
    }),

    // ==================== LOGIN HISTORY ====================

    // GET /api/login-history - Storico accessi
    getLoginHistory: builder.query<
      { data: LoginAttempt[]; pagination: { total: number; limit: number; offset: number; hasMore: boolean } },
      LoginHistoryFilters
    >({
      query: (filters = {}) => ({
        url: '/api/login-history',
        params: {
          username: filters.username,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          successOnly: filters.successOnly,
          failedOnly: filters.failedOnly,
          limit: filters.limit || 50,
          offset: filters.offset || 0,
        },
      }),
      providesTags: [{ type: 'User', id: 'LOGIN_HISTORY' }],
    }),

    // GET /api/login-history/stats - Statistiche accessi
    getLoginStats: builder.query<
      {
        stats: {
          totalAttempts: number;
          successfulLogins: number;
          failedLogins: number;
          uniqueUsers: number;
          uniqueIPs: number;
        };
        topFailedUsers: Array<{ username: string; failedAttempts: number; lastFailedAttempt: string }>;
      },
      { username?: string; days?: number }
    >({
      query: (params = {}) => ({
        url: '/api/login-history/stats',
        params: {
          username: params.username,
          days: params.days || 7,
        },
      }),
    }),

    // POST /api/login-history - Registra tentativo login
    logLoginAttempt: builder.mutation<
      { message: string; id: number; timestamp: string },
      {
        username: string;
        success: boolean;
        failureReason?: string;
        ipAddress?: string;
        userAgent?: string;
      }
    >({
      query: (body) => ({
        url: '/api/login-history',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'User', id: 'LOGIN_HISTORY' }],
    }),
  }),
});

export const {
  useLoginMutation,
  useAuthenticateWithBadgeMutation,
  useLogoutMutation,
  useGetUsersQuery,
  useGetUserByIdQuery,
  useGetCurrentUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useChangePasswordMutation,
  useDeleteUserMutation,
  // User Groups
  useGetUserGroupsQuery,
  useGetUserGroupByIdQuery,
  useCreateUserGroupMutation,
  useUpdateUserGroupMutation,
  useDeleteUserGroupMutation,
  // Login History
  useGetLoginHistoryQuery,
  useLazyGetLoginHistoryQuery,
  useGetLoginStatsQuery,
  useLogLoginAttemptMutation,
} = usersApi;

