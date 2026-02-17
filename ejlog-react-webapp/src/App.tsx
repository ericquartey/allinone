// ============================================================================
// EJLOG WMS - App Component
// Componente principale con routing e lazy loading per performance
// ============================================================================

import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from './app/store';
import { useAppSelector } from './app/hooks';
import ErrorBoundary, { useApiErrorHandler } from './components/common/ErrorBoundary';
import { useTokenRefresh } from './hooks/useTokenRefresh';

// Layout - Critical, loaded immediately
import AppLayout from './components/shared/AppLayout';

// AI Assistant - Loaded immediately for global access
import AIAssistant from './components/ai/AIAssistant';

// Loading Component for Suspense
const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

// ============================================================================
// LAZY LOADED PAGES - Code Splitting for Performance
// ============================================================================

// Auth Pages - Critical, loaded immediately for login
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const BadgeLoginPage = lazy(() => import('./pages/auth/BadgeLoginPage'));

// Dashboard Pages - Lazy loaded
const Dashboard = lazy(() => import('./pages/Dashboard'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const DashboardPageEnhanced = lazy(() => import('./pages/DashboardPageEnhanced'));
const AdvancedDashboardPage = lazy(() => import('./pages/dashboard/AdvancedDashboardPage'));
const DashboardCustomizable = lazy(() => import('./pages/DashboardCustomizable'));
const AnalyticsAdvanced = lazy(() => import('./pages/AnalyticsAdvanced'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const AuditLogViewer = lazy(() => import('./pages/AuditLogViewer'));
const NotificationCenter = lazy(() => import('./pages/NotificationCenter'));
const TestSimplePage = lazy(() => import('./pages/TestSimplePage'));

// Dashboard Context - Loaded immediately for dashboard config
import { DashboardConfigProvider } from './features/dashboard/context/DashboardConfigContext';

// Settings Pages - Lazy loaded
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));
const SettingsGeneralPage = lazy(() => import('./pages/settings/SettingsGeneralPage'));
const SettingsHostPage = lazy(() => import('./pages/settings/SettingsHostPage'));
const DashboardSettingsPage = lazy(() => import('./pages/settings/DashboardSettingsPage'));
const SettingsSchedulerPrenotatorePage = lazy(
  () => import('./pages/settings/SettingsSchedulerPrenotatorePage')
);
const SettingsAdapterPage = lazy(() => import('./pages/settings/SettingsAdapterPage'));
const SettingsSapIntegrationPage = lazy(
  () => import('./pages/settings/SettingsSapIntegrationPage')
);
const SettingsErpIntegrationPage = lazy(
  () => import('./pages/settings/SettingsErpIntegrationPage')
);
const SettingsEdiIntegrationPage = lazy(
  () => import('./pages/settings/SettingsEdiIntegrationPage')
);
const SettingsMesIntegrationPage = lazy(
  () => import('./pages/settings/SettingsMesIntegrationPage')
);
const SettingsTmsIntegrationPage = lazy(
  () => import('./pages/settings/SettingsTmsIntegrationPage')
);
const SettingsEcommerceIntegrationPage = lazy(
  () => import('./pages/settings/SettingsEcommerceIntegrationPage')
);
const SettingsIntegrationsStatusPage = lazy(
  () => import('./pages/settings/SettingsIntegrationsStatusPage')
);
const SettingsEdiInboxPage = lazy(
  () => import('./pages/settings/SettingsEdiInboxPage')
);
const SettingsItemMappingsPage = lazy(
  () => import('./pages/settings/SettingsItemMappingsPage')
);
const SettingsAIPage = lazy(() => import('./pages/settings/SettingsAIPage'));
const TestAIToggle = lazy(() => import('./pages/TestAIToggle'));
const SettingsProfilePage = lazy(() => import('./pages/settings/SettingsProfilePage'));
const SettingsNotificationsPage = lazy(() => import('./pages/settings/SettingsNotificationsPage'));
const SettingsSecurityPage = lazy(() => import('./pages/settings/SettingsSecurityPage'));
const SettingsSqlConnectionPage = lazy(() => import('./pages/settings/SettingsSqlConnectionPage'));

// Items Pages - Lazy loaded
const ItemsPage = lazy(() => import('./pages/items/ItemsPage'));
const ItemsPageEnhanced = lazy(() => import('./pages/items/ItemsPageEnhanced'));
const ItemsListPage = lazy(() => import('./pages/items/ItemsListPage'));
const ItemsListPageEnhanced = lazy(() => import('./pages/items/ItemsListPageEnhanced'));
const ItemFormPageEnhanced = lazy(() => import('./pages/items/ItemFormPageEnhanced'));
const ItemDetailPage = lazy(() => import('./pages/items/ItemDetailPage'));
const ItemEditPage = lazy(() => import('./pages/items/ItemEditPage'));
const ItemCreatePage = lazy(() => import('./pages/items/ItemCreatePage'));

// Lists Pages - Lazy loaded
const ListsManagement = lazy(() => import('./pages/ListsManagement'));
const ListsManagementPage = lazy(() => import('./pages/lists/management/ListsManagementPage'));
const ListsPage = lazy(() => import('./pages/lists/ListsPage'));
const ListsPageEnhanced = lazy(() => import('./pages/lists/ListsPageEnhanced'));
const ListWizardPage = lazy(() => import('./pages/lists/ListWizardPage'));
const ListDetailPage = lazy(() => import('./pages/lists/ListDetailPage'));
const ListDetailPageEnhanced = lazy(() => import('./pages/lists/ListDetailPageEnhanced'));
const ListMonitorPage = lazy(() => import('./pages/lists/ListMonitorPage'));
const CreateListPage = lazy(() => import('./pages/lists/CreateListPage'));
const ExecuteListPage = lazy(() => import('./pages/lists/ExecuteListPage'));
const TestPage = lazy(() => import('./pages/TestPage'));

// UDC Pages - Lazy loaded
const LoadingUnitsPage = lazy(() => import('./pages/udc/LoadingUnitsPage'));
const UdcDetailPage = lazy(() => import('./pages/udc/UDCDetailPage'));
const CreateUdcPage = lazy(() => import('./pages/udc/CreateUdcPage'));
const UDCListPage = lazy(() => import('./pages/udc/UDCListPage'));
const UDCDetailPage = lazy(() => import('./pages/udc/UDCDetailPage'));

// Operations Pages - Lazy loaded
const OperationsPage = lazy(() => import('./pages/operations/OperationsPage'));
const OperationsPageEnhanced = lazy(() => import('./pages/operations/OperationsPageEnhanced'));
const OperationDetailPage = lazy(() => import('./pages/operations/OperationDetailPage'));
const ExecuteOperationPage = lazy(() => import('./pages/operations/ExecuteOperationPage'));
const PickingExecutionPage = lazy(() => import('./pages/operations/PickingExecutionPage'));
const RefillingExecutionPage = lazy(() => import('./pages/operations/RefillingExecutionPage'));

// List Operations Pages - NEW
const ListOperationsHubPage = lazy(() => import('./pages/operations/ListOperationsHubPage'));
const ListOperationsTouchPage = lazy(() => import('./pages/operations/ListOperationsTouchPage'));
const CreateListTouchPage = lazy(() => import('./pages/operations/CreateListTouchPage'));
const ListManagementPage = lazy(() => import('./pages/operations/ListManagementPage'));
const ExecuteListOperationPage = lazy(() => import('./pages/operations/ExecuteListOperationPage'));
const TerminateListOperationPage = lazy(() => import('./pages/operations/TerminateListOperationPage'));
const ReserveListOperationPage = lazy(() => import('./pages/operations/ReserveListOperationPage'));
const RereserveListOperationPage = lazy(() => import('./pages/operations/RereserveListOperationPage'));
const WaitingListOperationPage = lazy(() => import('./pages/operations/WaitingListOperationPage'));

// Movements Pages - Lazy loaded
const MovementsPage = lazy(() => import('./pages/movements/MovementsPage'));
const MovementsPageEnhanced = lazy(() => import('./pages/movements/MovementsPageEnhanced'));

// Locations Pages - Lazy loaded
const LocationListPage = lazy(() => import('./pages/locations/LocationListPage'));
const LocationBrowserPage = lazy(() => import('./pages/locations/LocationBrowserPage'));
const LocationDetailPage = lazy(() => import('./pages/locations/LocationDetailPage'));
const LocationDetailPageEnhanced = lazy(() => import('./pages/locations/LocationDetailPageEnhanced'));
const LocationDebugPage = lazy(() => import('./pages/locations/LocationDebugPage'));
const LocationCapacityPlanningPage = lazy(() => import('./pages/locations/LocationCapacityPlanningPage'));

// Products Pages
const ProductListPage = lazy(() => import('./pages/products/ProductListPage'));
const ProductsPageReal = lazy(() => import('./pages/products/ProductsPageReal'));
const ProductDetailPage = lazy(() => import('./pages/products/ProductDetailPage'));
const ProductsSearch = lazy(() => import('./pages/ProductsSearch'));

// Workstations Pages
const WorkstationListPage = lazy(() => import('./pages/workstations/WorkstationListPage'));
const WorkstationDetailPage = lazy(() => import('./pages/workstations/WorkstationDetailPage'));

// Management Pages (Sprint 3)
const WorkstationsPage = lazy(() => import('./pages/management/WorkstationsPage'));
const LocationsPage = lazy(() => import('./pages/management/LocationsPage'));

// Users Pages
const UsersListPageNew = lazy(() => import('./pages/users/UsersListPage'));
const UserDetailPage = lazy(() => import('./pages/users/UserDetailPage'));

// Reports Pages (TypeScript)
const ReportsDashboardPage = lazy(() => import('./pages/reports/ReportsDashboardPage'));
const ReportViewerPage = lazy(() => import('./pages/reports/ReportViewerPage'));

// Stock Pages
const StockPage = lazy(() => import('./pages/stock/StockPage'));
const StockPageEnhanced = lazy(() => import('./pages/stock/StockPageEnhanced'));
const StockByItemPage = lazy(() => import('./pages/stock/StockByItemPage'));
const StockMovementsPage = lazy(() => import('./pages/stock/StockMovementsPage'));

// RF Operations Pages
const PickingRFPage = lazy(() => import('./pages/rf/PickingRFPage'));
const PutawayRFPage = lazy(() => import('./pages/operations/PutawayRFPage'));
const InventoryRFPage = lazy(() => import('./pages/operations/InventoryRFPage'));

// Voice Pick Pages - I/ML Integration
const VoicePickDemo = lazy(() => import('./pages/VoicePickDemo'));
const VoicePickReal = lazy(() => import('./pages/VoicePickReal'));

// I/ML Integration Pages - Features B, C, D, E, F
const PTLDemo = lazy(() => import('./pages/PTLDemo'));
const PTLSettings = lazy(() => import('./pages/PTLSettings'));
const SchedulerSettings = lazy(() => import('./pages/SchedulerSettingsReal'));
const PWAInfo = lazy(() => import('./pages/PWAInfo'));
const AdvancedAnalytics = lazy(() => import('./pages/AdvancedAnalytics'));
const BarcodeDemo = lazy(() => import('./pages/BarcodeDemo'));

// Warehouse Operations Pages
const ReceivingManagementPage = lazy(() => import('./pages/receiving/ReceivingManagementPage'));
const PutAwayManagementPage = lazy(() => import('./pages/putaway/PutAwayManagementPage'));
const PackingOperationsPage = lazy(() => import('./pages/packing/PackingOperationsPage'));
const ShippingManagementPage = lazy(() => import('./pages/shipping/ShippingManagementPage'));
const KittingAssemblyPage = lazy(() => import('./pages/kitting/KittingAssemblyPage'));
const CrossDockingPage = lazy(() => import('./pages/crossdock/CrossDockingPage'));

// Inventory Pages
const CycleCountPage = lazy(() => import('./pages/inventory/CycleCountPage'));
const InventoryAdjustmentsPage = lazy(() => import('./pages/adjustments/InventoryAdjustmentsPage'));

// Transport Pages
const CarriersPage = lazy(() => import('./pages/carriers/CarriersPage'));
const RoutePlanningPage = lazy(() => import('./pages/routing/RoutePlanningPage'));
const DockManagementPage = lazy(() => import('./pages/dock/DockManagementPage'));
const YardManagementPage = lazy(() => import('./pages/yard/YardManagementPage'));

// Planning Pages
const PlanningHubPage = lazy(() => import('./pages/planning/PlanningHubPage'));
const WavePlanningPage = lazy(() => import('./pages/waves/WavePlanningPage'));
const ReplenishmentPlanningPage = lazy(() => import('./pages/replenishment/ReplenishmentPlanningPage'));
const DemandForecastingPage = lazy(() => import('./pages/forecasting/DemandForecastingPage'));
const AppointmentSchedulingPage = lazy(() => import('./pages/appointments/AppointmentSchedulingPage'));

// Quality Pages
const QualityControlPage = lazy(() => import('./pages/quality/QualityControlPage'));
const ComplianceAuditPage = lazy(() => import('./pages/compliance/ComplianceAuditPage'));
const DamageClaimsPage = lazy(() => import('./pages/claims/DamageClaimsPage'));

// Resources Pages
const EquipmentManagementPage = lazy(() => import('./pages/equipment/EquipmentManagementPage'));
const AssetTrackingPage = lazy(() => import('./pages/assets/AssetTrackingPage'));
const LaborManagementPage = lazy(() => import('./pages/labor/LaborManagementPage'));
const TaskAssignmentPage = lazy(() => import('./pages/tasks/TaskAssignmentPage'));

// Master Data Pages
const CustomersPage = lazy(() => import('./pages/customers/CustomersPage'));
const SuppliersPage = lazy(() => import('./pages/suppliers/SuppliersPage'));

// Other Operations Pages
const BatchManagementPage = lazy(() => import('./pages/batch/BatchManagementPage'));
const BarcodeManagementPage = lazy(() => import('./pages/barcode/BarcodeManagementPage'));
const AlertsDashboardPage = lazy(() => import('./pages/alerts/AlertsDashboardPage'));
const WarehouseLayoutPage = lazy(() => import('./pages/warehouse/WarehouseLayoutPage'));
const WarehouseManagementPage = lazy(() => import('./pages/warehouse/WarehouseManagementPage'));
const WarehouseCapacityPage = lazy(() => import('./pages/capacity/WarehouseCapacityPage'));
const SlottingOptimizationPage = lazy(() => import('./pages/slotting/SlottingOptimizationPage'));
const ReturnsManagementPage = lazy(() => import('./pages/returns/ReturnsManagementPage'));
const ProductionOrdersPage = lazy(() => import('./pages/production/ProductionOrdersPage'));
const OrderConsolidationPage = lazy(() => import('./pages/consolidation/OrderConsolidationPage'));
const ValueAddedServicesPage = lazy(() => import('./pages/vas/ValueAddedServicesPage'));
const TransferMaterialPage = lazy(() => import('./pages/transfers/TransferMaterialPage'));

// Orders Pages (nuovo)
const OrdersPageEnhanced = lazy(() => import('./pages/orders/OrdersPageEnhanced'));

// Machines Pages
const MachinesPage = lazy(() => import('./pages/machines/MachinesPage'));
const MachineDetailPage = lazy(() => import('./pages/machines/MachineDetailPage'));

// PLC Pages
const PLCDevicesPage = lazy(() => import('./pages/plc/PLCDevicesPage'));
const PLCDeviceDetailPage = lazy(() => import('./pages/plc/PLCDeviceDetailPage'));
const SignalBrowserPage = lazy(() => import('./pages/plc/SignalBrowserPage'));
const SignalDetailPage = lazy(() => import('./pages/plc/SignalDetailPage'));

// Alarms Pages
const AlarmsPage = lazy(() => import('./pages/alarms/AlarmsPage'));
const AlarmHistoryPage = lazy(() => import('./pages/alarms/AlarmHistoryPage'));

// Reports Pages
const ReportsPage = lazy(() => import('./pages/reports/ReportsPage'));

// Analytics Pages
const AnalyticsDashboardPage = lazy(() => import('./pages/analytics/AnalyticsDashboardPage'));
const AnalyticsHubPage = lazy(() => import('./pages/analytics/AnalyticsHubPage'));
const KPIDashboardPage = lazy(() => import('./pages/kpi/KPIDashboardPage'));
const PerformanceMetricsPage = lazy(() => import('./pages/metrics/PerformanceMetricsPage'));

// Config Pages
const ConfigPage = lazy(() => import('./pages/config/ConfigPage'));
const AreasPage = lazy(() => import('./pages/config/AreasPage'));
const UsersPage = lazy(() => import('./pages/config/UsersPage'));
const SettingsPageAdvanced = lazy(() => import('./pages/config/SettingsPage'));

// Templates Pages (NEW)
const ListTemplatesPage = lazy(() => import('./pages/templates/ListTemplatesPage'));

// Images Pages (NEW)
const ProductImagesPage = lazy(() => import('./pages/images/ProductImagesPage'));

// Logs Pages (NEW)
const EventLogsPage = lazy(() => import('./pages/AuditLogViewer'));

// Drawers Pages
const DrawerManagement = lazy(() => import('./pages/DrawerManagement'));
const DrawerManagementPublic = lazy(() => import('./pages/DrawerManagementPublic'));
const MappaVideo = lazy(() => import('./pages/MappaVideo'));

// Users List Page - Lazy loaded (named export)
const UsersListPage = lazy(() => import('./pages/UsersListPage').then(module => ({ default: module.UsersListPage })));

// Users Management (New Complete Module)
const UsersManagement = lazy(() => import('./pages/UsersManagement'));

// Admin Pages Enhanced (Fase 3)
const BarcodeManagementPageEnhanced = lazy(() => import('./pages/admin/BarcodeManagementPageEnhanced'));
const ReportBuilderPageEnhanced = lazy(() => import('./pages/admin/ReportBuilderPageEnhanced'));
const NotificationsPageEnhanced = lazy(() => import('./pages/admin/NotificationsPageEnhanced'));


const PpcRouter = lazy(() => import('./pages/ppc/PpcRouter'));

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const location = useLocation();

  // DEVELOPMENT MODE: Disable authentication entirely in dev mode for testing
  const isDevelopment = import.meta.env.DEV;

  if (isDevelopment) {
    console.log('[DEV MODE] Authentication bypass enabled - all routes accessible');
    return <>{children}</>;
  }

  const shouldBypassAuth =
    location.pathname.startsWith('/ppc/operator/drawer-preview') &&
    location.search.includes('embedded=ppc');

  if (shouldBypassAuth) {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// App Router Component
const AppRouter: React.FC = () => {
  // Global API error handler
  useApiErrorHandler();

  // Auto-login happens in authSlice.ts initialState via getInitialState()
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login/badge" element={<BadgeLoginPage />} />

        {/* Voice Pick - I/ML Integration (Public for testing) */}
        <Route path="/voice-pick-demo" element={<VoicePickDemo />} />
        <Route path="/voice-pick" element={<VoicePickReal />} />

        {/* I/ML Integration Features B-F */}
        <Route path="/ptl-demo" element={<PTLDemo />} />
        <Route path="/ptl-settings" element={<PTLSettings />} />
        <Route path="/scheduler-settings" element={<SchedulerSettings />} />
        <Route path="/pwa-info" element={<PWAInfo />} />
        <Route path="/analytics" element={<AdvancedAnalytics />} />
        <Route path="/barcode-demo" element={<BarcodeDemo />} />

        {/* TEMPORARY: Public access to lists-management and items for testing */}
        <Route path="/test" element={<TestPage />} />
        {/* <Route path="/lists-management" element={<ListManagementPageEnhanced />} /> */}
        {/* <Route path="/lists-management-simple" element={<ListManagementPageEnhancedSimple />} /> */}
        {/* <Route path="/lists-management-full" element={<ListManagementPageEnhanced />} /> */}
        {/* <Route path="/lists-management-new" element={<ListsManagementPageNew />} /> */}
        {/* <Route path="/lists-management-old" element={<ListsManagementPageComplete />} /> */}
        <Route path="/items-list" element={<ItemsListPage />} />
        <Route path="/drawer-management" element={<DrawerManagementPublic />} />
        <Route path="/drawer-management-full" element={<DrawerManagement />} />
        <Route path="/products/search" element={<ProductsSearch />} />

        {/* Public Dashboard Advanced - No login required */}
        <Route
          path="/dashboard-advanced"
          element={
            <DashboardConfigProvider>
              <AdvancedDashboardPage />
            </DashboardConfigProvider>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          {/* Default landing redirects to lists */}
          <Route index element={<Navigate to="/lists" replace />} />
          {/* Dashboard - Base version (Enhanced has bugs) */}
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="dashboard-enhanced" element={<DashboardPageEnhanced />} />
          <Route path="dashboard-old" element={<DashboardPage />} />
          <Route path="dashboard-customizable" element={<DashboardCustomizable />} />

          {/* Settings - Main page with nested routes */}
          <Route path="settings" element={<SettingsPage />}>
            <Route path="general" element={<SettingsGeneralPage />} />
            <Route path="host" element={<SettingsHostPage />} />
            <Route path="sql-connection" element={<SettingsSqlConnectionPage />} />
            <Route path="dashboard" element={<DashboardSettingsPage />} />
            <Route path="integration-sap" element={<SettingsSapIntegrationPage />} />
            <Route path="integration-status" element={<SettingsIntegrationsStatusPage />} />
            <Route path="integration-edi-inbox" element={<SettingsEdiInboxPage />} />
            <Route path="integration-item-mappings" element={<SettingsItemMappingsPage />} />
            <Route path="integration-erp" element={<SettingsErpIntegrationPage />} />
            <Route path="integration-edi" element={<SettingsEdiIntegrationPage />} />
            <Route path="integration-mes" element={<SettingsMesIntegrationPage />} />
            <Route path="integration-tms" element={<SettingsTmsIntegrationPage />} />
            <Route path="integration-ecommerce" element={<SettingsEcommerceIntegrationPage />} />
            <Route
              path="scheduler-prenotatore"
              element={<SettingsSchedulerPrenotatorePage />}
            />
            <Route path="adapter" element={<SettingsAdapterPage />} />
            <Route path="ai-config" element={<SettingsAIPage />} />
            <Route path="test-ai-toggle" element={<TestAIToggle />} />
            <Route path="profile" element={<SettingsProfilePage />} />
            <Route path="notifications" element={<SettingsNotificationsPage />} />
            <Route path="security" element={<SettingsSecurityPage />} />


          </Route>

          <Route path="ppc/*" element={<PpcRouter />} />

          {/* Items */}
          <Route path="items" element={<ItemsPageEnhanced />} />
          <Route path="items-old" element={<ItemsPage />} />
          <Route path="items-enhanced" element={<ItemsPageEnhanced />} />
          <Route path="items/create" element={<ItemCreatePage />} />
          <Route path="items/create-enhanced" element={<ItemFormPageEnhanced />} />
          <Route path="items/:id" element={<ItemDetailPage />} />
          <Route path="items/:id/edit" element={<ItemEditPage />} />
          <Route path="items/:id/edit-enhanced" element={<ItemFormPageEnhanced />} />

          {/* Lists - Dati reali con useListOperations + restApiClient */}
          <Route path="lists" element={<ListsManagement />} />
          <Route path="lists-management" element={<ListsManagementPage />} />
          <Route path="lists-enhanced" element={<ListsPageEnhanced />} />
          <Route path="lists-simple" element={<ListsPage />} />
          <Route path="lists/create" element={<ListWizardPage />} />
          <Route path="lists/create-old" element={<CreateListPage />} />
          <Route path="lists/monitor" element={<ListMonitorPage />} />
          <Route path="lists/:id" element={<ListDetailPageEnhanced />} />
          <Route path="lists/:id/old" element={<ListDetailPage />} />
          <Route path="lists/:id/execute" element={<ExecuteListPage />} />

          {/* UDC */}
          {/* TEMPORARY: Using UDCListPage with mock data until backend /udc endpoint is ready */}
          <Route path="udc" element={<UDCListPage />} />
          <Route path="udc-legacy" element={<LoadingUnitsPage />} />
          <Route path="udc/create" element={<CreateUdcPage />} />
          <Route path="udc/:id" element={<UDCDetailPage />} />
          <Route path="udc-list" element={<UDCListPage />} />
          <Route path="udc-detail/:barcode" element={<UDCDetailPage />} />

          {/* Operations */}
          <Route path="operations" element={<OperationsPage />} />
          <Route path="operations-enhanced" element={<OperationsPageEnhanced />} />
          <Route path="operations/:id" element={<OperationDetailPage />} />
          <Route path="operations/:id/execute" element={<ExecuteOperationPage />} />

          {/* List Operations - NEW */}
          <Route path="operations/lists" element={<ListOperationsHubPage />} />
          <Route path="operations/lists/touch" element={<ListOperationsTouchPage />} />
          <Route path="operations/lists/touch/create" element={<CreateListTouchPage />} />
          <Route path="operations/lists/management" element={<ListManagementPage />} />
          <Route path="operations/list/execute" element={<ExecuteListOperationPage />} />
          <Route path="operations/list/terminate" element={<TerminateListOperationPage />} />
          <Route path="operations/list/reserve" element={<ReserveListOperationPage />} />
          <Route path="operations/list/rereserve" element={<RereserveListOperationPage />} />
          <Route path="operations/list/waiting" element={<WaitingListOperationPage />} />

          {/* Picking & Refilling Execution */}
          <Route path="picking/:listId" element={<PickingExecutionPage />} />
          <Route path="refilling/:listId" element={<RefillingExecutionPage />} />

          {/* Movements - Enhanced */}
          <Route path="movements" element={<MovementsPageEnhanced />} />
          <Route path="movements-old" element={<MovementsPage />} />
          {/* <Route path="movements/:id" element={<MovementDetailPage />} /> */}

          {/* Stock - Enhanced (old version deprecated) */}
          <Route path="stock" element={<StockPageEnhanced />} />
          {/* <Route path="stock-old" element={<StockPage />} /> */}
          <Route path="stock/item/:itemId" element={<StockByItemPage />} />
          <Route path="stock/movements" element={<StockMovementsPage />} />

          {/* Orders - New Enhanced */}
          <Route path="orders" element={<OrdersPageEnhanced />} />

          {/* RF Operations - New */}
          <Route path="rf/picking" element={<PickingRFPage />} />
          <Route path="rf/putaway" element={<PutawayRFPage />} />
          <Route path="rf/inventory" element={<InventoryRFPage />} />

          {/* Warehouse Operations */}
          <Route path="receiving/management" element={<ReceivingManagementPage />} />
          <Route path="putaway/management" element={<PutAwayManagementPage />} />
          <Route path="packing/operations" element={<PackingOperationsPage />} />
          <Route path="shipping/management" element={<ShippingManagementPage />} />
          <Route path="kitting/assembly" element={<KittingAssemblyPage />} />
          <Route path="crossdock/operations" element={<CrossDockingPage />} />
          <Route path="consolidation/orders" element={<OrderConsolidationPage />} />
          <Route path="vas/services" element={<ValueAddedServicesPage />} />

          {/* Inventory & Adjustments */}
          <Route path="inventory/cycle-count" element={<CycleCountPage />} />
          <Route path="adjustments/inventory" element={<InventoryAdjustmentsPage />} />

          {/* Warehouse Management */}
          <Route path="warehouse/layout" element={<WarehouseLayoutPage />} />
          <Route path="warehouse-management" element={<WarehouseManagementPage />} />
          <Route path="capacity/warehouse" element={<WarehouseCapacityPage />} />
          <Route path="slotting/optimization" element={<SlottingOptimizationPage />} />
          <Route path="transfers/material" element={<TransferMaterialPage />} />

          {/* Transport & Logistics */}
          <Route path="carriers/management" element={<CarriersPage />} />
          <Route path="routing/planning" element={<RoutePlanningPage />} />
          <Route path="dock/management" element={<DockManagementPage />} />
          <Route path="yard/management" element={<YardManagementPage />} />

          {/* Planning */}
          <Route path="planning/hub" element={<PlanningHubPage />} />
          <Route path="waves/planning" element={<WavePlanningPage />} />
          <Route path="replenishment/planning" element={<ReplenishmentPlanningPage />} />
          <Route path="forecasting/demand" element={<DemandForecastingPage />} />
          <Route path="appointments/scheduling" element={<AppointmentSchedulingPage />} />

          {/* Quality & Compliance */}
          <Route path="quality/control" element={<QualityControlPage />} />
          <Route path="compliance/audit" element={<ComplianceAuditPage />} />
          <Route path="claims/damage" element={<DamageClaimsPage />} />
          <Route path="returns/management" element={<ReturnsManagementPage />} />

          {/* Resources & Equipment */}
          <Route path="equipment/management" element={<EquipmentManagementPage />} />
          <Route path="assets/tracking" element={<AssetTrackingPage />} />
          <Route path="labor/management" element={<LaborManagementPage />} />
          <Route path="tasks/assignment" element={<TaskAssignmentPage />} />

          {/* Master Data */}
          <Route path="customers/management" element={<CustomersPage />} />
          <Route path="suppliers/management" element={<SuppliersPage />} />

          {/* Other Operations */}
          <Route path="batch/management" element={<BatchManagementPage />} />
          <Route path="barcode/management" element={<BarcodeManagementPage />} />
          <Route path="barcode/management-enhanced" element={<BarcodeManagementPageEnhanced />} />
          <Route path="production/orders" element={<ProductionOrdersPage />} />

          {/* Locations */}
          <Route path="locations" element={<LocationBrowserPage />} />
          <Route path="locations-old" element={<LocationListPage />} />
          <Route path="locations/capacity-planning" element={<LocationCapacityPlanningPage />} />
          <Route path="locations/debug/:code" element={<LocationDebugPage />} />
          <Route path="locations/:code" element={<LocationDetailPageEnhanced />} />
          <Route path="locations/:code/old" element={<LocationDetailPage />} />

          {/* Products - Enhanced version with real data */}
          <Route path="products" element={<ProductsPageReal />} />
          <Route path="products-old" element={<ProductListPage />} />
          <Route path="products/:sku" element={<ProductDetailPage />} />
          <Route path="products/search" element={<ProductsSearch />} />

          {/* Workstations */}
          <Route path="workstations" element={<WorkstationListPage />} />
          <Route path="workstations/:id" element={<WorkstationDetailPage />} />

          {/* Management - New CRUD Pages (Sprint 3) */}
          <Route path="management/workstations" element={<WorkstationsPage />} />
          <Route path="management/locations" element={<LocationsPage />} />

          {/* Users (New TypeScript version) */}
          <Route path="users" element={<UsersListPageNew />} />
          <Route path="users/:id" element={<UserDetailPage />} />

          {/* Users Management (Complete Module with Tabs) */}
          <Route path="users-management" element={<UsersManagement />} />

          {/* Drawers */}
          <Route path="drawers" element={<DrawerManagement />} />
          <Route path="mappa-video" element={<MappaVideo />} />

          {/* Machines */}
          <Route path="machines" element={<MachinesPage />} />
          <Route path="machines/:id" element={<MachineDetailPage />} />

          {/* PLC Control */}
          <Route path="plc/devices" element={<PLCDevicesPage />} />
          <Route path="plc/devices/:deviceId" element={<PLCDeviceDetailPage />} />
          <Route path="plc/signals" element={<SignalBrowserPage />} />
          <Route path="plc/signals/:signalId" element={<SignalDetailPage />} />

          {/* Alarms */}
          <Route path="alarms" element={<AlarmsPage />} />
          <Route path="alarms/history" element={<AlarmHistoryPage />} />

          {/* Reports */}
          <Route path="reports" element={<ReportsDashboardPage />} />
          <Route path="reports/:id" element={<ReportViewerPage />} />
          <Route path="admin/reports" element={<ReportBuilderPageEnhanced />} />
          <Route path="admin/notifications" element={<NotificationsPageEnhanced />} />

          {/* Analytics Dashboard */}
          <Route path="analytics" element={<AnalyticsDashboardPage />} />
          <Route path="analytics/hub" element={<AnalyticsHubPage />} />
          <Route path="analytics/advanced" element={<AnalyticsAdvanced />} />
          <Route path="kpi/dashboard" element={<KPIDashboardPage />} />
          <Route path="metrics/performance" element={<PerformanceMetricsPage />} />

          {/* Alerts */}
          <Route path="alerts/dashboard" element={<AlertsDashboardPage />} />

          {/* Config */}
          <Route path="config" element={<ConfigPage />} />
          <Route path="config/areas" element={<AreasPage />} />
          <Route path="config/users" element={<UsersPage />} />
          <Route path="config/settings" element={<SettingsPageAdvanced />} />

          {/* User Management (Advanced) */}
          <Route path="admin/user-management" element={<UserManagement />} />

          {/* Audit Log */}
          <Route path="admin/audit-log" element={<AuditLogViewer />} />

          {/* Notification Center */}
          <Route path="notifications" element={<NotificationCenter />} />

          {/* List Templates (NEW) */}
          <Route path="list-templates" element={<ListTemplatesPage />} />
          {/* TODO: Add edit/create template routes */}
          {/* <Route path="list-templates/create" element={<CreateListTemplatePage />} /> */}
          {/* <Route path="list-templates/edit/:id" element={<EditListTemplatePage />} /> */}

          {/* Product Images (NEW) */}
          <Route path="product-images" element={<ProductImagesPage />} />

          {/* Event Logs (NEW) */}
          <Route path="event-logs" element={<EventLogsPage />} />

          {/* Users List - Direct Access */}
          <Route path="users-list" element={<UsersListPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

// Main App Component
const App: React.FC = () => {
  // Enable automatic token refresh
  // TEMPORARILY DISABLED - causing page reload issues
  // useTokenRefresh();

  return (
    <ErrorBoundary>
      <Provider store={store}>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        <AppRouter />
        {/* AI Assistant - Global floating widget */}
        <AIAssistant />
      </Provider>
    </ErrorBoundary>
  );
};

export default App;







