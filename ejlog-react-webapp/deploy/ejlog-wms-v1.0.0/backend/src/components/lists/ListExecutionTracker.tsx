// ============================================================================
// EJLOG WMS - List Execution Tracker Component
// Real-time monitoring and tracking of list execution with progress metrics
// ============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import Card from '../shared/Card';
import Button from '../shared/Button';
import { useNavigate } from 'react-router-dom';

interface ListExecutionTrackerProps {
  listId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
}

interface ListExecution {
  listId: string;
  listCode: string;
  listType: 'PICKING' | 'REFILLING' | 'INVENTORY' | 'MOVEMENT' | 'TRANSFER';
  status: 'PENDING' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'ERROR' | 'CANCELLED';
  priority: number;
  assignedTo?: string;
  startedAt: Date | null;
  completedAt: Date | null;
  estimatedDuration: number; // minutes
  currentDuration: number; // minutes
  progress: {
    totalItems: number;
    completedItems: number;
    errorItems: number;
    skippedItems: number;
    percentComplete: number;
  };
  performance: {
    itemsPerMinute: number;
    avgTimePerItem: number; // seconds
    efficiency: number; // percentage
  };
  currentItem?: {
    itemCode: string;
    locationCode: string;
    quantity: number;
    startedAt: Date;
  };
  warehouse: string;
  zone?: string;
}

