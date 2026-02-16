// ============================================================================
// EJLOG WMS - Auto-Login Middleware
// Redux middleware che esegue auto-login come superuser in development
// ============================================================================

import { Middleware } from '@reduxjs/toolkit';
import { setCredentials } from '../features/auth/authSlice';
import axios from 'axios';

let hasAutoLoggedIn = false;

/**
 * Genera la password del giorno per l'utente superuser
 * Formato: promag + (31 - giorno del mese)
 * Es: 28 nov → promag + (31-28) = promag03
 */
const getDailyPassword = (): string => {
  const today = new Date();
  const day = today.getDate();
  const passwordNumber = (31 - day).toString().padStart(2, '0');
  return `promag${passwordNumber}`;
};

export const autoLoginMiddleware: Middleware = (store) => (next) => (action) => {
  // Execute auto-login ONCE when the first action is dispatched
  if (!hasAutoLoggedIn && typeof window !== 'undefined') {
    hasAutoLoggedIn = true;

    const existingToken = localStorage.getItem('token') ||
                          localStorage.getItem('auth_token') ||
                          localStorage.getItem('ejlog_auth_token');

    if (!existingToken) {
      console.log('[AUTO-LOGIN] No existing session, performing auto-login as superuser');

      // Esegui auto-login in modo asincrono (non bloccante)
      (async () => {
        try {
          // Genera password del giorno
          const password = getDailyPassword();
          console.log(`[AUTO-LOGIN] Attempting login with superuser / ${password}`);

          // Chiama API di login reale (nuovo endpoint)
          const response = await axios.post('/api/auth/login', {
            username: 'superuser',
            password: password
          });

          if (response.data && response.data.token) {
            console.log('[AUTO-LOGIN] Login successful, setting credentials');

            // Salva le credenziali nello store Redux
            store.dispatch(setCredentials({
              user: {
                userId: 'superuser',
                username: response.data.username || 'superuser',
                displayName: 'Super User',
                roles: ['ADMIN', 'SUPERUSER'],
                permissions: ['*'],
              },
              token: response.data.token
            }));

            console.log('[AUTO-LOGIN] Auto-login completed successfully');
          } else {
            console.error('[AUTO-LOGIN] Invalid response from login API');
          }
        } catch (error: any) {
          console.error('[AUTO-LOGIN] Failed to auto-login:', error.message);
          console.error('[AUTO-LOGIN] Error details:', error.response?.data || error);
          // Non interrompiamo l'app se l'auto-login fallisce
        }
      })();
    } else {
      console.log('[AUTO-LOGIN] Existing session found, skipping auto-login');
    }
  }

  return next(action);
};
