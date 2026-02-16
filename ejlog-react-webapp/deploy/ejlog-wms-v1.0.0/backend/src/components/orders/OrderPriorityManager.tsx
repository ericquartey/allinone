// ============================================================================
// EJLOG WMS - Order Priority Manager Component
// Intelligent order prioritization with scoring algorithm and drag-drop reordering
// ============================================================================

import React, { useState, useMemo } from 'react';
import Card from '../shared/Card';
import Button from '../shared/Button';
import Select from '../shared/Select';
import { useNavigate } from 'react-router-dom';

interface OrderPriorityManagerProps {
  warehouseId?: string;
  onPriorityChange?: (orderId: string, newPriority: number) => void;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  orderType: 'SALES' | 'TRANSFER' | 'PRODUCTION' | 'RETURN';
  status: 'PENDING' | 'PROCESSING' | 'PICKING' | 'PACKING' | 'SHIPPED';
  priority: number; // 1-10, lower = higher priority
  manualPriority: boolean; // true if manually set
  dueDate: Date;
  createdAt: Date;
  totalItems: number;
  totalValue: number;
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  scoringFactors: {
    dueDateScore: number; // 0-100
    customerScore: number; // 0-100
    valueScore: number; // 0-100
    ageScore: number; // 0-100
    completenessScore: number; // 0-100
    totalScore: number; // weighted average
  };
  assignedTo?: string;
  estimatedPickingTime: number; // minutes
  warehouse: string;
}

type SortBy = 'priority' | 'dueDate' | 'value' | 'age' | 'score';
type PriorityRule = 'FIFO' | 'DUE_DATE' | 'VALUE' | 'CUSTOMER' | 'CUSTOM';