const ListExecutionTracker: React.FC<ListExecutionTrackerProps> = ({
  listId,
  autoRefresh = true,
  refreshInterval = 5000,
}) => {
  const navigate = useNavigate();
  const [executions, setExecutions] = useState<ListExecution[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'priority' | 'progress' | 'duration'>('priority');

  // Mock data - in real app would come from API
  useEffect(() => {
    const mockExecutions: ListExecution[] = [
      {
        listId: 'L001',
        listCode: 'PICK-2024-001',
        listType: 'PICKING',
        status: 'IN_PROGRESS',
        priority: 1,
        assignedTo: 'Mario Rossi',
        startedAt: new Date(Date.now() - 15 * 60 * 1000),
        completedAt: null,
        estimatedDuration: 30,
        currentDuration: 15,
        progress: {
          totalItems: 50,
          completedItems: 25,
          errorItems: 2,
          skippedItems: 0,
          percentComplete: 50,
        },
        performance: {
          itemsPerMinute: 1.67,
          avgTimePerItem: 36,
          efficiency: 83,
        },
        currentItem: {
          itemCode: 'ITEM-12345',
          locationCode: 'A01-02-03',
          quantity: 10,
          startedAt: new Date(Date.now() - 2 * 60 * 1000),
        },
        warehouse: 'Warehouse A',
        zone: 'Zone 1',
      },
      {
        listId: 'L002',
        listCode: 'REFI-2024-002',
        listType: 'REFILLING',
        status: 'IN_PROGRESS',
        priority: 2,
        assignedTo: 'Luigi Verdi',
        startedAt: new Date(Date.now() - 45 * 60 * 1000),
        completedAt: null,
        estimatedDuration: 60,
        currentDuration: 45,
        progress: {
          totalItems: 30,
          completedItems: 22,
          errorItems: 1,
          skippedItems: 0,
          percentComplete: 73,
        },
        performance: {
          itemsPerMinute: 0.49,
          avgTimePerItem: 123,
          efficiency: 75,
        },
        warehouse: 'Warehouse A',
        zone: 'Zone 2',
      },
      {
        listId: 'L003',
        listCode: 'PICK-2024-003',
        listType: 'PICKING',
        status: 'PAUSED',
        priority: 3,
        assignedTo: 'Anna Bianchi',
        startedAt: new Date(Date.now() - 10 * 60 * 1000),
        completedAt: null,
        estimatedDuration: 25,
        currentDuration: 10,
        progress: {
          totalItems: 20,
          completedItems: 8,
          errorItems: 0,
          skippedItems: 0,
          percentComplete: 40,
        },
        performance: {
          itemsPerMinute: 0.8,
          avgTimePerItem: 75,
          efficiency: 65,
        },
        warehouse: 'Warehouse B',
      },
    ];

    setExecutions(mockExecutions);

    if (autoRefresh && !listId) {
      const interval = setInterval(() => {
        // In real app: refetch from API
        // For now, simulate progress
        setExecutions((prev) =>
          prev.map((exec) => {
            if (exec.status === 'IN_PROGRESS') {
              const newCompleted = Math.min(
                exec.progress.completedItems + 1,
                exec.progress.totalItems
              );
              return {
                ...exec,
                currentDuration: exec.currentDuration + refreshInterval / 60000,
                progress: {
                  ...exec.progress,
                  completedItems: newCompleted,
                  percentComplete: (newCompleted / exec.progress.totalItems) * 100,
                },
              };
            }
            return exec;
          })
        );
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, listId]);

  // Filter by single list if listId provided
  const filteredExecutions = useMemo(() => {
    let filtered = listId
      ? executions.filter((e) => e.listId === listId)
      : executions;

    if (selectedStatus !== 'ALL') {
      filtered = filtered.filter((e) => e.status === selectedStatus);
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          return a.priority - b.priority;
        case 'progress':
          return b.progress.percentComplete - a.progress.percentComplete;
        case 'duration':
          return b.currentDuration - a.currentDuration;
        default:
          return 0;
      }
    });
  }, [executions, listId, selectedStatus, sortBy]);

  // Aggregate statistics
  const stats = useMemo(() => {
    const inProgress = executions.filter((e) => e.status === 'IN_PROGRESS').length;
    const paused = executions.filter((e) => e.status === 'PAUSED').length;
    const completed = executions.filter((e) => e.status === 'COMPLETED').length;
    const errors = executions.filter((e) => e.status === 'ERROR').length;

    const totalItems = executions.reduce((sum, e) => sum + e.progress.totalItems, 0);
    const completedItems = executions.reduce(
      (sum, e) => sum + e.progress.completedItems,
      0
    );
    const avgEfficiency =
      executions.length > 0
        ? executions.reduce((sum, e) => sum + e.performance.efficiency, 0) /
          executions.length
        : 0;

    return {
      inProgress,
      paused,
      completed,
      errors,
      totalItems,
      completedItems,
      avgEfficiency,
    };
  }, [executions]);

  const getStatusColor = (status: string): string => {
    const colors = {
      PENDING: 'bg-gray-100 text-gray-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      PAUSED: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-green-100 text-green-800',
      ERROR: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string): string => {
    const icons = {
      PENDING: '⏸️',
      IN_PROGRESS: '▶️',
      PAUSED: '⏸️',
      COMPLETED: '✅',
      ERROR: '❌',
      CANCELLED: '🚫',
    };
    return icons[status as keyof typeof icons] || '❓';
  };

  const getTypeColor = (type: string): string => {
    const colors = {
      PICKING: 'bg-purple-100 text-purple-800',
      REFILLING: 'bg-indigo-100 text-indigo-800',
      INVENTORY: 'bg-cyan-100 text-cyan-800',
      MOVEMENT: 'bg-teal-100 text-teal-800',
      TRANSFER: 'bg-orange-100 text-orange-800',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getEfficiencyColor = (efficiency: number): string => {
    if (efficiency >= 90) return 'text-green-600';
    if (efficiency >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      {!listId && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card className="p-4 text-center">
            <p className="text-xs text-gray-600 mb-1">Totale</p>
            <p className="text-3xl font-bold text-gray-900">{executions.length}</p>
          </Card>
          <Card className="p-4 text-center bg-blue-50">
            <p className="text-xs text-blue-600 mb-1">▶️ In Corso</p>
            <p className="text-3xl font-bold text-blue-900">{stats.inProgress}</p>
          </Card>
          <Card className="p-4 text-center bg-yellow-50">
            <p className="text-xs text-yellow-600 mb-1">⏸️ In Pausa</p>
            <p className="text-3xl font-bold text-yellow-900">{stats.paused}</p>
          </Card>
          <Card className="p-4 text-center bg-green-50">
            <p className="text-xs text-green-600 mb-1">✅ Completate</p>
            <p className="text-3xl font-bold text-green-900">{stats.completed}</p>
          </Card>
          <Card className="p-4 text-center bg-red-50">
            <p className="text-xs text-red-600 mb-1">❌ Errori</p>
            <p className="text-3xl font-bold text-red-900">{stats.errors}</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-xs text-gray-600 mb-1">Articoli</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.completedItems}/{stats.totalItems}
            </p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-xs text-gray-600 mb-1">Efficienza</p>
            <p className={`text-2xl font-bold ${getEfficiencyColor(stats.avgEfficiency)}`}>
              {stats.avgEfficiency.toFixed(0)}%
            </p>
          </Card>
        </div>
      )}

      {/* Filters */}
      {!listId && (
        <Card>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Stato
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="ALL">Tutti</option>
                  <option value="IN_PROGRESS">In Corso</option>
                  <option value="PAUSED">In Pausa</option>
                  <option value="COMPLETED">Completate</option>
                  <option value="ERROR">Errori</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Ordina per
                </label>
                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as 'priority' | 'progress' | 'duration')
                  }
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="priority">Priorità</option>
                  <option value="progress">Progresso</option>
                  <option value="duration">Durata</option>
                </select>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {autoRefresh && '🔄 Auto-refresh attivo'}
            </div>
          </div>
        </Card>
      )}

      {/* Executions List */}
      <div className="space-y-4">
        {filteredExecutions.length === 0 ? (
          <Card className="text-center py-12">
            <div className="text-5xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nessuna lista in esecuzione
            </h3>
            <p className="text-gray-600">Le liste in corso appariranno qui</p>
          </Card>
        ) : (
          filteredExecutions.map((execution) => (
            <Card key={execution.listId} className="hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">
                        {execution.listCode}
                      </h3>
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          execution.status
                        )}`}
                      >
                        {getStatusIcon(execution.status)} {execution.status}
                      </span>
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded ${getTypeColor(
                          execution.listType
                        )}`}
                      >
                        {execution.listType}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        P{execution.priority}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>👤 {execution.assignedTo || 'Non assegnato'}</span>
                      <span>🏢 {execution.warehouse}</span>
                      {execution.zone && <span>📍 {execution.zone}</span>}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/lists/${execution.listId}`)}
                  >
                    Dettagli →
                  </Button>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Progresso: {execution.progress.completedItems}/
                      {execution.progress.totalItems} articoli
                    </span>
                    <span className="text-sm font-bold text-blue-600">
                      {execution.progress.percentComplete.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-blue-600 h-4 rounded-full transition-all duration-500"
                      style={{ width: `${execution.progress.percentComplete}%` }}
                    ></div>
                  </div>
                  {execution.progress.errorItems > 0 && (
                    <p className="text-xs text-red-600 mt-1">
                      ⚠️ {execution.progress.errorItems} errori
                    </p>
                  )}
                </div>

                {/* Current Item */}
                {execution.currentItem && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-700 font-medium mb-2">
                      ▶️ Articolo Corrente:
                    </p>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Articolo:</span>
                        <p className="font-semibold font-mono">
                          {execution.currentItem.itemCode}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Ubicazione:</span>
                        <p className="font-semibold font-mono">
                          {execution.currentItem.locationCode}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Quantità:</span>
                        <p className="font-semibold">{execution.currentItem.quantity}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-xs text-gray-600">Durata</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatDuration(execution.currentDuration)}
                    </p>
                    <p className="text-xs text-gray-500">
                      / {formatDuration(execution.estimatedDuration)}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-xs text-gray-600">Velocità</p>
                    <p className="text-lg font-bold text-gray-900">
                      {execution.performance.itemsPerMinute.toFixed(1)}
                    </p>
                    <p className="text-xs text-gray-500">item/min</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-xs text-gray-600">Tempo/Item</p>
                    <p className="text-lg font-bold text-gray-900">
                      {execution.performance.avgTimePerItem.toFixed(0)}s
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-xs text-gray-600">Efficienza</p>
                    <p
                      className={`text-lg font-bold ${getEfficiencyColor(
                        execution.performance.efficiency
                      )}`}
                    >
                      {execution.performance.efficiency}%
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ListExecutionTracker;
