// ============================================================================
// EJLOG WMS - Chart Legend Component
// Legenda riutilizzabile per grafici Recharts
// ============================================================================

import React from 'react';

interface LegendItem {
  label: string;
  color: string;
  value?: string | number;
}

interface ChartLegendProps {
  items: LegendItem[];
  layout?: 'horizontal' | 'vertical';
  className?: string;
}

/**
 * Legenda personalizzata per grafici
 */
export const ChartLegend: React.FC<ChartLegendProps> = ({
  items,
  layout = 'horizontal',
  className = '',
}) => {
  const containerClass =
    layout === 'horizontal'
      ? 'flex flex-wrap gap-4 justify-center'
      : 'flex flex-col space-y-2';

  return (
    <div className={`${containerClass} ${className}`}>
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-sm text-gray-700">{item.label}</span>
          {item.value !== undefined && (
            <span className="text-sm font-medium text-gray-900">({item.value})</span>
          )}
        </div>
      ))}
    </div>
  );
};

export default ChartLegend;
