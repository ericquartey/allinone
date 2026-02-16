/**
 * Hooks Central Export
 * Provides convenient access to all custom hooks
 * All React Query hooks are now TypeScript!
 */

// Export React Query API hooks (migrated to TypeScript)
export { useItems, useSaveItems, itemsKeys } from './useItems';
export { useStock, stockKeys } from './useStock';
export { useMovements, movementsKeys } from './useMovements';
export { useProducts, useSaveProducts, productsKeys } from './useProducts';
export { useReservations, useReservation, useUpdateReservationStatus, reservationsKeys } from './useReservations';

// Export utility hooks (already TypeScript)
export { useAuth } from './useAuth';
export { useBarcode } from './useBarcode';
export { useNotification } from './useNotification';
export { usePagination } from './usePagination';
export { useDebounce } from './useDebounce';
export { usePermissions } from './usePermissions';
export { useBarcodeScanner } from './useBarcodeScanner';
export { useExecution } from './useExecution';
export { useNotifications } from './useNotifications';
export { useSettings } from './useSettings';
export { useOperationalNotes } from './useOperationalNotes';
export { useDrawers } from './useDrawers';
export { useLists, useListRows } from './useLists';
export { useUsers } from './useUsers';
export { useApiError } from './useApiError';
export { useListOperations } from './useListOperations';
export { useListsQuery } from './useListsQuery';
export { useMenuBadges } from './useMenuBadges';
