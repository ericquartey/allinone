// ============================================================================
// EJLOG WMS - Barcodes API Service
// Endpoint per la gestione regole barcode
// ============================================================================

import { baseApi } from './baseApi';
import type { BarcodeRule, ApiResponse } from '../../types/models';

export const barcodesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/barcodes/rules - Regole barcode
    getBarcodeRules: builder.query<BarcodeRule[], void>({
      query: () => '/barcodes/rules',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'BarcodeRule' as const, id })),
              { type: 'BarcodeRule', id: 'LIST' },
            ]
          : [{ type: 'BarcodeRule', id: 'LIST' }],
    }),

    // GET /api/barcodes/rules/{id} - Dettaglio regola
    getBarcodeRuleById: builder.query<BarcodeRule, number>({
      query: (id) => `/barcodes/rules/${id}`,
      providesTags: (result, error, id) => [{ type: 'BarcodeRule', id }],
    }),

    // POST /api/barcodes/rules - Crea regola
    createBarcodeRule: builder.mutation<ApiResponse<BarcodeRule>, Partial<BarcodeRule>>({
      query: (body) => ({
        url: '/barcodes/rules',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'BarcodeRule', id: 'LIST' }],
    }),

    // PUT /api/barcodes/rules/{id} - Aggiorna regola
    updateBarcodeRule: builder.mutation<
      ApiResponse<BarcodeRule>,
      { id: number; data: Partial<BarcodeRule> }
    >({
      query: ({ id, data }) => ({
        url: `/barcodes/rules/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'BarcodeRule', id },
        { type: 'BarcodeRule', id: 'LIST' },
      ],
    }),

    // DELETE /api/barcodes/rules/{id} - Elimina regola
    deleteBarcodeRule: builder.mutation<ApiResponse<void>, number>({
      query: (id) => ({
        url: `/barcodes/rules/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'BarcodeRule', id: 'LIST' }],
    }),

    // POST /api/barcodes/parse - Analizza barcode
    parseBarcode: builder.mutation<
      ApiResponse<{
        itemCode?: string;
        quantity?: number;
        lot?: string;
        serialNumber?: string;
        expirationDate?: string;
        sscc?: string;
      }>,
      { barcode: string }
    >({
      query: (body) => ({
        url: '/barcodes/parse',
        method: 'POST',
        body,
      }),
    }),

    // POST /api/barcodes/validate - Valida barcode contro regola specifica
    validateBarcode: builder.mutation<
      ApiResponse<{ valid: boolean; barcode: string; rule: any }>,
      { barcode: string; ruleId: number }
    >({
      query: (body) => ({
        url: '/barcodes/validate',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useGetBarcodeRulesQuery,
  useGetBarcodeRuleByIdQuery,
  useCreateBarcodeRuleMutation,
  useUpdateBarcodeRuleMutation,
  useDeleteBarcodeRuleMutation,
  useParseBarcodeMutation,
  useValidateBarcodeMutation,
} = barcodesApi;
