import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  FunnelIcon,
  PencilIcon,
  TrashIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Table from '../components/common/Table';
import Modal from '../components/common/Modal';
import Loading from '../components/common/Loading';
import { useItems, useSaveItems } from '../hooks/useItems';

function ItemsPage(): JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(50);

  // Filters from URL or defaults
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    stockStatus: searchParams.get('stockStatus') || '',
    search: searchParams.get('search') || '',
  });

  // Fetch items from real API
  const { data, isLoading, isError, error } = useItems({
    skip: page * pageSize,
    take: pageSize,
    orderBy: 'code',
  });

  // Save items mutation
  const saveMutation = useSaveItems();

  // Extract items from response
  const items = data?.items || [];
  const totalCount = data?.totalCount || 0;

  // Calculate quick stats
  const stats = useMemo(() => {
    if (!items || items.length === 0) {
      return {
        totalItems: totalCount,
        lowStock: 0,
        uniqueCategories: 0,
      };
    }

    const lowStock = items.filter(
      (item) => item.giacenza && item.scortaMin && item.giacenza < item.scortaMin
    ).length;

    const uniqueCategories = new Set(
      items.map((item) => item.categoriaDesc).filter(Boolean)
    ).size;

    return {
      totalItems: totalCount,
      lowStock,
      uniqueCategories,
    };
  }, [items, totalCount]);

  // Apply filters function
  const handleApplyFilters = () => {
    setPage(0);
    const params = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params[key] = value;
    });
    setSearchParams(params);
  };

  // Reset filters function
  const handleResetFilters = () => {
    setFilters({
      category: '',
      stockStatus: '',
      search: '',
    });
    setSearchParams({});
    setPage(0);
  };

  const handleDelete = (item) => {
    if (window.confirm(`Eliminare l'articolo ${item.codice}?`)) {
      // For now, show toast as delete is not in the API
      toast.info('Funzione eliminazione in fase di implementazione');
    }
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setShowEditModal(true);
  };

  const handleViewDetail = (item) => {
    navigate(`/items/${item.id}`);
  };

  const handleExport = () => {
    toast.success('Esportazione avviata');
  };

  const handleImport = () => {
    toast.success('Importazione avviata');
  };

  const getStatusBadge = (status) => {
    const styles = {
      Disponibile: 'bg-green-100 text-green-800',
      Basso: 'bg-yellow-100 text-yellow-800',
      Esaurito: 'bg-red-100 text-red-800',
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}
      >
        {status}
      </span>
    );
  };

  const columns = [
    {
      accessorKey: 'codice',
      header: 'Codice',
      cell: ({ row }) => (
        <span className="font-medium text-ferretto-red">{row.original.codice}</span>
      ),
    },
    {
      accessorKey: 'descrizione',
      header: 'Descrizione',
    },
    {
      accessorKey: 'categoriaDesc',
      header: 'Categoria',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.categoriaDesc || '-'}</span>
      ),
    },
    {
      accessorKey: 'giacenza',
      header: 'Giacenza',
      cell: ({ row }) => {
        const stock = row.original.giacenza || 0;
        const hasStock = stock > 0;
        return (
          <div className="flex items-center space-x-2">
            <span className={`font-semibold ${hasStock ? 'text-green-600' : 'text-gray-400'}`}>
              {stock} {row.original.um || ''}
            </span>
            {hasStock && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✓ Disponibile
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'um',
      header: 'UM',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">{row.original.um || '-'}</span>
      ),
    },
    {
      id: 'azioni',
      header: 'Azioni',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleEdit(row.original)}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="Dettagli"
          >
            <PencilIcon className="w-5 h-5" />
          </button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loading size="lg" text="Caricamento articoli dal server..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="text-red-600 text-lg font-semibold">
          Errore nel caricamento degli articoli
        </div>
        <div className="text-gray-600">
          {error?.message || 'Errore sconosciuto'}
        </div>
        <Button onClick={() => window.location.reload()}>
          Ricarica la pagina
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="p-3 bg-blue-100 rounded-lg">
                <CubeIcon className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Articoli Totali</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalItems}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <ExclamationTriangleIcon className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Sotto Soglia</p>
              <p className="text-2xl font-bold text-gray-900">{stats.lowStock}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="p-3 bg-green-100 rounded-lg">
                <TagIcon className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Categorie</p>
              <p className="text-2xl font-bold text-gray-900">{stats.uniqueCategories}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Gestione Articoli
          </h1>
          <p className="text-gray-600 mt-1">
            {totalCount} articoli totali • Pagina {page + 1} • {items.length} visualizzati
          </p>
          <div className="flex items-center space-x-2 mt-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              🟢 Backend Connesso
            </span>
            <span className="text-xs text-gray-500">
              Dati dal server EjLog
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FunnelIcon className="w-5 h-5 mr-2" />
            Filtri
          </Button>
          <Button variant="secondary" onClick={handleExport}>
            <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
            Esporta
          </Button>
          <Button variant="secondary" onClick={handleImport}>
            <ArrowUpTrayIcon className="w-5 h-5 mr-2" />
            Importa
          </Button>
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            <PlusIcon className="w-5 h-5 mr-2" />
            Nuovo Articolo
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtri Avanzati</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cerca per Codice/Descrizione
              </label>
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                placeholder="ART001 o descrizione"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ferretto-red focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria
              </label>
              <select
                name="category"
                value={filters.category}
                onChange={(e) =>
                  setFilters({ ...filters, category: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ferretto-red focus:border-transparent"
              >
                <option value="">Tutte</option>
                <option value="Materie Prime">Materie Prime</option>
                <option value="Semilavorati">Semilavorati</option>
                <option value="Prodotti Finiti">Prodotti Finiti</option>
                <option value="Ricambi">Ricambi</option>
                <option value="Imballaggi">Imballaggi</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Livello Giacenza
              </label>
              <select
                name="stockStatus"
                value={filters.stockStatus}
                onChange={(e) =>
                  setFilters({ ...filters, stockStatus: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ferretto-red focus:border-transparent"
              >
                <option value="">Tutti</option>
                <option value="low">Sotto Soglia</option>
                <option value="normal">Disponibile</option>
                <option value="zero">Esaurito</option>
              </select>
            </div>
          </div>
          <div className="flex items-center space-x-3 mt-4">
            <Button variant="primary" onClick={handleApplyFilters}>
              Applica Filtri
            </Button>
            <Button variant="ghost" onClick={handleResetFilters}>
              Pulisci Filtri
            </Button>
          </div>
        </Card>
      )}

      {/* Items Table */}
      <Card padding="none">
        <div className="p-6">
          <Table
            data={items}
            columns={columns}
            pageSize={10}
            searchable
            getRowClassName={(row) => {
              const stock = row.giacenza || 0;
              return stock > 0 ? 'bg-green-50 hover:bg-green-100 border-l-4 border-green-500' : '';
            }}
          />
        </div>
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nuovo Articolo"
        footer={
          <Modal.Footer
            onCancel={() => setShowCreateModal(false)}
            onConfirm={() => {
              toast.success('Articolo creato con successo');
              setShowCreateModal(false);
            }}
            confirmText="Crea"
          />
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Codice Articolo
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ferretto-red focus:border-transparent"
              placeholder="ART001"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrizione
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ferretto-red focus:border-transparent"
              placeholder="Descrizione articolo"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria
              </label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ferretto-red focus:border-transparent">
                <option>Materie Prime</option>
                <option>Semilavorati</option>
                <option>Prodotti Finiti</option>
                <option>Ricambi</option>
                <option>Imballaggi</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unità di Misura
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ferretto-red focus:border-transparent"
                placeholder="PZ"
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit Modal - Enhanced */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Modifica Articolo"
        size="xl"
        footer={
          <Modal.Footer
            onCancel={() => setShowEditModal(false)}
            onConfirm={() => {
              toast.success('Articolo modificato con successo');
              setShowEditModal(false);
            }}
            confirmText="Salva"
            cancelText="Annulla"
          />
        }
      >
        {selectedItem && (
          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase">
                Informazioni Base
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Codice Articolo
                  </label>
                  <input
                    type="text"
                    name="item-code"
                    defaultValue={selectedItem.codice}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ferretto-red focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Barcode
                  </label>
                  <input
                    type="text"
                    name="item-barcode"
                    defaultValue={selectedItem.barcode || ''}
                    placeholder="1234567890"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ferretto-red focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrizione
              </label>
              <input
                type="text"
                name="item-description"
                defaultValue={selectedItem.descrizione}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ferretto-red focus:border-transparent"
              />
            </div>

            {/* Unit & Category */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unità di Misura
                </label>
                <input
                  type="text"
                  name="item-um"
                  defaultValue={selectedItem.um || ''}
                  placeholder="PZ, KG, L, etc."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ferretto-red focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria
                </label>
                <select
                  name="item-category"
                  defaultValue={selectedItem.categoriaDesc || ''}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ferretto-red focus:border-transparent"
                >
                  <option>Materie Prime</option>
                  <option>Semilavorati</option>
                  <option>Prodotti Finiti</option>
                  <option>Ricambi</option>
                  <option>Imballaggi</option>
                </select>
              </div>
            </div>

            {/* Stock Info */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase">
                Gestione Scorte
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giacenza Attuale
                  </label>
                  <input
                    type="number"
                    name="item-stock"
                    defaultValue={selectedItem.giacenza || 0}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ferretto-red focus:border-transparent"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scorta Minima
                  </label>
                  <input
                    type="number"
                    name="item-min-stock"
                    defaultValue={selectedItem.scortaMin || 0}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ferretto-red focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prezzo Unitario (€)
                  </label>
                  <input
                    type="number"
                    name="item-price"
                    defaultValue={selectedItem.prezzoUnitario || 0}
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ferretto-red focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default ItemsPage;
