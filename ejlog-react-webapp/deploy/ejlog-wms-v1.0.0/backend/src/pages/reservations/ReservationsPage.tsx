import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { useReservations } from '../../hooks/useReservations';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import ReservationDetailModal from '../../components/reservations/ReservationDetailModal';

/**
 * ReservationsPage - Pagina di gestione prenotazioni
 *
 * Features:
 * - Table con prenotazioni
 * - Filtri (articolo, stato, date)
 * - Pagination
 * - Detail modal
 */
function ReservationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Pagination state
  const [page, setPage] = useState(0);
  const pageSize = 20;

  // Filters state
  const [filters, setFilters] = useState({
    articleCode: searchParams.get('articleCode') || '',
    status: searchParams.get('status') || '',
    dateFrom: searchParams.get('dateFrom') || '',
    dateTo: searchParams.get('dateTo') || '',
  });

  // Fetch reservations with filters
  const { data, isLoading, isError, refetch } = useReservations({
    skip: page * pageSize,
    take: pageSize,
    ...filters,
  });

  const reservations = data?.reservations || [];
  const totalCount = data?.totalCount || 0;

  // Table columns
  const columns = useMemo(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        cell: (info) => (
          <span className="font-mono text-sm">{info.getValue()}</span>
        ),
      },
      {
        accessorKey: 'articleCode',
        header: 'Articolo',
        cell: (info) => {
          const row = info.row.original;
          return (
            <div>
              <div className="font-semibold">{info.getValue()}</div>
              <div className="text-sm text-gray-600">{row.articleDescription}</div>
            </div>
          );
        },
      },
      {
        accessorKey: 'quantityReserved',
        header: 'Quantità',
        cell: (info) => {
          const row = info.row.original;
          return (
            <div>
              <div className="font-semibold">
                {row.quantityMoved} / {info.getValue()}
              </div>
              <div className="text-sm text-gray-600">
                {Math.round((row.quantityMoved / info.getValue()) * 100)}% completato
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'udc',
        header: 'UDC',
        cell: (info) => (
          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
            {info.getValue()}
          </span>
        ),
      },
      {
        accessorKey: 'locationSource',
        header: 'Locazione',
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="text-sm">
              <div><span className="text-gray-600">Da:</span> {info.getValue()}</div>
              <div><span className="text-gray-600">A:</span> {row.locationDestination}</div>
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Stato',
        cell: (info) => {
          const status = info.getValue();
          const statusColors = {
            ATTIVA: 'bg-green-100 text-green-800',
            IN_PROGRESS: 'bg-blue-100 text-blue-800',
            COMPLETATA: 'bg-gray-100 text-gray-800',
            ANNULLATA: 'bg-red-100 text-red-800',
          };
          const statusLabels = {
            ATTIVA: 'Attiva',
            IN_PROGRESS: 'In Corso',
            COMPLETATA: 'Completata',
            ANNULLATA: 'Annullata',
          };
          return (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                statusColors[status] || 'bg-gray-100 text-gray-800'
              }`}
            >
              {statusLabels[status] || status}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Azioni',
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewDetail(row.original)}
          >
            <EyeIcon className="w-4 h-4 mr-1" />
            Dettagli
          </Button>
        ),
      },
    ],
    []
  );

  // Table instance
  const table = useReactTable({
    data: reservations,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(totalCount / pageSize),
    state: {
      pagination: {
        pageIndex: page,
        pageSize,
      },
    },
  });

  // Handle filter change
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // Handle apply filters
  const handleApplyFilters = () => {
    setPage(0); // Reset to first page
    const params = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params[key] = value;
    });
    setSearchParams(params);
  };

  // Handle reset filters
  const handleResetFilters = () => {
    const emptyFilters = {
      articleCode: '',
      status: '',
      dateFrom: '',
      dateTo: '',
    };
    setFilters(emptyFilters);
    setPage(0);
    setSearchParams({});
  };

  // Handle view detail
  const handleViewDetail = (reservation) => {
    setSelectedReservation(reservation);
    setShowDetailModal(true);
  };

  // Handle close detail modal
  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedReservation(null);
  };

  // Handle pagination
  const handlePreviousPage = () => {
    if (page > 0) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (page < Math.ceil(totalCount / pageSize) - 1) {
      setPage(page + 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Gestione Prenotazioni</h1>
        <Button
          variant="outline"
          onClick={() => refetch()}
          className="flex items-center space-x-2"
        >
          <ArrowPathIcon className="w-5 h-5" />
          <span>Aggiorna</span>
        </Button>
      </div>

      {/* Filters Card */}
      <Card>
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Filtri</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Article Code Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Codice Articolo
              </label>
              <Input
                type="text"
                name="articleCode"
                value={filters.articleCode}
                onChange={(e) => handleFilterChange('articleCode', e.target.value)}
                placeholder="ART001"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stato
              </label>
              <select
                name="status"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ferretto-red focus:border-transparent"
              >
                <option value="">Tutti gli stati</option>
                <option value="ATTIVA">Attiva</option>
                <option value="IN_PROGRESS">In Corso</option>
                <option value="COMPLETATA">Completata</option>
                <option value="ANNULLATA">Annullata</option>
              </select>
            </div>

            {/* Date From Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Da
              </label>
              <Input
                type="date"
                name="dateFrom"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              />
            </div>

            {/* Date To Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data A
              </label>
              <Input
                type="date"
                name="dateTo"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              />
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex items-center space-x-3 pt-2">
            <Button variant="primary" onClick={handleApplyFilters}>
              <MagnifyingGlassIcon className="w-4 h-4 mr-2" />
              Cerca
            </Button>
            <Button variant="outline" onClick={handleResetFilters}>
              Reset
            </Button>
          </div>
        </div>
      </Card>

      {/* Table Card */}
      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <ArrowPathIcon className="w-8 h-8 animate-spin text-ferretto-red" />
          </div>
        ) : isError ? (
          <div className="p-6 text-center text-red-600">
            Errore nel caricamento delle prenotazioni
          </div>
        ) : reservations.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            Nessuna prenotazione trovata
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <div className="text-sm text-gray-700">
                Pagina <span className="font-medium">{page + 1}</span> di{' '}
                <span className="font-medium">
                  {Math.ceil(totalCount / pageSize) || 1}
                </span>{' '}
                - <span className="font-medium">{totalCount}</span> risultati totali
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={page === 0}
                >
                  Precedente
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={page >= Math.ceil(totalCount / pageSize) - 1}
                >
                  Successiva
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Detail Modal */}
      {showDetailModal && selectedReservation && (
        <ReservationDetailModal
          isOpen={showDetailModal}
          onClose={handleCloseDetailModal}
          reservationId={selectedReservation.id}
        />
      )}
    </div>
  );
}

export default ReservationsPage;
