// ============================================================================
// EJLOG WMS - Table Component
// Advanced data table with sorting, filtering, and pagination using TanStack Table
// ============================================================================

import { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from '@tanstack/react-table';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import Button from './Button';

// Legacy column format (for backward compatibility)
interface LegacyColumn<T> {
  key?: string;
  label?: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  accessor?: string;
}

// Table props interface
export interface TableProps<T> {
  data: T[];
  columns: (ColumnDef<T> | LegacyColumn<T>)[];
  pageSize?: number;
  searchable?: boolean;
  onRowClick?: (row: T) => void;
}

function Table<T>({
  data,
  columns,
  pageSize = 10,
  searchable = true,
  onRowClick,
}: TableProps<T>): JSX.Element {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState<string>('');

  // Transform columns if they have custom formats to the TanStack Table format
  // Supports three formats:
  // 1. TanStack format: { id, accessorKey, header, cell }
  // 2. Legacy format: { key, label, render, sortable }
  // 3. Alternative format: { header, accessor, render }
  const transformedColumns = columns.map((col): ColumnDef<T> => {
    const anyCol = col as any;

    // If column already has TanStack format, return as-is
    if ((anyCol.accessorKey || anyCol.accessorFn) && !anyCol.key && !anyCol.accessor) {
      return col as ColumnDef<T>;
    }

    // Determine the id and accessorKey from various formats
    const id = anyCol.id || anyCol.key || anyCol.accessor || anyCol.header;
    const accessorKey = anyCol.accessorKey || anyCol.key || anyCol.accessor;
    const header = anyCol.header || anyCol.label || anyCol.key || anyCol.accessor;

    // Transform to TanStack format
    return {
      id,
      accessorKey,
      header,
      enableSorting: anyCol.sortable !== false && anyCol.enableSorting !== false,
      cell: anyCol.render
        ? ({ row }) => anyCol.render(row.original)
        : anyCol.cell || (({ getValue }) => getValue()),
    } as ColumnDef<T>;
  });

  const table = useReactTable<T>({
    data,
    columns: transformedColumns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      {searchable && (
        <div className="flex items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Cerca..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ferretto-red focus:border-transparent"
            />
          </div>
          <div className="text-sm text-gray-600">
            Totale: {table.getFilteredRowModel().rows.length} record
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden border border-gray-200 rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={
                            header.column.getCanSort()
                              ? 'flex items-center space-x-1 cursor-pointer select-none hover:text-ferretto-red'
                              : ''
                          }
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <span>
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                          </span>
                          {header.column.getCanSort() && (
                            <span className="inline-flex flex-col">
                              {header.column.getIsSorted() === 'asc' ? (
                                <ChevronUpIcon className="w-4 h-4 text-ferretto-red" />
                              ) : header.column.getIsSorted() === 'desc' ? (
                                <ChevronDownIcon className="w-4 h-4 text-ferretto-red" />
                              ) : (
                                <div className="w-4 h-4 text-gray-400">
                                  <ChevronUpIcon className="w-3 h-3" />
                                  <ChevronDownIcon className="w-3 h-3 -mt-1" />
                                </div>
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    Nessun dato disponibile
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className={`hover:bg-gray-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                    onClick={() => onRowClick && onRowClick(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Visualizzati {table.getState().pagination.pageIndex * pageSize + 1} -{' '}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * pageSize,
            table.getFilteredRowModel().rows.length
          )}{' '}
          di {table.getFilteredRowModel().rows.length}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </Button>
          <div className="flex items-center space-x-1">
            {Array.from({ length: table.getPageCount() }, (_, i) => i).map(
              (page) => {
                const isCurrent =
                  page === table.getState().pagination.pageIndex;
                const shouldShow =
                  page === 0 ||
                  page === table.getPageCount() - 1 ||
                  Math.abs(page - table.getState().pagination.pageIndex) <= 1;

                if (!shouldShow) {
                  if (
                    page === 1 ||
                    page === table.getPageCount() - 2
                  ) {
                    return (
                      <span key={page} className="px-2 text-gray-400">
                        ...
                      </span>
                    );
                  }
                  return null;
                }

                return (
                  <button
                    key={page}
                    onClick={() => table.setPageIndex(page)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      isCurrent
                        ? 'bg-ferretto-red text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {page + 1}
                  </button>
                );
              }
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRightIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Table;
