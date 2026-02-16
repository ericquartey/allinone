// ============================================================================
// EJLOG WMS - Compartments API Service
// Endpoints per la gestione scompartimenti/cassetti
// Backend: /api/compartments su porta 3077
// ============================================================================

import { baseApi } from './baseApi';
import type {
  Compartment,
  Product,
  PaginatedResponse,
  PaginationParams,
  SearchParams,
} from '../../types/models';

/**
 * Trasforma i prodotti dal formato backend
 */
function transformProduct(raw: any): Product {
  return {
    item: {
      id: raw.itemId || 0,
      code: raw.item || raw.itemCode || '',
      description: raw.description || '',
      itemCategoryDescription: raw.category || null,
      measureUnitDescription: raw.measureUnit || 'PZ',
      managementType: raw.managementType || 0,
      quantitySignificantFigures: 2,
      isDraperyItem: false,
      isHandledByLot: !!raw.lot,
      isHandledBySerialNumber: !!raw.serialNumber,
      isHandledByExpireDate: !!raw.expiryDate,
    },
    stockedQuantity: raw.qty ?? raw.quantity ?? 0,
    inventoryThreshold: raw.threshold || 0,
    lot: raw.lot || undefined,
    serialNumber: raw.serialNumber || undefined,
    sscc: raw.sscc || undefined,
    expirationDate: raw.expiryDate || raw.expirationDate || undefined,
    compartmentId: raw.compartmentId || undefined,
    loadingUnitId: raw.loadingUnitId || undefined,
    areaId: raw.areaId || undefined,
    isBlocked: raw.isBlocked || false,
    blockReason: raw.blockReason || undefined,
  };
}

/**
 * Trasforma i dati compartment dal backend al formato frontend
 */
function transformCompartment(raw: any): Compartment {
  return {
    id: raw.id || 0,
    loadingUnitId: raw.loadingUnitId || 0,
    barcode: raw.barcode || undefined,
    width: raw.width || 0,
    depth: raw.depth || 0,
    height: raw.height || undefined,
    xPosition: raw.xPosition || 0,
    yPosition: raw.yPosition || 0,
    zPosition: raw.zPosition || 0,
    fillPercentage: raw.fillPercentage || 0,
    products: raw.products ? raw.products.map(transformProduct) : undefined,
    maxWeight: raw.maxWeight || undefined,
    currentWeight: raw.currentWeight || undefined,
  };
}

export const compartmentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ========================================================================
    // GET /api/compartments - Lista compartimenti (se disponibile)
    // ========================================================================
    getCompartments: builder.query<PaginatedResponse<Compartment>, PaginationParams & SearchParams>({
      query: (params) => ({
        url: '/api/compartments',
        params: {
          limit: params.take || params.pageSize || 50,
          offset: params.skip || 0,
          search: params.search,
        },
      }),
      transformResponse: (response: any) => {
        const items = Array.isArray(response) ? response : [];
        return {
          data: items.map(transformCompartment),
          total: items.length,
          page: 0,
          pageSize: items.length,
          totalPages: 1,
        };
      },
      providesTags: (result) => [{ type: 'Compartment', id: 'LIST' }],
    }),

    // ========================================================================
    // GET /api/compartments/{id} - Dettaglio compartimento
    // ========================================================================
    getCompartmentById: builder.query<Compartment, number>({
      query: (id) => `/api/compartments/${id}`,
      transformResponse: (response: any) => transformCompartment(response),
      providesTags: (result, error, id) => [{ type: 'Compartment', id }],
    }),

    // ========================================================================
    // GET /api/compartments/{id}/products - Prodotti in un compartimento
    // ========================================================================
    getProductsByCompartment: builder.query<Product[], number>({
      query: (id) => `/api/compartments/${id}/products`,
      transformResponse: (response: any) => {
        const products = Array.isArray(response) ? response : [];
        return products.map(transformProduct);
      },
      providesTags: (result, error, id) => [{ type: 'Product', id: `COMPARTMENT_${id}` }],
    }),
  }),
});

export const {
  useGetCompartmentsQuery,
  useGetCompartmentByIdQuery,
  useGetProductsByCompartmentQuery,
} = compartmentsApi;

