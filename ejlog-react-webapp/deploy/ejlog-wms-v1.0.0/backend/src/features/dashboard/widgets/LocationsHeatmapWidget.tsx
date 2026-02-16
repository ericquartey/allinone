// ============================================================================
// EJLOG WMS - Locations Heatmap Widget
// Widget heatmap ubicazioni magazzino
// ============================================================================

import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useLocationsHeatmap } from '../hooks/useDashboardData';
import WidgetContainer from '../components/WidgetContainer';
import EmptyWidget from '../components/EmptyWidget';

type ViewMode = 'zones' | 'locations';

/**
 * Widget Locations Heatmap - Utilizzo ubicazioni
 */
export const LocationsHeatmapWidget: React.FC = () => {
  const { data, isLoading, error } = useLocationsHeatmap();
  const [viewMode, setViewMode] = useState<ViewMode>('zones');
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  const heatmapData = data?.data;

  /**
   * Ottieni colore basato su livello attività
   */
  const getActivityColor = (level: 'low' | 'medium' | 'high'): string => {
    switch (level) {
      case 'high':
        return '#EF4444'; // rosso
      case 'medium':
        return '#F59E0B'; // arancione
      case 'low':
        return '#10B981'; // verde
      default:
        return '#6B7280'; // grigio
    }
  };

  /**
   * Ottieni colore basato su occupancy rate
   */
  const getOccupancyColor = (rate: number): string => {
    if (rate >= 90) return '#EF4444';
    if (rate >= 75) return '#F59E0B';
    if (rate >= 50) return '#3B82F6';
    return '#10B981';
  };

  /**
   * Tooltip personalizzato
   */
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{data.zoneName || data.locationCode}</p>
          <p className="text-sm text-gray-600">
            Occupazione: {(data.averageOccupancy || data.occupancyRate).toFixed(1)}%
          </p>
          <p className="text-sm text-gray-600">
            {data.occupiedLocations
              ? `${data.occupiedLocations}/${data.totalLocations} ubicazioni`
              : `${data.itemCount} articoli`}
          </p>
          {data.activityScore !== undefined && (
            <p className="text-sm font-medium text-blue-600 mt-1">
              Attività: {data.activityScore}/100
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  /**
   * Render statistiche generali
   */
  const renderGeneralStats = () => {
    if (!heatmapData) return null;

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <p className="text-xs text-gray-600 mb-1">Totale Ubicazioni</p>
          <p className="text-xl font-bold text-gray-900">{heatmapData.totalLocations}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 mb-1">Occupate</p>
          <p className="text-xl font-bold text-blue-600">{heatmapData.occupiedLocations}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 mb-1">Occupazione Media</p>
          <p className="text-xl font-bold text-gray-900">{heatmapData.averageOccupancy.toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 mb-1">Zona + Attiva</p>
          <p className="text-sm font-medium text-green-600 mt-1">{heatmapData.mostActiveZone}</p>
        </div>
      </div>
    );
  };

  /**
   * Render vista zone
   */
  const renderZonesView = () => {
    if (!heatmapData) return null;

    return (
      <div className="space-y-4">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={heatmapData.zones}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="zoneName"
                tick={{ fill: '#6B7280', fontSize: 11 }}
                angle={-15}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="averageOccupancy" name="Occupazione %" radius={[8, 8, 0, 0]}>
                {heatmapData.zones.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getOccupancyColor(entry.averageOccupancy)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cards zone con dettagli */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {heatmapData.zones.map((zone) => (
            <div
              key={zone.zoneId}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedZone(zone.zoneName);
                setViewMode('locations');
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">{zone.zoneName}</h4>
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getOccupancyColor(zone.averageOccupancy) }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">Ubicazioni</p>
                  <p className="font-medium text-gray-900">
                    {zone.occupiedLocations}/{zone.totalLocations}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Occupazione</p>
                  <p className="font-medium text-gray-900">{zone.averageOccupancy.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-gray-600">Attività</p>
                  <div className="flex items-center space-x-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${zone.activityScore}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-700">{zone.activityScore}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  /**
   * Render vista ubicazioni
   */
  const renderLocationsView = () => {
    if (!heatmapData) return null;

    const filteredLocations = selectedZone
      ? heatmapData.locations.filter((loc) => loc.areaName === selectedZone)
      : heatmapData.locations.slice(0, 50); // Limite per performance

    return (
      <div className="space-y-4">
        {selectedZone && (
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-900">Filtrato per: {selectedZone}</p>
            <button
              onClick={() => setSelectedZone(null)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Rimuovi filtro
            </button>
          </div>
        )}

        {/* Heatmap grid ubicazioni */}
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 max-h-96 overflow-y-auto p-2">
          {filteredLocations.map((location) => (
            <div
              key={location.locationId}
              className="aspect-square rounded-lg flex flex-col items-center justify-center p-2 hover:scale-110 transition-transform cursor-pointer group relative"
              style={{
                backgroundColor: getOccupancyColor(location.occupancyRate),
                opacity: location.occupancyRate > 0 ? 1 : 0.3,
              }}
              title={`${location.locationCode} - ${location.occupancyRate}%`}
            >
              <span className="text-xs font-bold text-white text-center leading-tight">
                {location.locationCode}
              </span>

              {/* Tooltip hover */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
                  <p className="font-semibold">{location.locationCode}</p>
                  <p>Occupazione: {location.occupancyRate}%</p>
                  <p>Articoli: {location.itemCount}</p>
                  <p className="capitalize">Attività: {location.activityLevel}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Legenda */}
        <div className="flex items-center justify-center space-x-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10B981' }} />
            <span className="text-sm text-gray-700">{'<'} 50%</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3B82F6' }} />
            <span className="text-sm text-gray-700">50-75%</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#F59E0B' }} />
            <span className="text-sm text-gray-700">75-90%</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#EF4444' }} />
            <span className="text-sm text-gray-700">≥ 90%</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <WidgetContainer
      title="Heatmap Ubicazioni"
      subtitle="Utilizzo e attività ubicazioni magazzino"
      isLoading={isLoading}
      error={error ? 'Errore nel caricamento dati ubicazioni' : null}
      icon={
        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
          />
        </svg>
      }
      headerAction={
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('zones')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'zones'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Zone
          </button>
          <button
            onClick={() => setViewMode('locations')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'locations'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Ubicazioni
          </button>
        </div>
      }
    >
      {!heatmapData ? (
        <EmptyWidget
          title="Nessuna ubicazione"
          message="Non ci sono ubicazioni da visualizzare."
          icon="data"
        />
      ) : (
        <div className="space-y-4">
          {renderGeneralStats()}
          {viewMode === 'zones' && renderZonesView()}
          {viewMode === 'locations' && renderLocationsView()}
        </div>
      )}
    </WidgetContainer>
  );
};

export default LocationsHeatmapWidget;
