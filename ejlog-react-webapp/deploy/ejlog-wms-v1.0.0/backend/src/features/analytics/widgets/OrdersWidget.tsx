import { FC } from 'react';
import { BarChart, BarChartDataPoint } from '../../../components/charts';
import {
  TruckIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

export type OrderStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface OrdersData {
  total: number;
  byStatus: Record<OrderStatus, number>;
  byPriority: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  performance: {
    avgCompletionTime: number; // in hours
    onTimeDelivery: number; // percentage
    todayCompleted: number;
    pendingToday: number;
  };
  trend: BarChartDataPoint[]; // Last 7 days
}

interface OrdersWidgetProps {
  data: OrdersData;
  isLoading?: boolean;
}

const statusConfig: Record<
  OrderStatus,
  {
    label: string;
    color: string;
    bgColor: string;
    icon: FC<React.SVGProps<SVGSVGElement>>;
  }
> = {
  PENDING: {
    label: 'In Attesa',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    icon: ClockIcon,
  },
  IN_PROGRESS: {
    label: 'In Lavorazione',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    icon: TruckIcon,
  },
  COMPLETED: {
    label: 'Completati',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: CheckCircleIcon,
  },
  CANCELLED: {
    label: 'Annullati',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    icon: XCircleIcon,
  },
};

export const OrdersWidget: FC<OrdersWidgetProps> = ({
  data,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Gestione Ordini
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Stato ordini e performance consegne
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Object.entries(data.byStatus).map(([status, count]) => {
          const config = statusConfig[status as OrderStatus];
          const Icon = config.icon;
          const percentage = ((count / data.total) * 100).toFixed(0);

          return (
            <div
              key={status}
              className={`${config.bgColor} rounded-lg p-4 transition-all hover:scale-105`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`h-5 w-5 ${config.color}`} />
                <span className="text-xs font-medium text-gray-600">
                  {percentage}%
                </span>
              </div>
              <div className={`text-2xl font-bold ${config.color} mb-1`}>
                {count}
              </div>
              <div className="text-xs text-gray-600">{config.label}</div>
            </div>
          );
        })}
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
          <div className="text-xs text-blue-700 font-medium mb-1">
            Tempo Medio Completamento
          </div>
          <div className="text-2xl font-bold text-blue-900">
            {data.performance.avgCompletionTime.toFixed(1)}h
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
          <div className="text-xs text-green-700 font-medium mb-1">
            Consegne Puntuali
          </div>
          <div className="text-2xl font-bold text-green-900">
            {data.performance.onTimeDelivery.toFixed(0)}%
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
          <div className="text-xs text-purple-700 font-medium mb-1">
            Completati Oggi
          </div>
          <div className="text-2xl font-bold text-purple-900">
            {data.performance.todayCompleted}
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
          <div className="text-xs text-orange-700 font-medium mb-1">
            In Attesa Oggi
          </div>
          <div className="text-2xl font-bold text-orange-900">
            {data.performance.pendingToday}
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-4">
          Trend Ultimi 7 Giorni
        </h4>
        <BarChart
          data={data.trend}
          bars={[
            {
              dataKey: 'completed',
              fill: '#10b981',
              name: 'Completati',
            },
            {
              dataKey: 'pending',
              fill: '#f59e0b',
              name: 'In Attesa',
            },
          ]}
          height={200}
          showGrid={true}
          showLegend={true}
        />
      </div>
    </div>
  );
};