const OrderPriorityManager: React.FC<OrderPriorityManagerProps> = ({
  warehouseId,
  onPriorityChange,
}) => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [sortBy, setSortBy] = useState<SortBy>('priority');
  const [selectedRule, setSelectedRule] = useState<PriorityRule>('CUSTOM');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [editingPriority, setEditingPriority] = useState<string | null>(null);

  // Mock data - in real app would come from API
  React.useEffect(() => {
    const mockOrders: Order[] = [
      {
        id: 'ORD-001',
        orderNumber: 'SO-2024-001',
        customerName: 'Cliente Premium A',
        orderType: 'SALES',
        status: 'PENDING',
        priority: 1,
        manualPriority: false,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        totalItems: 50,
        totalValue: 15000,
        urgency: 'CRITICAL',
        scoringFactors: {
          dueDateScore: 95,
          customerScore: 90,
          valueScore: 85,
          ageScore: 80,
          completenessScore: 100,
          totalScore: 90,
        },
        assignedTo: 'Mario Rossi',
        estimatedPickingTime: 45,
        warehouse: 'Warehouse A',
      },
      {
        id: 'ORD-002',
        orderNumber: 'SO-2024-002',
        customerName: 'Cliente Standard B',
        orderType: 'SALES',
        status: 'PROCESSING',
        priority: 2,
        manualPriority: true,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        totalItems: 30,
        totalValue: 8000,
        urgency: 'HIGH',
        scoringFactors: {
          dueDateScore: 70,
          customerScore: 60,
          valueScore: 55,
          ageScore: 65,
          completenessScore: 90,
          totalScore: 68,
        },
        assignedTo: 'Luigi Verdi',
        estimatedPickingTime: 30,
        warehouse: 'Warehouse A',
      },
      {
        id: 'ORD-003',
        orderNumber: 'TO-2024-003',
        customerName: 'Warehouse B',
        orderType: 'TRANSFER',
        status: 'PENDING',
        priority: 3,
        manualPriority: false,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        totalItems: 100,
        totalValue: 25000,
        urgency: 'MEDIUM',
        scoringFactors: {
          dueDateScore: 60,
          customerScore: 70,
          valueScore: 90,
          ageScore: 40,
          completenessScore: 100,
          totalScore: 72,
        },
        estimatedPickingTime: 90,
        warehouse: 'Warehouse A',
      },
      {
        id: 'ORD-004',
        orderNumber: 'SO-2024-004',
        customerName: 'Cliente New C',
        orderType: 'SALES',
        status: 'PENDING',
        priority: 4,
        manualPriority: false,
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        totalItems: 20,
        totalValue: 5000,
        urgency: 'MEDIUM',
        scoringFactors: {
          dueDateScore: 50,
          customerScore: 50,
          valueScore: 40,
          ageScore: 55,
          completenessScore: 100,
          totalScore: 59,
        },
        estimatedPickingTime: 20,
        warehouse: 'Warehouse A',
      },
      {
        id: 'ORD-005',
        orderNumber: 'RO-2024-005',
        customerName: 'Reso Cliente D',
        orderType: 'RETURN',
        status: 'PENDING',
        priority: 5,
        manualPriority: false,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        totalItems: 5,
        totalValue: 1000,
        urgency: 'LOW',
        scoringFactors: {
          dueDateScore: 40,
          customerScore: 30,
          valueScore: 20,
          ageScore: 85,
          completenessScore: 100,
          totalScore: 55,
        },
        estimatedPickingTime: 10,
        warehouse: 'Warehouse A',
      },
    ];
    setOrders(mockOrders);
  }, []);

  // Apply prioritization rule
  const applyPriorityRule = (rule: PriorityRule) => {
    let sortedOrders = [...orders];

    switch (rule) {
      case 'FIFO':
        sortedOrders.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        break;
      case 'DUE_DATE':
        sortedOrders.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
        break;
      case 'VALUE':
        sortedOrders.sort((a, b) => b.totalValue - a.totalValue);
        break;
      case 'CUSTOMER':
        sortedOrders.sort((a, b) => b.scoringFactors.customerScore - a.scoringFactors.customerScore);
        break;
      case 'CUSTOM':
        sortedOrders.sort((a, b) => b.scoringFactors.totalScore - a.scoringFactors.totalScore);
        break;
    }

    // Reassign priorities
    const updated = sortedOrders.map((order, index) => ({
      ...order,
      priority: index + 1,
      manualPriority: false,
    }));

    setOrders(updated);
  };

  // Manual priority change
  const handlePriorityChange = (orderId: string, newPriority: number) => {
    const updated = orders.map((order) =>
      order.id === orderId
        ? { ...order, priority: newPriority, manualPriority: true }
        : order
    );

    // Reorder based on new priorities
    updated.sort((a, b) => a.priority - b.priority);
    setOrders(updated);
    setEditingPriority(null);

    if (onPriorityChange) {
      onPriorityChange(orderId, newPriority);
    }
  };

  // Filtered and sorted orders
  const displayedOrders = useMemo(() => {
    let filtered =
      filterStatus === 'ALL' ? orders : orders.filter((o) => o.status === filterStatus);

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          return a.priority - b.priority;
        case 'dueDate':
          return a.dueDate.getTime() - b.dueDate.getTime();
        case 'value':
          return b.totalValue - a.totalValue;
        case 'age':
          return a.createdAt.getTime() - b.createdAt.getTime();
        case 'score':
          return b.scoringFactors.totalScore - a.scoringFactors.totalScore;
        default:
          return 0;
      }
    });
  }, [orders, sortBy, filterStatus]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: orders.length,
      pending: orders.filter((o) => o.status === 'PENDING').length,
      processing: orders.filter((o) => o.status === 'PROCESSING').length,
      critical: orders.filter((o) => o.urgency === 'CRITICAL').length,
      high: orders.filter((o) => o.urgency === 'HIGH').length,
      avgScore:
        orders.length > 0
          ? orders.reduce((sum, o) => sum + o.scoringFactors.totalScore, 0) / orders.length
          : 0,
      totalValue: orders.reduce((sum, o) => sum + o.totalValue, 0),
      totalTime: orders.reduce((sum, o) => sum + o.estimatedPickingTime, 0),
    };
  }, [orders]);

  const getUrgencyColor = (urgency: string): string => {
    const colors = {
      CRITICAL: 'bg-red-100 text-red-800 border-red-300',
      HIGH: 'bg-orange-100 text-orange-800 border-orange-300',
      MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      LOW: 'bg-green-100 text-green-800 border-green-300',
    };
    return colors[urgency as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string): string => {
    const colors = {
      PENDING: 'bg-gray-100 text-gray-800',
      PROCESSING: 'bg-blue-100 text-blue-800',
      PICKING: 'bg-purple-100 text-purple-800',
      PACKING: 'bg-indigo-100 text-indigo-800',
      SHIPPED: 'bg-green-100 text-green-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getTypeIcon = (type: string): string => {
    const icons = {
      SALES: '🛒',
      TRANSFER: '🔄',
      PRODUCTION: '🏭',
      RETURN: '↩️',
    };
    return icons[type as keyof typeof icons] || '📦';
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `⚠️ ${Math.abs(diffDays)}d scaduto`;
    if (diffDays === 0) return '🔴 Oggi';
    if (diffDays === 1) return '⚡ Domani';
    return `${diffDays}d`;
  };

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card className="p-4 text-center">
          <p className="text-xs text-gray-600 mb-1">Totale</p>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        </Card>
        <Card className="p-4 text-center bg-gray-50">
          <p className="text-xs text-gray-600 mb-1">Pending</p>
          <p className="text-3xl font-bold text-gray-900">{stats.pending}</p>
        </Card>
        <Card className="p-4 text-center bg-blue-50">
          <p className="text-xs text-blue-600 mb-1">Processing</p>
          <p className="text-3xl font-bold text-blue-900">{stats.processing}</p>
        </Card>
        <Card className="p-4 text-center bg-red-50">
          <p className="text-xs text-red-600 mb-1">🔴 Critici</p>
          <p className="text-3xl font-bold text-red-900">{stats.critical}</p>
        </Card>
        <Card className="p-4 text-center bg-orange-50">
          <p className="text-xs text-orange-600 mb-1">🟠 Alti</p>
          <p className="text-3xl font-bold text-orange-900">{stats.high}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-gray-600 mb-1">Valore Tot.</p>
          <p className="text-xl font-bold text-gray-900">
            {formatCurrency(stats.totalValue)}
          </p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-gray-600 mb-1">Tempo Tot.</p>
          <p className="text-xl font-bold text-gray-900">
            {Math.floor(stats.totalTime / 60)}h {stats.totalTime % 60}m
          </p>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-wrap gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Regola Priorità
              </label>
              <Select
                value={selectedRule}
                onChange={(e) => {
                  const rule = e.target.value as PriorityRule;
                  setSelectedRule(rule);
                  applyPriorityRule(rule);
                }}
                options={[
                  { value: 'CUSTOM', label: '🎯 Score Automatico' },
                  { value: 'FIFO', label: '⏰ FIFO (First In First Out)' },
                  { value: 'DUE_DATE', label: '📅 Scadenza' },
                  { value: 'VALUE', label: '💰 Valore' },
                  { value: 'CUSTOMER', label: '👤 Cliente' },
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Stato</label>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                options={[
                  { value: 'ALL', label: 'Tutti' },
                  { value: 'PENDING', label: 'Pending' },
                  { value: 'PROCESSING', label: 'Processing' },
                  { value: 'PICKING', label: 'Picking' },
                ]}
              />
            </div>
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
                  { value: 'dueDate', label: 'Scadenza' },
                  { value: 'value', label: 'Valore' },
                  { value: 'age', label: 'Età' },
                ]}
              />
            </div>
          </div>
          <Button
            variant="primary"
            onClick={() => applyPriorityRule(selectedRule)}
          >
            🔄 Ricalcola Priorità
          </Button>
        </div>
      </Card>

      {/* Scoring Legend */}
      <Card title="💡 Info Scoring" className="bg-blue-50 border-blue-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">Fattori di Scoring (0-100):</h4>
            <ul className="space-y-1 text-blue-800">
              <li>📅 <strong>Scadenza:</strong> Più vicina = score più alto</li>
              <li>👤 <strong>Cliente:</strong> VIP/Premium = score più alto</li>
              <li>💰 <strong>Valore:</strong> Ordini di valore maggiore = score più alto</li>
              <li>⏰ <strong>Età:</strong> Ordini più vecchi = score più alto</li>
              <li>✅ <strong>Completezza:</strong> Disponibilità stock = score più alto</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">Score Totale (Media Pesata):</h4>
            <ul className="space-y-1 text-blue-800">
              <li>🔴 <strong>90-100:</strong> CRITICAL - Azione immediata</li>
              <li>🟠 <strong>70-89:</strong> HIGH - Priorità alta</li>
              <li>🟡 <strong>50-69:</strong> MEDIUM - Priorità media</li>
              <li>🟢 <strong>0-49:</strong> LOW - Priorità bassa</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Orders List */}
      <div className="space-y-3">
        {displayedOrders.length === 0 ? (
          <Card className="text-center py-12">
            <div className="text-5xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nessun ordine trovato
            </h3>
            <p className="text-gray-600">Prova a modificare i filtri</p>
          </Card>
        ) : (
          displayedOrders.map((order) => (
            <Card
              key={order.id}
              className="hover:shadow-lg transition-shadow border-l-4"
              style={{
                borderLeftColor:
                  order.urgency === 'CRITICAL'
                    ? '#dc2626'
                    : order.urgency === 'HIGH'
                    ? '#f97316'
                    : order.urgency === 'MEDIUM'
                    ? '#eab308'
                    : '#22c55e',
              }}
            >
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Priority Badge */}
                <div className="flex-shrink-0 flex items-center">
                  <div className="relative">
                    {editingPriority === order.id ? (
                      <input
                        type="number"
                        min="1"
                        max="100"
                        defaultValue={order.priority}
                        onBlur={(e) =>
                          handlePriorityChange(order.id, parseInt(e.target.value))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handlePriorityChange(
                              order.id,
                              parseInt((e.target as HTMLInputElement).value)
                            );
                          }
                        }}
                        className="w-16 h-16 text-center text-2xl font-bold border-2 border-blue-500 rounded-lg"
                        autoFocus
                      />
                    ) : (
                      <div
                        className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-lg flex items-center justify-center font-bold text-2xl cursor-pointer hover:from-blue-600 hover:to-blue-800"
                        onClick={() => setEditingPriority(order.id)}
                        title="Click per modificare"
                      >
                        {order.priority}
                      </div>
                    )}
                    {order.manualPriority && (
                      <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs px-1 rounded">
                        M
                      </span>
                    )}
                  </div>
                </div>

                {/* Order Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="text-lg font-bold text-gray-900">
                          {order.orderNumber}
                        </h3>
                        <span className="text-2xl">{getTypeIcon(order.orderType)}</span>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded ${getUrgencyColor(
                            order.urgency
                          )}`}
                        >
                          {order.urgency}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        👤 {order.customerName}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>📅 Scadenza: {formatDate(order.dueDate)}</span>
                        <span>📦 {order.totalItems} articoli</span>
                        <span>💰 {formatCurrency(order.totalValue)}</span>
                        <span>⏱️ ~{order.estimatedPickingTime}min</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/orders/${order.id}`)}
                    >
                      Dettagli →
                    </Button>
                  </div>

                  {/* Scoring Factors */}
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                    <div className="p-2 bg-gray-50 rounded text-center">
                      <p className="text-xs text-gray-600">Scadenza</p>
                      <p className="text-lg font-bold text-gray-900">
                        {order.scoringFactors.dueDateScore}
                      </p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded text-center">
                      <p className="text-xs text-gray-600">Cliente</p>
                      <p className="text-lg font-bold text-gray-900">
                        {order.scoringFactors.customerScore}
                      </p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded text-center">
                      <p className="text-xs text-gray-600">Valore</p>
                      <p className="text-lg font-bold text-gray-900">
                        {order.scoringFactors.valueScore}
                      </p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded text-center">
                      <p className="text-xs text-gray-600">Età</p>
                      <p className="text-lg font-bold text-gray-900">
                        {order.scoringFactors.ageScore}
                      </p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded text-center">
                      <p className="text-xs text-gray-600">Compl.</p>
                      <p className="text-lg font-bold text-gray-900">
                        {order.scoringFactors.completenessScore}
                      </p>
                    </div>
                    <div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded text-center border-2 border-blue-200">
                      <p className="text-xs text-blue-700 font-semibold">TOTALE</p>
                      <p className="text-xl font-bold text-blue-900">
                        {order.scoringFactors.totalScore}
                      </p>
                    </div>
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

export default OrderPriorityManager;
