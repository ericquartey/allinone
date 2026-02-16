// ============================================================================
// EJLOG WMS - Areas API Service
// Endpoint per la gestione aree magazzino
// ============================================================================

import { baseApi } from './baseApi';
import type { Area, Product, Item, ItemList, ApiResponse } from '../../types/models';

export const areasApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/areas/{id}/products - Prodotti in area
    getAreaProducts: builder.query<Product[], number>({
      query: (areaId) => `/areas/${areaId}/products`,
      providesTags: (result, error, areaId) => [
        { type: 'Area', id: areaId },
        { type: 'Product', id: 'LIST' },
      ],
    }),

    // GET /api/areas/products - Tutti i prodotti di tutte le aree
    getAllProducts: builder.query<Product[], void>({
      query: () => '/areas/products',
      providesTags: [{ type: 'Product', id: 'LIST' }],
    }),

    // GET /api/areas/product/barcode/{barcode} - Prodotto da barcode
    getProductByBarcode: builder.query<Product, string>({
      query: (barcode) => `/areas/product/barcode/${encodeURIComponent(barcode)}`,
      providesTags: (result) => (result ? [{ type: 'Product', id: result.item.id }] : []),
    }),

    // GET /api/areas/lot/barcode/{barcode} - Lotto da barcode
    getLotByBarcode: builder.query<{ lot: string; item: Item }, string>({
      query: (barcode) => `/areas/lot/barcode/${encodeURIComponent(barcode)}`,
    }),

    // GET /api/areas/{id}/item-lists - Liste area
    getAreaItemLists: builder.query<ItemList[], number>({
      query: (areaId) => `/areas/${areaId}/item-lists`,
      providesTags: (result, error, areaId) => [
        { type: 'Area', id: areaId },
        { type: 'ItemList', id: 'LIST' },
      ],
    }),

    // POST /api/areas/{id}/items - Crea articolo in area
    createItem: builder.mutation<ApiResponse<Item>, { areaId: number; item: Partial<Item> }>({
      query: ({ areaId, item }) => ({
        url: `/areas/${areaId}/items`,
        method: 'POST',
        body: item,
      }),
      invalidatesTags: (result, error, { areaId }) => [
        { type: 'Area', id: areaId },
        { type: 'Item', id: 'LIST' },
      ],
    }),

    // DELETE /api/areas/{id}/items/{itemId} - Elimina articolo da area
    deleteItem: builder.mutation<ApiResponse<void>, { areaId: number; itemId: number }>({
      query: ({ areaId, itemId }) => ({
        url: `/areas/${areaId}/items/${itemId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { areaId, itemId }) => [
        { type: 'Area', id: areaId },
        { type: 'Item', id: itemId },
      ],
    }),

    // GET /api/areas - Lista aree
    getAreas: builder.query<Area[], void>({
      query: () => '/areas',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Area' as const, id })),
              { type: 'Area', id: 'LIST' },
            ]
          : [{ type: 'Area', id: 'LIST' }],
    }),

    // GET /api/areas/{id} - Dettaglio area
    getAreaById: builder.query<Area, number>({
      query: (id) => `/areas/${id}`,
      providesTags: (result, error, id) => [{ type: 'Area', id }],
    }),

    // POST /api/areas - Crea area
    createArea: builder.mutation<ApiResponse<Area>, Partial<Area>>({
      query: (body) => ({
        url: '/areas',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Area', id: 'LIST' }],
    }),

    // PUT /api/areas/{id} - Aggiorna area
    updateArea: builder.mutation<ApiResponse<Area>, { id: number; data: Partial<Area> }>({
      query: ({ id, data }) => ({
        url: `/areas/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Area', id },
        { type: 'Area', id: 'LIST' },
      ],
    }),

    // DELETE /api/areas/{id} - Elimina area
    deleteArea: builder.mutation<ApiResponse<void>, number>({
      query: (id) => ({
        url: `/areas/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Area', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetAreaProductsQuery,
  useGetAllProductsQuery,
  useGetProductByBarcodeQuery,
  useLazyGetProductByBarcodeQuery,
  useGetLotByBarcodeQuery,
  useLazyGetLotByBarcodeQuery,
  useGetAreaItemListsQuery,
  useCreateItemMutation,
  useDeleteItemMutation,
  useGetAreasQuery,
  useGetAreaByIdQuery,
  useCreateAreaMutation,
  useUpdateAreaMutation,
  useDeleteAreaMutation,
} = areasApi;
