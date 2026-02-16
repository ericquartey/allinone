// ============================================================================
// EJLOG WMS - Picking Path Optimizer Component
// Optimal picking route calculation and visualization with distance minimization
// ============================================================================

import React, { useState, useMemo } from 'react';
import Card from '../shared/Card';
import Button from '../shared/Button';
import Select from '../shared/Select';
import { Location } from '../../types/location';
import { useNavigate } from 'react-router-dom';

interface PickingPathOptimizerProps {
  locations: Location[];
  warehouseId?: string;
  zoneId?: string;
}

interface PickingTask {
  locationCode: string;
  itemCode: string;
  quantity: number;
  priority: number;
}

interface PathNode {
  location: Location;
  task: PickingTask;
  distance: number; // from previous node
  cumulativeDistance: number;
  order: number;
}

type OptimizationMethod = 'nearest' | 'zone' | 'priority' | 'serpentine';

const PickingPathOptimizer: React.FC<PickingPathOptimizerProps> = ({
  locations,
  warehouseId,
  zoneId,
}) => {
  const navigate = useNavigate();
  const [method, setMethod] = useState<OptimizationMethod>('nearest');
  const [startLocationCode, setStartLocationCode] = useState<string>('');

  // Mock picking tasks (in real app, these would come from API)
  const [pickingTasks] = useState<PickingTask[]>([
    { locationCode: 'A01-01-01', itemCode: 'ITEM001', quantity: 10, priority: 1 },
    { locationCode: 'A01-02-03', itemCode: 'ITEM002', quantity: 5, priority: 2 },
    { locationCode: 'A02-01-05', itemCode: 'ITEM003', quantity: 8, priority: 1 },
    { locationCode: 'A01-03-02', itemCode: 'ITEM004', quantity: 15, priority: 3 },
    { locationCode: 'A02-02-04', itemCode: 'ITEM005', quantity: 12, priority: 2 },
  ]);

  // Calculate distance between two locations
  const calculateDistance = (loc1: Location, loc2: Location): number => {
    return Math.sqrt(
      Math.pow(loc1.coordinates.x - loc2.coordinates.x, 2) +
        Math.pow(loc1.coordinates.y - loc2.coordinates.y, 2) +
        Math.pow(loc1.coordinates.z - loc2.coordinates.z, 2)
    );
  };

  // Nearest Neighbor Algorithm
  const optimizeNearestNeighbor = (
    taskLocations: Location[],
    startLoc: Location
  ): PathNode[] => {
    const path: PathNode[] = [];
    const remaining = [...taskLocations];
    let current = startLoc;
    let cumulativeDistance = 0;

    while (remaining.length > 0) {
      // Find nearest unvisited location
      let nearestIdx = 0;
      let minDistance = calculateDistance(current, remaining[0]);

      for (let i = 1; i < remaining.length; i++) {
        const dist = calculateDistance(current, remaining[i]);
        if (dist < minDistance) {
          minDistance = dist;
          nearestIdx = i;
        }
      }

      const nextLocation = remaining[nearestIdx];
      const task = pickingTasks.find((t) => t.locationCode === nextLocation.code)!;
      cumulativeDistance += minDistance;

      path.push({
        location: nextLocation,
        task,
        distance: minDistance,
        cumulativeDistance,
        order: path.length + 1,
      });

      remaining.splice(nearestIdx, 1);
      current = nextLocation;
    }

    return path;
  };

  // Zone-based optimization (group by zone, then nearest neighbor within zone)
  const optimizeByZone = (
    taskLocations: Location[],
    startLoc: Location
  ): PathNode[] => {
    // Group by zone
    const byZone = taskLocations.reduce((acc, loc) => {
      if (!acc[loc.zoneId]) acc[loc.zoneId] = [];
      acc[loc.zoneId].push(loc);
      return acc;
    }, {} as Record<string, Location[]>);

    const path: PathNode[] = [];
    let current = startLoc;
    let cumulativeDistance = 0;

    // Process each zone
    Object.values(byZone).forEach((zoneLocs) => {
      const zonePath = optimizeNearestNeighbor(zoneLocs, current);
      zonePath.forEach((node) => {
        path.push({
          ...node,
          cumulativeDistance: cumulativeDistance + node.cumulativeDistance,
          order: path.length + 1,
        });
      });
      if (zonePath.length > 0) {
        cumulativeDistance += zonePath[zonePath.length - 1].cumulativeDistance;
        current = zonePath[zonePath.length - 1].location;
      }
    });

    return path;
  };

  // Priority-based optimization (sort by priority, then nearest neighbor)
  const optimizeByPriority = (
    taskLocations: Location[],
    startLoc: Location
  ): PathNode[] => {
    // Sort by priority (ascending)
    const sortedByPriority = [...taskLocations].sort((a, b) => {
      const taskA = pickingTasks.find((t) => t.locationCode === a.code)!;
      const taskB = pickingTasks.find((t) => t.locationCode === b.code)!;
      return taskA.priority - taskB.priority;
    });

    return optimizeNearestNeighbor(sortedByPriority, startLoc);
  };

  // Serpentine pattern (zigzag through aisles)
  const optimizeSerpentine = (
    taskLocations: Location[],
    startLoc: Location
  ): PathNode[] => {
    // Sort by X coordinate (aisle), then alternate Y direction
    const sorted = [...taskLocations].sort((a, b) => {
      if (Math.abs(a.coordinates.x - b.coordinates.x) > 5) {
        return a.coordinates.x - b.coordinates.x;
      }
      // Alternate Y direction based on aisle
      const aisleA = Math.floor(a.coordinates.x / 10);
      if (aisleA % 2 === 0) {
        return a.coordinates.y - b.coordinates.y;
      } else {
        return b.coordinates.y - a.coordinates.y;
      }
    });

    const path: PathNode[] = [];
    let current = startLoc;
    let cumulativeDistance = 0;

    sorted.forEach((loc) => {
      const dist = calculateDistance(current, loc);
      cumulativeDistance += dist;
      const task = pickingTasks.find((t) => t.locationCode === loc.code)!;

      path.push({
        location: loc,
        task,
        distance: dist,
        cumulativeDistance,
        order: path.length + 1,
      });

      current = loc;
    });

    return path;
  };

  // Optimize path based on selected method
  const optimizedPath = useMemo(() => {
    // Filter locations that have picking tasks
    const taskLocations = locations.filter((loc) =>
      pickingTasks.some((task) => task.locationCode === loc.code)
    );

    if (taskLocations.length === 0) return [];

    // Determine start location
    const startLoc =
      startLocationCode && locations.find((l) => l.code === startLocationCode)
        ? locations.find((l) => l.code === startLocationCode)!
        : taskLocations[0];

    switch (method) {
      case 'nearest':
        return optimizeNearestNeighbor(taskLocations, startLoc);
      case 'zone':
        return optimizeByZone(taskLocations, startLoc);
      case 'priority':
        return optimizeByPriority(taskLocations, startLoc);
      case 'serpentine':
        return optimizeSerpentine(taskLocations, startLoc);
      default:
        return optimizeNearestNeighbor(taskLocations, startLoc);
    }
  }, [locations, pickingTasks, method, startLocationCode]);

  // Calculate path statistics
  const pathStats = useMemo(() => {
    if (optimizedPath.length === 0)
      return { totalDistance: 0, totalItems: 0, estimatedTime: 0, avgDistancePerStop: 0 };

    const totalDistance =
      optimizedPath[optimizedPath.length - 1]?.cumulativeDistance || 0;
    const totalItems = optimizedPath.reduce((sum, node) => sum + node.task.quantity, 0);
    const estimatedTime = Math.ceil(
      optimizedPath.length * 2 + // 2 minutes per stop
        totalDistance / 10 // 10 meters per minute walking
    );
    const avgDistancePerStop = totalDistance / optimizedPath.length;

    return { totalDistance, totalItems, estimatedTime, avgDistancePerStop };
  }, [optimizedPath]);

  const exportPath = () => {
    const data = {
      method,
      startLocation: startLocationCode,
      statistics: pathStats,
      path: optimizedPath.map((node) => ({
        order: node.order,
        locationCode: node.location.code,
        itemCode: node.task.itemCode,
        quantity: node.task.quantity,
        priority: node.task.priority,
        distance: node.distance,
        cumulativeDistance: node.cumulativeDistance,
      })),
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `picking_path_${method}_${new Date().toISOString()}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <Card title="Configurazione Percorso">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Metodo di Ottimizzazione
            </label>
            <Select
              value={method}
              onChange={(e) => setMethod(e.target.value as OptimizationMethod)}
              options={[
                {
                  value: 'nearest',
                  label: 'Nearest Neighbor (più vicino)',
                },
                {
                  value: 'zone',
                  label: 'Zone-based (per zona)',
                },
                {
                  value: 'priority',
                  label: 'Priority-based (per priorità)',
                },
                {
                  value: 'serpentine',
                  label: 'Serpentine (serpentina)',
                },
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ubicazione di Partenza (opzionale)
            </label>
            <Select
              value={startLocationCode}
              onChange={(e) => setStartLocationCode(e.target.value)}
              options={[
                { value: '', label: 'Prima ubicazione lista' },
                ...locations
                  .filter((l) =>
                    pickingTasks.some((t) => t.locationCode === l.code)
                  )
                  .map((l) => ({
                    value: l.code,
                    label: `${l.code} - ${l.zoneName}`,
                  })),
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-xs text-gray-600 mb-1">Distanza Totale</p>
          <p className="text-3xl font-bold text-blue-900">
            {pathStats.totalDistance.toFixed(1)}
          </p>
          <p className="text-xs text-gray-500">metri</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-gray-600 mb-1">Fermate</p>
          <p className="text-3xl font-bold text-green-900">
            {optimizedPath.length}
          </p>
          <p className="text-xs text-gray-500">ubicazioni</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-gray-600 mb-1">Articoli Totali</p>
          <p className="text-3xl font-bold text-orange-900">{pathStats.totalItems}</p>
          <p className="text-xs text-gray-500">pezzi</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-gray-600 mb-1">Tempo Stimato</p>
          <p className="text-3xl font-bold text-purple-900">
            {pathStats.estimatedTime}
          </p>
          <p className="text-xs text-gray-500">minuti</p>
        </Card>
      </div>

      {/* Path Visualization */}
      <Card
        title="Percorso Ottimizzato"
        actions={
          <Button variant="secondary" size="sm" onClick={exportPath}>
            💾 Esporta JSON
          </Button>
        }
      >
        {optimizedPath.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-3">📍</div>
            <p className="text-lg font-medium">Nessun task di picking</p>
            <p className="text-sm mt-2">
              Aggiungi articoli alla lista di picking per visualizzare il percorso
              ottimizzato
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {optimizedPath.map((node, index) => (
              <div
                key={node.location.id}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {/* Order Number */}
                <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  {node.order}
                </div>

                {/* Location Info */}
                <div className="flex-1">
                  <button
                    onClick={() => navigate(`/locations/${node.location.code}`)}
                    className="text-lg font-bold text-blue-600 hover:underline font-mono"
                  >
                    {node.location.code}
                  </button>
                  <p className="text-sm text-gray-600 mt-1">
                    {node.location.warehouseName} → {node.location.zoneName}
                  </p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    <span>
                      📦 {node.task.itemCode} × {node.task.quantity}
                    </span>
                    <span>
                      ⚡ Priorità: {node.task.priority}
                    </span>
                  </div>
                </div>

                {/* Distance Metrics */}
                <div className="flex-shrink-0 text-right">
                  {index > 0 && (
                    <>
                      <p className="text-xs text-gray-500">Distanza</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {node.distance.toFixed(1)}m
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Cumulativa: {node.cumulativeDistance.toFixed(1)}m
                      </p>
                    </>
                  )}
                  {index === 0 && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                      START
                    </span>
                  )}
                </div>

                {/* Arrow */}
                {index < optimizedPath.length - 1 && (
                  <div className="flex-shrink-0 text-gray-400 text-2xl">→</div>
                )}
                {index === optimizedPath.length - 1 && (
                  <div className="flex-shrink-0">
                    <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">
                      END
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Method Explanation */}
      <Card title="Info Metodo di Ottimizzazione" className="bg-blue-50 border-blue-200">
        <div className="text-sm text-gray-700 space-y-2">
          {method === 'nearest' && (
            <p>
              <strong>Nearest Neighbor:</strong> Seleziona sempre l'ubicazione più
              vicina non ancora visitata. Algoritmo greedy veloce ma non garantisce il
              percorso ottimale globale.
            </p>
          )}
          {method === 'zone' && (
            <p>
              <strong>Zone-based:</strong> Raggruppa le ubicazioni per zona, poi
              applica nearest neighbor all'interno di ogni zona. Riduce spostamenti
              tra zone diverse.
            </p>
          )}
          {method === 'priority' && (
            <p>
              <strong>Priority-based:</strong> Ordina per priorità (1=alta, 3=bassa),
              poi ottimizza con nearest neighbor. Garantisce che articoli urgenti
              vengano prelevati per primi.
            </p>
          )}
          {method === 'serpentine' && (
            <p>
              <strong>Serpentine:</strong> Percorre le corsie in pattern a serpentina
              (zigzag), alternando la direzione per ogni corridoio. Ideale per picking
              intensivo in magazzini con layout a corridoi paralleli.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default PickingPathOptimizer;
