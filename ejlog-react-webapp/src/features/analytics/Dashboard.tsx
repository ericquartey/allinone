import { FC, useState } from 'react';
import {
  ChartBarIcon,
  CubeIcon,
  ShoppingCartIcon,
  BoltIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { KPIWidget, KPIData } from './widgets/KPIWidget';
import { InventoryHealthWidget, InventoryHealthData } from './widgets/InventoryHealthWidget';
import { OrdersWidget, OrdersData } from './widgets/OrdersWidget';
import { PerformanceWidget, PerformanceData } from './widgets/PerformanceWidget';

// Mock data (will be replaced with real API calls in next step)
const mockKPIs: KPIData[] = [
  {
    id: 'total-stock',
    label: 'Articoli in Stock',
    value: 12548,
    previousValue: 12100,
    change: 448,
    changePercentage: 3.7,
    trend: 'up',
    format: 'number',
    icon: CubeIcon,
    color: 'text-blue-600',
  },
  {
    id: 'orders-completed',
    label: 'Ordini Completati',
    value: 342,
    previousValue: 318,
    change: 24,
    changePercentage: 7.5,
    trend: 'up',
    format: 'number',
    icon: ShoppingCartIcon,
    color: 'text-green-600',
  },
  {
    id: 'inventory-value',
    label: 'Valore Inventario',
    value: 2450000,
    previousValue: 2380000,
    change: 70000,
    changePercentage: 2.9,
    trend: 'up',
    format: 'currency',
    icon: ChartBarIcon,
    color: 'text-purple-600',
  },
  {
    id: 'avg-efficiency',
    label: 'Efficienza Media',
    value: 92.5,
    previousValue: 89.3,
    change: 3.2,
    changePercentage: 3.6,
    trend: 'up',
    format: 'percentage',
    icon: BoltIcon,
    color: 'text-orange-600',
  },
];

const mockInventoryHealth: InventoryHealthData = {
  total: 12548,
  byHealth: {
    OK: 8420,
    LOW: 2100,
    CRITICAL: 580,
    EXCESS: 1200,
    OBSOLETE: 248,
  },
  value: {
    total: 2450000,
    byHealth: {
      OK: 1680000,
      LOW: 420000,
      CRITICAL: 116000,
      EXCESS: 180000,
      OBSOLETE: 54000,
    },
  },
};

const mockOrdersData: OrdersData = {
  total: 487,
  byStatus: {
    PENDING: 125,
    IN_PROGRESS: 98,
    COMPLETED: 254,
    CANCELLED: 10,
  },
  byPriority: {
    CRITICAL: 18,
    HIGH: 67,
    MEDIUM: 225,
    LOW: 177,
  },
  performance: {
    avgCompletionTime: 4.2,
    onTimeDelivery: 94.5,
    todayCompleted: 42,
    pendingToday: 28,
  },
  trend: [
    { name: 'Lun', completed: 65, pending: 22 },
    { name: 'Mar', completed: 72, pending: 19 },
    { name: 'Mer', completed: 68, pending: 25 },
    { name: 'Gio', completed: 75, pending: 18 },
    { name: 'Ven', completed: 70, pending: 20 },
    { name: 'Sab', completed: 45, pending: 15 },
    { name: 'Dom', completed: 42, pending: 28 },
  ],
};

const mockPerformanceData: PerformanceData = {
  lists: {
    totalExecuted: 124,
    avgItemsPerHour: 287,
    efficiency: 92.5,
    trend: [
      { name: 'Lun', efficiency: 88, itemsPerHour: 265 },
      { name: 'Mar', efficiency: 91, itemsPerHour: 278 },
      { name: 'Mer', efficiency: 89, itemsPerHour: 270 },
      { name: 'Gio', efficiency: 93, itemsPerHour: 295 },
      { name: 'Ven', efficiency: 92, itemsPerHour: 285 },
      { name: 'Sab', efficiency: 90, itemsPerHour: 275 },
      { name: 'Dom', efficiency: 92.5, itemsPerHour: 287 },
    ],
  },
  locations: {
    utilizationRate: 78.5,
    totalOccupied: 4850,
    totalAvailable: 6200,
    trend: [
      { name: 'Lun', utilization: 76 },
      { name: 'Mar', utilization: 77 },
      { name: 'Mer', utilization: 77.5 },
      { name: 'Gio', utilization: 78 },
      { name: 'Ven', utilization: 78.2 },
      { name: 'Sab', utilization: 78.3 },
      { name: 'Dom', utilization: 78.5 },
    ],
  },
  movements: {
    totalToday: 1245,
    avgPerHour: 52,
    peakHour: '10:00-11:00',
    trend: [
      { name: '08:00', movements: 35 },
      { name: '09:00', movements: 48 },
      { name: '10:00', movements: 65 },
      { name: '11:00', movements: 58 },
      { name: '12:00', movements: 42 },
      { name: '13:00', movements: 38 },
      { name: '14:00', movements: 55 },
      { name: '15:00', movements: 62 },
      { name: '16:00', movements: 54 },
      { name: '17:00', movements: 45 },
    ],
  },
  users: {
    activeNow: 24,
    totalSessions: 87,
    avgSessionDuration: 245,
  },
};

export const Dashboard: FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const handleRefresh = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setLastRefresh(new Date());
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Dashboard Analytics
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Panoramica performance e metriche operative
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs text-gray-500">Ultimo aggiornamento</div>
                <div className="text-sm font-medium text-gray-900">
                  {lastRefresh.toLocaleTimeString('it-IT')}
                </div>
              </div>
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowPathIcon
                  className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
                />
                <span>Aggiorna</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* KPIs */}
        <section>
          <KPIWidget kpis={mockKPIs} isLoading={isLoading} />
        </section>

        {/* First Row: Inventory + Orders */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <InventoryHealthWidget data={mockInventoryHealth} isLoading={isLoading} />
          <OrdersWidget data={mockOrdersData} isLoading={isLoading} />
        </div>

        {/* Second Row: Performance */}
        <section>
          <PerformanceWidget data={mockPerformanceData} isLoading={isLoading} />
        </section>

        {/* Footer Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ChartBarIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-blue-900 mb-1">
                Dashboard in Fase Beta
              </h4>
              <p className="text-sm text-blue-700">
                Questa è la versione iniziale del dashboard analytics (Phase 2 - Sprint 1).
                Le metriche mostrate utilizzano dati di esempio. L'integrazione con le API
                real-time sarà completata nello Sprint 2 con WebSocket.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
