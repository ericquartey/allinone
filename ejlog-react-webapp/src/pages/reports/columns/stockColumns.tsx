// ============================================================================
// EJLOG WMS - Stock Report Column Definitions
// Definizioni colonne per tabella report giacenze
// ============================================================================

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';

export interface StockData {
  articleCode: string;
  description: string;
  location: string;
  batch: string;
  quantity: number;
  uom: string;
  lastMovement: string;
  zone?: string;
  status?: string;
}

export const stockColumns: ColumnDef<StockData>[] = [
  {
    accessorKey: 'articleCode',
    header: 'Codice Articolo',
    cell: ({ row }) => (
      <span className="font-medium text-gray-900">{row.original.articleCode}</span>
    ),
  },
  {
    accessorKey: 'description',
    header: 'Descrizione',
    cell: ({ row }) => (
      <span className="text-gray-700">{row.original.description}</span>
    ),
  },
  {
    accessorKey: 'location',
    header: 'Ubicazione',
    cell: ({ row }) => (
      <span className="font-mono text-sm text-gray-900">{row.original.location}</span>
    ),
  },
  {
    accessorKey: 'zone',
    header: 'Zona',
    cell: ({ row }) => (
      <span className="text-gray-700">{row.original.zone || '-'}</span>
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
    accessorKey: 'status',
    header: 'Stato',
    cell: ({ row }) => {
      const status = row.original.status;
      if (!status) return <span className="text-gray-400">-</span>;

      const statusColors: Record<string, string> = {
        'DISPONIBILE': 'bg-green-100 text-green-800',
        'BLOCCATO': 'bg-red-100 text-red-800',
        'RISERVATO': 'bg-yellow-100 text-yellow-800',
        'IN_TRANSITO': 'bg-blue-100 text-blue-800',
      };

      const colorClass = statusColors[status] || 'bg-gray-100 text-gray-800';

      return (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
          {status.replace('_', ' ')}
        </span>
      );
    },
  },
  {
    accessorKey: 'lastMovement',
    header: 'Ultimo Movimento',
    cell: ({ row }) => {
      const date = row.original.lastMovement;
      if (!date) return <span className="text-gray-400">-</span>;

      try {
        const formattedDate = format(new Date(date), 'dd/MM/yyyy HH:mm');
        return <span className="text-sm text-gray-600">{formattedDate}</span>;
      } catch {
        return <span className="text-sm text-gray-600">{date}</span>;
      }
    },
  },
];
