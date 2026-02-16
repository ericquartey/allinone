import { FC } from 'react';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon,
} from '@heroicons/react/24/outline';

export interface KPIData {
  id: string;
  label: string;
  value: number | string;
  previousValue?: number;
  change?: number;
  changePercentage?: number;
  trend?: 'up' | 'down' | 'stable';
  format?: 'number' | 'currency' | 'percentage';
  icon?: FC<React.SVGProps<SVGSVGElement>>;
  color?: string;
}

interface KPIWidgetProps {
  kpis: KPIData[];
  isLoading?: boolean;
}

const formatValue = (value: number | string, format?: string): string => {
  if (typeof value === 'string') return value;

  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('it-IT', {
        style: 'currency',
        currency: 'EUR',
      }).format(value);
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'number':
    default:
      return new Intl.NumberFormat('it-IT').format(value);
  }
};

const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
  switch (trend) {
    case 'up':
      return ArrowUpIcon;
    case 'down':
      return ArrowDownIcon;
    case 'stable':
      return MinusIcon;
    default:
      return null;
  }
};

const getTrendColor = (trend?: 'up' | 'down' | 'stable', isPositive = true) => {
  if (!trend) return 'text-gray-500';

  const isGood = (trend === 'up' && isPositive) || (trend === 'down' && !isPositive);

  switch (trend) {
    case 'up':
      return isGood ? 'text-green-600' : 'text-red-600';
    case 'down':
      return isGood ? 'text-green-600' : 'text-red-600';
    case 'stable':
      return 'text-gray-500';
    default:
      return 'text-gray-500';
  }
};

export const KPIWidget: FC<KPIWidgetProps> = ({ kpis, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-lg shadow p-6 animate-pulse"
          >
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => {
        const TrendIcon = getTrendIcon(kpi.trend);
        const trendColor = getTrendColor(kpi.trend);

        return (
          <div
            key={kpi.id}
            className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 border border-gray-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-600">
                {kpi.label}
              </span>
              {kpi.icon && (
                <div className={`${kpi.color || 'text-blue-600'}`}>
                  <kpi.icon className="h-5 w-5" />
                </div>
              )}
            </div>

            {/* Value */}
            <div className="mb-2">
              <div className="text-3xl font-bold text-gray-900">
                {formatValue(kpi.value, kpi.format)}
              </div>
            </div>

            {/* Trend */}
            {kpi.trend && kpi.changePercentage !== undefined && (
              <div className="flex items-center gap-1">
                {TrendIcon && (
                  <TrendIcon className={`h-4 w-4 ${trendColor}`} />
                )}
                <span className={`text-sm font-medium ${trendColor}`}>
                  {kpi.changePercentage > 0 && '+'}
                  {kpi.changePercentage.toFixed(1)}%
                </span>
                <span className="text-sm text-gray-500 ml-1">
                  vs periodo precedente
                </span>
              </div>
            )}

            {/* Change Value */}
            {kpi.change !== undefined && (
              <div className="text-xs text-gray-500 mt-1">
                {kpi.change > 0 ? '+' : ''}
                {formatValue(kpi.change, kpi.format)} rispetto a prima
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
