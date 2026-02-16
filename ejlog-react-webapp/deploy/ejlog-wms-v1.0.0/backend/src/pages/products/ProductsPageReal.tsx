// ============================================================================
// EJLOG WMS - Products Page Real
// Pagina prodotti completa con dati reali dal backend EjLog (porta 3077)
// ============================================================================

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import toast from 'react-hot-toast';
import {
  PackageIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  TagIcon,
  HashIcon,
  CalendarIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from 'lucide-react';
import DataGridAdvanced from '../../components/common/DataGridAdvanced';
import ExportButton from '../../components/common/ExportButton';
import Badge from '../../components/shared/Badge';
import { useGetProductsQuery, useGetProductsCountQuery } from '../../services/api/productsApi';
import type { Product } from '../../types/models';
import { ManagementType } from '../../types/models';

/**
 * Helper per label tipo gestione
 */
const getManagementTypeLabel = (type: ManagementType): string => {
  const labels: Record<ManagementType, string> = {
    [ManagementType.STANDARD]: 'Standard',
    [ManagementType.LOTTO]: 'Lotto',
    [ManagementType.MATRICOLA]: 'Matricola',
    [ManagementType.LOTTO_E_MATRICOLA]: 'Lotto+Matr',
  };
  return labels[type] || 'Sconosciuto';
};

/**
 * Helper per variante badge gestione
 */
const getManagementTypeBadgeVariant = (type: ManagementType): 'default' | 'success' | 'warning' | 'danger' | 'info' => {
  const variants: Record<ManagementType, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
    [ManagementType.STANDARD]: 'default',
    [ManagementType.LOTTO]: 'info',
    [ManagementType.MATRICOLA]: 'warning',
    [ManagementType.LOTTO_E_MATRICOLA]: 'success',
  };
  return variants[type] || 'default';
};

/**
 * Helper per variante badge stock level
 */
const getStockLevelVariant = (stock: number, threshold: number): 'success' | 'warning' | 'danger' => {
  if (stock < threshold) return 'danger';
  if (stock < threshold * 1.5) return 'warning';
  return 'success';
};

/**
 * Helper per label stock level
 */
const getStockLevelLabel = (stock: number, threshold: number): string => {
  if (stock < threshold) return 'Basso';
  if (stock < threshold * 1.5) return 'Medio';
  return 'OK';
};

/**
 * Interfaccia filtri avanzati
 */
interface ProductFilters {
  search?: string;
  categoryFilter?: string;
  managementTypeFilter?: ManagementType | '';
  stockLevelFilter?: 'low' | 'normal' | 'high' | '';
  skip: number;
  take: number;
  orderBy: string;
  sortDirection?: 'asc' | 'desc';
}

