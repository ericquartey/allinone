import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { User, AuthState } from '@/types/auth';

/**
 * Auth Store State Interface
 * Extends base AuthState with action methods
 */
interface AuthStoreState extends AuthState {
  // Actions
  login: (userData: User, token: string) => void;
  logout: () => void;
  updateUser: (userData: User) => void;

  // Getters
  getToken: () => string | null;
  getUser: () => User | null;
  isLoggedIn: () => boolean;
}

/**
 * Zustand Auth Store with persistence and devtools
 * Handles authentication state across the application
 */
export const useAuthStore = create<AuthStoreState>()(
  devtools(
    persist(
      (set, get) => ({
        // State
        user: null,
        token: null,
        isAuthenticated: false,

        // Actions
        login: (userData: User, token: string) => {
          set(
            {
              user: userData,
              token: token,
              isAuthenticated: true,
            },
            false,
            'auth/login'
          );

          // Also save to localStorage as backup
          localStorage.setItem('ejlog_auth_token', token);
          localStorage.setItem('ejlog_user', JSON.stringify(userData));
        },

        logout: () => {
          set(
            {
              user: null,
              token: null,
              isAuthenticated: false,
            },
            false,
            'auth/logout'
          );

          // Clear all auth data
          localStorage.removeItem('ejlog_auth_token');
          localStorage.removeItem('ejlog_user');
          localStorage.removeItem('ejlog-auth-storage');
        },

        updateUser: (userData: User) => {
          set({ user: userData }, false, 'auth/updateUser');
          localStorage.setItem('ejlog_user', JSON.stringify(userData));
        },

        // Getters
        getToken: (): string | null => get().token,
        getUser: (): User | null => get().user,
        isLoggedIn: (): boolean => get().isAuthenticated,
      }),
      {
        name: 'ejlog-auth-storage',
        partialize: (state) => ({
          user: state.user,
          token: state.token,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    {
      name: 'AuthStore',
      enabled: import.meta.env.DEV, // Only enable devtools in development
    }
  )
);

// Legacy export for backwards compatibility
export default useAuthStore;
