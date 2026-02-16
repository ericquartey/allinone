// ============================================================================
// EJLOG WMS - Items List Page Enhanced
// Pagina lista articoli migliorata con tutti i nuovi componenti
// ============================================================================

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import { Edit, Trash2, Eye, Plus } from 'lucide-react';
import { useGetItemsQuery, useDeleteItemMutation } from '../../services/api/itemsApi';
import DataGridAdvanced from '../../components/common/DataGridAdvanced';
import ExportButton from '../../components/common/ExportButton';
import Button from '../../components/shared/Button';
import Card from '../../components/shared/Card';
import Badge from '../../components/shared/Badge';
import Input from '../../components/shared/Input';
import { useToast } from '../../components/feedback/ToastContainer';
import type { Item, ManagementType } from '../../types/models';
import { ExportColumn } from '../../utils/export';

/**
 * Items List Page Enhanced
 *
 * Pagina lista articoli con funzionalit\u00e0 complete:
 * - DataGrid avanzata con sorting/filtering/pagination
 * - Selezione multipla per azioni bulk
 * - Export Excel/CSV/PDF
 * - Ricerca global filter
 * - Navigazione dettaglio/edit
 */
const ItemsListPageEnhanced: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  // Filters state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  // Fetch items
  const { data, isLoading, error } = useGetItemsQuery({
    page,
    pageSize,
    search: searchQuery,
    // Additional filters can be added here
  });
  const [deleteItem] = useDeleteItemMutation();

  // Selected items for bulk actions
  const [selectedItems, setSelectedItems] = useState<Item[]>([]);

  /**
   * Define columns for DataGrid
   */
  const columns = useMemo<ColumnDef<Item, any>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Codice',
        cell: ({ getValue }) => (
          <span className="font-mono font-semibold text-ferrRed">{getValue()}</span>
        ),
        enableSorting: true,
        size: 150,
      },
      {
        accessorKey: 'description',
        header: 'Descrizione',
        enableSorting: true,
        size: 300,
      },
      {
        accessorKey: 'itemCategoryDescription',
        header: 'Categoria',
        cell: ({ getValue }) => getValue() || '-',
        size: 150,
      },
      {
        accessorKey: 'measureUnitDescription',
        header: 'UM',
        size: 80,
      },
      {
        accessorKey: 'managementType',
        header: 'Gestione',
        cell: ({ getValue }) => {
          const type = getValue() as ManagementType;
          const labels: Record<ManagementType, string> = {
            [ManagementType.STANDARD]: 'Standard',
            [ManagementType.LOTTO]: 'Lotto',
            [ManagementType.MATRICOLA]: 'Matricola',
            [ManagementType.LOTTO_E_MATRICOLA]: 'Lotto+Matricola',
          };
          const colors: Record<ManagementType, string> = {
            [ManagementType.STANDARD]: 'bg-gray-100 text-gray-800',
            [ManagementType.LOTTO]: 'bg-blue-100 text-blue-800',
            [ManagementType.MATRICOLA]: 'bg-purple-100 text-purple-800',
            [ManagementType.LOTTO_E_MATRICOLA]: 'bg-green-100 text-green-800',
          };
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[type]}`}>
              {labels[type]}
            </span>
          );
        },
        size: 120,
      },
      {
        accessorKey: 'barcode',
        header: 'Barcode',
        cell: ({ getValue }) => (
          <span className="font-mono text-sm">{getValue() || '-'}</span>
        ),
        size: 150,
      },
      {
        accessorKey: 'stock',
        header: 'Giacenza',
        cell: ({ row }) => {
          const stock = (row.original as any).stock || (row.original as any).totalStock || 0;
          return (
            <div className="flex items-center space-x-2">
              <span className={`font-semibold ${stock > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                {stock}
              </span>
              {stock > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  ✓ Disponibile
                </span>
              )}
            </div>
          );
        },
        size: 150,
        enableSorting: true,
      },
      {
        id: 'actions',
        header: 'Azioni',
        cell: ({ row }) => (
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/items/${row.original.id}`);
              }}
              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
              title="View details"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/items/${row.original.id}/edit`);
              }}
              className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(row.original.id);
              }}
              className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
        size: 120,
        enableSorting: false,
      },
    ],
    [navigate]
  );

  /**
   * Define export columns
   */
  const exportColumns: ExportColumn<Item>[] = useMemo(
    () => [
      { key: 'code', header: 'Codice', width: 15 },
      { key: 'description', header: 'Descrizione', width: 40 },
      { key: 'itemCategoryDescription', header: 'Categoria', width: 20 },
      { key: 'measureUnitDescription', header: 'UM', width: 10 },
      {
        key: 'managementType',
        header: 'Gestione',
        width: 15,
        format: (val: ManagementType) => {
          const labels: Record<ManagementType, string> = {
            [ManagementType.STANDARD]: 'Standard',
            [ManagementType.LOTTO]: 'Lotto',
            [ManagementType.MATRICOLA]: 'Matricola',
            [ManagementType.LOTTO_E_MATRICOLA]: 'Lotto+Matricola',
          };
          return labels[val];
        },
      },
      { key: 'barcode', header: 'Barcode', width: 20 },
      {
        key: 'averageWeight',
        header: 'Peso Medio (g)',
        width: 15,
        format: (val: number | undefined) => (val ? val.toFixed(2) : '-'),
      },
    ],
    []
  );

  /**
   * Handle delete item
   */
  const handleDelete = async (id: number) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo articolo?')) return;
    try {
      await deleteItem(id).unwrap();
      toast.success('Articolo eliminato');
    } catch (err) {
      console.error('[ItemsListPageEnhanced] Delete error:', err);
      toast.error('Errore durante l\u0027eliminazione');
    }
  };

  /**
   * Handle bulk delete
   */
  const handleBulkDelete = () => {
    if (selectedItems.length === 0) return;
    if (
      window.confirm(`Sei sicuro di voler eliminare ${selectedItems.length} articoli?`)
    ) {
      const ids = selectedItems.map((i) => i.id);
      Promise.all(ids.map((id) => deleteItem(id).unwrap()))
        .then(() => {
          toast.success('Articoli eliminati');
          setSelectedItems([]);
        })
        .catch((err) => {
          console.error('[ItemsListPageEnhanced] Bulk delete error:', err);
          toast.error('Errore durante l\u0027eliminazione multipla');
        });
    }
  };

  /**
   * Handle row click - navigate to detail
   */
  const handleRowClick = (item: Item) => {
    navigate(`/items/${item.id}`);
  };

  const items = data?.data || [];
  const totalItems = data?.total || 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Articoli</h1>
          <p className="text-gray-600 mt-1">
            Gestione anagrafica articoli completa con export e azioni bulk
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate('/items/create')}
          icon={<Plus className="w-5 h-5" />}
        >
          Nuovo Articolo
        </Button>
      </div>

      {/* Filters Card */}
      <Card>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Cerca per codice, descrizione, barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Category Filter (mock - would be populated from API) */}
            <div className="w-full sm:w-64">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ferrRed"
              >
                <option value="">Tutte le categorie</option>
                <option value="cat1">Categoria 1</option>
                <option value="cat2">Categoria 2</option>
              </select>
            </div>

            {/* Clear Filters */}
            {(searchQuery || categoryFilter) && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('');
                }}
              >
                Reset Filtri
              </Button>
            )}
          </div>

          {/* Actions Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-3">
              {/* Export Button */}
              <ExportButton
                data={items}
                columns={exportColumns}
                filename="articoli_export"
                title="Report Articoli"
                formats={['excel', 'csv', 'pdf']}
                variant="outline"
                disabled={items.length === 0}
              />

              {/* Bulk Actions (shown when items selected) */}
              {selectedItems.length > 0 && (
                <>
                  <div className="h-6 w-px bg-gray-300" />
                  <Badge variant="primary">{selectedItems.length} selezionati</Badge>
                  <Button variant="outline" size="sm" onClick={handleBulkDelete}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Elimina Selezionati
                  </Button>
                </>
              )}
            </div>

            <div className="text-sm text-gray-600">
              {totalItems} articoli totali
            </div>
          </div>
        </div>
      </Card>

      {/* Data Grid */}
      <Card>
        {error ? (
          <div className="text-center py-12">
            <p className="text-red-600">Errore nel caricamento degli articoli</p>
            <p className="text-sm text-gray-500 mt-2">{error.toString()}</p>
          </div>
        ) : (
          <DataGridAdvanced
            data={items}
            columns={columns}
            loading={isLoading}
            emptyMessage="Nessun articolo trovato"
            onRowClick={handleRowClick}
            selectable
            onSelectionChange={setSelectedItems}
            pagination={{
              enabled: true,
              pageSize: 25,
              pageSizeOptions: [10, 25, 50, 100],
            }}
            sorting={{
              enabled: true,
              defaultSort: [{ id: 'code', desc: false }],
            }}
            filtering={{
              enabled: true,
              globalFilter: false, // Using custom search above
            }}
            striped
            hoverable
            getRowClassName={(row) => {
              const stock = (row as any).stock || (row as any).totalStock || 0;
              return stock > 0 ? 'bg-green-50 border-l-4 border-green-500' : '';
            }}
            data-testid="items-data-grid"
          />
        )}
      </Card>
    </div>
  );
};

export default ItemsListPageEnhanced;