const ProductsPageReal: React.FC = () => {
  const navigate = useNavigate();

  // Filtri
  const [filters, setFilters] = useState<ProductFilters>({
    skip: 0,
    take: 100,
    orderBy: 'item.code',
    sortDirection: 'asc',
    search: '',
    categoryFilter: '',
    managementTypeFilter: '',
    stockLevelFilter: '',
  });

  // Query
  const { data, isLoading, error, refetch } = useGetProductsQuery({
    skip: filters.skip,
    take: filters.take,
    orderBy: filters.orderBy,
    search: filters.search,
  });

  const { data: countData } = useGetProductsCountQuery({
    search: filters.search,
  });

  // Filtra i prodotti localmente (dopo averli ricevuti dal backend)
  const filteredProducts = useMemo(() => {
    if (!data?.data) return [];

    let filtered = [...data.data];

    // Filtro per categoria
    if (filters.categoryFilter) {
      filtered = filtered.filter(
        (p) => p.item.itemCategoryDescription?.toLowerCase().includes(filters.categoryFilter!.toLowerCase())
      );
    }

    // Filtro per tipo gestione
    if (filters.managementTypeFilter !== '') {
      filtered = filtered.filter((p) => p.item.managementType === filters.managementTypeFilter);
    }

    // Filtro per livello giacenza
    if (filters.stockLevelFilter) {
      filtered = filtered.filter((p) => {
        const level = getStockLevelVariant(p.stockedQuantity, p.inventoryThreshold);
        if (filters.stockLevelFilter === 'low') return level === 'danger';
        if (filters.stockLevelFilter === 'normal') return level === 'warning';
        if (filters.stockLevelFilter === 'high') return level === 'success';
        return true;
      });
    }

    return filtered;
  }, [data, filters.categoryFilter, filters.managementTypeFilter, filters.stockLevelFilter]);

  // Statistiche
  const stats = useMemo(() => {
    if (!filteredProducts || filteredProducts.length === 0) {
      return {
        total: 0,
        totalStock: 0,
        lowStock: 0,
        withLot: 0,
        withSerial: 0,
        expired: 0,
        avgStock: 0,
      };
    }

    const total = filteredProducts.length;
    const totalStock = filteredProducts.reduce((sum, p) => sum + p.stockedQuantity, 0);
    const lowStock = filteredProducts.filter((p) => p.stockedQuantity < p.inventoryThreshold).length;
    const withLot = filteredProducts.filter((p) => p.lot).length;
    const withSerial = filteredProducts.filter((p) => p.serialNumber).length;
    const expired = filteredProducts.filter((p) => {
      if (!p.expirationDate) return false;
      return new Date(p.expirationDate) < new Date();
    }).length;

    return {
      total,
      totalStock,
      lowStock,
      withLot,
      withSerial,
      expired,
      avgStock: total > 0 ? totalStock / total : 0,
    };
  }, [filteredProducts]);

  // Definizione colonne
  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        accessorKey: 'item.code',
        header: 'Codice',
        cell: ({ row }) => (
          <button
            onClick={() => navigate(`/products/${row.original.item.code}`)}
            className="text-blue-600 hover:text-blue-800 font-mono font-medium hover:underline"
          >
            {row.original.item.code}
          </button>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'item.description',
        header: 'Descrizione',
        cell: ({ row }) => (
          <span className="text-gray-900" title={row.original.item.description}>
            {row.original.item.description}
          </span>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'item.itemCategoryDescription',
        header: 'Categoria',
        cell: ({ row }) => {
          const category = row.original.item.itemCategoryDescription;
          return category ? (
            <Badge variant="info" size="sm">
              {category}
            </Badge>
          ) : (
            <span className="text-gray-400">-</span>
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: 'item.measureUnitDescription',
        header: 'UdM',
        cell: ({ row }) => (
          <span className="text-xs text-gray-600 uppercase">{row.original.item.measureUnitDescription}</span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'stockedQuantity',
        header: 'Giacenza',
        cell: ({ row }) => {
          const stock = row.original.stockedQuantity ?? 0;
          const threshold = row.original.inventoryThreshold ?? 0;
          const variant = getStockLevelVariant(stock, threshold);
          const label = getStockLevelLabel(stock, threshold);

          return (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">
                {stock.toFixed(row.original.item?.quantitySignificantFigures || 2)}
              </span>
              <Badge variant={variant} size="sm">
                {label}
              </Badge>
            </div>
          );
        },
        enableSorting: true,
      },
      {
        accessorKey: 'lot',
        header: 'Lotto',
        cell: ({ row }) => {
          const lot = row.original.lot;
          return lot ? (
            <span className="font-mono text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded">{lot}</span>
          ) : (
            <span className="text-gray-400">-</span>
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: 'serialNumber',
        header: 'Matricola',
        cell: ({ row }) => {
          const serial = row.original.serialNumber;
          return serial ? (
            <span className="font-mono text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded">{serial}</span>
          ) : (
            <span className="text-gray-400">-</span>
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: 'expirationDate',
        header: 'Scadenza',
        cell: ({ row }) => {
          const expDate = row.original.expirationDate;
          if (!expDate) return <span className="text-gray-400">-</span>;

          const date = new Date(expDate);
          const now = new Date();
          const isExpired = date < now;
          const isExpiringSoon = date < new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 giorni

          return (
            <div className="flex items-center gap-2">
              <span className={`text-xs ${isExpired ? 'text-red-600 font-semibold' : 'text-gray-700'}`}>
                {date.toLocaleDateString('it-IT')}
              </span>
              {isExpired && (
                <Badge variant="danger" size="sm">
                  Scaduto
                </Badge>
              )}
              {!isExpired && isExpiringSoon && (
                <Badge variant="warning" size="sm">
                  In scad.
                </Badge>
              )}
            </div>
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: 'item.managementType',
        header: 'Gestione',
        cell: ({ row }) => {
          const type = row.original.item.managementType;
          return (
            <Badge variant={getManagementTypeBadgeVariant(type)} size="sm">
              {getManagementTypeLabel(type)}
            </Badge>
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: 'isBlocked',
        header: 'Stato',
        cell: ({ row }) => {
          const isBlocked = row.original.isBlocked;
          return isBlocked ? (
            <Badge variant="danger" size="sm">
              Bloccato
            </Badge>
          ) : (
            <Badge variant="success" size="sm">
              Attivo
            </Badge>
          );
        },
        enableSorting: false,
      },
    ],
    [navigate]
  );

  // Handlers
  const handleFilterChange = (newFilters: Partial<ProductFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters({
      skip: 0,
      take: 100,
      orderBy: 'item.code',
      sortDirection: 'asc',
      search: '',
      categoryFilter: '',
      managementTypeFilter: '',
      stockLevelFilter: '',
    });
  };

  // Rendering
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertTriangleIcon className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-900 mb-2">Errore caricamento prodotti</h2>
          <p className="text-red-700 mb-4">
            Impossibile connettersi al backend EjLog sulla porta 3077.
            <br />
            Verifica che il backend sia avviato e accessibile.
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prodotti in Magazzino</h1>
          <p className="text-gray-600">Vista completa giacenze e dettagli prodotti</p>
        </div>
        <div className="flex gap-3">
          <ExportButton
            data={filteredProducts}
            filename="prodotti-magazzino"
            columns={[
              { key: 'item.code', label: 'Codice' },
              { key: 'item.description', label: 'Descrizione' },
              { key: 'item.itemCategoryDescription', label: 'Categoria' },
              { key: 'item.measureUnitDescription', label: 'UdM' },
              { key: 'stockedQuantity', label: 'Giacenza' },
              { key: 'inventoryThreshold', label: 'Soglia' },
              { key: 'lot', label: 'Lotto' },
              { key: 'serialNumber', label: 'Matricola' },
              { key: 'expirationDate', label: 'Scadenza' },
              {
                key: 'item.managementType',
                label: 'Gestione',
                transform: (val) => getManagementTypeLabel(val as ManagementType),
              },
            ]}
          />
        </div>
      </div>

      {/* Statistiche Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Totale Prodotti */}
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Totale Prodotti</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <PackageIcon className="w-10 h-10 text-blue-500 opacity-50" />
          </div>
        </div>

        {/* Giacenza Totale */}
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Giacenza Totale</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalStock.toFixed(2)}</p>
            </div>
            <TrendingUpIcon className="w-10 h-10 text-green-500 opacity-50" />
          </div>
        </div>

        {/* Sotto Soglia */}
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sotto Soglia</p>
              <p className="text-2xl font-bold text-red-600">{stats.lowStock}</p>
            </div>
            <TrendingDownIcon className="w-10 h-10 text-red-500 opacity-50" />
          </div>
        </div>

        {/* Con Lotto */}
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Con Lotto</p>
              <p className="text-2xl font-bold text-gray-900">{stats.withLot}</p>
            </div>
            <TagIcon className="w-10 h-10 text-purple-500 opacity-50" />
          </div>
        </div>

        {/* Con Matricola */}
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Con Matricola</p>
              <p className="text-2xl font-bold text-gray-900">{stats.withSerial}</p>
            </div>
            <HashIcon className="w-10 h-10 text-yellow-500 opacity-50" />
          </div>
        </div>

        {/* Scaduti */}
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Scaduti/In Scad.</p>
              <p className="text-2xl font-bold text-orange-600">{stats.expired}</p>
            </div>
            <CalendarIcon className="w-10 h-10 text-orange-500 opacity-50" />
          </div>
        </div>
      </div>

      {/* Filtri Avanzati */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 uppercase">Filtri</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Ricerca Full-Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cerca</label>
            <input
              type="text"
              placeholder="Codice o descrizione..."
              value={filters.search ?? ''}
              onChange={(e) => handleFilterChange({ search: e.target.value, skip: 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filtro Categoria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <input
              type="text"
              placeholder="Filtra per categoria..."
              value={filters.categoryFilter ?? ''}
              onChange={(e) => handleFilterChange({ categoryFilter: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filtro Tipo Gestione */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Gestione</label>
            <select
              value={filters.managementTypeFilter ?? ''}
              onChange={(e) =>
                handleFilterChange({
                  managementTypeFilter: e.target.value ? (Number(e.target.value) as ManagementType) : '',
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tutti</option>
              <option value={ManagementType.STANDARD}>Standard</option>
              <option value={ManagementType.LOTTO}>Lotto</option>
              <option value={ManagementType.MATRICOLA}>Matricola</option>
              <option value={ManagementType.LOTTO_E_MATRICOLA}>Lotto + Matricola</option>
            </select>
          </div>

          {/* Filtro Livello Giacenza */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Livello Giacenza</label>
            <select
              value={filters.stockLevelFilter ?? ''}
              onChange={(e) =>
                handleFilterChange({ stockLevelFilter: e.target.value as 'low' | 'normal' | 'high' | '' })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tutti</option>
              <option value="low">Basso (sotto soglia)</option>
              <option value="normal">Medio</option>
              <option value="high">Alto</option>
            </select>
          </div>

          {/* Pulsante Reset */}
          <div className="flex items-end">
            <button
              onClick={handleResetFilters}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Reset Filtri
            </button>
          </div>
        </div>
      </div>

      {/* Info Riga */}
      {!isLoading && data && (
        <div className="text-sm text-gray-600">
          Visualizzati <span className="font-semibold">{filteredProducts.length}</span> di{' '}
          <span className="font-semibold">{data.total || stats.total}</span> prodotti
        </div>
      )}

      {/* DataGrid */}
      <DataGridAdvanced
        data={filteredProducts}
        columns={columns}
        loading={isLoading}
        emptyMessage="Nessun prodotto trovato"
        pagination={{
          enabled: true,
          pageSize: 25,
          pageSizeOptions: [10, 25, 50, 100],
        }}
        sorting={{
          enabled: true,
          defaultSort: [{ id: 'item.code', desc: false }],
        }}
        filtering={{
          enabled: false,
        }}
        striped
        hoverable
        data-testid="products-grid"
      />
    </div>
  );
};

export default ProductsPageReal;

