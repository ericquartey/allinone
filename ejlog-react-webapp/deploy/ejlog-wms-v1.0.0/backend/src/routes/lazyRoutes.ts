// ============================================================================
// EJLOG WMS - Lazy Routes Configuration
// Code splitting e lazy loading per ottimizzazione bundle
// ============================================================================

import { lazy } from 'react';

/**
 * Lazy loaded routes con code splitting automatico
 * Ogni route viene caricata solo quando necessaria
 */

// ============================================================================
// AUTH PAGES
// ============================================================================
export const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
export const BadgeLoginPage = lazy(() => import('../pages/auth/BadgeLoginPage'));

// ============================================================================
// DASHBOARD
// ============================================================================
export const DashboardPage = lazy(() => import('../pages/DashboardPage'));
export const DashboardPageEnhanced = lazy(() => import('../pages/DashboardPageEnhanced'));

// ============================================================================
// ITEMS
// ============================================================================
export const ItemsPage = lazy(() => import('../pages/items/ItemsPage'));
export const ItemsListPage = lazy(() => import('../pages/items/ItemsListPage'));
export const ItemDetailPage = lazy(() => import('../pages/items/ItemDetailPage'));
export const ItemEditPage = lazy(() => import('../pages/items/ItemEditPage'));
export const ItemCreatePage = lazy(() => import('../pages/items/ItemCreatePage'));

// ============================================================================
// LISTS
// ============================================================================
export const ListsPage = lazy(() => import('../pages/lists/ListsPage'));
export const ListsPageEnhanced = lazy(() => import('../pages/lists/ListsPageEnhanced'));
export const ListWizardPage = lazy(() => import('../pages/lists/ListWizardPage'));
export const ListDetailPage = lazy(() => import('../pages/lists/ListDetailPage'));
export const ListDetailPageEnhanced = lazy(() => import('../pages/lists/ListDetailPageEnhanced'));
export const ListMonitorPage = lazy(() => import('../pages/lists/ListMonitorPage'));
export const CreateListPage = lazy(() => import('../pages/lists/CreateListPage'));
export const ExecuteListPage = lazy(() => import('../pages/lists/ExecuteListPage'));
export const ListsManagementPageComplete = lazy(() => import('../pages/lists/ListsManagementPageComplete'));
export const ListsManagementPageNew = lazy(() => import('../pages/lists/ListsManagementPageNew'));
export const ListManagementPageEnhanced = lazy(() => import('../pages/lists/management/ListManagementPageEnhanced'));
export const ListManagementPageEnhancedSimple = lazy(() => import('../pages/lists/management/ListManagementPageEnhancedSimple'));

// ============================================================================
// UDC (Loading Units)
// ============================================================================
export const LoadingUnitsPage = lazy(() => import('../pages/udc/LoadingUnitsPage'));
export const UdcDetailPage = lazy(() => import('../pages/udc/UdcDetailPage'));
export const CreateUdcPage = lazy(() => import('../pages/udc/CreateUdcPage'));
export const UDCListPage = lazy(() => import('../pages/udc/UDCListPage'));
export const UDCDetailPage = lazy(() => import('../pages/udc/UDCDetailPage'));

// ============================================================================
// OPERATIONS
// ============================================================================
export const OperationsPage = lazy(() => import('../pages/operations/OperationsPage'));
export const OperationDetailPage = lazy(() => import('../pages/operations/OperationDetailPage'));
export const ExecuteOperationPage = lazy(() => import('../pages/operations/ExecuteOperationPage'));
export const PickingExecutionPage = lazy(() => import('../pages/operations/PickingExecutionPage'));
export const RefillingExecutionPage = lazy(() => import('../pages/operations/RefillingExecutionPage'));

// ============================================================================
// MOVEMENTS
// ============================================================================
export const MovementsPage = lazy(() => import('../pages/movements/MovementsPage'));
export const MovementsPageEnhanced = lazy(() => import('../pages/movements/MovementsPageEnhanced'));
export const MovementDetailPage = lazy(() => import('../pages/movements/MovementDetailPage'));

// ============================================================================
// LOCATIONS
// ============================================================================
export const LocationListPage = lazy(() => import('../pages/locations/LocationListPage'));
export const LocationBrowserPage = lazy(() => import('../pages/locations/LocationBrowserPage'));
export const LocationDetailPage = lazy(() => import('../pages/locations/LocationDetailPage'));
export const LocationDetailPageEnhanced = lazy(() => import('../pages/locations/LocationDetailPageEnhanced'));
export const LocationDebugPage = lazy(() => import('../pages/locations/LocationDebugPage'));
export const LocationCapacityPlanningPage = lazy(() => import('../pages/locations/LocationCapacityPlanningPage'));

