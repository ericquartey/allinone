// ============================================================================
// EJLOG WMS - Images API Service
// Endpoint per la gestione immagini articoli
// ============================================================================

import { baseApi } from './baseApi';
import type { ApiResponse } from '../../types/models';

export const imagesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/images/item/{itemId} - Immagine articolo
    getItemImage: builder.query<Blob, number>({
      query: (itemId) => ({
        url: `/images/item/${itemId}`,
        responseHandler: (response) => response.blob(),
      }),
    }),

    // POST /api/images/item/{itemId} - Upload immagine articolo
    uploadItemImage: builder.mutation<ApiResponse<{ url: string }>, { itemId: number; file: File }>({
      query: ({ itemId, file }) => {
        const formData = new FormData();
        formData.append('file', file);
        return {
          url: `/images/item/${itemId}`,
          method: 'POST',
          body: formData,
          formData: true,
        };
      },
      invalidatesTags: (result, error, { itemId }) => [{ type: 'Item', id: itemId }],
    }),

    // DELETE /api/images/item/{itemId} - Elimina immagine articolo
    deleteItemImage: builder.mutation<ApiResponse<void>, number>({
      query: (itemId) => ({
        url: `/images/item/${itemId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, itemId) => [{ type: 'Item', id: itemId }],
    }),
  }),
});

export const {
  useGetItemImageQuery,
  useUploadItemImageMutation,
  useDeleteItemImageMutation,
} = imagesApi;
