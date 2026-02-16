// ============================================================================
// EJLOG WMS - Dashboard Data Hooks
// Hook personalizzati per gestire dati widgets con auto-refresh
// ============================================================================

import { useEffect } from 'react';
import {
  useGetProductsOverviewQuery,
  useGetItemsAnalyticsQuery,
  useGetMovementsRealtimeQuery,
  useGetLocationsHeatmapQuery,
  useGetKPIsQuery,
} from '../../../services/api/dashboardApi';
import { useDashboardConfig } from '../context/DashboardConfigContext';
import type { WidgetType } from '../types/dashboard.types';

/**
 * Hook per dati Products Overview con auto-refresh
 */
export const useProductsOverview = (enabled: boolean = true) => {
  const { config } = useDashboardConfig();
  const widget = config.widgets.find((w) => w.id === 'products_overview' as WidgetType);
  const refreshInterval = widget?.refreshInterval
    ? widget.refreshInterval * 1000
    : config.refreshInterval * 1000;

  const result = useGetProductsOverviewQuery(undefined, {
    skip: !enabled,
    pollingInterval: config.autoRefresh ? refreshInterval : 0,
  });

  return result;
};

/**
 * Hook per dati Items Analytics con auto-refresh
 */
export const useItemsAnalytics = (enabled: boolean = true) => {
  const { config } = useDashboardConfig();
  const widget = config.widgets.find((w) => w.id === 'items_analytics' as WidgetType);
  const refreshInterval = widget?.refreshInterval
    ? widget.refreshInterval * 1000
    : config.refreshInterval * 1000;

  const result = useGetItemsAnalyticsQuery(undefined, {
    skip: !enabled,
    pollingInterval: config.autoRefresh ? refreshInterval : 0,
  });

  return result;
};

/**
 * Hook per dati Movements Realtime con auto-refresh
 */
export const useMovementsRealtime = (enabled: boolean = true) => {
  const { config } = useDashboardConfig();
  const widget = config.widgets.find((w) => w.id === 'movements_realtime' as WidgetType);
  const refreshInterval = widget?.refreshInterval
    ? widget.refreshInterval * 1000
    : config.refreshInterval * 1000;

  const result = useGetMovementsRealtimeQuery(undefined, {
    skip: !enabled,
    pollingInterval: config.autoRefresh ? refreshInterval : 0,
  });

  return result;
};

/**
 * Hook per dati Locations Heatmap con auto-refresh
 */
export const useLocationsHeatmap = (enabled: boolean = true) => {
  const { config } = useDashboardConfig();
  const widget = config.widgets.find((w) => w.id === 'locations_heatmap' as WidgetType);
  const refreshInterval = widget?.refreshInterval
    ? widget.refreshInterval * 1000
    : config.refreshInterval * 1000;

  const result = useGetLocationsHeatmapQuery(undefined, {
    skip: !enabled,
    pollingInterval: config.autoRefresh ? refreshInterval : 0,
  });

  return result;
};

/**
 * Hook per dati KPI Cards con auto-refresh
 */
export const useKPICards = (enabled: boolean = true) => {
  const { config } = useDashboardConfig();
  const widget = config.widgets.find((w) => w.id === 'kpi_cards' as WidgetType);
  const refreshInterval = widget?.refreshInterval
    ? widget.refreshInterval * 1000
    : config.refreshInterval * 1000;

  const result = useGetKPIsQuery(undefined, {
    skip: !enabled,
    pollingInterval: config.autoRefresh ? refreshInterval : 0,
  });

  return result;
};

/**
 * Hook per logging refresh automatico (debug)
 */
export const useRefreshLogger = (widgetName: string, data: any, isLoading: boolean) => {
  useEffect(() => {
    if (!isLoading && data) {
      console.log(`[Dashboard] ${widgetName} aggiornato:`, new Date().toLocaleTimeString());
    }
  }, [data, isLoading, widgetName]);
};
