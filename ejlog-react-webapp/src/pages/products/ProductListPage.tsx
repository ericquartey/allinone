// ============================================================================
// EJLOG WMS - Product List Page
// Gestione Prodotti - Refactored with productsService
// TIMESTAMP: 2025-11-28 12:30 - FORCE REBUILD
// ============================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import * as ProductsService from '../../services/productsService';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Table from '../../components/shared/Table';
import Badge from '../../components/shared/Badge';
import Spinner from '../../components/shared/Spinner';
import Alert from '../../components/shared/Alert';
import { Package, Plus, AlertTriangle, TrendingDown, Box, DollarSign } from 'lucide-react';

console.log('[ProductListPage] Component file loaded at:', new Date().toISOString());

const ProductListPage: React.FC = () => {
  console.log('[ProductListPage] Component rendering...');
  const navigate = useNavigate();

  // State
  const [products, setProducts] = useState<ProductsService.Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [stockLevelFilter, setStockLevelFilter] = useState<string>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Load products
  const loadProducts = useCallback(async () => {
    console.log('[ProductListPage] loadProducts called');
    setLoading(true);
    setError(null);
    try {
      console.log('[ProductListPage] Calling getProducts...');
      const result = await ProductsService.getProducts();
      console.log('[ProductListPage] getProducts returned:', result);
      if (result.result === 'OK' && result.data) {
        console.log('[ProductListPage] Setting products:', result.data.length, 'items');
        setProducts(result.data);
      } else {
        console.error('[ProductListPage] Error in result:', result.message);
        setError(result.message || 'Errore nel caricamento dei prodotti');
      }
    } catch (err) {
      console.error('[ProductListPage] Error loading products:', err);
      setError('Errore nel caricamento dei prodotti');
    } finally {
      console.log('[ProductListPage] Setting loading = false');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log('[ProductListPage] useEffect triggered, calling loadProducts');
    loadProducts();
  }, [loadProducts]);

  // Filter products
  const filteredProducts = useMemo(() => {
    const filters: ProductsService.ProductFilters = {
      category: categoryFilter !== 'ALL' ? (categoryFilter as ProductsService.ProductCategory) : undefined,
      status: statusFilter !== 'ALL' ? (statusFilter as ProductsService.ProductStatus) : undefined,
      stockLevel: stockLevelFilter !== 'ALL' ? (stockLevelFilter as ProductsService.StockLevel) : undefined,
      search: searchTerm || undefined,
    };
    return ProductsService.filterProducts(products, filters);
  }, [products, searchTerm, categoryFilter, statusFilter, stockLevelFilter]);

  // Calculate stats
  const stats = useMemo(() => ProductsService.getProductStats(products), [products]);

  // Unique categories for filter dropdown
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(products.map((p) => p.category)));
    return uniqueCategories.sort();
  }, [products]);

  // Table columns
  const columns = [
    {
      header: 'Codice',
      accessor: 'code' as keyof ProductsService.Product,
      render: (product: ProductsService.Product) => (
        <span className="font-mono font-medium">{product.code}</span>
      ),
    },
    {
      header: 'SKU',
      accessor: 'sku' as keyof ProductsService.Product,
      render: (product: ProductsService.Product) => (
        <span className="font-mono text-sm">{product.sku}</span>
      ),
    },
    {
      header: 'Descrizione',
      accessor: 'description' as keyof ProductsService.Product,
      render: (product: ProductsService.Product) => (
        <div>
          <div className="font-medium">{product.description}</div>
          {product.brand && (
            <div className="text-xs text-gray-500">{product.brand}</div>
          )}
        </div>
      ),
    },
    {
      header: 'Categoria',
      accessor: 'category' as keyof ProductsService.Product,
      render: (product: ProductsService.Product) => (
        <Badge variant="default">
          {ProductsService.getCategoryLabel(product.category)}
        </Badge>
      ),
    },
    {
      header: 'Status',
      accessor: 'status' as keyof ProductsService.Product,
      render: (product: ProductsService.Product) => (
        <Badge variant={ProductsService.getProductStatusColor(product.status)}>
          {ProductsService.getProductStatusLabel(product.status)}
        </Badge>
      ),
    },
    {
      header: 'Stock',
      accessor: 'stock' as keyof ProductsService.Product,
      render: (product: ProductsService.Product) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{product.stock.available}</span>
            <Badge variant={ProductsService.getStockLevelColor(product.stock.stockLevel)} size="sm">
              {ProductsService.getStockLevelLabel(product.stock.stockLevel)}
            </Badge>
          </div>
          <div className="text-xs text-gray-500">
            Tot: {product.stock.total} | Ris: {product.stock.reserved}
          </div>
        </div>
      ),
    },
    {
      header: 'UdM',
      accessor: 'unitOfMeasure' as keyof ProductsService.Product,
      render: (product: ProductsService.Product) => (
        <span className="text-sm">{ProductsService.getUnitOfMeasureLabel(product.unitOfMeasure)}</span>
      ),
    },
    {
      header: 'Tracciato',
      accessor: 'batchTracked' as keyof ProductsService.Product,
      render: (product: ProductsService.Product) => (
        <div className="text-xs space-y-1">
          {product.batchTracked && <div className="text-blue-600">Lotto</div>}
          {product.serialTracked && <div className="text-purple-600">Seriale</div>}
          {product.lotTracked && <div className="text-green-600">Partita</div>}
          {!product.batchTracked && !product.serialTracked && !product.lotTracked && (
            <div className="text-gray-400">-</div>
          )}
        </div>
      ),
    },
    {
      header: 'Azioni',
      accessor: 'id' as keyof ProductsService.Product,
      render: (product: ProductsService.Product) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/products/${product.code}`)}
          >
            Dettagli
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestione Prodotti</h1>
          <p className="text-gray-600 mt-1">Anagrafica e gestione articoli di magazzino</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuovo Prodotto
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-6 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600">Totale</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <Box className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-sm text-gray-600">Attivi</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <div>
              <p className="text-sm text-gray-600">Esauriti</p>
              <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <TrendingDown className="w-8 h-8 text-orange-500" />
            <div>
              <p className="text-sm text-gray-600">Stock Basso</p>
              <p className="text-2xl font-bold text-orange-600">{stats.lowStock}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-yellow-500" />
            <div>
              <p className="text-sm text-gray-600">Riordinare</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.needReorder}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-purple-500" />
            <div>
              <p className="text-sm text-gray-600">Valore Tot</p>
              <p className="text-lg font-bold text-purple-600">
                {ProductsService.formatPrice(stats.totalValue)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ricerca
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Codice, SKU, Descrizione..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoria
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">Tutte</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {ProductsService.getCategoryLabel(category as ProductsService.ProductCategory)}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">Tutti</option>
              <option value={ProductsService.ProductStatus.ACTIVE}>Attivi</option>
              <option value={ProductsService.ProductStatus.INACTIVE}>Inattivi</option>
              <option value={ProductsService.ProductStatus.DISCONTINUED}>Dismessi</option>
              <option value={ProductsService.ProductStatus.PENDING}>In Attesa</option>
            </select>
          </div>

          {/* Stock Level Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Livello Stock
            </label>
            <select
              value={stockLevelFilter}
              onChange={(e) => setStockLevelFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">Tutti</option>
              <option value={ProductsService.StockLevel.OUT_OF_STOCK}>Esaurito</option>
              <option value={ProductsService.StockLevel.LOW}>Basso</option>
              <option value={ProductsService.StockLevel.NORMAL}>Normale</option>
              <option value={ProductsService.StockLevel.HIGH}>Alto</option>
              <option value={ProductsService.StockLevel.EXCESS}>Eccesso</option>
            </select>
          </div>
        </div>

        {/* Filter Summary */}
        <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600">
          Visualizzati {filteredProducts.length} di {products.length} prodotti
        </div>
      </Card>

      {/* Products Table */}
      <Card>
        <Table
          data={filteredProducts}
          columns={columns}
          emptyMessage="Nessun prodotto trovato"
        />
      </Card>

      {/* Create Product Modal */}
      {showCreateModal && (
        <CreateProductModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadProducts();
          }}
        />
      )}
    </div>
  );
};

// ============================================================================
// CREATE PRODUCT MODAL COMPONENT
// ============================================================================

interface CreateProductModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateProductModal: React.FC<CreateProductModalProps> = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<ProductsService.CreateProductParams>({
    code: '',
    sku: '',
    description: '',
    category: ProductsService.ProductCategory.FINISHED_GOOD,
    unitOfMeasure: ProductsService.UnitOfMeasure.PIECE,
    width: 100,
    depth: 100,
    height: 100,
    weight: 1,
    minLevel: 10,
    maxLevel: 1000,
    reorderPoint: 50,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Client-side validation
    const validationErrors = ProductsService.validateProductCreation(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const result = await ProductsService.createProduct(formData);
      if (result.result === 'OK' && result.data) {
        alert('Prodotto creato con successo!');
        onSuccess();
      } else {
        alert(result.message || 'Errore durante la creazione');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      alert('Errore durante la creazione del prodotto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <h2 className="text-2xl font-bold">Crea Nuovo Prodotto</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Codice *
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              {errors.code && <p className="text-red-600 text-sm mt-1">{errors.code}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SKU *
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              {errors.sku && <p className="text-red-600 text-sm mt-1">{errors.sku}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrizione *
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description}</p>}
          </div>

          {/* Category and UoM */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as ProductsService.ProductCategory })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Object.values(ProductsService.ProductCategory).map((cat) => (
                  <option key={cat} value={cat}>
                    {ProductsService.getCategoryLabel(cat)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unità di Misura *
              </label>
              <select
                value={formData.unitOfMeasure}
                onChange={(e) => setFormData({ ...formData, unitOfMeasure: e.target.value as ProductsService.UnitOfMeasure })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Object.values(ProductsService.UnitOfMeasure).map((uom) => (
                  <option key={uom} value={uom}>
                    {ProductsService.getUnitOfMeasureLabel(uom)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dimensions */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Larghezza (mm) *
              </label>
              <input
                type="number"
                value={formData.width}
                onChange={(e) => setFormData({ ...formData, width: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                min={1}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profondità (mm) *
              </label>
              <input
                type="number"
                value={formData.depth}
                onChange={(e) => setFormData({ ...formData, depth: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                min={1}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Altezza (mm) *
              </label>
              <input
                type="number"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                min={1}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Peso (kg) *
              </label>
              <input
                type="number"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                min={0.001}
                step={0.001}
              />
            </div>
          </div>

          {/* Stock Levels */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Livello Minimo
              </label>
              <input
                type="number"
                value={formData.minLevel || ''}
                onChange={(e) => setFormData({ ...formData, minLevel: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min={0}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Livello Massimo
              </label>
              <input
                type="number"
                value={formData.maxLevel || ''}
                onChange={(e) => setFormData({ ...formData, maxLevel: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min={0}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Punto Riordino
              </label>
              <input
                type="number"
                value={formData.reorderPoint || ''}
                onChange={(e) => setFormData({ ...formData, reorderPoint: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min={0}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Creazione in corso...
                </>
              ) : (
                'Crea Prodotto'
              )}
            </Button>
            <Button type="button" variant="ghost" onClick={onClose}>
              Annulla
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductListPage;
