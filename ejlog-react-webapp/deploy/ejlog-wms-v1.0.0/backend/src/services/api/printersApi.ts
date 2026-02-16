// ============================================================================
// EJLOG WMS - Printers API Service
// Endpoint per la gestione stampanti
// ============================================================================

import { baseApi } from './baseApi';
import type { PrinterInfo, PrintJob, ApiResponse } from '../../types/models';

export const printersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/printers - Lista stampanti
    getPrinters: builder.query<PrinterInfo[], void>({
      query: () => '/printers',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Printer' as const, id })),
              { type: 'Printer', id: 'LIST' },
            ]
          : [{ type: 'Printer', id: 'LIST' }],
    }),

    // GET /api/printers/{id} - Dettaglio stampante
    getPrinterById: builder.query<PrinterInfo, number>({
      query: (id) => `/printers/${id}`,
      providesTags: (result, error, id) => [{ type: 'Printer', id }],
    }),

    // POST /api/printers - Crea stampante
    createPrinter: builder.mutation<ApiResponse<PrinterInfo>, Partial<PrinterInfo>>({
      query: (body) => ({
        url: '/printers',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Printer', id: 'LIST' }],
    }),

    // PUT /api/printers/{id} - Aggiorna stampante
    updatePrinter: builder.mutation<
      ApiResponse<PrinterInfo>,
      { id: number; data: Partial<PrinterInfo> }
    >({
      query: ({ id, data }) => ({
        url: `/printers/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Printer', id },
        { type: 'Printer', id: 'LIST' },
      ],
    }),

    // DELETE /api/printers/{id} - Elimina stampante
    deletePrinter: builder.mutation<ApiResponse<void>, number>({
      query: (id) => ({
        url: `/printers/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Printer', id: 'LIST' }],
    }),

    // POST /api/printers/{id}/test - Test stampante
    testPrinter: builder.mutation<ApiResponse<void>, number>({
      query: (id) => ({
        url: `/printers/${id}/test`,
        method: 'POST',
      }),
    }),

    // GET /api/printers/jobs - Lista lavori stampa
    getPrintJobs: builder.query<PrintJob[], { status?: string }>({
      query: (params) => ({
        url: '/printers/jobs',
        params,
      }),
    }),
  }),
});

export const {
  useGetPrintersQuery,
  useGetPrinterByIdQuery,
  useCreatePrinterMutation,
  useUpdatePrinterMutation,
  useDeletePrinterMutation,
  useTestPrinterMutation,
  useGetPrintJobsQuery,
} = printersApi;
