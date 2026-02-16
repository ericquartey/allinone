// ============================================================================
// EJLOG WMS - Lists Report Column Definitions
// Definizioni colonne per tabella report liste
// ============================================================================

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';

export interface ListData {
  listId: string;
  type: 'PICKING' | 'REFILLING' | 'INVENTORY';
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  assignedUser: string;
  itemsTotal: number;
  itemsCompleted: number;
  completionPercentage: number;
  startTime: string;
  endTime?: string;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
}

export const listsColumns: ColumnDef<ListData>[] = [
  {
    accessorKey: 'listId',
    header: 'ID Lista',
    cell: ({ row }) => (
      <span className="font-mono text-sm font-medium text-gray-900">{row.original.listId}</span>
    ),
  },
  {
    accessorKey: 'type',
    header: 'Tipo',
    cell: ({ row }) => {
      const type = row.original.type;
      const typeColors: Record<string, string> = {
        'PICKING': 'bg-blue-100 text-blue-800',
        'REFILLING': 'bg-green-100 text-green-800',
        'INVENTORY': 'bg-purple-100 text-purple-800',
      };

      const typeLabels: Record<string, string> = {
        'PICKING': 'Prelievo',
        'REFILLING': 'Rifornimento',
        'INVENTORY': 'Inventario',
      };

      return (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${typeColors[type]}`}>
          {typeLabels[type]}
        </span>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Stato',
    cell: ({ row }) => {
      const status = row.original.status;
      const statusColors: Record<string, string> = {
        'OPEN': 'bg-gray-100 text-gray-800',
        'IN_PROGRESS': 'bg-yellow-100 text-yellow-800',
        'COMPLETED': 'bg-green-100 text-green-800',
        'CANCELLED': 'bg-red-100 text-red-800',
      };

      const statusLabels: Record<string, string> = {
        'OPEN': 'Aperta',
        'IN_PROGRESS': 'In Corso',
        'COMPLETED': 'Completata',
        'CANCELLED': 'Annullata',
      };

      return (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
          {statusLabels[status]}
        </span>
      );
    },
  },
  {
    accessorKey: 'assignedUser',
    header: 'Utente Assegnato',
    cell: ({ row }) => (
      <span className="text-sm text-gray-700">{row.original.assignedUser}</span>
    ),
  },
  {
    accessorKey: 'completionPercentage',
    header: 'Completamento',
    cell: ({ row }) => {
      const percentage = row.original.completionPercentage;
      return (
        <div className="flex items-center space-x-2">
          <div className="flex-1 bg-gray-200 rounded-full h-2 w-24">
            <div
              className="bg-ferrRed h-2 rounded-full transition-all"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="text-sm font-medium text-gray-700 w-12 text-right">{percentage}%</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'itemsTotal',
    header: 'Righe',
    cell: ({ row }) => (
      <div className="text-sm text-gray-700">
        <span className="font-medium">{row.original.itemsCompleted}</span>
        <span className="text-gray-400"> / </span>
        <span>{row.original.itemsTotal}</span>
      </div>
    ),
  },
  {
    accessorKey: 'startTime',
    header: 'Inizio',
    cell: ({ row }) => {
      try {
        const date = format(new Date(row.original.startTime), 'dd/MM/yyyy HH:mm');
        return <span className="text-sm text-gray-600">{date}</span>;
      } catch {
        return <span className="text-sm text-gray-600">{row.original.startTime}</span>;
      }
    },
  },
  {
    accessorKey: 'endTime',
    header: 'Fine',
    cell: ({ row }) => {
      if (!row.original.endTime) return <span className="text-gray-400">-</span>;
      try {
        const date = format(new Date(row.original.endTime), 'dd/MM/yyyy HH:mm');
        return <span className="text-sm text-gray-600">{date}</span>;
      } catch {
        return <span className="text-sm text-gray-600">{row.original.endTime}</span>;
      }
    },
  },
];
