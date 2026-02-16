// ============================================================================
// EJLOG WMS - List Templates API Service
// Gestione modelli liste per creazione rapida liste standardizzate
// ============================================================================

import { baseApi } from './baseApi';

// ==================== Types ====================

export interface ListTemplateRow {
  templateRowId: number;
  sequence: number;
  item: string | null;
  requestedQty: number | null;
  labelInfo?: string;
  operatorInfo?: string;
  auxHostText01?: string;
  auxHostText02?: string;
  auxHostText03?: string;
  auxHostText04?: string;
  auxHostText05?: string;
}

export interface ListTemplate {
  id: number;
  templateName: string;
  templateDescription?: string;
  listType: number; // 0: Picking, 1: Inbound, 2: Inventory
  defaultPriority?: number;
  defaultCause?: string;
  defaultWarehouses?: number[];
  rowsTemplate: ListTemplateRow[];
  createdBy?: string;
  createdDate?: string;
  modifiedBy?: string;
  modifiedDate?: string;
  plantId?: number;
}

export interface ListTemplatesResponse {
  result: 'SUCCESS' | 'FAIL';
  message: string;
  recordNumber: number;
  exported: ListTemplate[];
  errors: any[];
}

export interface CreateListFromTemplateRequest {
  listNumber: string;
  overrideValues?: {
    listDescription?: string;
    priority?: number;
    orderNumber?: string;
    rowOverrides?: Array<{
      templateRowId: number;
      item?: string;
      requestedQty?: number;
    }>;
  };
}

export interface ApplyTemplateResponse {
  message: string;
  result: 'SUCCESS' | 'FAIL';
  list: any;
}

// ==================== API Endpoints ====================

export const listTemplatesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /EjLogHostVertimag/ListTemplates - Get all templates with filters
    getListTemplates: builder.query<
      ListTemplatesResponse,
      {
        templateName?: string;
        listType?: number;
        limit?: number;
        offset?: number;
      }
    >({
      query: (params = {}) => ({
        url: '/api/ListTemplates',
        params: {
          templateName: params.templateName,
          listType: params.listType,
          limit: params.limit || 100,
          offset: params.offset || 0,
        },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.exported.map(({ id }) => ({ type: 'ListTemplate' as const, id })),
              { type: 'ListTemplate', id: 'LIST' },
            ]
          : [{ type: 'ListTemplate', id: 'LIST' }],
    }),

    // GET /api/ListTemplates/{id} - Get template by ID
    getListTemplateById: builder.query<ListTemplate, number>({
      query: (id) => `/api/ListTemplates/${id}`,
      providesTags: (result, error, id) => [{ type: 'ListTemplate', id }],
    }),

    // POST /api/ListTemplates - Create new template
    createListTemplate: builder.mutation<ListTemplate, Partial<ListTemplate>>({
      query: (template) => ({
        url: '/api/ListTemplates',
        method: 'POST',
        body: template,
      }),
      invalidatesTags: [{ type: 'ListTemplate', id: 'LIST' }],
    }),

    // PUT /api/ListTemplates/{id} - Update template
    updateListTemplate: builder.mutation<
      ListTemplate,
      { id: number; data: Partial<ListTemplate> }
    >({
      query: ({ id, data }) => ({
        url: `/api/ListTemplates/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'ListTemplate', id },
        { type: 'ListTemplate', id: 'LIST' },
      ],
    }),

    // DELETE /api/ListTemplates/{id} - Delete template
    deleteListTemplate: builder.mutation<void, number>({
      query: (id) => ({
        url: `/api/ListTemplates/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'ListTemplate', id: 'LIST' }],
    }),

    // POST /api/ListTemplates/{id}/apply - Create list from template
    applyListTemplate: builder.mutation<
      ApplyTemplateResponse,
      { id: number; request: CreateListFromTemplateRequest }
    >({
      query: ({ id, request }) => ({
        url: `/api/ListTemplates/${id}/apply`,
        method: 'POST',
        body: request,
      }),
      invalidatesTags: [
        { type: 'ListTemplate', id: 'LIST' },
        { type: 'ItemList', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetListTemplatesQuery,
  useLazyGetListTemplatesQuery,
  useGetListTemplateByIdQuery,
  useLazyGetListTemplateByIdQuery,
  useCreateListTemplateMutation,
  useUpdateListTemplateMutation,
  useDeleteListTemplateMutation,
  useApplyListTemplateMutation,
} = listTemplatesApi;
