// ============================================================================
// EJLOG WMS - Enhanced Items Page
// Pagina articoli con filtri avanzati, ordinamento ed export
// ============================================================================

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Package,
  Plus,
  Filter,
  X,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react';
import DataTable from '../../components/shared/DataTable';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Input from '../../components/shared/Input';
import Select from '../../components/shared/Select';
import Badge from '../../components/shared/Badge';
import Modal from '../../components/shared/Modal';
import { useToast } from '../../components/feedback/ToastContainer';
import type { Item, ManagementType } from '../../types/models';
import { exportData } from '../../utils/exportUtils';

// ============================================================================
// TYPES
// ============================================================================

interface ItemFilters {
  page: number;
  pageSize: number;
  orderBy?: string;
  sortDirection?: 'asc' | 'desc';
  searchQuery?: string;
  category?: string;
  managementType?: ManagementType;
  minStock?: number;
  maxStock?: number;
  isActive?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

const ItemsPageEnhanced: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  // State
  const [filters, setFilters] = useState<ItemFilters>({
    page: 0,
    pageSize: 25,
    orderBy: 'code',
    sortDirection: 'asc',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showGallery, setShowGallery] = useState(true); // Gallery aperta per mostrare dati reali
  const [selectedItems, setSelectedItems] = useState<Item[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // BYPASS RTK Query - usa axios direttamente
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    const items = data?.data || [];
    const aiItemsPayload = {
      source: 'items-page',
      timestamp: Date.now(),
      filters: {
        page: filters.page,
        pageSize: filters.pageSize,
        orderBy: filters.orderBy,
        sortDirection: filters.sortDirection,
        searchQuery: filters.searchQuery || null,
        category: filters.category || null,
        managementType: filters.managementType ?? null,
        minStock: filters.minStock ?? null,
        maxStock: filters.maxStock ?? null,
        isActive: filters.isActive ?? null,
      },
      total: data?.total || items.length,
      page: data?.page ?? filters.page,
      pageSize: data?.pageSize ?? filters.pageSize,
      visibleItems: items.slice(0, 200).map((item: any) => ({
        id: item.id,
        code: item.code,
        description: item.description,
        barcode: item.barcode,
        unitOfMeasure: item.measureUnitDescription,
        stock: item.stock,
        inStock: item.inStock,
      })),
      selectedItems: selectedItems.slice(0, 50).map((item) => ({
        id: item.id,
        code: item.code,
        description: item.description,
      })),
    };

    const globalContext = (window as any).__ejlogAiPageData || {};
    globalContext.items = aiItemsPayload;
    (window as any).__ejlogAiPageData = globalContext;
  }, [data, filters, selectedItems]);

  useEffect(() => {
    return () => {
      const globalContext = (window as any).__ejlogAiPageData;
      if (globalContext?.items) {
        delete globalContext.items;
      }
    };
  }, []);

  // Fetch diretto con axios
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        console.log('[ItemsPageEnhanced] Fetching products with axios...');

        const skip = filters.page * filters.pageSize;
        const take = filters.pageSize;

        const response = await axios.get('/api/items', {
          params: { limit: take, offset: skip, sort: filters.orderBy, search: filters.searchQuery },
          headers: { 'Accept': 'application/json' }
        });

        console.log('[ItemsPageEnhanced] Got response:', response.data);

        // Transform response - BACKEND NODE FORMAT
        const items = response.data.data || [];
        const transformedData = {
          data: items.map((item: any, index: number) => ({
            id: item.id || item.code || `item-${index}`, // Backend non fornisce ID, usa code come fallback
            code: item.code,
            description: item.description,
            abcClassDescription: '-',
            itemCategoryDescription: item.categoryId || '-',
            measureUnitDescription: item.unitOfMeasure,
            managementType: 0,
            note: '-',
            averageWeight: item.weight || 0,
            unitWeight: item.weight || 0,
            fifoTimePick: 0,
            fifoTimePut: 0,
            quantitySignificantFigures: 0,
            isDraperyItem: false,
            isHandledByLot: false,
            isHandledBySerialNumber: false,
            isHandledByExpireDate: false,
            imageUrl: item.imageUrl || (item.code ? `/api/item-images/file/${encodeURIComponent(item.code)}` : null),
            barcode: item.barcode || '',
            alternativeBarcodes: [],
            // DATI REALI: Giacenza dal database
            stock: item.stock || 0,
            inStock: item.inStock === 1,
          })),
          page: filters.page,
          pageSize: filters.pageSize,
          total: response.data.pagination?.total || items.length,
          totalPages: Math.ceil((response.data.pagination?.total || items.length) / filters.pageSize),
        };

