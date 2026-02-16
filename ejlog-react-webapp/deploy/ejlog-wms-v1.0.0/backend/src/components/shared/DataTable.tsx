// ============================================================================
// EJLOG WMS - Advanced DataTable Component
// Tabella con sorting, filtri, paginazione e export
// ============================================================================

import React, { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type PaginationState,
} from '@tanstack/react-table';
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Download,
  Loader2,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import Button from './Button';
import Input from './Input';
import Spinner from './Spinner';

// ============================================================================
// TYPES
// ============================================================================

export interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  loading?: boolean;
  emptyMessage?: string;

  // Paginazione
  pagination?: {
    pageIndex: number;
    pageSize: number;
    totalPages?: number;
    totalItems?: number;
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
  };

  // Sorting
  sorting?: {
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
    onSortChange?: (sortBy: string, direction: 'asc' | 'desc') => void;
  };

  // Filtri
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;

  // Export
  exportable?: boolean;
  exportFilename?: string;
  onExport?: (format: 'csv' | 'excel') => void;

  // Selezione righe
  selectable?: boolean;
  onSelectionChange?: (selectedRows: TData[]) => void;

  // Row actions
  onRowClick?: (row: TData) => void;

  // Styling
  striped?: boolean;
  hoverable?: boolean;
  compact?: boolean;
  getRowClassName?: (row: TData) => string;
}

// ============================================================================
// COMPONENT
// ============================================================================

