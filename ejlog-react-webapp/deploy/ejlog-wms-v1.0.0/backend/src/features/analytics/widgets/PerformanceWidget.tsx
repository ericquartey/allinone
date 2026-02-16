import { FC } from 'react';
import { LineChart, LineChartDataPoint, AreaChart } from '../../../components/charts';
import {
  BoltIcon,
  UserGroupIcon,
  CubeIcon,
  TruckIcon,
} from '@heroicons/react/24/outline';

export interface PerformanceData {
  lists: {
    totalExecuted: number;
    avgItemsPerHour: number;
    efficiency: number; // percentage
    trend: LineChartDataPoint[];
  };
  locations: {
    utilizationRate: number; // percentage
    totalOccupied: number;
    totalAvailable: number;
    trend: LineChartDataPoint[];
  };
  movements: {
    totalToday: number;
    avgPerHour: number;
    peakHour: string;
    trend: LineChartDataPoint[];
  };
  users: {
    activeNow: number;
    totalSessions: number;
    avgSessionDuration: number; // in minutes
  };
}

interface PerformanceWidgetProps {
  data: PerformanceData;
  isLoading?: boolean;
}

export const PerformanceWidget: FC<PerformanceWidgetProps> = ({
  data,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Performance Operativa
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Metriche di efficienza e produttività
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Lists Performance */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <BoltIcon className="h-6 w-6 text-blue-600" />
            <span className="text-xs font-semibold text-blue-700 bg-blue-200 px-2 py-1 rounded">
              {data.lists.efficiency.toFixed(0)}%
            </span>
          </div>
          <div className="text-2xl font-bold text-blue-900 mb-1">
            {data.lists.avgItemsPerHour.toFixed(0)}
          </div>
          <div className="text-xs text-blue-700">Articoli/ora</div>
          <div className="text-xs text-blue-600 mt-1">
            {data.lists.totalExecuted} liste oggi
          </div>
        </div>

        {/* Location Utilization */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between mb-3">
            <CubeIcon className="h-6 w-6 text-green-600" />
            <span className="text-xs font-semibold text-green-700 bg-green-200 px-2 py-1 rounded">
              {data.locations.utilizationRate.toFixed(0)}%
            </span>
          </div>
          <div className="text-2xl font-bold text-green-900 mb-1">
            {data.locations.totalOccupied}
          </div>
          <div className="text-xs text-green-700">Ubicazioni occupate</div>
          <div className="text-xs text-green-600 mt-1">
            su {data.locations.totalAvailable} totali
          </div>
        </div>

        {/* Movements */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center justify-between mb-3">
            <TruckIcon className="h-6 w-6 text-purple-600" />
            <span className="text-xs font-semibold text-purple-700 bg-purple-200 px-2 py-1 rounded">
              {data.movements.avgPerHour.toFixed(0)}/h
            </span>
          </div>
          <div className="text-2xl font-bold text-purple-900 mb-1">
            {data.movements.totalToday}
          </div>
          <div className="text-xs text-purple-700">Movimenti oggi</div>
          <div className="text-xs text-purple-600 mt-1">
            Picco: {data.movements.peakHour}
          </div>
        </div>

        {/* Users */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center justify-between mb-3">
            <UserGroupIcon className="h-6 w-6 text-orange-600" />
            <span className="text-xs font-semibold text-orange-700 bg-orange-200 px-2 py-1 rounded">
              {data.users.activeNow} attivi
            </span>
          </div>
          <div className="text-2xl font-bold text-orange-900 mb-1">
            {data.users.totalSessions}
          </div>
          <div className="text-xs text-orange-700">Sessioni oggi</div>
          <div className="text-xs text-orange-600 mt-1">
            Durata media: {data.users.avgSessionDuration.toFixed(0)}min
          </div>
        </div>
      </div>

      {/* Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lists Efficiency Trend */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            Efficienza Liste (Ultimi 7 giorni)
          </h4>
          <LineChart
            data={data.lists.trend}
            lines={[
              {
                dataKey: 'efficiency',
                stroke: '#3b82f6',
                name: 'Efficienza %',
                strokeWidth: 2,
              },
              {
                dataKey: 'itemsPerHour',
                stroke: '#10b981',
                name: 'Articoli/ora',
                strokeWidth: 2,
              },
            ]}
            height={180}
            showGrid={true}
            showLegend={true}
          />
        </div>

        {/* Movements Trend */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            Movimenti Orari (Oggi)
          </h4>
          <AreaChart
            data={data.movements.trend}
            areas={[
              {
                dataKey: 'movements',
                fill: '#8b5cf6',
                stroke: '#7c3aed',
                name: 'Movimenti',
              },
            ]}
            height={180}
            showGrid={true}
            showLegend={false}
          />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-sm text-gray-600 mb-1">Produttività</div>
            <div className="text-2xl font-bold text-gray-900">
              {((data.lists.efficiency + data.locations.utilizationRate) / 2).toFixed(0)}%
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Liste/Giorno</div>
            <div className="text-2xl font-bold text-gray-900">
              {data.lists.totalExecuted}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Utilizzo Spazi</div>
            <div className="text-2xl font-bold text-gray-900">
              {data.locations.utilizationRate.toFixed(0)}%
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Operatori Attivi</div>
            <div className="text-2xl font-bold text-gray-900">
              {data.users.activeNow}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
