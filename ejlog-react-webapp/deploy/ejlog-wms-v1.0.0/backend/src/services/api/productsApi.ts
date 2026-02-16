// ============================================================================
// EJLOG WMS - Products API Service
// Endpoint per la gestione prodotti (giacenze dettagliate)
// ============================================================================

import { baseApi } from './baseApi';
import type { Product, PaginatedResponse, PaginationParams, SearchParams } from '../../types/models';

export const productsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /EjLogHostVertimag/Stock - Lista prodotti con paginazione (BACKEND REALE porta 3077)
    getProducts: builder.query<PaginatedResponse<Product>, PaginationParams & SearchParams>({
      query: (params) => ({
        url: '/EjLogHostVertimag/Stock',
        params: {
          limit: params.limit || 50,
          skip: params.skip || 0,
          ...params,
        },
      }),
      transformResponse: (response: any) => {
        // Il backend restituisce: { data: [...], exportedItems: [...], stock: [...] }
        // Usiamo l'array 'data' che contiene i prodotti completi
        const sourceData = response.data || response.stock || response.exportedItems || [];

        const transformedData = sourceData.map((rawProduct: any) => ({
          // Trasforma in formato frontend
          item: {
            id: rawProduct.itemId,
            code: rawProduct.itemCode || rawProduct.item || '',
            description: rawProduct.itemDescription || rawProduct.description || '',
            measureUnitDescription: 'PZ',
            managementType: 0,
            quantitySignificantFigures: 2,
            isDraperyItem: false,
            isHandledByLot: false,
            isHandledBySerialNumber: false,
            isHandledByExpireDate: false,
          },
          stockedQuantity: rawProduct.quantity || rawProduct.qty || 0,
          inventoryThreshold: 0,
          lot: rawProduct.lot || null,
          serialNumber: rawProduct.serialNumber || null,
          expirationDate: rawProduct.expiryDate || null,
          compartmentId: rawProduct.compartmentId,
          loadingUnitId: rawProduct.loadingUnitId || rawProduct.LU,
          areaId: rawProduct.warehouseId,
          isBlocked: false,
        }));

        return {
          data: transformedData,
          total: response.totalCount || response.recordNumber || transformedData.length,
          page: response.page || 0,
          pageSize: response.pageSize || response.limit || 50,
          totalPages: response.totalPages || 1,
        };
      },
      providesTags: (result) => [{ type: 'Product', id: 'LIST' }],
    }),

    // GET /EjLogHostVertimag/Stock - Conta prodotti
    getProductsCount: builder.query<{ count: number }, SearchParams>({
      query: (params) => ({
        url: '/EjLogHostVertimag/Stock',
        params: {
          limit: 1,
          skip: 0,
        },
      }),
      transformResponse: (response: any) => {
        return { count: response.recordNumber || 0 };
      },
    }),

    // GET /api/products/{id} - Dettaglio prodotto
    getProductById: builder.query<Product, number>({
      query: (id) => `/products/${id}`,
      providesTags: (result, error, id) => [{ type: 'Product', id }],
    }),

    // GET /api/products/item/{itemId} - Prodotti per articolo
    getProductsByItem: builder.query<Product[], number>({
      query: (itemId) => `/products/item/${itemId}`,
      providesTags: [{ type: 'Product', id: 'LIST' }],
    }),

    // GET /api/products/compartment/{compartmentId} - Prodotti per compartimento
    getProductsByCompartment: builder.query<Product[], number>({
      query: (compartmentId) => `/products/compartment/${compartmentId}`,
      providesTags: [{ type: 'Product', id: 'LIST' }],
    }),

    // GET /api/products/loading-unit/{loadingUnitId} - Prodotti per UDC
    getProductsByLoadingUnit: builder.query<Product[], number>({
      query: (loadingUnitId) => `/products/loading-unit/${loadingUnitId}`,
      providesTags: [{ type: 'Product', id: 'LIST' }],
    }),

    // GET /api/products/area/{areaId} - Prodotti per area
    getProductsByArea: builder.query<Product[], number>({
      query: (areaId) => `/products/area/${areaId}`,
      providesTags: [{ type: 'Product', id: 'LIST' }],
    }),

    // GET /api/products/search - Ricerca prodotti per codice, descrizione, barcode
    searchProducts: builder.query<Product[], { code?: string; description?: string; limit?: number }>({
      query: (params) => ({
        url: '/products/search',
        params,
      }),
      providesTags: [{ type: 'Product', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductsCountQuery,
  useGetProductByIdQuery,
  useGetProductsByItemQuery,
  useGetProductsByCompartmentQuery,
  useGetProductsByLoadingUnitQuery,
  useGetProductsByAreaQuery,
  useSearchProductsQuery,
  useLazySearchProductsQuery,
} = productsApi;

