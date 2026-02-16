import { FC } from 'react';
import { PieChart, PieChartDataPoint } from '../../../components/charts';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

export type StockHealthState = 'OK' | 'LOW' | 'CRITICAL' | 'EXCESS' | 'OBSOLETE';

export interface InventoryHealthData {
  total: number;
  byHealth: Record<StockHealthState, number>;
  value: {
    total: number;
    byHealth: Record<StockHealthState, number>;
  };
}

interface InventoryHealthWidgetProps {
  data: InventoryHealthData;
  isLoading?: boolean;
}

const healthConfig: Record<
  StockHealthState,
  {
    label: string;
    color: string;
    icon: FC<React.SVGProps<SVGSVGElement>>;
    description: string;
  }
> = {
  OK: {
    label: 'OK',
    color: '#10b981',
    icon: CheckCircleIcon,
    description: 'Livelli ottimali',
  },
  LOW: {
    label: 'Basso',
    color: '#f59e0b',
    icon: ExclamationTriangleIcon,
    description: 'Scorta in esaurimento',
  },
  CRITICAL: {
    label: 'Critico',
    color: '#ef4444',
    icon: XCircleIcon,
    description: 'Riordino urgente',
  },
  EXCESS: {
    label: 'Eccesso',
    color: '#3b82f6',
    icon: ArrowTrendingUpIcon,
    description: 'Sovra-scorta',
  },
  OBSOLETE: {
    label: 'Obsoleto',
    color: '#6b7280',
    icon: ClockIcon,
    description: 'Non movimentato',
  },
};

export const InventoryHealthWidget: FC<InventoryHealthWidgetProps> = ({
  data,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="grid grid-cols-2 gap-6">
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const chartData: PieChartDataPoint[] = Object.entries(data.byHealth).map(
    ([health, count]) => ({
      name: healthConfig[health as StockHealthState].label,
      value: count,
      color: healthConfig[health as StockHealthState].color,
    })
  );

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Stato Salute Inventario
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Distribuzione articoli per stato di salute
        </p>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <div className="flex items-center justify-center">
          <PieChart
            data={chartData}
            height={280}
            colors={chartData.map((d) => d.color!)}
            showLegend={false}
            innerRadius={60}
            outerRadius={100}
            formatValue={(value) => `${value} articoli`}
          />
        </div>

        {/* Legend with Details */}
        <div className="space-y-3">
          {Object.entries(data.byHealth).map(([health, count]) => {
            const config = healthConfig[health as StockHealthState];
            const Icon = config.icon;
            const percentage = ((count / data.total) * 100).toFixed(1);
            const value = data.value.byHealth[health as StockHealthState];

            return (
              <div
                key={health}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: config.color }}
                  />
                  <Icon
                    className="h-5 w-5 flex-shrink-0"
                    style={{ color: config.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {config.label}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({percentage}%)
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {config.description}
                    </p>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="font-semibold text-gray-900">{count}</div>
                  <div className="text-xs text-gray-500">
                    €{new Intl.NumberFormat('it-IT').format(value)}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Total */}
          <div className="pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="font-semibold text-gray-900">Totale</span>
              <div className="text-right">
                <div className="font-bold text-blue-900">{data.total}</div>
                <div className="text-xs text-blue-700">
                  €{new Intl.NumberFormat('it-IT').format(data.value.total)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
