// ============================================================================
// EJLOG WMS - Version API Service
// Endpoint per informazioni versione sistema
// ============================================================================

import { baseApi } from './baseApi';

export const versionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/version - Versione sistema
    getVersion: builder.query<
      {
        version: string;
        buildDate: string;
        environment: string;
      },
      void
    >({
      query: () => '/version',
    }),
  }),
});

export const { useGetVersionQuery } = versionApi;
