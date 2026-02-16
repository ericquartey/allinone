// ============================================================================
// EJLOG WMS - Location Statistics Component
// Aggregate statistics and analytics for locations
// ============================================================================

import React from 'react';
import Card from '../shared/Card';
import { Location } from '../../types/location';

interface LocationStatisticsProps {
  locations: Location[];
  title?: string;
  showDetails?: boolean;
}

const LocationStatistics: React.FC<LocationStatisticsProps> = ({
  locations,
  title = 'Statistiche Ubicazioni',
  showDetails = true,
}) => {
  // Calculate statistics
  const total = locations.length;
  const available = locations.filter((l) => l.status === 'AVAILABLE').length;
  const occupied = locations.filter((l) => l.isOccupied).length;
  const reserved = locations.filter((l) => l.status === 'RESERVED').length;
  const blocked = locations.filter((l) => l.status === 'BLOCKED').length;
  const maintenance = locations.filter((l) => l.status === 'MAINTENANCE').length;

  const avgUtilization =
    total > 0
      ? locations.reduce((sum, l) => sum + l.capacity.utilizationPercent, 0) / total
      : 0;

  const totalCapacity = {
    maxWeight: locations.reduce((sum, l) => sum + l.capacity.maxWeight, 0),
    currentWeight: locations.reduce((sum, l) => sum + l.capacity.currentWeight, 0),
    maxVolume: locations.reduce((sum, l) => sum + l.capacity.maxVolume, 0),
    currentVolume: locations.reduce((sum, l) => sum + l.capacity.currentVolume, 0),
  };

  // Type distribution
  const typeDistribution = locations.reduce((acc, l) => {
    acc[l.type] = (acc[l.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Warehouse distribution
  const warehouseDistribution = locations.reduce((acc, l) => {
    acc[l.warehouseName] = (acc[l.warehouseName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Main Statistics */}
      <Card title={title}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg text-center">
            <p className="text-xs text-blue-600 font-medium">Totale</p>
            <p className="text-3xl font-bold text-blue-900">{total}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg text-center">
            <p className="text-xs text-green-600 font-medium">Disponibili</p>
            <p className="text-3xl font-bold text-green-900">{available}</p>
            <p className="text-xs text-green-600 mt-1">
              {total > 0 ? ((available / total) * 100).toFixed(1) : 0}%
            </p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg text-center">
            <p className="text-xs text-orange-600 font-medium">Occupate</p>
            <p className="text-3xl font-bold text-orange-900">{occupied}</p>
            <p className="text-xs text-orange-600 mt-1">
              {total > 0 ? ((occupied / total) * 100).toFixed(1) : 0}%
            </p>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg text-center">
            <p className="text-xs text-yellow-600 font-medium">Riservate</p>
            <p className="text-3xl font-bold text-yellow-900">{reserved}</p>
            <p className="text-xs text-yellow-600 mt-1">
              {total > 0 ? ((reserved / total) * 100).toFixed(1) : 0}%
            </p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg text-center">
            <p className="text-xs text-red-600 font-medium">Bloccate</p>
            <p className="text-3xl font-bold text-red-900">{blocked}</p>
            <p className="text-xs text-red-600 mt-1">
              {total > 0 ? ((blocked / total) * 100).toFixed(1) : 0}%
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg text-center">
            <p className="text-xs text-purple-600 font-medium">Manutenzione</p>
            <p className="text-3xl font-bold text-purple-900">{maintenance}</p>
            <p className="text-xs text-purple-600 mt-1">
              {total > 0 ? ((maintenance / total) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>
      </Card>

      {showDetails && (
        <>
          {/* Utilization */}
          <Card title="Utilizzo Capacità">
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700">Utilizzo Medio</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {avgUtilization.toFixed(1)}%
                  </p>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-4">
                  <div
                    className="bg-blue-600 h-4 rounded-full transition-all"
                    style={{ width: `${avgUtilization}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    Capacità Peso (kg)
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Corrente:</span>
                      <span className="font-semibold">
                        {totalCapacity.currentWeight.toLocaleString('it-IT')} kg
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Massimo:</span>
                      <span className="font-semibold">
                        {totalCapacity.maxWeight.toLocaleString('it-IT')} kg
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${
                            (totalCapacity.currentWeight / totalCapacity.maxWeight) * 100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    Capacità Volume (m³)
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Corrente:</span>
                      <span className="font-semibold">
                        {totalCapacity.currentVolume.toFixed(2)} m³
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Massimo:</span>
                      <span className="font-semibold">
                        {totalCapacity.maxVolume.toFixed(2)} m³
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{
                          width: `${
                            (totalCapacity.currentVolume / totalCapacity.maxVolume) * 100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Type Distribution */}
          <Card title="Distribuzione per Tipo">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.entries(typeDistribution)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => (
                  <div key={type} className="p-3 border border-gray-200 rounded-lg">
                    <p className="text-xs text-gray-600">{type}</p>
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                    <p className="text-xs text-gray-500">
                      {total > 0 ? ((count / total) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                ))}
            </div>
          </Card>

          {/* Warehouse Distribution */}
          {Object.keys(warehouseDistribution).length > 1 && (
            <Card title="Distribuzione per Magazzino">
              <div className="space-y-3">
                {Object.entries(warehouseDistribution)
                  .sort(([, a], [, b]) => b - a)
                  .map(([warehouse, count]) => (
                    <div
                      key={warehouse}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{warehouse}</p>
                        <p className="text-xs text-gray-500">
                          {count} ubicazioni (
                          {total > 0 ? ((count / total) * 100).toFixed(1) : 0}%)
                        </p>
                      </div>
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(count / total) * 100}%` }}
                        ></div>
                      </div>
                      <span className="ml-3 text-lg font-bold text-gray-900">{count}</span>
                    </div>
                  ))}
              </div>
            </Card>
          )}

          {/* Health Indicators */}
          <Card title="Indicatori di Salute">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                className={`p-4 rounded-lg ${
                  (blocked / total) * 100 > 10
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-green-50 border border-green-200'
                }`}
              >
                <p className="text-xs font-medium text-gray-700 mb-1">Ubicazioni Bloccate</p>
                <p className="text-2xl font-bold">
                  {blocked > 0 ? `⚠️ ${blocked}` : '✅ 0'}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {(blocked / total) * 100 > 10
                    ? 'Attenzione: livello alto'
                    : 'Livello normale'}
                </p>
              </div>

              <div
                className={`p-4 rounded-lg ${
                  avgUtilization > 85
                    ? 'bg-yellow-50 border border-yellow-200'
                    : avgUtilization > 95
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-green-50 border border-green-200'
                }`}
              >
                <p className="text-xs font-medium text-gray-700 mb-1">Utilizzo Medio</p>
                <p className="text-2xl font-bold">
                  {avgUtilization > 95
                    ? `🔴 ${avgUtilization.toFixed(1)}%`
                    : avgUtilization > 85
                    ? `🟡 ${avgUtilization.toFixed(1)}%`
                    : `🟢 ${avgUtilization.toFixed(1)}%`}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {avgUtilization > 95
                    ? 'Critico: capacità esaurita'
                    : avgUtilization > 85
                    ? 'Attenzione: quasi pieno'
                    : 'Capacità disponibile'}
                </p>
              </div>

              <div
                className={`p-4 rounded-lg ${
                  (available / total) * 100 < 10
                    ? 'bg-red-50 border border-red-200'
                    : (available / total) * 100 < 20
                    ? 'bg-yellow-50 border border-yellow-200'
                    : 'bg-green-50 border border-green-200'
                }`}
              >
                <p className="text-xs font-medium text-gray-700 mb-1">Disponibilità</p>
                <p className="text-2xl font-bold">
                  {(available / total) * 100 < 10
                    ? `🔴 ${available}`
                    : (available / total) * 100 < 20
                    ? `🟡 ${available}`
                    : `🟢 ${available}`}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {(available / total) * 100 < 10
                    ? 'Critico: poche disponibili'
                    : (available / total) * 100 < 20
                    ? 'Attenzione: bassa disponibilità'
                    : 'Buona disponibilità'}
                </p>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default LocationStatistics;
