// ============================================================================
// EJLOG WMS - Stock Level Chart Component
// Grafico livelli giacenza per ubicazione/zona
// ============================================================================

import React, { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import Card from '../shared/Card';

// Types
export interface StockChartData {
  location: string;
  quantity: number;
  status?: string;
}

interface StockLevelChartProps {
  data: StockChartData[];
  groupBy?: 'location' | 'status';
  height?: number;
}

// Ferrari Red color palette
const COLORS = [
  '#CD202C', // Ferrari Red
  '#1E40AF', // Blue
  '#059669', // Green
  '#D97706', // Orange
  '#7C3AED', // Purple
  '#DC2626', // Red
  '#2563EB', // Light Blue
  '#10B981', // Light Green
];

const StockLevelChart: React.FC<StockLevelChartProps> = React.memo(({
  data,
  groupBy = 'location',
  height = 400,
}) => {
  // Aggregate data by location or status - memoized for performance
  const aggregatedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const aggregated = data.reduce((acc, item) => {
      const key = groupBy === 'location' ? item.location : (item.status || 'Unknown');
      const existing = acc.find((d) => d.name === key);

      if (existing) {
        existing.value += item.quantity;
      } else {
        acc.push({
          name: key,
          value: item.quantity,
        });
      }

      return acc;
    }, [] as Array<{ name: string; value: number }>);

    // Sort by value descending
    aggregated.sort((a, b) => b.value - a.value);
    return aggregated;
  }, [data, groupBy]);

  if (!data || data.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <p>Nessun dato disponibile per la visualizzazione del grafico</p>
        </div>
      </Card>
    );
  }

  // Custom label for pie chart
  const renderLabel = (entry: any) => {
    const totalQuantity = aggregatedData.reduce((sum, d) => sum + d.value, 0);
    const percent = ((entry.value / totalQuantity) * 100).toFixed(1);
    return `${entry.name} (${percent}%)`;
  };

  // Calculate text summary for screen readers - memoized
  const { totalQuantity, textSummary } = useMemo(() => {
    const total = aggregatedData.reduce((sum, d) => sum + d.value, 0);
    const summary = aggregatedData
      .map((item) => {
        const percent = ((item.value / total) * 100).toFixed(1);
        return `${item.name}: ${item.value} unità (${percent}%)`;
      })
      .join(', ');
    return { totalQuantity: total, textSummary: summary };
  }, [aggregatedData]);

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Distribuzione Giacenze
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          {groupBy === 'location'
            ? 'Quantità per ubicazione'
            : 'Quantità per stato'}
        </p>
      </div>

      {/* WCAG 2.1 AA: Provide text alternative for chart */}
      <figure aria-label="Grafico distribuzione giacenze">
        <figcaption className="sr-only">
          Grafico a torta che mostra la distribuzione delle giacenze.
          Totale: {totalQuantity} unità. {textSummary}
        </figcaption>

        <div aria-hidden="true">
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={aggregatedData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderLabel}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {aggregatedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '12px',
                }}
                formatter={(value: number) => [`${value} unità`, 'Quantità']}
              />
              <Legend
                wrapperStyle={{
                  paddingTop: '20px',
                }}
                formatter={(value) => {
                  const item = aggregatedData.find(d => d.name === value);
                  return item ? `${value} (${item.value})` : value;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Accessible table alternative */}
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800 font-medium">
            Visualizza dati come tabella
          </summary>
          <table className="min-w-full mt-2 border border-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 border-b text-left text-sm font-semibold">
                  {groupBy === 'location' ? 'Ubicazione' : 'Stato'}
                </th>
                <th className="px-4 py-2 border-b text-left text-sm font-semibold">Quantità</th>
                <th className="px-4 py-2 border-b text-left text-sm font-semibold">Percentuale</th>
              </tr>
            </thead>
            <tbody>
              {aggregatedData.map((item, index) => {
                const percent = ((item.value / totalQuantity) * 100).toFixed(1);
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border-b text-sm">{item.name}</td>
                    <td className="px-4 py-2 border-b text-sm">{item.value} unità</td>
                    <td className="px-4 py-2 border-b text-sm">{percent}%</td>
                  </tr>
                );
              })}
              <tr className="font-semibold bg-gray-100">
                <td className="px-4 py-2 border-t text-sm">Totale</td>
                <td className="px-4 py-2 border-t text-sm">{totalQuantity} unità</td>
                <td className="px-4 py-2 border-t text-sm">100%</td>
              </tr>
            </tbody>
          </table>
        </details>
      </figure>
    </Card>
  );
});

// Display name for React DevTools
StockLevelChart.displayName = 'StockLevelChart';

export default StockLevelChart;
