// ============================================================================
// EJLOG WMS - Items Analytics Widget
// Widget analisi articoli per stato (grafico a barre)
// ============================================================================

import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts';
import { useItemsAnalytics } from '../hooks/useDashboardData';
import WidgetContainer from '../components/WidgetContainer';
import EmptyWidget from '../components/EmptyWidget';

type ViewMode = 'status' | 'weekly' | 'monthly';

/**
 * Widget Items Analytics - Analisi articoli per stato
 */
export const ItemsAnalyticsWidget: React.FC = () => {
  const { data, isLoading, error } = useItemsAnalytics();
  const [viewMode, setViewMode] = useState<ViewMode>('status');

  const itemsData = data?.data;

  /**
   * Tooltip personalizzato
   */
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  /**
   * Formatta data per asse X
   */
  const formatXAxis = (date: string) => {
    const d = new Date(date);
    if (viewMode === 'weekly') {
      return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
    }
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
  };

  /**
   * Render vista per stato
   */
  const renderStatusView = () => {
    if (!itemsData) return null;

    return (
      <div className="space-y-6">
        {/* Statistiche principali */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm text-gray-600">Totale Articoli</p>
            <p className="text-2xl font-bold text-gray-900">{itemsData.totalItems}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Giacenza Media</p>
            <p className="text-2xl font-bold text-gray-900">{itemsData.averageStock.toFixed(1)}</p>
          </div>
        </div>

        {/* Grafico a barre per stato */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={itemsData.byStatus}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="status"
                tick={{ fill: '#6B7280', fontSize: 12 }}
                axisLine={{ stroke: '#E5E7EB' }}
              />
              <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={{ stroke: '#E5E7EB' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 14 }} />
              <Bar dataKey="count" name="Quantità" radius={[8, 8, 0, 0]} animationDuration={800}>
                {itemsData.byStatus.map((entry, index) => (
                  <Bar key={`bar-${index}`} dataKey="count" fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Dettagli per stato */}
        <div className="grid grid-cols-2 gap-3">
          {itemsData.byStatus.map((status) => (
            <div
              key={status.status}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: status.color }} />
                <div>
                  <p className="text-sm font-medium text-gray-900">{status.status}</p>
                  <p className="text-xs text-gray-600">{status.percentage}%</p>
                </div>
              </div>
              <p className="text-lg font-bold text-gray-900">{status.count}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  /**
   * Render vista trend settimanale
   */
  const renderWeeklyTrendView = () => {
    if (!itemsData) return null;

    return (
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-700">Trend Ultimi 7 Giorni</h4>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={itemsData.weeklyTrend}>
              <defs>
                <linearGradient id="colorDisponibili" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorRiservati" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorInTransito" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="date"
                tickFormatter={formatXAxis}
                tick={{ fill: '#6B7280', fontSize: 12 }}
              />
              <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="disponibili"
                name="Disponibili"
                stroke="#10B981"
                fillOpacity={1}
                fill="url(#colorDisponibili)"
              />
              <Area
                type="monotone"
                dataKey="riservati"
                name="Riservati"
                stroke="#F59E0B"
                fillOpacity={1}
                fill="url(#colorRiservati)"
              />
              <Area
                type="monotone"
                dataKey="inTransito"
                name="In Transito"
                stroke="#3B82F6"
                fillOpacity={1}
                fill="url(#colorInTransito)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  /**
   * Render vista trend mensile
   */
  const renderMonthlyTrendView = () => {
    if (!itemsData) return null;

    return (
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-700">Trend Ultimi 30 Giorni</h4>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={itemsData.monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="date"
                tickFormatter={formatXAxis}
                tick={{ fill: '#6B7280', fontSize: 11 }}
              />
              <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="disponibili"
                name="Disponibili"
                stroke="#10B981"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="riservati"
                name="Riservati"
                stroke="#F59E0B"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="inTransito"
                name="In Transito"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="bloccati"
                name="Bloccati"
                stroke="#EF4444"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <WidgetContainer
      title="Analisi Articoli"
      subtitle="Articoli per stato e trend temporale"
      isLoading={isLoading}
      error={error ? 'Errore nel caricamento dati articoli' : null}
      icon={
        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      }
      headerAction={
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('status')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'status'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Stati
          </button>
          <button
            onClick={() => setViewMode('weekly')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'weekly'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            7 Giorni
          </button>
          <button
            onClick={() => setViewMode('monthly')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'monthly'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            30 Giorni
          </button>
        </div>
      }
    >
      {!itemsData ? (
        <EmptyWidget
          title="Nessun articolo"
          message="Non ci sono articoli da visualizzare."
          icon="data"
        />
      ) : (
        <>
          {viewMode === 'status' && renderStatusView()}
          {viewMode === 'weekly' && renderWeeklyTrendView()}
          {viewMode === 'monthly' && renderMonthlyTrendView()}
        </>
      )}
    </WidgetContainer>
  );
};

export default ItemsAnalyticsWidget;
