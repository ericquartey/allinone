/**
 * User Management React Query Hooks
 * Custom hooks using TanStack Query for user data fetching and mutations
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
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
  TokenWithStatus,
  TokenStatus,
} from '@/types/user.types';
import { userManagementApi, ApiError } from '@/services/api/userManagementApi';

// ============================================================================
// Query Keys Factory
// ============================================================================

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: UserSearchParams) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: number) => [...userKeys.details(), id] as const,
  loginHistory: (userId?: number) => [...userKeys.all, 'login-history', userId] as const,
  tokens: (userId?: number) => [...userKeys.all, 'tokens', userId] as const,
  groups: () => ['user-groups'] as const,
  group: (id: number) => [...userKeys.groups(), id] as const,
};

// ============================================================================
// User Queries
// ============================================================================

/**
 * Search users with filters and pagination
 */
export const useUsers = (
  params: UserSearchParams = {},
  options?: UseQueryOptions<UserSearchResponse, ApiError>
) => {
  return useQuery<UserSearchResponse, ApiError>({
    queryKey: userKeys.list(params),
    queryFn: () => userManagementApi.searchUsers(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

/**
 * Get user by ID
 */
export const useUser = (
  userId: number,
  options?: UseQueryOptions<User, ApiError>
) => {
  return useQuery<User, ApiError>({
    queryKey: userKeys.detail(userId),
    queryFn: () => userManagementApi.getUserById(userId),
    enabled: userId > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// ============================================================================
// User Mutations
// ============================================================================

/**
 * Create new user
 */
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation<User, ApiError, CreateUserDTO>({
    mutationFn: (userData) => userManagementApi.createUser(userData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toast.success('Utente creato con successo', {
        description: `Username: ${data.utente}`,
      });
    },
    onError: (error) => {
      toast.error('Errore creazione utente', {
        description: error.message,
      });
    },
  });
};

/**
 * Update user
 */
export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation<User, ApiError, { id: number; data: UpdateUserDTO }>({
    mutationFn: ({ id, data }) => userManagementApi.updateUser(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) });
      toast.success('Utente aggiornato con successo', {
        description: `Username: ${data.utente}`,
      });
    },
    onError: (error) => {
      toast.error('Errore aggiornamento utente', {
        description: error.message,
      });
    },
  });
};

/**
 * Delete user
 */
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, number>({
    mutationFn: (userId) => userManagementApi.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toast.success('Utente eliminato con successo');
    },
    onError: (error) => {
      let description = error.message;

      // Custom error messages
      if (error.status === 403) {
        description = 'Non hai i permessi per eliminare questo utente';
      } else if (error.status === 409) {
        description = 'Non puoi eliminare te stesso o l\'utente superuser';
      }

      toast.error('Errore eliminazione utente', { description });
    },
  });
};

// ============================================================================
// Password Management
// ============================================================================

/**
 * Change user password
 */
export const useChangePassword = () => {
  return useMutation<void, ApiError, { id: number; data: ChangePasswordDTO }>({
    mutationFn: ({ id, data }) => userManagementApi.changePassword(id, data),
    onSuccess: () => {
      toast.success('Password modificata con successo');
    },
    onError: (error) => {
      let description = error.message;

      if (error.status === 401) {
        description = 'Password corrente non valida';
      } else if (error.status === 400) {
        description = 'La nuova password non soddisfa i requisiti minimi';
      }

      toast.error('Errore modifica password', { description });
    },
  });
};

// ============================================================================
// Login History
// ============================================================================

/**
 * Get login history for a specific user
 */
export const useLoginHistory = (
  userId?: number,
  filters: LoginHistoryFilters = {},
  options?: UseQueryOptions<LoginAttempt[], ApiError>
) => {
  return useQuery<LoginAttempt[], ApiError>({
    queryKey: userKeys.loginHistory(userId),
    queryFn: () =>
      userId
        ? userManagementApi.getLoginHistory(userId, filters)
        : userManagementApi.getAllLoginHistory(filters),
    enabled: true,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    staleTime: 10000, // 10 seconds
    ...options,
  });
};

// ============================================================================
// Token Management
// ============================================================================

/**
 * Calculate token status based on expiration
 */
const calculateTokenStatus = (token: TokenHistory): TokenWithStatus => {
  const now = new Date();
  const expiresAt = new Date(token.expiresAt);
  const diffMs = expiresAt.getTime() - now.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  let status: TokenStatus;
  if (token.isRevoked) {
    status = 'revoked';
  } else if (diffMs < 0) {
    status = 'expired';
  } else if (diffMinutes < 60) {
    status = 'expiring';
  } else {
    status = 'active';
  }

  return {
    ...token,
    status,
    expiresInMinutes: diffMinutes,
  };
};

/**
 * Get active tokens for a specific user or all tokens
 */
export const useActiveTokens = (
  userId?: number,
  options?: UseQueryOptions<TokenWithStatus[], ApiError>
) => {
  return useQuery<TokenWithStatus[], ApiError>({
    queryKey: userKeys.tokens(userId),
    queryFn: async () => {
      const tokens = userId
        ? await userManagementApi.getUserTokens(userId)
        : await userManagementApi.getAllTokens();

      return tokens.map(calculateTokenStatus);
    },
    enabled: true,
    refetchInterval: 60000, // Auto-refresh every 60 seconds
    staleTime: 30000, // 30 seconds
    ...options,
  });
};

/**
 * Revoke specific token
 */
export const useRevokeToken = () => {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (tokenId) => userManagementApi.revokeToken(tokenId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.tokens() });
      toast.success('Token revocato con successo');
    },
    onError: (error) => {
      toast.error('Errore revoca token', {
        description: error.message,
      });
    },
  });
};

/**
 * Revoke all tokens for a user
 */
export const useRevokeUserTokens = () => {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, number>({
    mutationFn: (userId) => userManagementApi.revokeUserTokens(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.tokens() });
      toast.success('Tutti i token utente sono stati revocati');
    },
    onError: (error) => {
      toast.error('Errore revoca token', {
        description: error.message,
      });
    },
  });
};

// ============================================================================
// User Groups
// ============================================================================

/**
 * Get all user groups
 */
export const useUserGroups = (options?: UseQueryOptions<UserGroup[], ApiError>) => {
  return useQuery<UserGroup[], ApiError>({
    queryKey: userKeys.groups(),
    queryFn: () => userManagementApi.getUserGroups(),
    staleTime: 10 * 60 * 1000, // 10 minutes (groups change rarely)
    ...options,
  });
};

/**
 * Get user group by ID
 */
export const useUserGroup = (
  groupId: number,
  options?: UseQueryOptions<UserGroup, ApiError>
) => {
  return useQuery<UserGroup, ApiError>({
    queryKey: userKeys.group(groupId),
    queryFn: () => userManagementApi.getUserGroupById(groupId),
    enabled: groupId > 0,
    staleTime: 10 * 60 * 1000,
    ...options,
  });
};
