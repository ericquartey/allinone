// ============================================================================
// EJLOG WMS - KPI Cards Widget
// Widget con cards metriche chiave del sistema
// ============================================================================

import React from 'react';
import { motion } from 'framer-motion';
import { useKPICards } from '../hooks/useDashboardData';
import WidgetContainer from '../components/WidgetContainer';
import EmptyWidget from '../components/EmptyWidget';
import type { KPICard } from '../types/dashboard.types';

/**
 * Widget KPI Cards - Metriche chiave sistema
 */
export const KPICardsWidget: React.FC = () => {
  const { data, isLoading, error } = useKPICards();

  const kpiData = data?.data;

  const getIcon = (iconName: string) => {
    const iconClass = 'w-6 h-6';

    switch (iconName) {
      case 'package':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        );
      case 'truck':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0h4"
            />
          </svg>
        );
      case 'trending-up':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          </svg>
        );
      case 'alert-triangle':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      yellow: 'bg-yellow-100 text-yellow-600',
      red: 'bg-red-100 text-red-600',
      purple: 'bg-purple-100 text-purple-600',
      gray: 'bg-gray-100 text-gray-600',
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  const getTrendIcon = (direction: 'up' | 'down' | 'stable') => {
    const iconClass = 'w-4 h-4';

    switch (direction) {
      case 'up':
        return (
          <svg className={`${iconClass} text-green-500`} fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'down':
        return (
          <svg className={`${iconClass} text-red-500`} fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return (
          <svg className={`${iconClass} text-gray-500`} fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  const renderKPICard = (card: KPICard, index: number) => (
    <motion.div
      key={card.id}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${getColorClasses(card.color)}`}>
          {getIcon(card.icon)}
        </div>
        {card.trend && (
          <div className="flex items-center space-x-1">
            {getTrendIcon(card.trend.direction)}
            <span
              className={`text-sm font-medium ${
                card.trend.direction === 'up'
                  ? 'text-green-600'
                  : card.trend.direction === 'down'
                  ? 'text-red-600'
                  : 'text-gray-600'
              }`}
            >
              {card.trend.percentage > 0 ? '+' : ''}
              {card.trend.percentage}%
            </span>
          </div>
        )}
      </div>

      <div>
        <p className="text-sm text-gray-600 mb-1">{card.title}</p>
        <p className="text-3xl font-bold text-gray-900">
          {card.value}
          {card.unit && <span className="text-xl text-gray-600 ml-1">{card.unit}</span>}
        </p>
        {card.subtitle && <p className="text-sm text-gray-500 mt-2">{card.subtitle}</p>}
        {card.trend && (
          <p className="text-xs text-gray-500 mt-1">{card.trend.comparisonPeriod}</p>
        )}
      </div>
    </motion.div>
  );

  return (
    <WidgetContainer
      title="KPI Dashboard"
      subtitle="Metriche chiave del sistema"
      isLoading={isLoading}
      error={error ? 'Errore nel caricamento dei KPI' : null}
      icon={
        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      }
    >
      {!kpiData || kpiData.cards.length === 0 ? (
        <EmptyWidget
          title="Nessun KPI disponibile"
          message="Non ci sono metriche da visualizzare al momento."
          icon="data"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpiData.cards.map((card, index) => renderKPICard(card, index))}
        </div>
      )}
    </WidgetContainer>
  );
};

export default KPICardsWidget;
