// ============================================================================
// EJLOG WMS - Location Heatmap Analytics Component
// Advanced analytics with heatmap visualization for location performance
// ============================================================================

import React, { useState, useMemo } from 'react';
import Card from '../shared/Card';
import Button from '../shared/Button';
import Select from '../shared/Select';
import { Location } from '../../types/location';

interface LocationHeatmapAnalyticsProps {
  locations: Location[];
  warehouseId?: string;
  zoneId?: string;
}

type MetricType =
  | 'utilization'
  | 'turnover'
  | 'access_frequency'
  | 'idle_time'
  | 'errors';

type TimeRange = '24h' | '7d' | '30d' | '90d';

interface HeatmapCell {
  location: Location;
  value: number;
  color: string;
  label: string;
}

const LocationHeatmapAnalytics: React.FC<LocationHeatmapAnalyticsProps> = ({
  locations,
  warehouseId,
  zoneId,
}) => {
  const [metricType, setMetricType] = useState<MetricType>('utilization');
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Calculate metric value for a location
  const calculateMetric = (location: Location, metric: MetricType): number => {
    switch (metric) {
      case 'utilization':
        return location.capacity.utilizationPercent;

      case 'turnover':
        // Mock turnover rate (movements per day)
        // In real app, this would come from historical data
        return Math.random() * 20;

      case 'access_frequency':
        // Mock access frequency (accesses per hour)
        return Math.random() * 10;

      case 'idle_time':
        // Mock idle time percentage (0-100)
        return Math.random() * 100;

      case 'errors':
        // Mock error count
        return Math.floor(Math.random() * 5);

      default:
        return 0;
    }
  };

  // Get color for heatmap based on metric and value
  const getHeatmapColor = (metric: MetricType, value: number): string => {
    switch (metric) {
      case 'utilization':
        if (value >= 90) return '#dc2626'; // red-600
        if (value >= 75) return '#f59e0b'; // amber-500
        if (value >= 50) return '#22c55e'; // green-500
        if (value >= 25) return '#3b82f6'; // blue-500
        return '#9ca3af'; // gray-400

      case 'turnover':
        if (value >= 15) return '#dc2626'; // high turnover - hot
        if (value >= 10) return '#f59e0b';
        if (value >= 5) return '#22c55e';
        return '#3b82f6'; // low turnover - cold

      case 'access_frequency':
        if (value >= 8) return '#dc2626';
        if (value >= 5) return '#f59e0b';
        if (value >= 2) return '#22c55e';
        return '#3b82f6';

      case 'idle_time':
        if (value >= 80) return '#dc2626'; // high idle - bad
        if (value >= 60) return '#f59e0b';
        if (value >= 40) return '#22c55e';
        return '#3b82f6'; // low idle - good

      case 'errors':
        if (value >= 4) return '#dc2626';
        if (value >= 2) return '#f59e0b';
        if (value >= 1) return '#22c55e';
        return '#3b82f6'; // no errors

      default:
        return '#9ca3af';
    }
  };

  // Generate heatmap data
  const heatmapData = useMemo(() => {
    const filtered = locations.filter((loc) => {
      if (warehouseId && loc.warehouseId !== warehouseId) return false;
      if (zoneId && loc.zoneId !== zoneId) return false;
      return true;
    });

    return filtered.map((location) => {
      const value = calculateMetric(location, metricType);
      const color = getHeatmapColor(metricType, value);
      const label = getMetricLabel(metricType, value);

      return { location, value, color, label };
    });
  }, [locations, warehouseId, zoneId, metricType, timeRange]);

  const getMetricLabel = (metric: MetricType, value: number): string => {
    switch (metric) {
      case 'utilization':
        return `${value.toFixed(1)}%`;
      case 'turnover':
        return `${value.toFixed(1)}/day`;
      case 'access_frequency':
        return `${value.toFixed(1)}/hr`;
      case 'idle_time':
        return `${value.toFixed(1)}%`;
      case 'errors':
        return `${Math.floor(value)}`;
      default:
        return value.toFixed(1);
    }
  };

  // Statistics
  const stats = useMemo(() => {
    if (heatmapData.length === 0)
      return { avg: 0, min: 0, max: 0, median: 0, stdDev: 0 };

    const values = heatmapData.map((d) => d.value).sort((a, b) => a - b);
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    const min = values[0];
    const max = values[values.length - 1];
    const median = values[Math.floor(values.length / 2)];

    // Standard deviation
    const variance =
      values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return { avg, min, max, median, stdDev };
  }, [heatmapData]);

  // Sort and categorize
  const sortedData = useMemo(() => {
    return [...heatmapData].sort((a, b) => b.value - a.value);
  }, [heatmapData]);

  const categories = useMemo(() => {
    const total = heatmapData.length;
    return {
      critical: heatmapData.filter((d) => d.color === '#dc2626').length,
      warning: heatmapData.filter((d) => d.color === '#f59e0b').length,
      good: heatmapData.filter((d) => d.color === '#22c55e').length,
      excellent: heatmapData.filter((d) => d.color === '#3b82f6').length,
    };
  }, [heatmapData]);

  const exportData = () => {
    const data = heatmapData.map((d) => ({
      locationCode: d.location.code,
      warehouse: d.location.warehouseName,
      zone: d.location.zoneName,
      metric: metricType,
      value: d.value,
      category: getCategoryFromColor(d.color),
    }));

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `location_heatmap_${metricType}_${timeRange}_${new Date().toISOString()}.json`;
    a.click();
  };

  const getCategoryFromColor = (color: string): string => {
    switch (color) {
      case '#dc2626':
        return 'CRITICAL';
      case '#f59e0b':
        return 'WARNING';
      case '#22c55e':
        return 'GOOD';
      case '#3b82f6':
        return 'EXCELLENT';
      default:
        return 'UNKNOWN';
    }
  };

  const getMetricDescription = (metric: MetricType): string => {
    switch (metric) {
      case 'utilization':
        return 'Percentuale di utilizzo capacità ubicazione (peso/volume)';
      case 'turnover':
        return 'Frequenza di rotazione merce (movimenti per giorno)';
      case 'access_frequency':
        return 'Frequenza di accesso ubicazione (accessi per ora)';
      case 'idle_time':
        return 'Tempo di inattività ubicazione (percentuale tempo senza movimenti)';
      case 'errors':
        return 'Numero di errori registrati (discrepanze inventario, errori picking)';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <Card title="Configurazione Heatmap">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Metrica
            </label>
            <Select
              value={metricType}
              onChange={(e) => setMetricType(e.target.value as MetricType)}
              options={[
                { value: 'utilization', label: '📊 Utilizzo' },
                { value: 'turnover', label: '🔄 Rotazione' },
                { value: 'access_frequency', label: '🚶 Frequenza Accesso' },
                { value: 'idle_time', label: '⏸️ Tempo Inattività' },
                { value: 'errors', label: '⚠️ Errori' },
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Periodo
            </label>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              options={[
                { value: '24h', label: 'Ultime 24 ore' },
                { value: '7d', label: 'Ultimi 7 giorni' },
                { value: '30d', label: 'Ultimi 30 giorni' },
                { value: '90d', label: 'Ultimi 90 giorni' },
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vista
            </label>
            <Select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as 'grid' | 'list')}
              options={[
                { value: 'grid', label: '⊞ Griglia' },
                { value: 'list', label: '📋 Lista' },
              ]}
            />
          </div>
          <div className="flex items-end">
            <Button variant="secondary" className="w-full" onClick={exportData}>
              💾 Esporta Dati
            </Button>
          </div>
        </div>
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-900">
          <strong>{metricType.charAt(0).toUpperCase() + metricType.slice(1)}:</strong>{' '}
          {getMetricDescription(metricType)}
        </div>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card className="p-4 text-center">
          <p className="text-xs text-gray-600 mb-1">Media</p>
          <p className="text-2xl font-bold text-gray-900">
            {getMetricLabel(metricType, stats.avg)}
          </p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-gray-600 mb-1">Minimo</p>
          <p className="text-2xl font-bold text-green-900">
            {getMetricLabel(metricType, stats.min)}
          </p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-gray-600 mb-1">Massimo</p>
          <p className="text-2xl font-bold text-red-900">
            {getMetricLabel(metricType, stats.max)}
          </p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-gray-600 mb-1">Mediana</p>
          <p className="text-2xl font-bold text-blue-900">
            {getMetricLabel(metricType, stats.median)}
          </p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-gray-600 mb-1">Dev. Std.</p>
          <p className="text-2xl font-bold text-purple-900">
            {getMetricLabel(metricType, stats.stdDev)}
          </p>
        </Card>
      </div>

      {/* Categories Distribution */}
      <Card title="Distribuzione Categorie">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg text-center">
            <p className="text-sm text-red-700 font-medium mb-2">🔴 Critico</p>
            <p className="text-3xl font-bold text-red-900">{categories.critical}</p>
            <p className="text-xs text-red-600 mt-1">
              {heatmapData.length > 0
                ? ((categories.critical / heatmapData.length) * 100).toFixed(1)
                : 0}
              %
            </p>
          </div>
          <div className="p-4 bg-orange-50 border-2 border-orange-200 rounded-lg text-center">
            <p className="text-sm text-orange-700 font-medium mb-2">🟠 Attenzione</p>
            <p className="text-3xl font-bold text-orange-900">{categories.warning}</p>
            <p className="text-xs text-orange-600 mt-1">
              {heatmapData.length > 0
                ? ((categories.warning / heatmapData.length) * 100).toFixed(1)
                : 0}
              %
            </p>
          </div>
          <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg text-center">
            <p className="text-sm text-green-700 font-medium mb-2">🟢 Buono</p>
            <p className="text-3xl font-bold text-green-900">{categories.good}</p>
            <p className="text-xs text-green-600 mt-1">
              {heatmapData.length > 0
                ? ((categories.good / heatmapData.length) * 100).toFixed(1)
                : 0}
              %
            </p>
          </div>
          <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg text-center">
            <p className="text-sm text-blue-700 font-medium mb-2">🔵 Eccellente</p>
            <p className="text-3xl font-bold text-blue-900">{categories.excellent}</p>
            <p className="text-xs text-blue-600 mt-1">
              {heatmapData.length > 0
                ? ((categories.excellent / heatmapData.length) * 100).toFixed(1)
                : 0}
              %
            </p>
          </div>
        </div>
      </Card>

      {/* Heatmap Visualization */}
      <Card title={`Heatmap - ${heatmapData.length} Ubicazioni`}>
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
            {heatmapData.map((cell) => (
              <div
                key={cell.location.id}
                className="aspect-square rounded-lg p-2 flex flex-col items-center justify-center cursor-pointer hover:ring-2 hover:ring-gray-900 transition-all"
                style={{ backgroundColor: cell.color }}
                title={`${cell.location.code}\n${metricType}: ${cell.label}`}
              >
                <span className="text-xs font-bold text-white drop-shadow-md">
                  {cell.label}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {sortedData.map((cell, index) => (
              <div
                key={cell.location.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
              >
                <div className="flex-shrink-0 w-8 h-8 text-lg font-bold text-gray-500 text-center">
                  {index + 1}
                </div>
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center font-bold text-white"
                  style={{ backgroundColor: cell.color }}
                >
                  {cell.label}
                </div>
                <div className="flex-1">
                  <p className="font-mono font-bold text-gray-900">
                    {cell.location.code}
                  </p>
                  <p className="text-xs text-gray-600">
                    {cell.location.warehouseName} → {cell.location.zoneName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {getCategoryFromColor(cell.color)}
                  </p>
                  <p className="text-xs text-gray-600">
                    {cell.location.status} | {cell.location.type}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Legend */}
      <Card title="Legenda Colori" className="bg-gray-50">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-red-600"></div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Critico</p>
              <p className="text-xs text-gray-600">Richiede azione immediata</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-amber-500"></div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Attenzione</p>
              <p className="text-xs text-gray-600">Monitorare attentamente</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-green-500"></div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Buono</p>
              <p className="text-xs text-gray-600">Performance adeguata</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-500"></div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Eccellente</p>
              <p className="text-xs text-gray-600">Performance ottimale</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default LocationHeatmapAnalytics;
