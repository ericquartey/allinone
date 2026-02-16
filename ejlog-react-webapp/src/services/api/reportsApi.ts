// ============================================================================
// EJLOG WMS - Reports API Service
// Endpoint per la gestione report personalizzati
// ============================================================================

import { baseApi } from './baseApi';
import type { ApiResponse } from '../../types/models';

export interface CustomReport {
  id: number;
  name: string;
  description?: string;
  category?: string;
  sqlQuery: string;
  filters?: ReportFilter[];
  columns?: ReportColumn[];
  groupBy?: string;
  orderBy?: string;
  createdBy?: string;
  createdDate: string;
  modifiedDate?: string;
  lastExecuted?: string;
  executionCount: number;
  shared: boolean;
  favorite: boolean;
  active: boolean;
}

export interface ReportFilter {
  field: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'datetime' | 'boolean' | 'select';
  required?: boolean;
  defaultValue?: any;
  options?: { value: any; label: string }[];
}

export interface ReportColumn {
  field: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'datetime' | 'boolean';
  width?: number;
  format?: string; // Es: 'dd/MM/yyyy', '0.00'
  align?: 'left' | 'center' | 'right';
}

export interface ReportCategory {
  category: string;
  reportCount: number;
}

export interface ReportExecutionResult {
  success: boolean;
  report: {
    id: number;
    name: string;
    category?: string;
  };
  columns?: ReportColumn[];
  data: any[];
  recordCount: number;
  executedAt: string;
}

export interface ExecuteReportParams {
  id: number;
  parameters?: Record<string, any>;
}

export interface ExecuteCustomQueryParams {
  sqlQuery: string;
  parameters?: Record<string, any>;
}

export const reportsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/reports - Lista report
    getReports: builder.query<
      CustomReport[],
      { category?: string; shared?: boolean; favorite?: boolean; createdBy?: string } | void
    >({
      query: (params = {}) => ({
        url: '/reports',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Report' as const, id })),
              { type: 'Report', id: 'LIST' },
            ]
          : [{ type: 'Report', id: 'LIST' }],
    }),

    // GET /api/reports/categories - Lista categorie
    getReportCategories: builder.query<ReportCategory[], void>({
      query: () => '/reports/categories',
      providesTags: [{ type: 'Report', id: 'CATEGORIES' }],
    }),

    // GET /api/reports/:id - Dettaglio report
    getReportById: builder.query<CustomReport, number>({
      query: (id) => `/reports/${id}`,
      providesTags: (result, error, id) => [{ type: 'Report', id }],
    }),

    // POST /api/reports - Crea report
    createReport: builder.mutation<CustomReport, Partial<CustomReport>>({
      query: (body) => ({
        url: '/reports',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Report', id: 'LIST' }, { type: 'Report', id: 'CATEGORIES' }],
    }),

    // PUT /api/reports/:id - Aggiorna report
    updateReport: builder.mutation<CustomReport, { id: number; data: Partial<CustomReport> }>({
      query: ({ id, data }) => ({
        url: `/reports/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Report', id },
        { type: 'Report', id: 'LIST' },
        { type: 'Report', id: 'CATEGORIES' },
      ],
    }),

    // DELETE /api/reports/:id - Elimina report
    deleteReport: builder.mutation<ApiResponse<void>, number>({
      query: (id) => ({
        url: `/reports/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Report', id: 'LIST' }, { type: 'Report', id: 'CATEGORIES' }],
    }),

    // POST /api/reports/:id/execute - Esegue report
    executeReport: builder.mutation<ReportExecutionResult, ExecuteReportParams>({
      query: ({ id, parameters }) => ({
        url: `/reports/${id}/execute`,
        method: 'POST',
        body: { parameters },
      }),
      // Aggiorna il report per riflettere lastExecuted e executionCount
      invalidatesTags: (result, error, { id }) => [
        { type: 'Report', id },
        { type: 'Report', id: 'LIST' },
      ],
    }),

    // POST /api/reports/execute-custom - Esegue query custom
    executeCustomQuery: builder.mutation<
      Omit<ReportExecutionResult, 'report'>,
      ExecuteCustomQueryParams
    >({
      query: (body) => ({
        url: '/reports/execute-custom',
        method: 'POST',
        body,
      }),
    }),

    // Toggle favorite
    toggleReportFavorite: builder.mutation<CustomReport, { id: number; favorite: boolean }>({
      query: ({ id, favorite }) => ({
        url: `/reports/${id}`,
        method: 'PUT',
        body: { favorite },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Report', id },
        { type: 'Report', id: 'LIST' },
      ],
    }),

    // Toggle shared
    toggleReportShared: builder.mutation<CustomReport, { id: number; shared: boolean }>({
      query: ({ id, shared }) => ({
        url: `/reports/${id}`,
        method: 'PUT',
        body: { shared },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Report', id },
        { type: 'Report', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetReportsQuery,
  useGetReportCategoriesQuery,
  useGetReportByIdQuery,
  useCreateReportMutation,
  useUpdateReportMutation,
  useDeleteReportMutation,
  useExecuteReportMutation,
  useExecuteCustomQueryMutation,
  useToggleReportFavoriteMutation,
  useToggleReportSharedMutation,
} = reportsApi;
