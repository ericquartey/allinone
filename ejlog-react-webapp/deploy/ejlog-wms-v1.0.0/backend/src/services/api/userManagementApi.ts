/**
 * User Management API Service
 * Handles all HTTP requests for the User Management module
 * Uses Axios for HTTP client (separate from RTK Query)
 * Base URL: http://localhost:3077
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
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
} from '@/types/user.types';

// ============================================================================
// Axios Instance Configuration
// ============================================================================

const API_BASE_URL = 'http://localhost:3077';
const API_TIMEOUT = 10000; // 10 seconds

const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: API_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor - Add JWT token
  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('jwt_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor - Handle errors globally
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        // Unauthorized - check if on public route before redirecting
        const currentPath = window.location.pathname;
        const publicRoutes = ['/dashboard-advanced', '/login', '/login/badge', '/test',
                             '/lists-management', '/lists-management-simple', '/items-list',
                             '/drawer-management', '/products/search'];
        const isPublicRoute = publicRoutes.some(route => currentPath.startsWith(route));

        if (!isPublicRoute) {
          // Only redirect to login if not on a public route
          localStorage.removeItem('jwt_token');
          window.location.href = '/login';
        } else {
          console.log(`[UserManagementAPI] 401 on public route ${currentPath} - skipping redirect to login`);
        }
      }
      return Promise.reject(error);
    }
  );

  return client;
};

const apiClient = createApiClient();

// ============================================================================
// Error Handler
// ============================================================================

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

const handleApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; error?: string }>;
    return {
      message:
        axiosError.response?.data?.message ||
        axiosError.response?.data?.error ||
        axiosError.message ||
        'Errore di connessione al server',
      status: axiosError.response?.status,
      code: axiosError.code,
    };
  }
  return {
    message: 'Errore sconosciuto',
  };
};

// ============================================================================
// User CRUD Operations
// ============================================================================

export const userManagementApi = {
  /**
   * Search users with filters and pagination
   * GET /api/users/search?username=&groupId=&limit=20&offset=0
   */
  searchUsers: async (params: UserSearchParams = {}): Promise<UserSearchResponse> => {
    try {
      const response = await apiClient.get<UserSearchResponse>('/api/users/search', {
        params: {
          username: params.username || undefined,
          groupId: params.groupId || undefined,
          limit: params.limit || 20,
          offset: params.offset || 0,
        },
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get user by ID
   * GET /api/users/:id
   */
  getUserById: async (id: number): Promise<User> => {
    try {
      const response = await apiClient.get<User>(`/api/users/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Create new user (Admin only)
   * POST /api/users
   */
  createUser: async (userData: CreateUserDTO): Promise<User> => {
    try {
      const response = await apiClient.post<User>('/api/users', userData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Update user (Admin or self)
   * PUT /api/users/:id
   */
  updateUser: async (id: number, userData: UpdateUserDTO): Promise<User> => {
    try {
      const response = await apiClient.put<User>(`/api/users/${id}`, userData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Delete user (Admin only, with restrictions)
   * DELETE /api/users/:id
   */
  deleteUser: async (id: number): Promise<void> => {
    try {
      await apiClient.delete(`/api/users/${id}`);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // ==========================================================================
  // Password Management
  // ==========================================================================

  /**
   * Change user password
   * PUT /api/users/:id/password
   * @param id - User ID
   * @param passwordData - oldPassword required if changing own password
   */
  changePassword: async (id: number, passwordData: ChangePasswordDTO): Promise<void> => {
    try {
      await apiClient.put(`/api/users/${id}/password`, passwordData);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // ==========================================================================
  // Login History
  // ==========================================================================

  /**
   * Get login history for a user
   * GET /api/users/:id/login-history?limit=50&offset=0&dateFrom=&dateTo=
   */
  getLoginHistory: async (
    userId: number,
    filters: LoginHistoryFilters = {}
  ): Promise<LoginAttempt[]> => {
    try {
      const response = await apiClient.get<LoginAttempt[]>(
        `/api/users/${userId}/login-history`,
        {
          params: {
            limit: filters.limit || 50,
            offset: filters.offset || 0,
            dateFrom: filters.dateFrom || undefined,
            dateTo: filters.dateTo || undefined,
            success: filters.successOnly ? true : filters.failedOnly ? false : undefined,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get all login attempts (Admin only)
   * GET /api/login-attempts
   */
  getAllLoginHistory: async (filters: LoginHistoryFilters = {}): Promise<LoginAttempt[]> => {
    try {
      const response = await apiClient.get<LoginAttempt[]>('/api/login-attempts', {
        params: {
          username: filters.username || undefined,
          limit: filters.limit || 50,
          offset: filters.offset || 0,
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined,
        },
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // ==========================================================================
  // Token Management
  // ==========================================================================

  /**
   * Get active tokens for a user
   * GET /api/users/:id/tokens
   */
  getUserTokens: async (userId: number): Promise<TokenHistory[]> => {
    try {
      const response = await apiClient.get<TokenHistory[]>(`/api/users/${userId}/tokens`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get all active tokens (Admin only)
   * GET /api/tokens
   */
  getAllTokens: async (): Promise<TokenHistory[]> => {
    try {
      const response = await apiClient.get<TokenHistory[]>('/api/tokens');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Revoke specific token
   * POST /api/tokens/:tokenId/revoke
   */
  revokeToken: async (tokenId: string): Promise<void> => {
    try {
      await apiClient.post(`/api/tokens/${tokenId}/revoke`);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Revoke all tokens for a user
   * POST /api/users/:id/revoke-tokens
   */
  revokeUserTokens: async (userId: number): Promise<void> => {
    try {
      await apiClient.post(`/api/users/${userId}/revoke-tokens`);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // ==========================================================================
  // User Groups
  // ==========================================================================

  /**
   * Get all user groups
   * GET /api/user-groups
   */
  getUserGroups: async (): Promise<UserGroup[]> => {
    try {
      const response = await apiClient.get<UserGroup[]>('/api/user-groups');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get user group by ID
   * GET /api/user-groups/:id
   */
  getUserGroupById: async (id: number): Promise<UserGroup> => {
    try {
      const response = await apiClient.get<UserGroup>(`/api/user-groups/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate password strength
 */
export const calculatePasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
  if (password.length < 6) return 'weak';

  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^a-zA-Z\d]/.test(password)) strength++;

  if (strength <= 1) return 'weak';
  if (strength <= 2) return 'medium';
  return 'strong';
};

/**
 * Validate username format
 */
export const validateUsername = (username: string): { valid: boolean; error?: string } => {
  if (!username || username.trim().length === 0) {
    return { valid: false, error: 'Username obbligatorio' };
  }
  if (username.length < 3) {
    return { valid: false, error: 'Username minimo 3 caratteri' };
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { valid: false, error: 'Username può contenere solo lettere, numeri, _ e -' };
  }
  return { valid: true };
};

export default userManagementApi;

