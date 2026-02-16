// ============================================================================
// EJLOG WMS - Movements Report Column Definitions
// Definizioni colonne per tabella report movimenti
// ============================================================================

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';

export interface MovementData {
  movementId: string;
  type: 'IN' | 'OUT' | 'TRANSFER';
  articleCode: string;
  articleDescription: string;
  fromLocation: string;
  toLocation: string;
  quantity: number;
  uom: string;
  user: string;
  timestamp: string;
  batch?: string;
}

export const movementsColumns: ColumnDef<MovementData>[] = [
  {
    accessorKey: 'movementId',
    header: 'ID Movimento',
    cell: ({ row }) => (
      <span className="font-mono text-sm text-gray-900">{row.original.movementId}</span>
    ),
  },
  {
    accessorKey: 'type',
    header: 'Tipo',
    cell: ({ row }) => {
      const type = row.original.type;
      const typeColors: Record<string, string> = {
        'IN': 'bg-green-100 text-green-800',
        'OUT': 'bg-red-100 text-red-800',
        'TRANSFER': 'bg-blue-100 text-blue-800',
      };

      const typeLabels: Record<string, string> = {
        'IN': 'Ingresso',
        'OUT': 'Uscita',
        'TRANSFER': 'Trasferimento',
      };

      const colorClass = typeColors[type] || 'bg-gray-100 text-gray-800';

      return (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
          {typeLabels[type] || type}
        </span>
      );
    },
  },
  {
    accessorKey: 'articleCode',
    header: 'Codice Articolo',
    cell: ({ row }) => (
      <div>
        <div className="font-medium text-gray-900">{row.original.articleCode}</div>
        <div className="text-xs text-gray-500">{row.original.articleDescription}</div>
      </div>
    ),
  },
  {
    accessorKey: 'fromLocation',
    header: 'Da Ubicazione',
    cell: ({ row }) => (
      <span className="font-mono text-sm text-gray-700">
        {row.original.fromLocation || '-'}
      </span>
    ),
  },
  {
    accessorKey: 'toLocation',
    header: 'A Ubicazione',
    cell: ({ row }) => (
      <span className="font-mono text-sm text-gray-700">
        {row.original.toLocation || '-'}
      </span>
    ),
  },
  {
    accessorKey: 'quantity',
    header: 'Quantità',
    cell: ({ row }) => (
      <div className="text-right">
        <span className="font-semibold text-gray-900">{row.original.quantity}</span>
        <span className="ml-1 text-xs text-gray-500">{row.original.uom}</span>
      </div>
    ),
  },
  {
    accessorKey: 'batch',
    header: 'Lotto',
    cell: ({ row }) => (
      <span className="font-mono text-sm text-gray-700">{row.original.batch || '-'}</span>
    ),
  },
  {
    accessorKey: 'user',
    header: 'Utente',
    cell: ({ row }) => (
      <span className="text-sm text-gray-700">{row.original.user}</span>
    ),
  },
  {
    accessorKey: 'timestamp',
    header: 'Data/Ora',
    cell: ({ row }) => {
      const date = row.original.timestamp;
      if (!date) return <span className="text-gray-400">-</span>;

      try {
        const formattedDate = format(new Date(date), 'dd/MM/yyyy HH:mm:ss');
        return <span className="text-sm text-gray-600">{formattedDate}</span>;
      } catch {
        return <span className="text-sm text-gray-600">{date}</span>;
      }
    },
  },
];
