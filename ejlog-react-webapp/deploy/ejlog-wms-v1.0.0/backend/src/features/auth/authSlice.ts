// ============================================================================
// EJLOG WMS - Auth Slice
// Gestione stato autenticazione
// ============================================================================

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { UserClaims } from '../../types/models';

interface AuthState {
  user: UserClaims | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: UserClaims; token: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    // Ripristina stato da localStorage al caricamento app
    restoreSession: (state) => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      if (token && userStr) {
        state.token = token;
        state.user = JSON.parse(userStr);
        state.isAuthenticated = true;
      }
    },
    // Auto-login come superuser (solo per development)
    autoLoginSuperuser: (state) => {
      const superuser: UserClaims = {
        userId: 'superuser',
        username: 'superuser',
        displayName: 'Super User',
        roles: ['ADMIN', 'SUPERUSER'],
        permissions: ['*'],
      };
      const token = 'dev-token-superuser';
      state.user = superuser;
      state.token = token;
      state.isAuthenticated = true;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(superuser));
    },
  },
});

export const { setCredentials, logout, setLoading, restoreSession, autoLoginSuperuser } = authSlice.actions;
export default authSlice.reducer;
