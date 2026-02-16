// ============================================================================
// EJLOG WMS - Orders Page Enhanced
// Pagina gestione ordini
// ============================================================================

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import { EyeIcon, PlusIcon } from 'lucide-react';
import DataGridAdvanced from '../../components/common/DataGridAdvanced';
import { useGetOrdersQuery } from '../../services/api/ordersApi';
import type { Order, OrderFilters } from '../../services/api/ordersApi';

const OrdersPageEnhanced: React.FC = () => {
  const navigate = useNavigate();

  const [filters, setFilters] = useState<OrderFilters>({
    page: 1,
    pageSize: 20,
    orderBy: 'createdAt',
    sortDirection: 'desc',
  });

  const { data, isLoading, error, refetch } = useGetOrdersQuery(filters);

  const columns = useMemo<ColumnDef<Order>[]>(
    () => [
      {
        accessorKey: 'orderNumber',
        header: 'Numero Ordine',
        cell: ({ row }) => (
          <button
            onClick={() => navigate(`/orders/${row.original.id}`)}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            {row.original.orderNumber}
          </button>
        ),
      },
      {
        accessorKey: 'orderType',
        header: 'Tipo',
        cell: ({ getValue }) => {
          const type = getValue() as string;
          const colors: Record<string, string> = {
            INBOUND: 'bg-green-100 text-green-800',
            OUTBOUND: 'bg-blue-100 text-blue-800',
            TRANSFER: 'bg-purple-100 text-purple-800',
          };
          return (
            <span className={`px-2 py-1 text-xs rounded-full ${colors[type]}`}>
              {type}
            </span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Stato',
        cell: ({ getValue }) => {
          const status = getValue() as string;
          const colors: Record<string, string> = {
            PENDING: 'bg-yellow-100 text-yellow-800',
            PROCESSING: 'bg-blue-100 text-blue-800',
            COMPLETED: 'bg-green-100 text-green-800',
            CANCELLED: 'bg-red-100 text-red-800',
          };
          return (
            <span className={`px-2 py-1 text-xs rounded-full ${colors[status]}`}>
              {status}
            </span>
          );
        },
      },
      {
        accessorKey: 'customerName',
        header: 'Cliente/Fornitore',
        cell: ({ row }) => row.original.customerName || row.original.supplierName || '-',
      },
      {
        accessorKey: 'priority',
        header: 'Priorità',
      },
      {
        id: 'progress',
        header: 'Avanzamento',
        cell: ({ row }) => {
          const total = row.original.totalLines;
          const completed = row.original.completedLines;
          const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

          return (
            <div className="flex items-center gap-2">
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-xs text-gray-600">{percentage}%</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'expectedDate',
        header: 'Data Prevista',
        cell: ({ getValue }) => {
          const date = getValue() as string | undefined;
          return date ? new Date(date).toLocaleDateString('it-IT') : '-';
        },
      },
      {
        id: 'actions',
        header: 'Azioni',
        cell: ({ row }) => (
          <button
            onClick={() => navigate(`/orders/${row.original.id}`)}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
          >
            <EyeIcon className="w-4 h-4" />
          </button>
        ),
      },
    ],
    [navigate]
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestione Ordini</h1>
          <p className="text-gray-600">Visualizza e gestisci ordini in entrata e uscita</p>
        </div>
        <button
          onClick={() => navigate('/orders/create')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="w-4 h-4" />
          Nuovo Ordine
        </button>
      </div>

      {/* Filtri */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Ordine</label>
            <select
              value={filters.orderType || ''}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, orderType: e.target.value as any || undefined }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Tutti</option>
              <option value="INBOUND">Entrata</option>
              <option value="OUTBOUND">Uscita</option>
              <option value="TRANSFER">Trasferimento</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stato</label>
            <select
              value={filters.status || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Tutti</option>
              <option value="PENDING">In Attesa</option>
              <option value="PROCESSING">In Lavorazione</option>
              <option value="COMPLETED">Completato</option>
              <option value="CANCELLED">Annullato</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cerca</label>
            <input
              type="text"
              placeholder="Numero ordine..."
              value={filters.search || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      </div>

      <DataGridAdvanced
        data={data?.data || []}
        columns={columns}
        loading={isLoading}
        error={error as any}
        onRefresh={refetch}
        searchable
        exportable
      />
    </div>
  );
};

export default OrdersPageEnhanced;
