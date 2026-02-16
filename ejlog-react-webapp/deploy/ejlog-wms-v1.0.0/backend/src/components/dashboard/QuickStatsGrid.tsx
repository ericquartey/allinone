// ============================================================================
// QuickStatsGrid Component - Dashboard KPI Cards
// Griglia di 6 KPI cards con animazioni hover e trend indicators
// ============================================================================

import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import clsx from 'clsx';

export interface StatCardData {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'cyan';
  trend?: {
    value: number;
    label: string;
  };
  onClick?: () => void;
}

interface QuickStatsGridProps {
  stats: StatCardData[];
  loading?: boolean;
}

const colorVariants = {
  blue: {
    bg: 'bg-blue-100',
    icon: 'text-blue-600',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  green: {
    bg: 'bg-green-100',
    icon: 'text-green-600',
    badge: 'bg-green-50 text-green-700 border-green-200',
  },
  purple: {
    bg: 'bg-purple-100',
    icon: 'text-purple-600',
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  orange: {
    bg: 'bg-orange-100',
    icon: 'text-orange-600',
    badge: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  red: {
    bg: 'bg-red-100',
    icon: 'text-red-600',
    badge: 'bg-red-50 text-red-700 border-red-200',
  },
  cyan: {
    bg: 'bg-cyan-100',
    icon: 'text-cyan-600',
    badge: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  },
};

const QuickStatsGrid: React.FC<QuickStatsGridProps> = ({ stats, loading = false }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, idx) => (
          <div
            key={idx}
            className="animate-pulse rounded-xl bg-white p-6 shadow-ferretto-md"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="h-12 w-12 rounded-full bg-gray-200" />
              <div className="h-6 w-20 rounded bg-gray-200" />
            </div>
            <div className="mb-2 h-4 w-24 rounded bg-gray-200" />
            <div className="h-10 w-32 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        const colors = colorVariants[stat.color];
        const isPositiveTrend = stat.trend && stat.trend.value > 0;
        const isNegativeTrend = stat.trend && stat.trend.value < 0;

        return (
          <div
            key={idx}
            onClick={stat.onClick}
            className={clsx(
              'group relative overflow-hidden rounded-xl bg-white p-6 shadow-ferretto-md transition-all duration-300',
              stat.onClick && 'cursor-pointer hover:-translate-y-1 hover:shadow-ferretto-xl'
            )}
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            {/* Hover gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-50 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            {/* Content */}
            <div className="relative z-10">
              {/* Header */}
              <div className="mb-4 flex items-start justify-between">
                <div className={clsx('rounded-full p-3 transition-transform duration-300 group-hover:scale-110', colors.bg)}>
                  <Icon className={clsx('h-7 w-7', colors.icon)} />
                </div>

                {stat.trend && (
                  <div
                    className={clsx(
                      'flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold',
                      colors.badge
                    )}
                  >
                    {isPositiveTrend && <TrendingUp className="h-3 w-3" />}
                    {isNegativeTrend && <TrendingDown className="h-3 w-3" />}
                    <span>
                      {isPositiveTrend && '+'}
                      {stat.trend.value}%
                    </span>
                  </div>
                )}
              </div>

              {/* Title */}
              <h3 className="mb-2 text-sm font-medium text-gray-600">
                {stat.title}
              </h3>

              {/* Value */}
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-bold text-gray-900">
                  {typeof stat.value === 'number'
                    ? stat.value.toLocaleString('it-IT')
                    : stat.value}
                </p>
              </div>

              {/* Trend Label */}
              {stat.trend && (
                <p className="mt-2 text-xs text-gray-500">
                  {stat.trend.label}
                </p>
              )}
            </div>

            {/* Bottom accent line */}
            <div className={clsx('absolute bottom-0 left-0 h-1 w-0 transition-all duration-300 group-hover:w-full', colors.bg)} />
          </div>
        );
      })}
    </div>
  );
};

export default QuickStatsGrid;
