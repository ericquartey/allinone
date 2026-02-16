/**
 * ============================================================================
 * EJLOG WMS - Stub Hooks per API non ancora implementate
 * ============================================================================
 *
 * Questo file contiene stub hooks per evitare errori di compilazione.
 * Le API sottostanti NON sono implementate e richiedono implementazione futura.
 *
 * Quando un hook viene chiamato, restituisce uno stato di errore che indica
 * che l'endpoint non è disponibile.
 */

// Stub hook factory per queries
const createStubQuery = (hookName: string) => {
  return () => ({
    data: undefined,
    isLoading: false,
    isFetching: false,
    isError: true,
    error: {
      status: 'CUSTOM_ERROR',
      data: `${hookName} not implemented - API endpoint missing`
    },
    refetch: () => Promise.resolve({ data: undefined }),
  });
};

// Stub hook factory per lazy queries
const createStubLazyQuery = (hookName: string) => {
  return () => [
    () => Promise.resolve({ data: undefined, error: { message: `${hookName} not implemented` } }),
    {
      data: undefined,
      isLoading: false,
      isError: true,
      error: { message: `${hookName} not implemented - API endpoint missing` },
    }
  ] as const;
};

// Stub hook factory per mutations
const createStubMutation = (hookName: string) => {
  return () => [
    () => Promise.reject(new Error(`${hookName} not implemented - API endpoint missing`)),
    {
      isLoading: false,
      isError: false,
      error: undefined,
      reset: () => {},
    }
  ] as const;
};

// ============================================================================
// Location API Stub Hooks
// ============================================================================
export const useGetLocationsQuery = createStubQuery('useGetLocationsQuery');
export const useGetLocationByCodeQuery = createStubQuery('useGetLocationByCodeQuery');
export const useGetWarehousesQuery = createStubQuery('useGetWarehousesQuery');
export const useGetZonesByWarehouseQuery = createStubQuery('useGetZonesByWarehouseQuery');
export const useGetWarehouseMapQuery = createStubQuery('useGetWarehouseMapQuery');
export const useGetOccupancyHeatmapQuery = createStubQuery('useGetOccupancyHeatmapQuery');
export const useGetLocationHistoryQuery = createStubQuery('useGetLocationHistoryQuery');
export const useGetLocationMovementsQuery = createStubQuery('useGetLocationMovementsQuery');

export const useReserveLocationMutation = createStubMutation('useReserveLocationMutation');
export const useUnreserveLocationMutation = createStubMutation('useUnreserveLocationMutation');
export const useBlockLocationMutation = createStubMutation('useBlockLocationMutation');
export const useUnblockLocationMutation = createStubMutation('useUnblockLocationMutation');
export const useUpdateLocationMutation = createStubMutation('useUpdateLocationMutation');
export const useTriggerInventoryCheckMutation = createStubMutation('useTriggerInventoryCheckMutation');

// ============================================================================
// PLC API Stub Hooks
// ============================================================================
export const useGetSignalsByDeviceQuery = createStubQuery('useGetSignalsByDeviceQuery');
export const useSendShuttleCommandMutation = createStubMutation('useSendShuttleCommandMutation');
export const useGetShuttleHistoryQuery = createStubQuery('useGetShuttleHistoryQuery');
export const useGetTransferStatusQuery = createStubQuery('useGetTransferStatusQuery');
export const useSendTransferCommandMutation = createStubMutation('useSendTransferCommandMutation');
export const useGetTransferHistoryQuery = createStubQuery('useGetTransferHistoryQuery');

// ============================================================================
// Lists API Stub Hooks
// ============================================================================
export const useGetListsQuery = createStubQuery('useGetListsQuery');
export const useGetListByIdQuery = createStubQuery('useGetListByIdQuery');
export const useGetListRowsQuery = createStubQuery('useGetListRowsQuery');
export const useExecuteListMutation = createStubMutation('useExecuteListMutation');
export const useSuspendListMutation = createStubMutation('useSuspendListMutation');
export const useTerminateListMutation = createStubMutation('useTerminateListMutation');
export const useDeleteListMutation = createStubMutation('useDeleteListMutation');
export const useCreateListMutation = createStubMutation('useCreateListMutation');

export const useLazyGetListByNumberQuery = createStubLazyQuery('useLazyGetListByNumberQuery');
export const useLazyGetItemByBarcodeQuery = createStubLazyQuery('useLazyGetItemByBarcodeQuery');
export const usePickItemMutation = createStubMutation('usePickItemMutation');
