// ============================================================================
// EJLOG WMS - Dashboard Settings Page
// Configurazione widget e preferenze dashboard
// ============================================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardConfig } from '../../features/dashboard/context/DashboardConfigContext';
import Button from '../../components/shared/Button';
import Badge from '../../components/shared/Badge';

/**
 * Dashboard Settings Page - Configurazione widget
 */
const DashboardSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { config, updateConfig, toggleWidget, resetConfig } = useDashboardConfig();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  /**
   * Handle toggle auto-refresh
   */
  const handleToggleAutoRefresh = () => {
    updateConfig({ autoRefresh: !config.autoRefresh });
  };

  /**
   * Handle cambio intervallo refresh
   */
  const handleRefreshIntervalChange = (value: number) => {
    updateConfig({ refreshInterval: value });
  };

  /**
   * Handle cambio layout
   */
  const handleLayoutChange = (layout: 'grid' | 'list') => {
    updateConfig({ layout });
  };

  /**
   * Handle reset configurazione
   */
  const handleReset = () => {
    resetConfig();
    setShowResetConfirm(false);
    navigate('/dashboard-advanced');
  };

  /**
   * Ottieni icona widget
   */
  const getWidgetIcon = (widgetId: string) => {
    const iconClass = 'w-6 h-6';

    switch (widgetId) {
      case 'kpi_cards':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        );
      case 'products_overview':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
            />
          </svg>
        );
      case 'items_analytics':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        );
      case 'movements_realtime':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          </svg>
        );
      case 'locations_heatmap':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  const enabledCount = config.widgets.filter((w) => w.enabled).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configurazione Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Personalizza i widget e le preferenze della dashboard
          </p>
        </div>
        <Button variant="ghost" onClick={() => navigate('/dashboard-advanced')}>
          Torna alla Dashboard
        </Button>
      </div>

      {/* Impostazioni Generali */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Impostazioni Generali</h2>

        <div className="space-y-6">
          {/* Auto Refresh */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">Auto-refresh</label>
              <p className="text-sm text-gray-600 mt-1">
                Aggiorna automaticamente i dati della dashboard
              </p>
            </div>
            <button
              onClick={handleToggleAutoRefresh}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.autoRefresh ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.autoRefresh ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Refresh Interval */}
          {config.autoRefresh && (
            <div>
              <label className="text-sm font-medium text-gray-900 block mb-2">
                Intervallo refresh (secondi)
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="10"
                  max="300"
                  step="10"
                  value={config.refreshInterval}
                  onChange={(e) => handleRefreshIntervalChange(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-medium text-gray-900 w-12 text-right">
                  {config.refreshInterval}s
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Frequenza di aggiornamento automatico dei dati
              </p>
            </div>
          )}

          {/* Layout */}
          <div>
            <label className="text-sm font-medium text-gray-900 block mb-2">Layout</label>
            <div className="flex space-x-4">
              <button
                onClick={() => handleLayoutChange('grid')}
                className={`flex-1 p-4 border-2 rounded-lg transition-colors ${
                  config.layout === 'grid'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                    />
                  </svg>
                  <span className="font-medium">Griglia</span>
                </div>
              </button>
              <button
                onClick={() => handleLayoutChange('list')}
                className={`flex-1 p-4 border-2 rounded-lg transition-colors ${
                  config.layout === 'list'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 10h16M4 14h16M4 18h16"
                    />
                  </svg>
                  <span className="font-medium">Lista</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Widget Configuration */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Widget Disponibili</h2>
          <Badge variant={enabledCount > 0 ? 'success' : 'default'}>
            {enabledCount} attivi
          </Badge>
        </div>

        <div className="space-y-3">
          {config.widgets
            .sort((a, b) => a.order - b.order)
            .map((widget) => (
              <div
                key={widget.id}
                className={`flex items-center justify-between p-4 border-2 rounded-lg transition-all ${
                  widget.enabled
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div
                    className={`p-2 rounded-lg ${
                      widget.enabled ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {getWidgetIcon(widget.id)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{widget.name}</h3>
                    <p className="text-sm text-gray-600">{widget.description}</p>
                    {widget.refreshInterval && (
                      <p className="text-xs text-gray-500 mt-1">
                        Refresh: ogni {widget.refreshInterval}s
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => toggleWidget(widget.id)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    widget.enabled ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      widget.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
        </div>
      </div>

      {/* Reset Configuration */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Reset Configurazione</h2>
        <p className="text-sm text-gray-600 mb-4">
          Ripristina la configurazione predefinita della dashboard. Questa azione riabiliterà tutti
          i widget e resetterà le impostazioni.
        </p>

        {showResetConfirm ? (
          <div className="flex items-center space-x-3">
            <p className="text-sm font-medium text-red-600">Sei sicuro?</p>
            <Button variant="danger" size="sm" onClick={handleReset}>
              Conferma Reset
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowResetConfirm(false)}>
              Annulla
            </Button>
          </div>
        ) : (
          <Button variant="danger" onClick={() => setShowResetConfirm(true)}>
            Reset Configurazione
          </Button>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3">
        <Button variant="ghost" onClick={() => navigate('/dashboard-advanced')}>
          Annulla
        </Button>
        <Button variant="primary" onClick={() => navigate('/dashboard-advanced')}>
          Salva e Torna alla Dashboard
        </Button>
      </div>
    </div>
  );
};

export default DashboardSettingsPage;