        setData(transformedData);
      } catch (error) {
        console.error('[ItemsPageEnhanced] Error fetching products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [filters]);

  // Columns definition
  const columns = useMemo<ColumnDef<Item>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Codice',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-ferretto-red" />
            <span className="font-mono font-semibold text-ferretto-red">
              {row.original.code}
            </span>
          </div>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'description',
        header: 'Descrizione',
        cell: ({ row }) => (
          <div className="max-w-md">
            <div className="font-medium text-gray-900">{row.original.description}</div>
            {row.original.note && (
              <div className="text-xs text-gray-500 mt-1 truncate">{row.original.note}</div>
            )}
          </div>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'itemCategoryDescription',
        header: 'Categoria',
        cell: ({ row }) => (
          <span className="text-sm text-gray-600">
            {row.original.itemCategoryDescription || '-'}
          </span>
        ),
      },
      {
        accessorKey: 'measureUnitDescription',
        header: 'UM',
        cell: ({ row }) => (
          <Badge variant="secondary" size="sm">
            {row.original.measureUnitDescription}
          </Badge>
        ),
      },
      {
        accessorKey: 'managementType',
        header: 'Gestione',
        cell: ({ row }) => {
          const typeLabels: Record<ManagementType, { label: string; color: string }> = {
            [0]: { label: 'Standard', color: 'bg-blue-100 text-blue-800' },
            [1]: { label: 'Lotto', color: 'bg-green-100 text-green-800' },
            [2]: { label: 'Matricola', color: 'bg-purple-100 text-purple-800' },
            [3]: { label: 'Lotto+Matr', color: 'bg-orange-100 text-orange-800' },
          };
          const type = typeLabels[row.original.managementType];
          return (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${type.color}`}
            >
              {type.label}
            </span>
          );
        },
      },
      {
        accessorKey: 'minStock',
        header: 'Scorta Min',
        cell: ({ row }) => (
          <span className="text-sm text-gray-600">
            {row.original.minStock !== undefined ? row.original.minStock : '-'}
          </span>
        ),
      },
      {
        accessorKey: 'stock',
        header: 'Giacenza',
        cell: ({ row }) => {
          const stock = (row.original as any).stock || 0;
          return (
            <div className="flex items-center gap-2">
              <span className={`font-semibold ${stock > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                {stock}
              </span>
              {stock > 0 && (
                <Badge variant="success" size="sm">
                  ✓ Disponibile
                </Badge>
              )}
            </div>
          );
        },
        enableSorting: true,
      },
      {
        id: 'indicators',
        header: 'Info',
        cell: ({ row }) => (
          <div className="flex gap-1">
            {row.original.isHandledByLot && (
              <Badge variant="info" size="sm" title="Gestito a lotto">
                L
              </Badge>
            )}
            {row.original.isHandledBySerialNumber && (
              <Badge variant="warning" size="sm" title="Gestito a matricola">
                M
              </Badge>
            )}
            {row.original.isHandledByExpireDate && (
              <Badge variant="danger" size="sm" title="Con scadenza">
                S
              </Badge>
            )}
          </div>
        ),
      },
      {
        id: 'actions',
        header: 'Azioni',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/items/${row.original.id}`);
              }}
              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
              title="Visualizza dettagli"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/items/${row.original.id}/edit`);
              }}
              className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
              title="Modifica"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setItemToDelete(row.original);
                setDeleteModalOpen(true);
              }}
              className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
              title="Elimina"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
        size: 120,
      },
    ],
    [navigate]
  );

  // Handlers
  const handleSearch = (query: string) => {
    setFilters((prev) => ({ ...prev, searchQuery: query, page: 0 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handlePageSizeChange = (pageSize: number) => {
    setFilters((prev) => ({ ...prev, pageSize, page: 0 }));
  };

  const handleExport = (format: 'csv' | 'excel') => {
    const items = data?.data || [];
    if (items.length === 0) {
      toast.warning('Nessun dato da esportare');
      return;
    }

    const columns = [
      { header: 'Codice', accessor: 'code' },
      { header: 'Descrizione', accessor: 'description' },
      { header: 'Categoria', accessor: 'itemCategoryDescription' },
      { header: 'UM', accessor: 'measureUnitDescription' },
      { header: 'Gestione', accessor: 'managementType' },
      { header: 'Barcode', accessor: 'barcode' },
      { header: 'Scorta Min', accessor: 'minStock' },
      { header: 'Giacenza', accessor: 'stock' },
    ];

    exportData(format === 'csv' ? 'CSV' : 'EXCEL', {
      filename: `articoli_${new Date().toISOString().split('T')[0]}`,
      title: 'Articoli',
      columns,
      data: items,
    });

    toast.success(`Export ${format.toUpperCase()} avviato`);
  };

  const handleApplyFilters = (newFilters: Partial<ItemFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 0 }));
  };

  const handleClearFilters = () => {
    setFilters({
      page: 0,
      pageSize: 25,
      orderBy: 'code',
      sortDirection: 'asc',
    });
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    try {
      setIsDeleting(true);
      const id = encodeURIComponent(String(itemToDelete.id));
      await axios.delete(`/api/items/${id}`);
      toast.success(`Articolo ${itemToDelete.code} eliminato`);
      setDeleteModalOpen(false);
      setItemToDelete(null);
      setFilters((prev) => ({ ...prev }));
    } catch (error) {
      console.error('[ItemsPageEnhanced] Delete error:', error);
      toast.error('Errore durante l\u0027eliminazione dell\u0027articolo');
    } finally {
      setIsDeleting(false);
    }
  };

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.searchQuery) count++;
    if (filters.category) count++;
    if (filters.managementType !== undefined) count++;
    if (filters.minStock !== undefined) count++;
    if (filters.maxStock !== undefined) count++;
    if (filters.isActive !== undefined) count++;
    return count;
  }, [filters]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestione Articoli</h1>
          <p className="text-gray-600 mt-1">
            {data?.total || 0} articoli totali
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => setShowGallery(!showGallery)}
            icon={<Package className="w-5 h-5" />}
          >
            {showGallery ? 'Nascondi' : 'Mostra'} Galleria
          </Button>
          <Button
            variant="ghost"
            onClick={() => setShowFilters(!showFilters)}
            icon={<Filter className="w-5 h-5" />}
          >
            Filtri {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate('/items/create')}
            icon={<Plus className="w-5 h-5" />}
          >
            Nuovo Articolo
          </Button>
        </div>
      </div>

      {/* Search Bar - MOVED TO TOP */}
      <Card>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Cerca per codice, descrizione o barcode..."
              value={filters.searchQuery || ''}
              onChange={(e) => handleSearch(e.target.value)}
              icon={<Package className="w-5 h-5" />}
            />
          </div>
          {filters.searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSearch('')}
              icon={<X className="w-4 h-4" />}
            >
              Cancella
            </Button>
          )}
        </div>
      </Card>

      {/* Products Gallery - Collapsible */}
      {showGallery && (
        <Card>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-ferretto-red" />
            Tutti i Prodotti ({data?.total || 0})
          </h3>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 aspect-square rounded-lg mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : data && data.data.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {data.data.map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/items/${item.id}`)}
                  className="group cursor-pointer bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
                >
                  {/* Product Image */}
                  <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.description}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={item.imageUrl ? 'hidden' : 'flex flex-col items-center justify-center p-4'}>
                      <Package className="w-12 h-12 text-gray-300 mb-2" />
                      <span className="text-xs text-gray-400 text-center">Nessuna immagine</span>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-3">
                    <div className="font-mono text-xs font-bold text-ferretto-red mb-1 truncate">
                      {item.code}
                    </div>
                    <div className="text-sm font-medium text-gray-900 truncate mb-2" title={item.description}>
                      {item.description}
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" size="sm">
                        {item.measureUnitDescription}
                      </Badge>
                      {item.managementType !== 0 && (
                        <Badge
                          variant={item.managementType === 1 ? 'success' : item.managementType === 2 ? 'warning' : 'info'}
                          size="sm"
                        >
                          {item.managementType === 1 ? 'L' : item.managementType === 2 ? 'M' : 'L+M'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Nessun prodotto disponibile</p>
            </div>
          )}
        </div>
      </Card>
      )}

      {/* Advanced Filters Panel */}
      {showFilters && (
        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Filtri Avanzati</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Categoria */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria
                </label>
                <Input
                  placeholder="Filtra per categoria"
                  value={filters.category || ''}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, category: e.target.value }))
                  }
                />
              </div>

              {/* Tipo Gestione */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo Gestione
                </label>
                <Select
                  value={filters.managementType?.toString() || ''}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      managementType: e.target.value ? Number(e.target.value) as ManagementType : undefined,
                    }))
                  }
                >
                  <option value="">Tutti</option>
                  <option value="0">Standard</option>
                  <option value="1">Lotto</option>
                  <option value="2">Matricola</option>
                  <option value="3">Lotto + Matricola</option>
                </Select>
              </div>

              {/* Scorta Minima */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scorta Min
                </label>
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.minStock || ''}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      minStock: e.target.value ? Number(e.target.value) : undefined,
                    }))
                  }
                />
              </div>

              {/* Scorta Massima */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scorta Max
                </label>
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.maxStock || ''}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      maxStock: e.target.value ? Number(e.target.value) : undefined,
                    }))
                  }
                />
              </div>

              {/* Stato */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stato
                </label>
                <Select
                  value={
                    filters.isActive === undefined
                      ? ''
                      : filters.isActive
                      ? 'true'
                      : 'false'
                  }
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      isActive:
                        e.target.value === '' ? undefined : e.target.value === 'true',
                    }))
                  }
                >
                  <option value="">Tutti</option>
                  <option value="true">Attivi</option>
                  <option value="false">Non attivi</option>
                </Select>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-2">
              <Button variant="primary" onClick={() => handleApplyFilters(filters)} size="sm">
                Applica Filtri
              </Button>
              <Button variant="ghost" onClick={handleClearFilters} size="sm">
                Reset Filtri
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Selected Items Info */}
      {selectedItems.length > 0 && (
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">{selectedItems.length}</span> articoli
              selezionati
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedItems([])}
              icon={<X className="w-4 h-4" />}
            >
              Deseleziona tutto
            </Button>
          </div>
        </Card>
      )}

      {/* DataTable */}
      <DataTable
        data={data?.data || []}
        columns={columns}
        loading={isLoading || isFetching}
        emptyMessage="Nessun articolo trovato. Prova a modificare i filtri."
        searchable
        searchPlaceholder="Cerca per codice o descrizione..."
        onSearch={handleSearch}
        exportable
        exportFilename={`articoli_${new Date().toISOString().split('T')[0]}`}
        onExport={handleExport}
        selectable
        onSelectionChange={setSelectedItems}
        onRowClick={(item) => navigate(`/items/${item.id}`)}
        pagination={{
          pageIndex: filters.page,
          pageSize: filters.pageSize,
          totalPages: data?.totalPages || 1,
          totalItems: data?.total || 0,
          onPageChange: handlePageChange,
          onPageSizeChange: handlePageSizeChange,
        }}
        striped
        hoverable
        getRowClassName={(row) => {
          const stock = (row as any).stock || 0;
          return stock > 0 ? 'bg-green-50 border-l-4 border-green-500' : '';
        }}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setItemToDelete(null);
        }}
        title="Conferma Eliminazione"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Sei sicuro di voler eliminare l'articolo{' '}
            <span className="font-semibold">{itemToDelete?.code}</span> -{' '}
            {itemToDelete?.description}?
          </p>
          <p className="text-sm text-gray-500">
            Questa azione non può essere annullata.
          </p>
          <div className="flex gap-2 justify-end pt-4">
            <Button
              variant="ghost"
              onClick={() => {
                setDeleteModalOpen(false);
                setItemToDelete(null);
              }}
            >
              Annulla
            </Button>
            <Button variant="danger" onClick={handleDeleteItem} disabled={isDeleting}>
              {isDeleting ? 'Eliminazione...' : 'Elimina'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ItemsPageEnhanced;
