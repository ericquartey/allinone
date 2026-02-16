// ============================================================================
// EJLOG WMS - Productivity Report Column Definitions
// Definizioni colonne per tabella report produttività
// ============================================================================

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';

export interface ProductivityData {
  userId: string;
  userName: string;
  tasksCompleted: number;
  totalItems: number;
  averageTimePerTask: number; // in minutes
  efficiency: number; // percentage
  activeHours: number;
  date: string;
  department?: string;
}

export const productivityColumns: ColumnDef<ProductivityData>[] = [
  {
    accessorKey: 'userName',
    header: 'Operatore',
    cell: ({ row }) => (
      <div>
        <div className="font-medium text-gray-900">{row.original.userName}</div>
        <div className="text-xs text-gray-500 font-mono">{row.original.userId}</div>
      </div>
    ),
  },
  {
    accessorKey: 'department',
    header: 'Reparto',
    cell: ({ row }) => (
      <span className="text-sm text-gray-700">{row.original.department || '-'}</span>
    ),
  },
  {
    accessorKey: 'tasksCompleted',
    header: 'Task Completati',
    cell: ({ row }) => (
      <div className="text-center">
        <span className="text-lg font-semibold text-gray-900">{row.original.tasksCompleted}</span>
      </div>
    ),
  },
  {
    accessorKey: 'totalItems',
    header: 'Righe Totali',
    cell: ({ row }) => (
      <div className="text-center">
        <span className="text-lg font-semibold text-gray-900">{row.original.totalItems}</span>
      </div>
    ),
  },
  {
    accessorKey: 'averageTimePerTask',
    header: 'Tempo Medio',
    cell: ({ row }) => {
      const minutes = row.original.averageTimePerTask;
      const hours = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);

      return (
        <div className="text-center">
          <span className="text-sm font-medium text-gray-700">
            {hours > 0 ? `${hours}h ` : ''}{mins}m
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: 'efficiency',
    header: 'Efficienza',
    cell: ({ row }) => {
      const efficiency = row.original.efficiency;
      const color = efficiency >= 90 ? 'text-green-700 bg-green-100' :
                    efficiency >= 70 ? 'text-yellow-700 bg-yellow-100' :
                    'text-red-700 bg-red-100';

      return (
        <div className="flex items-center justify-center">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${color}`}>
            {efficiency}%
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: 'activeHours',
    header: 'Ore Attive',
    cell: ({ row }) => {
      const hours = row.original.activeHours;
      return (
        <div className="text-center">
          <span className="text-sm font-medium text-gray-700">{hours.toFixed(1)}h</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'date',
    header: 'Data',
    cell: ({ row }) => {
      const date = row.original.date;
      if (!date) return <span className="text-gray-400">-</span>;

      try {
        const formattedDate = format(new Date(date), 'dd/MM/yyyy');
        return <span className="text-sm text-gray-600">{formattedDate}</span>;
      } catch {
        return <span className="text-sm text-gray-600">{date}</span>;
      }
    },
  },
];