// ============================================================================
// PRODUCTS
// ============================================================================
export const ProductListPage = lazy(() => import('../pages/products/ProductListPage'));
export const ProductDetailPage = lazy(() => import('../pages/products/ProductDetailPage'));

// ============================================================================
// WORKSTATIONS
// ============================================================================
export const WorkstationListPage = lazy(() => import('../pages/workstations/WorkstationListPage'));
export const WorkstationDetailPage = lazy(() => import('../pages/workstations/WorkstationDetailPage'));

// ============================================================================
// USERS
// ============================================================================
export const UsersListPageNew = lazy(() => import('../pages/users/UsersListPage'));
export const UserDetailPage = lazy(() => import('../pages/users/UserDetailPage'));

// ============================================================================
// REPORTS
// ============================================================================
export const ReportsDashboardPage = lazy(() => import('../pages/reports/ReportsDashboardPage'));
export const ReportViewerPage = lazy(() => import('../pages/reports/ReportViewerPage'));

// ============================================================================
// STOCK
// ============================================================================
export const StockPage = lazy(() => import('../pages/stock/StockPage'));
export const StockPageEnhanced = lazy(() => import('../pages/stock/StockPageEnhanced'));
export const StockByItemPage = lazy(() => import('../pages/stock/StockByItemPage'));
export const StockMovementsPage = lazy(() => import('../pages/stock/StockMovementsPage'));

// ============================================================================
// RF OPERATIONS
// ============================================================================
export const PickingRFPage = lazy(() => import('../pages/rf/PickingRFPage'));

// ============================================================================
// ORDERS
// ============================================================================
export const OrdersPageEnhanced = lazy(() => import('../pages/orders/OrdersPageEnhanced'));

// ============================================================================
// PLC (Week 1-2)
// ============================================================================
export const PLCDevicesPage = lazy(() => import('../pages/plc/PLCDevicesPage'));
export const PLCDeviceDetailPage = lazy(() => import('../pages/plc/PLCDeviceDetailPage'));
export const SignalBrowserPage = lazy(() => import('../pages/plc/SignalBrowserPage'));
export const SignalDetailPage = lazy(() => import('../pages/plc/SignalDetailPage'));

// ============================================================================
// TESTING & DEBUG
// ============================================================================
export const TestPage = lazy(() => import('../pages/TestPage'));

/**
 * Preload strategico per route critiche
 * Precarica le route più usate in background per migliorare UX
 */
export const preloadCriticalRoutes = () => {
  // Preload dashboard e liste (route più comuni)
  import('../pages/DashboardPageEnhanced');
  import('../pages/lists/ListsManagementPageNew');
  import('../pages/locations/LocationBrowserPage');
};

/**
 * Prefetch route per gruppo
 * Utile per precaricare gruppi di route correlate
 */
export const prefetchRouteGroup = {
  lists: () => {
    import('../pages/lists/ListsPageEnhanced');
    import('../pages/lists/ListDetailPageEnhanced');
    import('../pages/lists/CreateListPage');
  },
  locations: () => {
    import('../pages/locations/LocationBrowserPage');
    import('../pages/locations/LocationDetailPageEnhanced');
    import('../pages/locations/LocationCapacityPlanningPage');
  },
  stock: () => {
    import('../pages/stock/StockPageEnhanced');
    import('../pages/stock/StockByItemPage');
    import('../pages/stock/StockMovementsPage');
  },
  plc: () => {
    import('../pages/plc/PLCDevicesPage');
    import('../pages/plc/PLCDeviceDetailPage');
    import('../pages/plc/SignalBrowserPage');
  },
};

/**
 * Route weights per priorità caricamento
 * Usato per decidere quali route precaricare per prime
 */
export const routePriority = {
  critical: [
    'DashboardPageEnhanced',
    'ListsManagementPageNew',
    'LocationBrowserPage',
  ],
  high: [
    'ItemsListPage',
    'StockPageEnhanced',
    'PLCDevicesPage',
    'OrdersPageEnhanced',
  ],
  medium: [
    'MovementsPageEnhanced',
    'OperationsPage',
    'ReportsDashboardPage',
  ],
  low: [
    'TestPage',
    'LocationDebugPage',
  ],
};
