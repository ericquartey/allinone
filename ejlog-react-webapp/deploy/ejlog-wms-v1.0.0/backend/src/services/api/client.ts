import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import { User } from '@/types/auth';

// Base configuration
// Use relative URL in development to leverage Vite proxy (CORS bypass)
// Backend runs on port 3077 (EjLog REST Server)
const API_BASE_URL = import.meta.env.DEV ? '' : window.location.origin;

const TOKEN_KEY = 'ejlog_auth_token';
const USER_KEY = 'ejlog_user';

// Create typed axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Custom API Error interface
interface ApiError {
  status: number;
  message: string;
  data: any;
}

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      if (status === 401) {
        // Unauthorized - check if on public route before redirecting
        const currentPath = window.location.pathname;
        const isPublicRoute = currentPath === '/dashboard-advanced' ||
                              currentPath.startsWith('/login');

        if (!isPublicRoute) {
          // Only redirect to login if not on a public route
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          window.location.href = '/login';
        } else {
          console.log('[API] 401 on public route - skipping redirect to login');
        }
      } else if (status === 403) {
        // Forbidden
        console.error('Access forbidden:', data);
      } else if (status === 404) {
        // Not found
        console.error('Resource not found:', data);
      } else if (status >= 500) {
        // Server error
        console.error('Server error:', data);
      }

      return Promise.reject<ApiError>({
        status,
        message: (data as any)?.message || error.message,
        data: data
      });
    } else if (error.request) {
      // Request made but no response
      console.error('No response from server:', error.request);
      return Promise.reject<ApiError>({
        status: 0,
        message: 'Impossibile contattare il server. Verifica la connessione.',
        data: null
      });
    } else {
      // Error in request configuration
      console.error('Request error:', error.message);
      return Promise.reject<ApiError>({
        status: -1,
        message: error.message,
        data: null
      });
    }
  }
);

// Auth helpers with TypeScript types
export const authHelpers = {
  saveToken: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
  },

  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },

  removeToken: (): void => {
    localStorage.removeItem(TOKEN_KEY);
  },

  saveUser: (user: User): void => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  getUser: (): User | null => {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  removeUser: (): void => {
    localStorage.removeItem(USER_KEY);
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(TOKEN_KEY);
  },

  logout: (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.href = '/login';
  }
};

// Export both default and named export for compatibility
export { apiClient };
export default apiClient;

