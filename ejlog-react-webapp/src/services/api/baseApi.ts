// ============================================================================
// EJLOG WMS - Base API Configuration
// Configurazione base RTK Query con autenticazione JWT
// ============================================================================

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../app/store';
import { API_BASE_URL } from '../../config/api';
import {
  getAdapterBaseUrlCandidates,
  isAdapterEnabled,
  isAdapterRequest,
  replaceAdapterBase,
  setAdapterLastHealthyBase,
} from '../../utils/adapterConfig';

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

  const getRequestUrl = (input: any): string | null => {
    if (!input) return null;
    if (typeof input === 'string') return input;
    if (typeof input.url === 'string') return input.url;
    return null;
  };

  const getRequestMethod = (input: any): string => {
    if (!input || typeof input === 'string') return 'GET';
    if (typeof input.method === 'string') return input.method.toUpperCase();
    return 'GET';
  };

  const withRequestUrl = (input: any, url: string) => {
    if (typeof input === 'string') return url;
    return { ...input, url };
  };

  const maybeHandleAdapterFallback = async () => {
    if (!isAdapterEnabled()) return result;
    const url = getRequestUrl(args);
    if (!url || !isAdapterRequest(url)) return result;

    const { primary, fallback } = getAdapterBaseUrlCandidates();
    const method = getRequestMethod(args);
    if (method !== 'GET' && method !== 'HEAD') {
      return result;
    }
    if (!result.error) {
      if (primary && url.startsWith(primary)) {
        setAdapterLastHealthyBase(primary);
      } else if (fallback && url.startsWith(fallback)) {
        setAdapterLastHealthyBase(fallback);
      }
    }

    if (!result.error || !primary || !fallback || primary === fallback) {
      return result;
    }

    const fromBase = url.startsWith(primary)
      ? primary
      : url.startsWith(fallback)
      ? fallback
      : null;
    if (!fromBase) return result;
    const toBase = fromBase === primary ? fallback : primary;
    const retryArgs = withRequestUrl(args, replaceAdapterBase(url, fromBase, toBase));
    const retryResult = await baseQuery(retryArgs, api, extraOptions);
    if (!retryResult.error) {
      setAdapterLastHealthyBase(toBase);
      return retryResult;
    }
    return result;
  };

  result = await maybeHandleAdapterFallback();

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
    'Mission',
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
