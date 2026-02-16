// ============================================================================
// EJLOG WMS - Replenishment Suggestions Component
// Smart replenishment recommendations based on location utilization and demand
// ============================================================================

import React, { useMemo, useState } from 'react';
import Card from '../shared/Card';
import Button from '../shared/Button';
import Select from '../shared/Select';
import { Location } from '../../types/location';
import { useNavigate } from 'react-router-dom';

interface ReplenishmentSuggestionsProps {
  locations: Location[];
  warehouseId?: string;
  zoneId?: string;
  onRefresh?: () => void;
}

interface ReplenishmentSuggestion {
  sourceLocation: Location;
  targetLocation: Location;
  itemCode?: string;
  itemDescription?: string;
  suggestedQuantity: number;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  reason: string;
  estimatedTime: number; // minutes
  distance: number; // meters
  score: number; // 0-100
}

type SortBy = 'priority' | 'score' | 'distance' | 'time';

const ReplenishmentSuggestions: React.FC<ReplenishmentSuggestionsProps> = ({
  locations,
  warehouseId,
  zoneId,
  onRefresh,
}) => {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<SortBy>('priority');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');

  // Calculate replenishment suggestions
  const suggestions = useMemo(() => {
    const result: ReplenishmentSuggestion[] = [];

    // Filter locations by warehouse/zone
    const filteredLocations = locations.filter((loc) => {
      if (warehouseId && loc.warehouseId !== warehouseId) return false;
      if (zoneId && loc.zoneId !== zoneId) return false;
      return true;
    });

    // Find source locations (high utilization in reserve)
    const sourceLocations = filteredLocations.filter(
      (loc) =>
        loc.type === 'RESERVE' &&
        loc.isOccupied &&
        loc.capacity.utilizationPercent > 10
    );

    // Find target locations (low utilization in picking or empty)
    const targetLocations = filteredLocations.filter(
      (loc) =>
        (loc.type === 'PICKING' || loc.type === 'BUFFER') &&
        loc.capacity.utilizationPercent < 30
    );

    // Generate suggestions
    sourceLocations.forEach((source) => {
      if (!source.occupancy) return;

      // Find best target for this item
      const compatibleTargets = targetLocations.filter((target) => {
        // Check if target can accept this item
        if (target.restrictions.allowedItemCodes.length > 0) {
          return target.restrictions.allowedItemCodes.includes(
            source.occupancy!.itemCode
          );
        }
        return true;
      });

      compatibleTargets.forEach((target) => {
        const availableCapacity =
          target.capacity.maxWeight - target.capacity.currentWeight;
        const suggestedQuantity = Math.min(
          source.occupancy!.quantity,
          availableCapacity
        );

        if (suggestedQuantity <= 0) return;

        // Calculate distance (simplified Euclidean)
        const distance = Math.sqrt(
          Math.pow(source.coordinates.x - target.coordinates.x, 2) +
            Math.pow(source.coordinates.y - target.coordinates.y, 2)
        );

        // Calculate priority
        const targetUtilization = target.capacity.utilizationPercent;
        let priority: ReplenishmentSuggestion['priority'] = 'LOW';
        if (targetUtilization < 10) priority = 'CRITICAL';
        else if (targetUtilization < 20) priority = 'HIGH';
        else if (targetUtilization < 30) priority = 'MEDIUM';

        // Calculate score (0-100)
        const urgencyScore = 100 - targetUtilization;
        const proximityScore = Math.max(0, 100 - distance * 10);
        const capacityScore =
          (suggestedQuantity / source.occupancy!.quantity) * 100;
        const score = (urgencyScore * 0.5 + proximityScore * 0.3 + capacityScore * 0.2);

        // Estimate time (2 minutes per 10 meters + 3 minutes handling)
        const estimatedTime = Math.ceil((distance / 10) * 2 + 3);

        result.push({
          sourceLocation: source,
          targetLocation: target,
          itemCode: source.occupancy!.itemCode,
          itemDescription: source.occupancy!.itemDescription,
          suggestedQuantity,
          priority,
          reason: getPriorityReason(priority, targetUtilization, distance),
          estimatedTime,
          distance,
          score,
        });
      });
    });

    return result;
  }, [locations, warehouseId, zoneId]);

  const getPriorityReason = (
    priority: ReplenishmentSuggestion['priority'],
    utilization: number,
    distance: number
  ): string => {
    if (priority === 'CRITICAL') {
      return `Ubicazione picking quasi vuota (${utilization.toFixed(1)}%)`;
    }
    if (priority === 'HIGH') {
      return `Basso livello picking (${utilization.toFixed(1)}%), riapprovvigionamento urgente`;
    }
    if (priority === 'MEDIUM') {
      return `Livello picking sotto soglia (${utilization.toFixed(1)}%)`;
    }
    return `Ottimizzazione capacità (distanza: ${distance.toFixed(1)}m)`;
  };

  // Sort suggestions
  const sortedSuggestions = useMemo(() => {
    const filtered =
      filterPriority === 'ALL'
        ? suggestions
        : suggestions.filter((s) => s.priority === filterPriority);

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        case 'score':
          return b.score - a.score;
        case 'distance':
          return a.distance - b.distance;
        case 'time':
          return a.estimatedTime - b.estimatedTime;
        default:
          return 0;
      }
    });
  }, [suggestions, sortBy, filterPriority]);

  const getPriorityColor = (priority: ReplenishmentSuggestion['priority']): string => {
    const colors = {
      CRITICAL: 'bg-red-100 text-red-800 border-red-300',
      HIGH: 'bg-orange-100 text-orange-800 border-orange-300',
      MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      LOW: 'bg-blue-100 text-blue-800 border-blue-300',
    };
    return colors[priority];
  };

  const getPriorityIcon = (priority: ReplenishmentSuggestion['priority']): string => {
    const icons = {
      CRITICAL: '🔴',
      HIGH: '🟠',
      MEDIUM: '🟡',
      LOW: '🔵',
    };
    return icons[priority];
  };

  const handleCreateReplenishmentTask = (suggestion: ReplenishmentSuggestion) => {
    // TODO: Implement API call to create replenishment task
    console.log('Creating replenishment task:', suggestion);
    alert(
      `Creazione task riapprovvigionamento:\n` +
        `Da: ${suggestion.sourceLocation.code}\n` +
        `A: ${suggestion.targetLocation.code}\n` +
        `Articolo: ${suggestion.itemCode}\n` +
        `Quantità: ${suggestion.suggestedQuantity}`
    );
  };

  const exportSuggestions = () => {
    const data = sortedSuggestions.map((s) => ({
      priority: s.priority,
      sourceCode: s.sourceLocation.code,
      targetCode: s.targetLocation.code,
      itemCode: s.itemCode,
      quantity: s.suggestedQuantity,
      estimatedTime: s.estimatedTime,
      distance: s.distance,
      score: s.score,
      reason: s.reason,
    }));

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `replenishment_suggestions_${new Date().toISOString()}.json`;
    a.click();
  };

  // Summary statistics
  const stats = useMemo(() => {
    return {
      total: suggestions.length,
      critical: suggestions.filter((s) => s.priority === 'CRITICAL').length,
      high: suggestions.filter((s) => s.priority === 'HIGH').length,
      medium: suggestions.filter((s) => s.priority === 'MEDIUM').length,
      low: suggestions.filter((s) => s.priority === 'LOW').length,
      avgScore: suggestions.length > 0
        ? suggestions.reduce((sum, s) => sum + s.score, 0) / suggestions.length
        : 0,
      totalTime: suggestions.reduce((sum, s) => sum + s.estimatedTime, 0),
    };
  }, [suggestions]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="p-4 text-center">
          <p className="text-xs text-gray-600 mb-1">Totale</p>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        </Card>
        <Card className="p-4 text-center bg-red-50">
          <p className="text-xs text-red-600 mb-1">🔴 Critici</p>
          <p className="text-3xl font-bold text-red-900">{stats.critical}</p>
        </Card>
        <Card className="p-4 text-center bg-orange-50">
          <p className="text-xs text-orange-600 mb-1">🟠 Alta</p>
          <p className="text-3xl font-bold text-orange-900">{stats.high}</p>
        </Card>
        <Card className="p-4 text-center bg-yellow-50">
          <p className="text-xs text-yellow-600 mb-1">🟡 Media</p>
          <p className="text-3xl font-bold text-yellow-900">{stats.medium}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-gray-600 mb-1">Score Medio</p>
          <p className="text-3xl font-bold text-gray-900">
            {stats.avgScore.toFixed(0)}
          </p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-gray-600 mb-1">Tempo Tot.</p>
          <p className="text-3xl font-bold text-gray-900">
            {Math.floor(stats.totalTime / 60)}h
          </p>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Ordina per
              </label>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                options={[
                  { value: 'priority', label: 'Priorità' },
                  { value: 'score', label: 'Score' },
                  { value: 'distance', label: 'Distanza' },
                  { value: 'time', label: 'Tempo' },
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Filtra priorità
              </label>
              <Select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                options={[
                  { value: 'ALL', label: 'Tutte' },
                  { value: 'CRITICAL', label: '🔴 Critiche' },
                  { value: 'HIGH', label: '🟠 Alta' },
                  { value: 'MEDIUM', label: '🟡 Media' },
                  { value: 'LOW', label: '🔵 Bassa' },
                ]}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={exportSuggestions}>
              💾 Esporta JSON
            </Button>
            <Button variant="ghost" onClick={onRefresh}>
              ↻ Aggiorna
            </Button>
          </div>
        </div>
      </Card>

      {/* Suggestions List */}
      {sortedSuggestions.length === 0 ? (
        <Card className="text-center py-12">
          <div className="text-5xl mb-4">✅</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Nessun riapprovvigionamento necessario
          </h3>
          <p className="text-gray-600">
            Tutte le ubicazioni di picking sono adeguatamente rifornite
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedSuggestions.map((suggestion, index) => (
            <Card
              key={`${suggestion.sourceLocation.id}-${suggestion.targetLocation.id}`}
              className={`border-l-4 ${getPriorityColor(suggestion.priority)}`}
            >
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Left: Priority and Info */}
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="text-3xl">
                      {getPriorityIcon(suggestion.priority)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded ${getPriorityColor(
                            suggestion.priority
                          )}`}
                        >
                          {suggestion.priority}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded font-mono">
                          Score: {suggestion.score.toFixed(0)}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">
                        {suggestion.itemCode} - {suggestion.itemDescription}
                      </h3>
                      <p className="text-xs text-gray-600">{suggestion.reason}</p>
                    </div>
                  </div>

                  {/* Movement Details */}
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Da (Reserve)</p>
                      <button
                        onClick={() =>
                          navigate(`/locations/${suggestion.sourceLocation.code}`)
                        }
                        className="text-sm font-mono font-semibold text-blue-600 hover:underline"
                      >
                        {suggestion.sourceLocation.code}
                      </button>
                      <p className="text-xs text-gray-600 mt-1">
                        Utilizzo: {suggestion.sourceLocation.capacity.utilizationPercent.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">A (Picking)</p>
                      <button
                        onClick={() =>
                          navigate(`/locations/${suggestion.targetLocation.code}`)
                        }
                        className="text-sm font-mono font-semibold text-blue-600 hover:underline"
                      >
                        {suggestion.targetLocation.code}
                      </button>
                      <p className="text-xs text-gray-600 mt-1">
                        Utilizzo: {suggestion.targetLocation.capacity.utilizationPercent.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right: Metrics and Actions */}
                <div className="lg:w-64 flex flex-col gap-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-600">Quantità</p>
                      <p className="text-lg font-bold text-gray-900">
                        {suggestion.suggestedQuantity}
                      </p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-600">Distanza</p>
                      <p className="text-lg font-bold text-gray-900">
                        {suggestion.distance.toFixed(0)}m
                      </p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-600">Tempo</p>
                      <p className="text-lg font-bold text-gray-900">
                        {suggestion.estimatedTime}'
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleCreateReplenishmentTask(suggestion)}
                    className="w-full"
                  >
                    📦 Crea Task Riapprovvigionamento
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReplenishmentSuggestions;
