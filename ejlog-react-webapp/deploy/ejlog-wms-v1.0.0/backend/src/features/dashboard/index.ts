// ============================================================================
// EJLOG WMS - Dashboard Feature Exports
// Punto di ingresso per il modulo dashboard
// ============================================================================

// Context
export { DashboardConfigProvider, useDashboardConfig } from './context/DashboardConfigContext';

// Hooks
export {
  useProductsOverview,
  useItemsAnalytics,
  useMovementsRealtime,
  useLocationsHeatmap,
  useKPICards,
} from './hooks/useDashboardData';

// Components
export { default as WidgetContainer } from './components/WidgetContainer';
export { default as EmptyWidget } from './components/EmptyWidget';
export { default as ChartLegend } from './components/ChartLegend';

// Widgets
export { default as KPICardsWidget } from './widgets/KPICardsWidget';
export { default as ProductsOverviewWidget } from './widgets/ProductsOverviewWidget';
export { default as ItemsAnalyticsWidget } from './widgets/ItemsAnalyticsWidget';
export { default as MovementsRealtimeWidget } from './widgets/MovementsRealtimeWidget';
export { default as LocationsHeatmapWidget } from './widgets/LocationsHeatmapWidget';

// Types
export * from './types/dashboard.types';

// API
export {
  useGetProductsOverviewQuery,
  useGetItemsAnalyticsQuery,
  useGetMovementsRealtimeQuery,
  useGetLocationsHeatmapQuery,
  useGetKPIsQuery,
} from '../../services/api/dashboardApi';
