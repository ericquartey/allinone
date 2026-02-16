// ============================================================================
// AlertsPanel Component - Dashboard Alerts
// Pannello allarmi attivi con badge colorati e filtri
// ============================================================================

import React, { useState } from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, XCircle, Filter } from 'lucide-react';
import clsx from 'clsx';

export type AlertSeverity = 'info' | 'success' | 'warning' | 'error';

export interface Alert {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  timestamp: Date;
  source?: string;
  isRead?: boolean;
}

interface AlertsPanelProps {
  alerts: Alert[];
  maxItems?: number;
  onAlertClick?: (alert: Alert) => void;
  loading?: boolean;
}

const severityConfig = {
  info: {
    icon: AlertCircle,
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    badge: 'bg-blue-100 text-blue-700',
    dot: 'bg-blue-500',
  },
  success: {
    icon: CheckCircle,
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    badge: 'bg-green-100 text-green-700',
    dot: 'bg-green-500',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-800',
    badge: 'bg-orange-100 text-orange-700',
    dot: 'bg-orange-500',
  },
  error: {
    icon: XCircle,
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    badge: 'bg-red-100 text-red-700',
    dot: 'bg-red-500',
  },
};

const AlertsPanel: React.FC<AlertsPanelProps> = ({
  alerts,
  maxItems = 5,
  onAlertClick,
  loading = false,
}) => {
  const [filter, setFilter] = useState<AlertSeverity | 'all'>('all');

  const filteredAlerts = filter === 'all'
    ? alerts
    : alerts.filter((alert) => alert.severity === filter);

  const displayedAlerts = filteredAlerts.slice(0, maxItems);

  const severityCounts = {
    info: alerts.filter((a) => a.severity === 'info').length,
    success: alerts.filter((a) => a.severity === 'success').length,
    warning: alerts.filter((a) => a.severity === 'warning').length,
    error: alerts.filter((a) => a.severity === 'error').length,
  };

  if (loading) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-ferretto-md">
        <div className="mb-6 h-6 w-48 animate-pulse rounded bg-gray-200" />
        <div className="space-y-3">
          {[...Array(maxItems)].map((_, idx) => (
            <div key={idx} className="flex gap-3 rounded-lg border border-gray-200 p-4 animate-pulse">
              <div className="h-5 w-5 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded bg-gray-200" />
                <div className="h-3 w-1/2 rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow-ferretto-md">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Allarmi Attivi</h2>
          <p className="text-sm text-gray-500">
            {filteredAlerts.length} {filteredAlerts.length === 1 ? 'allarme' : 'allarmi'}
            {filter !== 'all' && ' filtrati'}
          </p>
        </div>

        {/* Filter dropdown */}
        <div className="relative">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as AlertSeverity | 'all')}
            className="appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2 pr-10 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:border-ferretto-red focus:outline-none focus:ring-2 focus:ring-ferretto-red/20"
          >
            <option value="all">Tutti ({alerts.length})</option>
            <option value="error">Errori ({severityCounts.error})</option>
            <option value="warning">Avvisi ({severityCounts.warning})</option>
            <option value="success">Successi ({severityCounts.success})</option>
            <option value="info">Info ({severityCounts.info})</option>
          </select>
          <Filter className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Summary badges */}
      <div className="mb-4 flex flex-wrap gap-2">
        {(Object.keys(severityConfig) as AlertSeverity[]).map((severity) => {
          const count = severityCounts[severity];
          const config = severityConfig[severity];

          if (count === 0) return null;

          return (
            <button
              key={severity}
              onClick={() => setFilter(filter === severity ? 'all' : severity)}
              className={clsx(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all',
                config.badge,
                filter === severity && 'ring-2 ring-offset-1',
                'hover:scale-105'
              )}
            >
              <div className={clsx('h-2 w-2 rounded-full', config.dot)} />
              <span className="capitalize">{severity}</span>
              <span className="ml-1 rounded-full bg-white/50 px-1.5 py-0.5">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Alerts list */}
      {displayedAlerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="mb-4 rounded-full bg-green-100 p-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <p className="text-center text-lg font-semibold text-gray-900">
            Nessun allarme attivo
          </p>
          <p className="text-center text-sm text-gray-600">
            Tutto funziona correttamente
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedAlerts.map((alert, idx) => {
            const config = severityConfig[alert.severity];
            const Icon = config.icon;

            return (
              <div
                key={alert.id}
                onClick={() => onAlertClick?.(alert)}
                className={clsx(
                  'group flex gap-3 rounded-lg border p-4 transition-all duration-200 animate-fade-in',
                  config.bg,
                  config.border,
                  onAlertClick && 'cursor-pointer hover:shadow-ferretto-md',
                  alert.isRead && 'opacity-60'
                )}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {/* Icon */}
                <div className="flex-shrink-0">
                  <Icon className={clsx('h-5 w-5', config.text)} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <h3 className={clsx('text-sm font-semibold', config.text)}>
                      {alert.title}
                    </h3>
                    {!alert.isRead && (
                      <div className={clsx('h-2 w-2 flex-shrink-0 rounded-full', config.dot)} />
                    )}
                  </div>

                  <p className="mb-2 text-sm text-gray-700 line-clamp-2">
                    {alert.message}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-gray-600">
                    {alert.source && (
                      <span className="flex items-center gap-1">
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {alert.source}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <svg
                        className="h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {alert.timestamp.toLocaleTimeString('it-IT', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View all link */}
      {filteredAlerts.length > maxItems && (
        <div className="mt-4 border-t border-gray-200 pt-4">
          <button className="w-full rounded-lg bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100">
            Visualizza tutti gli allarmi ({filteredAlerts.length})
          </button>
        </div>
      )}
    </div>
  );
};

export default AlertsPanel;
