// ============================================================================
// EJLOG WMS - User Management RTK Query Hooks
// React Query hooks for user management with proper caching
// ============================================================================

import { baseApi } from './baseApi';
import type {
  User,
  UserGroup,
  LoginAttempt,
  TokenHistory,
  CreateUserDTO,
  UpdateUserDTO,
  ChangePasswordDTO,
  UserSearchParams,
  UserSearchResponse,
  LoginHistoryFilters,
} from '@/types/user.types';

/**
 * User Management API using RTK Query
 * Provides automatic caching, invalidation, and optimistic updates
 */
export const userManagementRTKApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ========================================================================
    // User CRUD
    // ========================================================================

    /**
     * Search users with filters and pagination
     * GET /api/users/search
     */
    searchUsers: builder.query<UserSearchResponse, UserSearchParams>({
      query: (params) => ({
        url: '/users/search',
        params: {
          username: params.username || undefined,
          groupId: params.groupId || undefined,
          limit: params.limit || 20,
          offset: params.offset || 0,
        },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.users.map(({ id }) => ({ type: 'User' as const, id })),
              { type: 'User', id: 'SEARCH' },
            ]
          : [{ type: 'User', id: 'SEARCH' }],
    }),

    /**
     * Get all users
     * GET /api/users
     */
    getAllUsers: builder.query<User[], void>({
      query: () => '/users',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'User' as const, id })),
              { type: 'User', id: 'LIST' },
            ]
          : [{ type: 'User', id: 'LIST' }],
    }),

    /**
     * Get user by ID
     * GET /api/users/:id
     */
    getUserById: builder.query<User, number>({
      query: (id) => `/users/${id}`,
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),

    /**
     * Create new user
     * POST /api/users
     */
    createUser: builder.mutation<User, CreateUserDTO>({
      query: (userData) => ({
        url: '/users',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: [
        { type: 'User', id: 'LIST' },
        { type: 'User', id: 'SEARCH' },
      ],
    }),

    /**
     * Update user
     * PUT /api/users/:id
     */
    updateUser: builder.mutation<User, { id: number; data: UpdateUserDTO }>({
      query: ({ id, data }) => ({
        url: `/users/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'User', id },
        { type: 'User', id: 'LIST' },
        { type: 'User', id: 'SEARCH' },
      ],
    }),

    /**
     * Delete user
     * DELETE /api/users/:id
     */
    deleteUser: builder.mutation<void, number>({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [
        { type: 'User', id: 'LIST' },
        { type: 'User', id: 'SEARCH' },
      ],
    }),

    // ========================================================================
    // Password Management
    // ========================================================================

    /**
     * Change user password
     * PUT /api/users/:id/password
     */
    changeUserPassword: builder.mutation<
      void,
      { id: number; passwordData: ChangePasswordDTO }
    >({
      query: ({ id, passwordData }) => ({
        url: `/users/${id}/password`,
        method: 'PUT',
        body: passwordData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'User', id }],
    }),

    // ========================================================================
    // Login History
    // ========================================================================

    /**
     * Get login history for a specific user
     * GET /api/users/:id/login-history
     */
    getUserLoginHistory: builder.query<
      LoginAttempt[],
      { userId: number; filters?: LoginHistoryFilters }
    >({
      query: ({ userId, filters = {} }) => ({
        url: `/users/${userId}/login-history`,
        params: {
          limit: filters.limit || 50,
          offset: filters.offset || 0,
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined,
          success: filters.successOnly
            ? true
            : filters.failedOnly
            ? false
            : undefined,
        },
      }),
      providesTags: (result, error, { userId }) => [
        { type: 'User', id: `LOGIN_HISTORY_${userId}` },
      ],
    }),

    /**
     * Get all login attempts (Admin only)
     * GET /api/login-attempts
     */
    getAllLoginHistory: builder.query<LoginAttempt[], LoginHistoryFilters>({
      query: (filters = {}) => ({
        url: '/login-attempts',
        params: {
          username: filters.username || undefined,
          limit: filters.limit || 50,
          offset: filters.offset || 0,
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined,
        },
      }),
      providesTags: [{ type: 'User', id: 'LOGIN_HISTORY_ALL' }],
    }),

    // ========================================================================
    // Token Management
    // ========================================================================

    /**
     * Get active tokens for a user
     * GET /api/users/:id/tokens
     */
    getUserTokens: builder.query<TokenHistory[], number>({
      query: (userId) => `/users/${userId}/tokens`,
      providesTags: (result, error, userId) => [
        { type: 'User', id: `TOKENS_${userId}` },
      ],
    }),

    /**
     * Get all active tokens (Admin only)
     * GET /api/tokens
     */
    getAllActiveTokens: builder.query<TokenHistory[], void>({
      query: () => '/tokens',
      providesTags: [{ type: 'User', id: 'TOKENS_ALL' }],
    }),

    /**
     * Revoke specific token
     * POST /api/tokens/:tokenId/revoke
     */
    revokeToken: builder.mutation<void, string>({
      query: (tokenId) => ({
        url: `/tokens/${tokenId}/revoke`,
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'User', id: 'TOKENS_ALL' }],
    }),

    /**
     * Revoke all tokens for a user
     * POST /api/users/:id/revoke-tokens
     */
    revokeUserTokens: builder.mutation<void, number>({
      query: (userId) => ({
        url: `/users/${userId}/revoke-tokens`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, userId) => [
        { type: 'User', id: `TOKENS_${userId}` },
        { type: 'User', id: 'TOKENS_ALL' },
      ],
    }),

    // ========================================================================
    // User Groups
    // ========================================================================

    /**
     * Get all user groups
     * GET /api/user-groups
     */
    getUserGroups: builder.query<UserGroup[], void>({
      query: () => '/user-groups',
      providesTags: [{ type: 'User', id: 'GROUPS' }],
    }),

    /**
     * Get user group by ID
     * GET /api/user-groups/:id
     */
    getUserGroupById: builder.query<UserGroup, number>({
      query: (id) => `/user-groups/${id}`,
      providesTags: (result, error, id) => [{ type: 'User', id: `GROUP_${id}` }],
    }),
  }),
});

// Export hooks
export const {
  // User CRUD
  useSearchUsersQuery,
  useGetAllUsersQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,

  // Password
  useChangeUserPasswordMutation,

  // Login History
  useGetUserLoginHistoryQuery,
  useGetAllLoginHistoryQuery,

  // Tokens
  useGetUserTokensQuery,
  useGetAllActiveTokensQuery,
  useRevokeTokenMutation,
  useRevokeUserTokensMutation,

  // Groups
  useGetUserGroupsQuery,
  useGetUserGroupByIdQuery,
} = userManagementRTKApi;
