// ============================================================================
// EJLOG WMS - Base API Configuration
// Configurazione base RTK Query con autenticazione JWT
// ============================================================================

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../app/store';
import { API_BASE_URL } from '../../config/api';

// Base query con autenticazione JWT
const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    // DEVELOPMENT MODE: Bypass authentication completely
    const isDevelopment = import.meta.env.DEV;

    if (!isDevelopment) {
      // Recupera il token dallo state (solo in production)
      const token = (getState() as RootState).auth.token;

      // Se abbiamo un token, lo aggiungiamo all'header
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    } else {
      console.log('[DEV MODE] Skipping authentication headers');
    }

    // Content-Type default
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    // Accept header per evitare 406
    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json');
    }

    return headers;
  },
});

// Base query con retry e gestione errori
const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  let result = await baseQuery(args, api, extraOptions);

  // DEVELOPMENT MODE: Skip 401 handling
  const isDevelopment = import.meta.env.DEV;

  // Se riceviamo 401, l'utente non è autenticato (solo in production)
  if (!isDevelopment && result.error && result.error.status === 401) {
    // Dispatch logout action
    api.dispatch({ type: 'auth/logout' });
  }

  return result;
};

// API base con tutti i tag types per la cache invalidation
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'Item',
    'ItemList',
    'ListTemplate',
    'LoadingUnit',
    'Compartment',
    'MissionOperation',
    'Product',
    'Area',
    'Machine',
    'Location',
    'Workstation',
    'Alarm',
    'User',
    'BarcodeRule',
    'Printer',
    'StockMovement',
    'OperationReason',
    'DestinationGroup',
    'SystemParameter',
    'ItemCategory',
    'DashboardStats',
    'Dashboard',
    'Order',
    'Menu',
    // PLC Module tags
    'PLCDevice',
    'PLCCommand',
    'Signal',
    'Databuffer',
    // Admin Module tags (Fase 3)
    'Report',
    'Notification',
    'NotificationPreferences',
  ],
  endpoints: () => ({}),
});

export default baseApi;
