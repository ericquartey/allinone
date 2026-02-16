// ============================================================================
// ChartsSection Component - Dashboard Charts
// Sezione grafici con Recharts: Liste per Tipo e Completamento Mensile
// ============================================================================

import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { BarChart3, TrendingUp } from 'lucide-react';

export interface ListTypeData {
  type: string;
  count: number;
  color: string;
}

export interface MonthlyCompletionData {
  month: string;
  completed: number;
  pending: number;
}

interface ChartsSectionProps {
  listTypeData: ListTypeData[];
  monthlyData: MonthlyCompletionData[];
  loading?: boolean;
}

const ChartsSection: React.FC<ChartsSectionProps> = ({
  listTypeData,
  monthlyData,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-xl bg-white p-6 shadow-ferretto-md">
            <div className="mb-6 h-6 w-48 animate-pulse rounded bg-gray-200" />
            <div className="h-80 animate-pulse rounded bg-gray-100" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Liste per Tipo - Bar Chart */}
      <div className="group rounded-xl bg-white p-6 shadow-ferretto-md transition-shadow duration-300 hover:shadow-ferretto-lg">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-lg bg-blue-100 p-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Liste per Tipo
            </h2>
            <p className="text-sm text-gray-500">
              Distribuzione liste per tipologia
            </p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={320}>
          <BarChart
            data={listTypeData}
            margin={{ top: 10, right: 10, left: -10, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
            <XAxis
              dataKey="type"
              tick={{ fill: '#6B7280', fontSize: 12 }}
              axisLine={{ stroke: '#E5E5E5' }}
            />
            <YAxis
              tick={{ fill: '#6B7280', fontSize: 12 }}
              axisLine={{ stroke: '#E5E5E5' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E5E5',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              }}
              cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
            />
            <Bar
              dataKey="count"
              name="Numero Liste"
              radius={[8, 8, 0, 0]}
              animationDuration={800}
            >
              {listTypeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {listTypeData.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-gray-700">
                {item.type}: <span className="font-semibold">{item.count}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Completamento Mensile - Line Chart */}
      <div className="group rounded-xl bg-white p-6 shadow-ferretto-md transition-shadow duration-300 hover:shadow-ferretto-lg">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-lg bg-green-100 p-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Completamento Mensile
            </h2>
            <p className="text-sm text-gray-500">
              Trend completamenti ultimi 6 mesi
            </p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={320}>
          <LineChart
            data={monthlyData}
            margin={{ top: 10, right: 10, left: -10, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
            <XAxis
              dataKey="month"
              tick={{ fill: '#6B7280', fontSize: 12 }}
              axisLine={{ stroke: '#E5E5E5' }}
            />
            <YAxis
              tick={{ fill: '#6B7280', fontSize: 12 }}
              axisLine={{ stroke: '#E5E5E5' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E5E5',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
            />
            <Line
              type="monotone"
              dataKey="completed"
              name="Completate"
              stroke="#10B981"
              strokeWidth={3}
              dot={{ fill: '#10B981', strokeWidth: 2, r: 5 }}
              activeDot={{ r: 7 }}
              animationDuration={800}
            />
            <Line
              type="monotone"
              dataKey="pending"
              name="In Sospeso"
              stroke="#F59E0B"
              strokeWidth={3}
              dot={{ fill: '#F59E0B', strokeWidth: 2, r: 5 }}
              activeDot={{ r: 7 }}
              animationDuration={800}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Summary Stats */}
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-200 pt-4">
          <div className="rounded-lg bg-green-50 p-3">
            <p className="text-xs font-medium text-green-700">
              Completate (totale)
            </p>
            <p className="mt-1 text-2xl font-bold text-green-900">
              {monthlyData.reduce((sum, item) => sum + item.completed, 0)}
            </p>
          </div>
          <div className="rounded-lg bg-orange-50 p-3">
            <p className="text-xs font-medium text-orange-700">
              In Sospeso (totale)
            </p>
            <p className="mt-1 text-2xl font-bold text-orange-900">
              {monthlyData.reduce((sum, item) => sum + item.pending, 0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartsSection;