function DataTable<TData>({
  data,
  columns,
  loading = false,
  emptyMessage = 'Nessun dato disponibile',
  pagination,
  sorting,
  searchable = false,
  searchPlaceholder = 'Cerca...',
  onSearch,
  exportable = false,
  exportFilename = 'export',
  onExport,
  selectable = false,
  onSelectionChange,
  onRowClick,
  striped = true,
  hoverable = true,
  compact = false,
  getRowClassName,
}: DataTableProps<TData>) {
  // State
  const [internalSorting, setInternalSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [localSearchQuery, setLocalSearchQuery] = useState('');

  // Paginazione state
  const [internalPagination, setInternalPagination] = useState<PaginationState>({
    pageIndex: pagination?.pageIndex || 0,
    pageSize: pagination?.pageSize || 10,
  });

  // Colonne con selezione se necessario
  const tableColumns = useMemo(() => {
    if (selectable) {
      return [
        {
          id: 'select',
          header: ({ table }: any) => (
            <input
              type="checkbox"
              checked={table.getIsAllRowsSelected()}
              onChange={table.getToggleAllRowsSelectedHandler()}
              className="w-4 h-4 text-ferretto-red bg-gray-100 border-gray-300 rounded focus:ring-ferretto-red"
            />
          ),
          cell: ({ row }: any) => (
            <input
              type="checkbox"
              checked={row.getIsSelected()}
              onChange={row.getToggleSelectedHandler()}
              className="w-4 h-4 text-ferretto-red bg-gray-100 border-gray-300 rounded focus:ring-ferretto-red"
            />
          ),
          size: 50,
        },
        ...columns,
      ];
    }
    return columns;
  }, [columns, selectable]);

  // React Table instance
  const table = useReactTable({
    data,
    columns: tableColumns,
    state: {
      sorting: internalSorting,
      columnFilters,
      rowSelection,
      globalFilter,
      pagination: internalPagination,
    },
    onSortingChange: setInternalSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setInternalPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: !!pagination,
    pageCount: pagination?.totalPages,
  });

  // Handle search
  const handleSearch = () => {
    if (onSearch) {
      onSearch(localSearchQuery);
    } else {
      setGlobalFilter(localSearchQuery);
    }
  };

  const handleClearSearch = () => {
    setLocalSearchQuery('');
    if (onSearch) {
      onSearch('');
    } else {
      setGlobalFilter('');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (onExport) {
      onExport('csv');
      return;
    }

    const headers = columns
      .map((col: any) => col.header)
      .join(',');

    const rows = data.map((row: any) =>
      columns
        .map((col: any) => {
          const value = row[col.accessorKey as string];
          return `"${value || ''}"`;
        })
        .join(',')
    );

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exportFilename}.csv`;
    a.click();
  };

  // Handle row selection change
  React.useEffect(() => {
    if (onSelectionChange) {
      const selectedRows = table
        .getSelectedRowModel()
        .rows.map((row) => row.original);
      onSelectionChange(selectedRows);
    }
  }, [rowSelection, onSelectionChange, table]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      {(searchable || exportable) && (
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          {/* Search */}
          {searchable && (
            <div className="flex-1 max-w-md">
              <div className="relative flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    placeholder={searchPlaceholder}
                    value={localSearchQuery}
                    onChange={(e) => setLocalSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    icon={<Search className="w-4 h-4 text-gray-400" />}
                  />
                  {localSearchQuery && (
                    <button
                      onClick={handleClearSearch}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <Button variant="primary" onClick={handleSearch} size="sm">
                  Cerca
                </Button>
              </div>
            </div>
          )}

          {/* Export */}
          {exportable && (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExportCSV}
                icon={<Download className="w-4 h-4" />}
              >
                Esporta CSV
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      header.column.getCanSort() ? 'cursor-pointer select-none hover:bg-gray-100' : ''
                    }`}
                    onClick={header.column.getToggleSortingHandler()}
                    style={{ width: header.getSize() }}
                  >
                    <div className="flex items-center gap-2">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <span className="text-gray-400">
                          {{
                            asc: <ChevronUp className="w-4 h-4" />,
                            desc: <ChevronDown className="w-4 h-4" />,
                          }[header.column.getIsSorted() as string] ?? (
                            <ChevronsUpDown className="w-4 h-4" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <div className="flex justify-center items-center">
                    <Spinner size="lg" />
                    <span className="ml-3 text-gray-500">Caricamento...</span>
                  </div>
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row, idx) => (
                <tr
                  key={row.id}
                  className={`
                    ${striped && idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                    ${hoverable ? 'hover:bg-blue-50' : ''}
                    ${onRowClick ? 'cursor-pointer' : ''}
                    ${getRowClassName ? getRowClassName(row.original) : ''}
                    transition-colors
                  `}
                  onClick={() => onRowClick && onRowClick(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={`px-6 ${compact ? 'py-2' : 'py-4'} whitespace-nowrap text-sm text-gray-900`}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white px-6 py-4 rounded-lg border border-gray-200">
          {/* Info */}
          <div className="text-sm text-gray-700">
            Pagina <span className="font-medium">{(pagination.pageIndex || 0) + 1}</span> di{' '}
            <span className="font-medium">{pagination.totalPages || 1}</span>
            {pagination.totalItems && (
              <span className="ml-2">
                ({pagination.totalItems} elementi totali)
              </span>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => pagination.onPageChange?.(0)}
              disabled={pagination.pageIndex === 0}
              icon={<ChevronsLeft className="w-4 h-4" />}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => pagination.onPageChange?.((pagination.pageIndex || 0) - 1)}
              disabled={pagination.pageIndex === 0}
              icon={<ChevronLeft className="w-4 h-4" />}
            />
            <span className="text-sm text-gray-700 px-2">
              {(pagination.pageIndex || 0) + 1}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => pagination.onPageChange?.((pagination.pageIndex || 0) + 1)}
              disabled={
                pagination.totalPages
                  ? pagination.pageIndex >= pagination.totalPages - 1
                  : false
              }
              icon={<ChevronRight className="w-4 h-4" />}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => pagination.onPageChange?.((pagination.totalPages || 1) - 1)}
              disabled={
                pagination.totalPages
                  ? pagination.pageIndex >= pagination.totalPages - 1
                  : false
              }
              icon={<ChevronsRight className="w-4 h-4" />}
            />
          </div>

          {/* Page size selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">Mostra</span>
            <select
              value={pagination.pageSize}
              onChange={(e) => pagination.onPageSizeChange?.(Number(e.target.value))}
              className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-ferretto-red focus:border-ferretto-red"
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-700">righe</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
