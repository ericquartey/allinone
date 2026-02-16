// ============================================================================
// EJLOG WMS - Orders API Service
// Gestione ordini (se usati nel contesto WMS)
// ============================================================================

import { baseApi } from './baseApi';
import type {
  PaginatedResponse,
  PaginationParams,
  SortParams,
  SearchParams,
} from '../../types/models';

export interface Order {
  id: number;
  orderNumber: string;
  orderType: 'INBOUND' | 'OUTBOUND' | 'TRANSFER';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
  customerId?: number;
  customerName?: string;
  supplierId?: number;
  supplierName?: string;
  priority: number;
  expectedDate?: string;
  completedDate?: string;
  notes?: string;
  totalLines: number;
  completedLines: number;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface OrderLine {
  id: number;
  orderId: number;
  lineNumber: number;
  itemId: number;
  itemCode: string;
  itemDescription?: string;
  quantityOrdered: number;
  quantityReceived: number;
  quantityShipped: number;
  lot?: string;
  serialNumber?: string;
  expirationDate?: string;
  status: 'PENDING' | 'PARTIAL' | 'COMPLETED';
}

export interface OrderFilters extends PaginationParams, SortParams, SearchParams {
  orderType?: 'INBOUND' | 'OUTBOUND' | 'TRANSFER';
  status?: string;
  customerId?: number;
  supplierId?: number;
  fromDate?: string;
  toDate?: string;
}

export const ordersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/orders - Lista ordini
    getOrders: builder.query<PaginatedResponse<Order>, OrderFilters>({
      query: (filters) => ({
        url: '/orders',
        params: filters,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Order' as const, id })),
              { type: 'Order', id: 'LIST' },
            ]
          : [{ type: 'Order', id: 'LIST' }],
    }),

    // GET /api/orders/{id} - Dettaglio ordine
    getOrderById: builder.query<Order, number>({
      query: (id) => `/orders/${id}`,
      providesTags: (result, error, id) => [{ type: 'Order', id }],
    }),

    // GET /api/orders/number/{orderNumber} - Ordine per numero
    getOrderByNumber: builder.query<Order, string>({
      query: (orderNumber) => `/orders/number/${encodeURIComponent(orderNumber)}`,
      providesTags: (result) => (result ? [{ type: 'Order', id: result.id }] : []),
    }),

    // GET /api/orders/{id}/lines - Righe ordine
    getOrderLines: builder.query<OrderLine[], number>({
      query: (id) => `/orders/${id}/lines`,
      providesTags: (result, error, id) => [{ type: 'Order', id }],
    }),

    // POST /api/orders - Crea ordine
    createOrder: builder.mutation<Order, Partial<Order>>({
      query: (order) => ({
        url: '/orders',
        method: 'POST',
        body: order,
      }),
      invalidatesTags: [{ type: 'Order', id: 'LIST' }],
    }),

    // PUT /api/orders/{id} - Aggiorna ordine
    updateOrder: builder.mutation<Order, { id: number } & Partial<Order>>({
      query: ({ id, ...order }) => ({
        url: `/orders/${id}`,
        method: 'PUT',
        body: order,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Order', id },
        { type: 'Order', id: 'LIST' },
      ],
    }),

    // DELETE /api/orders/{id} - Elimina ordine
    deleteOrder: builder.mutation<void, number>({
      query: (id) => ({
        url: `/orders/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Order', id: 'LIST' }],
    }),

    // POST /api/orders/{id}/complete - Completa ordine
    completeOrder: builder.mutation<void, number>({
      query: (id) => ({
        url: `/orders/${id}/complete`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Order', id },
        { type: 'Order', id: 'LIST' },
      ],
    }),

    // POST /api/orders/{id}/cancel - Annulla ordine
    cancelOrder: builder.mutation<void, { id: number; reason?: string }>({
      query: ({ id, reason }) => ({
        url: `/orders/${id}/cancel`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Order', id },
        { type: 'Order', id: 'LIST' },
      ],
    }),
  }),
});

// Aggiungi il type 'Order' ai tagTypes del baseApi
declare module './baseApi' {
  interface TagTypes {
    Order: 'Order';
  }
}

export const {
  useGetOrdersQuery,
  useLazyGetOrdersQuery,
  useGetOrderByIdQuery,
  useGetOrderByNumberQuery,
  useLazyGetOrderByNumberQuery,
  useGetOrderLinesQuery,
  useCreateOrderMutation,
  useUpdateOrderMutation,
  useDeleteOrderMutation,
  useCompleteOrderMutation,
  useCancelOrderMutation,
} = ordersApi;
