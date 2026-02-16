// ============================================================================
// EJLOG WMS - Auth Slice
// Gestione stato autenticazione con AUTO-LOGIN DEV MODE
// ============================================================================

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { UserClaims } from '../../types/models';

interface AuthState {
  user: UserClaims | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ============================================================================
// DEV MODE: Calcolo password superuser dinamica
// Formula: promag[DD]fergrp_2012 dove DD = 31 - giorno del mese
// ============================================================================
function getSuperuserPassword(): string {
  const now = new Date();
  const day = now.getDate();
  const dd = (31 - day).toString().padStart(2, '0');
  return \`promag\${dd}fergrp_2012\`;
}

// ============================================================================
// DEV MODE: Auto-login come superuser
// ============================================================================
const isDevelopment = import.meta.env.DEV;

const devSuperuser: UserClaims = {
  username: 'superuser',
  accessLevel: 'ADMIN',
  roles: ['ADMIN', 'SUPERVISOR', 'OPERATOR'],
  fullName: 'Super User (DEV AUTO-LOGIN)',
  email: 'superuser@ejlog.local',
};

// Auto-login in development mode
if (isDevelopment) {
  const superuserPassword = getSuperuserPassword();
  const today = new Date().toISOString().split('T')[0];

  console.log('\n' + '='.repeat(70));
  console.log('🔐 EJLOG WMS - AUTO-LOGIN DEVELOPMENT MODE');
  console.log('='.repeat(70));
  console.log(\`📅 Data: \${today}\`);
  console.log(\`👤 Username: superuser\`);
  console.log(\`🔑 Password oggi: \${superuserPassword}\`);
  console.log(\`✅ Access Level: ADMIN\`);
  console.log(\`📋 Roles: \${devSuperuser.roles.join(', ')}\`);
  console.log('='.repeat(70) + '\n');

  localStorage.setItem('token', 'dev_mock_token_superuser');
  localStorage.setItem('user', JSON.stringify(devSuperuser));
}

const initialState: AuthState = {
  user: isDevelopment ? devSuperuser : null,
  token: localStorage.getItem('token'),
  isAuthenticated: isDevelopment ? true : !!localStorage.getItem('token'),
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
      // In DEV mode, forza sempre superuser
      if (isDevelopment) {
        state.user = devSuperuser;
        state.token = 'dev_mock_token_superuser';
        state.isAuthenticated = true;
        return;
      }

      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      if (token && userStr) {
        state.token = token;
        state.user = JSON.parse(userStr);
        state.isAuthenticated = true;
      }
    },
  },
});

export const { setCredentials, logout, setLoading, restoreSession } = authSlice.actions;
export default authSlice.reducer;
