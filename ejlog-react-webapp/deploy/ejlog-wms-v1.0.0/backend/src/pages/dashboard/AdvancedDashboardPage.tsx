// ============================================================================
// EJLOG WMS - Advanced Dashboard Page
// Dashboard modulare con widget configurabili e grafici intelligenti
// ============================================================================

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import { autoLoginSuperuser } from '../../features/auth/authSlice';
import { useDashboardConfig } from '../../features/dashboard/context/DashboardConfigContext';
import KPICardsWidget from '../../features/dashboard/widgets/KPICardsWidget';
import ProductsOverviewWidget from '../../features/dashboard/widgets/ProductsOverviewWidget';
import ItemsAnalyticsWidget from '../../features/dashboard/widgets/ItemsAnalyticsWidget';
import MovementsRealtimeWidget from '../../features/dashboard/widgets/MovementsRealtimeWidget';
import LocationsHeatmapWidget from '../../features/dashboard/widgets/LocationsHeatmapWidget';
import { WidgetType } from '../../features/dashboard/types/dashboard.types';

/**
 * Advanced Dashboard Page - Pagina principale con widget modulari
 * NOTA: Questa pagina fa auto-login come superuser per essere accessibile pubblicamente
 */
const AdvancedDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { getEnabledWidgets, config } = useDashboardConfig();

  // Auto-login come superuser per accesso pubblico
  useEffect(() => {
    console.log('[AdvancedDashboard] Auto-login as superuser');
    dispatch(autoLoginSuperuser());
  }, [dispatch]);

  // Ottieni widget abilitati dalla configurazione
  const enabledWidgets = getEnabledWidgets();

  /**
   * Render widget in base al tipo
   */
  const renderWidget = (widgetId: WidgetType) => {
    switch (widgetId) {
      case WidgetType.KPI_CARDS:
        return <KPICardsWidget />;
      case WidgetType.PRODUCTS_OVERVIEW:
        return <ProductsOverviewWidget />;
      case WidgetType.ITEMS_ANALYTICS:
        return <ItemsAnalyticsWidget />;
      case WidgetType.MOVEMENTS_REALTIME:
        return <MovementsRealtimeWidget />;
      case WidgetType.LOCATIONS_HEATMAP:
        return <LocationsHeatmapWidget />;
      default:
        return null;
    }
  };

  /**
   * Render empty state quando nessun widget è abilitato
   */
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <svg
        className="w-24 h-24 text-gray-400 mb-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">Nessun widget attivo</h3>
      <p className="text-gray-600 mb-6 max-w-md">
        Non hai widget abilitati nella dashboard. Vai alle impostazioni per attivare i widget che desideri visualizzare.
      </p>
      <button
        onClick={() => navigate('/settings/dashboard')}
        className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        Vai alle Impostazioni
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Standalone Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">F</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">EjLog WMS</h1>
              <p className="text-xs text-gray-500">Dashboard Avanzata</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard Avanzata</h1>
              <p className="text-gray-600 mt-1">
                Monitoraggio real-time sistema EjLog WMS
                {config.autoRefresh && (
                  <span className="ml-2 text-sm text-blue-600">
                    (Auto-refresh: {config.refreshInterval}s)
                  </span>
                )}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
                title="Aggiorna dashboard"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>Aggiorna</span>
              </button>

              <button
                onClick={() => navigate('/settings/dashboard')}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>Configurazione</span>
              </button>
            </div>
          </div>

          {/* Widgets Grid */}
          {enabledWidgets.length === 0 ? (
            renderEmptyState()
          ) : (
            <div className="space-y-6">
              {enabledWidgets.map((widget) => (
                <div key={widget.id} id={`widget-${widget.id}`}>
                  {renderWidget(widget.id)}
                </div>
              ))}
            </div>
          )}

          {/* Footer info */}
          {enabledWidgets.length > 0 && (
            <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>
                    {enabledWidgets.length} widget attivi • Layout: {config.layout}
                  </span>
                </div>
                <span>
                  Ultimo aggiornamento: {new Date().toLocaleTimeString('it-IT')}
                </span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdvancedDashboardPage;
