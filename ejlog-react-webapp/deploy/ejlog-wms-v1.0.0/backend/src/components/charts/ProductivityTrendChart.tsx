// ============================================================================
// EJLOG WMS - Productivity Trend Chart Component
// Grafico trend produttività e efficienza operatori
// ============================================================================

import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import Card from '../shared/Card';

// Types
export interface ProductivityChartData {
  userName: string;
  efficiency: number;
  tasksCompleted: number;
  activeHours: number;
}

interface ProductivityTrendChartProps {
  data: ProductivityChartData[];
  chartType?: 'line' | 'bar';
  height?: number;
}

// Ferrari Red color theme
const FERRARI_RED = '#CD202C';
const SECONDARY_COLOR = '#1E40AF'; // Blue
const GRID_COLOR = '#E5E7EB';

const ProductivityTrendChart: React.FC<ProductivityTrendChartProps> = React.memo(({
  data,
  chartType = 'bar',
  height = 400,
}) => {
  // Memoize text summary for screen readers
  const textSummary = useMemo(() => {
    if (!data || data.length === 0) return '';
    return data
      .map((item) => `${item.userName}: ${item.efficiency}% efficienza, ${item.tasksCompleted} task completati`)
      .join('; ');
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <p>Nessun dato disponibile per la visualizzazione del grafico</p>
        </div>
      </Card>
    );
  }

  const renderChart = useMemo(() => () => {
    if (chartType === 'line') {
      return (
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
          <XAxis
            dataKey="userName"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: `1px solid ${GRID_COLOR}`,
              borderRadius: '8px',
              padding: '12px',
            }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="efficiency"
            stroke={FERRARI_RED}
            strokeWidth={2}
            name="Efficienza %"
            dot={{ fill: FERRARI_RED, r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="tasksCompleted"
            stroke={SECONDARY_COLOR}
            strokeWidth={2}
            name="Task Completati"
            dot={{ fill: SECONDARY_COLOR, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      );
    }

    return (
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
        <XAxis
          dataKey="userName"
          tick={{ fontSize: 12 }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: `1px solid ${GRID_COLOR}`,
            borderRadius: '8px',
            padding: '12px',
          }}
        />
        <Legend wrapperStyle={{ paddingTop: '20px' }} />
        <Bar
          dataKey="efficiency"
          fill={FERRARI_RED}
          name="Efficienza %"
          radius={[8, 8, 0, 0]}
        />
        <Bar
          dataKey="tasksCompleted"
          fill={SECONDARY_COLOR}
          name="Task Completati"
          radius={[8, 8, 0, 0]}
        />
      </BarChart>
    );
  }, [data, chartType]);

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Trend Produttività Operatori
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Confronto efficienza e task completati per operatore
        </p>
      </div>

      {/* WCAG 2.1 AA: Provide text alternative for chart */}
      <figure aria-label="Grafico produttività operatori">
        <figcaption className="sr-only">
          Grafico {chartType === 'line' ? 'a linee' : 'a barre'} che mostra la produttività degli operatori.
          {textSummary}
        </figcaption>

        <div aria-hidden="true">
          <ResponsiveContainer width="100%" height={height}>
            {renderChart()}
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
                <th className="px-4 py-2 border-b text-left text-sm font-semibold">Operatore</th>
                <th className="px-4 py-2 border-b text-left text-sm font-semibold">Efficienza %</th>
                <th className="px-4 py-2 border-b text-left text-sm font-semibold">Task Completati</th>
                <th className="px-4 py-2 border-b text-left text-sm font-semibold">Ore Attive</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border-b text-sm">{item.userName}</td>
                  <td className="px-4 py-2 border-b text-sm">{item.efficiency}%</td>
                  <td className="px-4 py-2 border-b text-sm">{item.tasksCompleted}</td>
                  <td className="px-4 py-2 border-b text-sm">{item.activeHours}h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </figure>
    </Card>
  );
});

// Display name for React DevTools
ProductivityTrendChart.displayName = 'ProductivityTrendChart';

export default ProductivityTrendChart;
