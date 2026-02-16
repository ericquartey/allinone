import apiClient from './client';
import { API_ENDPOINTS } from './endpoints';
import { User, LoginRequest, LoginResponse } from '@/types/auth';

/**
 * Authentication Response from Backend
 */
interface AuthResponse {
  token: string;
  username: string;
  tokenId: string;
  expiresIn: number;
  accessLevel: string;
}

/**
 * Login Result
 */
interface LoginResult {
  token: string;
  user: Partial<User>;
}

/**
 * Authentication Service
 * Handles user authentication, token management, and user operations
 */
export const authService = {
  /**
   * Login user with username and password
   * @param username - User username
   * @param password - User password
   * @returns Promise<LoginResult> - Token and user data
   * @throws Error if login fails
   */
  login: async (username: string, password: string): Promise<LoginResult> => {
    try {
      // IMPORTANT: Use /api/User/Login endpoint (matching mock-auth and backend)
      // Frontend calls: /api/User/Login → Vite proxy → Backend Node.js on port 3077
      const response = await apiClient.post<any>(
        '/api/User/Login',
        new URLSearchParams({ username, password }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      // Response format from mock-auth middleware:
      // {
      //   "token": "mock_...",
      //   "tokenId": "uuid",
      //   "username": "superuser",
      //   "accessLevel": "ADMIN",
      //   "roles": ["ADMIN", "SUPERVISOR", "OPERATOR"],
      //   "fullName": "Super User",
      //   "email": "superuser@ejlog.local",
      //   "expiresIn": 3600
      // }
      const authData = response.data;

      if (authData && authData.token) {
        // Save JWT token to localStorage
        localStorage.setItem('ejlog_auth_token', authData.token);

        // Build user object from response
        const userData = {
          id: authData.username, // Use username as ID for now
          username: authData.username,
          accessLevel: authData.accessLevel || 'OPERATOR',
          roles: authData.roles || ['OPERATOR'],
          permissions: authData.accessLevel === 'ADMIN' ? ['*'] : [],
          active: true,
          fullName: authData.fullName,
          email: authData.email,
        };

        localStorage.setItem('ejlog_user', JSON.stringify(userData));

        return {
          token: authData.token,
          user: userData
        };
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error: any) {
      console.error('Login error:', error);

      // Handle specific error cases
      if (error.response?.status === 401) {
        throw new Error('Username o password non validi');
      } else if (error.response?.status === 403) {
        throw new Error('Credenziali non valide. Verifica username e password.');
      } else if (!error.response) {
        throw new Error('Impossibile connettersi al server');
      } else {
        throw new Error(error.response?.data?.message || 'Errore durante il login');
      }
    }
  },

  /**
   * Logout user and clear authentication data
   * @returns Promise<void>
   */
  logout: async (): Promise<void> => {
    try {
      // Call logout endpoint if available
      // Note: EjLog API might not have a logout endpoint - check swagger
      // await apiClient.post(API_ENDPOINTS.USER_LOGOUT);
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with local logout even if API fails
    } finally {
      // Always clear local storage
      localStorage.removeItem('ejlog_auth_token');
      localStorage.removeItem('ejlog_user');
      localStorage.removeItem('ejlog-auth-storage');
    }
  },

  /**
   * Get current user information
   * @returns Promise<User> - Current user data
   * @throws Error if request fails
   */
  getCurrentUser: async (): Promise<User> => {
    try {
      const response = await apiClient.get<User>(API_ENDPOINTS.USER);
      return response.data;
    } catch (error) {
      console.error('Get user error:', error);
      throw error;
    }
  },

  /**
   * Validate current JWT token
   * @returns Promise<boolean> - True if token is valid
   */
  validateToken: async (): Promise<boolean> => {
    try {
      // Try to get current user info to validate token
      await apiClient.get(API_ENDPOINTS.USER);
      return true;
    } catch (error) {
      return false;
    }
  },

  /**
   * Get all users (admin function)
   * @param username - Optional username filter
   * @returns Promise<User[]> - Array of users
   * @throws Error if request fails
   */
  getUsers: async (username?: string): Promise<User[]> => {
    try {
      const params = username ? { username } : {};
      const response = await apiClient.get<User[]>(API_ENDPOINTS.USER, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Create or update users (admin function)
   * @param users - Array of users to save
   * @returns Promise<User[]> - Saved users
   * @throws Error if request fails
   */
  saveUsers: async (users: User[]): Promise<User[]> => {
    try {
      const response = await apiClient.post<User[]>(API_ENDPOINTS.USER, users);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default authService;

