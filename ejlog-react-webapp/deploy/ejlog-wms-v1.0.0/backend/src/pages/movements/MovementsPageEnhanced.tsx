// ============================================================================
// EJLOG WMS - Movements Page Enhanced
// Pagina movimenti di magazzino
// ============================================================================

import React, { useState, useMemo, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowRightIcon, PackageIcon } from 'lucide-react';
import DataGridAdvanced from '../../components/common/DataGridAdvanced';
import ExportButton from '../../components/common/ExportButton';
import { API_ENDPOINTS } from '../../services/api/endpoints';
import axios from 'axios';
import type { StockMovement, MovementFilters } from '../../services/api/movementsApi';

const MovementsPageEnhanced: React.FC = () => {
  const [filters, setFilters] = useState<MovementFilters>({
    page: 1,
    pageSize: 20,
    orderBy: 'occurredAt',
    sortDirection: 'desc',
  });

  // BYPASS RTK Query - usa axios direttamente
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  // Fetch diretto con axios
  useEffect(() => {
    const fetchMovements = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log('[MovementsPageEnhanced] Fetching movements with axios...');

        const skip = (filters.page - 1) * filters.pageSize;
        const take = filters.pageSize;

        const params: any = {
          limit: take,
          offset: skip,
          sort: filters.orderBy
        };

        if (filters.movementType) params.movementType = filters.movementType;
        if (filters.itemCode) params.itemCode = filters.itemCode;
        if (filters.fromDate) params.fromDate = filters.fromDate;
        if (filters.toDate) params.toDate = filters.toDate;

        // FIX 1: Usare endpoint corretto
        const response = await axios.get(API_ENDPOINTS.MOVEMENTS, {
          params,
          headers: { 'Accept': 'application/json' }
        });

        console.log('[MovementsPageEnhanced] Got response:', response.data);

        // FIX 2: Supportare formato risposta backend (exported, not data)
        const items = response.data.exported || response.data.data || [];
        const total = response.data.recordNumber || response.data.pagination?.total || items.length;

        // FIX 3: Fixare campo ID mancante
        const transformedData = {
          data: items.map((item: any, index: number) => ({
            id: item.id || item.movementId || `movement-${index}`, // Backend non fornisce ID
            occurredAt: item.occurredAt || item.timestamp || new Date().toISOString(),
            movementType: item.movementType || 'UNKNOWN',
            itemCode: item.itemCode || item.item || '-',
            itemDescription: item.itemDescription || item.description || '-',
            quantity: item.quantity || item.qty || 0,
            lot: item.lot || null,
            documentNumber: item.documentNumber || item.docNumber || null,
            operatorUserName: item.operatorUserName || item.operator || null,
            ...item,
          })),
          page: filters.page,
          pageSize: filters.pageSize,
          total,
          totalPages: Math.ceil(total / filters.pageSize),
        };

        setData(transformedData);
      } catch (error) {
        console.error('[MovementsPageEnhanced] Error fetching movements:', error);
        setError(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovements();
  }, [filters]);

  const refetch = () => {
    // Trigger re-fetch by updating filters
    setFilters(prev => ({ ...prev }));
  };

  const columns = useMemo<ColumnDef<StockMovement>[]>(
    () => [
      {
        accessorKey: 'occurredAt',
        header: 'Data/Ora',
        cell: ({ getValue }) => new Date(getValue() as string).toLocaleString('it-IT'),
      },
      {
        accessorKey: 'movementType',
        header: 'Tipo',
        cell: ({ getValue }) => {
          const type = getValue() as string;
          const colors: Record<string, string> = {
            IN: 'bg-green-100 text-green-800',
            OUT: 'bg-red-100 text-red-800',
            ADJUSTMENT: 'bg-yellow-100 text-yellow-800',
            TRANSFER: 'bg-blue-100 text-blue-800',
          };
          return (
            <span className={`px-2 py-1 text-xs rounded-full ${colors[type] || 'bg-gray-100 text-gray-800'}`}>
              {type}
            </span>
          );
        },
      },
      {
        accessorKey: 'itemCode',
        header: 'Articolo',
        cell: ({ getValue }) => getValue() || '-',
      },
      {
        accessorKey: 'itemDescription',
        header: 'Descrizione',
        cell: ({ getValue }) => getValue() || '-',
      },
      {
        accessorKey: 'quantity',
        header: 'Quantità',
        cell: ({ getValue }) => (
          <span className="font-semibold">{(getValue() as number).toFixed(2)}</span>
        ),
      },
      {
        accessorKey: 'lot',
        header: 'Lotto',
        cell: ({ getValue }) => getValue() || '-',
      },
      {
        accessorKey: 'documentNumber',
        header: 'Documento',
        cell: ({ getValue }) => getValue() || '-',
      },
      {
        accessorKey: 'operatorUserName',
        header: 'Operatore',
        cell: ({ getValue }) => getValue() || '-',
      },
    ],
    []
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Movimenti Magazzino</h1>
          <p className="text-gray-600">Storico completo dei movimenti</p>
        </div>
        <ExportButton
          data={data?.data || []}
          filename="movimenti-magazzino"
          columns={[
            { key: 'occurredAt', label: 'Data/Ora' },
            { key: 'movementType', label: 'Tipo' },
            { key: 'itemCode', label: 'Articolo' },
            { key: 'quantity', label: 'Quantità' },
            { key: 'lot', label: 'Lotto' },
            { key: 'documentNumber', label: 'Documento' },
            { key: 'operatorUserName', label: 'Operatore' },
          ]}
        />
      </div>

      {/* Filtri */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Movimento</label>
            <select
              value={filters.movementType || ''}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  movementType: e.target.value as any || undefined,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Tutti</option>
              <option value="IN">Entrata</option>
              <option value="OUT">Uscita</option>
              <option value="ADJUSTMENT">Rettifica</option>
              <option value="TRANSFER">Trasferimento</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Codice Articolo</label>
            <input
              type="text"
              placeholder="Cerca articolo..."
              value={filters.itemCode || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, itemCode: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Da</label>
            <input
              type="date"
              value={filters.fromDate || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, fromDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data A</label>
            <input
              type="date"
              value={filters.toDate || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, toDate: e.target.value }))}
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

export default MovementsPageEnhanced;
