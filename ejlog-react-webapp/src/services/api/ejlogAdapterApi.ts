import { baseApi } from './baseApi';
import { getAdapterBaseUrl } from '../../utils/adapterConfig';
import type {
  Item,
  ItemList,
  ItemListRow,
  MissionOperation,
  Area,
  Product,
  DestinationGroup,
  LoadingUnit,
  ApiResponse,
} from '../../types/models';
import type { UserClaims } from '../../types/models';

const getResolvedAdapterBase = () => getAdapterBaseUrl() || '/api/adapter-disabled';

const ejlogUrl = (path: string) => {
  const base = getResolvedAdapterBase().replace(/\/$/, '');
  if (!path) return base;
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
};

export const ejlogAdapterApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // =======================
    // Version
    // =======================
    getAdapterVersion: builder.query<string, void>({
      query: () => ({
        url: ejlogUrl('/version'),
        responseHandler: (response) => response.text(),
      }),
    }),

    // =======================
    // Items
    // =======================
    getItems: builder.query<Item[], void>({
      query: () => ejlogUrl('/items'),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Item' as const, id })),
              { type: 'Item', id: 'LIST' },
            ]
          : [{ type: 'Item', id: 'LIST' }],
    }),

    getItemById: builder.query<Item, number>({
      query: (id) => ejlogUrl(`/items/${id}`),
      providesTags: (result, error, id) => [{ type: 'Item', id }],
    }),

    getItemByBarcode: builder.query<Item, string>({
      query: (barcode) => ejlogUrl(`/items/bar-code/${encodeURIComponent(barcode)}`),
    }),

    pickItem: builder.mutation<ApiResponse<any>, { id: number; payload: Record<string, any> }>({
      query: ({ id, payload }) => ({
        url: ejlogUrl(`/items/${id}/pick`),
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: [{ type: 'MissionOperation', id: 'LIST' }],
    }),

    putItem: builder.mutation<ApiResponse<any>, { id: number; payload: Record<string, any> }>({
      query: ({ id, payload }) => ({
        url: ejlogUrl(`/items/${id}/put`),
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: [{ type: 'MissionOperation', id: 'LIST' }],
    }),

    checkItem: builder.mutation<ApiResponse<any>, { id: number; payload: Record<string, any> }>({
      query: ({ id, payload }) => ({
        url: ejlogUrl(`/items/${id}/check`),
        method: 'POST',
        body: payload,
      }),
    }),

    isHandledByLot: builder.query<boolean, number>({
      query: (id) => ejlogUrl(`/items/${id}/is-handled-by-lot`),
    }),

    isHandledBySerialNumber: builder.query<boolean, number>({
      query: (id) => ejlogUrl(`/items/${id}/is-handled-by-serial-number`),
    }),

    isHandledByExpireDate: builder.query<boolean, number>({
      query: (id) => ejlogUrl(`/items/${id}/is-handled-by-expire-date`),
    }),

    updateAverageWeight: builder.mutation<ApiResponse<any>, { itemId: number; weight: number }>({
      query: ({ itemId, weight }) => ({
        url: ejlogUrl(`/items/${itemId}/average-weight`),
        method: 'PUT',
        body: { weight },
      }),
      invalidatesTags: (result, error, { itemId }) => [{ type: 'Item', id: itemId }],
    }),

    printItem: builder.mutation<ApiResponse<any>, { id: number; printName: string; itemCode: string }>({
      query: (body) => ({
        url: ejlogUrl('/items/print-item'),
        method: 'POST',
        body,
      }),
    }),

    // =======================
    // Item Lists
    // =======================
    getItemLists: builder.query<ItemList[], void>({
      query: () => ejlogUrl('/item-lists'),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'ItemList' as const, id })),
              { type: 'ItemList', id: 'LIST' },
            ]
          : [{ type: 'ItemList', id: 'LIST' }],
    }),

    getItemListById: builder.query<ItemList, number>({
      query: (id) => ejlogUrl(`/item-lists/${id}`),
      providesTags: (result, error, id) => [{ type: 'ItemList', id }],
    }),

    getItemListByCode: builder.query<ItemList, string>({
      query: (code) => ejlogUrl(`/item-lists/${encodeURIComponent(code)}/num`),
    }),

    getItemListRows: builder.query<ItemListRow[], number>({
      query: (id) => ejlogUrl(`/item-lists/${id}/rows`),
      providesTags: [{ type: 'ItemList', id: 'ROWS' }],
    }),

    executeItemList: builder.mutation<ApiResponse<any>, { id: number; payload: Record<string, any> }>({
      query: ({ id, payload }) => ({
        url: ejlogUrl(`/item-lists/${id}/execute`),
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: [{ type: 'ItemList', id: 'LIST' }],
    }),

    executeItemListByNum: builder.mutation<ApiResponse<any>, { payload: Record<string, any> }>({
      query: ({ payload }) => ({
        url: ejlogUrl('/item-lists/execute-num'),
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: [{ type: 'ItemList', id: 'LIST' }],
    }),

    suspendItemList: builder.mutation<ApiResponse<any>, { id: number; userName?: string }>({
      query: ({ id, ...body }) => ({
        url: ejlogUrl(`/item-lists/${id}/suspend`),
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'ItemList', id: 'LIST' }],
    }),

    terminateItemList: builder.mutation<ApiResponse<any>, { id: number }>({
      query: ({ id }) => ({
        url: ejlogUrl(`/item-lists/${id}/terminate`),
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'ItemList', id: 'LIST' }],
    }),

    // =======================
    // Mission Operations
    // =======================
    getMissionOperations: builder.query<MissionOperation[], void>({
      query: () => ejlogUrl('/mission-operations'),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'MissionOperation' as const, id })),
              { type: 'MissionOperation', id: 'LIST' },
            ]
          : [{ type: 'MissionOperation', id: 'LIST' }],
    }),

    getMissionOperationById: builder.query<MissionOperation, number>({
      query: (id) => ejlogUrl(`/mission-operations/${id}`),
      providesTags: (result, error, id) => [{ type: 'MissionOperation', id }],
    }),

    getMissionOperationAggregate: builder.query<MissionOperation, number>({
      query: (id) => ejlogUrl(`/mission-operations/${id}/aggregate`),
      providesTags: (result, error, id) => [{ type: 'MissionOperation', id }],
    }),

    executeMissionOperation: builder.mutation<ApiResponse<any>, { id: number; userName?: string }>({
      query: ({ id, ...body }) => ({
        url: ejlogUrl(`/mission-operations/${id}/execute`),
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'MissionOperation', id: 'LIST' }],
    }),

    completeMissionOperation: builder.mutation<ApiResponse<any>, { id: number; payload: Record<string, any> }>({
      query: ({ id, payload }) => ({
        url: ejlogUrl(`/mission-operations/${id}/complete`),
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: [{ type: 'MissionOperation', id: 'LIST' }],
    }),

    suspendMissionOperation: builder.mutation<ApiResponse<any>, { id: number; userName?: string }>({
      query: ({ id, ...body }) => ({
        url: ejlogUrl(`/mission-operations/${id}/suspend`),
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'MissionOperation', id: 'LIST' }],
    }),

    sendIdOperation: builder.mutation<ApiResponse<any>, { id: number }>({
      query: ({ id }) => ({
        url: ejlogUrl(`/mission-operations/${id}/send-id-operation`),
        method: 'POST',
      }),
    }),

    getOperationByParams: builder.query<MissionOperation, { idUdc: number; destinationGroup: number; idMission: number }>(
      {
        query: (params) => ({
          url: ejlogUrl('/mission-operations/get-operation'),
          params,
        }),
      }
    ),

    getOperationReasonsByType: builder.mutation<ApiResponse<any>, { type: number }>({
      query: ({ type }) => ({
        url: ejlogUrl(`/mission-operations/${type}/reasons`),
        method: 'POST',
      }),
    }),

    getOperationOrders: builder.mutation<ApiResponse<any>, void>({
      query: () => ({
        url: ejlogUrl('/mission-operations/orders'),
        method: 'POST',
      }),
    }),

    getOperationExtraCombo: builder.query<ApiResponse<any>, { type: number }>({
      query: (params) => ({
        url: ejlogUrl('/mission-operations/extraCombo'),
        params,
      }),
    }),

    // =======================
    // Machines
    // =======================
    getMachineArea: builder.query<Area, number>({
      query: (machineId) => ejlogUrl(`/machines/${machineId}/area`),
      providesTags: (result, error, machineId) => [{ type: 'Machine', id: machineId }],
    }),

    getMachineDestinationGroups: builder.query<DestinationGroup[], number>({
      query: (machineId) => ejlogUrl(`/machines/${machineId}/destination-groups`),
      providesTags: [{ type: 'DestinationGroup', id: 'LIST' }],
    }),

    getMachineLoadingUnits: builder.query<LoadingUnit[], number>({
      query: (machineId) => ejlogUrl(`/machines/${machineId}/loading-units`),
      providesTags: [{ type: 'LoadingUnit', id: 'LIST' }],
    }),

    getMachineMissionOperations: builder.query<MissionOperation[], number>({
      query: (machineId) => ejlogUrl(`/machines/${machineId}/mission-operations`),
      providesTags: [{ type: 'MissionOperation', id: 'LIST' }],
    }),

    getBayDestinationGroups: builder.query<
      DestinationGroup[],
      { machineId: number; bayNumber: number }
    >({
      query: ({ machineId, bayNumber }) =>
        ejlogUrl(`/machines/${machineId}/bays/${bayNumber}/destination-groups`),
      providesTags: [{ type: 'DestinationGroup', id: 'LIST' }],
    }),

    postMachineAlarms: builder.mutation<ApiResponse<any>, { machineId: number; payload: Record<string, any> }>({
      query: ({ machineId, payload }) => ({
        url: ejlogUrl(`/machines/${machineId}/postalarms`),
        method: 'POST',
        body: payload,
      }),
    }),

    postMachineStates: builder.mutation<ApiResponse<any>, { machineId: number; payload: Record<string, any> }>({
      query: ({ machineId, payload }) => ({
        url: ejlogUrl(`/machines/${machineId}/poststates`),
        method: 'POST',
        body: payload,
      }),
    }),

    // =======================
    // Areas / Products
    // =======================
    getAreas: builder.query<Area[], void>({
      query: () => ejlogUrl('/areas'),
      providesTags: [{ type: 'Area', id: 'LIST' }],
    }),

    getAreaProducts: builder.query<Product[], number>({
      query: (areaId) => ejlogUrl(`/areas/${areaId}/products`),
      providesTags: [{ type: 'Product', id: 'LIST' }],
    }),

    getAllProducts: builder.query<Product[], void>({
      query: () => ejlogUrl('/areas/all-products'),
      providesTags: [{ type: 'Product', id: 'LIST' }],
    }),

    // =======================
    // Loading Units
    // =======================
    getLoadingUnits: builder.query<LoadingUnit[], void>({
      query: () => ejlogUrl('/loading-units'),
      providesTags: [{ type: 'LoadingUnit', id: 'LIST' }],
    }),

    getLoadingUnitById: builder.query<LoadingUnit, number>({
      query: (id) => ejlogUrl(`/loading-units/${id}`),
      providesTags: (result, error, id) => [{ type: 'LoadingUnit', id }],
    }),

    getLoadingUnitCompartments: builder.query<any[], number>({
      query: (id) => ejlogUrl(`/loading-units/${id}/compartments`),
    }),

    getLoadingUnitMissionOperations: builder.query<MissionOperation[], number>({
      query: (id) => ejlogUrl(`/loading-units/${id}/mission-operations`),
      providesTags: [{ type: 'MissionOperation', id: 'LIST' }],
    }),

    createLoadingUnit: builder.mutation<ApiResponse<LoadingUnit>, { machineId: number }>({
      query: ({ machineId }) => ({
        url: ejlogUrl('/loading-units'),
        method: 'PUT',
        params: { machineId },
      }),
      invalidatesTags: [{ type: 'LoadingUnit', id: 'LIST' }],
    }),

    callLoadingUnit: builder.mutation<ApiResponse<any>, { id: number; destinationGroupId?: number; userName?: string }>({
      query: ({ id, ...params }) => ({
        url: ejlogUrl(`/loading-units/${id}/call`),
        method: 'POST',
        params,
      }),
    }),

    // =======================
    // Users
    // =======================
    getUsers: builder.query<UserClaims[], void>({
      query: () => ejlogUrl('/users'),
      providesTags: [{ type: 'User', id: 'LIST' }],
    }),

    authenticateWithBadgeSelesta: builder.mutation<UserClaims, { machineId: number; bay: number; time: string }>({
      query: (params) => ({
        url: ejlogUrl('/users/authenticate-badge-selesta'),
        method: 'POST',
        params,
      }),
    }),

    authenticateWithBearerToken: builder.mutation<UserClaims, { token: string }>({
      query: (params) => ({
        url: ejlogUrl('/users/bearer-token'),
        method: 'POST',
        params,
      }),
    }),

    authenticateWithResourceOwner: builder.mutation<UserClaims, { userName: string; password: string }>({
      query: (params) => ({
        url: ejlogUrl('/users/resource-owner'),
        method: 'POST',
        params,
      }),
    }),

    logoutUser: builder.mutation<ApiResponse<any>, { userName: string; time: string; machineId: number; bay: number }>({
      query: (params) => ({
        url: ejlogUrl('/users/logout-user'),
        method: 'POST',
        params,
      }),
    }),

    // =======================
    // Barcodes / Printers / Images
    // =======================
    getBarcodeRules: builder.query<any[], void>({
      query: () => ejlogUrl('/barcodes'),
      providesTags: [{ type: 'BarcodeRule', id: 'LIST' }],
    }),

    printTestPage: builder.mutation<ApiResponse<any>, { printerName: string }>({
      query: (params) => ({
        url: ejlogUrl('/printers'),
        method: 'POST',
        params,
      }),
    }),

    getImageByItemId: builder.query<Blob, number>({
      query: (itemId) => ({
        url: ejlogUrl(`/images/${itemId}`),
        responseHandler: (response) => response.blob(),
      }),
    }),

    // =======================
    // Put To Light
    // =======================
    associateBasketToShelf: builder.mutation<ApiResponse<any>, { shelfCode: string; basketCode: string; destinationGroupId?: number }>({
      query: ({ shelfCode, basketCode, ...params }) => ({
        url: ejlogUrl(`/puttolight/shelves/${encodeURIComponent(shelfCode)}/basket/${encodeURIComponent(basketCode)}`),
        method: 'PUT',
        params,
      }),
    }),

    carToMachine: builder.mutation<ApiResponse<any>, { machineCode: string; carCode: string; destinationGroupId?: number }>({
      query: ({ machineCode, carCode, ...params }) => ({
        url: ejlogUrl(`/puttolight/shelves/${encodeURIComponent(machineCode)}/car-to-machine/${encodeURIComponent(carCode)}`),
        method: 'POST',
        params,
      }),
    }),

    carComplete: builder.mutation<ApiResponse<any>, { machineCode: string; carCode: string; destinationGroupId?: number }>({
      query: ({ machineCode, carCode, ...params }) => ({
        url: ejlogUrl(`/puttolight/shelves/${encodeURIComponent(machineCode)}/car-complete/${encodeURIComponent(carCode)}`),
        method: 'POST',
        params,
      }),
    }),

    completeBasket: builder.mutation<ApiResponse<any>, { shelfCode: string; basketCode: string; destinationGroupId?: number }>({
      query: ({ shelfCode, basketCode, ...params }) => ({
        url: ejlogUrl(`/puttolight/shelves/${encodeURIComponent(shelfCode)}/complete-basket/${encodeURIComponent(basketCode)}`),
        method: 'POST',
        params,
      }),
    }),

    removeFullBasket: builder.mutation<ApiResponse<any>, { shelfCode: string; basketCode: string; destinationGroupId?: number }>({
      query: ({ shelfCode, basketCode, ...params }) => ({
        url: ejlogUrl(`/puttolight/shelves/${encodeURIComponent(shelfCode)}/full-basket/${encodeURIComponent(basketCode)}`),
        method: 'POST',
        params,
      }),
    }),
  }),
});

