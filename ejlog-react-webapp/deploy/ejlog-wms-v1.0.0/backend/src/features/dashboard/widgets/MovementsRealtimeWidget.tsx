// ============================================================================
// EJLOG WMS - Movements Realtime Widget
// Widget movimenti real-time (grafico linee + area)
// ============================================================================

import React, { useState } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useMovementsRealtime } from '../hooks/useDashboardData';
import WidgetContainer from '../components/WidgetContainer';
import EmptyWidget from '../components/EmptyWidget';

type ViewMode = 'hourly' | 'daily';

/**
 * Widget Movements Realtime - Movimenti in entrata/uscita
 */
export const MovementsRealtimeWidget: React.FC = () => {
  const { data, isLoading, error } = useMovementsRealtime();
  const [viewMode, setViewMode] = useState<ViewMode>('hourly');

  const movementsData = data?.data;

  /**
   * Tooltip personalizzato
   */
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const formatLabel = viewMode === 'hourly'
        ? new Date(label).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
        : new Date(label).toLocaleDateString('it-IT');

      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{formatLabel}</p>
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
   * Formatta asse X
   */
  const formatXAxis = (value: string) => {
    const date = new Date(value);
    if (viewMode === 'hourly') {
      return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
  };

  /**
   * Render statistiche veloc ità rotazione
   */
  const renderRotationStats = () => {
    if (!movementsData) return null;

    const getTrendIcon = () => {
      if (movementsData.rotation.trend === 'up') {
        return (
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        );
      } else if (movementsData.rotation.trend === 'down') {
        return (
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        );
      }
      return (
        <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
      );
    };

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <p className="text-xs text-gray-600 mb-1">Mov/Ora</p>
          <div className="flex items-center space-x-2">
            <p className="text-xl font-bold text-gray-900">{movementsData.rotation.hourly.toFixed(1)}</p>
            {getTrendIcon()}
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-600 mb-1">Mov/Giorno</p>
          <p className="text-xl font-bold text-gray-900">{movementsData.rotation.daily}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 mb-1">Mov/Settimana</p>
          <p className="text-xl font-bold text-gray-900">{movementsData.rotation.weekly}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 mb-1">Totale Oggi</p>
          <p className="text-xl font-bold text-blue-600">{movementsData.totalToday}</p>
        </div>
      </div>
    );
  };

  /**
   * Render picchi di attività
   */
  const renderActivityPeaks = () => {
    if (!movementsData || movementsData.peaks.length === 0) return null;

    const getTypeColor = (type: string) => {
      switch (type) {
        case 'entrate':
          return 'text-green-600 bg-green-100';
        case 'uscite':
          return 'text-red-600 bg-red-100';
        default:
          return 'text-blue-600 bg-blue-100';
      }
    };

    return (
      <div className="mt-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Picchi di Attività</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {movementsData.peaks.map((peak, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{peak.time}</p>
                <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full mt-1 ${getTypeColor(peak.type)}`}>
                  {peak.type}
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{peak.count}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const chartData = viewMode === 'hourly' ? movementsData?.hourlyData : movementsData?.dailyData;

  return (
    <WidgetContainer
      title="Movimenti Real-time"
      subtitle="Andamento movimenti in entrata/uscita"
      isLoading={isLoading}
      error={error ? 'Errore nel caricamento dati movimenti' : null}
      icon={
        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
      }
      headerAction={
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('hourly')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'hourly'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            24 Ore
          </button>
          <button
            onClick={() => setViewMode('daily')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'daily'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            30 Giorni
          </button>
        </div>
      }
    >
      {!movementsData || !chartData ? (
        <EmptyWidget
          title="Nessun movimento"
          message="Non ci sono movimenti da visualizzare."
          icon="data"
        />
      ) : (
        <div className="space-y-4">
          {renderRotationStats()}

          {/* Grafico */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {viewMode === 'hourly' ? (
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorEntrate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorUscite" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatXAxis}
                    tick={{ fill: '#6B7280', fontSize: 11 }}
                  />
                  <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="entrate"
                    name="Entrate"
                    stroke="#10B981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorEntrate)"
                  />
                  <Area
                    type="monotone"
                    dataKey="uscite"
                    name="Uscite"
                    stroke="#EF4444"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorUscite)"
                  />
                  <Area
                    type="monotone"
                    dataKey="trasferimenti"
                    name="Trasferimenti"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fillOpacity={0}
                  />
                </AreaChart>
              ) : (
                <LineChart data={chartData}>
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
                    dataKey="entrate"
                    name="Entrate"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="uscite"
                    name="Uscite"
                    stroke="#EF4444"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="trasferimenti"
                    name="Trasferimenti"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>

          {renderActivityPeaks()}
        </div>
      )}
    </WidgetContainer>
  );
};

export default MovementsRealtimeWidget;
