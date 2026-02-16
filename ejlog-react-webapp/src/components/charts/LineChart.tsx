import { FC } from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';

export interface LineChartDataPoint {
  name: string;
  [key: string]: string | number;
}

export interface LineConfig {
  dataKey: string;
  stroke: string;
  name?: string;
  strokeWidth?: number;
  dot?: boolean;
}

interface LineChartProps {
  data: LineChartDataPoint[];
  lines: LineConfig[];
  height?: number;
  xAxisKey?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  formatYAxis?: (value: number) => string;
  formatXAxis?: (value: string) => string;
  formatTooltip?: (value: number, name: string) => string;
}

const CustomTooltip: FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3">
      <p className="font-semibold text-gray-900 mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-700">{entry.name}:</span>
          <span className="font-semibold text-gray-900">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export const LineChart: FC<LineChartProps> = ({
  data,
  lines,
  height = 300,
  xAxisKey = 'name',
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  formatYAxis,
  formatXAxis,
}) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
        <XAxis
          dataKey={xAxisKey}
          tick={{ fill: '#6b7280', fontSize: 12 }}
          tickFormatter={formatXAxis}
        />
        <YAxis
          tick={{ fill: '#6b7280', fontSize: 12 }}
          tickFormatter={formatYAxis}
        />
        {showTooltip && <Tooltip content={<CustomTooltip />} />}
        {showLegend && (
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />
        )}
        {lines.map((lineConfig) => (
          <Line
            key={lineConfig.dataKey}
            type="monotone"
            dataKey={lineConfig.dataKey}
            stroke={lineConfig.stroke}
            name={lineConfig.name || lineConfig.dataKey}
            strokeWidth={lineConfig.strokeWidth || 2}
            dot={lineConfig.dot !== false}
            activeDot={{ r: 6 }}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
};
