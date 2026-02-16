import { FC } from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
  Cell,
} from 'recharts';

export interface BarChartDataPoint {
  name: string;
  [key: string]: string | number;
}

export interface BarConfig {
  dataKey: string;
  fill: string;
  name?: string;
  stackId?: string;
  radius?: number | [number, number, number, number];
}

interface BarChartProps {
  data: BarChartDataPoint[];
  bars: BarConfig[];
  height?: number;
  xAxisKey?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  orientation?: 'vertical' | 'horizontal';
  formatYAxis?: (value: number) => string;
  formatXAxis?: (value: string) => string;
  colorByValue?: boolean;
  colors?: string[];
}

const CustomTooltip: FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3">
      <p className="font-semibold text-gray-900 mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div
            className="w-3 h-3 rounded"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-700">{entry.name}:</span>
          <span className="font-semibold text-gray-900">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export const BarChart: FC<BarChartProps> = ({
  data,
  bars,
  height = 300,
  xAxisKey = 'name',
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  orientation = 'vertical',
  formatYAxis,
  formatXAxis,
  colorByValue = false,
  colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
}) => {
  const ChartComponent = orientation === 'horizontal' ? RechartsBarChart : RechartsBarChart;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ChartComponent
        data={data}
        layout={orientation === 'horizontal' ? 'horizontal' : 'vertical'}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
        {orientation === 'vertical' ? (
          <>
            <XAxis
              dataKey={xAxisKey}
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickFormatter={formatXAxis}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickFormatter={formatYAxis}
            />
          </>
        ) : (
          <>
            <XAxis
              type="number"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickFormatter={formatYAxis}
            />
            <YAxis
              dataKey={xAxisKey}
              type="category"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickFormatter={formatXAxis}
            />
          </>
        )}
        {showTooltip && <Tooltip content={<CustomTooltip />} />}
        {showLegend && (
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="rect"
          />
        )}
        {bars.map((barConfig, barIndex) => (
          <Bar
            key={barConfig.dataKey}
            dataKey={barConfig.dataKey}
            fill={barConfig.fill}
            name={barConfig.name || barConfig.dataKey}
            stackId={barConfig.stackId}
            radius={barConfig.radius || [4, 4, 0, 0]}
          >
            {colorByValue &&
              data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
          </Bar>
        ))}
      </ChartComponent>
    </ResponsiveContainer>
  );
};
