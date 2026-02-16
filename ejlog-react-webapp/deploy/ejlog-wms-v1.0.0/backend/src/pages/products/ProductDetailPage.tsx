// ============================================================================
// EJLOG WMS - Product Detail Page
// Dual-mode: UDC Product Instance (if udcId present) OR Master Catalog
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import * as ProductsService from '../../services/productsService';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Badge from '../../components/shared/Badge';
import Spinner from '../../components/shared/Spinner';
import Alert from '../../components/shared/Alert';
import {
  Package,
  ArrowLeft,
  Edit,
  Save,
  X,
  Trash2,
  Box,
  TrendingUp,
  AlertTriangle,
  Barcode,
  Tag,
  Layers,
  Info,
  Plus,
  Minus,
  Archive,
  MapPin,
} from 'lucide-react';

// Import UDC Product Instance View
import UDCProductInstanceView from './UDCProductInstanceView';

const ProductDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { code, id } = useParams<{ code?: string; id?: string }>();
  const [searchParams] = useSearchParams();
  const udcId = searchParams.get('udcId');

  // If udcId is present, show UDC product instance view
  if (udcId && id) {
    return <UDCProductInstanceView productId={parseInt(id)} udcId={parseInt(udcId)} />;
  }

  // State
  const [product, setProduct] = useState<ProductsService.Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Edit form state
  const [editForm, setEditForm] = useState<ProductsService.UpdateProductParams>({});

  // Load product
  const loadProduct = useCallback(async () => {
    if (!code) return;
    setLoading(true);
    setError(null);
    try {
      const result = await ProductsService.getProductByCode(code);
      if (result.result === 'OK' && result.data) {
        setProduct(result.data);
        setEditForm({
          description: result.data.description,
          category: result.data.category,
          status: result.data.status,
          unitOfMeasure: result.data.unitOfMeasure,
          width: result.data.dimensions.width,
          depth: result.data.dimensions.depth,
          height: result.data.dimensions.height,
          weight: result.data.dimensions.weight,
          minLevel: result.data.stock.minLevel,
          maxLevel: result.data.stock.maxLevel,
          reorderPoint: result.data.stock.reorderPoint,
          cost: result.data.pricing?.cost,
          price: result.data.pricing?.price,
          manufacturer: result.data.manufacturer,
          brand: result.data.brand,
          model: result.data.model,
        });
      } else {
        setError(result.message || 'Prodotto non trovato');
      }
    } catch (err) {
      console.error('Error loading product:', err);
      setError('Errore nel caricamento del prodotto');
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  // Save edit
  const handleSaveEdit = async () => {
    if (!code || !product) return;
    setFormErrors({});

    const validationErrors = ProductsService.validateProductUpdate(editForm);
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    setSaving(true);
    try {
      const result = await ProductsService.updateProduct(code, editForm);
      if (result.result === 'OK') {
        alert('Prodotto aggiornato con successo!');
        setEditMode(false);
        await loadProduct();
      } else {
        alert(result.message || 'Errore nell\'aggiornamento');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Errore nell\'aggiornamento del prodotto');
    } finally {
      setSaving(false);
    }
  };

  // Change status
  const handleChangeStatus = async (newStatus: ProductsService.ProductStatus) => {
    if (!code) return;
    if (!confirm(`Vuoi davvero cambiare lo status a "${ProductsService.getProductStatusLabel(newStatus)}"?`)) {
      return;
    }

    try {
      const result = await ProductsService.updateProductStatus(code, newStatus);
      if (result.result === 'OK') {
        alert('Status aggiornato con successo!');
        await loadProduct();
      } else {
        alert(result.message || 'Errore nel cambiamento status');
      }
    } catch (error) {
      console.error('Error changing status:', error);
      alert('Errore nel cambiamento status');
    }
  };

  // Delete product
  const handleDelete = async () => {
    if (!code) return;
    if (!confirm('Sei sicuro di voler eliminare questo prodotto? Questa azione è irreversibile.')) {
      return;
    }

    try {
      const result = await ProductsService.deleteProduct(code);
      if (result.result === 'OK') {
        alert('Prodotto eliminato con successo!');
        navigate('/products');
      } else {
        alert(result.message || 'Errore nell\'eliminazione');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Errore nell\'eliminazione del prodotto');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="p-6">
        <Alert variant="error">
          {error || 'Prodotto non trovato'}
        </Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={() => navigate('/products')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Torna alla Lista
          </Button>
        </div>
      </div>
    );
  }

  const stockPercentage = ProductsService.getStockPercentage(product);
  const volume = ProductsService.calculateVolume(product);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/products')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{product.code}</h1>
              <Badge variant={ProductsService.getProductStatusColor(product.status)}>
                {ProductsService.getProductStatusLabel(product.status)}
              </Badge>
              <Badge variant={ProductsService.getStockLevelColor(product.stock.stockLevel)}>
                {ProductsService.getStockLevelLabel(product.stock.stockLevel)}
              </Badge>
            </div>
            <p className="text-gray-600 mt-1">{product.description}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {!editMode ? (
            <>
              <Button variant="outline" onClick={() => setEditMode(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Modifica
              </Button>
              <Button variant="outline" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                Elimina
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleSaveEdit} disabled={saving}>
                {saving ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Salvataggio...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salva
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setEditMode(false);
                  setFormErrors({});
                }}
              >
                <X className="w-4 h-4 mr-2" />
                Annulla
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-6 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600">Disponibile</p>
              <p className="text-2xl font-bold text-blue-600">{product.stock.available}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <Box className="w-8 h-8 text-purple-500" />
            <div>
              <p className="text-sm text-gray-600">Totale</p>
              <p className="text-2xl font-bold">{product.stock.total}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <Layers className="w-8 h-8 text-orange-500" />
            <div>
              <p className="text-sm text-gray-600">Riservato</p>
              <p className="text-2xl font-bold text-orange-600">{product.stock.reserved}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-yellow-500" />
            <div>
              <p className="text-sm text-gray-600">In Transito</p>
              <p className="text-2xl font-bold text-yellow-600">{product.stock.inTransit}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <div>
              <p className="text-sm text-gray-600">Riordino</p>
              <p className="text-xl font-bold text-red-600">{product.stock.reorderPoint}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <Info className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-sm text-gray-600">Min / Max</p>
              <p className="text-sm font-bold">
                {product.stock.minLevel} / {product.stock.maxLevel}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content - 2 Columns */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Informazioni Base
            </h2>

            {!editMode ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Codice</p>
                    <p className="font-medium font-mono">{product.code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">SKU</p>
                    <p className="font-medium font-mono">{product.sku}</p>
                  </div>
                </div>

                {product.barcode && (
                  <div>
                    <p className="text-sm text-gray-600">Barcode</p>
                    <p className="font-medium font-mono flex items-center gap-2">
                      <Barcode className="w-4 h-4" />
                      {product.barcode}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-600">Descrizione</p>
                  <p className="font-medium">{product.description}</p>
                </div>

                {product.longDescription && (
                  <div>
                    <p className="text-sm text-gray-600">Descrizione Estesa</p>
                    <p className="text-sm">{product.longDescription}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Categoria</p>
                    <Badge variant="default">
                      {ProductsService.getCategoryLabel(product.category)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Unità di Misura</p>
                    <Badge variant="default">
                      {ProductsService.getUnitOfMeasureLabel(product.unitOfMeasure)}
                    </Badge>
                  </div>
                </div>

                {(product.manufacturer || product.brand || product.model) && (
                  <div className="grid grid-cols-3 gap-4 pt-3 border-t">
                    {product.manufacturer && (
                      <div>
                        <p className="text-sm text-gray-600">Produttore</p>
                        <p className="font-medium">{product.manufacturer}</p>
                      </div>
                    )}
                    {product.brand && (
                      <div>
                        <p className="text-sm text-gray-600">Brand</p>
                        <p className="font-medium">{product.brand}</p>
                      </div>
                    )}
                    {product.model && (
                      <div>
                        <p className="text-sm text-gray-600">Modello</p>
                        <p className="font-medium">{product.model}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrizione *
                  </label>
                  <input
                    type="text"
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  {formErrors.description && (
                    <p className="text-red-600 text-sm mt-1">{formErrors.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categoria
                    </label>
                    <select
                      value={editForm.category || ''}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value as ProductsService.ProductCategory })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                      Unità di Misura
                    </label>
                    <select
                      value={editForm.unitOfMeasure || ''}
                      onChange={(e) => setEditForm({ ...editForm, unitOfMeasure: e.target.value as ProductsService.UnitOfMeasure })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {Object.values(ProductsService.UnitOfMeasure).map((uom) => (
                        <option key={uom} value={uom}>
                          {ProductsService.getUnitOfMeasureLabel(uom)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Produttore
                    </label>
                    <input
                      type="text"
                      value={editForm.manufacturer || ''}
                      onChange={(e) => setEditForm({ ...editForm, manufacturer: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Brand
                    </label>
                    <input
                      type="text"
                      value={editForm.brand || ''}
                      onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Modello
                    </label>
                    <input
                      type="text"
                      value={editForm.model || ''}
                      onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Dimensions */}
          <Card>
            <h2 className="text-xl font-bold mb-4">Dimensioni e Peso</h2>

            {!editMode ? (
              <div className="space-y-3">
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Larghezza</p>
                    <p className="font-medium">{product.dimensions.width} mm</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Profondità</p>
                    <p className="font-medium">{product.dimensions.depth} mm</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Altezza</p>
                    <p className="font-medium">{product.dimensions.height} mm</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Peso</p>
                    <p className="font-medium">{product.dimensions.weight} kg</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Volume</p>
                  <p className="font-medium">{ProductsService.formatVolume(volume)}</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Larghezza (mm)
                  </label>
                  <input
                    type="number"
                    value={editForm.width || ''}
                    onChange={(e) => setEditForm({ ...editForm, width: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min={1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profondità (mm)
                  </label>
                  <input
                    type="number"
                    value={editForm.depth || ''}
                    onChange={(e) => setEditForm({ ...editForm, depth: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min={1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Altezza (mm)
                  </label>
                  <input
                    type="number"
                    value={editForm.height || ''}
                    onChange={(e) => setEditForm({ ...editForm, height: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min={1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Peso (kg)
                  </label>
                  <input
                    type="number"
                    value={editForm.weight || ''}
                    onChange={(e) => setEditForm({ ...editForm, weight: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min={0.001}
                    step={0.001}
                  />
                </div>
              </div>
            )}
          </Card>

          {/* Pricing */}
          {(product.pricing || editMode) && (
            <Card>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Prezzi
              </h2>

              {!editMode ? (
                <div className="grid grid-cols-2 gap-4">
                  {product.pricing?.cost !== undefined && (
                    <div>
                      <p className="text-sm text-gray-600">Costo</p>
                      <p className="text-xl font-bold text-orange-600">
                        {ProductsService.formatPrice(product.pricing.cost)}
                      </p>
                    </div>
                  )}
                  {product.pricing?.price !== undefined && (
                    <div>
                      <p className="text-sm text-gray-600">Prezzo</p>
                      <p className="text-xl font-bold text-green-600">
                        {ProductsService.formatPrice(product.pricing.price)}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Costo (€)
                    </label>
                    <input
                      type="number"
                      value={editForm.cost || ''}
                      onChange={(e) => setEditForm({ ...editForm, cost: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min={0}
                      step={0.01}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prezzo (€)
                    </label>
                    <input
                      type="number"
                      value={editForm.price || ''}
                      onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min={0}
                      step={0.01}
                    />
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Stock Management */}
          <Card>
            <h2 className="text-xl font-bold mb-4">Gestione Stock</h2>

            <div className="space-y-4">
              {/* Stock Level Progress */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Livello Stock</span>
                  <span className="text-sm text-gray-600">
                    {product.stock.total} / {product.stock.maxLevel}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full ${
                      stockPercentage > 80
                        ? 'bg-green-500'
                        : stockPercentage > 50
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Occupazione: {Math.round(stockPercentage)}%
                </p>
              </div>

              {/* Stock Levels */}
              {!editMode ? (
                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-gray-600">Minimo</p>
                    <p className="text-xl font-bold text-red-600">{product.stock.minLevel}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Riordino</p>
                    <p className="text-xl font-bold text-yellow-600">{product.stock.reorderPoint}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Massimo</p>
                    <p className="text-xl font-bold text-green-600">{product.stock.maxLevel}</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimo
                    </label>
                    <input
                      type="number"
                      value={editForm.minLevel || ''}
                      onChange={(e) => setEditForm({ ...editForm, minLevel: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Riordino
                    </label>
                    <input
                      type="number"
                      value={editForm.reorderPoint || ''}
                      onChange={(e) => setEditForm({ ...editForm, reorderPoint: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Massimo
                    </label>
                    <input
                      type="number"
                      value={editForm.maxLevel || ''}
                      onChange={(e) => setEditForm({ ...editForm, maxLevel: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min={0}
                    />
                  </div>
                </div>
              )}

              {/* Should Reorder Alert */}
              {ProductsService.shouldReorder(product) && (
                <Alert variant="warning">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Il prodotto ha raggiunto il punto di riordino!
                </Alert>
              )}
            </div>
          </Card>

          {/* Product Attributes */}
          <Card>
            <h2 className="text-xl font-bold mb-4">Attributi Prodotto</h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${product.batchTracked ? 'bg-blue-500' : 'bg-gray-300'}`} />
                <span className="text-sm">Tracciato a Lotto</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${product.serialTracked ? 'bg-purple-500' : 'bg-gray-300'}`} />
                <span className="text-sm">Tracciato a Seriale</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${product.lotTracked ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className="text-sm">Tracciato a Partita</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${product.perishable ? 'bg-yellow-500' : 'bg-gray-300'}`} />
                <span className="text-sm">Deperibile</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${product.hazardous ? 'bg-red-500' : 'bg-gray-300'}`} />
                <span className="text-sm">Pericoloso</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${product.fragile ? 'bg-orange-500' : 'bg-gray-300'}`} />
                <span className="text-sm">Fragile</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${product.stackable ? 'bg-teal-500' : 'bg-gray-300'}`} />
                <span className="text-sm">Impilabile</span>
              </div>
              {product.expiryDays !== undefined && product.expiryDays > 0 && (
                <div>
                  <p className="text-sm text-gray-600">Giorni Scadenza</p>
                  <p className="font-medium">{product.expiryDays} giorni</p>
                </div>
              )}
            </div>
          </Card>

          {/* Status Management */}
          <Card>
            <h2 className="text-xl font-bold mb-4">Gestione Status</h2>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 mb-2">Status Corrente</p>
                <Badge variant={ProductsService.getProductStatusColor(product.status)} size="lg">
                  {ProductsService.getProductStatusLabel(product.status)}
                </Badge>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Cambia Status</p>
                <div className="flex flex-wrap gap-2">
                  {Object.values(ProductsService.ProductStatus).map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant={product.status === status ? 'default' : 'outline'}
                      onClick={() => handleChangeStatus(status)}
                      disabled={product.status === status}
                    >
                      {ProductsService.getProductStatusLabel(status)}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Notes */}
          {product.notes && (
            <Card>
              <h2 className="text-xl font-bold mb-4">Note</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{product.notes}</p>
            </Card>
          )}

          {/* Timestamps */}
          <Card>
            <h2 className="text-xl font-bold mb-4">Informazioni Sistema</h2>
            <div className="space-y-2 text-sm">
              {product.createdAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Creato il:</span>
                  <span className="font-medium">
                    {new Date(product.createdAt).toLocaleString('it-IT')}
                  </span>
                </div>
              )}
              {product.updatedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Aggiornato il:</span>
                  <span className="font-medium">
                    {new Date(product.updatedAt).toLocaleString('it-IT')}
                  </span>
                </div>
              )}
              {product.createdBy && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Creato da:</span>
                  <span className="font-medium">{product.createdBy}</span>
                </div>
              )}
              {product.updatedBy && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Aggiornato da:</span>
                  <span className="font-medium">{product.updatedBy}</span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
