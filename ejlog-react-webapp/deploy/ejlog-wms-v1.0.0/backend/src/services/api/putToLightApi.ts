// ============================================================================
// EJLOG WMS - Put-To-Light API Service
// Endpoint per la gestione sistema Put-To-Light
// ============================================================================

import { baseApi } from './baseApi';
import type { ApiResponse } from '../../types/models';

export const putToLightApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // POST /api/put-to-light/associate-basket - Associa cestello a scaffale
    associateBasketToShelf: builder.mutation<
      ApiResponse<any>,
      { basketCode: string; shelfCode: string; itemListId?: number }
    >({
      query: (body) => ({
        url: '/put-to-light/associate-basket',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'ItemList', id: 'LIST' }],
    }),

    // POST /api/put-to-light/complete-basket - Completa cestello
    completeBasket: builder.mutation<ApiResponse<any>, { basketCode: string }>({
      query: (body) => ({
        url: '/put-to-light/complete-basket',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'ItemList', id: 'LIST' }],
    }),

    // POST /api/put-to-light/full-basket - Cestello pieno
    fullBasket: builder.mutation<ApiResponse<any>, { basketCode: string }>({
      query: (body) => ({
        url: '/put-to-light/full-basket',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'ItemList', id: 'LIST' }],
    }),

    // POST /api/put-to-light/complete-car - Completa carrello
    completeCar: builder.mutation<ApiResponse<any>, { carCode: string }>({
      query: (body) => ({
        url: '/put-to-light/complete-car',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'ItemList', id: 'LIST' }],
    }),

    // POST /api/put-to-light/car-to-machine - Carrello a macchina
    carToMachine: builder.mutation<
      ApiResponse<any>,
      { carCode: string; machineId: number; bayNumber?: number }
    >({
      query: (body) => ({
        url: '/put-to-light/car-to-machine',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'Machine', id: 'LIST' },
        { type: 'ItemList', id: 'LIST' },
      ],
    }),

    // GET /api/put-to-light/shelves - Lista scaffali
    getShelves: builder.query<any[], void>({
      query: () => '/put-to-light/shelves',
    }),

    // GET /api/put-to-light/baskets - Lista cestelli
    getBaskets: builder.query<any[], void>({
      query: () => '/put-to-light/baskets',
    }),
  }),
});

export const {
  useAssociateBasketToShelfMutation,
  useCompleteBasketMutation,
  useFullBasketMutation,
  useCompleteCarMutation,
  useCarToMachineMutation,
  useGetShelvesQuery,
  useGetBasketsQuery,
} = putToLightApi;
