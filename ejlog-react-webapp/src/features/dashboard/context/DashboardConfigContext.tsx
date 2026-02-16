// ============================================================================
// EJLOG WMS - Dashboard Config Context
// Gestione configurazione widget e preferenze dashboard
// ============================================================================

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { DashboardConfig, WidgetConfig, WidgetType } from '../types/dashboard.types';

/**
 * Configurazione default dashboard
 */
const DEFAULT_CONFIG: DashboardConfig = {
  widgets: [
    {
      id: 'kpi_cards' as WidgetType,
      name: 'KPI Cards',
      description: 'Metriche chiave del sistema',
      enabled: true,
      order: 1,
      refreshInterval: 30,
    },
    {
      id: 'products_overview' as WidgetType,
      name: 'Prodotti Overview',
      description: 'Distribuzione prodotti per categoria',
      enabled: true,
      order: 2,
      refreshInterval: 60,
    },
    {
      id: 'items_analytics' as WidgetType,
      name: 'Articoli Analytics',
      description: 'Analisi articoli per stato',
      enabled: true,
      order: 3,
      refreshInterval: 60,
    },
    {
      id: 'movements_realtime' as WidgetType,
      name: 'Movimenti Real-time',
      description: 'Movimenti in entrata/uscita',
      enabled: true,
      order: 4,
      refreshInterval: 30,
    },
    {
      id: 'locations_heatmap' as WidgetType,
      name: 'Heatmap Ubicazioni',
      description: 'Utilizzo ubicazioni magazzino',
      enabled: true,
      order: 5,
      refreshInterval: 120,
    },
  ],
  layout: 'grid',
  autoRefresh: true,
  refreshInterval: 60,
};

const STORAGE_KEY = 'ejlog_dashboard_config';

interface DashboardConfigContextValue {
  config: DashboardConfig;
  updateConfig: (config: Partial<DashboardConfig>) => void;
  toggleWidget: (widgetId: WidgetType) => void;
  reorderWidgets: (widgetIds: WidgetType[]) => void;
  resetConfig: () => void;
  isWidgetEnabled: (widgetId: WidgetType) => boolean;
  getEnabledWidgets: () => WidgetConfig[];
}

const DashboardConfigContext = createContext<DashboardConfigContextValue | undefined>(undefined);

interface DashboardConfigProviderProps {
  children: ReactNode;
}

/**
 * Provider per configurazione dashboard
 * Gestisce stato e persistenza in localStorage
 */
export const DashboardConfigProvider: React.FC<DashboardConfigProviderProps> = ({ children }) => {
  const [config, setConfig] = useState<DashboardConfig>(() => {
    // Carica configurazione da localStorage o usa default
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as DashboardConfig;
        // Merge con default per garantire nuovi widget
        return {
          ...DEFAULT_CONFIG,
          ...parsed,
          widgets: mergeWidgets(DEFAULT_CONFIG.widgets, parsed.widgets),
        };
      }
    } catch (error) {
      console.error('[DashboardConfig] Errore caricamento configurazione:', error);
    }
    return DEFAULT_CONFIG;
  });

  /**
   * Salva configurazione in localStorage quando cambia
   */
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('[DashboardConfig] Errore salvataggio configurazione:', error);
    }
  }, [config]);

  /**
   * Aggiorna configurazione parziale
   */
  const updateConfig = (updates: Partial<DashboardConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  /**
   * Toggle enable/disable widget
   */
  const toggleWidget = (widgetId: WidgetType) => {
    setConfig((prev) => ({
      ...prev,
      widgets: prev.widgets.map((w) =>
        w.id === widgetId ? { ...w, enabled: !w.enabled } : w
      ),
    }));
  };

  /**
   * Riordina widget
   */
  const reorderWidgets = (widgetIds: WidgetType[]) => {
    setConfig((prev) => {
      const widgetMap = new Map(prev.widgets.map((w) => [w.id, w]));
      const reordered = widgetIds
        .map((id, index) => {
          const widget = widgetMap.get(id);
          return widget ? { ...widget, order: index + 1 } : null;
        })
        .filter((w): w is WidgetConfig => w !== null);

      return { ...prev, widgets: reordered };
    });
  };

  /**
   * Reset configurazione a default
   */
  const resetConfig = () => {
    setConfig(DEFAULT_CONFIG);
    localStorage.removeItem(STORAGE_KEY);
  };

  /**
   * Verifica se widget è abilitato
   */
  const isWidgetEnabled = (widgetId: WidgetType): boolean => {
    return config.widgets.find((w) => w.id === widgetId)?.enabled ?? false;
  };

  /**
   * Ottieni lista widget abilitati ordinati
   */
  const getEnabledWidgets = (): WidgetConfig[] => {
    return config.widgets
      .filter((w) => w.enabled)
      .sort((a, b) => a.order - b.order);
  };

  const value: DashboardConfigContextValue = {
    config,
    updateConfig,
    toggleWidget,
    reorderWidgets,
    resetConfig,
    isWidgetEnabled,
    getEnabledWidgets,
  };

  return (
    <DashboardConfigContext.Provider value={value}>
      {children}
    </DashboardConfigContext.Provider>
  );
};

/**
 * Hook per accedere al context della dashboard
 */
export const useDashboardConfig = (): DashboardConfigContextValue => {
  const context = useContext(DashboardConfigContext);
  if (!context) {
    throw new Error('useDashboardConfig deve essere usato dentro DashboardConfigProvider');
  }
  return context;
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Merge widget salvati con widget default
 * Aggiunge nuovi widget non presenti in configurazione salvata
 */
function mergeWidgets(
  defaultWidgets: WidgetConfig[],
  savedWidgets: WidgetConfig[]
): WidgetConfig[] {
  const savedMap = new Map(savedWidgets.map((w) => [w.id, w]));
  const result: WidgetConfig[] = [];

  // Aggiungi widget salvati
  savedWidgets.forEach((w) => result.push(w));

  // Aggiungi nuovi widget non presenti
  defaultWidgets.forEach((defaultWidget) => {
    if (!savedMap.has(defaultWidget.id)) {
      result.push({ ...defaultWidget, order: result.length + 1 });
    }
  });

  return result;
}