export const {
  useGetAdapterVersionQuery,
  useGetItemsQuery,
  useGetItemByIdQuery,
  useGetItemByBarcodeQuery,
  usePickItemMutation,
  usePutItemMutation,
  useCheckItemMutation,
  useIsHandledByLotQuery,
  useIsHandledBySerialNumberQuery,
  useIsHandledByExpireDateQuery,
  useUpdateAverageWeightMutation,
  usePrintItemMutation,
  useGetItemListsQuery,
  useGetItemListByIdQuery,
  useGetItemListByCodeQuery,
  useGetItemListRowsQuery,
  useExecuteItemListMutation,
  useExecuteItemListByNumMutation,
  useSuspendItemListMutation,
  useTerminateItemListMutation,
  useGetMissionOperationsQuery,
  useGetMissionOperationByIdQuery,
  useGetMissionOperationAggregateQuery,
  useExecuteMissionOperationMutation,
  useCompleteMissionOperationMutation,
  useSuspendMissionOperationMutation,
  useSendIdOperationMutation,
  useGetOperationByParamsQuery,
  useGetOperationReasonsByTypeMutation,
  useGetOperationOrdersMutation,
  useGetOperationExtraComboQuery,
  useGetMachineAreaQuery,
  useGetMachineDestinationGroupsQuery,
  useGetMachineLoadingUnitsQuery,
  useGetMachineMissionOperationsQuery,
  useGetBayDestinationGroupsQuery,
  usePostMachineAlarmsMutation,
  usePostMachineStatesMutation,
  useGetAreasQuery,
  useGetAreaProductsQuery,
  useGetAllProductsQuery,
  useGetLoadingUnitsQuery,
  useGetLoadingUnitByIdQuery,
  useGetLoadingUnitCompartmentsQuery,
  useGetLoadingUnitMissionOperationsQuery,
  useCreateLoadingUnitMutation,
  useCallLoadingUnitMutation,
  useGetUsersQuery,
  useAuthenticateWithBadgeSelestaMutation,
  useAuthenticateWithBearerTokenMutation,
  useAuthenticateWithResourceOwnerMutation,
  useLogoutUserMutation,
  useGetBarcodeRulesQuery,
  usePrintTestPageMutation,
  useGetImageByItemIdQuery,
  useAssociateBasketToShelfMutation,
  useCarToMachineMutation,
  useCarCompleteMutation,
  useCompleteBasketMutation,
  useRemoveFullBasketMutation,
} = ejlogAdapterApi;
