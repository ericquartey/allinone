// ============================================================================
// EJLOG WMS - Location Capacity Planner Component
// Advanced capacity planning and space optimization tool
// ============================================================================

import React, { useState, useMemo } from 'react';
import Card from '../shared/Card';
import Button from '../shared/Button';
import Select from '../shared/Select';
import Input from '../shared/Input';
import { useGetLocationsQuery } from '../../services/api/locationApi';
import { Location, LocationType } from '../../types/location';

interface CapacityPlannerProps {
  warehouseId?: string;
  zoneId?: string;
}

interface CapacityScenario {
  name: string;
  expectedGrowth: number; // percentage
  timeframe: number; // days
}

const LocationCapacityPlanner: React.FC<CapacityPlannerProps> = ({
  warehouseId,
  zoneId,
}) => {
  const [selectedType, setSelectedType] = useState<LocationType | 'ALL'>('ALL');
  const [scenario, setScenario] = useState<CapacityScenario>({
    name: 'Current',
    expectedGrowth: 0,
    timeframe: 0,
  });

  // Get locations data
  const { data: locationsData, isLoading } = useGetLocationsQuery({
    warehouseId,
    zoneId,
    type: selectedType !== 'ALL' ? selectedType : undefined,
    pageSize: 1000, // Get all for analysis
  });

  const locations = locationsData?.locations || [];

  // Calculate capacity metrics
  const metrics = useMemo(() => {
    if (locations.length === 0) {
      return {
        totalLocations: 0,
        totalMaxWeight: 0,
        totalCurrentWeight: 0,
        totalMaxVolume: 0,
        totalCurrentVolume: 0,
        avgUtilization: 0,
        availableCapacity: { weight: 0, volume: 0 },
        projectedUtilization: { weight: 0, volume: 0 },
        daysUntilFull: { weight: Infinity, volume: Infinity },
        recommendations: [] as string[],
      };
    }

    const totalMaxWeight = locations.reduce((sum, l) => sum + l.capacity.maxWeight, 0);
    const totalCurrentWeight = locations.reduce((sum, l) => sum + l.capacity.currentWeight, 0);
    const totalMaxVolume = locations.reduce((sum, l) => sum + l.capacity.maxVolume, 0);
    const totalCurrentVolume = locations.reduce((sum, l) => sum + l.capacity.currentVolume, 0);

    const avgUtilization = locations.reduce(
      (sum, l) => sum + l.capacity.utilizationPercent,
      0
    ) / locations.length;

    const availableCapacity = {
      weight: totalMaxWeight - totalCurrentWeight,
      volume: totalMaxVolume - totalCurrentVolume,
    };

    // Calculate projected utilization with growth scenario
    const growthFactor = 1 + scenario.expectedGrowth / 100;
    const projectedWeight = totalCurrentWeight * growthFactor;
    const projectedVolume = totalCurrentVolume * growthFactor;

    const projectedUtilization = {
      weight: (projectedWeight / totalMaxWeight) * 100,
      volume: (projectedVolume / totalMaxVolume) * 100,
    };

    // Calculate days until full capacity
    const dailyWeightGrowth = (totalCurrentWeight * (scenario.expectedGrowth / 100)) / scenario.timeframe;
    const dailyVolumeGrowth = (totalCurrentVolume * (scenario.expectedGrowth / 100)) / scenario.timeframe;

    const daysUntilFull = {
      weight: dailyWeightGrowth > 0 ? availableCapacity.weight / dailyWeightGrowth : Infinity,
      volume: dailyVolumeGrowth > 0 ? availableCapacity.volume / dailyVolumeGrowth : Infinity,
    };

    // Generate recommendations
    const recommendations: string[] = [];

    if (avgUtilization > 90) {
      recommendations.push('⚠️ CRITICO: Utilizzo medio superiore al 90%. Espansione urgente necessaria.');
    } else if (avgUtilization > 80) {
      recommendations.push('⚡ Attenzione: Utilizzo medio sopra 80%. Pianificare espansione.');
    }

    if (projectedUtilization.weight > 95) {
      recommendations.push(
        `🔴 Con crescita ${scenario.expectedGrowth}% in ${scenario.timeframe} giorni, capacità peso esaurita.`
      );
    }

    if (projectedUtilization.volume > 95) {
      recommendations.push(
        `🔴 Con crescita ${scenario.expectedGrowth}% in ${scenario.timeframe} giorni, capacità volume esaurita.`
      );
    }

    if (daysUntilFull.weight < 30) {
      recommendations.push(
        `⏰ Capacità peso si esaurirà in ~${Math.floor(daysUntilFull.weight)} giorni.`
      );
    }

    if (daysUntilFull.volume < 30) {
      recommendations.push(
        `⏰ Capacità volume si esaurirà in ~${Math.floor(daysUntilFull.volume)} giorni.`
      );
    }

    const blockedCount = locations.filter(l => l.status === 'BLOCKED').length;
    if (blockedCount > locations.length * 0.1) {
      recommendations.push(
        `🔧 ${blockedCount} ubicazioni bloccate (${((blockedCount / locations.length) * 100).toFixed(1)}%). Verificare e liberare.`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ Capacità adeguata. Nessuna azione immediata richiesta.');
    }

    return {
      totalLocations: locations.length,
      totalMaxWeight,
      totalCurrentWeight,
      totalMaxVolume,
      totalCurrentVolume,
      avgUtilization,
      availableCapacity,
      projectedUtilization,
      daysUntilFull,
      recommendations,
    };
  }, [locations, scenario]);

  // Identify bottlenecks
  const bottlenecks = useMemo(() => {
    return locations
      .filter(l => l.capacity.utilizationPercent > 90)
      .sort((a, b) => b.capacity.utilizationPercent - a.capacity.utilizationPercent)
      .slice(0, 10);
  }, [locations]);

  // Identify underutilized
  const underutilized = useMemo(() => {
    return locations
      .filter(l => l.capacity.utilizationPercent < 20 && l.status === 'AVAILABLE')
      .sort((a, b) => a.capacity.utilizationPercent - b.capacity.utilizationPercent)
      .slice(0, 10);
  }, [locations]);

  const predefinedScenarios: CapacityScenario[] = [
    { name: 'Current', expectedGrowth: 0, timeframe: 0 },
    { name: 'Low Growth', expectedGrowth: 10, timeframe: 30 },
    { name: 'Medium Growth', expectedGrowth: 25, timeframe: 30 },
    { name: 'High Growth', expectedGrowth: 50, timeframe: 30 },
    { name: 'Seasonal Peak', expectedGrowth: 100, timeframe: 15 },
  ];

  if (isLoading) {
    return <Card title="Capacity Planner"><p>Loading...</p></Card>;
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card title="Scenario Planning">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Location Type Filter
            </label>
            <Select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as LocationType | 'ALL')}
              options={[
                { value: 'ALL', label: 'All Types' },
                { value: 'RACK', label: 'Rack' },
                { value: 'BUFFER', label: 'Buffer' },
                { value: 'PICKING', label: 'Picking' },
                { value: 'STORAGE', label: 'Storage' },
              ]}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Growth Scenario
            </label>
            <Select
              value={scenario.name}
              onChange={(e) => {
                const selected = predefinedScenarios.find(s => s.name === e.target.value);
                if (selected) setScenario(selected);
              }}
              options={predefinedScenarios.map(s => ({ value: s.name, label: s.name }))}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Custom Growth (%)
            </label>
            <Input
              type="number"
              value={scenario.expectedGrowth}
              onChange={(e) =>
                setScenario(prev => ({ ...prev, expectedGrowth: parseFloat(e.target.value) || 0 }))
              }
              min="0"
              max="200"
            />
          </div>
        </div>
      </Card>

      {/* Current Capacity Overview */}
      <Card title="Current Capacity">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-600 font-medium">Total Locations</p>
            <p className="text-3xl font-bold text-blue-900">{metrics.totalLocations}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-xs text-green-600 font-medium">Avg Utilization</p>
            <p className="text-3xl font-bold text-green-900">
              {metrics.avgUtilization.toFixed(1)}%
            </p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg">
            <p className="text-xs text-orange-600 font-medium">Weight Capacity</p>
            <p className="text-xl font-bold text-orange-900">
              {((metrics.totalCurrentWeight / metrics.totalMaxWeight) * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-orange-600 mt-1">
              {metrics.totalCurrentWeight.toLocaleString()} / {metrics.totalMaxWeight.toLocaleString()} kg
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-xs text-purple-600 font-medium">Volume Capacity</p>
            <p className="text-xl font-bold text-purple-900">
              {((metrics.totalCurrentVolume / metrics.totalMaxVolume) * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-purple-600 mt-1">
              {metrics.totalCurrentVolume.toFixed(2)} / {metrics.totalMaxVolume.toFixed(2)} m³
            </p>
          </div>
        </div>
      </Card>

      {/* Projected Capacity */}
      {scenario.expectedGrowth > 0 && (
        <Card title={`Projected Capacity (${scenario.name})`}>
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Weight Projection</h4>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Projected Utilization</span>
                <span className="text-2xl font-bold text-blue-900">
                  {metrics.projectedUtilization.weight.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className={`h-4 rounded-full ${
                    metrics.projectedUtilization.weight > 95
                      ? 'bg-red-600'
                      : metrics.projectedUtilization.weight > 85
                      ? 'bg-yellow-600'
                      : 'bg-green-600'
                  }`}
                  style={{ width: `${Math.min(metrics.projectedUtilization.weight, 100)}%` }}
                ></div>
              </div>
              {metrics.daysUntilFull.weight !== Infinity && (
                <p className="text-xs text-gray-600 mt-2">
                  Capacità esaurita in ~{Math.floor(metrics.daysUntilFull.weight)} giorni
                </p>
              )}
            </div>

            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Volume Projection</h4>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Projected Utilization</span>
                <span className="text-2xl font-bold text-purple-900">
                  {metrics.projectedUtilization.volume.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className={`h-4 rounded-full ${
                    metrics.projectedUtilization.volume > 95
                      ? 'bg-red-600'
                      : metrics.projectedUtilization.volume > 85
                      ? 'bg-yellow-600'
                      : 'bg-green-600'
                  }`}
                  style={{ width: `${Math.min(metrics.projectedUtilization.volume, 100)}%` }}
                ></div>
              </div>
              {metrics.daysUntilFull.volume !== Infinity && (
                <p className="text-xs text-gray-600 mt-2">
                  Capacità esaurita in ~{Math.floor(metrics.daysUntilFull.volume)} giorni
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Recommendations */}
      <Card title="Recommendations">
        <div className="space-y-2">
          {metrics.recommendations.map((rec, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg ${
                rec.startsWith('⚠️') || rec.startsWith('🔴')
                  ? 'bg-red-50 border border-red-200'
                  : rec.startsWith('⚡') || rec.startsWith('⏰')
                  ? 'bg-yellow-50 border border-yellow-200'
                  : rec.startsWith('🔧')
                  ? 'bg-orange-50 border border-orange-200'
                  : 'bg-green-50 border border-green-200'
              }`}
            >
              <p className="text-sm font-medium text-gray-900">{rec}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Bottlenecks */}
      {bottlenecks.length > 0 && (
        <Card title="Bottlenecks (>90% Utilization)">
          <div className="space-y-2">
            {bottlenecks.map((location) => (
              <div
                key={location.id}
                className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">{location.code}</p>
                  <p className="text-xs text-gray-600">
                    {location.warehouseName} → {location.zoneName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-red-900">
                    {location.capacity.utilizationPercent.toFixed(1)}%
                  </p>
                  <p className="text-xs text-red-700">Critical</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Underutilized */}
      {underutilized.length > 0 && (
        <Card title="Underutilized (<20% Utilization)">
          <div className="space-y-2">
            {underutilized.map((location) => (
              <div
                key={location.id}
                className="flex items-center justify-between p-3 bg-blue-50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">{location.code}</p>
                  <p className="text-xs text-gray-600">
                    {location.warehouseName} → {location.zoneName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-900">
                    {location.capacity.utilizationPercent.toFixed(1)}%
                  </p>
                  <p className="text-xs text-blue-700">Optimize</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Export Actions */}
      <div className="flex gap-2">
        <Button
          variant="primary"
          onClick={() => {
            const report = {
              timestamp: new Date().toISOString(),
              scenario: scenario.name,
              metrics,
              bottlenecks: bottlenecks.map(l => ({ code: l.code, utilization: l.capacity.utilizationPercent })),
              recommendations: metrics.recommendations,
            };
            const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `capacity-report-${new Date().toISOString()}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          📥 Export Report
        </Button>
        <Button variant="ghost">
          📊 Generate PDF
        </Button>
      </div>
    </div>
  );
};

export default LocationCapacityPlanner;
