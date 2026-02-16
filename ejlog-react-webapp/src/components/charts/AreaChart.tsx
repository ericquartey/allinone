import { FC } from 'react';
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';

export interface AreaChartDataPoint {
  name: string;
  [key: string]: string | number;
}

export interface AreaConfig {
  dataKey: string;
  fill: string;
  stroke: string;
  name?: string;
  stackId?: string;
}

interface AreaChartProps {
  data: AreaChartDataPoint[];
  areas: AreaConfig[];
  height?: number;
  xAxisKey?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  formatYAxis?: (value: number) => string;
  formatXAxis?: (value: string) => string;
  stacked?: boolean;
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

export const AreaChart: FC<AreaChartProps> = ({
  data,
  areas,
  height = 300,
  xAxisKey = 'name',
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  formatYAxis,
  formatXAxis,
  stacked = false,
}) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart
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
            iconType="rect"
          />
        )}
        {areas.map((areaConfig) => (
          <Area
            key={areaConfig.dataKey}
            type="monotone"
            dataKey={areaConfig.dataKey}
            stroke={areaConfig.stroke}
            fill={areaConfig.fill}
            name={areaConfig.name || areaConfig.dataKey}
            stackId={stacked ? 'stack' : areaConfig.stackId}
            fillOpacity={0.6}
          />
        ))}
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
};
